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

  //利用駅がstation_tblに登録されているかを確認//
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
        'INSERT INTO station_tbl (station_id, station_name, route_id) VALUES (?, ?, 1)',
        [stationId, station]
      );
    } else {
      stationId = stations[0].station_id;
    }

    //ユーザーの利用駅保存//
    await pool.query(
      'DELETE FROM user_stations_tbl WHERE user_id = ?', [userId]
    );

    await pool.query(
      'INSERT INTO user_stations_tbl (user_id, station_id) VALUES (?, ?)',
      [userId, stationId]
    );
  },

  async findNextBus(station, weekday, delaySeconds, targetTimeStr = null) {

    const timeQuery = targetTimeStr 
      ? "TIME_TO_SEC(?)" 
      : "TIME_TO_SEC(CURTIME())";

    const timeParam = targetTimeStr 
      ? `${targetTimeStr}:00` 
      : null;

    const queryParams = targetTimeStr 
      ? [timeParam, delaySeconds] 
      : [delaySeconds];

    const [rows] = await pool.query(
      `SELECT bus_survice, bus_time AS bus_departure_time
      FROM bus_tbl
      WHERE TIME_TO_SEC(bus_time) >= ${timeQuery} + ?
      ORDER BY bus_time ASC
      LIMIT 1`,
      queryParams
    );

    if (rows[0]) {
      return rows[0];
    }

    if (targetTimeStr && targetTimeStr >= "10:00") {
      return null;
    }

    const [firstBus] = await pool.query(
      `SELECT bus_survice, bus_time AS bus_departure_time
      FROM bus_tbl
      ORDER BY bus_time ASC
      LIMIT 1`
    );
    return firstBus[0] || null;
  }
};

module.exports = Dashboard;
