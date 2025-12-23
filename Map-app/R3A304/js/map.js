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
  '&acl:consumerKey=521wabbzz3hjrfr9ctx1cz7oin50dq76pvabxsrseydzpoo4vx8sr5pvdkdvw7k8'; // ←自分のトークン

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
