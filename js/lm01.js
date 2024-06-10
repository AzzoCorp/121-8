function addLayer(sourceId, layerId, sourceData, layerType, paintProps) {
    if (!map.getSource(sourceId)) {
        map.addSource(sourceId, {
            type: 'geojson',
            data: sourceData
        });
    }

    if (!map.getLayer(layerId)) {
        map.addLayer({
            id: layerId,
            type: layerType,
            source: sourceId,
            layout: {},
            paint: paintProps
        }, 'waterway-label');
    }
}

function addParcellesLayer() {
    addLayer('parcelles', 'parcelles-layer', parcelles, 'line', {
        'line-color': '#FFFFFF',
        'line-width': 0.5,
        'line-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            13, 0,
            19, 1
        ]
    });

    addLayer('parcelles-interactive', 'parcelles-interactive-layer', parcelles, 'fill', {
        'fill-color': '#FFFFFF',
        'fill-opacity': 0,
        'fill-outline-color': '#FFFFFF'
    });
}

function addCommuneLayer() {
    addLayer('commune', 'commune-layer', commune, 'line', {
        'line-color': '#FFFFFF',
        'line-width': 3,
        'line-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            10, 0,
            13, 1
        ]
    });
}

function addFavorablesLayer() {
    addLayer('favorables', 'favorables-layer', favorables, 'fill', {
        'fill-color': '#009cff',
        'fill-opacity': 1,
        'fill-outline-color': '#000000'
    });
}

function addDepotsLayer() {
    addLayer('depots', 'depots-layer', depots, 'fill', {
        'fill-color': '#ff00fe',
        'fill-opacity': 1,
        'fill-outline-color': '#000000'
    });
}

function addUrbanisation40Layer() {
    addLayer('urbanisation40', 'urbanisation40-layer', urbanisation40, 'fill', {
        'fill-color': '#ff0000',
        'fill-opacity': 0.5,
        'fill-outline-color': '#000000'
    });
}

function addUrbanisation80Layer() {
    addLayer('urbanisation80', 'urbanisation80-layer', urbanisation80, 'line', {
        'line-color': '#ff0000',
        'line-width': 2,
        'line-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            10, 0,
            13, 1
        ]
    });
}

function addCentresUrbainsLayer() {
    addLayer('centressurbains', 'centressurbains-layer', centressurbains, 'line', {
        'line-color': '#ff0000',
        'line-width': 2
    });
}

function addZonesUrbainesLayer() {
    addLayer('zonesurbaines', 'zonesurbaines-layer', zonesurbaines, 'fill', {
        'fill-color': '#f2ff06',
        'fill-opacity': 0.5,
        'fill-outline-color': '#000000'
    });
}

function updateLineWidth(layerId, sliderId) {
    document.getElementById(sliderId).addEventListener('input', (event) => {
        const lineWidth = parseFloat(event.target.value);
        map.setPaintProperty(layerId, 'line-width', lineWidth);
    });
}

function updateLayerOpacity(layerId, sliderId) {
    document.getElementById(sliderId).addEventListener('input', (event) => {
        const opacity = parseFloat(event.target.value);
        map.setPaintProperty(layerId, 'fill-opacity', opacity);
    });
}

function parseReferences(refString) {
    const cleanedString = refString.replace(/[,_\-\/|]+/g, ' ').replace(/\s+/g, '').toUpperCase();
    const regex = /([A-Z]+)(\d+)/g;
    const references = [];
    let match;

    while ((match = regex.exec(cleanedString)) !== null) {
        references.push(match[1] + match[2]);
    }
    return references;
}

function searchParcels(refString) {
    const references = parseReferences(refString);
    const features = parcelles.features;
    let parcelFeatures = [];
    let firstCenter = null;

    references.forEach(reference => {
        features.forEach(feature => {
            const props = feature.properties;
            const featureReference = (props.section + props.numero).toUpperCase();

            if (reference === featureReference) {
                parcelFeatures.push(feature);
                if (!firstCenter) {
                    firstCenter = turf.centerOfMass(feature).geometry.coordinates;
                }
            }
        });
    });

    if (parcelFeatures.length > 0) {
        map.flyTo({
            center: firstCenter,
            zoom: 16
        });
        highlightParcels(parcelFeatures);
    } else {
        alert('Parcelles non trouvées');
    }
}

