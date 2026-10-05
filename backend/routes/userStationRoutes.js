const express = require('express');
const controller = require('../controllers/dashboardController');
const router = express.Router();

router.get('/station', controller.getStation);
router.post('/station', controller.saveStation);

module.exports = router;
