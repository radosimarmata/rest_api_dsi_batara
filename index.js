require('dotenv').config();
require('module-alias/register')
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { sendNotFoundResponse, sendInternalServerErrorResponse } = require('@utils/response');
const routes = require('@routes');

const app = express();

app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

app.use('/api', routes);
app.use((req, res) => sendNotFoundResponse(res));
app.use((err, req, res, next) => {
  console.error(err.stack);
  return sendInternalServerErrorResponse(res, err.message || 'Internal Server Error');
});

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});