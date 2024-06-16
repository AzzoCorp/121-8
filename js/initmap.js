let layerDefinitions = {};
let layerCounter = 0;
let parcelMarker;
let parcelTimeout;
let systemLayers = [];
mapboxgl.accessToken = 'pk.eyJ1IjoiYXp6b2NvcnAiLCJhIjoiY2x4MDVtdnowMGlncjJqcmFhbjhjaDhidiJ9.iNiKldcG83Nr02956JPbTA';
const customMarkerIcon = 'css/images/egliseO.png';
let map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/azzocorp/clxfnkj8a005j01qr2fjue7bj',
	//clx0x359w000f01qs8u62crxc clxbhzw0s024m01pc7mighlww  clxfj5xec006001pfa13o6q87 mapbox://styles/azzocorp/clxfmmf63006901pcbo09597x clxfjw3m8005e01qm10gdc10k mapbox://styles/azzocorp/clxfmzlo4005k01pd7usb2696 mapbox://styles/azzocorp/clxfnkj8a005j01qr2fjue7bj
    center: [-63.613927, 2.445929],
    zoom: 0
});
window.onload = function() {
    loadMarkdownFile('README.md', 'lisezmoi', "<br><p>Depuis le fichier readme.dm du github du projet.</p>");
    loadMarkdownFile('INFORMATIONS.md', 'informations', "<br><p>Depuis le fichier INFORMATIONS.dm du github du projet.</p>");
};



map.on('load', async function() {
    // Adding the second GeoJSON source
    const depotsSource = 'depots-parcelles';
    if (!map.getSource(depotsSource)) {
        map.addSource(depotsSource, {
            type: 'geojson',
            data: 'GeoDatas/outputdepots.geojson',
        });

        map.addLayer({
            id: 'depots-layer',
            type: 'fill',
            source: depotsSource,
            layout: {},
            paint: {
                'fill-color': '#FF00FF', // Flashy magenta color
                'fill-opacity': 1,
            },
        });

        // Popup for the second layer
        map.on('click', 'depots-layer', function(e) {
            const properties = e.features[0].properties;

            // Create a content string for the popup
            let content = '<h3>Property Details</h3>';
            content += `<strong>ID:</strong> ${properties.id}<br>`;
            content += `<strong>Commune:</strong> ${properties.commune}<br>`;
            content += `<strong>Prefix:</strong> ${properties.prefixe}<br>`;
            content += `<strong>Section:</strong> ${properties.section}<br>`;
            content += `<strong>Number:</strong> ${properties.numero}<br>`;
            content += `<strong>Contenance:</strong> ${properties.contenance} m²<br>`;
            content += `<strong>Arpente:</strong> ${properties.arpente}<br>`;
            content += `<strong>Created:</strong> ${properties.created}<br>`;
            content += `<strong>Updated:</strong> ${properties.updated}<br>`;

            // Check if depots is a string and parse it
            let depots = properties.depots;
            if (typeof depots === 'string') {
                try {
                    depots = JSON.parse(depots);
                } catch (error) {
                    console.error('Failed to parse depots:', depots, error);
                }
            }

            // Check if depots is now an array
            if (Array.isArray(depots)) {
                content += '<h3>Depots:</h3><ul>';
                depots.forEach(depot => {
                    if (Array.isArray(depot)) {
                        content += '<li>';
                        content += `<strong>Date Received:</strong> ${depot[0]}<br>`;
                        content += `<strong>Permit Number:</strong> ${depot[1]}<br>`;
                        content += `<strong>Date Issued:</strong> ${depot[2]}<br>`;
                        content += `<strong>Owner:</strong> ${depot[3]}<br>`;
                        content += `<strong>Address:</strong> ${depot[4]}<br>`;
                        content += `<strong>Area:</strong> ${depot[5]}<br>`;
                        content += `<strong>Description:</strong> ${depot[6]}<br>`;
                        content += `<strong>Additional Info:</strong> ${depot[7].replace(/\\r\\n/g, '<br>')}<br>`;
                        content += '</li>';
                    } else {
                        console.error('Depot entry is not an array:', depot);
                    }
                });
                content += '</ul>';
            } else {
                console.error('Properties depots is not an array:', depots);
            }

            new mapboxgl.Popup()
                .setLngLat(e.lngLat)
                .setHTML(content)
                .addTo(map);
        });

        // Change the cursor to pointer when hovering over the second layer
        map.on('mouseenter', 'depots-layer', function() {
            map.getCanvas().style.cursor = 'pointer';
        });

        // Change it back to default when no longer hovering over the second layer
        map.on('mouseleave', 'depots-layer', function() {
            map.getCanvas().style.cursor = '';
        });
    }
});

