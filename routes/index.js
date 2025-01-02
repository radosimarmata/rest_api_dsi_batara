const express = require('express');
const userRoutes = require('./userRoutes');
const authRoutes = require('./authRoutes');
const iologRoutes = require('./iologRoutes');
const reportRoutes = require('./reportRoutes');
const ipWhitelist = require('@middleware/ipWhitelist');

const router = express.Router();

router.get('/', ipWhitelist, (req, res) => {
  return res.json({
    message: "Welcome to Metamine API!",
    version: "1.0.0",
    description: "A powerful backend solution for fleet management.",
    timestamp: new Date().toISOString(),
  });
});
router.use('/users', ipWhitelist, userRoutes);
router.use('/auth', authRoutes);
router.use('/log', ipWhitelist, iologRoutes);
router.use('/reports', reportRoutes);

module.exports = router;