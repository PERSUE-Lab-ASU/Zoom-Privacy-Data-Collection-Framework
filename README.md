# Zoom Privacy Data Collection Framework

This project is an automated web scraper for the [Zoom App Marketplace](https://marketplace.zoom.us/), designed to collect privacy-related data from all listed apps. It extracts app permissions, privacy policies, and other metadata, logs execution details, and emails a summary report.

---

## System Overview

```mermaid
flowchart TD
    A[Start Script] --> B[Scrape Marketplace]
    B --> C[Scrape Apps - First Pass]
    C --> D[Scrape Apps - Second Pass]
    D --> E[Log Execution Details]
    E --> F[Send Email with Details]

    subgraph Start Script
        A1[Initialize modules/browser/page]
        A2[Create Current Date Folder]
        A3[Create 5 Folders: app-data, links, logs, site-snapshots, privacy-policy-snapshots]
        A1 --> A2 --> A3
    end

    subgraph Scrape Marketplace
        B1[Loop through directory pages (100 pages)]
        B2[Scrape direct links to apps (~2500 apps)]
        B3[Write links to data/date/links/links.txt]
        B4[Log directory pages that failed to load]
        B1 --> B2 --> B3
        B2 --> B4
    end

    subgraph Scrape Apps - First Pass
        C1[Read links.txt and scrape app webpages]
        C2[Parse webpage to collect privacy data]
        C3[Build JSON object with app details]
        C4[Append JSON to data/date/app-data/zoom_marketplace.json]
        C5[Store app page HTML to data/date/site-snapshots/]
        C1 --> C2 --> C3 --> C4
        C3 --> C5
    end

    subgraph Scrape Apps - Second Pass
        D1[Run scraping on apps that failed first pass]
        D2[Log apps that fail to load second pass]
        D1 --> D2
    end

    subgraph Log Execution Details
        E1[Log to data/date/logs/logs.txt:]
        E2[Apps in Marketplace, Errors, Failed Links, Execution Time]
        E1 --> E2
    end

    subgraph Send Email with Details
        F1[Create email object, get credentials]
        F2[Send email with logs]
        F1 --> F2
    end
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
  └── YYYY-MM-DD/
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
DATA_PATH=/absolute/path/to/data/
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

---

## Customization

- **Add/Remove Data Fields:** Edit the `processLink` function in `index.js` to change what is scraped.
- **Change Email Logic:** Update the nodemailer section for different providers or formats.
- **Adjust Scheduling:** Modify the cron syntax in `weekly_run_script.sh` as needed.

---

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
