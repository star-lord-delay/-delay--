const Route = require('../models/Route');
const Station = require('../models/Station');

exports.getAllRoutes = async (req, res) => {
  try {
    res.json({ success: true, data: await Route.findAll() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getStationsByRoute = async (req, res) => {
  try {
    res.json({ success: true, data: await Station.findByRouteId(req.params.routeId) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
