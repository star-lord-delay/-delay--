const Station = require('../models/Station');
const BusSchedule = require('../models/BusSchedule');

module.exports = {
  async searchRoute(originStationId, targetArrivalTime) {
    const originStation = await Station.findById(originStationId);
    if (!originStation) {
      throw new Error('指定された駅が存在しません。');
    }

    const buses = await BusSchedule.findAll();
    if (buses.length === 0) {
      throw new Error('利用可能なスクールバスがありません。');
    }
    const matchedBuses = buses.filter(bus => bus.bus_time <= targetArrivalTime);
    const bestBus = matchedBuses.length > 0 ? matchedBuses[matchedBuses.length - 1] : buses[0];

    return {
      origin: originStation,
      targetArrivalTime,
      transitSteps: [
        { type: 'TRAIN', from: originStation.station_name, to: '学校最寄駅', estimatedMinutes: 20 },
        {
          type: 'BUS',
          busService: bestBus.bus_service || bestBus.bus_survice || 'スクールバス1便',
          departureTime: bestBus.bus_time,
          destination: '学校'
        }
      ]
    };
  }
};
