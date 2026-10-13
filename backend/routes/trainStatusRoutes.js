const express = require('express');
const controller = require('../controllers/dashboardController');
const router = express.Router();

const dashboardController = require('../controllers/dashboardController');

router.get('/', controller.getTrainStatus);
router.get('/suigun', dashboardController.getSuigunStatus);

module.exports = router;
