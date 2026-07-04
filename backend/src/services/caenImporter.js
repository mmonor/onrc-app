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

function getCaenStatus() { return updateStatus; }

function cancelCaen() {
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

async function loadCaenNomenclator(nomenclatorPath) {
  return new Promise((resolve, reject) => {
    const map = new Map();
    fs.createReadStream(nomenclatorPath, { encoding: 'utf8' })
      .pipe(csv({ separator: '^', bom: true, strict: false, quote: '|' }))
      .on('data', (row) => {
        const r = cleanRow(row);
        const cod = String(r['CLASA'] || '').trim();
        const denumire = String(r['DENUMIRE'] || '').trim();
        if (cod && denumire) map.set(cod, denumire);
      })
      .on('end', () => { console.log(`CAEN nomenclator: ${map.size}`); resolve(map); })
      .on('error', reject);
  });
}

// Grupăm rândurile după cod_caen — un singur UPDATE per cod
// în loc de un UPDATE per rând. Ex: toate firmele cu cod 6201
// într-un singur query cu ANY($3::text[]).
// Asta reduce numărul de query-uri de la 2000 la câteva zeci per batch.
async function flushCaenBatch(batch, caenMap) {
  const byCaen = new Map();
  for (const { cod_inmatriculare, cod_caen } of batch) {
    if (!byCaen.has(cod_caen)) byCaen.set(cod_caen, []);
    byCaen.get(cod_caen).push(cod_inmatriculare);
  }

  // Rulăm secvențial, nu în paralel — evităm să bombardăm DB-ul.
  for (const [cod_caen, coduri] of byCaen.entries()) {
    const caen_denumire = caenMap.get(cod_caen) || null;
    await prisma.$executeRawUnsafe(
      `UPDATE "Company" SET cod_caen = $1, caen_denumire = $2, "updatedAt" = NOW() WHERE cod_inmatriculare = ANY($3::text[])`,
      cod_caen,
      caen_denumire,
      coduri
    );
  }
}

async function importCaen(caenFilePath, nomenclatorPath) {
  if (updateStatus.running) throw new Error('Update already in progress');

  cancelRequested = false;
  updateStatus = {
    running: true, processed: 0, errors: 0,
    startedAt: new Date(), finishedAt: null,
    message: 'running', type: 'caen',
  };

  const caenMap = await loadCaenNomenclator(nomenclatorPath);

  let batch = [];
  let flushQueue = Promise.resolve();

  const stream = fs.createReadStream(caenFilePath, { encoding: 'utf8' })
    .pipe(csv({ separator: '^', bom: true, strict: false, quote: '|' }));

  currentStream = stream;

  stream.on('data', (row) => {
    if (cancelRequested) return;
    const r = cleanRow(row);
    const cod_inmatriculare = String(r['COD_INMATRICULARE'] || '').trim();
    const cod_caen = String(r['COD_CAEN_AUTORIZAT'] || '').trim();

    if (!cod_inmatriculare || !cod_caen) return;
    batch.push({ cod_inmatriculare, cod_caen });

    if (batch.length >= BATCH_SIZE) {
      const currentBatch = [...batch];
      batch = [];

      flushQueue = flushQueue.then(async () => {
        if (cancelRequested) return;
        try {
          await flushCaenBatch(currentBatch, caenMap);
          updateStatus.processed += currentBatch.length;
          console.log(`CAEN updated: ${updateStatus.processed}`);
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
          await flushCaenBatch(batch, caenMap);
          updateStatus.processed += batch.length;
        } catch (err) {
          updateStatus.errors += batch.length;
        }
      }
      currentStream = null;
      updateStatus.running = false;
      updateStatus.finishedAt = new Date();
      updateStatus.message = 'done';
      console.log(`CAEN done. Total: ${updateStatus.processed}`);
    });
  });

  stream.on('error', () => { currentStream = null; });
}

module.exports = { importCaen, getCaenStatus, cancelCaen };