function highlightParcels(parcelFeatures) {
    if (highlightedParcels) {
        map.removeLayer('highlighted-parcels-layer');
        map.removeSource('highlighted-parcels');
    }

    highlightedParcels = {
        type: 'FeatureCollection',
        features: parcelFeatures
    };

    map.addSource('highlighted-parcels', {
        type: 'geojson',
        data: highlightedParcels
    });

    map.addLayer({
        id: 'highlighted-parcels-layer',
        type: 'line',
        source: 'highlighted-parcels',
        paint: {
            'line-color': '#ff0000',
            'line-width': 3
        }
    });
}

function createParcelMarker(ref, center) {
    const markerDiv = document.createElement('div');
    markerDiv.className = 'parcel-marker';
    markerDiv.innerHTML = ref;
    markerDiv.style.backgroundColor = 'white';
    markerDiv.style.padding = '2px';
    markerDiv.style.borderRadius = '3px';
    markerDiv.style.border = '1px solid black';

    parcelMarker = new mapboxgl.Marker(markerDiv)
        .setLngLat(center)
        .addTo(map);
}

function addMouseMoveListener() {
    map.on('mousemove', function (e) {
        if (map.getLayer('parcelles-interactive-layer')) {
            const features = map.queryRenderedFeatures(e.point, {
                layers: ['parcelles-interactive-layer']
            });

            if (!features.length) {
                if (parcelMarker) {
                    parcelMarker.remove();
                    parcelMarker = null;
                }
            }
        }
    });
}

function showPopup(e, layerName) {
    const coordinates = e.features[0].geometry.coordinates.slice();
    const description = generatePopupContent(e.features[0].properties, layerName);

    if (Array.isArray(coordinates[0][0])) {
        const [lng, lat] = turf.centroid(e.features[0]).geometry.coordinates;
        new mapboxgl.Popup()
            .setLngLat([lng, lat])
            .setHTML(description)
            .addTo(map);
    } else {
        new mapboxgl.Popup()
            .setLngLat(coordinates)
            .setHTML(description)
            .addTo(map);
    }
}

function generatePopupContent(properties, layer) {
    const content = Object.keys(properties).map(key => `<strong>${key}:</strong> ${properties[key]}`).join('<br>');
    return `<strong>${layer} Properties</strong><br>${content}`;
}

function initializeMap() {
    map.on('load', () => {
        if (!map.getSource('mapbox-dem')) {
            map.addSource('mapbox-dem', {
                type: 'raster-dem',
                url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
                tileSize: 512,
                maxzoom: 14
            });
            map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });
        }
        animateView();
        addParcellesLayer();
        addCommuneLayer();
        addFavorablesLayer();
        addDepotsLayer();
        addUrbanisation40Layer();
        addUrbanisation80Layer();
        addCentresUrbainsLayer();
        addZonesUrbainesLayer();

        toggleLayerVisibility('parcelles-layer', 'toggle-parcelles');
        toggleLayerVisibility('commune-layer', 'toggle-commune');
        toggleLayerVisibility('favorables-layer', 'toggle-favorables');
        toggleLayerVisibility('depots-layer', 'toggle-depots');
        toggleLayerVisibility('urbanisation40-layer', 'toggle-urbanisation40');
        toggleLayerVisibility('urbanisation80-layer', 'toggle-urbanisation80');
        toggleLayerVisibility('centressurbains-layer', 'toggle-centressurbains');
        toggleLayerVisibility('zonesurbaines-layer', 'toggle-zonesurbaines');

        updateLineWidth('parcelles-layer', 'parcelles-width');
        updateLineWidth('commune-layer', 'commune-width');
        updateLayerOpacity('favorables-layer', 'favorables-opacity');
        updateLayerOpacity('depots-layer', 'depots-opacity');
        updateLayerOpacity('urbanisation40-layer', 'urbanisation40-opacity');
        updateLineWidth('urbanisation80-layer', 'urbanisation80-width');
        updateLineWidth('centressurbains-layer', 'centressurbains-width');
        updateLayerOpacity('zonesurbaines-layer', 'zonesurbaines-opacity');

        const urlParams = new URLSearchParams(window.location.search);
        const searchParam = urlParams.get('r');
        if (searchParam) {
            document.getElementById('search-parcel').value = searchParam;
            searchParcels(searchParam);
        }

        map.on('click', 'favorables-layer', function (e) {
            showPopup(e, 'favorables-layer');
        });

        map.on('click', 'depots-layer', function (e) {
            showPopup(e, 'depots-layer');
        });
    });
}

