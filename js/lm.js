// Define global variables
let layerDefinitions = {};
let layerCounter = 0;

document.querySelector('.add-layer').draggable = false;
document.getElementById('fileInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const geojsonData = JSON.parse(e.target.result);
            const uniqueId = Date.now(); // Utiliser un horodatage pour générer une chaîne unique
            const layerId = file.name.replace('.geojson', '') + '-' + uniqueId;
            const layerName = file.name;
            addGeoJSON(geojsonData, layerId, layerName);
					console.log(file);
        };
        reader.readAsText(file);
		console.log(file);
    }
});

function updateLayerAttributes(layerId, key, value) {
    if (layerDefinitions[layerId]) {
        layerDefinitions[layerId][key] = value;
		console.log(value);
    }
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

function loadGeoJSONFromURL(url, callback) {
    fetch(url)
        .then(response => response.json())
        .then(data => callback(data))
        .catch(error => console.error('Erreur lors du chargement du GeoJSON:', error));
}

function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
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

// Function to get layers from the map and sort them by index
function getMapLayersSorted() {
    const layers = map.getStyle().layers;
    return layers.map((layer, index) => ({
        id: layer.id,
        type: layer.type,
        index: index
    })).sort((a, b) => a.index - b.index); // Sort by index in ascending order
}

// Function to add a layer to the list
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
    const insertBeforeItem = items.find(item => parseInt(item.getAttribute('data-order')) < order);
    if (insertBeforeItem) {
        layerList.insertBefore(layerItem, insertBeforeItem);
    } else {
        layerList.insertBefore(layerItem, layerList.querySelector('.add-layer').nextSibling);
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

// Reorder layers function
function reorderLayers() {
    const layerList = document.getElementById('layerList');
    const layers = Array.from(layerList.querySelectorAll('.layer-item'));

    layers.sort((a, b) => {
        return parseInt(a.getAttribute('data-order')) - parseInt(b.getAttribute('data-order'));
    });

    layers.forEach((layer, index) => {
        layer.querySelector('label').textContent = `${index} - ${layer.getAttribute('data-layer-id')}`;
        layer.setAttribute('data-order', index);
    });
}

// Map load event
map.on('load', function() {
    const mapLayers = getMapLayersSorted();
    mapLayers.forEach(layer => {
        addLayerToList(layer.id, layer.id, null, '#FFFFFF', 1, layer.index, layer.type);
    });
});

map.on('load', function() {
    const mapLayers = getMapLayersSorted();
    mapLayers.sort((a, b) => b.index - a.index); // Sort layers by index in descending order
    mapLayers.forEach(layer => {
        addLayerToList(layer.id, layer.id, null, '#FFFFFF', 1, layer.index, layer.type);
    });
});



// Fonction pour charger les données GeoJSON à partir d'une URL
async function loadGeoJSONFromURL(url, layerId) {
    const response = await fetch(url);
    const data = await response.json();
    return addLayerFromGeoJSON(data, layerId);
}

// Fonction pour ajouter une couche à partir des données GeoJSON
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

// Réorganisation des couches basées sur l'ordre spécifié
function reorderLayers() {
    const layerItems = Array.from(document.querySelectorAll('.layer-item')).filter(item => !item.classList.contains('add-layer'));
    layerItems.sort((a, b) => parseInt(a.getAttribute('data-order')) - parseInt(b.getAttribute('data-order')));

    layerItems.forEach((item, index) => {
        const layerId = item.getAttribute('data-layer-id');

        if (map.getLayer(layerId)) {
            const nextLayerId = layerItems[index + 1] ? layerItems[index + 1].getAttribute('data-layer-id') : undefined;
            map.moveLayer(layerId, nextLayerId);
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

    console.log('Layers reordered:', layerItems.map(item => item.getAttribute('data-layer-id')));
}
