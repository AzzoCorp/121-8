let layerDefinitions = {};
let layerCounter = 0;
let parcelMarker;
let parcelTimeout;
let systemLayers = [];
let isDataLoaded = false;

mapboxgl.accessToken = 'pk.eyJ1IjoiYXp6b2NvcnAiLCJhIjoiY2x4MDVtdnowMGlncjJqcmFhbjhjaDhidiJ9.iNiKldcG83Nr02956JPbTA';
const customMarkerIcon = 'css/images/egliseO.png';

let map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/azzocorp/clxfnkj8a005j01qr2fjue7bj',
    center: [-63.613927, 2.445929],
    zoom: 0
});


map.on('load', function () {
    console.log('Loading GeoJSON data for cadastre-parcelles...');
    fetch('GeoDatas/cadastre-2A247-parcelles.json')
        .then(response => response.json())
        .then(data => {
            data.features.forEach((feature, index) => {
                feature.id = index;
            });

            map.addSource('cadastre-parcelles', {
                type: 'geojson',
                data: data
            });

            map.addLayer({
                id: 'cadastre-parcelles-layer',
                type: 'line',
                source: 'cadastre-parcelles',
                minzoom: 14,
                maxzoom: 22,
                paint: {
                    'line-color': '#ffffff',
                    'line-width': 0.01
                }
            });

            map.addLayer({
                id: 'cadastre-parcelles-hover',
                type: 'fill',
                source: 'cadastre-parcelles',
                minzoom: 12,
                maxzoom: 22,
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

            map.addLayer({
                id: 'cadastre-parcelles-labels',
                type: 'symbol',
                source: 'cadastre-parcelles',
                minzoom: 12,
                maxzoom: 22,
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
                    'visibility': 'none'
                },
                paint: {
                    'text-color': '#ffffff',
                    'text-halo-color': '#000000',
                    'text-halo-width': 1
                }
            });

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

            map.on('mousemove', 'cadastre-parcelles-hover', function(e) {
                if (e.features.length > 0) {
                    if (hoveredStateId !== null && hoveredStateId !== e.features[0].id) {
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

                    map.setFilter('cadastre-parcelles-labels', ['==', ['id'], hoveredStateId]);
                    map.setLayoutProperty('cadastre-parcelles-labels', 'visibility', 'visible');
                }
            });

            map.on('mouseleave', 'cadastre-parcelles-hover', function() {
                if (hoveredStateId !== null) {
                    map.setFeatureState(
                        { source: 'cadastre-parcelles', id: hoveredStateId },
                        { hover: false }
                    );
                }
                hoveredStateId = null;

                map.setLayoutProperty('cadastre-parcelles-labels', 'visibility', 'none');
            });

            const parcelRefs = getUrlParameter('r');
            if (parcelRefs) {
                const formattedParcelRefs = parseAndReformatParcelRefs(parcelRefs);
                const parcels = parseSearchInput(formattedParcelRefs);
                if (parcels.length > 0) {
                    document.getElementById('search-input').value = formattedParcelRefs;
                    animateView(() => highlightParcels(parcels));
                } else {
                    console.error('Invalid URL parameter. Please enter valid parcel references.');
                }
            }

            // Set the data loaded flag to true and log
            isDataLoaded = true;
            console.log('Data for cadastre-parcelles fully loaded');

            // Populate the "Demandes" tab
            populateDepotsList();
        })
        .catch(error => {
            console.error('Error loading GeoJSON data:', error);
        });

    // Add the commune polygon source and layer
    if (!map.getSource('commune-polygon')) {
        fetch('GeoDatas/commune.geojson')
            .then(response => response.json())
            .then(data => {
                map.addSource('commune-polygon', {
                    type: 'geojson',
                    data: data
                });

                map.addLayer({
                    id: 'commune-polygon-layer',
                    type: 'line',
                    source: 'commune-polygon',
                    paint: {
                        'line-color': '#FFFFFF', // Blue color
                        'line-width': 5,
                        'line-opacity': 0.35
                    }
                });
            })
            .catch(error => {
                console.error('Error loading commune polygon GeoJSON:', error);
            });
    }

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

map.on('load', () => {
    map.loadImage('css/images/egliseO.png', (error, image) => {
        if (error) throw error;
        map.addImage('marker-15', image);
    });
});


document.getElementById('search-btn').addEventListener('click', function() {
    if (!isDataLoaded) {
        console.error('Data is not fully loaded. Please wait and try again.');
        return;
    }
    var searchInput = document.getElementById('search-input').value.trim();
    var formattedSearchInput = parseAndReformatParcelRefs(searchInput); // Reformat the input
    console.log('Formatted search input:', formattedSearchInput);
    document.getElementById('search-input').value = formattedSearchInput; // Update the input box with formatted value
    var parcels = parseSearchInput(formattedSearchInput);
    console.log('Parsed parcels:', parcels);
    if (parcels.length > 0) {
        zoomOutToCenterCommune(() => {
            highlightParcels(parcels);
        });
    } else {
        console.error('Invalid search input. Please enter valid parcel references.');
    }
});

document.addEventListener('click', function(event) {
    if (event.target.classList.contains('locate-btn')||event.target.classList.contains('locate-btnF')) {
        if (!isDataLoaded) {
            console.error('Data is not fully loaded. Please wait and try again.');
            return;
        }
        const section = event.target.getAttribute('data-section');
        const numero = event.target.getAttribute('data-numero');
        const searchInput = `${section}${numero}`;

        document.getElementById('search-input').value = searchInput;
       
		zoomOutToCenterCommune(() => {
			document.getElementById('search-btn').click();
		}); 
    }
});

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


async function populateDepotsList() {
    if (OnOff()) {
        console.log('>>>> ' + arguments.callee.name + '() <= function used');
    }
    const depotsContainer = document.getElementById('Demandes');
    if (!depotsContainer) {
        console.error('Element with ID "Demandes" not found.');
        return;
    }
    depotsContainer.innerHTML = ''; // Clear existing content

    const depotsSource = map.getSource('depots-parcelles');
    if (depotsSource) {
        try {
            const depotsData = await fetch('GeoDatas/outputdepots.geojson').then(response => response.json());
            const features = depotsData.features;

            const groupedItems = {};
            const headParcels = new Set();
            const childParcels = new Set();

            features.forEach(feature => {
                const properties = feature.properties;

                if (typeof properties.depots === 'string') {
                    try {
                        properties.depots = JSON.parse(properties.depots);
                    } catch (error) {
                        console.error('Failed to parse depots:', properties.depots, error);
                    }
                }

                if (Array.isArray(properties.depots) && properties.depots.length > 0) {
                    properties.depots.forEach(depot => {
                        if (Array.isArray(depot)) {
                            const squareMeters = extractSquareMeters(depot[7]);
                            const difference = (squareMeters[0] - squareMeters[1]).toFixed(2);
                            const recu = depot[0];
                            const groupItems = extractGroupItems(depot[4]);
                            const headParcel = groupItems[0];

                            if (!(difference === '0.00' && squareMeters[0] === 0 && squareMeters[1] === 0)) {
                                const parcelInfo = getParcelInfo(groupItems, features);
                                const listItem = `
                                    <div class="depot-data">
                                        <strong>${difference} m² = ${squareMeters[0]} m² - ${squareMeters[1]}</strong><br>
                                        <button class="locate-btn" data-section="${properties.section}" data-numero="${properties.numero}">Trouver</button><div class="nomdeposant">${depot[3]}</div>
                                        <strong>${depot[1]}</strong><i> reçue le </i><strong>${recu}</strong><br>
                                        ${parcelInfo}
                                        <br><strong>Adresse </strong>${depot[4]}<br>
                                        <div class="desc"><strong>DESCRIPTION</strong></div>${depot[6]}<br>
                                        ${depot[7]}
                                    </div>
                                    <div class="textrmq">ID <strong>${properties.id}</strong> commune <strong>${properties.commune}</strong>
                                    <br>arpenté <strong>${properties.arpente}</strong>
                                    créée <strong>${properties.created}</strong> màj <strong>${properties.updated}</strong><br>
                                `;

                                headParcels.add(headParcel);
                                groupItems.forEach(item => {
                                    if (item !== headParcel) {
                                        childParcels.add(item);
                                    }
                                });

                                if (!groupedItems[headParcel]) {
                                    groupedItems[headParcel] = {
                                        groupItems: groupItems,
                                        depots: []
                                    };
                                }
                                groupedItems[headParcel].depots.push({ difference: parseFloat(difference), html: listItem });
                            }
                        }
                    });
                }
            });

            const finalGroupItems = new Set([...headParcels].filter(item => !childParcels.has(item)));

            const listItems = [];
            for (const headParcel of finalGroupItems) {
                if (groupedItems.hasOwnProperty(headParcel)) {
                    const group = groupedItems[headParcel];
                    const mergedDepots = group.depots[0].html; // Only take the first depot which is the head
                    const totalDifference = group.depots[0].difference; // Only take the first depot's difference

                    const listItem = `
                        <div class="depot-group">
                            ${mergedDepots}
                        </div>
                    `;
                    listItems.push({ difference: totalDifference, html: listItem });
                }
            }

            // Sort by difference in descending order
            listItems.sort((a, b) => b.difference - a.difference);

            listItems.forEach(item => {
                const listItemElement = document.createElement('div');
                listItemElement.className = 'list-item';
                listItemElement.innerHTML = item.html;
                depotsContainer.appendChild(listItemElement);
            });

            const itemCountElement = document.createElement('div');
            itemCountElement.innerHTML = `
                <strong>Demandes totales :</strong> ${finalGroupItems.size}<br><br>
            `;
            depotsContainer.insertBefore(itemCountElement, depotsContainer.firstChild);
        } catch (error) {
            console.error('Error loading depot data:', error);
        }
    } else {
        console.error('Depots source not found.');
    }
}



function getParcelInfo(groupItems, features) {
    const parcelData = {};

    // Collect the contenance for each parcel in the group
    features.forEach(feature => {
        const properties = feature.properties;
        const parcelId = `${properties.section} ${properties.numero}`;
        parcelData[parcelId] = properties.contenance || 0;
    });

    let totalArea = 0;
    const headParcel = groupItems[0];
    const headParcelArea = parcelData[headParcel] || 0;
    totalArea += headParcelArea;

    const parcelDescriptions = groupItems.filter(parcel => parcel !== headParcel).map(parcel => {
        const area = parcelData[parcel] || 0;
        totalArea += area;
        return `${parcel} (${area} m²)`;
    });

    const aussiSur = parcelDescriptions.length > 0 ? ` + ${parcelDescriptions.join(' + ')}` : '';
    
    // Conditionally append total area information only if there are child parcels
    const totalAreaInfo = parcelDescriptions.length > 0 ? ` = ${totalArea} m²` : '';

    return `Parcelle ${headParcel} (${headParcelArea} m²)${aussiSur}${totalAreaInfo}`;
}

async function populateFavorablesList() {
    if (OnOff()) {
        console.log('>>>> ' + arguments.callee.name + '() <= function used');
    }
    const favorablesContainer = document.getElementById('Décisions');
    if (!favorablesContainer) {
        console.error('Element with ID "Décisions" not found.');
        return;
    }
    favorablesContainer.innerHTML = ''; // Clear existing content

    const favorablesSource = map.getSource('favorables-parcelles');
    if (favorablesSource) {
        try {
            const favorablesData = await fetch('GeoDatas/outputfavorables.geojson').then(response => response.json());
            const features = favorablesData.features;

            const groupedItems = {};
            const headParcels = new Set();
            const childParcels = new Set();

            features.forEach(feature => {
                const properties = feature.properties;

                if (typeof properties.decisions === 'string') {
                    try {
                        properties.decisions = JSON.parse(properties.decisions);
                    } catch (error) {
                        console.error('Failed to parse decisions:', properties.decisions, error);
                    }
                }

                if (Array.isArray(properties.decisions) && properties.decisions.length > 0) {
                    properties.decisions.forEach(decision => {
                        if (Array.isArray(decision)) {
                            const squareMeters = extractSquareMeters(decision[7]);
                            const difference = (squareMeters[0] - squareMeters[1]).toFixed(2);
                            const decisionDate = decision[0];
                            const groupItems = extractGroupItems(decision[4]);
                            const headParcel = groupItems[0];

                            if (!(difference === '0.00' && squareMeters[0] === 0 && squareMeters[1] === 0)) {
                                const parcelInfo = getParcelInfo(groupItems, features);
                                const listItem = `
                                    <div class="decision-data">
                                        <strong>${difference} m² = ${squareMeters[0]} m² - ${squareMeters[1]} m²</strong><br>
                                        <button class="locate-btnF" data-section="${properties.section}" data-numero="${properties.numero}">Trouver</button><div class="nomdeposantF">${decision[3]}</div>
                                        <strong>${decision[1]}</strong><i> reçue le </i><strong>${decisionDate}</strong><br>
                                        ${parcelInfo}
                                        <br><strong>Adresse </strong>${decision[4]}<br>
                                        <div class="desc"><strong>DESCRIPTION</strong></div>${decision[6]}<br>
                                        ${decision[7]}
                                    </div>
                                    <div class="textrmq">ID <strong>${properties.id}</strong> commune <strong>${properties.commune}</strong>
                                    <br>arpenté <strong>${properties.arpente}</strong>
                                    créée <strong>${properties.created}</strong> màj <strong>${properties.updated}</strong><br>
                                `;

                                headParcels.add(headParcel);
                                groupItems.forEach(item => {
                                    if (item !== headParcel) {
                                        childParcels.add(item);
                                    }
                                });

                                if (!groupedItems[headParcel]) {
                                    groupedItems[headParcel] = {
                                        groupItems: groupItems,
                                        decisions: []
                                    };
                                }
                                groupedItems[headParcel].decisions.push({ difference: parseFloat(difference), html: listItem });
                            }
                        }
                    });
                }
            });

            const finalGroupItems = new Set([...headParcels].filter(item => !childParcels.has(item)));

            const listItems = [];
            for (const headParcel of finalGroupItems) {
                if (groupedItems.hasOwnProperty(headParcel)) {
                    const group = groupedItems[headParcel];
                    const mergedDecisions = group.decisions[0].html; // Only take the first decision which is the head
                    const totalDifference = group.decisions[0].difference; // Only take the first decision's difference

                    const listItem = `
                        <div class="decision-group">
                            ${mergedDecisions}
                        </div>
                    `;
                    listItems.push({ difference: totalDifference, html: listItem });
                }
            }

            // Sort by difference in descending order
            listItems.sort((a, b) => b.difference - a.difference);

            listItems.forEach(item => {
                const listItemElement = document.createElement('div');
                listItemElement.className = 'list-item';
                listItemElement.innerHTML = item.html;
                favorablesContainer.appendChild(listItemElement);
            });

            const itemCountElement = document.createElement('div');
            itemCountElement.innerHTML = `
                <strong>Décisions totales :</strong> ${finalGroupItems.size}<br><br>
            `;
            favorablesContainer.insertBefore(itemCountElement, favorablesContainer.firstChild);
        } catch (error) {
            console.error('Error loading favorable data:', error);
        }
    } else {
        console.error('Favorables source not found.');
    }
}

function extractSquareMeters(data) {
    const regex = /(\d+,\d+|\d+)\s*m²/g;
    const matches = data.match(regex);
    if (matches && matches.length >= 2) {
        return matches.slice(0, 2).map(match => parseFloat(match.replace(',', '.')));
    }
    return [0, 0];
}

function extractGroupItems(address) {
    const firstMatch = address.match(/\((.*)/);
    if (firstMatch) {
        const afterFirstParenthesis = firstMatch[1];
        const secondMatch = afterFirstParenthesis.match(/(.*?)\)/);
        if (secondMatch) {
            const groupItemsString = secondMatch[1];
            const groupItems = groupItemsString.split(',').map(item => item.trim());
            return groupItems;
        }
    }
    return [];
}

function extractSquareMeters(data) {
    const regex = /(\d+,\d+|\d+)\s*m²/g;
    const matches = data.match(regex);
    if (matches && matches.length >= 2) {
        return matches.slice(0, 2).map(match => parseFloat(match.replace(',', '.')));
    }
    return [0, 0];
}

function zoomOutToCenterCommune(callback) {
    const communeSource = map.getSource('commune-polygon');
    if (communeSource) {
        const communePolygon = communeSource._data;
        if (communePolygon) {
            // Calculate the centroid of the commune polygon using Turf.js
            const centroid = turf.centroid(communePolygon);
            const centroidCoordinates = centroid.geometry.coordinates;

            console.log('Centroid coordinates:', centroidCoordinates);

            // Center the map on the centroid
            map.flyTo({
                center: centroidCoordinates,
                zoom: 11,
                pitch: 0,
                bearing: 0,
                duration: 2000,
                essential: true
            });

            map.once('moveend', () => {
                if (callback) {
                    callback();
                }
            });
        } else {
            console.error('The data for "commune-polygon" is not available.');
        }
    } else {
        console.error('The source "commune-polygon" is not loaded.');
    }
}

function createFilters(parcels) {
    if (OnOff()) { console.log('>>>>  ' + arguments.callee.name + '() <= function used'); }
    const filters = ['any'];
    parcels.forEach(parcel => {
        const [section, numero] = parcel.trim().split(/\s+/);
        filters.push(['all', ['==', ['get', 'section'], section], ['==', ['get', 'numero'], numero]]);
    });
    return filters;
}

function extendBounds(features, bounds) {
    if (OnOff()) { console.log('>>>>  ' + arguments.callee.name + '() <= function used'); }
    features.forEach(feature => {
        feature.geometry.coordinates[0].forEach(coord => {
            bounds.extend(coord);
        });
    });
    console.log('Extended bounds:', bounds);
}

function identifyNotFoundParcels(parcels, features, notFoundParcels) {
    if (OnOff()) { console.log('>>>>  ' + arguments.callee.name + '() <= function used'); }
    parcels.forEach(parcel => {
        const [section, numero] = parcel.trim().split(/\s+/);
        const found = features.some(feature => feature.properties.section === section && feature.properties.numero === numero);
        if (!found) {
            notFoundParcels.push(parcel);
        }
    });
    console.log('Identified not found parcels:', notFoundParcels);
}

function addHighlightLayers(filters) {
    if (OnOff()) { console.log('>>>>  ' + arguments.callee.name + '() <= function used'); }
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

    if (!map.getLayer('highlighted-parcel-line')) {
        map.addLayer({
            id: 'highlighted-parcel-line',
            type: 'line',
            source: 'cadastre-parcelles',
            layout: {},
            paint: {
                'line-color': '#FFA500',
                'line-width': 4
            },
            filter: filters
        });
    } else {
        map.setFilter('highlighted-parcel-line', filters);
    }
    console.log('Highlight layers added/updated with filters:', filters);
}

function highlightParcels(parcels) {
    if (OnOff()) { console.log('>>>>  ' + arguments.callee.name + '() <= function used'); }
    if (map.getLayer('highlighted-parcel')) {
        const filters = createFilters(parcels);
        const bounds = new mapboxgl.LngLatBounds();
        const notFoundParcels = [];

        console.log('Applying filters:', filters);
        map.setFilter('highlighted-parcel', filters);

        const features = map.querySourceFeatures('cadastre-parcelles', { filter: filters });
        console.log('Queried features:', features);

        if (features.length > 0) {
            extendBounds(features, bounds);
            identifyNotFoundParcels(parcels, features, notFoundParcels);

            console.log('Features found:', features);
            console.log('Not found parcels:', notFoundParcels);

            // Log the coordinates of the features
            features.forEach(feature => {
                console.log('Feature coordinates:', feature.geometry.coordinates);
            });

            zoomOutToCenterCommune(() => {
                zoomToSelectedParcels(bounds, filters, notFoundParcels);
            });
        } else {
            console.log(`111 No features found for the given parcels: ${parcels.join(', ')}`);
            zoomOutAndRetry(filters, parcels, bounds, notFoundParcels);
        }
    } else {
        console.error('The layer "highlighted-parcel" does not exist in the map\'s style.');
    }
}

function zoomToSelectedParcels(bounds, filters, notFoundParcels) {
    if (OnOff()) { console.log('>>>>  ' + arguments.callee.name + '() <= function used'); }
    console.log('Zooming to selected parcels with bounds:', bounds);
    console.log('Filters:', JSON.stringify(filters));
    console.log('Not found parcels:', notFoundParcels);

    // Ensure bounds are valid before calling fitBounds
    if (bounds.isEmpty()) {
        console.error('Bounds are empty, cannot zoom to selected parcels.');
        return;
    }

    // Log the actual coordinates of the bounds
    console.log('Bounds south-west:', bounds.getSouthWest());
    console.log('Bounds north-east:', bounds.getNorthEast());

    try {
        map.fitBounds(bounds, {
            padding: 20,
            maxZoom: 17,
            pitch: 0,
            bearing: 0,
            duration: 2000
        });
    } catch (error) {
        console.error('Error in fitBounds:', error);
    }

    addHighlightLayers(filters);

    if (notFoundParcels.length > 0) {
        console.log(`The following parcel references were not found: ${notFoundParcels.join(', ')}`);
    }
}

function zoomOutAndRetry(filters, parcels, bounds) {
    if (OnOff()) { console.log('>>>>  ' + arguments.callee.name + '() <= function used'); }
    const communeSource = map.getSource('commune-polygon');
    if (communeSource) {
        const communePolygon = communeSource._data;
        if (communePolygon) {
            // Calculate the centroid of the commune polygon using Turf.js
            const centroid = turf.centroid(communePolygon);
            const centroidCoordinates = centroid.geometry.coordinates;

            console.log('Centroid coordinates:', centroidCoordinates);

            // Center the map on the centroid
            map.flyTo({
                center: centroidCoordinates,
                zoom: 11,
                pitch: 0,
                bearing: 0,
                duration: 2000,
                essential: true
            });

            console.log('---1 First bounce');
            map.once('moveend', () => {
                const features = map.querySourceFeatures('cadastre-parcelles', { filter: filters });
                console.log('Queried features after zooming out:', features);

                if (features.length > 0) {
                    extendBounds(features, bounds);
                    identifyNotFoundParcels(parcels, features, []);

                    console.log('Features found after zooming out:', features);

                    // Log the coordinates of the features
                    features.forEach(feature => {
                        console.log('Feature coordinates after zooming out:', feature.geometry.coordinates);
                    });

                    console.log('||||||||||||  zoomToSelectedParcels(' + bounds + ',' + JSON.stringify(filters) + ', []);');
                    zoomToSelectedParcels(bounds, filters, []);
                } else {
                    console.log(`222 No features found for the given parcels even after zooming out: ${parcels.join(', ')}`);
                }
            });
        } else {
            console.error('The data for "commune-polygon" is not available.');
        }
    } else {
        console.error('The source "commune-polygon" is not loaded.');
    }
}

function getUrlParameter(name) {
    if (OnOff()) { console.log('>>>>  '+arguments.callee.name + '() <= function used'); }	
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    const results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

function parseSearchInput(input) {
    if (OnOff()) { console.log('>>>>  '+arguments.callee.name + '() <= function used'); }	
    const regex = /([A-Za-z]+)\s*(\d+)/g;
    let match;
    const parcels = [];
    while ((match = regex.exec(input)) !== null) {
        parcels.push(`${match[1]} ${match[2]}`); // Ensure space between section and number
    }
    return parcels;
}

function getRandomInRange(min, max) {
    if (OnOff()) { console.log('>>>>  '+arguments.callee.name + '() <= function used'); }	
    return Math.random() * (max - min) + min;
}

function parseAndReformatParcelRefs(parcelRefs) {
    if (OnOff()) { console.log('>>>>  '+arguments.callee.name + '() <= function used'); }	
    const formattedParcelRefs = parcelRefs
        .replace(/[^A-Za-z0-9\s]/g, ' ') // Replace non-alphanumeric characters with space
        .replace(/\s+/g, ' ') // Replace multiple spaces with a single space
        .trim() // Trim leading/trailing spaces
        .toUpperCase(); // Convert to uppercase

    return formattedParcelRefs;
}

function handleTabClick(tabId) {
    if (OnOff()) { console.log('>>>>  '+arguments.callee.name + '() <= function used'); }	
    const tabContents = document.querySelectorAll('.tab-content');
    const tabBodies = document.querySelector('.tab-bodies');
    const mapElement = document.getElementById('map');
    const tabsContainer = document.querySelector('.tabs');

    // Hide all tab contents and reset styles
    tabContents.forEach(content => content.style.display = 'none');
    tabBodies.style.display = 'none';
    tabBodies.style.visibility = 'hidden';
    tabsContainer.style.height = '30px';
    mapElement.style.pointerEvents = 'auto';

    // Show the selected tab content
    if (tabId !== 'tab1') {
        const targetTab = document.getElementById(tabId);
        if (targetTab) {
            targetTab.style.display = 'block';
        }
        tabBodies.style.display = 'block';
        tabBodies.style.visibility = 'visible';
        tabsContainer.style.height = 'auto';
        mapElement.style.pointerEvents = 'none'; // Disable map interactions when a tab is open
    }

    // Highlight the active tab button
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(btn => btn.classList.remove('active-tab'));
    document.querySelector(`.tab-button[data-tab="${tabId}"]`).classList.add('active-tab');

    // Load specific content based on the tab
    if (tabId === 'tab6') {
        loadReadme();
    } else if (tabId === 'tab7') {
        loadinfo();
    } else if (tabId === 'tab5') {
        populateFavorablesList();
    } else if (tabId === 'tab4') {
        populateDepotsList();
    }
}

function loadinfo() {
    if (OnOff()) { console.log('>>>>  '+arguments.callee.name + '() <= function used'); }	
    console.log('loadinfo function called');
    populateDepotsList(); // Call the function to populate the depots list
}

function saveLayers() {
	
    if (OnOff()) { console.log('>>>>  '+arguments.callee.name + '() <= function used'); }
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
    if (OnOff()) { console.log('>>>>  '+arguments.callee.name + '() <= function used'); }
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
    if (OnOff()) { console.log('>>>>  '+arguments.callee.name + '() <= function used'); }	
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
    if (OnOff()) { console.log('>>>>  '+arguments.callee.name + '() <= function used'); }	
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
    if (OnOff()) { console.log('>>>>  '+arguments.callee.name + '() <= function used'); }	
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
	if (OnOff()) { console.log('>>>>  '+arguments.callee.name + '() <= function used'); }
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
    if (OnOff()) { console.log('>>>>  '+arguments.callee.name + '() <= function used'); }	
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
    if (OnOff()) { console.log('>>>>  '+arguments.callee.name + '() <= function used'); }	
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

function loadGeoJsonLayerFromState(layer) {
    if (OnOff()) { console.log('>>>>  '+arguments.callee.name + '() <= function used'); }	
    console.log('Created layer :', layer);
    if (OnOff()) { console.log('>>>>  '+arguments.callee.name + '() <= function used'); }
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
	
    if (OnOff()) { console.log('>>>>  '+arguments.callee.name + '() <= function used'); }
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
	
    if (OnOff()) { console.log('>>>>  '+arguments.callee.name + '() <= function used'); }
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
	
    if (OnOff()) { console.log('>>>>  '+arguments.callee.name + '() <= function used'); }
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
	
    if (OnOff()) { console.log('>>>>  '+arguments.callee.name + '() <= function used'); }
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
	
    if (OnOff()) { console.log('>>>>  '+arguments.callee.name + '() <= function used'); }
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
	
    if (OnOff()) { console.log('>>>>  '+arguments.callee.name + '() <= function used'); }
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
	
    if (OnOff()) { console.log('>>>>  '+arguments.callee.name + '() <= function used'); }
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
	
    if (OnOff()) { console.log('>>>>  '+arguments.callee.name + '() <= function used'); }
    handleTabClick('tab1');
}

function toggleLayerVisibility(layerId, icon) {
	
    if (OnOff()) { console.log('>>>>  '+arguments.callee.name + '() <= function used'); }
    const visibility = map.getLayoutProperty(layerId, 'visibility');
    map.setLayoutProperty(layerId, 'visibility', visibility === 'visible' ? 'none' : 'visible');
    icon.src = visibility === 'visible' ? 'css/images/eyeshow.png' : 'css/images/eye.png';
}

function moveLayer(layerId, beforeId) {
	
    if (OnOff()) { console.log('>>>>  '+arguments.callee.name + '() <= function used'); }
    map.moveLayer(layerId, beforeId);
}

function getNextLayerType(currentType) {
	
    if (OnOff()) { console.log('>>>>  '+arguments.callee.name + '() <= function used'); }
    const layerTypes = ['fill', 'line', 'fill-extrusion'];
    const currentIndex = layerTypes.indexOf(currentType);
    return layerTypes[(currentIndex + 1) % layerTypes.length];
}

function generate() {
	
    if (OnOff()) { console.log('>>>>  '+arguments.callee.name + '() <= function used'); }
    let id = () => {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return id();
}

function randomColor() {
	
    if (OnOff()) { console.log('>>>>  '+arguments.callee.name + '() <= function used'); }

    const colors = ['#00F6DE', '#2044E8', '#C500ED', '#17F105', '#F6EA00', '#F10C1A'];
    return colors[Math.floor(Math.random() * colors.length)];
}

function getSystemLayers() {
	
    if (OnOff()) { console.log('>>>>  '+arguments.callee.name + '() <= function used'); }
    return systemLayers;
}

function getMapLayer() {
	
    if (OnOff()) { console.log('>>>>  '+arguments.callee.name + '() <= function used'); }
    return map.getStyle().layers;
}

function initializeMap() {
	
    if (OnOff()) { console.log('>>>>  '+arguments.callee.name + '() <= function used'); }

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
	
    if (OnOff()) { console.log('>>>>  '+arguments.callee.name + '() <= function used'); }
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


function addPointLayer(geojsonData, layerId, sourceId, color, opacity) {
	
    if (OnOff()) { console.log('>>>>  '+arguments.callee.name + '() <= function used'); }
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
	
    if (OnOff()) { console.log('>>>>  '+arguments.callee.name + '() <= function used'); }
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
	
    if (OnOff()) { console.log('>>>>  '+arguments.callee.name + '() <= function used'); }
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
	
    if (OnOff()) { console.log('>>>>  '+arguments.callee.name + '() <= function used'); }
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
	
    return false; 
    // return true;
}

initializeMap();
addMouseMoveListener();
