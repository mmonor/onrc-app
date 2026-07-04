const express = require('express');
const path = require('path');
const multer = require('multer');
const { importStare, getUpdateStatus, cancelUpdate } = require('../services/stareImporter');
const { importCaen, getCaenStatus, cancelCaen } = require('../services/caenImporter');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads')),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 * 1024 } });

// POST /enrich/stare — acceptă OD_STARE_FIRMA.CSV + n_stare_firma.csv
router.post('/stare', upload.fields([
  { name: 'stare', maxCount: 1 },
  { name: 'nomenclator', maxCount: 1 },
]), (req, res, next) => {
  try {
    if (!req.files?.stare || !req.files?.nomenclator) {
      return res.status(400).json({ error: 'Both stare and nomenclator files required' });
    }
    importStare(req.files.stare[0].path, req.files.nomenclator[0].path).catch(console.error);
    res.status(202).json({ message: 'Stare update started', status: getUpdateStatus() });
  } catch (err) { next(err); }
});

// POST /enrich/caen — acceptă OD_CAEN_AUTORIZAT.CSV + n_caen.csv
router.post('/caen', upload.fields([
  { name: 'caen', maxCount: 1 },
  { name: 'nomenclator', maxCount: 1 },
]), (req, res, next) => {
  try {
    if (!req.files?.caen || !req.files?.nomenclator) {
      return res.status(400).json({ error: 'Both caen and nomenclator files required' });
    }
    importCaen(req.files.caen[0].path, req.files.nomenclator[0].path).catch(console.error);
    res.status(202).json({ message: 'CAEN update started', status: getCaenStatus() });
  } catch (err) { next(err); }
});

router.get('/stare/status', (req, res) => res.json(getUpdateStatus()));
router.get('/caen/status', (req, res) => res.json(getCaenStatus()));

router.post('/stare/cancel', (req, res) => {
  const cancelled = cancelUpdate();
  cancelled
    ? res.json({ message: 'Cancelled', status: getUpdateStatus() })
    : res.status(400).json({ error: 'No update in progress' });
});

router.post('/caen/cancel', (req, res) => {
  const cancelled = cancelCaen();
  cancelled
    ? res.json({ message: 'Cancelled', status: getCaenStatus() })
    : res.status(400).json({ error: 'No update in progress' });
});

module.exports = router;
