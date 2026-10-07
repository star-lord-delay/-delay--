const pool = require('../config/database');

const Dashboard = {
  async getStation(userId) {
    const [rows] = await pool.query(
      `SELECT s.station_name
       FROM user_stations_tbl us
       JOIN station_tbl s ON us.station_id = s.station_id
       WHERE us.user_id = ?
       LIMIT 1`,
      [userId]
    );
    if (rows && rows.length > 0 && rows[0].station_name) {
      return rows[0];
    }

    return { station_name: '土浦' };
  },

  async saveStation(userId, station) {
    const [stations] = await pool.query(
      'SELECT station_id FROM station_tbl WHERE station_name = ?',
      [station]
    );

    let stationId;

    if (!stations[0]) {
      const [maxRes] = await pool.query('SELECT MAX(station_id) as maxId FROM station_tbl');
      stationId = (maxRes[0].maxId || 0) + 1;

    await pool.query(
        'INSERT INTO station_tbl (station_id, station_name) VALUES (?, ?)',
        [stationId, station]
      );
    } else {
      stationId = stations[0].station_id;
    }

    await pool.query(
      'INSERT INTO user_stations_tbl (user_id, station_id) VALUES (?, ?)',
      [userId, stationId]
    );
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
