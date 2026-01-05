const statusEl = document.getElementById('status');

/* ================= 地図初期化 ================= */
const map = L.map('map').setView([35.681236, 139.767125], 11);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

/* ================= ルート検索 ================= */
function searchRoute(mode) {
  if (!currentPosition || !nearestStation) {
    alert('位置情報または最寄り駅が取得できていません');
    return;
  }

  if (routeLine) map.removeLayer(routeLine);

  const modeConfig = {
    walking:  { color: 'green',  emoji: '🚶', name: '徒歩',   speed: 75 },
    cycling:  { color: 'orange', emoji: '🚲', name: '自転車', speed: 266.7 },
    driving:  { color: 'red',    emoji: '🚗', name: '車',     speed: 666.7 }
  };

  const config = modeConfig[mode];
  statusEl.textContent = `${config.name}ルートを検索中...`;

  const osrmUrl =
    `https://router.project-osrm.org/route/v1/${mode}/` +
    `${currentPosition.lon},${currentPosition.lat};` +
    `${nearestStation.lng},${nearestStation.lat}` +
    `?geometries=geojson&overview=full`;

  fetch(osrmUrl)
    .then(res => res.json())
    .then(data => {
      if (!data.routes?.[0]) {
        statusEl.textContent = `${config.name}ルート取得失敗`;
        return;
      }

      const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
      routeLine = L.polyline(coords, {
        color: config.color,
        weight: 6,
        opacity: 0.8
      }).addTo(map);

      const distance = data.routes[0].distance;
      const timeMin = Math.round(distance / config.speed);
      statusEl.textContent =
        `${config.emoji}${config.name}: ${(distance / 1000).toFixed(2)} km (${timeMin}分)`;

      map.fitBounds(routeLine.getBounds());
    })
    .catch(err => {
      console.error(err);
      statusEl.textContent = 'ルート取得エラー';
    });
}

/* ================= アイコン ================= */
const blueIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41]
});

const redIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41]
});

const trainIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3448/3448339.png',
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

/* ================= グローバル ================= */
let stationMarkers = [];
let stationCoordMap = {};   // ★ 追加：駅ID → 座標
let currentMarker = null;
let currentPosition = null;
let nearestStation = null;
let routeLine = null;

let trainMarkers = [];
let trainTimer = null;

/* ================= 駅データ取得 ================= */
const STATION_API =
  'https://api-challenge.odpt.org/api/v4/odpt:Station' +
  '?odpt:operator=odpt.Operator:JR-East' +
  '&acl:consumerKey=0xq6l301kpk4mqpr77qw1q054dhc2g79siahknmkwo4rnke81xnfgz1853jxpp42';

fetch(STATION_API)
  .then(res => res.json())
  .then(stations => {
    stations.forEach(st => {
      const lat = st['geo:lat'];
      const lng = st['geo:long'];
      const name = st['odpt:stationTitle']?.ja;
      if (!lat || !lng || !name) return;

      const marker = L.marker([lat, lng], { icon: blueIcon })
        .addTo(map)
        .bindPopup(name);

      stationMarkers.push({ marker, lat, lng, name });
      stationCoordMap[st['@id']] = { lat, lng }; // ★ 駅IDマップ
    });
  });

/* ================= 現在位置 ================= */
navigator.geolocation.watchPosition(
  pos => {
    const lat = pos.coords.latitude;
    const lon = pos.coords.longitude;
    currentPosition = { lat, lon };

    if (!currentMarker) {
      currentMarker = L.marker([lat, lon], { icon: blueIcon })
        .addTo(map)
        .bindPopup('あなたの現在位置');
    } else {
      currentMarker.setLatLng([lat, lon]);
    }

    findNearestStation(lat, lon);
  },
  err => statusEl.textContent = '位置情報エラー: ' + err.message
);

/* ================= 最寄駅 ================= */
function findNearestStation(lat, lon) {
  let minDist = Infinity;
  let nearest = null;

  stationMarkers.forEach(s => {
    const d = getDistance(lat, lon, s.lat, s.lng);
    if (d < minDist) {
      minDist = d;
      nearest = s;
    }
  });

  if (nearest) {
    nearestStation = nearest;
    updateNearestMarker(nearest);
    statusEl.textContent = `最寄り: ${nearest.name} (${minDist.toFixed(0)}m)`;
  }
}

/* ================= 距離計算 ================= */
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function updateNearestMarker(nearest) {
  stationMarkers.forEach(s =>
    s.marker.setIcon(s === nearest ? redIcon : blueIcon)
  );
}

/* ================= 列車位置（推定） ================= */
function updateTrainPositions() {
  const TRAIN_API =
    'https://api-challenge.odpt.org/api/v4/odpt:Train' +
    '?odpt:operator=odpt.Operator:JR-East' +
    '&odpt:railway=odpt.Railway:JR-East.Yamanote' +
    '&acl:consumerKey=0xq6l301kpk4mqpr77qw1q054dhc2g79siahknmkwo4rnke81xnfgz1853jxpp42';

  fetch(TRAIN_API)
    .then(res => res.json())
    .then(trains => {
      trainMarkers.forEach(m => map.removeLayer(m));
      trainMarkers = [];

      trains.forEach(t => {
        const from = stationCoordMap[t['odpt:fromStation']];
        const to   = stationCoordMap[t['odpt:toStation']];
        if (!from || !to) return;

        const lat = (from.lat + to.lat) / 2;
        const lng = (from.lng + to.lng) / 2;

        const marker = L.marker([lat, lng], { icon: trainIcon })
          .addTo(map)
          .bindPopup('🚆 山手線（推定位置）');

        trainMarkers.push(marker);
      });
    })
    .catch(err => console.error('列車取得エラー', err));
}

/* ================= 起動 ================= */
updateTrainPositions();
trainTimer = setInterval(updateTrainPositions, 30000);

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('walkBtn')?.addEventListener('click', () => searchRoute('walking'));
  document.getElementById('bikeBtn')?.addEventListener('click', () => searchRoute('cycling'));
  document.getElementById('driveBtn')?.addEventListener('click', () => searchRoute('driving'));
});
