// 利用駅設定、定期券管理
const User = require('../models/User');
const UserStation = require('../models/UserStation');
const CommuterPass = require('../models/CommuterPass');

exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'ユーザーが見つかりません。' });
    }
    delete user.password_hash;
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getStations = async (req, res) => {
  try {
    res.json({ success: true, data: await UserStation.findByUserId(req.params.userId) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addStation = async (req, res) => {
  try {
    const { stationId } = req.body;
    if (!stationId) {
      return res.status(400).json({ success: false, message: 'stationId は必須です。' });
    }
    const userStationId = await UserStation.add(req.params.userId, stationId);
    res.status(201).json({ success: true, data: { userStationId } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCommuterPasses = async (req, res) => {
  try {
    res.json({
      success: true,
      data: await CommuterPass.findByUserId(req.params.userId)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};