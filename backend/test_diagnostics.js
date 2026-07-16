const { chromium } = require('playwright');
const mongoose = require('mongoose');
const connectDB = require('./src/config/db');
const Job = require('./src/models/Job');
const fs = require('fs');

async function run() {
  await connectDB();
  const job = await Job.findOne({ source: 'Greenhouse' });
  
  console.log('Testing job URL:', job.applyUrl);
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  await page.goto(job.applyUrl, { waitUntil: 'networkidle' });
  console.log('Navigated. Waiting for 2s...');
  await page.waitForTimeout(2000);
  
  const applyRegex = /(apply now|apply for this role|apply for this job|apply)/i;
  const applyButton = page.locator('a, button').filter({ hasText: applyRegex }).first();
  
  if (await applyButton.count() > 0) {
      console.log('Found "Apply" button. Clicking and waiting for navigation...');
      await Promise.all([
        page.waitForLoadState('networkidle').catch(() => {}),
        applyButton.click()
      ]);
      await page.waitForTimeout(4000);
      console.log('Post click URL:', page.url());
      
      const html = await page.content();
      fs.writeFileSync('greenhouse_apply_page.html', html);
      console.log('Saved snapshot to greenhouse_apply_page.html');
  } else {
      console.log('No apply button found.');
  }
  
  await browser.close();
  process.exit(0);
}

run();