map.on('load', async function() {
    // Adding the GeoJSON source for favorable decisions
    const favorablesSource = 'favorables-parcelles';
    if (!map.getSource(favorablesSource)) {
        map.addSource(favorablesSource, {
            type: 'geojson',
            data: 'GeoDatas/outputfavorables.geojson',
        });

        map.addLayer({
            id: 'favorables-layer',
            type: 'fill',
            source: favorablesSource,
            layout: {},
            paint: {
                'fill-color': '#00FFFF', // Light cyan color
                'fill-opacity': 1,
            },
        });

        // Popup for the favorables layer
        map.on('click', 'favorables-layer', function(e) {
            const properties = e.features[0].properties;

            // Create a content string for the popup
            let content = '<h3>Property Details</h3>';
            content += `<strong>ID:</strong> ${properties.id}<br>`;
            content += `<strong>Commune:</strong> ${properties.commune}<br>`;
            content += `<strong>Prefix:</strong> ${properties.prefixe}<br>`;
            content += `<strong>Section:</strong> ${properties.section}<br>`;
            content += `<strong>Number:</strong> ${properties.numero}<br>`;
            content += `<strong>Contenance:</strong> ${properties.contenance} m²<br>`;
            content += `<strong>Arpente:</strong> ${properties.arpente}<br>`;
            content += `<strong>Created:</strong> ${properties.created}<br>`;
            content += `<strong>Updated:</strong> ${properties.updated}<br>`;

            // Check if decisions is a string and parse it
            let decisions = properties.decisions;
            if (typeof decisions === 'string') {
                try {
                    decisions = JSON.parse(decisions);
                } catch (error) {
                    console.error('Failed to parse decisions:', decisions, error);
                }
            }

            // Check if decisions is now an array
            if (Array.isArray(decisions)) {
                content += '<h3>Decisions:</h3><ul>';
                decisions.forEach(decision => {
                    if (Array.isArray(decision)) {
                        content += '<li>';
                        content += `<strong>Date Decision:</strong> ${decision[0]}<br>`;
                        content += `<strong>Permit Number:</strong> ${decision[1]}<br>`;
                        content += `<strong>Date Issued:</strong> ${decision[2]}<br>`;
                        content += `<strong>Owner:</strong> ${decision[3]}<br>`;
                        content += `<strong>Address:</strong> ${decision[4]}<br>`;
                        content += `<strong>Area:</strong> ${decision[5]}<br>`;
                        content += `<strong>Description:</strong> ${decision[6]}<br>`;
                        content += `<strong>Additional Info:</strong> ${decision[7].replace(/\\r\\n/g, '<br>')}<br>`;
                        content += `<strong>Status:</strong> ${decision[8]}<br>`;
                        content += '</li>';
                    } else {
                        console.error('Decision entry is not an array:', decision);
                    }
                });
                content += '</ul>';
            } else {
                console.error('Properties decisions is not an array:', decisions);
            }

            new mapboxgl.Popup()
                .setLngLat(e.lngLat)
                .setHTML(content)
                .addTo(map);
        });

        // Change the cursor to pointer when hovering over the favorables layer
        map.on('mouseenter', 'favorables-layer', function() {
            map.getCanvas().style.cursor = 'pointer';
        });

        // Change it back to default when no longer hovering over the favorables layer
        map.on('mouseleave', 'favorables-layer', function() {
            map.getCanvas().style.cursor = '';
        });
    }
});




map.on('load', function() {
    // Check if the source already exists
    if (!map.getSource('cadastre-parcelles')) {
        // Load the GeoJSON file
        fetch('GeoDatas/cadastre-2A247-parcelles.json')
            .then(response => response.json())
            .then(data => {
                // Ensure each feature has a unique id
                data.features.forEach((feature, index) => {
                    feature.id = index; // Assign a unique id to each feature
                });

                // Add the GeoJSON as a source
                map.addSource('cadastre-parcelles', {
                    type: 'geojson',
                    data: data
                });

                // Add the layer with a thin white line
                map.addLayer({
                    id: 'cadastre-parcelles-layer',
                    type: 'line',
                    source: 'cadastre-parcelles',
                    minzoom: 14, // Layer will appear at zoom level 14 and above
                    maxzoom: 22, // Layer will disappear after zoom level 22
                    paint: {
                        'line-color': '#ffffff',
                        'line-width': 0.05
                    }
                });

                // Add a fill layer for hover effect
                map.addLayer({
                    id: 'cadastre-parcelles-hover',
                    type: 'fill',
                    source: 'cadastre-parcelles',
                    minzoom: 14, // Layer will appear at zoom level 14 and above
                    maxzoom: 22, // Layer will disappear after zoom level 22
                    paint: {
                        'fill-color': '#ffffff',
                        'fill-opacity': [
                            'case',
                            ['boolean', ['feature-state', 'hover'], false],
                            0.5,
                            0
                        ]
                    }
                });

                // Add a symbol layer for labels
                map.addLayer({
                    id: 'cadastre-parcelles-labels',
                    type: 'symbol',
                    source: 'cadastre-parcelles',
                    minzoom: 15, // Labels will appear at zoom level 15 and above
                    maxzoom: 22, // Labels will disappear after zoom level 22
                    layout: {
                        'text-field': [
                            'concat',
                            ['get', 'section'], ' ', ['get', 'numero'], '\n',
                            ['get', 'contenance'], ' m²'
                        ],
                        'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                        'text-size': 12,
                        'text-offset': [0, 0.6],
                        'text-anchor': 'top',
                        'visibility': 'none' // Initially hidden
                    },
                    paint: {
                        'text-color': '#ffffff',
                        'text-halo-color': '#000000',
                        'text-halo-width': 1
                    }
                });

                // Add layer for highlighted parcel
                map.addLayer({
                    id: 'highlighted-parcel',
                    type: 'line',
                    source: 'cadastre-parcelles',
                    layout: {},
                    paint: {
                        'line-color': '#ff0000',
                        'line-width': 4
                    },
                    'filter': ['==', 'id', '']
                });

                let hoveredStateId = null;

                // Mouse move event on the fill layer
                map.on('mousemove', 'cadastre-parcelles-hover', function(e) {
                    if (e.features.length > 0) {
                        if (hoveredStateId !== null && hoveredStateId !== e.features[0].id) {
                            // Reset the previous hovered feature
                            map.setFeatureState(
                                { source: 'cadastre-parcelles', id: hoveredStateId },
                                { hover: false }
                            );
                        }
                        hoveredStateId = e.features[0].id;
                        map.setFeatureState(
                            { source: 'cadastre-parcelles', id: hoveredStateId },
                            { hover: true }
                        );

                        // Show only the label of the hovered parcel
                        map.setFilter('cadastre-parcelles-labels', ['==', ['id'], hoveredStateId]);
                        map.setLayoutProperty('cadastre-parcelles-labels', 'visibility', 'visible');
                    }
                });

                // Mouse leave event on the fill layer
                map.on('mouseleave', 'cadastre-parcelles-hover', function() {
                    if (hoveredStateId !== null) {
                        // Reset the hovered feature
                        map.setFeatureState(
                            { source: 'cadastre-parcelles', id: hoveredStateId },
                            { hover: false }
                        );
                    }
                    hoveredStateId = null;

                    // Hide labels when not hovering
                    map.setLayoutProperty('cadastre-parcelles-labels', 'visibility', 'none');
                });

                // Check for parcel references in the URL
                const parcelRefs = getUrlParameter('r');
                if (parcelRefs) {
                    const formattedParcelRefs = parseAndReformatParcelRefs(parcelRefs);
                    const parcels = parseSearchInput(formattedParcelRefs);
                    if (parcels.length > 0) {
                        // Populate the search input field with the formatted parcel references
                        document.getElementById('search-input').value = formattedParcelRefs;
                        // Perform the animation after animateView()
                        animateView(() => highlightParcels(parcels));
                    } else {
                        console.error('Invalid URL parameter. Please enter valid parcel references.');
                    }
                }
            });
    }
});




