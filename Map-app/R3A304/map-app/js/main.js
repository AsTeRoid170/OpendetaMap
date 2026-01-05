// ==========================
// 🗺️ 地図の初期設定
// ==========================
const map = L.map('map').setView([35.681236, 139.767125], 11);

L.tileLayer(
  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  { attribution: '© OpenStreetMap contributors' }
).addTo(map);

// ==========================
// 📍 全データ保持用変数
// ==========================
let currentLocation = null;
let currentMarker = null;
let currentCircle = null;
let allStations = [];
let nearestStationMarker = null;

// 🚗 移動手段と速度設定（m/分）
let currentMode = 'walk';
const SPEED_TABLE = {
  walk: 80,   // 徒歩 約4.8km/h
  bike: 250,  // 自転車 約15km/h
  car: 800    // 車 約48km/h
};

// ==========================
// 📅 JR東日本の時刻表データ
// ==========================
const TRAIN_TIMETABLE_URL =
  'https://api-challenge.odpt.org/api/v4/odpt:TrainTimetable' +
  '?odpt:operator=odpt.Operator:JR-East' +
  '&acl:consumerKey=521wabbzz3hjrfr9ctx1cz7oin50dq76pvabxsrseydzpoo4vx8sr5pvdkdvw7k8';

let trainTimetableByRailway = {};

// 駅から路線IDを抽出
function getRailwayId(station) {
  const raw = station['odpt:railway'];
  if (!raw) return null;
  return raw.split(':')[1];
}

// 時刻表データを取得
async function fetchTrainTimetable() {
  try {
    const res = await fetch(TRAIN_TIMETABLE_URL);
    const timetables = await res.json();
    
    trainTimetableByRailway = {};
    timetables.forEach(tt => {
      const railway = tt['odpt:railway'];
      if (!railway) return;
      const key = railway.split(':')[1];
      trainTimetableByRailway[key] = tt;
    });
    console.log('📅 時刻表データ取得完了:', Object.keys(trainTimetableByRailway).length, '路線分');
  } catch (err) {
    console.error('時刻表取得エラー', err);
  }
}

// ==========================
// 🧭 移動手段モード変更＋速度設定反映
// ==========================
document.querySelectorAll('input[name="mode"]').forEach((input) => {
  input.addEventListener('change', (e) => {
    currentMode = e.target.value;
    updateSpeedTableFromInputs();
    if (currentLocation && allStations.length > 0) {
      findAndHighlightNearestStation();
    }
  });
});

// ==========================
// 🚀 速度設定フォームのボタンイベント
// ==========================
const applySpeedButton = document.getElementById('apply-speed');
if (applySpeedButton) {
  applySpeedButton.addEventListener('click', () => {
    updateSpeedTableFromInputs();
    if (currentLocation && allStations.length > 0) {
      findAndHighlightNearestStation();
    }
  });
}

// ==========================
// ⚙️ 入力フォームから速度テーブル更新
// ==========================
function updateSpeedTableFromInputs() {
  const walk = Number(document.getElementById('speed-walk')?.value);
  const bike = Number(document.getElementById('speed-bike')?.value);
  const car = Number(document.getElementById('speed-car')?.value);

  if (walk > 0) SPEED_TABLE.walk = walk;
  if (bike > 0) SPEED_TABLE.bike = bike;
  if (car > 0) SPEED_TABLE.car = car;

  console.log("🚀 現在の速度設定:", SPEED_TABLE);
}

// ==========================
// 📍 現在地をリアルタイムで追跡
// ==========================
if ("geolocation" in navigator) {
  navigator.geolocation.watchPosition(
    (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const accuracy = pos.coords.accuracy;
      
      currentLocation = { lat, lng };

      const latlng = [lat, lng];
      if (!currentMarker) {
        currentMarker = L.marker(latlng)
          .addTo(map)
          .bindPopup("📍リアルタイム現在地");
        currentCircle = L.circle(latlng, {
          radius: accuracy,
          color: "blue",
          fillColor: "lightblue",
          fillOpacity: 0.3
        }).addTo(map);
        map.setView(latlng, 15);
      } else {
        currentMarker.setLatLng(latlng);
        currentCircle.setLatLng(latlng);
        currentCircle.setRadius(accuracy);
      }

      if (allStations.length > 0) {
        findAndHighlightNearestStation();
      }
    },
    (err) => {
      console.error("位置情報エラー", err);
      alert("現在地を取得できませんでした。");
      map.setView([35.681236, 139.767125], 13);
    },
    {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 10000
    }
  );
}

// ==========================
// 🚉 駅データ + 時刻表データを同時取得
// ==========================
const STATION_API_URL =
  'https://api-challenge.odpt.org/api/v4/odpt:Station' +
  '?odpt:operator=odpt.Operator:JR-East' +
  '&acl:consumerKey=521wabbzz3hjrfr9ctx1cz7oin50dq76pvabxsrseydzpoo4vx8sr5pvdkdvw7k8';

