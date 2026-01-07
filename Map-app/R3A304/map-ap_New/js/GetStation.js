// GetStation.js
// 最寄駅を取得して地図に表示する
let stationMarker = null;    // 最寄駅

// 追跡開始
watchId = navigator.geolocation.watchPosition(
  async (pos) => {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;

    // 現在位置マーカー更新
    if (currentMarker) map.removeLayer(currentMarker);
    currentMarker = L.marker([lat, lng]).addTo(map).bindPopup('現在位置');

/*
 // ★★★ 現在位置マーカー（クリックでスカイツリー移動） ★★★
      if (currentMarker) map.removeLayer(currentMarker);
      currentMarker = L.marker([lat, lng]).addTo(map)
        .bindPopup('現在位置を追跡中<br><small>クリックで東京スカイツリーへ移動</small>')
        .on('click', function() {
          const skytreeLat = 35.710064;  // 東京スカイツリー
          const skytreeLng = 139.810699;
          
          currentMarker.setLatLng([skytreeLat, skytreeLng]);
          map.panTo([skytreeLat, skytreeLng], 16, { animate: true });
          currentMarker.bindPopup('東京スカイツリー<br>押手町1-1-2<br>現在位置追跡継続中');
        });

*/

    // ★ ODPT:Station API（JR東日本の駅一覧）
    const url =
      'https://api-challenge.odpt.org/api/v4/odpt:Station' +
      '?odpt:operator=odpt.Operator:JR-East' +
      '&acl:consumerKey=あなたのコンシューマキー';

    try {
      const res = await fetch(url);
      const stations = await res.json(); // ← ODPT は配列が返る想定

      if (!stations || stations.length === 0) return;

      // 距離計算用（簡易な球面三角法・緯度経度からメートルを算出）
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

      // 各駅との距離を計算して最小のものを探す
      let nearest = null;
      let minDist = Infinity;

      stations.forEach((st) => {
        const sLat = st['odpt:latitude'];
        const sLng = st['odpt:longitude'];
        if (typeof sLat !== 'number' || typeof sLng !== 'number') return;

        const d = distanceMeter(lat, lng, sLat, sLng);
        if (d < minDist) {
          minDist = d;
          nearest = st;
        }
      });

      if (!nearest) return;

      const sLat = nearest['odpt:latitude'];
      const sLng = nearest['odpt:longitude'];
      const sName = nearest['dc:title'] || nearest['odpt:stationTitle']; // 駅名候補。[web:43]

      if (stationMarker) map.removeLayer(stationMarker);
      stationMarker = L.marker([sLat, sLng]).addTo(map)
        .bindPopup(`最寄駅：${sName}<br>約${Math.round(minDist)}m`);

    } catch (e) {
      console.error(e);
    }
  },
  (err) => {
    console.error(err);
  },
  { enableHighAccuracy: true }
);
