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
      `SELECT bus_survice, bus_time AS bus_departure_time
       FROM bus_tbl
       WHERE TIME_TO_SEC(bus_time) >= TIME_TO_SEC(CURTIME()) + ?
       ORDER BY bus_time ASC
       LIMIT 1`,
      [delaySeconds]
    );
    if (!rows[0]) {
      const [firstBus] = await pool.query(
        `SELECT bus_survice, bus_time AS bus_departure_time
         FROM bus_tbl
         ORDER BY bus_time ASC
         LIMIT 1`
      );
      return firstBus[0] || null;
    }

    return rows[0];
  }
};

module.exports = Dashboard;
