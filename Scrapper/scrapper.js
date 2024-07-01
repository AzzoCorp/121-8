const puppeteer = require('puppeteer');
const fs = require('fs');

async function run() {
    const url = 'https://portovecchio.geosphere.fr/guichet-unique/Login/AffichageReglementaire';
    let browser;

    try {
        browser = await puppeteer.launch({headless: true});
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
                return Array.from(cells, cell => cell.innerText);
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

        fs.writeFileSync(`../datas/urbanism/inputdepots/input_${formattedDate}.json`, JSON.stringify(jsonData, null, 2));

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
                return Array.from(cells, cell => cell.innerText);
            });
        });

        jsonData = {
            recordsTotal: data.length,
            recordsFiltered: data.length,
            data: data
        };

        fs.writeFileSync(`../datas/urbanism/inputdecisions/input_${formattedDate}.json`, JSON.stringify(jsonData, null, 2));

    } catch (error) {
        console.error('An error occurred:', error);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

run();
