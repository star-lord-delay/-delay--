// 電車＋バス統合経路検索
const searchEngine = require('../services/searchEngine');

exports.findIntegratedRoute = async (req, res) => {
  try {
    const { originStationId, arrivalTime } = req.query;
    if (!originStationId || !arrivalTime) {
      return res.status(400).json({
        success: false,
        message: 'originStationId と arrivalTime は必須です。'
      });
    }
    res.json({
      success: true,
      data: await searchEngine.searchRoute(originStationId, arrivalTime)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
