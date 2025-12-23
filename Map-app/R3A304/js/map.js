// 東京都中心で地図初期化
const map = L.map("map").setView([35.68, 139.76], 10);

// 背景地図（OpenStreetMap）
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap contributors",
}).addTo(map);

// 都営大江戸線（仮ルート・後でAPIに置換）
const oedoLineCoords = [
  [35.6896, 139.6921], // 新宿
  [35.7074, 139.7510], // 上野御徒町
  [35.6750, 139.7630], // 六本木
  [35.6586, 139.7454], // 大門
  [35.6896, 139.6921], // 都庁前
];

// 路線描画
L.polyline(oedoLineCoords, {
  color: "#CF3366",
  weight: 4,
}).addTo(map);
