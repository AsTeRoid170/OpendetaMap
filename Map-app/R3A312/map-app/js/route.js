let routeLine = null;
let routePopup = null;


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


// 徒歩ルート描画
function drawWalkingRoute(startLat, startLng, endLat, endLng) {

  // 🚨 これを一番最初に入れる
  if (
    typeof startLat !== 'number' ||
    typeof startLng !== 'number' ||
    typeof endLat !== 'number' ||
    typeof endLng !== 'number'
  ) {
    console.warn('LatLng不正', startLat, startLng, endLat, endLng);
    return;
  }

  // ルートOFFなら描画しない
  if (!isRouteEnabled) return;

  // ↓ ここから既存の fetch(OSRM) 処理
}

