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

    //現在時刻//
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    let currentTimeStr = req.query.testTime || `${hours}:${minutes}`;
    
    //利用駅の時刻表//
    let trainTime = "--:--";
    let arriveTime = "計算中";

    //日本語の駅名をローマ字返還//
    const stationMap = {
      "取手": "Toride", "藤代": "Fujishiro", "龍ヶ崎": "Ryugasakishi", "牛久": "Ushiku",
      "ひたち野うしく": "Hitachinoushiku", "荒川沖": "Arakawaoki", "土浦": "Tsuchiura",
      "神立": "Kandatsu", "高浜": "Takahama", "石岡": "Ishioka", "羽鳥": "Hatori",
      "友部": "Tomobe", "内原": "Uchihara", "赤塚": "Akatsuka",
      "勝田": "Katsuta", "佐和": "Sawa", "東海": "Tokai", "大甕": "Omika",
      "常陸多賀": "Hitachitaga", "日立": "Hitachi", "小木津": "Ogitsu", "十王": "Juo",
      "高萩": "Takahagi", "南中郷": "Minaminakago", "磯原": "Isohara", "大津港": "Otsuko"
    };

    //各駅から水戸駅までの時間//
    const travelTimeMap = {
      "取手": 75, "藤代": 70, "龍ヶ崎": 65, "牛久": 60,
      "ひたち野うしく": 55, "荒川沖": 50, "土浦": 45, "神立": 40,
      "高浜": 35, "石岡": 30, "羽鳥": 25, "友部": 15,
      "内原": 10, "赤塚": 6, "勝田": 6, "佐和": 10,
      "東海": 15, "大甕": 23, "常陸多賀": 28, "日立": 33,
      "小木津": 38, "十王": 43, "高萩": 50, "南中郷": 55,
      "磯原": 60, "大津港": 65
    };

    const travelMins = travelTimeMap[station.trim()] || 40;
    const timeEndpoint = process.env.TRAIN__JOBAN_TIME_API_URL;
    const apiKey = process.env.TRAIN__JOBAN_TIME_API_KEY;
    const romajiStation = stationMap[station.trim()];
    let candidatesList = [];

    //現在時刻から電車を4本取得し、それぞれもバスを計算//
    if (timeEndpoint && apiKey && romajiStation) {
      try {
        const trainCalendar = isHoliday ? 'odpt.Calendar:SaturdayHoliday' : 'odpt.Calendar:Weekday';
        const targetUrl = `${timeEndpoint}?odpt:railway=odpt.Railway:JR-East.Joban&odpt:station=odpt.Station:JR-East.Joban.${romajiStation}&odpt:railDirection=odpt.RailDirection:Outbound&odpt:calendar=${trainCalendar}&acl:consumerKey=${apiKey}`;
        const timeRes = await fetch(targetUrl);
        if (timeRes.ok) {
          const timeData = await timeRes.json();
          if (timeData.length > 0) {
            const timetable = timeData[0]["odpt:stationTimetableObject"];
            const futureTrains = timetable.filter(t => t["odpt:departureTime"] >= currentTimeStr);
            const nextTrain = futureTrains.slice(0, 4);

            for (const train of nextTrain) {
              const tTime = train["odpt:departureTime"];
              const [tH, tM] = tTime.split(':').map(Number);
              const totalMins = tH * 60 + tM + travelMins;
              const aH = Math.floor(totalMins / 60) % 24;
              const aM = totalMins % 60;
              const aTime = `${String(aH).padStart(2, '0')}:${String(aM).padStart(2, '0')}`;

              const schedule = await Dashboard.findNextBus(station.trim(), weekday, delay * 60, aTime);
              const rawTime = schedule ? (schedule.bus_departure_time || schedule.bus_time || schedule.adjusted_arrival_time) : null;
              let fBusTime = rawTime ? String(rawTime).slice(0, 5) : "利用できるバスがありません";

              if (fBusTime !== "利用できるバスがありません" && fBusTime < aTime) {
                fBusTime = "利用できるバスがありません";
              }

              candidatesList.push({
                trainTime: tTime,
                arriveTime: aTime,
                busTime: fBusTime
              });
            }
          }
        }
      } catch (error) {
        console.error("運行情報APIの取得に失敗しました", error);
      }
    }

    //推奨データ設定//
    let recommendTrain = "--:--";
    let recommendBus = "利用できるバスがありません";
    let isLate = false;
    let alertMessage = "";
    const cutoffTime = "08:50";

    if (candidatesList.length > 0) {
      recommendTrain = candidatesList[0].trainTime;
      recommendBus = candidatesList[0].busTime;

      if ((recommendTrain > cutoffTime) || recommendBus === "利用できるバスがありません") {
        isLate = true;
        alertMessage = "スクールバスに間に合いません";
      }
    }

    if (currentTimeStr >= "10:00") {
      recommendBus = "利用できるバスがありません";
      isLate = true;
      alertMessage = "";
    }

    res.json({
      success: true,
      recommendTrain: recommendTrain,
      recommendBus: recommendBus,
      isLate: isLate,
      alertMessage: alertMessage,
      candidates: candidatesList.length > 0 ? candidatesList : [{ trainTime: "--:--", arriveTime: "計算中", busTime: "利用できるバスがありません" }]
    });
  } catch (error) {
    next(error);
  }
};

