// Test adding a GeoJSON layer
addGeoJSON({ /* GeoJSON data */ }, 'layer1', 'Layer 1', '#FF0000', 0.5, 'fill');
// Assert that the layer is added to the map and the layer list
assert(map.getLayer('layer1') !== undefined, 'Layer 1 should be added to the map');
assert(document.getElementById('layer-item-layer1') !== null, 'Layer 1 should be added to the layer list');