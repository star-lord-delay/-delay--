const pool = require('../config/database');

const NotificationStatus = {
  async getUserNotifications(userId) {
    const [rows] = await pool.query(
      `SELECT n.*, COALESCE(ns.status, 'unread') AS read_status
       FROM notification_tbl n
       LEFT JOIN notification_statuses_tbl ns
       ON n.notification_id = ns.notification_id AND ns.user_id = ?
       ORDER BY n.created_at DESC`,
      [userId]
    );
    return rows;
  },
  async markAsRead(userId, notificationId) {
    await pool.query(
      `INSERT INTO notification_statuses_tbl (user_id, notification_id, status)
       VALUES (?, ?, 'read') ON DUPLICATE KEY UPDATE status = 'read'`,
      [userId, notificationId]
    );
  }
};

module.exports = NotificationStatus;
