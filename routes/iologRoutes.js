const express = require('express');
const { getIoLogs } = require('@controllers/iologController');
const authMiddleware = require('@middleware/authMiddleware');

const router = express.Router();

router.get('/', authMiddleware, getIoLogs);

module.exports = router;
