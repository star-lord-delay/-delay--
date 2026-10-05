const Dashboard = require('../models/Dashboard');

const userId = () => Number(process.env.DEMO_USER_ID || 1);

exports.getStation = async (req, res, next) => {
  try {
    const station = await Dashboard.getStation(userId());
    res.json({ success: true, station });
  } catch (error) {
    next(error);
  }
};

exports.saveStation = async (req, res, next) => {
  try {
    const { station } = req.body;
    if (typeof station !== 'string' || station.trim() === '') {
      return res.status(400).json({ success: false, message: 'station は必須です。' });
    }
    const savedStation = station.trim();
    await Dashboard.saveStation(userId(), savedStation);
    res.json({ success: true, station: savedStation });
  } catch (error) {
    next(error);
  }
};

exports.getBusSchedule = async (req, res, next) => {
  try {
    const { station, delayMinutes = 0 } = req.body;
    const delay = Number(delayMinutes);
    if (typeof station !== 'string' || station.trim() === '' || !Number.isFinite(delay) || delay < 0) {
      return res.status(400).json({
        success: false,
        message: 'station と0以上の delayMinutes が必要です。'
      });
    }

    const now = new Date();
    const weekday = [0, 6].includes(now.getDay()) ? 'holiday' : 'weekday';
    const schedule = await Dashboard.findNextBus(station.trim(), weekday, delay * 60);
    const adjustedArrivalTime = schedule
      ? addMinutes(schedule.train_arrival_time, delay)
      : null;

    res.json({
      success: true,
      data: schedule ? { ...schedule, adjusted_arrival_time: adjustedArrivalTime } : null
    });
  } catch (error) {
    next(error);
  }
};

function addMinutes(time, minutes) {
  const [hours, minutesPart, seconds] = String(time).split(':').map(Number);
  const totalSeconds = hours * 3600 + minutesPart * 60 + seconds + minutes * 60;
  const normalized = ((totalSeconds % 86400) + 86400) % 86400;
  return [Math.floor(normalized / 3600), Math.floor(normalized / 60) % 60, normalized % 60]
    .map((part) => String(part).padStart(2, '0'))
    .join(':');
}

exports.getTrainStatus = async (req, res, next) => {
  const endpoint = process.env.TRAIN_STATUS_API_URL;
  if (!endpoint) {
    return res.status(503).json({
      success: false,
      message: 'TRAIN_STATUS_API_URL が設定されていません。'
    });
  }

  try {
    const response = await fetch(endpoint, {
      headers: process.env.TRAIN_STATUS_API_KEY
        ? { Authorization: `Bearer ${process.env.TRAIN_STATUS_API_KEY}` }
        : {}
    });
    if (!response.ok) {
      return res.status(502).json({ success: false, message: '運行情報APIがエラーを返しました。' });
    }
    const payload = await response.json();
    const delayMinutes = extractDelayMinutes(payload);
    if (delayMinutes === null) {
      return res.status(502).json({
        success: false,
        message: '運行情報APIのレスポンスから遅延分数を取得できません。'
      });
    }
    res.json({ success: true, delayMinutes });
  } catch (error) {
    next(error);
  }
};

function extractDelayMinutes(value) {
  if (!value || typeof value !== 'object') return null;
  for (const key of ['delayMinutes', 'delay_minutes', 'delay']) {
    if (key in value && Number.isFinite(Number(value[key]))) return Math.max(0, Number(value[key]));
  }
  for (const child of Object.values(value)) {
    const result = extractDelayMinutes(child);
    if (result !== null) return result;
  }
  return null;
}
