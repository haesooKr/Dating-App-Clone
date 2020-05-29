// dev

require('dotenv').config();
require('./models/db');
const logger = require('morgan');

// /dev

const express = require('express');
const cookieParser = require('cookie-parser');

const app = express();
app.use(logger('dev'));
app.use(cookieParser());
app.use(express.json());

const PORT = process.env.PORT || 5000;


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
})