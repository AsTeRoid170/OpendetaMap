// ===== 地図の初期化 =====
const map = L.map('map').setView([35.681236, 139.767125], 11);
L.tileLayer(
  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  { attribution: '© OpenStreetMap contributors' }
).addTo(map);

// 路線ID → 日本語名のマスタ
const RAILWAY_NAME_MAP = {
  "odpt.Railway:JR-East.Agatsuma": "吾妻線",
  "odpt.Railway:JR-East.ChuoRapid": "中央線（快速）",
  "odpt.Railway:JR-East.Joetsu": "上越線",
  "odpt.Railway:JR-East.ChuoSobuLocal": "中央・総武線（各駅停車）",
  "odpt.Railway:JR-East.Itsukaichi": "五日市線",
  "odpt.Railway:JR-East.Hachiko": "八高線",
  "odpt.Railway:JR-East.Ito": "伊東線",
  "odpt.Railway:JR-East.Joban": "常磐線",
  "odpt.Railway:JR-East.JobanLocal": "常磐線（各駅停車）",
  "odpt.Railway:JR-East.JobanRapid": "常磐快速線",
  "odpt.Railway:JR-East.Kashima": "鹿島線",
  "odpt.Railway:JR-East.Kawagoe": "川越線",
  "odpt.Railway:JR-East.KeihinTohokuNegishi": "京浜東北・根岸線",
  "odpt.Railway:JR-East.Kururi": "久留里線",
  "odpt.Railway:JR-East.Keiyo": "京葉線",
  "odpt.Railway:JR-East.Musashino": "武蔵野線",
  "odpt.Railway:JR-East.Nambu": "南武線",
  "odpt.Railway:JR-East.NambuBranch": "南武線（支線）",
  "odpt.Railway:JR-East.Narita": "成田線",
  "odpt.Railway:JR-East.NaritaAbikoBranch": "成田線（我孫子支線）",
  "odpt.Railway:JR-East.NaritaAirportBranch": "成田線（空港支線）",
  "odpt.Railway:JR-East.Ome": "青梅線",
  "odpt.Railway:JR-East.Sagami": "相模線",
  "odpt.Railway:JR-East.Tsurumi": "鶴見線",
  "odpt.Railway:JR-East.SaikyoKawagoe": "埼京線・川越線",
  "odpt.Railway:JR-East.ShonanShinjuku": "湘南新宿ライン",
  "odpt.Railway:JR-East.SobuRapid": "総武快速線",
  "odpt.Railway:JR-East.SotetsuDirect": "相鉄直通線",
  "odpt.Railway:JR-East.Sotobo": "外房線",
  "odpt.Railway:JR-East.Takasaki": "高崎線",
  "odpt.Railway:JR-East.Togane": "東金線",
  "odpt.Railway:JR-East.Tokaido": "東海道線",
  "odpt.Railway:JR-East.TsurumiOkawaBranch": "鶴見線（大川支線）",
  "odpt.Railway:JR-East.TsurumiUmiShibauraBranch": "鶴見線（海芝浦支線）",
  "odpt.Railway:JR-East.Uchibo": "内房線",
  "odpt.Railway:JR-East.Utsunomiya": "宇都宮線",
  "odpt.Railway:JR-East.Yamanote": "山手線",
  "odpt.Railway:JR-East.Yokohama": "横浜線",
  "odpt.Railway:JR-East.Chuo": "中央線",
  "odpt.Railway:JR-East.Sobu": "総武線",
  "odpt.Railway:JR-East.Yokosuka": "横須賀線"
};

