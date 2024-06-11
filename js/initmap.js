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

window.onload = function() { loadReadme(); loadinfo(); };
document.addEventListener('DOMContentLoaded', () => {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabBodies = document.querySelector('.tab-bodies');

    // Set initial state
    hideTabs();

    tabButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent map click event from firing
            const tabId = button.getAttribute('data-tab');
            handleTabClick(tabId);
        });
    });

    // Add click event listener to the document to detect clicks outside tab-bodies
    document.addEventListener('click', (event) => {
        if (!tabBodies.contains(event.target) && event.target.closest('.tab-button') === null) {
            hideTabs();
        }
    });

    map.on('style.load', () => {
        const layers = getMapLayer();
        const layersList = document.getElementById('layers-list');

        layers.forEach(layer => {
            const layerItem = createLayerItem(layer);
            layersList.appendChild(layerItem);
        });

        // Initialize Sortable.js on the layers list
        new Sortable(layersList, {
            animation: 150,
            handle: '.drag-handle', // Specify the handle for dragging
            onEnd: function (evt) {
                const itemEl = evt.item; // dragged HTMLElement
                const newIndex = evt.newIndex; // the new index of the dragged element
                const oldIndex = evt.oldIndex; // the old index of the dragged element

                // Update the layer order in the map
                moveLayerByIndex(oldIndex, newIndex);
            }
        });
    });
});

function moveLayerByIndex(oldIndex, newIndex) {
    const layers = map.getStyle().layers;
    const layer = layers[oldIndex];
    layers.splice(oldIndex, 1);
    layers.splice(newIndex, 0, layer);

    map.setStyle(map.getStyle()); // Re-apply the style to update the layer order
    updateLayerList(); // Update the layer list in the UI
}

function updateLayerList() {
    const layers = getMapLayer();
    const layersList = document.getElementById('layers-list');
    layersList.innerHTML = '';

    layers.forEach(layer => {
        const layerItem = createLayerItem(layer);
        layersList.appendChild(layerItem);
    });
}

function createLayerItem(layer) {
    const layerItem = document.createElement('div');
    layerItem.className = 'layer-item';
    layerItem.dataset.layerId = layer.id;

    const dragIcon = document.createElement('img');
    dragIcon.src = 'css/images/drag.png';
    dragIcon.className = 'icon drag-handle'; // Add class for handle

    const visibilityIcon = document.createElement('img');
    visibilityIcon.className = 'icon';
    visibilityIcon.alt = 'Visibility';
    const initialVisibility = map.getLayoutProperty(layer.id, 'visibility');
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
        document.getElementById('layers-list').removeChild(layerItem);
    };

    layerItem.appendChild(dragIcon);
    layerItem.appendChild(visibilityIcon);
    layerItem.appendChild(indexText);
    layerItem.appendChild(idText);
    layerItem.appendChild(colorBox);
    layerItem.appendChild(opacitySlider);
    layerItem.appendChild(typeToggleIcon);
    layerItem.appendChild(deleteIcon);

    return layerItem;
}

function moveLayerByIndex(oldIndex, newIndex) {
    const layers = map.getStyle().layers;
    const layer = layers[oldIndex];
    layers.splice(oldIndex, 1);
    layers.splice(newIndex, 0, layer);

    // Re-apply the style to update the layer order
    const newStyle = { ...map.getStyle(), layers };
    map.setStyle(newStyle);

    map.once('style.load', () => {
        layers.forEach((layer) => {
            map.addLayer(layer);
        });
    });

    updateLayerList(); // Update the layer list in the UI
}

function updateLayerList() {
    const layers = getMapLayer();
    const layersList = document.getElementById('layers-list');
    layersList.innerHTML = '';

    layers.forEach(layer => {
        const layerItem = createLayerItem(layer);
        layersList.appendChild(layerItem);
    });
}

function createLayerItem(layer) {
    const layerItem = document.createElement('div');
    layerItem.className = 'layer-item';
    layerItem.dataset.layerId = layer.id;

    const dragIcon = document.createElement('img');
    dragIcon.src = 'css/images/drag.png';
    dragIcon.className = 'icon';

    const visibilityIcon = document.createElement('img');
    visibilityIcon.className = 'icon';
    visibilityIcon.alt = 'Visibility';
    const initialVisibility = map.getLayoutProperty(layer.id, 'visibility');
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
        document.getElementById('layers-list').removeChild(layerItem);
    };

    layerItem.appendChild(dragIcon);
    layerItem.appendChild(visibilityIcon);
    layerItem.appendChild(indexText);
    layerItem.appendChild(idText);
    layerItem.appendChild(colorBox);
    layerItem.appendChild(opacitySlider);
    layerItem.appendChild(typeToggleIcon);
    layerItem.appendChild(deleteIcon);

    return layerItem;
}

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

// Helper function to create parcel marker
function createParcelMarker(parcelReference, center) {
    parcelMarker = new mapboxgl.Marker()
        .setLngLat(center)
        .setPopup(new mapboxgl.Popup({ offset: 25 }).setText(parcelReference))
        .addTo(map);
}

// Function to get map layers
function getMapLayer() {
    const layers = map.getStyle().layers;
    return layers.map((layer, index) => ({
        id: layer.id,
        type: layer.type,
        index: index,
        visibility: map.getLayoutProperty(layer.id, 'visibility') || 'none'
    }));
}

// Function to get color for layer
function getColorForLayer(layer) {
    // This function should return the color of the layer based on its properties.
    // For simplicity, we return a random color here.
    return '#' + Math.floor(Math.random() * 16777215).toString(16);
}

// Function to hide tabs
function hideTabs() {
    handleTabClick('tab1');
}

// Function to handle tab clicks
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
