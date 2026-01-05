let isRouteEnabled = true;
let currentLat = null;
let currentLng = null;

// ===== 地図表示 =====
const map = L.map('map').setView([35.681236, 139.767125], 11);

L.tileLayer(
  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  { attribution: '© OpenStreetMap contributors' }
).addTo(map);

// ===== ルートON/OFF =====
const routeToggleBtn = document.getElementById('routeToggle');

routeToggleBtn.addEventListener('click', () => {
  isRouteEnabled = !isRouteEnabled;
  routeToggleBtn.textContent =
    isRouteEnabled ? 'ルート表示：ON' : 'ルート表示：OFF';

  if (!isRouteEnabled) {
    clearRoute();
  }
});

// ===== 駅データ =====
let stationsData = [];

const API_URL =
  'https://api-challenge.odpt.org/api/v4/odpt:Station' +
  '?odpt:operator=odpt.Operator:JR-East' +
  '&acl:consumerKey=fmig1fzk4tflkt40zz4u43z5sg3xrs53jlytlin6numuleq142eqr7ezzxkui28v';

fetch(API_URL)
  .then(res => res.json())
  .then(stations => {
    stationsData = stations;

    stations.forEach(station => {
      const lat = station['geo:lat'];
      const lng = station['geo:long'];
      const name = station['odpt:stationTitle']?.ja;

      if (!lat || !lng || !name) return;

      L.marker([lat, lng])
        .addTo(map)
        .bindPopup(name);
    });
  });

// ===== 現在地 & 最寄り駅 =====
let nearestMarker = null;

navigator.geolocation.watchPosition(position => {
  const myLat = position.coords.latitude;
  const myLng = position.coords.longitude;

  currentLat = myLat;
  currentLng = myLng;

  let nearestStation = null;
  let minDistance = Infinity;

  stationsData.forEach(station => {
    const lat = station['geo:lat'];
    const lng = station['geo:long'];
    const distance = calcDistance(myLat, myLng, lat, lng);

    if (distance < minDistance) {
      minDistance = distance;
      nearestStation = station;
    }
  });

  if (!nearestStation) return;

  const stationLat = nearestStation['geo:lat'];
  const stationLng = nearestStation['geo:long'];
  const stationName = nearestStation['odpt:stationTitle']?.ja;

  // 既存表示を消す
if (nearestMarker) map.removeLayer(nearestMarker);

// 最寄り駅マーカー
nearestMarker = L.marker([stationLat, stationLng], {
  icon: L.divIcon({ html: '🚉', className: '' })
})
  .addTo(map)
  .bindPopup(
    `最寄り駅：${stationName}<br>距離：約${Math.round(minDistance)}m`
  );

// 徒歩ルートだけ表示
drawWalkingRoute(
  myLat,
  myLng,
  stationLat,
  stationLng
);

});

// ===== 距離計算 =====
function calcDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = deg => deg * Math.PI / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
