const axios = require('axios');
const logger = require('../config/logger');
const { XMLParser } = require('fast-xml-parser');
const pLimit = require('../utils/concurrency');

const bamboohrCompanies = [
  // Start with a few placeholders, or known BambooHR users if any
  'spacex', 'postmates' // Examples
];

const fetchJobsForCompany = async (company) => {
  try {
    const response = await axios.get(`https://${company}.bamboohr.com/jobs/embed2.php`);
    const parser = new XMLParser();
    const result = parser.parse(response.data);
    
    // BambooHR structure: result.XML.job
    let rawJobs = result?.XML?.job || [];
    if (!Array.isArray(rawJobs)) rawJobs = [rawJobs];
    
    return rawJobs.map(job => ({
      title: job.title || '',
      company: company.charAt(0).toUpperCase() + company.slice(1),
      location: job.location || 'Unknown',
      source: 'BambooHR',
      applyUrl: job.detailUrl || `https://${company}.bamboohr.com/jobs`,
      description: job.description || '',
      postedAt: new Date(), // BambooHR embed2 doesn't always provide posted date
      remote: false, // Infer later via dataExtractor
      jobType: job.employmentType || ''
    }));
  } catch (error) {
    logger.warn(`BambooHR API Error for ${company}: ${error.message}`);
    return [];
  }
};

const fetchJobs = async () => {
  const companies = bamboohrCompanies;
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
