const express = require('express');
const { 
  getUtilizationofAvailability,
  getPhysicalofAvailability,
  getLoginLogout,
  getActivityDuration,
  getStatusDuration
} = require('@controllers/reportController');
const authMiddleware = require('@middleware/authMiddleware');

const router = express.Router();

router.get('/utilization_of_availability', authMiddleware, getUtilizationofAvailability);
router.get('/physical_of_availability', authMiddleware, getPhysicalofAvailability);
router.get('/physical_of_availability', authMiddleware, getPhysicalofAvailability);
router.get('/login_logout', authMiddleware, getLoginLogout);
router.get('/activity_duration', authMiddleware, getActivityDuration);
router.get('/status_duration', authMiddleware, getStatusDuration);

module.exports = router;
