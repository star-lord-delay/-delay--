// notification_tbl 
const pool = require('../config/database');

const Notification = {
  async findAll() {
    const [rows] = await pool.query('SELECT * FROM notification_tbl ORDER BY created_at DESC');
    return rows;
  },
  async create({ title, message, route_id, start_station_id, end_station_id, delay_minutes, target_role, category }) {
    const [result] = await pool.query(
      `INSERT INTO notification_tbl
       (title, message, route_id, start_station_id, end_station_id, delay_minutes, target_role, category)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, message, route_id, start_station_id, end_station_id, delay_minutes, target_role, category]
    );
    return result.insertId;
  }
};

module.exports = Notification;
