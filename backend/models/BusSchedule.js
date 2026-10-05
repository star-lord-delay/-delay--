//  bus_tbl　バステーブル
const pool = require('../config/database');

const BusSchedule = {
  async findAll() {
    const [rows] = await pool.query('SELECT * FROM bus_tbl ORDER BY bus_time ASC');
    return rows;
  },
  async findUpcoming(currentTime) {
    const [rows] = await pool.query('SELECT * FROM bus_tbl WHERE bus_time >= ? ORDER BY bus_time ASC', [currentTime]);
    return rows;
  },
  async findById(busId) {
    const [rows] = await pool.query('SELECT * FROM bus_tbl WHERE bus_id = ?', [busId]);
    return rows[0];
  }
};

module.exports = BusSchedule;
