require('dotenv').config();
const fs = require('fs');
const csv = require('csv-parser');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const BATCH_SIZE = 1000;

let importStatus = {
  running: false,
  processed: 0,
  errors: 0,
  startedAt: null,
  finishedAt: null,
  message: 'idle',
};

function getStatus() {
  return importStatus;
}

// Cheile din CSV vin cu ghilimele: '"DENUMIRE"' în loc de 'DENUMIRE'.
// Această funcție curăță toate cheile unui rând eliminând ghilimelele.
function cleanRow(row) {
  const cleaned = {};
  for (const [key, value] of Object.entries(row)) {
    const cleanKey = key.replace(/"/g, '').trim();
    cleaned[cleanKey] = value;
  }
  return cleaned;
}

function sanitize(row) {
  const r = cleanRow(row);

  const strada = [
    r['ADR_DEN_STRADA'],
    r['ADR_NR_STRADA'],
    r['ADR_BLOC'] ? `Bl. ${r['ADR_BLOC']}` : '',
    r['ADR_SCARA'] ? `Sc. ${r['ADR_SCARA']}` : '',
    r['ADR_ETAJ'] ? `Et. ${r['ADR_ETAJ']}` : '',
    r['ADR_APARTAMENT'] ? `Ap. ${r['ADR_APARTAMENT']}` : '',
  ].filter(Boolean).join(', ');

  return {
    cui:               String(r['CUI'] || '').trim(),
    denumire:          String(r['DENUMIRE'] || '').trim(),
    cod_inmatriculare: String(r['COD_INMATRICULARE'] || '').trim() || null,
    stare:             null,
    judet:             String(r['ADR_JUDET'] || '').trim() || null,
    localitate:        String(r['ADR_LOCALITATE'] || '').trim() || null,
    adresa:            strada || null,
    cod_postal:        String(r['ADR_COD_POSTAL'] || '').trim() || null,
    telefon:           null,
    fax:               null,
    email:             null,
    web:               String(r['WEB'] || '').trim() || null,
    cod_caen:          null,
    caen_denumire:     null,
  };
}

async function importCSV(filePath) {
  if (importStatus.running) {
    throw new Error('Import already in progress');
  }

  importStatus = {
    running: true,
    processed: 0,
    errors: 0,
    startedAt: new Date(),
    finishedAt: null,
    message: 'running',
  };

  let flushQueue = Promise.resolve();
  let batch = [];

  const stream = fs.createReadStream(filePath, { encoding: 'utf8' })
    .pipe(csv({
      separator: '^',
      bom: true,
      strict: false,
      quote: '|',
    }));

  stream.on('data', (row) => {
    const record = sanitize(row);

    if (!record.denumire) return;

    if (!record.cui || record.cui === '0') {
      if (!record.cod_inmatriculare) return;
      record.cui = `NoCUI_${record.cod_inmatriculare}`;
    }

    batch.push(record);

    if (batch.length >= BATCH_SIZE) {
      const currentBatch = [...batch];
      batch = [];

      flushQueue = flushQueue.then(async () => {
        try {
          const result = await prisma.company.createMany({
            data: currentBatch,
            skipDuplicates: true,
          });
          importStatus.processed += result.count;
          console.log(`Processed: ${importStatus.processed}`);
        } catch (err) {
          importStatus.errors += currentBatch.length;
          console.error('Batch error:', err.message);
        }
      });
    }
  });

  stream.on('end', () => {
    flushQueue = flushQueue.then(async () => {
      if (batch.length > 0) {
        try {
          const result = await prisma.company.createMany({
            data: batch,
            skipDuplicates: true,
          });
          importStatus.processed += result.count;
        } catch (err) {
          importStatus.errors += batch.length;
        }
      }

      importStatus.running = false;
      importStatus.finishedAt = new Date();
      importStatus.message = 'done';
      console.log(`Import finished. Total: ${importStatus.processed}`);
    });
  });

  stream.on('error', (err) => {
    importStatus.running = false;
    importStatus.message = `error: ${err.message}`;
    console.error('Import error:', err.message);
  });
}

module.exports = { importCSV, getStatus };