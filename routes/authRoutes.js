const express = require('express');
const { login, regenerateToken } = require('../controllers/authController');

const router = express.Router();

router.post('/login', login);
router.post('/refresh-token', regenerateToken);

module.exports = router;
