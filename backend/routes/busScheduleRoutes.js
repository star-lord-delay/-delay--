const express = require('express');
const controller = require('../controllers/dashboardController');
const router = express.Router();

router.post('/', controller.getBusSchedule);

module.exports = router;
