const pool = require('../config/database');

module.exports = {
  async findByUserId(userId) {
    const [rows] = await pool.query('SELECT * FROM commuter_pass_tbl WHERE user_id = ?', [userId]);
    return rows;
  }
};
