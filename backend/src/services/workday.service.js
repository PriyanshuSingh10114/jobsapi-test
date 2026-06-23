const axios = require('axios');
const logger = require('../config/logger');
const pLimit = require('../utils/concurrency');

// Known workday endpoints for target companies
const workdayCompanies = [
  { name: 'Nvidia', url: 'https://nvidia.wd5.myworkdayjobs.com/wday/cxs/nvidia/NVIDIAExternalCareerSite/jobs' },
  { name: 'Adobe', url: 'https://adobe.wd5.myworkdayjobs.com/wday/cxs/adobe/external_careers/jobs' },
  { name: 'Cisco', url: 'https://cisco.wd1.myworkdayjobs.com/wday/cxs/cisco/Global_Careers/jobs' },
  { name: 'Dell', url: 'https://dell.wd1.myworkdayjobs.com/wday/cxs/dell/External/jobs' },
  { name: 'Qualcomm', url: 'https://qualcomm.wd5.myworkdayjobs.com/wday/cxs/qualcomm/External/jobs' },
  { name: 'ServiceNow', url: 'https://servicenow.wd5.myworkdayjobs.com/wday/cxs/servicenow/ExternalCareers/jobs' },
  { name: 'Intuit', url: 'https://intuit.wd1.myworkdayjobs.com/wday/cxs/intuit/careers/jobs' },
  { name: 'Broadcom', url: 'https://broadcom.wd1.myworkdayjobs.com/wday/cxs/broadcom/External_Career/jobs' }
];

const fetchJobsForCompany = async (companyObj) => {
  try {
    const response = await axios.post(companyObj.url, {
      appliedFacets: {},
      limit: 20, // Let's keep it to 20 per sync to avoid huge bottlenecks initially, or expand pagination
      offset: 0,
      searchText: ""
    }, {
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
    });

    const jobs = response.data.jobPostings || [];
    
    return jobs.map(job => {
      // url usually like https://nvidia.wd5.myworkdayjobs.com/en-US/NVIDIAExternalCareerSite/job/...
      const baseUrl = companyObj.url.split('/wday')[0];
      const jobUrlPath = job.externalPath || '';
      
      return {
        title: job.title || '',
        company: companyObj.name,
        location: job.locationsText || 'Unknown',
        source: 'Workday',
        applyUrl: `${baseUrl}/en-US${companyObj.url.split('cxs')[1].replace('/jobs', '')}${jobUrlPath}`,
        description: job.title || '',
        postedAt: job.postedOn ? new Date() : new Date(), // WD provides "Posted 2 Days Ago" text usually
        remote: job.locationsText?.toLowerCase().includes('remote') || false,
        jobType: job.timeType || ''
      };
    });
  } catch (error) {
    logger.warn(`Workday API Error for ${companyObj.name}: ${error.message}`);
    return [];
  }
};

const fetchJobs = async () => {
  const companies = workdayCompanies;
  let allJobs = [];
  let companiesFailed = 0;
  const limit = pLimit(5); // Lower limit for Workday POST

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
