const mongoose = require('mongoose');
const Job = require('./src/models/Job');
const { extractSkills, extractSalary, extractState } = require('./src/utils/dataExtractor');

const enrichDB = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect('mongodb://127.0.0.1:27017/job-source-tester');
    
    console.log('Fetching all jobs...');
    const jobs = await Job.find({});
    console.log(`Found ${jobs.length} jobs to enrich.`);

    let updatedCount = 0;
    for (const job of jobs) {
      let needsUpdate = false;
      const fullText = `${job.title || ''} ${job.description || ''}`;
      
      const skills = extractSkills(fullText);
      if (skills.length > 0) {
        job.skills = skills;
        needsUpdate = true;
      }
      
      const salaryInfo = extractSalary(fullText);
      if (salaryInfo) {
        job.salary = salaryInfo;
        needsUpdate = true;
      }
      
      const state = extractState(job.location);
      if (state) {
        job.state = state;
        needsUpdate = true;
      }

      if (needsUpdate) {
        await job.save();
        updatedCount++;
      }
    }
    
    console.log(`Enriched ${updatedCount} jobs with deep market data.`);
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

enrichDB();
