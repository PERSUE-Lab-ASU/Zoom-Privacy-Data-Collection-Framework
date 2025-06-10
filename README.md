# Zoom Privacy Data Collection Framework

This project is an automated web scraper for the [Zoom App Marketplace](https://marketplace.zoom.us/), designed to collect privacy-related data from all listed apps. It extracts app permissions, privacy policies, and other metadata, logs execution details, and emails a summary report.

---

## System Overview

```
+-------------------------------+
|         Start Script          |
+-------------------------------+
| - Initialize modules          |
| - Create date folder          |
| - Create folders:             |
|   app-data                    |
|   links                       |
|   logs                        |
|   site-snapshots              |
|   privacy-policy-snapshots    |
+-------------------------------+
           |
           v
+-------------------------------+
|      Scrape Marketplace       |
+-------------------------------+
| - Loop through directory      |
|   pages (100 pages)           |
| - Scrape direct links to apps |
|   (~2500 apps)                |
| - Write links to links.txt    |
| - Log failed directory pages  |
+-------------------------------+
           |
           v
+-------------------------------+
|   Scrape Apps - First Pass    |
+-------------------------------+
| - Read links.txt (2500 apps)  |
| - Scrape app webpage          |
| - Parse privacy data          |
| - Build JSON object           |
| - Append to app-data JSON     |
| - Store app page HTML         |
+-------------------------------+
           |
           v
+-------------------------------+
|  Scrape Apps - Second Pass    |
+-------------------------------+
| - Retry failed apps           |
| - Log apps that fail again    |
+-------------------------------+
           |
           v
+-------------------------------+
|   Log Execution Details       |
+-------------------------------+
| - Log to logs.txt:            |
|   * Number of apps            |
|   * Errors (1st/2nd pass)     |
|   * Links that didn't load    |
|   * Execution time            |
+-------------------------------+
           |
           v
+-------------------------------+
|  Send Email with Details      |
+-------------------------------+
| - Create email object         |
| - Get credentials             |
| - Send email with logs        |
+-------------------------------+
```

---

## Features

- **Automated Scraping:** Collects app data, permissions, and privacy policy links from the Zoom App Marketplace.
- **Error Handling:** Retries failed app loads and logs all errors.
- **Data Organization:** Stores data in date-stamped folders for easy tracking.
- **Snapshot Archiving:** Saves HTML snapshots of app pages and privacy policies.
- **Execution Logging:** Logs all key events, errors, and summary statistics.
- **Email Reporting:** Sends a summary email with logs after each run.
- **Scheduled Runs:** Supports scheduled execution via cron/PM2.

---

## Folder Structure

```
data/
  └── YYYY-MM-DD/                # Folder for each run date
      └── <appname>/             # Folder for each app scraped on that date
          ├── app-data/
          │   └── zoom_marketplace_YYYY-MM-DD.json
          ├── links/
          │   └── links.txt
          ├── logs/
          │   └── logs.txt
          ├── site-snapshots/
          │   └── <appname>_YYYY-MM-DD.html
          └── privacy-policy-snapshots/
              └── <appname>_privacy_policy_YYYY-MM-DD.html
```

**How data is organized:**
- A folder is created for each date the script is run (e.g., `2024-06-01`).
- Inside each date folder, there is a folder for each app scraped on that date (named after the app).
- Within each app folder, the five corresponding folders are created:
  - `app-data/`, `links/`, `logs/`, `site-snapshots/`, and `privacy-policy-snapshots/`.

### Folder Contents Explained

- **app-data/**  
  Contains the main JSON file (`zoom_marketplace_YYYY-MM-DD.json`) with all the structured data collected for each app, including permissions, links, and metadata.

- **links/**  
  Stores `links.txt`, a plain text file listing all direct links to app pages scraped from the Zoom Marketplace.

- **logs/**  
  Contains `logs.txt`, which records execution details, errors, failed links, and summary statistics for each run.

- **site-snapshots/**  
  Contains HTML files for each app's main page as it appeared during scraping. Each file is named after the app and date.

- **privacy-policy-snapshots/**  
  Contains HTML files for each app's privacy policy page, if available. Each file is named after the app and date.

---

## Setup & Usage

### 1. Clone the Repository

```bash
git clone <repo-url>
cd Zoom-Privacy-Data-Collection-Framework
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```
DATA_PATH=/absolute/path/to/data/storage/location
PAGE_LOAD=100
SENDER_EMAIL=your_email@gmail.com
PASSWORD=your_email_password_or_app_password
RECIPIENT_EMAIL=recipient_email@gmail.com
```

- `DATA_PATH`: Where to store scraped data (must end with `/`).
- `PAGE_LOAD`: Number of marketplace pages to scrape (default: 100).
- Email credentials for sending logs.

### 4. Run the Scraper

```bash
node index.js
```

### 5. Schedule with PM2 (Optional)

To run weekly (as in `weekly_run_script.sh`):

```bash
pm2 start index.js --name zoom_marketplace_timed --cron "0 0 * * 0"
```

---

## Output

- **App Data:** JSON file with all scraped app details.
- **HTML Snapshots:** Raw HTML of each app and privacy policy page.
- **Logs:** Execution summary, errors, and failed links.
- **Email Report:** Summary sent to configured recipient.


## Troubleshooting

- **Puppeteer Errors:** Ensure you have a stable internet connection and sufficient permissions.
- **Email Issues:** Use an app password if 2FA is enabled on your Gmail account.
- **File Paths:** Make sure `DATA_PATH` is correct and writable.

---

## License

MIT

---

## Acknowledgments

- [Puppeteer](https://github.com/puppeteer/puppeteer)
- [Nodemailer](https://nodemailer.com/about/)
- [Zoom App Marketplace](https://marketplace.zoom.us/)
