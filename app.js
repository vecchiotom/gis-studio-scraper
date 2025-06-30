const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const getDocuments = async (code, username, password, userType) => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        acceptDownloads: true
    });
    const page = await context.newPage();

    try {
        await page.goto('https://www.gis-studio.com/PagheGWTUI/', { waitUntil: 'domcontentloaded' });

        // Login
        await page.fill('input[name="codice"]', code);
        await page.fill('input[name="username"]', username);
        await page.fill('input[name="pwd"]', password);
        await page.selectOption('select[name="tipo"]', userType);
        await page.locator('button.gwt-Button', { hasText: 'Login' }).click();
        await page.waitForLoadState('networkidle');

        // Navigate to documents area
        await page.getByText('Area documenti').click();
        await page.waitForSelector('button.gwt-Button');
        await page.locator('button.gwt-Button', { hasText: 'Cerca' }).click();
        await page.waitForSelector('table.webstudio-table', { state: 'visible' });

        // Get table rows
        const rows = await page.$$(`tr[__gwt_row]`);
        const results = [];

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];

            const cells = await row.$$eval('td > div', divs =>
                divs.map(div => div.textContent?.trim())
            );

            const [year, month, name, type, timestamp, filename] = cells;

            const dropdownOptions = await row.$$eval('select.gwt-ListBox option', opts =>
                opts.map(opt => opt.textContent?.trim())
            );

            // Click the preview image and wait for download
            const downloadPromise = page.waitForEvent('download');
            const previewImage = await row.$('img.webstudio-table-imglnk');
            await previewImage.click();
            const download = await downloadPromise;

            // Save to temp path
            const downloadPath = path.join(__dirname, `temp_${i}.pdf`);
            await download.saveAs(downloadPath);

            // Encode in base64
            const fileBuffer = fs.readFileSync(downloadPath);
            const base64Pdf = fileBuffer.toString('base64');

            // Clean up
            fs.unlinkSync(downloadPath);

            results.push({
                year,
                month,
                name,
                type,
                timestamp,
                filename,
                dropdownOptions,
                base64Pdf
            });
        }

        // Save result to JSON
        console.log('✅ All documents saved with base64 encoding.');
        return {success: true, data: results, message: ''};

    } catch (err) {
        console.error('Automation error:', err);
        return {success: false, data: [], message: 'Automation error: ' + err.message};
    } finally {
        await browser.close();
    }
};

module.exports = getDocuments;
