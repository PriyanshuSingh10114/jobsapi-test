const axios = require('axios');
const logger = require('../config/logger');
const { XMLParser } = require('fast-xml-parser');
const pLimit = require('../utils/concurrency');

const teamtailorCompanies = [
  'oura', 'fishbrain', 'epidemicsound', 'kognity', 'sanalabs'
];

const fetchJobsForCompany = async (company) => {
  try {
    const response = await axios.get(`https://careers.${company}.com/jobs.rss`);
    const parser = new XMLParser();
    const result = parser.parse(response.data);
    
    // Teamtailor RSS structure: result.rss.channel.item
    let rawJobs = result?.rss?.channel?.item || [];
    if (!Array.isArray(rawJobs)) rawJobs = [rawJobs];
    
    return rawJobs.map(job => ({
      title: job.title || '',
      company: company.charAt(0).toUpperCase() + company.slice(1),
      location: job['job_location'] || 'Unknown', // Sometimes embedded in RSS
      source: 'Teamtailor',
      applyUrl: job.link || '',
      description: job.description || '',
      postedAt: job.pubDate ? new Date(job.pubDate) : new Date(),
      remote: false,
      jobType: ''
    }));
  } catch (error) {
    logger.warn(`Teamtailor API Error for ${company}: ${error.message}`);
    return [];
  }
};

const fetchJobs = async () => {
  const companies = teamtailorCompanies;
  let allJobs = [];
  let companiesFailed = 0;
  const limit = pLimit(10);

  const promises = companies.map(company => limit(async () => {
    const companyJobs = await fetchJobsForCompany(company);
    if (companyJobs.length === 0) {
      companiesFailed++;
    } else {
      allJobs.push(...companyJobs);
    }
  }));

  await Promise.all(promises);
  return { jobs: allJobs, companiesScanned: companies.length, companiesFailed };
};

module.exports = { fetchJobs };
