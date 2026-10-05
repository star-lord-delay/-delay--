// バス運行情報API
const BusSchedule = require('../models/BusSchedule');

exports.getBusSchedules = async (req, res) => {
  try {
    const data = req.query.upcoming === 'true'
      ? await BusSchedule.findUpcoming(req.query.from || new Date().toTimeString().slice(0, 8))
      : await BusSchedule.findAll();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getBusSchedule = async (req, res) => {
  try {
    const schedule = await BusSchedule.findById(req.params.busId);
    if (!schedule) {
      return res.status(404).json({ success: false, message: 'バス便が見つかりません。' });
    }
    res.json({ success: true, data: schedule });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
