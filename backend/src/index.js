require('dotenv').config();
const express = require('express');
const cors = require('cors');

const companiesRouter = require('./routes/companies');
const importRouter = require('./routes/import');
const enrichRouter = require('./routes/enrich');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/companies', companiesRouter);
app.use('/import', importRouter);
app.use('/enrich', enrichRouter);

app.use(errorHandler);

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));