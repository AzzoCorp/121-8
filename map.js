var map = new maptalks.Map('map', {
  center: [9.27970, 41.59099],
  zoom: 10,
  pitch: 45,
  layerSwitcherControl: {
    'position': 'top-right',
    'baseTitle': 'Couches de base',
    'overlayTitle': 'Couches',
    'excludeLayers': [],
    'containerClass': 'maptalks-layer-switcher'
  },
  baseLayer: new maptalks.GroupTileLayer('Base TileLayer', [
    new maptalks.TileLayer('Vectorielle', {
      urlTemplate: 'https://{s}.tile.osm.org/{z}/{x}/{y}.png',
      subdomains: ["a", "b", "c"],
    }),
    new maptalks.TileLayer('Claire', {
      'visible': false,
      'urlTemplate': 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
      'subdomains': ['a', 'b', 'c', 'd']
    }),
    new maptalks.TileLayer('Foncée', {
      'visible': false,
      'urlTemplate': 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
      'subdomains': ['a', 'b', 'c', 'd']
    }),
    new maptalks.TileLayer('Satelite', {
      'visible': false,
      'urlTemplate': 'http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
      'subdomains': ['mt0', 'mt1', 'mt2', 'mt3']
    })
  ])
});

changeView();

function changeView() {
  map.animateTo({
    center: [9.27970, 41.59099],
    zoom: 5,
    pitch: 60,
    bearing: 20
  }, { duration: 5000 });
  setTimeout(function () {
    map.animateTo({
      center: [9.27970, 41.59099],
      zoom: 17,
      pitch: 55,
      bearing: 90
    }, { duration: 5000 });
  }, 5000);
}

var depotsStyle = {
  'lineColor': '#030000',
  'lineWidth': 0.5,
  'polygonFill': '#ff00fe',
  'polygonOpacity': 1
};

var favorablesStyle = {
  'lineColor': '#030000',
  'lineWidth': 0.5,
  'polygonFill': '#009cff',
  'polygonOpacity': 1
};

addGeoJSONLayer(depots, depotsStyle, 'depotsLayer');
addGeoJSONLayer(favorables, favorablesStyle, 'favorablesLayer');

var currentPopup = null;

function onGeometryClick(e) {
  var properties = e.target.getProperties();
  var popupContent = generatePopupContent(properties, e.target.getLayer().getId());
  if (currentPopup) {
    currentPopup.remove();
  }
  currentPopup = new maptalks.ui.InfoWindow({
    content: popupContent,
    coordinate: e.coordinate
  }).addTo(map).show(e.coordinate);
}

map.on('click', function (e) {
  if (e.target && e.target.getLayer && e.target.getLayer()) {
    var layerId = e.target.getLayer().getId();
    if (layerId === 'depotsLayer' || layerId === 'favorablesLayer') {
      onGeometryClick(e);
    }
  } else {
    if (currentPopup) {
      currentPopup.remove();
      currentPopup = null;
    }
  }
});
