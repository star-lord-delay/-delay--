// otp_tbl
const pool = require('../config/database');

const Otp = {
  async create(userId, email, otpCode, usageType, expiryAt) {
    const [result] = await pool.query(
      'INSERT INTO otp_tbl (user_id, email, otp_code, usage_type, expiry_at, is_used) VALUES (?, ?, ?, ?, ?, 0)',
      [userId, email, otpCode, usageType, expiryAt]
    );
    return result.insertId;
  },
  async verify(email, otpCode, usageType) {
    const [rows] = await pool.query(
      `SELECT * FROM otp_tbl WHERE email = ? AND otp_code = ? AND usage_type = ?
       AND is_used = 0 AND expiry_at > NOW() ORDER BY created_at DESC LIMIT 1`,
      [email, otpCode, usageType]
    );
    return rows[0];
  },
  async markAsUsed(otpId) {
    await pool.query('UPDATE otp_tbl SET is_used = 1 WHERE otp_id = ?', [otpId]);
  }
};

module.exports = Otp;
