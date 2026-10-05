const pool = require('../config/database');

const Dashboard = {
  async getStation(userId) {
    const [rows] = await pool.query(
      'SELECT last_station AS station FROM user_tbl WHERE user_id = ?',
      [userId]
    );
    return rows[0] ? rows[0].station : null;
  },

  async saveStation(userId, station) {
    const [result] = await pool.query(
      'UPDATE user_tbl SET last_station = ? WHERE user_id = ?',
      [station, userId]
    );
    if (result.affectedRows === 0) {
      const error = new Error('ユーザーが見つかりません。');
      error.statusCode = 404;
      throw error;
    }
  },

  async findNextBus(station, weekday, delaySeconds) {
    const [rows] = await pool.query(
      `SELECT bus_id, station_name AS station, weekday, train_arrival_time,
              bus_departure_time
       FROM bus_schedule_tbl
       WHERE station_name = ? AND weekday = ?
         AND TIME_TO_SEC(bus_departure_time) >=
             TIME_TO_SEC(train_arrival_time) + ?
       ORDER BY bus_departure_time ASC
       LIMIT 1`,
      [station, weekday, delaySeconds]
    );
    return rows[0] || null;
  }
};

module.exports = Dashboard;
