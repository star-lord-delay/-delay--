const express = require('express');
const controller = require('../controllers/trainController');
const router = express.Router();

router.get('/routes', controller.getAllRoutes);
router.get('/routes/:routeId/stations', controller.getStationsByRoute);

module.exports = router;
