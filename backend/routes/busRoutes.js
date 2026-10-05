const express = require('express');
const controller = require('../controllers/busController');
const router = express.Router();

router.get('/schedules', controller.getBusSchedules);
router.get('/schedules/:busId', controller.getBusSchedule);

module.exports = router;
