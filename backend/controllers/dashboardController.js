const Dashboard = require('../models/Dashboard');

const getUserId = () => Number(process.env.DEMO_USER_ID || 1);

exports.getStation = async (req, res, next) => {
  try {
    const userId = getUserId();
    const stationData = await Dashboard.getStation(userId);
    const name = (stationData && stationData.station_name) ? stationData.station_name : '土浦';
    res.json({ 
      success: true, 
      stationName: name,
      station_name: name,
      station: name
    });
  } catch (error) {
    next(error);
  }
};

exports.saveStation = async (req, res, next) => {
  try {
    const station = req.body.station || req.body.stationName;
    if (typeof station !== 'string' || station.trim() === '') {
      return res.status(400).json({ success: false, message: 'station は必須です。' });
    }
    const savedStation = station.trim();
    await Dashboard.saveStation(getUserId(), savedStation);
    res.json({ success: true, station: savedStation });
  } catch (error) {
    next(error);
  }
};

exports.getBusSchedule = async (req, res, next) => {
  try {
    const station = req.query.station;
    const delayMinutes = req.query.delay || 0;
    const delay = Number(delayMinutes);

    if (typeof station !== 'string' || station.trim() === '' || !Number.isFinite(delay) || delay < 0) {
      return res.status(400).json({
        success: false,
        message: 'station と0以上の delayMinutes が必要です。'
      });
    }

    const now = new Date();
    const isHoliday = [0, 6].includes(now.getDay());
    const weekday = isHoliday ? 'holiday' : 'weekday';

    //バス時刻//
    const schedule = await Dashboard.findNextBus(station.trim(), weekday, delay * 60);
    const rawTime = schedule ? (schedule.bus_departure_time || schedule.bus_time || schedule.adjusted_arrival_time) : "08:30:00";
    const formattedBusTime = String(rawTime).slice(0, 5);
    
    //利用駅の時刻表//
    let trainTime = "--:--";
    let arriveTime = "計算中";

    //日本語の駅名をローマ字返還//
    const stationMap = {
      "取手": "Toride", "藤代": "Fujishiro", "龍ヶ崎": "Ryugasakishi", "牛久": "Ushiku",
      "ひたち野うしく": "Hitachinoushiku", "荒川沖": "Arakawaoki", "土浦": "Tsuchiura",
      "神立": "Kandatsu", "高浜": "Takahama", "石岡": "Ishioka", "羽鳥": "Hatori",
      "友部": "Tomobe", "内原": "Uchihara", "赤塚": "Akatsuka"
    }

    const timeEndpoint = process.env.TRAIN__JOBAN_TIME_API_URL;
    const apiKey = process.env.TRAIN__JOBAN_TIME_API_KEY;
    const romajiStation = stationMap[station.trim()];

    if (timeEndpoint && apiKey && romajiStation) {
      try {
        const trainCalendar = isHoliday ? 'odpt.Calendar:SaturdayHoliday' : 'odpt.Calendar:Weekday';
        const targetUrl = `${timeEndpoint}?odpt:railway=odpt.Railway:JR-East.Joban&odpt:station=odpt.Station:JR-East.Joban.${romajiStation}&odpt:railDirection=odpt.RailDirection:Outbound&odpt:calendar=${trainCalendar}&acl:consumerKey=${apiKey}`;
        const timeRes = await fetch(targetUrl);
        if (timeRes.ok) {
          const timeData = await timeRes.json();
          if (timeData.length > 0) {
            const timetable = timeData[0]["odpt:stationTimetableObject"];
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const currentTimeStr = `${hours}:${minutes}`;
            const nextTrain = timetable.find(t => t["odpt:departureTime"] >= currentTimeStr);
            if (nextTrain) {
              trainTime = nextTrain["odpt:departureTime"];
            }
          }
        }
      } catch (error) {
        console.error("運行情報APIの取得に失敗しました", error);
      }
    }

    res.json({
      success: true,
      recommendTrain: trainTime,
      recommendBus: formattedBusTime,
      candidates: [
        {
          trainTime: trainTime,
          arriveTime: arriveTime,
          busTime: formattedBusTime
        }
      ]
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
    return res.json({ success: true, delayMinutes: 0 });
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
