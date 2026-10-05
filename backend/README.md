# Backend API

`backend/` は Express と MySQL を利用するAPIです。DB接続情報は `.env` に設定します。

主なエンドポイント:

```text
GET  /health
GET  /api/train/routes
GET  /api/train/routes/:routeId/stations
GET  /api/bus/schedules
GET  /api/bus/schedules?upcoming=true&from=08:00:00
GET  /api/routes/search?originStationId=1&arrivalTime=08:30:00
POST /api/auth/request-otp
POST /api/auth/verify-otp
GET  /api/users/:userId
GET  /api/users/:userId/stations
POST /api/users/:userId/stations
GET  /api/users/:userId/commuter-passes
GET  /api/notifications?userId=:userId
POST /api/notifications/:notificationId/read
GET  /api/user/station
POST /api/user/station
GET  /api/train-status
POST /api/bus-schedule
```

初回は MySQL で `database/schema.sql` を実行してテーブルとテストデータを作成してください。
`TRAIN_STATUS_API_URL` には利用する鉄道運行情報APIのURLを設定します。

起動方法:

```bash
cd backend
npm install
npm start
```
