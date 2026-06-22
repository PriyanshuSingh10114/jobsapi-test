const axios = require('axios');
const fs = require('fs');
const path = require('path');

const greenhouseCompanies = require('../data/greenhouse_companies');
const leverCompanies = require('../data/lever_companies');
const ashbyCompanies = require('../data/ashby_companies');

const validateEndpoint = async (url) => {
  try {
    const response = await axios.get(url, { timeout: 10000 });
    return response.status === 200;
  } catch (error) {
    return false;
  }
};

const processAts = async (atsName, companies, endpointTemplate, outputFileName, logFileName) => {
  console.log(`Validating ${atsName}...`);
  const healthy = [];
  const logPath = path.join(process.cwd(), logFileName);
  const outPath = path.join(__dirname, '..', 'data', outputFileName);

  for (const company of companies) {
    const url = endpointTemplate(company);
    const isValid = await validateEndpoint(url);
    if (isValid) {
      healthy.push(company);
    } else {
      console.log(`[${atsName}] Failed: ${company}`);
      fs.appendFileSync(logPath, `${new Date().toISOString()} - ${company}\n`);
    }
  }

  // Rewrite the file
  const fileContent = `module.exports = [\n  ${healthy.map(c => `'${c}'`).join(', ')}\n];\n`;
  fs.writeFileSync(outPath, fileContent, 'utf-8');
  console.log(`${atsName} validation complete. Kept ${healthy.length} / ${companies.length}. Saved to ${outputFileName}\n`);
};

const run = async () => {
  await processAts(
    'Lever',
    leverCompanies,
    (company) => `https://api.lever.co/v0/postings/${company}?mode=json`,
    'lever_companies.js',
    'lever_failed_companies.log'
  );

  await processAts(
    'Greenhouse',
    greenhouseCompanies,
    (company) => `https://boards-api.greenhouse.io/v1/boards/${company}/jobs`,
    'greenhouse_companies.js',
    'greenhouse_failed_companies.log'
  );

  await processAts(
    'Ashby',
    ashbyCompanies,
    (company) => `https://api.ashbyhq.com/posting-api/job-board/${company}`,
    'ashby_companies.js',
    'ashby_failed_companies.log'
  );

  console.log('All validations complete.');
  process.exit(0);
};

run();
