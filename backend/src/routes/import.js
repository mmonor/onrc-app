const express = require('express');
const path = require('path');
const {importCSV, getStatus} = require('../services/csvImporter');

const router = express.Router();

router.post('/', async (req, res,next) => {
    try{
        const {filePath} = req.body;
        if(!filePath)
            return res.status(400).json({error: 'filePath is required'});

        const absolutePath = path.resolve(filePath);
        
        importCSV(absolutePath).catch(console.error);

        res.status(200).json({message: 'Import started',status: getStatus()});

    }catch(err){
       next(err);
    }
});

router.get('/status', (req, res) => {
    res.json(getStatus());
});

module.exports = router;
