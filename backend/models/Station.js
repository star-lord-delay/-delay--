const pool = require('../config/database');

const Station = {
  async findAll() {
    const [rows] = await pool.query('SELECT * FROM station_tbl ORDER BY route_id, station_order ASC');
    return rows;
  },
  async findByRouteId(routeId) {
    const [rows] = await pool.query('SELECT * FROM station_tbl WHERE route_id = ? ORDER BY station_order ASC', [routeId]);
    return rows;
  },
  async findById(stationId) {
    const [rows] = await pool.query('SELECT * FROM station_tbl WHERE station_id = ?', [stationId]);
    return rows[0];
  }
};

module.exports = Station;
