const express = require('express');
const controller = require('../controllers/authController');
const router = express.Router();

router.post('/request-otp', controller.requestOtp);
router.post('/verify-otp', controller.verifyOtp);

module.exports = router;