// 路線ID → 色分け
const RAILWAY_COLOR_MAP = {
  "odpt.Railway:JR-East.Agatsuma": "#8f76d6",        // 吾妻線（紫系）
  "odpt.Railway:JR-East.ChuoRapid": "#ff4500",      // 中央線快速（オレンジ）
  "odpt.Railway:JR-East.Joetsu": "#1e90ff",         // 上越線（青）
  "odpt.Railway:JR-East.ChuoSobuLocal": "#ffd700",  // 中央・総武各停（黄色）
  "odpt.Railway:JR-East.Itsukaichi": "#ff6347",     // 五日市線（赤系）
  "odpt.Railway:JR-East.Hachiko": "#8b4513",        // 八高線（茶色）
  "odpt.Railway:JR-East.Ito": "#00ced1",            // 伊東線（青緑）
  "odpt.Railway:JR-East.Joban": "#006400",          // 常磐線（濃緑）
  "odpt.Railway:JR-East.JobanLocal": "#228b22",     // 常磐各停（緑）
  "odpt.Railway:JR-East.JobanRapid": "#2e8b57",     // 常磐快速（深緑）
  "odpt.Railway:JR-East.Kashima": "#4169e1",        // 鹿島線（青）
  "odpt.Railway:JR-East.Kawagoe": "#8b4513",        // 川越線（茶色）
  "odpt.Railway:JR-East.KeihinTohokuNegishi": "#1e90ff", // 京浜東北・根岸線（水色）
  "odpt.Railway:JR-East.Kururi": "#cd853f",         // 久留里線（黄土色）
  "odpt.Railway:JR-East.Keiyo": "#ff1493",          // 京葉線（ピンク）
  "odpt.Railway:JR-East.Musashino": "#9932cc",      // 武蔵野線（紫）
  "odpt.Railway:JR-East.Nambu": "#ffcc00",          // 南武線（黄色）
  "odpt.Railway:JR-East.NambuBranch": "#ffcc00",    // 南武支線（黄色）
  "odpt.Railway:JR-East.Narita": "#0066cc",         // 成田線（青）
  "odpt.Railway:JR-East.NaritaAbikoBranch": "#0066cc", // 成田線（我孫子支線）
  "odpt.Railway:JR-East.NaritaAirportBranch": "#0066cc", // 成田線（空港支線）
  "odpt.Railway:JR-East.Ome": "#4169e1",            // 青梅線（青）
  "odpt.Railway:JR-East.Sagami": "#00bfff",         // 相模線（水色）
  "odpt.Railway:JR-East.Tsurumi": "#708090",        // 鶴見線（グレー）
  "odpt.Railway:JR-East.SaikyoKawagoe": "#008000",  // 埼京線（緑）
  "odpt.Railway:JR-East.ShonanShinjuku": "#dc143c", // 湘南新宿ライン（赤）
  "odpt.Railway:JR-East.SobuRapid": "#0000cd",      // 総武快速（青）
  "odpt.Railway:JR-East.SotetsuDirect": "#003366",  // 相鉄直通（濃紺）
  "odpt.Railway:JR-East.Sotobo": "#ff8c00",         // 外房線（オレンジ）
  "odpt.Railway:JR-East.Takasaki": "#8b4513",       // 高崎線（茶色）
  "odpt.Railway:JR-East.Togane": "#daa520",         // 東金線（金色）
  "odpt.Railway:JR-East.Tokaido": "#ff8c00",        // 東海道線（オレンジ）
  "odpt.Railway:JR-East.TsurumiOkawaBranch": "#708090", // 鶴見線（大川支線）
  "odpt.Railway:JR-East.TsurumiUmiShibauraBranch": "#708090", // 鶴見線（海芝浦支線）
  "odpt.Railway:JR-East.Uchibo": "#ff4500",         // 内房線（赤）
  "odpt.Railway:JR-East.Utsunomiya": "#228b22",     // 宇都宮線（緑）
  "odpt.Railway:JR-East.Yamanote": "#00bb00",       // 山手線（黄緑）
  "odpt.Railway:JR-East.Yokohama": "#4169e1",       // 横浜線（青）
  "odpt.Railway:JR-East.Chuo": "#ff4500",           // 中央線（オレンジ）
  "odpt.Railway:JR-East.Sobu": "#ffd700",           // 総武線（黄色）
  "odpt.Railway:JR-East.Yokosuka": "#00008b"        // 横須賀線（紺）
};




// ===== 変数定義 =====
let currentMarker = null;   // 現在位置マーカー
let stationMarker = null;   // 最寄駅マーカー
let watchId = null;         // 位置追跡ID
let odptStations = [];      // ODPT の駅一覧キャッシュ


// 追加: 最寄り駅計算にも使う駅マーカーリスト
let stationMarkers = [];

