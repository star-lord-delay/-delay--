const pool = require('../config/database');

const Route = {
  async findAll() {
    const [rows] = await pool.query('SELECT * FROM route_tbl ORDER BY route_id ASC');
    return rows;
  },
  async findById(routeId) {
    const [rows] = await pool.query('SELECT * FROM route_tbl WHERE route_id = ?', [routeId]);
    return rows[0];
  },
  async updateStatus(routeId, status) {
    await pool.query('UPDATE route_tbl SET status = ? WHERE route_id = ?', [status, routeId]);
  }
};

module.exports = Route;
