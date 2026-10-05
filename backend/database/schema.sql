CREATE DATABASE IF NOT EXISTS delay_zero_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE delay_zero_db;

CREATE TABLE IF NOT EXISTS user_tbl (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NULL,
  role_id INT NULL
);

SET @has_last_station = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'user_tbl'
    AND column_name = 'last_station'
);
SET @add_last_station = IF(
  @has_last_station = 0,
  'ALTER TABLE user_tbl ADD COLUMN last_station VARCHAR(100) NULL',
  'SELECT 1'
);
PREPARE add_last_station_stmt FROM @add_last_station;
EXECUTE add_last_station_stmt;
DEALLOCATE PREPARE add_last_station_stmt;
INSERT IGNORE INTO user_tbl (user_id, name, email, role_id, last_station)
VALUES (1, 'テストユーザー', 'demo@example.com', 1, '土浦');

CREATE TABLE IF NOT EXISTS bus_schedule_tbl (
  bus_id INT AUTO_INCREMENT PRIMARY KEY,
  station_name VARCHAR(100) NOT NULL,
  weekday ENUM('weekday', 'holiday') NOT NULL,
  train_arrival_time TIME NOT NULL,
  bus_departure_time TIME NOT NULL,
  INDEX idx_bus_search (station_name, weekday, bus_departure_time)
);

INSERT INTO bus_schedule_tbl
  (station_name, weekday, train_arrival_time, bus_departure_time)
VALUES
  ('土浦', 'weekday', '08:20:00', '08:30:00'),
  ('土浦', 'weekday', '08:20:00', '08:45:00'),
  ('取手', 'weekday', '08:20:00', '08:35:00'),
  ('土浦', 'holiday', '08:20:00', '08:40:00');
