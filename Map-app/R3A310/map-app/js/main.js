// ===== 地図の初期化 =====
const map = L.map('map').setView([35.681236, 139.767125], 11);
L.tileLayer(
  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  { attribution: '© OpenStreetMap contributors' }
).addTo(map);


// ===== 変数定義 =====
let currentMarker = null;   // 現在位置マーカー
let stationMarker = null;   // 最寄駅マーカー
let watchId = null;         // 位置追跡ID
let odptStations = [];      // ODPT の駅一覧キャッシュ


// ===== ODPT 駅データ取得 =====
const API_URL =
  'https://api-challenge.odpt.org/api/v4/odpt:Station' +
  '?odpt:operator=odpt.Operator:JR-East' +
  '&acl:consumerKey=1ehr2tinii4eomlmzwqgxhhy70j6harphkpjl2sheg2948iqki4nzweqnhbu551a'; // ←自分のキー

fetch(API_URL)
  .then(res => res.json())
  .then(stations => {
    odptStations = stations;
    console.log('駅データ取得件数:', odptStations.length);
  })
  .catch(err => console.error('駅データ取得エラー', err));


// ===== 距離計算 [m] =====
function distanceMeter(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (d) => d * Math.PI / 180;
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);

  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}


// ===== 駅検索 =====
function findNearestStation(lat, lng) {
  if (!odptStations?.length) return null;
  let nearest = null;
  let minDist = Infinity;

  odptStations.forEach(st => {
    const sLat = st['geo:lat'] ?? st['odpt:latitude'];
    const sLng = st['geo:long'] ?? st['odpt:longitude'];
    if (typeof sLat !== 'number' || typeof sLng !== 'number') return;

    const d = distanceMeter(lat, lng, sLat, sLng);
    if (d < minDist) {
      minDist = d;
      nearest = { station: st, dist: d, lat: sLat, lng: sLng };
    }
  });

  return nearest;
}


// ===== 所要時間計算 =====
function calculateTravelTime(currentLat, currentLng, stationLat, stationLng, mode = 'walk') {
  const distance = distanceMeter(currentLat, currentLng, stationLat, stationLng);
  switch(mode) {
    case 'walk':  return Math.round(distance / 80); // 徒歩80m/分[web:74][web:76]
    case 'bike':  return Math.round(distance / (20 * 1000 / 60)); // 自転車20km/h
    case 'car':   return Math.round(distance / (40 * 1000 / 60)); // 車40km/h
    case 'train':
      const stationCount = Math.max(1, Math.round(distance / 1500)); // 1.5km=1駅
      return Math.round(stationCount * 2); // 都市部: 1駅2分[web:72][web:73]
    default: return Math.round(distance / 80);
  }
}


// ===== 追跡開始 =====
function startWatch() {
  if (!('geolocation' in navigator)) {
    alert('位置情報が利用できません。');
    return;
  }

  const options = { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 };

  watchId = navigator.geolocation.watchPosition(
    (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;

      // 現在位置マーカー
      if (currentMarker) map.removeLayer(currentMarker);
      currentMarker = L.marker([lat, lng]).addTo(map)
        .bindPopup('現在位置を追跡中');
      if (!stationMarker) map.setView([lat, lng], 16);

      

      // 最近駅を取得
      const nearest = findNearestStation(lat, lng);
      if (!nearest) return;
      const stObj = nearest.station;
      const sName =
        stObj['odpt:stationTitle']?.ja ||
        stObj['dc:title'] || '駅';

      // 各交通手段の時間
      const walkTime  = calculateTravelTime(lat, lng, nearest.lat, nearest.lng, 'walk');
      const bikeTime  = calculateTravelTime(lat, lng, nearest.lat, nearest.lng, 'bike');
      const carTime   = calculateTravelTime(lat, lng, nearest.lat, nearest.lng, 'car');
      const trainTime = calculateTravelTime(lat, lng, nearest.lat, nearest.lng, 'train');
      const distanceKm = (nearest.dist / 1000).toFixed(2);

      // 最寄駅マーカー作成
      if (stationMarker) map.removeLayer(stationMarker);
      stationMarker = L.marker([nearest.lat, nearest.lng]).addTo(map)
        .bindPopup(`
          <b>最寄駅：${sName}</b><br>
          📏 距離: ${distanceKm} km<br>
          🚶 徒歩: ${walkTime} 分<br>
          🚲 自転車: ${bikeTime} 分<br>
          🚗 車: ${carTime} 分<br>
          🚃 電車: ${trainTime} 分
        `);
    },
    (err) => console.error('追跡エラー', err),
    options
  );
}


// ===== 停止 =====
function stopWatch() {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
}


// ===== デフォルトで追跡ON =====
window.addEventListener('load', startWatch);
