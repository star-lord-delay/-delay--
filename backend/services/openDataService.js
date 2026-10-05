const Route = require('../models/Route');
const Notification = require('../models/Notification');

module.exports = {
  async fetchDelayInformation() {
    const delayData = [{
      route_id: 1,
      status: '遅延',
      title: '中央線 遅延情報',
      message: '信号確認の影響により、最大15分の遅延が発生しています。',
      delay_minutes: 15,
      start_station_id: 1,
      end_station_id: 5,
      category: 'delay'
    }];

    for (const info of delayData) {
      await Route.updateStatus(info.route_id, info.status);
      await Notification.create(info);
    }
    return delayData;
  }
};
