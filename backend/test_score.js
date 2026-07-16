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
  
  // Use domcontentloaded instead of networkidle
  await page.goto(job.applyUrl, { waitUntil: 'domcontentloaded' });
  
  const applyRegex = /(apply now|apply for this role|apply for this job|apply)/i;
  // wait for the apply button to appear
  await page.waitForSelector('text=/apply now|apply for this role|apply for this job|apply/i', { state: 'attached', timeout: 15000 }).catch(() => {});
  
  const applyButton = page.locator('a, button').filter({ hasText: applyRegex }).first();
  
  if (await applyButton.count() > 0) {
      console.log('Found "Apply" button. Clicking...');
      await Promise.all([
        page.waitForLoadState('domcontentloaded').catch(() => {}),
        applyButton.click()
      ]);
      await page.waitForTimeout(4000); // Give iframes time to load
  }

  // Frame enumeration
  const frames = page.frames();
  console.log(`Found ${frames.length} frames.`);
  
  let bestFrame = null;
  let bestScore = -1;
  let bestMap = null;

  for (const frame of frames) {
    try {
      const url = frame.url();
      const name = frame.name();
      
      const formsCount = await frame.locator('form').count();
      if (formsCount === 0) continue;
      
      const inputsCount = await frame.locator('input').count();
      const fileInputsCount = await frame.locator('input[type="file"]').count();
      const buttonsCount = await frame.locator('button').count();
      
      console.log(`Frame: ${name || 'unnamed'} | URL: ${url.substring(0, 50)}... | Forms: ${formsCount} | Inputs: ${inputsCount} | File: ${fileInputsCount} | Buttons: ${buttonsCount}`);
      
      // Calculate score based on text inside labels or aria-labels
      const inputs = await frame.evaluate(() => {
        return Array.from(document.querySelectorAll('input, select, textarea')).map(input => {
            let label = input.getAttribute('aria-label') || input.getAttribute('placeholder') || '';
            if (input.id) {
                const l = document.querySelector(`label[for="${input.id}"]`);
                if (l) label = l.innerText + ' ' + label;
            }
            const wrapper = input.closest('label');
            if (wrapper) label = wrapper.innerText + ' ' + label;
            return label.toLowerCase();
        });
      });
      
      let score = 0;
      const terms = ['first name', 'last name', 'email', 'phone', 'resume', 'cover letter'];
      let foundTerms = [];
      
      for (const text of inputs) {
          for (const term of terms) {
              if (text.includes(term) && !foundTerms.includes(term)) {
                  score++;
                  foundTerms.push(term);
              }
          }
      }
      
      console.log(`Score: ${score}/6 (${foundTerms.join(', ')})`);
      
      if (score > bestScore) {
          bestScore = score;
          bestFrame = frame;
          bestMap = foundTerms;
      }
    } catch (e) {
       console.log('Error inspecting frame:', e.message);
    }
  }
  
  console.log(`\nBest frame selected: ${bestFrame ? bestFrame.name() || bestFrame.url() : 'None'} with score ${bestScore}`);
  
  await browser.close();
  process.exit(0);
}

run();
