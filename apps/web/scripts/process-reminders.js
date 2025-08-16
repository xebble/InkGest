#!/usr/bin/env node

/**
 * Cron job script to process pending reminders
 * This script should be run every 15 minutes to check for and send pending reminders
 * 
 * Usage:
 * node scripts/process-reminders.js
 * 
 * Or add to crontab:
 * */15 * * * * cd /path/to/app && node scripts/process-reminders.js
 */

const fetch = require('node-fetch');

const CRON_SECRET = process.env.CRON_SECRET;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function processReminders() {
  try {
    console.log(`[${new Date().toISOString()}] Processing pending reminders...`);

    if (!CRON_SECRET) {
      throw new Error('CRON_SECRET environment variable is not set');
    }

    const response = await fetch(`${APP_URL}/api/reminders`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    const result = await response.json();
    console.log(`[${new Date().toISOString()}] Success:`, result.message);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error processing reminders:`, error.message);
    process.exit(1);
  }
}

// Run the script
processReminders();