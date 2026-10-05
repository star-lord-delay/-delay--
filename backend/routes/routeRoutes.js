const express = require('express');
const controller = require('../controllers/routeController');
const router = express.Router();

router.get('/search', controller.findIntegratedRoute);

module.exports = router;
