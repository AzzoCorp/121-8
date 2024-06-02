function extractSquareMeters(text) {
  if (!text) return 0;
  var match = text.match(/Surface plancher créée\s*:\s*([\d,.]+)\s*m²/);
  var squareMeters = match ? parseFloat(match[1].replace(',', '.')) : 0;
  return squareMeters;
}

function addGeoJSONLayer(geojson, style, layerName) {
  var geometries = maptalks.GeoJSON.toGeometry(geojson);
  var vectorLayer = new maptalks.VectorLayer(layerName, { enableAltitude: true }).addTo(map);
  var labelLayer = new maptalks.VectorLayer(layerName + '_labels', {
    collision: true
  }).addTo(map);

  var shadowSymbol = {
    lineColor: '#999999',
    lineDasharray: [10, 5, 5],
    lineWidth: 2,
    polygonFill: '#999999',
    polygonOpacity: 1,
    shadowBlur: 30,
    shadowColor: 'rgba(0, 0, 0, 1)',
    shadowOffsetX: 0,
    shadowOffsetY: 0
  };
  var shadows = [];

  geometries.forEach(geometry => {
    var properties = geometry.getProperties();
    var areaText = '';
    if (layerName === 'depotsLayer') {
      var depots = properties.depots && properties.depots[0];
      areaText = depots ? depots[7] : '';
    } else if (layerName === 'favorablesLayer') {
      var decisions = properties.decisions && properties.decisions[0];
      areaText = decisions ? decisions[7] : '';
    }

    var altitude = extractSquareMeters(areaText) / 50;

    properties.altitude = altitude;
    geometry.setProperties(properties);

    geometry.setSymbol({
      'lineColor': style.lineColor,
      'lineWidth': style.lineWidth,
      'polygonFill': style.polygonFill,
      'polygonOpacity': style.polygonOpacity
    });

    vectorLayer.addGeometry(geometry);

    var shadow = geometry.copy().setSymbol(shadowSymbol);
    shadow.setProperties({ altitude: 0 });
    shadows.push(shadow);

    var center = geometry.getCenter();
    var label = new maptalks.Label(properties.section + ' ' + properties.numero, center, {
      'textSymbol': {
        'textFaceName': 'monospace',
        'textFill': '#34495e',
        'textHorizontalAlignment': 'center',
        'textVerticalAlignment': 'middle',
        'textWeight': 'bold'
      }
    });
    labelLayer.addGeometry(label);

    geometry.on('click', function (e) {
      var popupContent = generatePopupContent(properties, layerName);
      new maptalks.ui.InfoWindow({
        content: popupContent,
        coordinate: e.coordinate
      }).addTo(map).show(e.coordinate);
    });
  });

  new maptalks.VectorLayer(layerName + '_shadows', shadows, { enableAltitude: true }).addTo(map).bringToBack();

  map.on('zoomend', function () {
    var zoom = map.getZoom();
    if (zoom >= 12) {
      labelLayer.show();
    } else {
      labelLayer.hide();
    }
  });

  if (map.getZoom() < 12) {
    labelLayer.hide();
  }
}

function generatePopupContent(properties, layerName) {
  var popupContent = '';
  if (layerName === 'depotsLayer') {
    popupContent = "<h2>Demande de permis de construire</h2>" +
      "<b>Section:</b> " + properties.section + "<br>" +
      "<b>Numéro:</b> " + properties.numero + "<br>" +
      "<b>Commune:</b> " + properties.commune + "<br>" +
      "<b>Superficie parcelle:</b> " + properties.contenance + " m²<br>";

    properties.depots.forEach(function (depots) {
      popupContent += "<b>Date d'affichage:</b> " + depots[0] + "<br>" +
        "<b>N° de permis:</b> " + depots[1] + "<br>" +
        "<b>Demandeur:</b> " + depots[3] + "<br>" +
        "<b>Adresse:</b> " + depots[4] + "<br>" +
        "<b>Superficie totale:</b> " + depots[5] + "<br>" +
        "<b>Description:</b> " + depots[6] + "<br>" +
        "<b>Détails:</b> " + depots[7] + "<br>" +
        "<b>Date de dépôt:</b> " + depots[2] + "<br>";
    });
  } else if (layerName === 'favorablesLayer') {
    popupContent = "<h2>Permis de construire favorable</h2>" +
      "<b>Section:</b> " + properties.section + "<br>" +
      "<b>Numéro:</b> " + properties.numero + "<br>" +
      "<b>Commune:</b> " + properties.commune + "<br>" +
      "<b>Superficie parcelle:</b> " + properties.contenance + " m²<br>";

    properties.decisions.forEach(function (decision) {
      popupContent += "<b>Référence:</b> " + decision[1] + "<br>" +
        "<b>Date de dépôt:</b> " + decision[2] + "<br>" +
        "<b>Demandeur:</b> " + decision[3] + "<br>" +
        "<b>Adresse:</b> " + decision[4] + "<br>" +
        "<b>Superficie totale:</b> " + decision[5] + "<br>" +
        "<b>Description:</b> " + decision[6] + "<br>" +
        "<b>Détails:</b> " + decision[7] + "<br>" +
        "<b>Statut:</b> " + decision[8] + "<br><br>";
    });
  }

  return popupContent;
}
