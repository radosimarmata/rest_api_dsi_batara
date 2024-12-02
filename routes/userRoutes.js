const express = require('express');
const { getUsers, createUser } = require('@controllers/userController');
const authMiddleware = require('@middleware/authMiddleware');

const router = express.Router();

router.get('/', authMiddleware, getUsers);

router.post('/', createUser);

module.exports = router;
