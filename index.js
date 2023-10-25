const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    const startTime = Date.now(); // Record the start time
    let lineNumber = 0; // Initialize the line number

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Specify the path to the text file
    const filePath = 'links.txt';
    const outputFilePath = 'items.txt';

    // Read the links from the text file
    fs.readFile(filePath, 'utf8', async (err, data) => {
        if (err) {
            console.error('Error reading the file:', err);
            await browser.close();
            return;
        }

        const links = data.trim().split('\n');
        const itemsArray = [];

        for (let link of links) {
            const url = 'https://marketplace.zoom.us' + link;

            await page.goto(url);
            await page.waitForSelector('.css-d0uhtl');

            const items = await page.$$eval('.css-d0uhtl', (elements) => {
                return elements.map((element) => element.textContent);
            });

            const pageTitle = await page.title();
            items.unshift(url);
            items.unshift(pageTitle);

            // Increment the line number and include it in the log statement
            lineNumber++;
            console.log(`Line ${lineNumber} - Items:`, items);

            itemsArray.push(items.join('\n')); // Use newline as a separator
        }

        // Write all items to the output text file
        fs.writeFile(outputFilePath, itemsArray.join('\n\n'), (err) => {
            if (err) {
                console.error('Error writing the output file:', err);
            } else {
                console.log('Items have been written to', outputFilePath);

                const endTime = Date.now(); // Record the end time
                const executionTime = (endTime - startTime) / 1000; // Calculate execution time in seconds
                console.log('Program execution time:', executionTime, 'seconds');
            }
        });

        await browser.close();
    });
})();
