const fs = require('fs');
const path = require('path');
const axios = require('axios');
const zlib = require('zlib');
const { pipeline } = require('stream');
const { promisify } = require('util');

const pipelineAsync = promisify(pipeline);

const dataDir = path.join(__dirname, '..', 'datas', 'cadastre');
const geojsonDir = path.join(__dirname, '..', 'datas', 'geojson');
fs.mkdirSync(dataDir, { recursive: true });
fs.mkdirSync(geojsonDir, { recursive: true });

async function downloadAndDecompress(url, outputPath) {
    try {
        const response = await axios({
            method: 'GET',
            url: url,
            responseType: 'stream'
        });

        const gunzip = zlib.createGunzip();
        const output = fs.createWriteStream(outputPath);

        await pipelineAsync(response.data, gunzip, output);
        console.log(`File downloaded and decompressed: ${outputPath}`);
        return true;
    } catch (error) {
        console.error(`Error downloading or decompressing file from ${url}:`, error.message);
        return false;
    }
}

async function checkCadastreUpdates() {
    try {
        const baseUrl = 'https://cadastre.data.gouv.fr/data/etalab-cadastre/latest/geojson/communes/2A/2A247/';
        const fileTypes = [
            'communes', 'parcelles', 'sections', 'feuilles',
            'batiments', 'subdivisions_fiscales', 'lieux_dits', 'prefixes_sections'
        ];

        const downloadedFiles = [];

        for (const fileType of fileTypes) {
            const fileName = fileType === 'subdivisions_fiscales' ? 'subdivisions_fiscales' : fileType;
            const fileUrl = `${baseUrl}cadastre-2A247-${fileName}.json.gz`;
            const outputPath = path.join(geojsonDir, `cadastre-2A247-${fileType}.json`);

            const success = await downloadAndDecompress(fileUrl, outputPath);
            if (success) {
                downloadedFiles.push(`cadastre-2A247-${fileType}.json`);
            }
        }

        // Get current date
        let date = new Date();
        let formattedDate = date.getFullYear() + ("0" + (date.getMonth() + 1)).slice(-2) + ("0" + date.getDate()).slice(-2);

        const checkFilePath = path.join(dataDir, `check_${formattedDate}.json`);
        const previousCheckPath = path.join(dataDir, 'previous_check.json');

        // Save new data
        const newData = {
            checkDate: formattedDate,
            downloadedFiles: downloadedFiles
        };

        fs.writeFileSync(checkFilePath, JSON.stringify(newData, null, 2));
        fs.writeFileSync(previousCheckPath, JSON.stringify(newData, null, 2));

        console.log('Check completed and data saved.');
    } catch (error) {
        console.error('Error in checkCadastreUpdates:', error);
    }
}

checkCadastreUpdates();
