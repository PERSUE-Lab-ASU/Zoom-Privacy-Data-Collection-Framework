#!/bin/sh

# CRON JON SYNTAX -- cron "minute, day of week, day of month, month of year, day of week"
pm2 start index.js --name zoom_marketplace_timed --cron "0 0 * * 0"