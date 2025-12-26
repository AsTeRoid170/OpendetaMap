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
    stations.forEach(station => {
      // 緯度・経度（ODPTの形式）
      const lat = station['geo:lat'];
      const lng = station['geo:long'];

      // 駅名（日本語）
      const name = station['odpt:stationTitle']?.ja;

      // 念のためチェック
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

fetch(API_URL)
  .then(res => res.json())
  .then(stations => {
    stationsData = stations; // ← 保存しておく

    stations.forEach(station => {
      const lat = station['geo:lat'];
      const lng = station['geo:long'];
      const name = station['odpt:stationTitle']?.ja;

      L.marker([lat, lng])
        .addTo(map)
        .bindPopup(name);
    });
  });


let nearestMarker = null;
let nearestLine = null;

navigator.geolocation.watchPosition(position => {
  const myLat = position.coords.latitude;
  const myLng = position.coords.longitude;

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