// Event listener for search button
document.getElementById('search-btn').addEventListener('click', function() {
    var searchInput = document.getElementById('search-input').value.trim();
    var parcels = parseSearchInput(searchInput);
    if (parcels.length > 0) {
        highlightParcels(parcels);
    } else {
        console.error('Invalid search input. Please enter valid parcel references.');
    }
});










// Function to parse URL parameters
function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    const results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

// Function to parse the search input into individual parcel references
function parseSearchInput(input) {
    const regex = /([A-Za-z]+)\s*(\d+)/g;
    let match;
    const parcels = [];
    while ((match = regex.exec(input)) !== null) {
        parcels.push(`${match[1].toUpperCase()} ${match[2]}`);
    }
    return parcels;
}

// Function to get a random number within a range
function getRandomInRange(min, max) {
    return Math.random() * (max - min) + min;
}

// Function to parse and reformat the parcel references from the URL parameter
function parseAndReformatParcelRefs(parcelRefs) {
    const formattedParcelRefs = parcelRefs
        .replace(/[^A-Za-z0-9]/g, ' ') // Replace non-alphanumeric characters with space
        .replace(/([A-Za-z])\s*(\d+)/g, '$1$2') // Ensure no space between letters and numbers
        .replace(/\s+/g, ' ') // Replace multiple spaces with a single space
        .trim() // Trim leading/trailing spaces
        .toUpperCase(); // Convert to uppercase

    return formattedParcelRefs;
}

// Event listener for search button
document.getElementById('search-btn').addEventListener('click', function() {
    var searchInput = document.getElementById('search-input').value.trim();
    var formattedSearchInput = parseAndReformatParcelRefs(searchInput); // Reformat the input
    document.getElementById('search-input').value = formattedSearchInput; // Update the input box with formatted value
    var parcels = parseSearchInput(formattedSearchInput);
    if (parcels.length > 0) {
        highlightParcels(parcels);
    } else {
        console.error('Invalid search input. Please enter valid parcel references.');
    }
});

function highlightParcels(parcels) {
    if (map.getLayer('highlighted-parcel')) {
        const filters = ['any'];
        let bounds = new mapboxgl.LngLatBounds();
        const notFoundParcels = [];

        parcels.forEach(parcel => {
            const [section, numero] = parcel.trim().split(/\s+/);
            filters.push(['all', ['==', ['get', 'section'], section], ['==', ['get', 'numero'], numero]]);
        });

        map.setFilter('highlighted-parcel', filters);

        // Find the coordinates of the parcels to zoom to
        const features = map.querySourceFeatures('cadastre-parcelles', {
            filter: filters
        });

        if (features.length > 0) {
            features.forEach(feature => {
                feature.geometry.coordinates[0].forEach(coord => {
                    bounds.extend(coord);
                });
            });

            // Identify not found parcels
            parcels.forEach(parcel => {
                const [section, numero] = parcel.trim().split(/\s+/);
                const found = features.some(feature => feature.properties.section === section && feature.properties.numero === numero);
                if (!found) {
                    notFoundParcels.push(parcel);
                }
            });

            const randomPitch = getRandomInRange(0, 180); // Random pitch between 0 and 180 degrees
            const randomBearing = getRandomInRange(-180, 180); // Random bearing between -180 and 180 degrees
            const randomZoomOut = getRandomInRange(9, 15); // Random zoom-out between 9 and 15 levels
            const randomTime = getRandomInRange(1500, 3500); // Random duration between 1500 and 3500 ms

            // Perform a bounce out animation before zooming in
            console.log('randomPitch :' + randomPitch);
            console.log('randomBearing :' + randomBearing);
            console.log('randomZoomOut :' + randomZoomOut);
            console.log('randomTime :' + randomTime);

            map.flyTo({
                center: map.getCenter(),
                zoom: map.getZoom() - randomZoomOut, // Zoom out
                pitch: randomPitch, // Add random pitch
                bearing: randomBearing, // Add random bearing
                duration: randomTime,
                essential: true // This animation is considered essential with respect to prefers-reduced-motion
            });

            const randomPitch1 = getRandomInRange(0, 110); // Random pitch between 0 and 110 degrees
            const randomBearing1 = getRandomInRange(-180, 180); // Random bearing between -180 and 180 degrees
            const randomZoomOut1 = getRandomInRange(9, 15); // Random zoom-out between 9 and 15 levels
            const randomTime1 = getRandomInRange(1500, 3500); // Random duration between 1500 and 3500 ms

            console.log('randomPitch1 :' + randomPitch1);
            console.log('randomBearing1 :' + randomBearing1);
            console.log('randomZoomOut1 :' + randomZoomOut1);
            console.log('randomTime1 :' + randomTime1);

            setTimeout(() => {
                map.fitBounds(bounds, {
                    padding: 20,
                    maxZoom: 17 - randomZoomOut1 / 20,
                    pitch: randomPitch1, // Reset pitch
                    bearing: randomBearing1, // Reset bearing
                    duration: randomTime1 * 2
                });

                // Add red fill background with 0.5 opacity to the highlighted parcels
                if (!map.getLayer('highlighted-parcel-fill')) {
                    map.addLayer({
                        id: 'highlighted-parcel-fill',
                        type: 'fill',
                        source: 'cadastre-parcelles',
                        layout: {},
                        paint: {
                            'fill-color': '#ff0000',
                            'fill-opacity': 0.5
                        },
                        filter: filters
                    });
                } else {
                    map.setFilter('highlighted-parcel-fill', filters);
                }

                // Log the user about missing parcels
                if (notFoundParcels.length > 0) {
                    console.log(`The following parcel references were not found: ${notFoundParcels.join(', ')}`);
                }
            }, 600); // Wait for any previous animations to complete before zooming in
        } else {
            console.log(`No features found for the given parcels: ${parcels.join(', ')}`);
        }
    } else {
        console.error('The layer "highlighted-parcel" does not exist in the map\'s style.');
    }
}




