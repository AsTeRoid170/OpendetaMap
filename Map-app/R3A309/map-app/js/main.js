const statusEl = document.getElementById('status');
const map = L.map('map').setView([35.681236, 139.767125], 11);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

function searchRoute(mode) {
  if (!currentPosition || !nearestStation) {
    alert('位置情報または最寄り駅が取得できていません');
    return;
  }

  if (routeLine) map.removeLayer(routeLine);

  const modeConfig = {
    walking: { color: 'green', emoji: '🚶', name: '徒歩', speed: 75 },     // m/min
    cycling: { color: 'orange', emoji: '🚲', name: '自転車', speed: 266.7 }, // m/min
    driving: { color: 'red', emoji: '🚗', name: '車', speed: 666.7 }        // m/min
  };

  const config = modeConfig[mode];
  statusEl.textContent = `${config.name}ルートを検索中...`;

  const osrmUrl = `https://router.project-osrm.org/route/v1/${mode}/${currentPosition.lon},${currentPosition.lat};${nearestStation.lng},${nearestStation.lat}?geometries=geojson&overview=full`;

  fetch(osrmUrl)
    .then(res => res.json())
    .then(data => {
      if (data.routes?.[0]) {
        const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
        routeLine = L.polyline(coords, { color: config.color, weight: 6, opacity: 0.8 }).addTo(map);

        const distance = data.routes[0].distance; // m
const timeMin = Math.round(distance / config.speed); // 分単位（距離 ÷ 分速）
statusEl.textContent =
  `${config.emoji}${config.name}: ${(distance / 1000).toFixed(2)} km (${timeMin}分)`;
        map.fitBounds(routeLine.getBounds());
      } else {
        statusEl.textContent = `${config.name}ルートの取得に失敗しました`;
      }
    })
    .catch(err => {
      console.error('ルート検索エラー:', err);
      statusEl.textContent = `ルート取得エラー`;
    });
}




// アイコン定義
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

// グローバル変数
let stationMarkers = [];
let allStations = [];
let currentMarker = null;
let currentPosition = null;
let nearestStation = null;
let routeLine = null;
let watchId = null;

// 駅データ取得（既存）
const API_URL = 'https://api-challenge.odpt.org/api/v4/odpt:Station?odpt:operator=odpt.Operator:JR-East&acl:consumerKey=0xq6l301kpk4mqpr77qw1q054dhc2g79siahknmkwo4rnke81xnfgz1853jxpp42';
fetch(API_URL).then(res => res.json()).then(stations => {
  allStations = stations;
  stations.forEach(station => {
    const lat = station['geo:lat'], lng = station['geo:long'], name = station['odpt:stationTitle']?.ja;
    if (!lat || !lng || !name) return;
    const marker = L.marker([lat, lng], { icon: blueIcon }).addTo(map);
    marker.bindPopup(name);
    stationMarkers.push({ marker, lat, lng, name, station });
  });
});

// ===== ① 常時最寄り駅監視（watchPosition） =====
navigator.geolocation.watchPosition(
  (pos) => {
    const lat = pos.coords.latitude, lon = pos.coords.longitude;
    currentPosition = { lat, lon };

    // 現在位置マーカー
    if (!currentMarker) {
      currentMarker = L.marker([lat, lon], { icon: blueIcon }).addTo(map);
      currentMarker.bindPopup('あなたの現在位置');
    } else {
      currentMarker.setLatLng([lat, lon]);
    }

    // 最寄り駅計算
    findNearestStation(lat, lon);
  },
  err => statusEl.textContent = '位置情報エラー: ' + err.message
);

// 最寄り駅計算関数
function findNearestStation(lat, lon) {
  let minDist = Infinity, nearest = null;
  stationMarkers.forEach(entry => {
    const dist = getDistance(lat, lon, entry.lat, entry.lng);
    if (dist < minDist) {
      minDist = dist;
      nearest = entry;
    }
  });

  if (nearest) {
    nearestStation = nearest;
    updateNearestMarker(nearest);
    statusEl.textContent = `最寄り: ${nearest.name} (${minDist.toFixed(0)}m)`;
  }
}

// 距離計算
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI/180, φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180, Δλ = (lon2-lon1) * Math.PI/180;
  const a = Math.sin(Δφ/2)*Math.sin(Δφ/2) + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)*Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// マーカー色更新
function updateNearestMarker(nearest) {
  stationMarkers.forEach(entry => {
    entry.marker.setIcon(entry === nearest ? redIcon : blueIcon);
  });
}

// DOM読み込み完了を待ってからボタンイベント登録
document.addEventListener('DOMContentLoaded', () => {
  const walkBtn = document.getElementById('walkBtn');
  const bikeBtn = document.getElementById('bikeBtn');
  const driveBtn = document.getElementById('driveBtn');
  
  if (walkBtn) {
    walkBtn.addEventListener('click', () => {
      console.log('徒歩ボタンクリック！');  // デバッグ用
      searchRoute('walking');
    });
  } else {
    console.error('walkBtnが見つかりません');
  }
  
  if (bikeBtn) {
    bikeBtn.addEventListener('click', () => {
      console.log('自転車ボタンクリック！');  // デバッグ用
      searchRoute('cycling');
    });
  } else {
    console.error('bikeBtnが見つかりません');
  }

  if (driveBtn) {
    driveBtn.addEventListener('click', () => {
      console.log('車ボタンクリック！');  // デバッグ用
      searchRoute('driving');
    });
  } else {
    console.error('driveBtnが見つかりません');
  }
});
