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
let currentLocation = null;  // 現在の位置
let currentMarker = null;    // 現在地マーカー
let currentCircle = null;    // 現在地範囲
let allStations = [];        // 全駅データ
let nearestStationMarker = null; // 最寄り駅マーカー（強調用）

// ==========================
// 📍 現在地をリアルタイムで追跡
// ==========================
if ("geolocation" in navigator) {
  navigator.geolocation.watchPosition(
    (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const accuracy = pos.coords.accuracy;
      
      currentLocation = { lat, lng }; // ← 現在地を保存

      // 現在地マーカー更新
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

      // ✅ 最寄り駅を計算・表示（現在地が分かったら即実行）
      if (allStations.length > 0) {
        findAndHighlightNearestStation();
      }
    },
    (err) => {
      console.error("位置情報エラー", err);
      alert("現在地を取得できませんでした。");
    },
    {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 10000
    }
  );
}

// ==========================
// 🚉 駅データ取得＋最寄り駅計算
// ==========================
const API_URL =
  'https://api-challenge.odpt.org/api/v4/odpt:Station' +
  '?odpt:operator=odpt.Operator:JR-East' +
  '&acl:consumerKey=521wabbzz3hjrfr9ctx1cz7oin50dq76pvabxsrseydzpoo4vx8sr5pvdkdvw7k8';

fetch(API_URL)
  .then((res) => res.json())
  .then((stations) => {
    allStations = stations.filter(station => {
      const lat = station["geo:lat"];
      const lng = station["geo:long"];
      const name = station["odpt:stationTitle"]?.ja;
      return lat && lng && name; // 有効データのみ保存
    });

    // 全駅を通常マーカーで表示
    allStations.forEach((station) => {
      L.marker([station["geo:lat"], station["geo:long"]])
        .addTo(map)
        .bindPopup(`
          <b>${station["odpt:stationTitle"]?.ja}</b><br>
          路線: ${station["odpt:railway"] || "不明"}<br>
          駅ID: ${station["@id"]}
        `);
    });

    // 現在地が既に取得済みなら即座に最寄り駅計算
    if (currentLocation) {
      findAndHighlightNearestStation();
    }
  })
  .catch((err) => {
    console.error("駅データ取得エラー", err);
  });

// ==========================
// 🎯 最寄り駅計算関数
// ==========================
function findAndHighlightNearestStation() {
  if (!currentLocation || allStations.length === 0) return;

  let nearestStation = null;
  let minDistance = Infinity;

  // 全駅をチェックして一番近い駅を探す
  allStations.forEach((station) => {
    const stationLat = station["geo:lat"];
    const stationLng = station["geo:long"];
    
    // 直線距離計算（Haversine近似）
    const distance = getDistanceKm(
      currentLocation.lat, currentLocation.lng,
      stationLat, stationLng
    );
    
    if (distance < minDistance) {
      minDistance = distance;
      nearestStation = station;
    }
  });

  // 最寄り駅マーカーを更新・強調表示
  highlightNearestStation(nearestStation, minDistance);
}

// ==========================
// 📍 2点間の距離計算（km）
// ==========================
function getDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371; // 地球の半径（km）
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
// ⭐ 最寄り駅を強調表示
// ==========================
function highlightNearestStation(station, distanceKm) {
  const lat = station["geo:lat"];
  const lng = station["geo:long"];
  const name = station["odpt:stationTitle"]?.ja;

  // 既存の最寄り駅マーカーを削除
  if (nearestStationMarker) {
    map.removeLayer(nearestStationMarker);
  }

  // 新しい最寄り駅マーカー（オレンジで強調＋自動ポップアップ）
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
    📏 距離: ${distanceKm.toFixed(2)} km<br>
    🏃‍♂️ 徒歩: ${(distanceKm * 1000 / 80 / 60).toFixed(1)}分
  `).openPopup();
}