document.addEventListener('DOMContentLoaded', () => {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabBodies = document.querySelector('.tab-bodies');
    hideTabs();
    tabButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            event.stopPropagation();
            const tabId = button.getAttribute('data-tab');
            handleTabClick(tabId);
        });
    });

    const addButton = document.getElementById('add-btn');
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.geojson';
    fileInput.style.display = 'none';

    addButton.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', handleFileSelect);
    document.body.appendChild(fileInput);

    map.on('style.load', () => {
		// updateLayerList()
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const saveButton = document.getElementById('save-btn');
    const loadButton = document.getElementById('load-btn');
    const resetButton = document.getElementById('reset-btn');
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.style.display = 'none';

    saveButton.addEventListener('click', saveLayers);
    loadButton.addEventListener('click', () => fileInput.click());
    resetButton.addEventListener('click', resetLayers);
    fileInput.addEventListener('change', loadLayers);
    document.body.appendChild(fileInput);
});

document.addEventListener('DOMContentLoaded', (event) => {
    const menu = document.getElementById('menu');

    Array.from(document.querySelectorAll('.tabs')).forEach((tab_container, TabID) => {
        const registers = tab_container.querySelector('.tab-registers');
        const bodies = tab_container.querySelector('.tab-bodies');

        let activeRegister = registers.querySelector('.active-tab');
        activeRegister = activeRegister ? activeRegister : registers.children[0];
        activeRegister.classList.add('active-tab');

        Array.from(registers.children).forEach((el, i) => {
            el.setAttribute('aria-controls', `${TabID}_${i}`);
            bodies.children[i]?.setAttribute('id', `${TabID}_${i}`);

            el.addEventListener('click', (ev) => {
                let activeRegister = registers.querySelector('.active-tab');
                activeRegister.classList.remove('active-tab');
                activeRegister = el;
                activeRegister.classList.add('active-tab');
                changeBody(registers, bodies, activeRegister);
            });
        });

        function changeBody(registers, bodies, activeRegister) {
            Array.from(registers.children).forEach((el, i) => {
                if (bodies.children[i]) {
                    bodies.children[i].style.display = el == activeRegister ? 'block' : 'none';
                }
                el.setAttribute('aria-expanded', el == activeRegister ? 'true' : 'false');
            });
        }

        changeBody(registers, bodies, activeRegister);
    });
});

map.on('load', () => {
    map.loadImage('css/images/egliseO.png', (error, image) => {
        if (error) throw error;
        map.addImage('marker-15', image);
    });
});

