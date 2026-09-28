const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>JobsAPI Platform — Engineering & Job Ingestion Report</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

    @page {
      size: A4;
      margin: 20mm 15mm 20mm 15mm;
      @bottom-right {
        content: "Page " counter(page) " of " counter(pages);
        font-family: 'Inter', sans-serif;
        font-size: 8pt;
        color: #64748b;
      }
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      color: #0f172a;
      background: #ffffff;
      line-height: 1.55;
      font-size: 10pt;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .header-container {
      border-bottom: 2px solid #0284c7;
      padding-bottom: 14px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    .header-left h1 {
      font-size: 20pt;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.5px;
      margin-bottom: 4px;
    }

    .header-left .subtitle {
      font-size: 10.5pt;
      color: #475569;
      font-weight: 500;
    }

    .header-right {
      text-align: right;
      font-size: 8.5pt;
      color: #64748b;
    }

    .badge-live {
      display: inline-block;
      background: #dcfce7;
      color: #166534;
      font-weight: 700;
      font-size: 7.5pt;
      padding: 3px 8px;
      border-radius: 9999px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }

    h2 {
      font-size: 13pt;
      font-weight: 700;
      color: #1e293b;
      margin-top: 20px;
      margin-bottom: 10px;
      padding-bottom: 4px;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    h3 {
      font-size: 10.5pt;
      font-weight: 700;
      color: #0369a1;
      margin-top: 12px;
      margin-bottom: 6px;
    }

    p {
      margin-bottom: 8px;
      color: #334155;
    }

    .stat-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 16px;
    }

    .stat-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px 12px;
    }

    .stat-card .label {
      font-size: 7.5pt;
      text-transform: uppercase;
      font-weight: 600;
      color: #64748b;
      margin-bottom: 2px;
    }

    .stat-card .value {
      font-size: 14pt;
      font-weight: 800;
      color: #0f172a;
    }

    .stat-card .subtext {
      font-size: 7.5pt;
      color: #0284c7;
      font-weight: 500;
      margin-top: 2px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
      margin-bottom: 16px;
      font-size: 8.5pt;
    }

    th {
      background: #f1f5f9;
      color: #334155;
      font-weight: 600;
      text-align: left;
      padding: 7px 10px;
      border-top: 1px solid #cbd5e1;
      border-bottom: 1px solid #cbd5e1;
    }

    td {
      padding: 6.5px 10px;
      border-bottom: 1px solid #f1f5f9;
      color: #1e293b;
    }

    tr:nth-child(even) td {
      background: #f8fafc;
    }

    .pill {
      display: inline-block;
      padding: 2px 7px;
      border-radius: 4px;
      font-size: 7.5pt;
      font-weight: 600;
    }

    .pill-green { background: #dcfce7; color: #15803d; }
    .pill-blue { background: #e0f2fe; color: #0369a1; }
    .pill-slate { background: #f1f5f9; color: #475569; }

    .source-box {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-left: 3.5px solid #0284c7;
      border-radius: 6px;
      padding: 9px 12px;
      margin-bottom: 10px;
      page-break-inside: avoid;
    }

    .source-box h4 {
      font-size: 9.5pt;
      font-weight: 700;
      color: #0f172a;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }

    .source-box .meta-row {
      font-size: 8pt;
      color: #475569;
      margin-bottom: 3px;
    }

    .source-box .meta-row strong {
      color: #1e293b;
    }

    code {
      font-family: 'JetBrains Mono', monospace;
      font-size: 7.5pt;
      background: #f1f5f9;
      padding: 1px 4px;
      border-radius: 3px;
      color: #0f172a;
    }

    pre {
      font-family: 'JetBrains Mono', monospace;
      font-size: 7.5pt;
      background: #0f172a;
      color: #f8fafc;
      padding: 10px 12px;
      border-radius: 6px;
      margin: 8px 0;
      line-height: 1.45;
      overflow-x: auto;
    }

    .page-break {
      page-break-before: always;
    }

    ul, ol {
      margin-left: 18px;
      margin-bottom: 8px;
      font-size: 9pt;
      color: #334155;
    }

    li {
      margin-bottom: 3px;
    }

    .callout {
      background: #eff6ff;
      border-left: 3px solid #3b82f6;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 8.5pt;
      color: #1e40af;
      margin: 10px 0;
    }
  </style>
</head>
<body>

  <!-- HEADER -->
  <div class="header-container">
    <div class="header-left">
      <span class="badge-live">Live Production Report</span>
      <h1>JobsAPI Platform</h1>
      <div class="subtitle">Engineering, ATS Ingestion & API Architecture Report</div>
    </div>
    <div class="header-right">
      <div><strong>Status:</strong> All Systems Operational</div>
      <div><strong>Active Jobs:</strong> 16,027 Postings</div>
      <div><strong>Date:</strong> September 28, 2026</div>
    </div>
  </div>

  <!-- STATS OVERVIEW -->
  <div class="stat-grid">
    <div class="stat-card">
      <div class="label">Total Live Jobs</div>
      <div class="value">16,027</div>
      <div class="subtext">100% verified & active</div>
    </div>
    <div class="stat-card">
      <div class="label">Integrated Sources</div>
      <div class="value">13 ATS / Feeds</div>
      <div class="subtext">7 active high-volume</div>
    </div>
    <div class="stat-card">
      <div class="label">Top Source Yield</div>
      <div class="value">12,829</div>
      <div class="subtext">Greenhouse (99.2% rate)</div>
    </div>
    <div class="stat-card">
      <div class="label">Automated Tests</div>
      <div class="value">38 / 38 Passing</div>
      <div class="subtext">Zero regressions</div>
    </div>
  </div>

  <h2>1. ATS & Job Board Performance Breakdown</h2>
  <p>JobsAPI periodically queries and parses public APIs, ATS boards, and official feeds. Postings undergo content normalization, cryptographic deduplication, and quality validation.</p>

  <table>
    <thead>
      <tr>
        <th>Source / ATS Provider</th>
        <th>Jobs Fetched</th>
        <th>Live in DB</th>
        <th>Success Rate</th>
        <th>Avg Latency</th>
        <th>Auth Type</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Greenhouse</strong></td>
        <td>12,984</td>
        <td><strong>12,829</strong></td>
        <td><span class="pill pill-green">99.17%</span></td>
        <td>58.0s (75 companies)</td>
        <td>Public REST API</td>
      </tr>
      <tr>
        <td><strong>Ashby</strong></td>
        <td>3,021</td>
        <td><strong>2,114</strong></td>
        <td><span class="pill pill-green">69.98%</span></td>
        <td>90.2s (35 companies)</td>
        <td>Public REST API</td>
      </tr>
      <tr>
        <td><strong>Lever</strong></td>
        <td>1,043</td>
        <td><strong>504</strong></td>
        <td><span class="pill pill-blue">48.32%</span></td>
        <td>266.7s (38 companies)</td>
        <td>Public JSON API</td>
      </tr>
      <tr>
        <td><strong>Arbeitnow</strong></td>
        <td>250</td>
        <td><strong>250</strong></td>
        <td><span class="pill pill-green">100.00%</span></td>
        <td>20.1s</td>
        <td>Open Board API</td>
      </tr>
      <tr>
        <td><strong>TheMuse</strong></td>
        <td>1,000</td>
        <td><strong>216</strong></td>
        <td><span class="pill pill-slate">21.60%</span></td>
        <td>20.5s (50 pages)</td>
        <td>Public REST API</td>
      </tr>
      <tr>
        <td><strong>USAJobs (US Federal)</strong></td>
        <td>100</td>
        <td><strong>82</strong></td>
        <td><span class="pill pill-green">82.00%</span></td>
        <td>18.1s</td>
        <td>API Key + User-Agent</td>
      </tr>
      <tr>
        <td><strong>Remotive</strong></td>
        <td>19</td>
        <td><strong>19</strong></td>
        <td><span class="pill pill-green">100.00%</span></td>
        <td>3.2s</td>
        <td>Public Dev API</td>
      </tr>
      <tr>
        <td><strong>Recruitee</strong></td>
        <td>16</td>
        <td><strong>13</strong></td>
        <td><span class="pill pill-green">81.25%</span></td>
        <td>8.5s</td>
        <td>Public Company API</td>
      </tr>
      <tr>
        <td><strong>Workday / Jobvite / BambooHR</strong></td>
        <td>On-demand</td>
        <td>Active feed</td>
        <td><span class="pill pill-slate">Dynamic</span></td>
        <td>10-18s</td>
        <td>Public Feed / XML</td>
      </tr>
    </tbody>
  </table>

  <h2>2. Ingestion Pipeline & Quality Safeguards</h2>
  <p>To eliminate duplicate jobs, dead apply links, or expired listings, all fetched raw jobs flow through the centralized <code>SyncPipeline</code> engine:</p>

  <div class="callout">
    <strong>Deterministic Deduplication:</strong> Every job receives a SHA-256 fingerprint generated from <code>title + company + normalized_location + applyUrl</code>. If a posting hasn't changed, the pipeline only touches <code>last_seen</code> with zero redundant database writes.
  </div>

  <ul>
    <li><strong>Mandatory Completeness:</strong> Rejects listings missing title, company name, apply URL, location, source, or description under 10 characters.</li>
    <li><strong>Freshness Retention (90 Days):</strong> Rejects postings older than 90 days from the original publish date.</li>
    <li><strong>Data Normalization:</strong> Automatically extracts salary ranges, seniority/experience levels, employment types (Full-time, Contract, Internship), and technical skills stack (e.g. Node.js, React, AWS, Python).</li>
    <li><strong>Bulk Memory Optimization:</strong> Executes batched MongoDB <code>bulkWrite</code> operations in chunks of 1,000 records.</li>
  </ul>

  <div class="page-break"></div>

  <h2>3. Source-by-Source Configuration & Setup Guide</h2>
  <p>Colleagues can review how each API works, where its configuration resides, and how to add companies:</p>

  <div class="source-box">
    <h4>1. Greenhouse Job Board API <span class="pill pill-green">12,829 Live Jobs</span></h4>
    <div class="meta-row"><strong>Endpoint:</strong> <code>https://boards-api.greenhouse.io/v1/boards/{company_token}/jobs?content=true</code></div>
    <div class="meta-row"><strong>Authentication:</strong> None (Public Open API).</div>
    <div class="meta-row"><strong>Config File:</strong> <code>backend/src/config/connectors/greenhouse.json</code></div>
    <div class="meta-row"><strong>How to Add Companies:</strong> Append the company handle (e.g., <code>"stripe"</code>, <code>"airbnb"</code>, <code>"cloudflare"</code>, <code>"mongodb"</code>) to the JSON array.</div>
  </div>

  <div class="source-box">
    <h4>2. Ashby Public Postings API <span class="pill pill-green">2,114 Live Jobs</span></h4>
    <div class="meta-row"><strong>Endpoint:</strong> <code>https://api.ashbyhq.com/posting-api/job-board/{company_token}?includeCompensation=true</code></div>
    <div class="meta-row"><strong>Authentication:</strong> None (Public API with compensation ranges).</div>
    <div class="meta-row"><strong>Config File:</strong> <code>backend/src/config/connectors/ashby.json</code></div>
    <div class="meta-row"><strong>How to Add Companies:</strong> Add the Ashby company slug (e.g., <code>"openai"</code>, <code>"perplexity"</code>, <code>"cohere"</code>, <code>"linear"</code>, <code>"notion"</code>).</div>
  </div>

  <div class="source-box">
    <h4>3. Lever Public Postings API <span class="pill pill-blue">504 Live Jobs</span></h4>
    <div class="meta-row"><strong>Endpoint:</strong> <code>https://api.lever.co/v0/postings/{company_token}?mode=json</code></div>
    <div class="meta-row"><strong>Authentication:</strong> None (Public JSON).</div>
    <div class="meta-row"><strong>Config File:</strong> <code>backend/src/config/connectors/lever.json</code></div>
    <div class="meta-row"><strong>How to Add Companies:</strong> Add company slug (e.g., <code>"netflix"</code>, <code>"spotify"</code>, <code>"canva"</code>, <code>"palantir"</code>, <code>"retool"</code>).</div>
  </div>

  <div class="source-box">
    <h4>4. USAJobs (US Federal Government Official API) <span class="pill pill-green">82 Live Jobs</span></h4>
    <div class="meta-row"><strong>Endpoint:</strong> <code>https://data.usajobs.gov/api/search</code></div>
    <div class="meta-row"><strong>Authentication:</strong> API Key + User-Agent header.</div>
    <div class="meta-row"><strong>Setup:</strong> Register at <code>developer.usajobs.gov</code> and add <code>USAJOBS_API_KEY</code> and <code>USAJOBS_EMAIL</code> to <code>backend/.env</code>.</div>
  </div>

  <div class="source-box">
    <h4>5. TheMuse, Arbeitnow & Remotive Tech Feeds <span class="pill pill-green">485 Live Jobs</span></h4>
    <div class="meta-row"><strong>Endpoints:</strong> <code>https://www.themuse.com/api/public/jobs</code>, <code>https://www.arbeitnow.com/api/job-board-api</code>, <code>https://remotive.com/api/remote-jobs</code></div>
    <div class="meta-row"><strong>Authentication:</strong> None. Automated scheduled sync every 6 hours.</div>
  </div>

  <h2>4. Universal Candidate Profile & Multi-ATS Auto-Apply</h2>
  <p>The system decouples candidate data from any specific job board into an ATS-independent canonical profile:</p>

  <ul>
    <li><strong>Canonical Candidate Profile:</strong> Stores Identity, Work Experience, Education, Documents, and Verified Application Answers in <code>CandidateProfile</code> model.</li>
    <li><strong>Zero-Hallucination Compliance:</strong> Sensitive legal questions (Visa sponsorship, US work auth, citizenship, disability, veteran status) default to <code>unknown</code> and are <strong>never guessed</strong> by heuristics or LLMs.</li>
    <li><strong>Playwright ATS Adapters:</strong> Modular adapters for <code>GreenhouseAdapter</code>, <code>LeverAdapter</code>, <code>AshbyAdapter</code>, <code>WorkdayAdapter</code>, and <code>GenericATSAdapter</code> dynamically map form inputs and submit applications safely.</li>
    <li><strong>Preflight & Idempotency:</strong> <code>ApplicationPreflightValidator</code> screens candidate blocklists before launch; <code>ApplicationIdempotencyService</code> prevents duplicate submissions via SHA-256 fingerprinting.</li>
  </ul>

  <h2>5. Key API Endpoints Reference</h2>
  <pre><code>GET  /api/jobs                • List active jobs with pagination, remote & skill filters
GET  /api/jobs/search         • Full-text relevance search
POST /api/jobs/sync           • Trigger on-demand sync across all ATS sources
GET  /api/candidate/profile   • Fetch universal candidate profile
PUT  /api/candidate/profile   • Update candidate profile
POST /api/candidate/preflight • Verify candidate readiness against job requirements
GET  /health                  • Health, liveness and telemetry metadata</code></pre>

</body>
</html>
`;

async function generatePDF() {
  console.log('Launching Playwright Chromium to render PDF report...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.setContent(htmlContent, { waitUntil: 'networkidle' });

  const projectRoot = path.resolve(__dirname, '../../');
  const rootPdfPath = path.join(projectRoot, 'JobsAPI_Engineering_and_API_Report.pdf');
  const docsPdfPath = path.join(projectRoot, 'docs', 'JobsAPI_Engineering_and_API_Report.pdf');

  // Ensure docs directory exists
  if (!fs.existsSync(path.join(projectRoot, 'docs'))) {
    fs.mkdirSync(path.join(projectRoot, 'docs'), { recursive: true });
  }

  await page.pdf({
    path: rootPdfPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '15mm',
      bottom: '15mm',
      left: '12mm',
      right: '12mm'
    }
  });

  // Copy to docs/ as well
  fs.copyFileSync(rootPdfPath, docsPdfPath);

  await browser.close();
  console.log(`PDF successfully generated:
  - Root: ${rootPdfPath}
  - Docs: ${docsPdfPath}`);
}

generatePDF().catch(err => {
  console.error('Error generating PDF:', err);
  process.exit(1);
});
