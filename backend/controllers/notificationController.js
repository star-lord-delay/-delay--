// 通知一覧・既読処理
const NotificationStatus = require('../models/NotificationStatus');

exports.getNotifications = async (req, res) => {
  try {
    const userId = req.query.userId || 1;
    res.json({ success: true, data: await NotificationStatus.getUserNotifications(userId) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId は必須です。' });
    }
    await NotificationStatus.markAsRead(userId, req.params.notificationId);
    res.json({ success: true, message: '既読に更新しました。' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
