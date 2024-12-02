const express = require('express');
const userRoutes = require('./userRoutes');
const authRoutes = require('./authRoutes');
const iologRoutes = require('./iologRoutes');
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
router.use('/auth', ipWhitelist, authRoutes);
router.use('/log', ipWhitelist, iologRoutes);

module.exports = router;