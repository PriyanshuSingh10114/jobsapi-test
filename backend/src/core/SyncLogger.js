const logger = require('../config/logger');
const os = require('os');

class SyncLogger {
  constructor(connectorName) {
    this.connectorName = connectorName;
    this.stats = {
      jobsFetched: 0,
      inserted: 0,
      updated: 0,
      unchanged: 0,
      duplicates: 0,
      skippedTotal: 0,
      skippedReasons: {},
      errors: {},
      durationMs: 0,
      parseTimeMs: 0,
      dbWriteTimeMs: 0,
      requestsSent: 0,
      requestsFailed: 0,
      retries: 0,
      companiesScanned: 0,
      companiesFailed: 0
    };
    this.startTime = Date.now();
  }

  logRequest(durationMs, success, retries = 0, errorClass = null) {
    this.stats.requestsSent++;
    if (!success) {
      this.stats.requestsFailed++;
    }
    this.stats.retries += retries;
    if (errorClass) {
      this.stats.errors[errorClass] = (this.stats.errors[errorClass] || 0) + 1;
    }
  }

  logJobStatus(status, reason = null) {
    if (status === 'inserted') this.stats.inserted++;
    else if (status === 'updated') this.stats.updated++;
    else if (status === 'unchanged') this.stats.unchanged++;
    else if (status === 'duplicate') this.stats.duplicates++;
    else if (status === 'skipped') {
      this.stats.skippedTotal++;
      if (reason) {
        this.stats.skippedReasons[reason] = (this.stats.skippedReasons[reason] || 0) + 1;
      }
    }
  }

  addParseTime(ms) { this.stats.parseTimeMs += ms; }
  addDbWriteTime(ms) { this.stats.dbWriteTimeMs += ms; }
  setFetched(count) { this.stats.jobsFetched = count; }

  finish() {
    this.stats.durationMs = Date.now() - this.startTime;
    
    // Memory usage
    const memUsage = process.memoryUsage();
    const memoryMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    
    // CPU usage estimation (basic)
    const cpus = os.cpus();
    const cpuUsage = cpus ? Math.round(cpus[0].times.user / (cpus[0].times.user + cpus[0].times.idle) * 100) : 0;
    
    let report = `\n${this.connectorName} Summary\n`;
    report += `Jobs Fetched: ${this.stats.jobsFetched}\n`;
    report += `Inserted: ${this.stats.inserted}\n`;
    report += `Updated: ${this.stats.updated}\n`;
    report += `Duplicate: ${this.stats.duplicates}\n`;
    report += `Unchanged: ${this.stats.unchanged}\n\n`;
    
    for (const [reason, count] of Object.entries(this.stats.skippedReasons)) {
      report += `${reason}: ${count}\n`;
    }
    
    report += `Skipped Total: ${this.stats.skippedTotal}\n\n`;
    
    const successRate = this.stats.jobsFetched > 0 ? ((this.stats.inserted + this.stats.updated + this.stats.unchanged + this.stats.duplicates) / this.stats.jobsFetched * 100).toFixed(2) : 0;
    
    report += `Success Rate: ${successRate}%\n`;
    report += `Sync Duration: ${(this.stats.durationMs / 1000).toFixed(2)}s\n`;
    
    const avgRequestTime = this.stats.requestsSent > 0 ? (this.stats.durationMs / this.stats.requestsSent).toFixed(0) : 0;
    report += `Average Request Time: ${avgRequestTime}ms\n`;
    
    const avgParseTime = this.stats.jobsFetched > 0 ? (this.stats.parseTimeMs / this.stats.jobsFetched).toFixed(2) : 0;
    report += `Average Parse Time: ${avgParseTime}ms\n`;
    
    const avgMongoWriteTime = (this.stats.inserted + this.stats.updated > 0) ? (this.stats.dbWriteTimeMs / (this.stats.inserted + this.stats.updated)).toFixed(2) : 0;
    report += `Average Mongo Write Time: ${avgMongoWriteTime}ms\n`;
    
    report += `Memory Usage: ${memoryMB} MB\n`;
    report += `CPU Usage: ~${cpuUsage}%\n`;
    
    report += `Requests Sent: ${this.stats.requestsSent}\n`;
    report += `Requests Failed: ${this.stats.requestsFailed}\n`;
    report += `Retry Count: ${this.stats.retries}\n`;

    console.log(report);
    logger.info(`Completed sync for ${this.connectorName}. Fetched: ${this.stats.jobsFetched}. Success Rate: ${successRate}%`);
    
    return this.stats;
  }
}

module.exports = SyncLogger;
