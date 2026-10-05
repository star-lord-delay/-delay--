const express = require('express');
const controller = require('../controllers/userController');

const router = express.Router();

router.get('/:userId', controller.getUser);
router.get('/:userId/stations', controller.getStations);
router.post('/:userId/stations', controller.addStation);
router.get('/:userId/commuter-passes', controller.getCommuterPasses);

module.exports = router;
