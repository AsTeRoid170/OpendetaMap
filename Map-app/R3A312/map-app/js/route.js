// ===== 徒歩ルート用 =====
let routeLine = null;
let routePopup = null;

function drawWalkingRoute(startLat, startLng, endLat, endLng) {
  if (!isRouteEnabled) return;

  if (
    typeof startLat !== 'number' ||
    typeof startLng !== 'number' ||
    typeof endLat !== 'number' ||
    typeof endLng !== 'number'
  ) return;

  const url =
    `https://router.project-osrm.org/route/v1/foot/` +
    `${startLng},${startLat};${endLng},${endLat}` +
    `?overview=full&geometries=geojson`;

  fetch(url)
    .then(res => res.json())
    .then(data => {
      if (!data.routes || data.routes.length === 0) return;

      const route = data.routes[0];
      const coords = route.geometry.coordinates.map(c => [c[1], c[0]]);
      const durationMin = Math.round(route.duration / 60);

      clearRoute();

      routeLine = L.polyline(coords, {
        color: 'blue',
        weight: 5
      }).addTo(map);

      routePopup = L.popup()
        .setLatLng(coords[Math.floor(coords.length / 2)])
        .setContent(`🚶 徒歩 約${durationMin}分`)
        .openOn(map);
    });
}

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