async function initData() {
  try {
    // 駅データと時刻表データを同時取得
    const [stationsRes, timetableRes] = await Promise.all([
      fetch(STATION_API_URL),
      fetch(TRAIN_TIMETABLE_URL)
    ]);

    const stations = await stationsRes.json();
    const timetables = await timetableRes.json();

    // 駅データをフィルタリング
    allStations = stations.filter(station => {
      const lat = station["geo:lat"];
      const lng = station["geo:long"];
      const name = station["odpt:stationTitle"]?.ja;
      return lat && lng && name;
    });

    // 時刻表データを路線IDでマッピング
    timetables.forEach(tt => {
      const railway = tt['odpt:railway'];
      if (!railway) return;
      const key = railway.split(':')[1];
      trainTimetableByRailway[key] = tt;
    });

    console.log('📅 時刻表データ取得完了:', Object.keys(trainTimetableByRailway).length, '路線分');

    // 駅マーカーを描画（時刻表情報付き）
    allStations.forEach((station) => {
      const railwayId = getRailwayId(station);
      const timetable = railwayId ? trainTimetableByRailway[railwayId] : null;

      let timetableText = '時刻表なし';
      if (timetable) {
        timetableText = timetable['dc:title']?.ja || 
                       timetable['owl:sameAs'] || 
                       '時刻表取得済み';
      }

      L.marker([station["geo:lat"], station["geo:long"]])
        .addTo(map)
        .bindPopup(`
          <b>${station["odpt:stationTitle"]?.ja}</b><br>
          路線: ${railwayId || "不明"}<br>
          📅 ${timetableText}<br>
          駅ID: ${station["@id"]}
        `);
    });

    // 現在地があれば最寄り駅を計算
    if (currentLocation) {
      findAndHighlightNearestStation();
    }
  } catch (err) {
    console.error("データ取得エラー", err);
  }
}

// 初期化実行
initData();

// ==========================
// 🎯 最寄り駅の計算
// ==========================
function findAndHighlightNearestStation() {
  if (!currentLocation || allStations.length === 0) return;

  let nearestStation = null;
  let minDistance = Infinity;

  allStations.forEach((station) => {
    const stationLat = station["geo:lat"];
    const stationLng = station["geo:long"];
    
    const distance = getDistanceKm(
      currentLocation.lat, currentLocation.lng,
      stationLat, stationLng
    );
    
    if (distance < minDistance) {
      minDistance = distance;
      nearestStation = station;
    }
  });

  highlightNearestStation(nearestStation, minDistance);
}

// ==========================
// 📏 2点間の距離計算（km）
// ==========================
function getDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// ==========================
// 🚶‍♀️ 所要時間を計算＆整形
// ==========================
function getTravelTimeText(distanceKm, mode) {
  const speedMperMin = SPEED_TABLE[mode] || SPEED_TABLE.walk;
  const distanceM = distanceKm * 1000;
  const totalMin = distanceM / speedMperMin;

  const hours = Math.floor(totalMin / 60);
  const minutes = Math.round(totalMin % 60);

  if (hours > 0) {
    return `${hours}時間${minutes}分`;
  } else {
    return `${minutes}分`;
  }
}

// ==========================
// ⭐ 最寄り駅強調表示（時刻表情報付き）
// ==========================
function highlightNearestStation(station, distanceKm) {
  const lat = station["geo:lat"];
  const lng = station["geo:long"];
  const name = station["odpt:stationTitle"]?.ja;
  const railwayId = getRailwayId(station);
  const timetable = railwayId ? trainTimetableByRailway[railwayId] : null;

  let timetableText = '時刻表なし';
  if (timetable) {
    timetableText = timetable['dc:title']?.ja || '時刻表取得済み';
  }

  if (nearestStationMarker) {
    map.removeLayer(nearestStationMarker);
  }

  let modeLabel = '徒歩';
  if (currentMode === 'bike') modeLabel = '自転車';
  if (currentMode === 'car') modeLabel = '車';

  const travelTime = getTravelTimeText(distanceKm, currentMode);

  nearestStationMarker = L.marker([lat, lng], {
    icon: L.divIcon({
      className: 'nearest-station-icon',
      html: '⭐',
      iconSize: [30, 30]
    })
  })
  .addTo(map)
  .bindPopup(`
    <b>🎯 最寄り駅</b><br>
    ${name}<br>
    路線: ${railwayId || '不明'}<br>
    📅 ${timetableText}<br>
    📏 距離: ${distanceKm.toFixed(2)} km<br>
    🚙 手段: ${modeLabel}<br>
    ⏱ 所要時間: ${travelTime}
  `).openPopup();
}