function saveLayers() {
    if (OnOff()) { console.log(arguments.callee.name + '() <= function used'); }
    const layersState = map.getStyle().layers
        .filter(layer => layerDefinitions[layer.id]) // Only include layers that are in layerDefinitions
        .map((layer, index) => {
            const layerDef = layerDefinitions[layer.id];
            let baseFileName = layerDef.fileName ? layerDef.fileName.split('/').pop().split('-')[0] : layerDef.fileName;
            baseFileName = baseFileName.replace(/\.geojson$/, ''); // Remove any existing .geojson extension
            const fileName = baseFileName + ".geojson"; // Ensure single .geojson extension
            return {
                id: layer.id.split('-')[0], // Add the id property layer.id.split('.')[0]
                level: index, // Save the order level
                fileName: fileName, // Save only the base file name with single .geojson extension
                color: layerDef.color,
                opacity: layerDef.opacity,
                type: layerDef.type,
                weight: layerDef.weight,
                source: layerDef.baseSource // Save base source ID
            };
        });

    const blob = new Blob([JSON.stringify(layersState, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'layers.json';
    a.click();
    URL.revokeObjectURL(url);
}

function loadLayers(event) {
    if (OnOff()) { console.log(arguments.callee.name + '() <= function used'); }
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        
        try {
            const layersState = JSON.parse(content);
            // Sort layers based on their order level
            layersState.sort((a, b) => a.level - b.level);
            
            layersState.forEach(layer => {
                const baseFileName = layer.fileName.split('.')[0];
                console.log(baseFileName + ' <= baseFileName ');
                console.log('GeoDatas/' + baseFileName + ".geojson");
                layer.fileName = 'GeoDatas/' + baseFileName + ".geojson";
                console.log('layer.fileName  ' + layer.fileName);

                layer.id = baseFileName;
                console.log('layer.id  ' + layer.id);
            });
            applyLayersState(layersState);
        } catch (error) {
            console.error('Error parsing file:', error);
            alert('Error parsing file: ' + error.message);
        }
    };

    reader.readAsText(file);
    event.target.value = null;
}

function resetLayers() {
    Object.values(layerDefinitions).forEach(layer => {
        if (layer.type !== 'marker') {
            map.removeLayer(layer.id);
            map.removeSource(layer.source);
        } else {
            layer.markers.forEach(marker => marker.remove());
        }
    });

    layerDefinitions = {};
    updateLayerList();
}

function addMarkerToLayerDefinitions(marker, layerId) {
    if (!layerDefinitions[layerId]) {
        layerDefinitions[layerId] = {
            id: layerId,
            type: 'marker',
            markers: []
        };
    }
    layerDefinitions[layerId].markers.push(marker);
}

function createLayerItem(layer, index) {
    const layerItem = document.createElement('div');
    layerItem.className = 'layer-item';
    layerItem.dataset.layerId = layer.id;

    const dragIcon = document.createElement('img');
    dragIcon.src = 'css/images/drag.png';
    dragIcon.className = 'icon drag-handle';

    const visibilityIcon = document.createElement('img');
    visibilityIcon.className = 'icon';
    visibilityIcon.alt = 'Visibility';
    const initialVisibility = layer.type === 'marker' ? 'visible' : (map.getLayoutProperty(layer.id, 'visibility') || 'visible');
    visibilityIcon.src = initialVisibility === 'none' ? 'css/images/eyeshow.png' : 'css/images/eye.png';

    visibilityIcon.onclick = () => {
        const currentVisibility = map.getLayoutProperty(layer.id, 'visibility');
        if (currentVisibility === 'visible') {
            map.setLayoutProperty(layer.id, 'visibility', 'none');
            visibilityIcon.src = 'css/images/eyeshow.png';
        } else {
            map.setLayoutProperty(layer.id, 'visibility', 'visible');
            visibilityIcon.src = 'css/images/eye.png';
        }
    };

    const indexText = document.createElement('span');
    indexText.className = 'layer-index';
    indexText.textContent = `${index}`;
    indexText.style.marginRight = '10px';

    const idText = document.createElement('span');
    const baseFileName = layer.fileName ? layer.fileName.split('/').pop() : layer.id;
    idText.textContent = layer.id;
    idText.style.marginRight = '10px';

    const colorBox = document.createElement('div');
    colorBox.className = 'color-box';
    colorBox.style.backgroundColor = layer.color;
    colorBox.style.opacity = layer.opacity || 1;

    const isSystemLayer = systemLayers.includes(layer.id);
    if (!isSystemLayer) {
        colorBox.onclick = () => {
            const colorPicker = document.createElement('input');
            colorPicker.type = 'color';
            colorPicker.value = layer.color;

            colorPicker.addEventListener('input', (event) => {
                const newColor = event.target.value;
                updateLayerProperties(layer.id, { color: newColor });
            });

            colorPicker.addEventListener('change', (event) => {
                const newColor = event.target.value;
                updateLayerProperties(layer.id, { color: newColor });
            });

            colorPicker.click();
        };
    } else {
        colorBox.style.backgroundImage = 'url(css/images/empty.png)';
        colorBox.style.width = '15px';
        colorBox.style.height = '15px';
        colorBox.onclick = null;
    }

    const opacitySlider = document.createElement('input');
    opacitySlider.type = 'range';
    opacitySlider.min = '0';
    opacitySlider.max = '1';
    opacitySlider.step = '0.01';
    opacitySlider.value = layer.opacity || 1;
    opacitySlider.className = layer.type === 'line' ? 'line-opacity-slider' : 'opacity-slider';
    if (isSystemLayer) {
        opacitySlider.disabled = true;
    } else {
        opacitySlider.addEventListener('input', function () {
            updateLayerProperties(layer.id, { opacity: this.value });
        });
    }

    layerItem.appendChild(dragIcon);
    layerItem.appendChild(visibilityIcon);
    layerItem.appendChild(indexText);
    layerItem.appendChild(idText);
    layerItem.appendChild(colorBox);
    layerItem.appendChild(opacitySlider);

    if (layer.type === 'line') {
        const weightSlider = document.createElement('input');
        weightSlider.type = 'range';
        weightSlider.min = '0';
        weightSlider.max = '10';
        weightSlider.step = '0.1';
        weightSlider.value = layer.weight || 1;
        weightSlider.className = 'weight-slider';

        if (isSystemLayer) {
            weightSlider.disabled = true;
        } else {
            weightSlider.addEventListener('input', function () {
                updateLayerProperties(layer.id, { weight: this.value });
            });
        }

        layerItem.appendChild(weightSlider);
    }

    const typeToggleIcon = document.createElement('img');
    typeToggleIcon.src = `css/images/${layer.type}.png`;
    typeToggleIcon.className = 'icon';
    typeToggleIcon.alt = 'Toggle Type';
    typeToggleIcon.onclick = () => {
        toggleLayerType(layer.id);
    };

    const deleteIcon = document.createElement('span');
    deleteIcon.textContent = 'X';
    deleteIcon.className = 'icon';
    deleteIcon.style.cursor = 'pointer';
    deleteIcon.onclick = () => {
        document.getElementById('layers-list').removeChild(layerItem);
        if (layer.type !== 'marker') {
            map.removeLayer(layer.id);
            map.removeSource(layer.source);
        } else {
            layer.markers.forEach(marker => marker.remove());
        }
        delete layerDefinitions[layer.id];
    };

    layerItem.appendChild(typeToggleIcon);
    layerItem.appendChild(deleteIcon);

    if (isSystemLayer) {
        layerItem.classList.add('system-layer');
        deleteIcon.style.display = 'none';
    }

    return layerItem;
}

async function loadMarkdownFile(filePath, elementId, additionalContent) {
    try {
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        const markdown = await response.text();
        const reader = new commonmark.Parser();
        const writer = new commonmark.HtmlRenderer();
        const parsed = reader.parse(markdown);
        const result = writer.render(parsed);
        document.getElementById(elementId).innerHTML = result + additionalContent;
    } catch (error) {
        console.error('There has been a problem with your fetch operation:', error);
    }
}

function toggleLayerType(layerId) {
    const layer = layerDefinitions[layerId];
    if (!layer) return;

    let newType, newPaintProperties;

    if (layer.type === 'fill') {
        newType = 'line';
        newPaintProperties = {
            'line-color': map.getPaintProperty(layerId, 'fill-color'),
            'line-opacity': map.getPaintProperty(layerId, 'fill-opacity')
        };
    } else if (layer.type === 'line') {
        newType = 'fill';
        newPaintProperties = {
            'fill-color': map.getPaintProperty(layerId, 'line-color'),
            'fill-opacity': map.getPaintProperty(layerId, 'line-opacity')
        };
    }

    const cleanPaintProperties = {};
    for (const prop in newPaintProperties) {
        if (newPaintProperties[prop] !== undefined) {
            cleanPaintProperties[prop] = newPaintProperties[prop];
        }
    }

    const layerIndex = map.getStyle().layers.findIndex(l => l.id === layerId);
    const nextLayerId = map.getStyle().layers[layerIndex + 1]?.id;

    console.log(`Toggling layer ${layerId} from ${layer.type} to ${newType}`);
    console.log('Layer order before toggle:', map.getStyle().layers.map(l => l.id));

    map.removeLayer(layerId);

    map.addLayer({
        id: layerId,
        type: newType,
        source: layer.source,
        layout: {},
        paint: cleanPaintProperties
    }, nextLayerId);

    console.log('Layer order after toggle:', map.getStyle().layers.map(l => l.id));

    layer.type = newType;
    updateLayerUI(layerId);
    updateLayerList();
}

function updateLayerProperties(layerId, properties) {
    if (layerDefinitions[layerId]) {
        const layer = layerDefinitions[layerId];

        if (properties.color !== undefined) {
            if (layer.type === 'fill') {
                map.setPaintProperty(layerId, 'fill-color', properties.color);
            } else if (layer.type === 'line') {
                map.setPaintProperty(layerId, 'line-color', properties.color);
            }
            layer.color = properties.color;
        }

        if (properties.opacity !== undefined) {
            if (layer.type === 'fill') {
                map.setPaintProperty(layerId, 'fill-opacity', parseFloat(properties.opacity));
            } else if (layer.type === 'line') {
                map.setPaintProperty(layerId, 'line-opacity', parseFloat(properties.opacity));
            }
            layer.opacity = parseFloat(properties.opacity);
        }

        if (properties.weight !== undefined && layer.type === 'line') {
            map.setPaintProperty(layerId, 'line-width', parseFloat(properties.weight));
            layer.weight = parseFloat(properties.weight);
        }

        updateLayerUI(layerId);
    } else {
        console.error(`Layer ${layerId} not found in layerDefinitions`);
    }
}

function handleTabClick(tabId) {
    if (OnOff()) { console.log(arguments.callee.name + '() <= function used'); }
    const tabContents = document.querySelectorAll('.tab-content');
    const tabBodies = document.querySelector('.tab-bodies');
    const mapElement = document.getElementById('map');
    const tabsContainer = document.querySelector('.tabs');

    if (tabId === 'tab1') {
        tabContents.forEach(content => content.style.display = 'none');
        tabBodies.style.display = 'none';
        tabBodies.style.visibility = 'hidden';
        tabsContainer.style.height = '30px';
        mapElement.style.pointerEvents = 'auto';
    } else {
        tabContents.forEach(content => content.style.display = 'none');
        const targetTab = document.getElementById(tabId);
        if (targetTab) {
            targetTab.style.display = 'block';
        }
        tabBodies.style.display = 'block';
        tabBodies.style.visibility = 'visible';
        tabsContainer.style.height = 'auto';
        mapElement.style.pointerEvents = 'auto'; // Ensure map remains interactive
    }

    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(btn => btn.classList.remove('active-tab'));
    document.querySelector(`.tab-button[data-tab="${tabId}"]`).classList.add('active-tab');

    if (tabId === 'tab3') {
        loadReadme();
    } else if (tabId === 'tab4') {
        loadinfo();
    }
}

function loadGeoJsonLayerFromState(layer) {
    console.log('Created layer :', layer);
    if (OnOff()) { console.log(arguments.callee.name + '() <= function used'); }
    fetch(layer.fileName)
        .then(response => response.json())
        .then(data => {
            const uniqueId = generate(); // Generate a unique identifier
            const layerId = `${layer.id}-${uniqueId}`; // Ensure unique layer ID
            const sourceId = `${layer.source}-${uniqueId}`; // Ensure unique source ID

            map.addSource(sourceId, {
                type: 'geojson',
                data: data
            });

            const paintProperties = {};
            if (layer.type === 'fill') {
                paintProperties['fill-color'] = layer.color;
                paintProperties['fill-opacity'] = parseFloat(layer.opacity); // Ensure opacity is a number
            } else if (layer.type === 'line') {
                paintProperties['line-color'] = layer.color;
                paintProperties['line-opacity'] = parseFloat(layer.opacity); // Ensure opacity is a number
                paintProperties['line-width'] = isNaN(parseFloat(layer.weight)) ? 1 : parseFloat(layer.weight); // Ensure weight is a number, default to 1 if NaN
            }

            map.addLayer({
                id: layerId,
                type: layer.type,
                source: sourceId,
                paint: paintProperties
            });

            layerDefinitions[layerId] = {
                id: layerId,
                source: sourceId,
                baseSource: layer.source, // Store base source ID
                fileName: layer.fileName,
                color: layer.color,
                opacity: parseFloat(layer.opacity), // Ensure opacity is a number
                weight: isNaN(parseFloat(layer.weight)) ? 1 : parseFloat(layer.weight), // Ensure weight is a number, default to 1 if NaN
                type: layer.type
            };
        })
        .catch(error => console.error('Error loading GeoJSON:', error));
}

function addGeoJsonLayer(geojsonData, fileNameWithoutExtension) {
    if (OnOff()) { console.log(arguments.callee.name + '() <= function used'); }
    const uniqueId = generate(); // Generate a unique identifier
    const layerId = `${fileNameWithoutExtension}-${uniqueId}`;
    const sourceId = `${fileNameWithoutExtension}-source-${uniqueId}`; // Ensure unique source ID
    const isPointLayer = geojsonData.features && geojsonData.features.every(feature => feature.geometry.type === 'Point');
    const rdColor = randomColor();
    const initialOpacity = 1;

    if (isPointLayer) {
        addPointLayer(geojsonData, layerId, sourceId, rdColor, initialOpacity);
    } else {
        if (!layerDefinitions[layerId]) {
            map.addSource(sourceId, {
                type: 'geojson',
                data: geojsonData
            });

            map.addLayer({
                id: layerId,
                type: 'fill',
                source: sourceId,
                layout: {},
                paint: {
                    'fill-color': rdColor,
                    'fill-opacity': initialOpacity
                }
            });

            layerDefinitions[layerId] = {
                id: layerId,
                source: sourceId,
                baseSource: `${fileNameWithoutExtension}-source`, // Store base source ID
                type: 'fill',
                data: geojsonData,
                fileName: fileNameWithoutExtension,
                color: rdColor,
                opacity: initialOpacity,
                interactive: true,
                isSystemLayer: false
            };
        }
    }
    updateLayerList();
}

function handleFileSelect(event) {
    if (OnOff()) { console.log(arguments.callee.name + '() <= function used'); }
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        let geojsonData;

        try {
            if (file.name.endsWith('.geojson')) {
                geojsonData = JSON.parse(content);
            } else if (file.name.endsWith('.js')) {
                geojsonData = eval(content); // Attention: utiliser eval peut être dangereux si le contenu n'est pas fiable
            } else {
                alert('Unsupported file type');
                return;
            }

            const fileNameWithoutExtension = file.name.split('.').slice(0, -1).join('.');
            addGeoJsonLayer(geojsonData, fileNameWithoutExtension);
        } catch (error) {
            console.error('Error parsing file:', error);
            alert('Error parsing file');
        }
    };

    reader.readAsText(file);
    event.target.value = null;
}

function applyLayersState(layersState) {
    if (OnOff()) { console.log(arguments.callee.name + '() <= function used'); }
    layersState.forEach(layer => {
        if (layer.type === 'marker') {
            layer.markers.forEach(markerData => {
                const marker = new mapboxgl.Marker()
                    .setLngLat(markerData.coordinates)
                    .addTo(map);
                addMarkerToLayerDefinitions(marker, layer.layerId);
            });
        } else {
            loadGeoJsonLayerFromState(layer); // Use the new function
        }
    });
    updateLayerList();
}

function setLayerOpacity(layerId, opacity) {
    if (OnOff()) { console.log(arguments.callee.name + '() <= function used'); }
    map.setPaintProperty(layerId, 'fill-opacity', parseFloat(opacity));
    if (layerDefinitions[layerId]) {
        layerDefinitions[layerId].opacity = opacity;
    }
    const colorBox = document.querySelector(`.layer-item[data-layer-id="${layerId}"] .color-box`);
    if (colorBox) {
        colorBox.style.opacity = opacity;
    }
}

function updateLayerUI(layerId) {
    if (OnOff()) { console.log(arguments.callee.name + '() <= function used'); }
    const layer = layerDefinitions[layerId];
    const colorBox = document.querySelector(`.layer-item[data-layer-id="${layerId}"] .color-box`);
    if (colorBox) {
        colorBox.style.backgroundColor = layer.color;
        colorBox.style.opacity = layer.opacity;
    }
    const opacitySlider = document.querySelector(`.layer-item[data-layer-id="${layerId}"] .opacity-slider`);
    if (opacitySlider) {
        opacitySlider.value = layer.opacity;
    }
    if (layer.type === 'line') {
        const weightSlider = document.querySelector(`.layer-item[data-layer-id="${layerId}"] .weight-slider`);
        if (weightSlider) {
            weightSlider.value = layer.weight;
        }
    }
}

function animateView(callback) {
    if (OnOff()) { console.log(arguments.callee.name + '() <= function used'); }
    setTimeout(() => {
        map.flyTo({
            center: [9.27970, 41.59099],
            zoom: 15.5,
            pitch: 55,
            bearing: 90,
            duration: 1000,
            essential: true // This animation is considered essential with respect to prefers-reduced-motion
        });

        // Execute the callback after the flyTo animation completes
        map.once('moveend', () => {
            if (callback) {
                callback();
            }
        });
    }, 50);
}


function addMouseMoveListener() {
    if (OnOff()) { console.log(arguments.callee.name + '() <= function used'); }
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

function hideTabs() {
    if (OnOff()) { console.log(arguments.callee.name + '() <= function used'); }
    handleTabClick('tab1');
}

function toggleLayerVisibility(layerId, icon) {
    if (OnOff()) { console.log(arguments.callee.name + '() <= function used'); }
    const visibility = map.getLayoutProperty(layerId, 'visibility');
    map.setLayoutProperty(layerId, 'visibility', visibility === 'visible' ? 'none' : 'visible');
    icon.src = visibility === 'visible' ? 'css/images/eyeshow.png' : 'css/images/eye.png';
}

function moveLayer(layerId, beforeId) {
    if (OnOff()) { console.log(arguments.callee.name + '() <= function used'); }
    map.moveLayer(layerId, beforeId);
}

function getNextLayerType(currentType) {
    if (OnOff()) { console.log(arguments.callee.name + '() <= function used'); }
    const layerTypes = ['fill', 'line', 'fill-extrusion'];
    const currentIndex = layerTypes.indexOf(currentType);
    return layerTypes[(currentIndex + 1) % layerTypes.length];
}

function generate() {
    if (OnOff()) { console.log(arguments.callee.name + '() <= function used'); }
    let id = () => {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return id();
}

function randomColor() {
    if (OnOff()) { console.log(arguments.callee.name + '() <= function used'); }

    const colors = ['#00F6DE', '#2044E8', '#C500ED', '#17F105', '#F6EA00', '#F10C1A'];
    return colors[Math.floor(Math.random() * colors.length)];
}

function getSystemLayers() {
    if (OnOff()) { console.log(arguments.callee.name + '() <= function used'); }
    return systemLayers;
}

function getMapLayer() {
    if (OnOff()) { console.log(arguments.callee.name + '() <= function used'); }
    return map.getStyle().layers;
}

function initializeMap() {
    if (OnOff()) { console.log(arguments.callee.name + '() <= function used'); }

    map.on('style.load', () => {
        const layers = getMapLayer();
        console.log('getMapLayer :' + layers);
        const layersList = document.getElementById('layers-list');

        // Stocker les calques système
        layers.forEach(layer => {
            if (!systemLayers.includes(layer.id)) {
                systemLayers.push(layer.id);
                map.setLayoutProperty(layer.id, 'visibility', 'visible');
                console.log('systemLayers populate :' + systemLayers);
            }
        });

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
        updateLayerList(); // Mettre à jour la liste des calques après le chargement du style
    });
}

function updateLayerList() {
    if (OnOff()) { console.log(arguments.callee.name + '() <= function used'); }
    const layersList = document.getElementById('layers-list');
    if (!layersList) {
        console.error('layers-list element not found');
        return;
    }
    layersList.innerHTML = ''; // Clear the existing list
    systemLayers.forEach((layerId, index) => {
        const layer = map.getLayer(layerId);
        if (layer) {
            console.log(`Adding system layer: ${layerId}`);
            const layerItem = createLayerItem(layer, index);
            layersList.appendChild(layerItem);
        }
    });
    Object.values(layerDefinitions).forEach((layer, index) => {
        console.log(`Adding user-defined layer: ${layer.id}`);
        const layerItem = createLayerItem(layer, index + systemLayers.length);
        layersList.appendChild(layerItem);
    });
    if (!layersList.sortable) {
        layersList.sortable = new Sortable(layersList, {
            animation: 150,
            handle: '.drag-handle',
            onEnd: function (evt) {
                const oldIndex = evt.oldIndex;
                const newIndex = evt.newIndex;
                if (oldIndex !== newIndex) {
                    moveLayerByIndex(oldIndex, newIndex);
                }
            }
        });
    } else {
        layersList.sortable.option("onEnd", function (evt) {
            const oldIndex = evt.oldIndex;
            const newIndex = evt.newIndex;

            if (oldIndex !== newIndex) {
                moveLayerByIndex(oldIndex, newIndex);
            }
        });
    }
}


function addMarkerLayer(layer) {
    if (OnOff()) { console.log(arguments.callee.name + '() <= function used'); }
    const el = document.createElement('div');
    el.className = 'marker';
    el.style.backgroundImage = `url(${customMarkerIcon})`;
    el.style.width = '200px';
    el.style.height = '100px';
    el.style.backgroundSize = '400%';
	new mapboxgl.Marker(el)
        .setLngLat(layer.coordinates)
        .addTo(map);
}

function addPointLayer(geojsonData, layerId, sourceId, color, opacity) {
    if (OnOff()) { console.log(arguments.callee.name + '() <= function used'); }
    const markers = [];
    geojsonData.features.forEach(feature => {
        const el = document.createElement('div');
        el.className = 'custom-marker';
        el.style.backgroundImage = `url(${customMarkerIcon})`;
        el.style.width = '32px';
        el.style.height = '32px';
        el.style.backgroundSize = '100%';
		const marker = new mapboxgl.Marker(el)
            .setLngLat(feature.geometry.coordinates)
            .addTo(map);
		markers.push(marker);
    });
}

function moveLayerByIndex(oldIndex, newIndex) {
    if (OnOff()) { console.log(arguments.callee.name + '() <= function used'); }
    if (oldIndex === newIndex) return;
    const layers = getMapLayer();
    console.log('Layers before move:', layers);
    const movedLayer = layers.splice(oldIndex, 1)[0];
    console.log('Moved Layer:', movedLayer);
    layers.splice(newIndex, 0, movedLayer);
    console.log('Layers after move:', layers);
    const nextLayerId = layers[newIndex + 1] ? layers[newIndex + 1].id : undefined;
    console.log('Next Layer ID:', nextLayerId);
    map.moveLayer(movedLayer.id, nextLayerId);
    reorderLayerList();
}

function reorderLayerList() {
    if (OnOff()) { console.log(arguments.callee.name + '() <= function used'); }
    const layersList = document.getElementById('layers-list');
    const items = Array.from(layersList.children);
    const sortedItems = items.sort((a, b) => {
        const aIndex = Array.from(map.getStyle().layers).findIndex(layer => layer.id === a.dataset.layerId);
        const bIndex = Array.from(map.getStyle().layers).findIndex(layer => layer.id === b.dataset.layerId);
        return aIndex - bIndex;
    });
    sortedItems.forEach((item, index) => {
        const indexText = item.querySelector('.layer-index');
        indexText.textContent = `${index}`; // Start index from 0 to match the map order
    });
    layersList.innerHTML = '';
    sortedItems.forEach(item => layersList.appendChild(item));
}

function initializeMarkers(geojson) {
    if (OnOff()) { console.log(arguments.callee.name + '() <= function used'); }
    const markers = [];
    geojson.features.forEach((feature) => {
        const el = document.createElement('div');
        el.className = 'marker';
        el.style.backgroundImage = `url(css/images/${feature.properties.icon})`;
        el.style.width = '32px';
        el.style.height = '32px';

        const marker = new mapboxgl.Marker(el)
            .setLngLat(feature.geometry.coordinates)
            .setPopup(new mapboxgl.Popup({ offset: 25 }).setText(feature.properties.nom))
            .addTo(map);

        markers.push(marker);
    });
    return markers;
}

function OnOff() {
    // return false; 
    return true;
}


initializeMap();
addMouseMoveListener();

// function updateLayerListFromMap() {
    // if (OnOff()) { console.log(arguments.callee.name + '() <= function used'); }
    // const layersList = document.getElementById('layers-list');
    // console.log('layersList ', layersList);
    // if (!layersList) {
        // console.error('layers-list element not found');
        // return;
    // }
    // layersList.innerHTML = ''; // Clear the existing list
    // systemLayers.forEach((layerId, index) => {
        // const layer = map.getLayer(layerId);
        // if (layer) {
            // console.log(`Adding system layer: ${layerId}`);
            // const layerItem = createLayerItem(layer, index);
            // layersList.appendChild(layerItem);
        // }
    // });
    // Object.values(layerDefinitions).forEach((layer, index) => {
        // console.log(`Adding user-defined layer: ${layer.id}`);
        // const layerItem = createLayerItem(layer, index + systemLayers.length);
        // layersList.appendChild(layerItem);
    // });
    // if (!layersList.sortable) {
        // layersList.sortable = new Sortable(layersList, {
            // animation: 150,
            // handle: '.drag-handle',
            // onEnd: function (evt) {
                // const oldIndex = evt.oldIndex;
                // const newIndex = evt.newIndex;

                // if (oldIndex !== newIndex) {
                    // moveLayerByIndex(oldIndex, newIndex);
                // }
            // }
        // });
    // } else {
        // layersList.sortable.option("onEnd", function (evt) {
            // const oldIndex = evt.oldIndex;
            // const newIndex = evt.newIndex;
		// if (oldIndex !== newIndex) {
                // moveLayerByIndex(oldIndex, newIndex);
            // }
        // });
    // }
// }




// map.on('zoomend', () => {
    // const zoom = map.getZoom();
    // console.log('Zoomend event fired');
    // console.log('Current Zoom Level:', zoom);
    // console.log('Layer Definitions:', layerDefinitions);

    // if (layerDefinitions) {
        // Object.keys(layerDefinitions).forEach(key => {
            // const layer = layerDefinitions[key];
            // console.log(`Processing layer: ${layer.id}, type: ${layer.type}`);

            // if (layer.type === 'symbol') {
                // const visibility = zoom >= 12 && zoom <= 19 ? 'visible' : 'none';
                // console.log(`Setting symbol layer ${layer.id} visibility to: ${visibility}`);
                // map.setLayoutProperty(layer.id, 'visibility', visibility);
            // } else if (layer.type === 'marker' && layer.markers) {
                // console.log(`Processing marker layer: ${layer.id}`);
                // layer.markers.forEach(marker => {
                    // const markerElement = marker.getElement();
                    // if (markerElement) {
                        // const display = zoom >= 12 && zoom <= 19 ? 'block' : 'none';
                        // console.log(`Marker element: ${markerElement}, setting display to: ${display}`);
                        // markerElement.style.display = display;
                    // } else {
                        // console.log(`Marker element not found for marker: ${marker}`);
                    // }
                // });
            // } else {
                // console.log(`Layer ${layer.id} is not of type 'marker' or does not have 'markers'.`);
            // }
        // });
    // } else {
        // console.log('layerDefinitions is undefined or empty.');
    // }
// });