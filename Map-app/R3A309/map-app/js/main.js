// ステータス表示要素
const statusEl = document.getElementById('status');

// 初期地図（東京駅を中心）
const map = L.map('map').setView([35.681236, 139.767125], 11);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// ====== 駅APIデータを追加 ======
const API_URL =
  'https://api-challenge.odpt.org/api/v4/odpt:Station' +
  '?odpt:operator=odpt.Operator:JR-East' +
  '&acl:consumerKey=0xq6l301kpk4mqpr77qw1q054dhc2g79siahknmkwo4rnke81xnfgz1853jxpp42';

fetch(API_URL)
  .then(res => res.json())
  .then(stations => {
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
  .catch(err => console.error('駅データ取得エラー', err));

// ====== 現在位置を取得 ======
if (!navigator.geolocation) {
  statusEl.textContent = 'このブラウザは位置情報取得に対応していません。';
} else {
  statusEl.textContent = '現在位置を取得しています...';

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      const acc = position.coords.accuracy;

      statusEl.textContent =
        `現在位置を取得しました。緯度: ${lat}, 経度: ${lon}（精度 約${Math.round(acc)}m）`;

      // 中心を現在位置に移動
      map.setView([lat, lon], 15);

      // 現在位置をマーカーで表示
      const marker = L.marker([lat, lon]).addTo(map);
      marker.bindPopup('あなたの現在位置').openPopup();

      // 精度の円
      /**L.circle([lat, lon], {
        radius: acc,
        color: 'blue',
        fillColor: '#3f51b5',
        fillOpacity: 0.2
      }).addTo(map);**/
    },
    (error) => {
      switch (error.code) {
        case error.PERMISSION_DENIED:
          statusEl.textContent = '位置情報の取得が拒否されました。';
          break;
        case error.POSITION_UNAVAILABLE:
          statusEl.textContent = '位置情報を取得できませんでした。';
          break;
        case error.TIMEOUT:
          statusEl.textContent = '位置情報の取得がタイムアウトしました。';
          break;
        default:
          statusEl.textContent = '不明なエラーが発生しました。';
      }
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  );
}