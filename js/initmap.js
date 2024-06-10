// Define global variables
let layerDefinitions = {};
let layerCounter = 0;
let parcelMarker;
let parcelTimeout;
let highlightedParcels = null;
mapboxgl.accessToken = 'pk.eyJ1IjoiYXp6b2NvcnAiLCJhIjoiY2x4MDVtdnowMGlncjJqcmFhbjhjaDhidiJ9.iNiKldcG83Nr02956JPbTA';
let map = new mapboxgl.Map({
	container: 'map',
	style: 'mapbox://styles/azzocorp/clx0x359w000f01qs8u62crxc',
	center: [-63.613927, 2.445929],
	zoom: 0
});

async function loadinfo() {
	try {
		const response = await fetch('INFORMATIONS.md');
		if (!response.ok) {
			throw new Error('Network response was not ok ' + response.statusText);
		}
		const markdown = await response.text();
		const reader = new commonmark.Parser();
		const writer = new commonmark.HtmlRenderer();
		const parsed = reader.parse(markdown);
		const result = writer.render(parsed);
		document.getElementById('informations').innerHTML = result + "<br><p>Depuis le fichier INFORMATIONS.dm du github du projet.</p>";
	} catch (error) {
		console.error('There has been a problem with your fetch operation:', error);
	}
}

async function loadReadme() {
	try {
		const response = await fetch('README.md');
		if (!response.ok) {
			throw new Error('Network response was not ok ' + response.statusText);
		}
		const markdown = await response.text();
		const reader = new commonmark.Parser();
		const writer = new commonmark.HtmlRenderer();
		const parsed = reader.parse(markdown);
		const result = writer.render(parsed);
		document.getElementById('lisezmoi').innerHTML = result + "<br><p>Depuis le fichier readme.dm du github du projet.</p>";
	} catch (error) {
		console.error('There has been a problem with your fetch operation:', error);
	}
}

document.addEventListener('DOMContentLoaded', () => {
	const tabMenus = document.querySelectorAll('.tab-menu');
	const tabs = document.querySelectorAll('.tab');
	let clickCount = 0;
	const maxClicks = 3; // Change this value to the desired number of clicks

	tabMenus.forEach(menu => {
		menu.addEventListener('click', () => {
			clickCount++;
			if (clickCount <= maxClicks) {
				tabs.forEach(tab => tab.classList.remove('active'));
			}
			const tabId = menu.getAttribute('data-tab');
			document.getElementById(tabId).classList.add('active');
		});
	});
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
	}
);

document.addEventListener('DOMContentLoaded', () => {
    map.on('style.load', () => {
        const layers = getMapLayer();
        const layersList = document.getElementById('layers-list');

        layers.forEach(layer => {
            const layerItem = document.createElement('div');
            layerItem.className = 'layer-item';

            const dragIcon = document.createElement('img');
            dragIcon.src = 'css/images/drag.png';
            dragIcon.className = 'icon';
            dragIcon.alt = 'Drag';

            const visibilityIcon = document.createElement('img');
            visibilityIcon.src = 'css/images/eye.svg';
            visibilityIcon.className = 'icon';
            visibilityIcon.alt = 'Visibility';

            const indexText = document.createElement('span');
            indexText.textContent = layer.index;
            indexText.style.marginRight = '10px';

            const idText = document.createElement('span');
            idText.textContent = layer.id;
            idText.style.marginRight = '10px';

            const colorBox = document.createElement('div');
            colorBox.className = 'color-box';
            colorBox.style.backgroundColor = getColorForLayer(layer);

            const opacitySlider = document.createElement('input');
            opacitySlider.type = 'range';
            opacitySlider.min = 0;
            opacitySlider.max = 1;
            opacitySlider.step = 0.01;
            opacitySlider.className = 'slider';

            const typeToggleIcon = document.createElement('img');
            typeToggleIcon.src = 'css/images/fill.png';
            typeToggleIcon.className = 'icon';
            typeToggleIcon.alt = 'Toggle Type';

            const deleteIcon = document.createElement('span');
            deleteIcon.textContent = 'X';
            deleteIcon.className = 'icon';
            deleteIcon.style.cursor = 'pointer';
            deleteIcon.onclick = () => {
                layersList.removeChild(layerItem);
            };

            layerItem.appendChild(dragIcon);
            layerItem.appendChild(visibilityIcon);
            layerItem.appendChild(indexText);
            layerItem.appendChild(idText);
            layerItem.appendChild(colorBox);
            layerItem.appendChild(opacitySlider);
            layerItem.appendChild(typeToggleIcon);
            layerItem.appendChild(deleteIcon);

            layersList.appendChild(layerItem);
        });
    });
});

map.on('mouseenter', 'parcelles-interactive-layer', function () {
    map.getCanvas().style.cursor = 'pointer';
    clearTimeout(parcelTimeout);
});

map.on('mousemove', 'parcelles-interactive-layer', function (e) {
    if (parcelMarker) {
        parcelMarker.remove();
    }

    const center = turf.centerOfMass(e.features[0]).geometry.coordinates;
    const properties = e.features[0].properties;
    const parcelReference = properties.section + " " + properties.numero;

    createParcelMarker(parcelReference, center);
});

map.on('mouseleave', 'parcelles-interactive-layer', function () {
    map.getCanvas().style.cursor = '';
    parcelTimeout = setTimeout(() => {
        if (parcelMarker) {
            parcelMarker.remove();
            parcelMarker = null;
        }
    }, 1000);
});

initializeMap();
addMouseMoveListener();

map.on('load', function() {
    const mapLayers = getMapLayersSorted();
    mapLayers.sort((a, b) => b.index - a.index); // Sort layers by index in descending order
    mapLayers.forEach(layer => {
        addLayerToList(layer.id, layer.id, null, '#FFFFFF', 1, layer.index, layer.type);
    });
	    addParcellesLayer();
    addCommuneLayer();
    addFavorablesLayer();
    addDepotsLayer();
    addUrbanisation40Layer();
    addUrbanisation80Layer();
    addCentresUrbainsLayer();
    addZonesUrbainesLayer();

    // Appeler updateLayerList après le chargement des calques GeoJSON
    updateLayerList();
});


