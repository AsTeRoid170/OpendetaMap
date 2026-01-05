let isRouteEnabled = true;
let currentLat = null;
let currentLng = null;

// ===== 徒歩ルート用 =====
let routeLine = null;
let routePopup = null;

const routeToggleBtn = document.getElementById('routeToggle');


// 地図表示
const map = L.map('map').setView([35.681236, 139.767125], 11);

L.tileLayer(
  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  { attribution: '© OpenStreetMap contributors' }
).addTo(map);


// ====== ここから駅API ======
const API_URL =
  'https://api-challenge.odpt.org/api/v4/odpt:Station' +
  '?odpt:operator=odpt.Operator:JR-East' +
  '&acl:consumerKey=fmig1fzk4tflkt40zz4u43z5sg3xrs53jlytlin6numuleq142eqr7ezzxkui28v'; // ←自分のトークン

fetch(API_URL)
  .then(res => res.json())
  .then(stations => {

    // ★ これを追加（超重要）
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
  })
  .catch(err => {
    console.error('駅データ取得エラー', err);
  });



let stationsData = [];




let nearestMarker = null;
let nearestLine = null;

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
  if (nearestLine) map.removeLayer(nearestLine);

  // 最寄り駅マーカー
  nearestMarker = L.marker([stationLat, stationLng], {
    icon: L.divIcon({ html: '🚉', className: '' })
  })
    .addTo(map)
    .bindPopup(
      `最寄り駅：${stationName}<br>距離：約${Math.round(minDistance)}m`
    );

  // 現在地 → 駅の線
  nearestLine = L.polyline(
    [[myLat, myLng], [stationLat, stationLng]],
    { color: 'red' }
  ).addTo(map);

  drawWalkingRoute(
  myLat,
  myLng,
  stationLat,
  stationLng
);
});





// 緯度経度から距離（m）を計算
function calcDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000; // 地球半径(m)
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

function drawWalkingRoute(startLat, startLng, endLat, endLng) {

  if (!isRouteEnabled) return;
  if (
    typeof startLat !== 'number' ||
    typeof startLng !== 'number' ||
    typeof endLat !== 'number' ||
    typeof endLng !== 'number'
  ) return;

  const url =
    `https://router.project-osrm.org/route/v1/foot/` +
    `${startLng},${startLat};${endLng},${endLat}` +
    `?overview=full&geometries=geojson`;

  fetch(url)
    .then(res => res.json())
    .then(data => {
      if (!data.routes || data.routes.length === 0) return;

      const route = data.routes[0];
      const coords = route.geometry.coordinates.map(c => [c[1], c[0]]);
      const durationMin = Math.round(route.duration / 60);

      clearRoute();

      routeLine = L.polyline(coords, {
        color: 'blue',
        weight: 5
      }).addTo(map);

      routePopup = L.popup()
        .setLatLng(coords[Math.floor(coords.length / 2)])
        .setContent(`🚶 徒歩 約${durationMin}分`)
        .openOn(map);
    });
}




routeToggleBtn.addEventListener('click', () => {
  isRouteEnabled = !isRouteEnabled;

  routeToggleBtn.textContent =
    isRouteEnabled ? 'ルート表示：ON' : 'ルート表示：OFF';

  if (!isRouteEnabled) {
    clearRoute();
  }
});

function clearRoute() {
  if (routeLine) {
    map.removeLayer(routeLine);
    routeLine = null;
  }
  if (routePopup) {
    map.removeLayer(routePopup);
    routePopup = null;
  }
}