// 路線ごとのレイヤー
const railwayLayers = {};  // { railwayId: L.layerGroup }
const railwayNames  = {};  // { railwayId: '山手線' など }


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

    stations.forEach(station => {
      const lat       = station['geo:lat'] ?? station['odpt:latitude'];
      const lng       = station['geo:long'] ?? station['odpt:longitude'];
      const nameJa    = station['odpt:stationTitle']?.ja || station['dc:title'];
      const railwayId = station['odpt:railway']; // 例: "odpt.Railway:JR-East.Yamanote"

      if (typeof lat !== 'number' || typeof lng !== 'number' || !nameJa || !railwayId) return;

      const color = RAILWAY_COLOR_MAP[railwayId] ?? "#333";

const marker = L.circleMarker([lat, lng], {
  radius: 6,
  color: color,
  fillColor: color,
  fillOpacity: 0.9
}).bindPopup(nameJa);

  marker.addTo(map);


      // 最寄り駅計算用リストにも保持
      stationMarkers.push({ marker, lat, lng, name: nameJa, station });

      // 路線ごとの layerGroup にも追加
      if (!railwayLayers[railwayId]) {
        railwayLayers[railwayId] = L.layerGroup();
      }
      railwayLayers[railwayId].addLayer(marker);

      // 路線名（簡易的に駅名から作っているだけなので、必要ならマスタで置き換え）
      if (!railwayNames[railwayId]) {
        railwayNames[railwayId] = RAILWAY_NAME_MAP[railwayId] ?? railwayId; // とりあえずIDそのまま
      }
    });

    // レイヤーコントロール用オーバーレイ定義
    const overlays = {};
    Object.keys(railwayLayers).forEach(railwayId => {
      const label = railwayNames[railwayId];
      overlays[label] = railwayLayers[railwayId];

      // ★ 初期状態でチェック済みにするために追加 
      railwayLayers[railwayId].addTo(map);
    });

    // 右上にON/OFF用コントロールを追加
    L.control.layers(null, overlays, { collapsed: false }).addTo(map);
    // レイヤーコントロール追加後にボタンを作成
const controlContainer = document.querySelector('.leaflet-control-layers');

// ボタンを包む div
const btnBox = document.createElement('div');
btnBox.style.marginTop = '10px';

// 全て選択ボタン
const btnSelectAll = document.createElement('button');
btnSelectAll.textContent = '全て選択';
btnSelectAll.style.display = 'block';
btnSelectAll.style.width = '100%';
btnSelectAll.style.marginBottom = '5px';
btnSelectAll.onclick = () => {
  Object.keys(railwayLayers).forEach(id => {
    map.addLayer(railwayLayers[id]);
  });
};

// 全て解除ボタン
const btnClearAll = document.createElement('button');
btnClearAll.textContent = '全て解除';
btnClearAll.style.display = 'block';
btnClearAll.style.width = '100%';
btnClearAll.onclick = () => {
  Object.keys(railwayLayers).forEach(id => {
    map.removeLayer(railwayLayers[id]);
  });
};

// ボタンをコントロール内に追加
btnBox.appendChild(btnSelectAll);
btnBox.appendChild(btnClearAll);
controlContainer.appendChild(btnBox);




  })
  .catch(err => console.error('駅データ取得エラー', err));

// ===== 路線形状の取得 =====
const RAILWAY_API =
  "https://api-challenge.odpt.org/api/v4/odpt:Railway" +
  "?odpt:operator=odpt.Operator:JR-East" +
  "&acl:consumerKey=1ehr2tinii4eomlmzwqgxhhy70j6harphkpjl2sheg2948iqki4nzweqnhbu551a";

  fetch(RAILWAY_API)
  .then(res => res.json())
  .then(lines => {
    lines.forEach(line => {
      const railwayId = line["owl:sameAs"];
      const order = line["odpt:stationOrder"];
      if (!order) return;

      const latlngs = [];

      order.forEach(o => {
        const stId = o["odpt:station"];
        const st = odptStations.find(s => s["owl:sameAs"] === stId);
        if (!st) return;

        const lat = st["geo:lat"] ?? st["odpt:latitude"];
        const lng = st["geo:long"] ?? st["odpt:longitude"];
        latlngs.push([lat, lng]);
      });

      if (latlngs.length < 2) return;

      const color = RAILWAY_COLOR_MAP[railwayId] ?? "#555";

      const poly = L.polyline(latlngs, {
        color: color,
        weight: 4,
        opacity: 0.8
      });

      if (railwayLayers[railwayId]) {
        railwayLayers[railwayId].addLayer(poly);
      }
    });
  });




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
