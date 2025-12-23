const map = L.map('map').setView([35.681236, 139.767125], 13);

L.tileLayer(
  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  { attribution: '© OpenStreetMap contributors' }
).addTo(map);
