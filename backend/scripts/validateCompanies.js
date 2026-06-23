const axios = require('axios');
const fs = require('fs');
const path = require('path');
const pLimit = require('../src/utils/concurrency');

const SEED_WORDS = [
  'openai', 'anthropic', 'perplexity', 'cohere', 'scale', 'glean', 'cursor', 'runway', 'snowflake', 'cloudflare',
  'hashicorp', 'vercel', 'digitalocean', 'crowdstrike', 'wiz', 'snyk', 'paloaltonetworks', 'sentinelone', 'datadog',
  'mongodb', 'notion', 'hubspot', 'gitlab', 'stripe', 'plaid', 'brex', 'ramp', 'mercury', 'coinbase', 'reddit',
  'dropbox', 'robinhood', 'gusto', 'discord', 'instacart', 'asana', 'checkr', 'flexport', 'airtable', 'roblox',
  'chime', 'okta', 'twilio', 'pinterest', 'lyft', 'airbnb', 'databricks', 'elastic', 'fastly', 'fivetran', 'dbtlabs',
  'celonis', 'gong', 'outreach', 'salesloft', 'braze', 'amplitude', 'heap', 'pendo', 'postman', 'apollo', 'figma',
  'miro', 'canva', 'webflow', 'framer', 'linear', 'raycast', 'arc', 'browsercompany', 'retool', 'supabase', 'render',
  'flyio', 'planetscale', 'neon', 'pinecone', 'weaviate', 'qdrant', 'chroma', 'langchain', 'llama', 'huggingface',
  'replicate', 'modal', 'baseten', 'anyscale', 'together', 'coreweave', 'rippling', 'deel', 'remote', 'papayaglobal',
  'lattice', 'cultureamp', 'greenhouse', 'lever', 'ashby', 'gem', 'carta', 'angellist', 'navan', 'tripactions',
  'tripadvisor', 'yelp', 'doordash', 'uber', 'postmates', 'grubhub', 'instawork', 'wonolo', 'upwork', 'fiverr',
  'toptal', 'andela', 'turing', 'bairesdev', 'strv', 'thoughtworks', 'slalom', 'epam', 'globant', 'accenture',
  'deloitte', 'pwc', 'kpmg', 'ey', 'mckinsey', 'bcg', 'bain', 'palantir', 'anduril', 'shieldai', 'epirus', 'hawkeye360',
  'clearview', 'skydio', 'zline', 'spacex', 'blueorigin', 'relativity', 'rocketlab', 'planet', 'spire', 'iceye',
  'capella', 'descarteslabs', 'orbitalinsight', 'hawk', 'pluralsight', 'coursera', 'udacity', 'udemy', 'edx',
  'skillshare', 'masterclass', 'outschool', 'duolingo', 'quizlet', 'kahoot', 'chegg', 'coursehero', 'guild',
  'betterup', 'springboard', 'ironhack', 'generalassembly', 'flatiron', 'appacademy', 'hackreactor', 'bloomtech',
  'lambdaschool', 'turing', 'holberton', 'makeitreal', 'ycombinator', 'techstars', '500startups', 'a16z', 'sequoia',
  'benchmark', 'accel', 'indexventures', 'lightspeed', 'bessemer', 'greylock', 'foundersfund', 'kleinerperkins'
];

// Generate permutations
const SEED_COMPANIES = new Set();
SEED_WORDS.forEach(word => {
  SEED_COMPANIES.add(word);
  SEED_COMPANIES.add(`${word}hq`);
  SEED_COMPANIES.add(`${word}inc`);
  SEED_COMPANIES.add(`${word}ai`);
  SEED_COMPANIES.add(`${word}tech`);
  SEED_COMPANIES.add(`${word}software`);
});
const SEED_ARRAY = Array.from(SEED_COMPANIES);

async function validateGreenhouse(company) {
  try {
    const res = await axios.get(`https://boards-api.greenhouse.io/v1/boards/${company}/jobs`);
    return res.status === 200 ? company : null;
  } catch (e) {
    return null;
  }
}

async function validateAshby(company) {
  try {
    const res = await axios.get(`https://api.ashbyhq.com/posting-api/job-board/${company}`);
    return res.status === 200 ? company : null;
  } catch (e) {
    return null;
  }
}

async function validateLever(company) {
  try {
    const res = await axios.get(`https://api.lever.co/v0/postings/${company}?mode=json`);
    return res.status === 200 ? company : null;
  } catch (e) {
    return null;
  }
}

async function runValidation() {
  console.log(`Starting validation for ${SEED_ARRAY.length} seed companies...`);
  const limit = pLimit(30);
  
  const greenhouseValidated = [];
  const ashbyValidated = [];
  const leverValidated = [];

  let count = 0;
  const total = SEED_ARRAY.length;

  const promises = SEED_ARRAY.map(company => limit(async () => {
    // Check Greenhouse
    if (await validateGreenhouse(company)) greenhouseValidated.push(company);
    else if (await validateAshby(company)) ashbyValidated.push(company);
    else if (await validateLever(company)) leverValidated.push(company);
    
    count++;
    if (count % 100 === 0) console.log(`Processed ${count}/${total} ...`);
  }));

  await Promise.all(promises);

  fs.writeFileSync(path.join(__dirname, '../src/data/greenhouse_companies_validated.json'), JSON.stringify(greenhouseValidated, null, 2));
  fs.writeFileSync(path.join(__dirname, '../src/data/ashby_companies_validated.json'), JSON.stringify(ashbyValidated, null, 2));
  fs.writeFileSync(path.join(__dirname, '../src/data/lever_companies_validated.json'), JSON.stringify(leverValidated, null, 2));

  console.log(`Greenhouse: ${greenhouseValidated.length} verified companies.`);
  console.log(`Ashby: ${ashbyValidated.length} verified companies.`);
  console.log(`Lever: ${leverValidated.length} verified companies.`);
  
  process.exit(0);
}

runValidation().catch(console.error);
