const fs = require('fs');
const csv = require('csv-parser');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();


const BATCH_SIZE = 1000;

 // obiect care tine starea curenta a importului csv
let importStatus = {
  running: false,
  processed: 0,
  errors: 0,
  startedAt: null,
  finishedAt: null,
  message: 'idle',
};

// getter pentru statusul curent din afara modulului
function getStatus() {
  return importStatus;
}

// pentru fiecare rand, "curatam" datele
function sanitize(row) {
  return {
    cui:              String(row['CUI']              || row['cui']              || '').trim(),
    denumire:         String(row['DENUMIRE']         || row['denumire']         || '').trim(),
    cod_inmatriculare:String(row['COD_INMATRICULARE']|| row['cod_inmatriculare']|| '').trim() || null,
    stare:            String(row['STARE']            || row['stare']            || '').trim() || null,
    judet:            String(row['JUDET']            || row['judet']            || '').trim() || null,
    localitate:       String(row['LOCALITATE']       || row['localitate']       || '').trim() || null,
    adresa:           String(row['ADRESA']           || row['adresa']           || '').trim() || null,
    cod_postal:       String(row['COD_POSTAL']       || row['cod_postal']       || '').trim() || null,
    telefon:          String(row['TELEFON']          || row['telefon']          || '').trim() || null,
    fax:              String(row['FAX']              || row['fax']              || '').trim() || null,
    email:            String(row['EMAIL']            || row['email']            || '').trim() || null,
    web:              String(row['WEB']              || row['web']              || '').trim() || null,
    cod_caen:         String(row['COD_CAEN']         || row['cod_caen']         || '').trim() || null,
    caen_denumire:    String(row['CAEN_DENUMIRE']    || row['caen_denumire']    || '').trim() || null,
  };
}

// trimit un batch catre postgreSQL intr-un query
// create many e mai eficient decat create individual
// skip duplicates pt CUI
async function flushBatch(batch) {
  await prisma.company.createMany({
    data: batch,
    skipDuplicates: true,
  });
}


async function importCSV(filePath) {

  // lasam doar un import sa ruleze
  if (importStatus.running) {
    throw new Error('Import already in progress');
  }

  // resetez statusul la fiecare import
  importStatus = {
    running: true,
    processed: 0,
    errors: 0,
    startedAt: new Date(),
    finishedAt: null,
    message: 'running',
  };

  
  return new Promise((resolve, reject) => {
    let batch = [];

    // stream-ul de citire pe chunks, cu parser csv
    const stream = fs.createReadStream(filePath)
      .pipe(csv({ separator: ',', strict: false }));

   
    stream.on('data', async (row) => {
      const record = sanitize(row);

      // ignor randurile fara cui sau denumire
      if (!record.cui || !record.denumire) return;

      batch.push(record);

      
      if (batch.length >= BATCH_SIZE) {

        stream.pause();

        const currentBatch = [...batch]; 
        batch = [];                      

        try {
          await flushBatch(currentBatch);
          importStatus.processed += currentBatch.length;
        } catch (err) {
          importStatus.errors += currentBatch.length;
          console.error('Batch error:', err.message);
        } finally {
          
          stream.resume();
        }
      }
    });

    // verific daca mai sunt date in batch
    stream.on('end', async () => {
      if (batch.length > 0) {
        try {
          await flushBatch(batch);
          importStatus.processed += batch.length;
        } catch (err) {
          importStatus.errors += batch.length;
        }
      }

      importStatus.running = false;
      importStatus.finishedAt = new Date();
      importStatus.message = 'done';
      resolve(importStatus);
    });

    
    stream.on('error', (err) => {
      importStatus.running = false;
      importStatus.message = `error: ${err.message}`;
      reject(err);
    });
  });
}

module.exports = { importCSV, getStatus };