function animateView() {
    setTimeout(() => {
        map.flyTo({
            center: [9.27970, 41.59099],
            zoom: 15.5,
            pitch: 55,
            bearing: 90,
            duration: 10000
        });
    }, 50);
}

function saveLayers() {
    reorderLayers();
    const layersConfig = Object.keys(layerDefinitions).map(layerId => layerDefinitions[layerId]).slice().sort((a, b) => a.order - b.order);
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(layersConfig, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "layers-config.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

function updateIconColors(layerItem, color) {
    const fillIcon = layerItem.querySelector('.fill-icon');
    const lineIcon = layerItem.querySelector('.line-icon');
    fillIcon.style.backgroundColor = color;
    lineIcon.style.borderColor = color;
    lineIcon.style.color = color;
}

function toggleLayerVisibility(layerId, visibilityButton) {
    const visibility = map.getLayoutProperty(layerId, 'visibility');
    if (visibility === 'visible') {
        map.setLayoutProperty(layerId, 'visibility', 'none');
        visibilityButton.innerHTML = '🚫';
        visibilityButton.style.color = 'red';
    } else {
        map.setLayoutProperty(layerId, 'visibility', 'visible');
        visibilityButton.innerHTML = '👁️';
        visibilityButton.style.color = 'black';
    }
}

function resetLayers() {
    document.querySelectorAll('.layer-item').forEach(item => item.remove());
    map.getStyle().layers.slice().forEach(layer => {
        if (layer.id.startsWith('geojson-layer-')) {
            removeGeoJSON(layer.id);
        }
    });
    layerDefinitions = {};
}

function reorderLayers() {
    const layerItems = Array.from(document.querySelectorAll('.layer-item')).filter(item => !item.classList.contains('add-layer'));
    layerItems.sort((a, b) => parseInt(a.getAttribute('data-order')) - parseInt(b.getAttribute('data-order')));

    console.log('Reordering layers:', layerItems.map(item => item.getAttribute('data-layer-id')));

    layerItems.forEach((item, index) => {
        const layerId = item.getAttribute('data-layer-id');
        console.log(`Moving layer ${layerId} to position ${index}`);
        if (map.getLayer(layerId)) {
            if (index === 0) {
                map.moveLayer(layerId);
            } else {
                const nextLayerId = layerItems[index - 1].getAttribute('data-layer-id');
                console.log(`Moving layer ${layerId} below ${nextLayerId}`);
                map.moveLayer(layerId, nextLayerId);
            }
        }

        item.setAttribute('data-order', index);
        const label = item.querySelector('label');
        if (label) {
            label.textContent = `${index} - ${layerDefinitions[layerId].layerName.replace('.geojson', '')}`;
        }

        if (layerDefinitions[layerId]) {
            layerDefinitions[layerId].order = index;
        }
    });
}

function getMapLayer() {
    const layers = map.getStyle().layers;
    return layers.map((layer, index) => ({
        id: layer.id,
        type: layer.type,
        index: index
    }));
}

function changeLayerType(layerId, newType) {
    const layer = map.getLayer(layerId);
    if (!layer) {
        console.error(`Layer with ID ${layerId} does not exist.`);
        return;
    }

    const source = map.getSource(layer.source);
    if (!source) {
        console.error(`Source for layer with ID ${layerId} does not exist.`);
        return;
    }

    // Get current paint properties
    const currentPaintProperties = map.getPaintProperty(layerId, layer.type === 'fill' ? 'fill-color' : 'line-color');
    const currentOpacity = map.getPaintProperty(layerId, layer.type === 'fill' ? 'fill-opacity' : 'line-opacity');
    const currentLineWidth = layer.type === 'line' ? map.getPaintProperty(layerId, 'line-width') : 2;

    // Remove the existing layer
    map.removeLayer(layerId);

    // Add a new layer with the desired type
    map.addLayer({
        id: layerId,
        type: newType,
        source: layer.source,
        layout: {},
        paint: newType === 'fill' ? {
            'fill-color': currentPaintProperties || '#000000',
            'fill-opacity': currentOpacity || 1
        } : {
            'line-color': currentPaintProperties || '#000000',
            'line-opacity': currentOpacity || 1,
            'line-width': currentLineWidth || 2
        }
    });
}

function removeGeoJSON(layerId) {
    console.log(`Removing layer: ${layerId}`);
    if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
        console.log(`Layer ${layerId} removed`);
    } else {
        console.log(`Layer ${layerId} does not exist`);
    }
    if (map.getSource(layerId)) {
        map.removeSource(layerId);
        console.log(`Source ${layerId} removed`);
    } else {
        console.log(`Source ${layerId} does not exist`);
    }
    removeLayerFromList(layerId);
    delete layerDefinitions[layerId]; // Ensure the layer definition is removed
}

function addGeoJSON(data, layerId, layerName, color = getRandomColor(), opacity = 1, type = 'fill') {
    console.log(`Adding layer: ${layerId}`);
    if (map.getSource(layerId)) {
        map.removeSource(layerId); // Remove existing source if it exists
        console.log(`Existing source ${layerId} removed`);
    }

    map.addSource(layerId, {
        type: 'geojson',
        data: data
    });
    console.log(`Source ${layerId} added`);

    if (map.getLayer(layerId)) {
        map.removeLayer(layerId); // Remove existing layer if it exists
        console.log(`Existing layer ${layerId} removed`);
    }

    map.addLayer({
        id: layerId,
        type: type,
        source: layerId,
        layout: {},
        paint: type === 'fill' ? {
            'fill-color': color,
            'fill-opacity': opacity
        } : {
            'line-color': color,
            'line-opacity': opacity,
            'line-width': 2
        }
    });
    console.log(`Layer ${layerId} added`);

    addLayerToList(layerId, layerName, data, color, opacity, type);
}

function removeLayerFromList(layerId) {
    const layerItem = document.getElementById('layer-item-' + layerId);
    if (layerItem && layerItem.parentNode) {
        layerItem.parentNode.removeChild(layerItem);
    }
}

async function loadGeoJSONFromURL(url, layerId) {
    const response = await fetch(url);
    const data = await response.json();
    return addLayerFromGeoJSON(data, layerId);
}

function getColorForLayer(layer) {
    // Cette fonction doit retourner la couleur du calque en fonction de ses propriétés.
    // Pour simplifier, nous retournons une couleur aléatoire ici.
    return '#' + Math.floor(Math.random() * 16777215).toString(16);
}

function addLayerFromGeoJSON(data, layerId) {
    if (map.getSource(layerId)) {
        map.getSource(layerId).setData(data);
    } else {
        map.addSource(layerId, {
            'type': 'geojson',
            'data': data
        });
        map.addLayer({
            'id': layerId,
            'type': 'line', // Type de couche de votre choix
            'source': layerId,
            'layout': {},
            'paint': {
                'line-color': '#888',
                'line-width': 8
            }
        });
    }
    return layerId;
}

function getMapLayersSorted() {
    const layers = map.getStyle().layers;
    return layers.map((layer, index) => ({
        id: layer.id,
        type: layer.type,
        index: index
    })).sort((a, b) => a.index - b.index); // Sort by index in ascending order
}

function addLayerToList(layerId, layerName, geojsonData, color = '#FFFFFF', opacity = 1, order = layerCounter++, type = 'fill', lineWidth = 2) {
    const layerList = document.getElementById('layerList');
    const existingItem = document.querySelector(`#layer-item-${layerId}`);

    if (existingItem) {
        return;
    }

    const layerItem = document.createElement('div');
    layerItem.className = 'layer-item';
    layerItem.id = 'layer-item-' + layerId;
    layerItem.setAttribute('data-layer-id', layerId);
    layerItem.setAttribute('data-order', order);

    const layerSelector = document.createElement('span');
    layerSelector.className = 'layer-selector';
    layerSelector.textContent = '≡';

    const visibilityButton = document.createElement('span');
    visibilityButton.className = 'visibility-button';
    visibilityButton.innerHTML = '👁️';
    visibilityButton.onclick = function() {
        toggleLayerVisibility(layerId, visibilityButton);
    };

    const layerLabel = document.createElement('label');
    layerLabel.textContent = `${order} - ${layerName.replace('.geojson', '')}`;

    const colorSquare = document.createElement('span');
    colorSquare.className = 'color-square';
    colorSquare.style.backgroundColor = color;
    colorSquare.onclick = function() {
        colorInput.click();
    };

    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.value = color;
    colorInput.style.display = 'none';
    colorInput.oninput = function() {
        updateGeoJSONStyle(layerId, colorInput.value, opacityInput.value, type, lineWidthInput.value);
        colorSquare.style.backgroundColor = colorInput.value;
        updateLayerAttributes(layerId, 'color', colorInput.value);
        updateIconColors(layerItem, colorInput.value);
    };

    const opacityInput = document.createElement('input');
    opacityInput.type = 'range';
    opacityInput.min = 0;
    opacityInput.max = 1;
    opacityInput.step = 0.1;
    opacityInput.value = opacity;
    opacityInput.oninput = function() {
        updateGeoJSONStyle(layerId, colorInput.value, opacityInput.value, type, lineWidthInput.value);
        updateLayerAttributes(layerId, 'opacity', parseFloat(opacityInput.value));
    };

    const lineWidthInput = document.createElement('input');
    lineWidthInput.type = 'range';
    lineWidthInput.min = 0.3;
    lineWidthInput.max = 5;
    lineWidthInput.step = 0.1;
    lineWidthInput.value = lineWidth;
    lineWidthInput.style.display = type === 'line' ? 'block' : 'none';
    lineWidthInput.oninput = function() {
        updateGeoJSONStyle(layerId, colorInput.value, opacityInput.value, type, parseFloat(lineWidthInput.value));
        updateLayerAttributes(layerId, 'lineWidth', parseFloat(lineWidthInput.value));
    };

    const fillIcon = document.createElement('img');
    fillIcon.className = 'fill-icon';
    fillIcon.src = 'css/images/fill.png';
    fillIcon.style.display = type === 'fill' ? 'inline-block' : 'none';
    fillIcon.onclick = function() {
        type = 'line';
        fillIcon.style.display = 'none';
        lineIcon.style.display = 'inline-block';
        lineWidthInput.style.display = 'block';
        updateGeoJSONStyle(layerId, colorInput.value, opacityInput.value, type, parseFloat(lineWidthInput.value));
        updateLayerAttributes(layerId, 'type', type);
    };

    const lineIcon = document.createElement('img');
    lineIcon.className = 'line-icon';
    lineIcon.src = 'css/images/line.png';
    lineIcon.style.display = type === 'line' ? 'inline-block' : 'none';
    lineIcon.onclick = function() {
        type = 'fill';
        lineIcon.style.display = 'none';
        fillIcon.style.display = 'inline-block';
        lineWidthInput.style.display = 'none';
        updateGeoJSONStyle(layerId, colorInput.value, opacityInput.value, type, parseFloat(lineWidthInput.value));
        updateLayerAttributes(layerId, 'type', type);
    };

    const removeButton = document.createElement('span');
    removeButton.className = 'remove-button';
    removeButton.textContent = 'X';
    removeButton.onclick = function() {
        removeGeoJSON(layerId);
        if (layerItem.parentNode) {
            layerItem.parentNode.removeChild(layerItem);
        }
    };

    layerItem.appendChild(layerSelector);
    layerItem.appendChild(visibilityButton);
    layerItem.appendChild(layerLabel);
    layerItem.appendChild(colorSquare);
    layerItem.appendChild(colorInput);
    layerItem.appendChild(opacityInput);
    layerItem.appendChild(lineWidthInput);
    layerItem.appendChild(fillIcon);
    layerItem.appendChild(lineIcon);
    layerItem.appendChild(removeButton);

    const items = Array.from(layerList.querySelectorAll('.layer-item'));
    const insertBeforeItem = items.find(item => parseInt(item.getAttribute('data-order')) > order);
    if (insertBeforeItem) {
        layerList.insertBefore(layerItem, insertBeforeItem);
    } else {
        layerList.appendChild(layerItem);
    }

    new Sortable(layerList, {
        animation: 150,
        handle: '.layer-selector',
        onEnd: function(evt) {
            reorderLayers();
        }
    });

    layerDefinitions[layerId] = {
        layerId,
        layerName,
        fileName: layerName,
        color,
        opacity,
        order,
        type,
        lineWidth
    };

    reorderLayers();
}

function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function updateLayerAttributes(layerId, key, value) {
    if (layerDefinitions[layerId]) {
        layerDefinitions[layerId][key] = value;
    }
}

function loadLayers() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const loadedConfig = JSON.parse(e.target.result);

                document.querySelectorAll('.layer-item').forEach(item => item.remove());
                map.getStyle().layers.slice().forEach(layer => {
                    if (layer.id.startsWith('geojson-layer-')) {
                        removeGeoJSON(layer.id);
                    }
                });

                layerDefinitions = {};

                                loadedConfig.sort((a, b) => a.order - b.order).forEach(config => {
                    const { layerId, layerName, color, opacity, order, type } = config;
                    layerDefinitions[layerId] = config;
                    const geojsonFilePath = `/GeoDatas/${config.fileName}`;
                    loadGeoJSONFromURL(geojsonFilePath, (geojsonData) => {
                        addGeoJSON(geojsonData, layerId, layerName, color, parseFloat(opacity), type);
                        addLayerToList(layerId, layerName, geojsonData, color, parseFloat(opacity), order, type);
                    });
                });

                setTimeout(() => {
                    reorderLayers();
                }, 1000);
            };
            reader.readAsText(file);
        }
    };
    input.click();
}

function updateGeoJSONStyle(layerId, color, opacity, type, lineWidth = 2) {
    if (map.getLayer(layerId)) {
        const currentType = map.getLayer(layerId).type;
        if (currentType !== type) {
            changeLayerType(layerId, type);
        }
        if (type === 'fill') {
            map.setPaintProperty(layerId, 'fill-color', color);
            map.setPaintProperty(layerId, 'fill-opacity', parseFloat(opacity));
        } else if (type === 'line') {
            map.setPaintProperty(layerId, 'line-color', color);
            map.setPaintProperty(layerId, 'line-opacity', parseFloat(opacity));
            map.setPaintProperty(layerId, 'line-width', parseFloat(lineWidth));
        } else if (type === 'background') {
            map.setPaintProperty(layerId, 'background-color', color);
            map.setPaintProperty(layerId, 'background-opacity', parseFloat(opacity));
        }
    }
}

function updateLayerList() {
    const mapLayers = getMapLayersSorted();
    mapLayers.sort((a, b) => b.index - a.index); // Sort layers by index in descending order
    mapLayers.forEach(layer => {
        addLayerToList(layer.id, layer.id, null, '#FFFFFF', 1, layer.index, layer.type);
    });
}