//常磐線遅延情報//
exports.getTrainStatus = async (req, res, next) => {
  const baseUrl = process.env.TRAIN__JOBAN_DELAY_API_URL;
  const apiKey = process.env.TRAIN__JOBAN_DELAY_API_KEY;

  if (!apiKey) {
    return res.json({ success: true, delayMinutes: 0, infoText: "遅延情報APIキーが設定されていません。"});
  }

  try {
    const targetUrl = `${baseUrl}?odpt:railway=odpt.Railway:JR-East.Joban&acl:consumerKey=${apiKey}`;
    const response = await fetch(targetUrl);
    if (!response.ok) {
      return res.status(502).json({ success: false, message: '運行情報APIがエラーを返しました。' });
    }
    const trains = await response.json();
    let maxDelaySeconds = 0;

    if (Array.isArray(trains)) {
      for (const train of trains) {
        if (train["odpt:delay"] && train["odpt:delay"] > maxDelaySeconds) {
          maxDelaySeconds = train["odpt:delay"];
        }
      }
    }

    const delayMinutes = Math.floor(maxDelaySeconds / 60);

    let statusMessage = `常磐線は平常運転です。`;
    if (delayMinutes > 0) {
        statusMessage = `常磐線は${delayMinutes}分遅れています。`;
    }

    res.json({
      success: true,
      delayMinutes: delayMinutes,
      infoText: statusMessage
    });
  } catch (error) {
    next(error);
  }
};

//水郡線遅延情報//
exports.getSuigunStatus = async (req, res, next) => {
  const baseUrl = process.env.TRAIN__SUIGUN_TIME_API_URL;
  const apiKey = process.env.TRAIN__SUIGUN_TIME_API_KEY;

  if (!baseUrl || !apiKey) {
    return res.json({
      success: true,
      delayMinutes: 0,
      isCanceled: false,
      infoText: "水郡線の運行情報APIが設定されていません。"
    });
  }
  try {
    const targetUrl = `${baseUrl}?odpt:railway=odpt.Railway:JR-East.Suigun&acl:consumerKey=${apiKey}`;
    const response = await fetch(targetUrl);

    if (!response.ok) {
      return res.status(502).json({
        success: false,
        message: '水郡線の運行情報APIがエラーを返しました。'
      });
    }
    const infoData = await response.json();
    let delayMinutes = 0;
    let isCanceled = false;
    let alertMessage = "";
    let rawText = "平常運転です。";

    if (infoData.length > 0 && infoData[0]["odpt:trainInformationText"]) {
      rawText = infoData[0]["odpt:trainInformationText"].ja;

      if (rawText.includes("運休") || rawText.includes("運転見合わせ")) {
        isCanceled = true;
        delayMinutes = 999;
        alertMessage = "水郡線は運休中です。";
      }
      else{
        const match = rawText.match(/(\d+)分遅れ/);
        if (match) {
          delayMinutes = parseInt(match[1], 10);
          alertMessage = `水郡線は${delayMinutes}分遅れています。`;
        }
        else if (rawText !== "平常運転") {
          delayMinutes = 999;
          alertMessage = "水郡線のダイヤが乱れています。";
        }
      }
    }

    res.json({
      success: true,
      delayMinutes: delayMinutes,
      isCanceled: isCanceled,
      infoText: rawText,
      alertMessage: alertMessage
    });
  } catch (error) {
    next(error);
  }
};
