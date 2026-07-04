require('dotenv').config();
const fs = require('fs');
const csv = require('csv-parser');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const BATCH_SIZE = 2000;

let updateStatus = {
  running: false,
  processed: 0,
  errors: 0,
  startedAt: null,
  finishedAt: null,
  message: 'idle',
  type: null,
};

let cancelRequested = false;
let currentStream = null;

function getUpdateStatus() { return updateStatus; }

function cancelUpdate() {
  if (!updateStatus.running) return false;
  cancelRequested = true;
  updateStatus.running = false;
  updateStatus.finishedAt = new Date();
  updateStatus.message = 'cancelled';
  if (currentStream) { currentStream.destroy(); currentStream = null; }
  return true;
}

function cleanRow(row) {
  const cleaned = {};
  for (const [key, value] of Object.entries(row)) {
    cleaned[key.replace(/"/g, '').trim()] = value;
  }
  return cleaned;
}

async function loadStareNomenclator(nomenclatorPath) {
  return new Promise((resolve, reject) => {
    const map = new Map();
    fs.createReadStream(nomenclatorPath, { encoding: 'utf8' })
      .pipe(csv({ separator: '^', bom: true, strict: false, quote: '|' }))
      .on('data', (row) => {
        const r = cleanRow(row);
        const cod = String(r['COD'] || '').trim();
        const denumire = String(r['DENUMIRE'] || '').trim();
        if (cod && denumire) map.set(cod, denumire.toUpperCase());
      })
      .on('end', () => { console.log(`Nomenclator loaded: ${map.size}`); resolve(map); })
      .on('error', reject);
  });
}

// Grupăm după stare — un UPDATE per valoare de stare
// cu lista de cod_inmatriculare în ANY().
// Rulăm secvențial pentru a nu suprasolicita connection pool-ul.
async function flushStareBatch(batch) {
  const byStare = new Map();
  for (const { cod_inmatriculare, stare } of batch) {
    if (!byStare.has(stare)) byStare.set(stare, []);
    byStare.get(stare).push(cod_inmatriculare);
  }

  for (const [stare, coduri] of byStare.entries()) {
    await prisma.$executeRawUnsafe(
      `UPDATE "Company" SET stare = $1, "updatedAt" = NOW() WHERE cod_inmatriculare = ANY($2::text[])`,
      stare,
      coduri
    );
  }
}

async function importStare(filePath, nomenclatorPath) {
  if (updateStatus.running) throw new Error('Update already in progress');

  cancelRequested = false;
  updateStatus = {
    running: true, processed: 0, errors: 0,
    startedAt: new Date(), finishedAt: null,
    message: 'running', type: 'stare',
  };

  const stareMap = await loadStareNomenclator(nomenclatorPath);

  let batch = [];
  let flushQueue = Promise.resolve();

  const stream = fs.createReadStream(filePath, { encoding: 'utf8' })
    .pipe(csv({ separator: '^', bom: true, strict: false, quote: '|' }));

  currentStream = stream;

  stream.on('data', (row) => {
    if (cancelRequested) return;
    const r = cleanRow(row);
    const cod_inmatriculare = String(r['COD_INMATRICULARE'] || '').trim();
    const cod = String(r['COD'] || '').trim();
    const stare = stareMap.get(cod) || `COD_${cod}`;

    if (!cod_inmatriculare) return;
    batch.push({ cod_inmatriculare, stare });

    if (batch.length >= BATCH_SIZE) {
      const currentBatch = [...batch];
      batch = [];

      flushQueue = flushQueue.then(async () => {
        if (cancelRequested) return;
        try {
          await flushStareBatch(currentBatch);
          updateStatus.processed += currentBatch.length;
          console.log(`Stare updated: ${updateStatus.processed}`);
        } catch (err) {
          updateStatus.errors += currentBatch.length;
          console.error('Batch error:', err.message);
        }
      });
    }
  });

  stream.on('end', () => {
    flushQueue = flushQueue.then(async () => {
      if (cancelRequested) return;
      if (batch.length > 0) {
        try {
          await flushStareBatch(batch);
          updateStatus.processed += batch.length;
        } catch (err) {
          updateStatus.errors += batch.length;
        }
      }
      currentStream = null;
      updateStatus.running = false;
      updateStatus.finishedAt = new Date();
      updateStatus.message = 'done';
      console.log(`Stare done. Total: ${updateStatus.processed}`);
    });
  });

  stream.on('error', () => { currentStream = null; });
}

module.exports = { importStare, getUpdateStatus, cancelUpdate };