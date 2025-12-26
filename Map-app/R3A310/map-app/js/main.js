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


// ===== ODPT の駅一覧を先に取得しておく =====
const API_URL =
  'https://api-challenge.odpt.org/api/v4/odpt:Station' +
  '?odpt:operator=odpt.Operator:JR-East' +
  '&acl:consumerKey=1ehr2tinii4eomlmzwqgxhhy70j6harphkpjl2sheg2948iqki4nzweqnhbu551a'; // ←自分のキーに変更

fetch(API_URL)
  .then(res => res.json())
  .then(stations => {
    odptStations = stations; // 配列のまま保持
    console.log('駅データ取得件数:', odptStations.length);
  })
  .catch(err => {
    console.error('駅データ取得エラー', err);
  });


// ===== 距離計算関数（メートル） =====
function distanceMeter(lat1, lon1, lat2, lon2) {
  const R = 6371000; // 地球半径[m]
  const toRad = (d) => d * Math.PI / 180;
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}


// ===== 最寄駅を求める関数 =====
function findNearestStation(lat, lng) {
  if (!odptStations || odptStations.length === 0) {
    return null;
  }

  let nearest = null;
  let minDist = Infinity;

  odptStations.forEach(st => {
    // ODPT の緯度・経度：仕様により geo:lat / geo:long または odpt:latitude / odpt:longitude
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


// ===== 位置追跡開始 =====
function startWatch() {
  if (!('geolocation' in navigator)) {
    alert('このブラウザは位置情報取得に対応していません。');
    return;
  }

  const options = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0
  };

  watchId = navigator.geolocation.watchPosition(
    (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;

      // 地図中心を合わせる（初回のみ）
      if (!currentMarker) {
        map.setView([lat, lng], 16);
      }

      // 現在位置マーカー更新
      if (currentMarker) {
        map.removeLayer(currentMarker);
      }
      currentMarker = L.marker([lat, lng])
        .addTo(map)
        .bindPopup('現在位置を追跡中');

      // ===== 最寄駅を計算してマーカー更新 =====
      const nearest = findNearestStation(lat, lng);
      if (!nearest) return;

      const stObj = nearest.station;
      const sLat = nearest.lat;
      const sLng = nearest.lng;

      // 駅名（日本語） 例: odpt:stationTitle: { ja: "東京" }
      const titleObj = stObj['odpt:stationTitle'];
      const sName =
        (titleObj && (titleObj.ja || titleObj['ja-Hrkt'])) ||
        stObj['dc:title'] ||
        '駅';

      if (stationMarker) {
        map.removeLayer(stationMarker);
      }

      stationMarker = L.marker([sLat, sLng])
        .addTo(map)
        .bindPopup(`最寄駅：${sName}<br>約${Math.round(nearest.dist)}m`);

    },
    (err) => {
      console.error(err);
      alert('位置情報の追跡に失敗しました。権限やGPSの設定を確認してください。');
    },
    options
  );
}


// ===== 位置追跡停止 =====
function stopWatch() {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
}


// ページ読み込み時に自動で追跡開始
startWatch();
