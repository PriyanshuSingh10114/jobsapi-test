require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// This script safely pings all current Lever tokens and outputs a clean array
const leverCompanies = require('../data/lever_companies');

async function runValidation() {
  console.log(`Starting validation for ${leverCompanies.length} Lever tokens...`);
  
  const valid = [];
  const invalid = [];

  for (const company of leverCompanies) {
    try {
      const response = await axios.get(`https://api.lever.co/v0/postings/${company}?mode=json`);
      if (response.status === 200) {
        console.log(`✅ [VALID] ${company}`);
        valid.push(company);
      }
    } catch (error) {
      console.log(`❌ [INVALID] ${company} - ${error.response?.status || error.message}`);
      invalid.push(company);
    }
  }

  console.log('\n--- Validation Results ---');
  console.log(`Valid Tokens: ${valid.length}`);
  console.log(`Invalid Tokens: ${invalid.length}`);

  const outputPath = path.join(__dirname, '../data/lever_companies.js');
  const fileContent = `module.exports = [\n  ${valid.map(c => `'${c}'`).join(',\n  ')}\n];\n`;
  
  fs.writeFileSync(outputPath, fileContent);
  console.log(`\nSuccessfully updated ${outputPath} with only valid tokens.`);
  
  process.exit(0);
}

runValidation();
