const express = require('express');
const cors = require('cors');
require('dotenv').config();
require('./config/database');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/train', require('./routes/trainRoutes'));
app.use('/api/bus', require('./routes/busRoutes'));
app.use('/api/routes', require('./routes/routeRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/user', require('./routes/userStationRoutes'));
app.use('/api/train-status', require('./routes/trainStatusRoutes'));
app.use('/api/bus-schedule', require('./routes/busScheduleRoutes'));

app.get('/health', (req, res) => {
  res.json({ status: 'OK', system: '安心通学ナビ delay-0' });
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.statusCode ? error.message : 'サーバー内部でエラーが発生しました。'
  });
});

const PORT = Number(process.env.PORT) || 3000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;
