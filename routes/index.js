const express = require('express');
const userRoutes = require('./userRoutes');
const authRoutes = require('./authRoutes');
const iologRoutes = require('./iologRoutes');

const router = express.Router();

router.get('/', (req, res) => {
  return res.json({
    message: "Welcome to Metamine API!",
    version: "1.0.0",
    description: "A powerful backend solution for fleet management.",
    timestamp: new Date().toISOString(),
  });
});
router.use('/users', userRoutes);
router.use('/auth', authRoutes);
router.use('/log', iologRoutes);

module.exports = router;