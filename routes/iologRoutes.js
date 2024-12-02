const express = require('express');
const { getIoLogs, getIoLogsNow } = require('@controllers/iologController');
const authMiddleware = require('@middleware/authMiddleware');

const router = express.Router();

router.get('/', authMiddleware, getIoLogs);
router.get('/now', authMiddleware, getIoLogsNow);

module.exports = router;
