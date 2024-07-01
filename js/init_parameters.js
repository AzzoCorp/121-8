// init_parameters.js
const fs = require('fs');
const path = require('path');

const parametersDir = path.join(__dirname, '..', 'datas', 'parameters');
fs.mkdirSync(parametersDir, { recursive: true });

const initialParameters = {
    cadastreDataDate: '01/04/2024',
    cadastreDataPath: 'https://cadastre.data.gouv.fr/data/etalab-cadastre/latest/geojson/communes/2A/2A247/',
    lastCheckDate: new Date().toISOString()
};

const parametersFilePath = path.join(parametersDir, 'app_parameters.json');
fs.writeFileSync(parametersFilePath, JSON.stringify(initialParameters, null, 2));

console.log('Parameters file initialized successfully.');
