const express = require('express');
const controller = require('../controllers/notificationController');
const router = express.Router();

router.get('/', controller.getNotifications);
router.post('/:notificationId/read', controller.markAsRead);

module.exports = router;
