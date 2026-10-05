// user_stations_tbl
const pool = require('../config/database');

const UserStation = {
  async findByUserId(userId) {
    const [rows] = await pool.query(
      `SELECT us.*, s.station_name, s.route_id FROM user_stations_tbl us
      JOIN station_tbl s ON us.station_id = s.station_id WHERE us.user_id = ?`,
      [userId]
    );
    return rows;
  },
  async add(userId, stationId) {
    const [result] = await pool.query(
      'INSERT INTO user_stations_tbl (user_id, station_id) VALUES (?, ?)',
      [userId, stationId]
    );
    return result.insertId;
  }
};

module.exports = UserStation;
