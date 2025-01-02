const express = require('express');
const { getUtilizationofAvailability, getPhysicalofAvailability } = require('@controllers/reportController');
const authMiddleware = require('@middleware/authMiddleware');

const router = express.Router();

router.get('/utilization_of_availability', authMiddleware, getUtilizationofAvailability);
router.get('/physical_of_availability', authMiddleware, getPhysicalofAvailability);

module.exports = router;
