// dev

require('dotenv').config();
require('./models/db');
const logger = require('morgan');

// /dev

const express = require('express');
const cookieParser = require('cookie-parser');

const userRouter = require('./routes/User');
const imageRouter = require('./routes/Image');

const methodOverride = require('method-override');

const app = express();
app.use(logger('dev'));
app.use(cookieParser());
app.use(express.json());
app.use(methodOverride("_method"));

const PORT = process.env.PORT || 5000;

app.use('/user', userRouter);
app.use('/image', imageRouter);


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
})