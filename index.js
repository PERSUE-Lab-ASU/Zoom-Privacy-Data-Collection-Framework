/**
 * Zoom Marketplace Data Collection Framework
 * This script automates the collection of app data from the Zoom Marketplace,
 * including app details, privacy policies, and site snapshots.
 */

const puppeteer = require('puppeteer');
const fspromise = require('fs').promises; // Use fs.promises for async file operations
require('dotenv').config();
const nodemailer = require('nodemailer');
const { exec } = require('child_process');
const path = require('path');

// Utility function to create delay between requests
const delay = ms => new Promise(res => setTimeout(res, ms));

const fs = require('fs');
const { writeFile } = require("fs");

(async () => {
    // Initialize date-based directory structure
    const currentDate = new Date().toISOString().split('T')[0].replace(/[^0-9]/g, '-');

    let errorCount = 0;
    const startTime = Date.now(); // Record the start time
    let lineNumber = 0; // Initialize the line number
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(0);
    let logContent = "";

    // Set up data directory path from environment variable
    let file_path_prefix = process.env.DATA_PATH;

    // Create necessary directory structure for data collection
    if (!fs.existsSync(file_path_prefix + `${currentDate}/links/`)) {
        fs.mkdirSync(file_path_prefix + `${currentDate}/links/`, { recursive: true });
    }

    if (!fs.existsSync(file_path_prefix + `${currentDate}/app-data/`)) {
        fs.mkdirSync(file_path_prefix + `${currentDate}/app-data/`, { recursive: true });
    }

    if (!fs.existsSync(file_path_prefix + `${currentDate}/site-snapshots/`)) {
        fs.mkdirSync(file_path_prefix + `${currentDate}/site-snapshots/`, { recursive: true });
    }

    if (!fs.existsSync(file_path_prefix + `${currentDate}/privacy-policy-snapshots/`)) {
        fs.mkdirSync(file_path_prefix + `${currentDate}/privacy-policy-snapshots/`, { recursive: true });
    }

    if (!fs.existsSync(file_path_prefix + `${currentDate}/logs/`)) {
        fs.mkdirSync(file_path_prefix + `${currentDate}/logs/`, { recursive: true });
    }

    let allAppLinks = []
    let linksFailedToLoad = []; // Array to store failed links

    const zoomBaseURL = 'https://marketplace.zoom.us';
    const logsFilePath = file_path_prefix + `${currentDate}/logs/logs.txt`;

    // Scrape app links from Zoom Marketplace pages
    for (let i = 1; i < process.env.PAGE_LOAD; i++) {
        try {
            // Navigate to the marketplace page
            await page.goto(`${zoomBaseURL}/apps?page=${i}`, { timeout: 60000 });
            await page.waitForSelector('.css-4xcoe5', { timeout: 10000 });

            // Wait for the links to load and ensure they are valid
            let links = [];

            while (true) {
                // Extract all app links from the page
                links = await page.$$eval('a[class="css-4xcoe5"]', (elements) => {
                    return elements.map((element) => element.getAttribute('href'));
                });

                // Verify all links are valid
                if (!links.includes('/apps/undefined')) {
                    break;
                }

                await page.waitForTimeout(1000); // Wait for 1 second before rechecking
            }

            // Add the baseURL to each link
            links = links.map((link) => `${zoomBaseURL}${link}`);

            console.log(links);
            allAppLinks = allAppLinks.concat(links);
        } catch (error) {
            logContent += `Failed to load directory page: ${zoomBaseURL}/apps?page=${i}\n`;
        }
    }

    console.log('Links:', allAppLinks);

    // Save collected links to file
    const filePath = file_path_prefix + `${currentDate}/links/links.txt`;
    const linksString = allAppLinks.join('\n');
    writeFile(filePath, linksString, (err) => {
        if (err) {
            console.error('Error writing to the file:', err);
        } else {
            console.log('Links have been written to', filePath);
        }
    });

    console.log(currentDate)
    const outputFilePath = file_path_prefix + `${currentDate}/app-data/zoom_marketplace_${currentDate}.json`;
    const itemsArray = [];

    // Process each app link
    for (const link of allAppLinks) {
        await processLink(link);

        // Implement rate limiting between requests
        const waitTime = 10;
        console.log("Starting " + waitTime + " second wait:");
        for (let i = 1; i < (waitTime + 1); i++) {
            await delay(1000);
            process.stdout.write(i + " ");
        }
        console.log("\nCompleted waiting for " + waitTime + " seconds");
    }

    // Retry failed links
    console.log('Retrying for failed links...');
    fs.appendFileSync(logsFilePath, 'Retrying for failed links...');

    const retryFailedLinks = [...linksFailedToLoad];
    linksFailedToLoad = []; // Reset for the second attempt

    for (const link of retryFailedLinks) {
        await processLink(link);
    }

    // Log final results
    if (linksFailedToLoad.length > 0) {
        logContent += `Failed to load after retry:\n${linksFailedToLoad.join('\n')}\n`;
    } else {
        logContent += `\nAll links loaded successfully after retry!\n`;
    }

    // Save collected data to JSON file
    fs.writeFile(outputFilePath, JSON.stringify(itemsArray, null, 4), (err) => {
        if (err) {
            console.error('Error writing the output file:', err);
        } else {
            console.log('Items have been written to', outputFilePath);
            console.log('Error Count: ', errorCount)
            const endTime = Date.now();
            const executionTime = (endTime - startTime) / 1000;
            console.log('Program execution time:', executionTime, 'seconds');
        }
    });

    // Generate execution summary
    const executionTime = (Date.now() - startTime) / 1000;
    logContent += `Program execution time: ${executionTime} seconds\n`;
    logContent += `Total Number Apps in Marketplace Today: ${allAppLinks.length}\n`
    logContent += `Total Number of Errors in Program Run: ${errorCount}\n`;
    logContent += `Apps Links that didn't load on First Pass: ${retryFailedLinks.join(' ')}\n`;
    logContent += `Total Number of Links that didn't load on second pass: ${linksFailedToLoad.length}\n`;
    logContent += `Apps Links that didn't load on Second Pass: ${linksFailedToLoad.join(' ')}\n`;
    logContent += `Total Number Apps Successfully Scraped: ${itemsArray.length}\n`
    logContent += '===============================\n';

    // Write logs to file
    fs.appendFileSync(logsFilePath, logContent);

    // Send email notification with execution results
    const transporter = nodemailer.createTransport({
        service: 'gmail', auth: {
            user: process.env.SENDER_EMAIL,
            pass: process.env.PASSWORD
        }
    });

    const mailOptions = {
        from: process.env.SENDER_EMAIL,
        to: process.env.RECIPIENT_EMAIL,
        subject: `Log Content ${currentDate}`,
        text: logContent
    };

    await transporter.sendMail(mailOptions, function (error) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent!\n');
        }
    });

    /**
     * Process individual app link and extract relevant information
     * @param {string} url - The URL of the app to process
     */
    async function processLink(url) {
        try {
            console.log("Loading Page...");
            await page.goto(url, { timeout: 60000 });
            await page.waitForSelector('.css-i3jcei', { timeout: 60000 });

            // Capture page content and title
            const htmlContent = await page.content();
            const pageTitle = await page.title();

            // Create sanitized filename
            let regex = /[^a-zA-Z0-9]/g;
            let app_path = pageTitle.replace(regex, '');
            const filename = file_path_prefix + `${currentDate}/site-snapshots/${app_path}_${currentDate}.html`;
            await fspromise.writeFile(filename, htmlContent);

            console.log("Page Loaded!");

            // Extract app information
            const user_requirements = await page.$$eval('.css-16lkeer', (elements) => {
                return elements.map((element) => element.textContent);
            });

            const scopes = await page.$$eval('.MuiBox-root.css-10khgmf', (elements) => {
                return elements.map((element) => {
                    const scopeName = element.querySelector('.MuiTypography-root.css-rpyf5q')?.textContent || '';
                    const scopeValue = element.querySelector('.MuiTypography-root.css-vhnn71')?.textContent || '';
                    return { name: scopeName, value: scopeValue };
                });
            });

            // Extract developer information with fallback options
            let developer = '';
            try {
                developer = await page.$eval('.MuiTypography-root.MuiTypography-body2.css-1t6gqoh', (element) => {
                    return element.textContent;
                });
            } catch (e) {
                developer = await page.$eval('.MuiBox-root.css-0 a', (element) => {
                    return element.textContent;
                });
            }

            // Extract app name with fallback options
            let appName = "";
            try {
                appName = await page.$eval('.css-1lc23xd', (element) => {
                    return element.textContent;
                });
            } catch (e) {
                appName = await page.$eval('.css-1gf10il', (element) => {
                    return element.textContent;
                });
            }

            // Extract additional app details
            const categories = await page.$$eval('.css-1vuggv1', (elements) => {
                return elements.map((element) => element.textContent);
            });

            const worksInArray = await page.$$eval('.css-1vuggv1', (elements) => {
                return elements.map((element) => element.textContent);
            });

            const description = await page.$eval('.css-1gpdksz', (element) => {
                return element.textContent;
            });

            // Extract view and manage permissions
            const viewInformationElements = await page.evaluate(() => {
                const elements = Array.from(document.querySelectorAll('.css-d0uhtl'));
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
                    .filter(element => hasParentWithText(element.parentElement, 'App can view information'))
                    .map(element => element.textContent.trim());
            });

            const manageInformationElements = await page.evaluate(() => {
                const elements = Array.from(document.querySelectorAll('.css-d0uhtl'));
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
                    .filter(element => hasParentWithText(element.parentElement, 'App can manage information'))
                    .map(element => element.textContent.trim());
            });

            // Extract external links
            const linksToFind = ['Documentation', 'Privacy Policy', 'Support', 'Terms of Use'];
            const hrefs = {};

            for (const linkText of linksToFind) {
                const [cur_link] = await Promise.all([page.evaluate((text) => {
                    const links = document.querySelectorAll('.MuiLink-root');
                    for (const link of links) {
                        if (link.textContent === text) {
                            return link.getAttribute('href');
                        }
                    }
                    return null;
                }, linkText)]);

                hrefs[linkText] = cur_link;
            }

            // Capture privacy policy content
            let privacyPolicyLoadedSuccessfully = false;
            let privacyPolicyFilePath = null;
            try {
                await page.goto(hrefs['Privacy Policy'], { timeout: 60000 });
                const privacy_policy_htmlContent = await page.content();
                let privacy_policy_app_path = pageTitle.replace(regex, '');
                privacyPolicyFilePath = file_path_prefix + `${currentDate}/privacy-policy-snapshots/${privacy_policy_app_path}_privacy_policy_${currentDate}.html`;
                await fspromise.writeFile(privacyPolicyFilePath, privacy_policy_htmlContent);
                privacyPolicyLoadedSuccessfully = true;
            } catch (privacyPolicyError) {
                privacyPolicyLoadedSuccessfully = false;
                privacyPolicyFilePath = null;
            }

            // Compile app data into structured object
            const item = {
                appName: appName,
                dev: developer,
                appUrl: url,
                categories: categories,
                description: description,
                worksIn: worksInArray,
                scopes: scopes,
                userRequirements: user_requirements,
                viewPermissions: viewInformationElements,
                managePermissions: manageInformationElements,
                developerDocumentation: hrefs['Documentation'],
                developerPrivacyPolicy: hrefs['Privacy Policy'],
                developerSupport: hrefs['Support'],
                developerTermsOfUse: hrefs['Terms of Use'],
                privacyPolicyLoadedSuccessfully: privacyPolicyLoadedSuccessfully,
                privacyPolicyFilePath: privacyPolicyFilePath,
                siteSnapshotFilePath: filename,
            };

            lineNumber++;
            console.log(`Line ${lineNumber} - Items:`, item, 'Error Count: ', errorCount);
            itemsArray.push(item);
        } catch (error) {
            const logsFilePath = file_path_prefix + `${currentDate}/logs/logs.txt`;
            console.error(`Timeout waiting for URL: ${url}`);
            console.error(`Error: ${error}`);
            errorCount++;
            linksFailedToLoad.push(url);
            fs.appendFileSync(logsFilePath, `Failed to app page: ${url}\n`);
        }
    }

    // Cleanup and compression
    await browser.close();
    process.chdir(`${file_path_prefix}${currentDate}/`);

    // Compress collected data folders
    compressFolder('site-snapshots');
    compressFolder('privacy-policy-snapshots')

    /**
     * Compress a folder and remove the original
     * @param {string} folderName - Name of the folder to compress
     */
    function compressFolder(folderName) {
        const zipFilePath = path.join(file_path_prefix, `${currentDate}/`, `${folderName}/`);

        exec(`zip -r ${folderName}.zip ${folderName}/`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error compressing folder: ${error}`);
                return;
            }

            exec(`rm -rf ${folderName}`, (rmError, rmStdout, rmStderr) => {
                if (rmError) {
                    console.error(`Error deleting folder: ${rmError}`);
                } else {
                    console.log(`Folder deleted successfully: ${zipFilePath}`);
                }
            });

            console.log(`Folder compressed successfully: ${zipFilePath}`);
        });
    }

})();
