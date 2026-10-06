const API_BASE_URL = 'http://localhost:3000/api';
const stationData = {
    "常磐線（取手・土浦方面）": [
        "取手", "藤代", "龍ヶ崎", "牛久", "ひたち野うしく", "荒川沖", "土浦", "神立", "高浜", "石岡", "羽鳥", "友部", "内原", "赤塚"
    ],
    "常磐線（勝田・日立方面）": [
        "勝田", "佐和", "東海", "大甕", "常陸多賀", "日立", "小木津", "十王", "高萩", "南中郷", "磯原", "大津港"
    ],
    "水郡線（常陸大宮・大子方面）": [
        "常陸青柳", "常陸津田", "後台", "下菅谷", "中菅谷", "上菅谷", "常陸鴻巣", "瓜連", "静", "常陸大宮", "玉川村", "野上原", "山方宿", "中舟生", "下小川", "西金", "上小川", "袋田", "常陸大子", "下野宮"
    ],
    "水郡線（常陸太田方面）": [
        "南酒出", "額田", "河合", "谷川原", "常陸太田"
    ]
};

document.addEventListener('DOMContentLoaded', async () => {
    const selectBox = document.getElementById('stationModalTrigger');
    const modal = document.getElementById('stationModal');
    const closeBtn = document.getElementById('stationModalClose');
    const modalStationList = document.getElementById('modalStationList');
    const setBtn = document.getElementById('stationSetBtn');

    let userStation = "土浦"; // デフォルトの駅を設定//
    let tempSelectedStation = "土浦";

//駅ボタンを生成//
    for (const lineName in stationData) {
        const title = document.createElement('div');
        title.className = 'line-title';
        title.textContent = lineName;
        modalStationList.appendChild(title);

        const grid = document.createElement('div');
        grid.className = 'station-grid';

        stationData[lineName].forEach(station => {
            const btn = document.createElement('button');
            btn.className = 'station-btn';
            btn.textContent = station;
            btn.dataset.station = station;
            btn.addEventListener('click', () => {
                document.querySelectorAll('.station-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                tempSelectedStation = station;
            });
            grid.appendChild(btn);
        });
        modalStationList.appendChild(grid);
    }

//前回登録した駅取得//
    try {
        const res = await fetch(`${API_BASE_URL}/user/station`);
        if (res.ok) {
            const data = await res.json();
            userStation = data.stationName;
            tempSelectedStation = userStation;
        }
    } catch (error) {
        console.warn("サーバー未接続のため、デフォルト駅を使用します");
    }

//初期表示更新//
    selectBox.textContent = `${userStation}駅▼`;
    updateApp(userStation);

//モーダル表示//
    selectBox.addEventListener('click', () => {
        modal.style.display = 'flex';
        document.querySelectorAll('.station-btn').forEach(btn => {
            if (btn.dataset.station === userStation) {
                btn.classList.add('selected');
            } else {
                btn.classList.remove('selected');
            }
        });
        tempSelectedStation = userStation;
    });

//モーダル閉じる//
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

//駅設定確定//
    setBtn.addEventListener('click', async () => {
        userStation = tempSelectedStation;
        selectBox.textContent = `${userStation}駅▼`;
        modal.style.display = 'none';
        
//サーバーに登録//
        try {
            await fetch(`${API_BASE_URL}/user/station`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ stationName: userStation })
            });
        } catch (error) {
            console.error("サーバーへの登録に失敗しました", error);
        }
        updateApp(userStation);
    });
});

//データ取得・表示更新//
async function updateApp(stationName) {
    document.getElementById('userStationName').textContent = `利用駅・${stationName}駅`;
    document.getElementById('recStationName').textContent = `${stationName}駅発`;
    document.getElementById('candidateStation').textContent = stationName;
    document.getElementById('alertBanner').style.display = 'none';

    const candidateList = document.getElementById('candidateList');
    if (candidateList) {
        candidateList.innerHTML = `<p class="candidate__loading" style="text-align:center; padding: 20px; color: #666;">最新のダイヤと遅延情報を計算中</p>`;
    }

    try {
        // 遅延情報取得//
        const trainRes = await fetch(`${API_BASE_URL}/train-status?station=${stationName}`);
        if (trainRes.ok) throw new Error("遅延情報の取得に失敗しました");
        const trainData = await trainRes.json();

        //DBからバス時刻取得//
        const busRes = await fetch(`${API_BASE_URL}/bus-schedule?station=${stationName}&delay=${trainData.delayMinutes}`);
        if (busRes.ok) throw new Error("バス時刻の取得に失敗しました");
        const busData = await busRes.json();
        // データを表示
        renderUI(stationName, trainData, busData);
    } catch (error) {
        console.error("データの取得または表示に失敗しました", error);
    }
}

//画面描画//
function renderUI(stationName, trainData, busData) {
    const alertBanner = document.getElementById('alertBanner');
    const headerTag = document.getElementById('headerTag');

    //遅延バナー//
    if (trainData.delayMinutes > 0) {
        alertBanner.style.display = 'block';
        document.getElementById('alert-Text').textContent = `${trainData.delayMinutes}分遅延を反映済みです`;   
    } else {
        alertBanner.style.display = 'none';
        headerTag.textContent = "delay-0";
        document.getElementById('recStatusLabel').textContent = "平常運転の推奨プラン";
    }
    //時刻の反映//
    document.getElementById('recTrainTime').textContent = busData.recommendTrain;
    document.getElementById('resBusTime').textContent = `${busData.recommendBus}発`;

    //候補リスト//
    const candidateList = document.getElementById('candidateList');
    if (candidateList) {
        candidateList.innerHTML = busData.candidates.map(c => `
            <div style="padding: 16px 0; border-bottom:1px solid #f0f4f8;">
                <div style="font-weight: bold; font-size: 16px; margin-bottom: 8px;">
                    <span style="color: #4169e1; margin-right: 4px;"></span>${c.trainTime}発
                    <span style="font-size: 12px; color: #666; font-weight: normal; margin-left: 4px;">${stationName}駅</span>
                    </div>
                    <div style="font-size: 13px; color: #666;">
                        水戸着 ${c.arriveTime} <span style="margin: 0 8px;">→</span>
                        <span style="color: #10b981; font-weight: bold;">${c.busTime}発</span>
                    </div>
                </div>
        `).join('');
    }
}
