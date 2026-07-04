const express = require('express');
const path = require('path');
const multer = require('multer');
const { importCSV, getStatus, cancelImport } = require('../services/csvImporter');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
    cb(null, true);
  } else {
    cb(new Error('Only CSV files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 * 1024 },
});

router.post('/upload', upload.single('file'), (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    console.log(`Starting import: ${req.file.originalname}`);

    importCSV(filePath).catch(console.error);

    res.status(202).json({
      message: 'Import started',
      filename: req.file.originalname,
      status: getStatus(),
    });
  } catch (err) {
    next(err);
  }
});

router.post('/', (req, res, next) => {
  try {
    const { filePath } = req.body;
    if (!filePath) return res.status(400).json({ error: 'filePath is required' });
    importCSV(path.resolve(filePath)).catch(console.error);
    res.status(202).json({ message: 'Import started', status: getStatus() });
  } catch (err) {
    next(err);
  }
});

// POST /import/cancel — oprește importul curent
router.post('/cancel', (req, res) => {
  const cancelled = cancelImport();
  if (cancelled) {
    res.json({ message: 'Import cancellation requested', status: getStatus() });
  } else {
    res.status(400).json({ error: 'No import in progress' });
  }
});

router.get('/status', (req, res) => {
  res.json(getStatus());
});

module.exports = router;