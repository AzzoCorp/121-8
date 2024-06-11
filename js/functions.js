
function getMapLayer() {
    const layers = map.getStyle().layers;
    return layers.map(layer => ({
        id: layer.id,
        type: layer.type,
        index: layer.index,
        visibility: map.getLayoutProperty(layer.id, 'visibility') || 'none' // Ajout de la visibilité avec un fallback à 'none'
    }));
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

function getColorForLayer(layer) {
    // Cette fonction doit retourner la couleur du calque en fonction de ses propriétés.
    // Pour simplifier, nous retournons une couleur aléatoire ici.
    return '#' + Math.floor(Math.random() * 16777215).toString(16);
}

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

function handleTabClick(tabId) {
	const tabContents = document.querySelectorAll('.tab-content');
	const tabBodies = document.querySelector('.tab-bodies');
	const mapElement = document.getElementById('map');
	const tabsContainer = document.querySelector('.tabs');

	if (tabId === 'tab1') {
		tabContents.forEach(content => content.style.display = 'none');
		tabBodies.style.display = 'none'; // Hide the tab-bodies container
		tabBodies.style.visibility = 'hidden'; // Hide the tab-bodies container
		tabsContainer.style.height = '30px'; // Reduce the height of the tabs container
		mapElement.style.pointerEvents = 'auto'; // Enable map interactions
	} else {
		tabContents.forEach(content => content.style.display = 'none');
		const targetTab = document.getElementById(tabId);
		if (targetTab) {
			targetTab.style.display = 'block';
		}
		tabBodies.style.display = 'block'; // Show the tab-bodies container
		tabBodies.style.visibility = 'visible'; // Show the tab-bodies container
		tabsContainer.style.height = 'auto'; // Restore the height of the tabs container
		mapElement.style.pointerEvents = 'none'; // Disable map interactions
	}

	const tabButtons = document.querySelectorAll('.tab-button');
	tabButtons.forEach(btn => btn.classList.remove('active-tab'));
	document.querySelector(`.tab-button[data-tab="${tabId}"]`).classList.add('active-tab');

	// Load content for Lisezmoi and Informations tabs
	if (tabId === 'tab3') {
		loadReadme();
	} else if (tabId === 'tab4') {
		loadinfo();
	}
}

function hideTabs() {
	handleTabClick('tab1');
}

function toggleLayerVisibility(layerId, icon) {
    console.log('Toggling visibility for layer:', layerId);
    const visibility = map.getLayoutString(layerId, 'visibility');
    console.log('Current visibility:', visibility);
    map.setLayoutProperty(layerId, 'visibility', visibility === 'visible' ? 'none' : 'visible');
    console.log('New visibility:', map.getLayoutString(layerId, 'visibility'));
    icon.src = visibility === 'visible' ? 'css/images/eye.png' : 'css/images/eyeshow.png';
}

function handleTabClick(tabId) {
	const tabContents = document.querySelectorAll('.tab-content');
	const tabBodies = document.querySelector('.tab-bodies');
	const mapElement = document.getElementById('map');
	const tabsContainer = document.querySelector('.tabs');

	if (tabId === 'tab1') {
		tabContents.forEach(content => content.style.display = 'none');
		tabBodies.style.display = 'none'; // Hide the tab-bodies container
		tabBodies.style.visibility = 'hidden'; // Hide the tab-bodies container
		tabsContainer.style.height = '30px'; // Reduce the height of the tabs container
		mapElement.style.pointerEvents = 'auto'; // Enable map interactions
	} else {
		tabContents.forEach(content => content.style.display = 'none');
		const targetTab = document.getElementById(tabId);
		if (targetTab) {
			targetTab.style.display = 'block';
		}
		tabBodies.style.display = 'block'; // Show the tab-bodies container
		tabBodies.style.visibility = 'visible'; // Show the tab-bodies container
		tabsContainer.style.height = 'auto'; // Restore the height of the tabs container
		mapElement.style.pointerEvents = 'none'; // Disable map interactions
	}

	const tabButtons = document.querySelectorAll('.tab-button');
	tabButtons.forEach(btn => btn.classList.remove('active-tab'));
	document.querySelector(`.tab-button[data-tab="${tabId}"]`).classList.add('active-tab');

	// Load content for Lisezmoi and Informations tabs
	if (tabId === 'tab3') {
		loadReadme();
	} else if (tabId === 'tab4') {
		loadinfo();
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

function hideTabs() {
	handleTabClick('tab1');
}

function initializeMap() {
	
	map.on('load', () => {
		const layers = getMapLayer();
		const layersList = document.getElementById('layers-list');
		layers.forEach(layer => {
			map.setLayoutProperty(layer.id, 'visibility', 'visible');
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
		 console.log('Map is loaded, waiting for style load');

		animateView();
	});
	 
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

initializeMap();
addMouseMoveListener();