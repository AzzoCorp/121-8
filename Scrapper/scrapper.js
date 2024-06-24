const puppeteer = require('puppeteer');
const fs = require('fs');

async function run() {
    const url = 'https://portovecchio.geosphere.fr/guichet-unique/Login/AffichageReglementaire';

    const browser = await puppeteer.launch({headless: true}); // Changed to headless mode
    const page = await browser.newPage();
    await page.goto(url, {waitUntil: 'networkidle0'});

    // Select '500' in the first dropdown menu
    await page.select('select[name="DataTables_Table_0_length"]', '500');

    // Wait for the data to load
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Scrape the data from the table
    let data = await page.$$eval('#DataTables_Table_0 tbody tr', rows => {
        return rows.map(row => {
            const cells = row.querySelectorAll('td');
            return [
                cells[0].innerText,
                cells[1].innerText,
                cells[2].innerText,
                cells[3].innerText,
                cells[4].innerText,
                cells[5].innerText,
                cells[6].innerText,
                cells[7].innerText,
            ];
        });
    });

    let jsonData = {
        recordsTotal: data.length,
        recordsFiltered: data.length,
        data: data
    };

    // Get current date
    let date = new Date();
    let formattedDate = date.getFullYear() + ("0" + (date.getMonth() + 1)).slice(-2) + ("0" + date.getDate()).slice(-2);

    fs.writeFileSync(`../GeoDatas/inputdepots/input_${formattedDate}.json`, JSON.stringify(jsonData, null, 2));

    // Click on the second dropdown menu, type 'Décision' and press Enter
    await page.click('select[id="TypesInformation_OptionSelectionnee"]');
    await page.type('select[id="TypesInformation_OptionSelectionnee"]', 'Décision');
    await page.keyboard.press('Enter');

    // Wait for the data to load
    await new Promise(resolve => setTimeout(resolve, 2000));

   // Select '500' in the first dropdown menu
    await page.select('select[name="DataTables_Table_1_length"]', '500');

    // Wait for the selection to be processed
    await new Promise(resolve => setTimeout(resolve, 7000)); // Increased delay to 7 seconds

    // Scrape the data from the table again
    data = await page.$$eval('#DataTables_Table_1 tbody tr', rows => {
        return rows.map(row => {
            const cells = row.querySelectorAll('td');
            return [
                cells[0].innerText,
                cells[1].innerText,
                cells[2].innerText,
                cells[3].innerText,
                cells[4].innerText,
                cells[5].innerText,
                cells[6].innerText,
                cells[7].innerText,
                cells[8] ? cells[8].innerText : null,
            ];
        });
    });

    jsonData = {
        recordsTotal: data.length,
        recordsFiltered: data.length,
        data: data
    };

    fs.writeFileSync(`../GeoDatas/inputdecisions/input_${formattedDate}.json`, JSON.stringify(jsonData, null, 2));

    await browser.close();
}

run();

