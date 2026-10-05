// role_tbl 
const pool = require('../config/database');

module.exports = {
  async findAll() {
    const [rows] = await pool.query('SELECT * FROM role_tbl');
    return rows;
  }
};
