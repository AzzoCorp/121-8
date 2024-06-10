

function getColorForLayer(layer) {
    // Cette fonction doit retourner la couleur du calque en fonction de ses propriétés.
    // Pour simplifier, nous retournons une couleur aléatoire ici.
    return '#' + Math.floor(Math.random() * 16777215).toString(16);
}

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
