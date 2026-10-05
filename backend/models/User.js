// user_tbl 
const pool = require('../config/database');

const User = {
  async findById(userId) {
    const [rows] = await pool.query('SELECT * FROM user_tbl WHERE user_id = ?', [userId]);
    return rows[0];
  },
  async findByEmail(email) {
    const [rows] = await pool.query('SELECT * FROM user_tbl WHERE email = ?', [email]);
    return rows[0];
  },
  async create({ name, email, password_hash, role_id }) {
    const [result] = await pool.query(
      'INSERT INTO user_tbl (name, email, password_hash, role_id) VALUES (?, ?, ?, ?)',
      [name, email, password_hash, role_id || 1]
    );
    return result.insertId;
  }
};

module.exports = User;
