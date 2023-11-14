const puppeteer = require('puppeteer');
const fs = require('fs');
// test branch
(async () => {
    const startTime = Date.now(); // Record the start time
    let lineNumber = 0; // Initialize the line number

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Specify the path to the text file
    const filePath = 'links.txt';
    // Get the current date and time as a formatted string
    const currentDate = new Date().toISOString().split('T')[0].replace(/[^0-9]/g, '-');
    console.log(currentDate)
    // Append the current date to the file name
    const outputFilePath = `zoom_marketplace_${currentDate}.json`;

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

            try {
                await page.waitForSelector('.css-legcjp', {timeout: 60000}); // Increase the timeout value to 60000ms (60 seconds)
            } catch (error) {
                console.error(`Timeout waiting for selector '.css-legcjp' for URL: ${url}`);
                continue; // Skip this URL and continue with the next one
            }


            const user_requirements = await page.$$eval('.css-16lkeer', (elements) => {
                return elements.map((element) => element.textContent);
            });

            const scopes = await page.$$eval('.css-cmr47g', (elements) => {
                return elements.map((element) => element.textContent);
            });
            await page.$$eval('.MuiLink-root', (elements) => {
                return elements.map((element) => element.textContent);
            });


            const viewInformationElements = await page.evaluate(() => {
                const elements = Array.from(document.querySelectorAll('.css-d0uhtl'));

                // Define a recursive function to check ancestors for the inner text
                const hasParentWithText = (element, text) => {
                    if (!element || element.textContent.includes("App can manage information")) {
                        return false;
                    }

                    if (element.textContent.includes(text)) {
                        return true;
                    }

                    return hasParentWithText(element.parentElement, text);
                };

                return elements
                    .filter(element => {
                        // Check if any ancestor up to the root contains the inner text
                        return hasParentWithText(element.parentElement, 'App can view information');
                    })
                    .map(element => element.textContent.trim());
            });

            const manageInformationElements = await page.evaluate(() => {
                const elements = Array.from(document.querySelectorAll('.css-d0uhtl'));

                // Define a recursive function to check ancestors for the inner text
                const hasParentWithText = (element, text) => {
                    if (!element || element.textContent.includes("App can view information")) {
                        return false;
                    }

                    if (element.textContent.includes(text)) {
                        return true;
                    }

                    return hasParentWithText(element.parentElement, text);
                };

                return elements
                    .filter(element => {
                        // Check if any ancestor up to the root contains the inner text
                        return hasParentWithText(element.parentElement, 'App can manage information');
                    })
                    .map(element => element.textContent.trim());
            });

            //
            // const manageInformationElements = await page.evaluate(() => {
            //     const elements = Array.from(document.querySelectorAll('.css-gyjl6 + .css-0 .css-d0uhtl'));
            //     return elements
            //         .filter(element => {
            //             const parent = element.closest('.MuiBox-root.css-gyjl6'); // Replace 'your-parent-selector' with the actual parent selector
            //             return parent && parent.parent && parent.parent.parent.parent.parent.parent.parent.parent.innerText.includes("App can manage information");
            //         })
            //         .map(element => element.textContent.trim());
            // });
// Log the information
//             console.log('View Information Elements:', viewInformationElements);
            // console.log('Manage Information Elements:', manageInformationElements);
            const linksToFind = [
                'Developer Documentation',
                'Developer Privacy Policy',
                'Developer Support',
                'Developer Terms of Use',
            ];

            const hrefs = {};

            for (const linkText of linksToFind) {
                const href = await page.evaluate((text) => {
                    const links = document.querySelectorAll('.MuiLink-root');
                    for (const link of links) {
                        if (link.textContent === text) {
                            return link.getAttribute('href');
                        }
                    }
                    return null;
                }, linkText);

                hrefs[linkText] = href;
            }

            const pageTitle = await page.title();

            // Create a JSON object for the current link
            const item = {
                appName: pageTitle,
                appUrl: url,
                scopes: scopes,
                userRequirements: user_requirements,
                viewPermissions: viewInformationElements,
                managePermissions: manageInformationElements,
                developerDocumentation: hrefs['Developer Documentation'],
                developerPrivacyPolicy: hrefs['Developer Privacy Policy'],
                developerSupport: hrefs['Developer Support'],
                developerTermsOfUse: hrefs['Developer Terms of Use']
            };

            // Increment the line number and include it in the log statement
            lineNumber++;
            // console.log(user_requirements);
            // console.log(scopes);
            console.log(`Line ${lineNumber} - Items:`, item);

            itemsArray.push(item);
        }

        // Write all items as a JSON array to the output JSON file
        fs.writeFile(outputFilePath, JSON.stringify(itemsArray, null, 4), (err) => {
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
