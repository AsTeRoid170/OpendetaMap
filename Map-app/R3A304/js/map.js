/****************************
 * 基本設定
 ****************************/
const ODPT_TOKEN = "a3i8zmtw07t7cookjmmy02eup222b6ytjsvcnnhz3h4zbpje2t7p8190k1t2865l";

// 東京都中心
const map = L.map("map").setView([35.68, 139.76], 10);

// 背景地図
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap contributors",
}).addTo(map);

/****************************
 * API URL
 ****************************/
const RAILWAY_API =
  "https://api-public.odpt.org/api/v4/odpt:Railway" +
  "?odpt:operator=odpt.Operator:Toei" +
  "&owl:sameAs=odpt.Railway:Toei.Oedo" +
  `&acl:consumerKey=${ODPT_TOKEN}`;

const STATION_API =
  "https://api-public.odpt.org/api/v4/odpt:Station" +
  "?odpt:operator=odpt.Operator:Toei" +
  `&acl:consumerKey=${ODPT_TOKEN}`;

/****************************
 * メイン処理
 ****************************/
async function drawOedoLine() {
  try {
    const railwayRes = await fetch(RAILWAY_API);
    const railwayData = await railwayRes.json();
    console.log("railwayData", railwayData);

    if (!railwayData.length) {
      console.error("Railway data is empty");
      return;
    }

    const stationOrder = railwayData[0]["odpt:stationOrder"];

    const stationRes = await fetch(STATION_API);
    const stations = await stationRes.json();
    console.log("stations", stations);

    const stationMap = {};
    stations.forEach((s) => {
      if (s["geo:lat"] && s["geo:long"]) {
        stationMap[s["owl:sameAs"]] = [s["geo:lat"], s["geo:long"]];
      }
    });

    const lineCoords = [];
    stationOrder.forEach((st) => {
      const coord = stationMap[st["odpt:station"]];
      if (coord) lineCoords.push(coord);
    });

    if (lineCoords.length === 0) console.warn("lineCoords is empty");

    L.polyline(lineCoords, { color: "#CF3366", weight: 4 }).addTo(map);
  } catch (e) {
    console.error("ODPT API error", e);
  }
}


// 実行
drawOedoLine();
