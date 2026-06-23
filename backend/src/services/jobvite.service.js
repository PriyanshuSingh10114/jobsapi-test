const axios = require('axios');
const logger = require('../config/logger');
const { XMLParser } = require('fast-xml-parser');
const pLimit = require('../utils/concurrency');

const jobviteCompanies = [
  'zscaler', 'ringcentral', 'purestorage', 'proofpoint'
];

const fetchJobsForCompany = async (company) => {
  try {
    const response = await axios.get(`https://app.jobvite.com/CompanyJobs/Xml.aspx?c=${company}`);
    const parser = new XMLParser();
    const result = parser.parse(response.data);
    
    // Jobvite structure: result.result.job
    let rawJobs = result?.result?.job || [];
    if (!Array.isArray(rawJobs)) rawJobs = [rawJobs];
    
    return rawJobs.map(job => ({
      title: job.title || '',
      company: job.company || company.charAt(0).toUpperCase() + company.slice(1),
      location: job.location || job.region || 'Unknown',
      source: 'Jobvite',
      applyUrl: job.detailUrl || job.applyUrl || '',
      description: job.description || '',
      postedAt: job.date ? new Date(job.date) : new Date(),
      remote: job.location?.toLowerCase().includes('remote') || false,
      jobType: job.jobtype || ''
    }));
  } catch (error) {
    logger.warn(`Jobvite API Error for ${company}: ${error.message}`);
    return [];
  }
};

const fetchJobs = async () => {
  const companies = jobviteCompanies;
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
