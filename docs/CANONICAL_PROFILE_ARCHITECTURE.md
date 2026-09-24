# Universal Candidate Profile & ATS Auto-Apply Architecture

## Overview

The **Universal Candidate Profile** serves as the single source of truth across JobsAPI. It decouples candidate facts from individual ATS platforms (Greenhouse, Lever, Workday, Ashby, SmartRecruiters, USAJobs, BambooHR, Recruitee, Generic).

```
Candidate Profile (MongoDB / Mongoose)
        ↓
Canonical Field Registry (Central Contract)
        ↓
Application Preflight Validator & Idempotency Service
        ↓
ATS Adapter Layer (Greenhouse, Lever, Ashby, Workday, Generic)
        ↓
Playwright Browser Automation
```

---

## 1. Canonical Candidate Model (`CandidateProfile`)

Located in [`backend/src/models/CandidateProfile.js`](file:///e:/TM/jobsapi/backend/src/models/CandidateProfile.js):

- **Identity**: `firstName`, `middleName`, `lastName`, `preferredName`, `fullName`, `email`, `alternateEmail`, `phone`
- **Location**: `addressLine1`, `addressLine2`, `city`, `state`, `postalCode`, `country`, `timezone`
- **Contact & Presence**: `linkedinUrl`, `githubUrl`, `portfolioUrl`, `personalWebsite`, `otherUrls[]`
- **Professional Profile**: `currentTitle`, `professionalSummary`, `yearsOfExperience`, `skills[]`, `industries[]`, `jobTitles[]`, `languages[]`
- **Work Authorization (Strictly Explicit / Never Inferred)**:
  - `authorizedToWorkInUS`: `true` | `false` | `'unknown'`
  - `requiresSponsorshipNow`: `true` | `false` | `'unknown'`
  - `requiresFutureSponsorship`: `true` | `false` | `'unknown'`
  - `sponsorshipDetails`, `visaType`, `citizenshipStatus`, `relocationPreference`
- **Experience**: Array of employment entries (`company`, `title`, `location`, `employmentType`, `startDate`, `endDate`, `current`, `description`, `achievements`, `skills`)
- **Education**: Array of academic entries (`institution`, `degree`, `fieldOfStudy`, `location`, `startDate`, `endDate`, `current`, `gpa`, `achievements`)
- **Certifications**: Array of credentials (`name`, `issuingOrganization`, `credentialId`, `issueDate`, `expirationDate`, `credentialUrl`)
- **Documents**: `resumes[]`, `coverLetters[]`, `certifications[]`, `transcripts[]`, `other[]`
- **Preferences**: `desiredTitles[]`, `desiredLocations[]`, `employmentTypes[]`, `workModes[]`, `willingToRelocate`, `minimumSalary`, `salaryCurrency`, `blockedCompanies[]`, `blockedRoles[]`
- **Application Question Bank (`applicationAnswers`)**: Reusable verified answer bank with `questionKey`, `questionText`, `answerType`, `value`, `userVerified`, `confidence`.

---

## 2. Canonical Field Registry

Located in [`backend/src/automation/canonical/CanonicalFieldRegistry.js`](file:///e:/TM/jobsapi/backend/src/automation/canonical/CanonicalFieldRegistry.js):

- Defines standardized paths (e.g. `candidate.identity.firstName`, `candidate.workAuthorization.authorizedToWorkInUS`).
- Maps arbitrary DOM labels, placeholders, and attributes (`First Name`, `Given Name`, `legal_first_name`, `fname`) via weighted regex synonym banks.
- Flags sensitive legal fields (`sensitive: true`) to prevent automated guessing or LLM inference.
- Resolves values directly from the candidate document.

---

## 3. ATS Adapter System

Located in [`backend/src/automation/adapters/`](file:///e:/TM/jobsapi/backend/src/automation/adapters/):

- [`ATSAdapter.js`](file:///e:/TM/jobsapi/backend/src/automation/adapters/ATSAdapter.js): Base adapter interface.
  - `detect(page)`: Detects if the page matches the ATS.
  - `discoverFields(page)`: Discovers interactive form fields with metadata.
  - `mapField(field)`: Maps discovered DOM elements to canonical fields with confidence scoring.
  - `fillField(field, value)`: Safely populates text, select, checkbox, radio, file inputs.
  - `validate(page)`: Ensures required fields are satisfied.
  - `submit(page)`: Submits the application safely.
- Specialized implementations:
  - [`GreenhouseAdapter.js`](file:///e:/TM/jobsapi/backend/src/automation/adapters/GreenhouseAdapter.js)
  - [`LeverAdapter.js`](file:///e:/TM/jobsapi/backend/src/automation/adapters/LeverAdapter.js)
  - [`AshbyAdapter.js`](file:///e:/TM/jobsapi/backend/src/automation/adapters/AshbyAdapter.js)
  - [`WorkdayAdapter.js`](file:///e:/TM/jobsapi/backend/src/automation/adapters/WorkdayAdapter.js)
  - [`GenericATSAdapter.js`](file:///e:/TM/jobsapi/backend/src/automation/adapters/GenericATSAdapter.js)
- [`ATSAdapterFactory.js`](file:///e:/TM/jobsapi/backend/src/automation/adapters/ATSAdapterFactory.js): Dynamically resolves or instantiates the correct adapter for a given page/URL.

---

## 4. Application Safety & Preflight Validation

- **Application Preflight Validator** ([`backend/src/automation/engine/ApplicationPreflightValidator.js`](file:///e:/TM/jobsapi/backend/src/automation/engine/ApplicationPreflightValidator.js)):
  - Checks core mandatory candidate information.
  - Verifies sensitive work authorization values are non-unknown and user-verified.
  - Enforces candidate blocklists against target job `company` and `title`.
  - Blocks automation if `ready === false`.
- **Application Idempotency Service** ([`backend/src/automation/engine/ApplicationIdempotencyService.js`](file:///e:/TM/jobsapi/backend/src/automation/engine/ApplicationIdempotencyService.js)):
  - Generates deterministic SHA-256 fingerprint: `candidateId + jobId + destination`.
  - Rejects duplicate submissions before execution.
- **Profile Readiness Calculator** ([`backend/src/automation/engine/ProfileReadinessCalculator.js`](file:///e:/TM/jobsapi/backend/src/automation/engine/ProfileReadinessCalculator.js)):
  - Computes honest readiness status across 8 categories (`Complete`, `Incomplete`, `Unknown`, `Needs verification`).
  - No synthetic percentages.

---

## 5. Candidate API Endpoints

- `GET    /api/candidate/profile` — Fetch canonical candidate profile
- `PUT    /api/candidate/profile` — Update candidate profile
- `POST   /api/candidate/experience` — Add work experience entry
- `PUT    /api/candidate/experience/:id` — Update work experience entry
- `DELETE /api/candidate/experience/:id` — Delete work experience entry
- `POST   /api/candidate/education` — Add education entry
- `PUT    /api/candidate/education/:id` — Update education entry
- `DELETE /api/candidate/education/:id` — Delete education entry
- `GET    /api/candidate/documents` — Fetch candidate documents
- `POST   /api/candidate/documents` — Upload candidate document (resume/cover letter)
- `DELETE /api/candidate/documents/:id` — Delete document
- `GET    /api/candidate/application-answers` — Fetch reusable verified answers
- `PUT    /api/candidate/application-answers` — Upsert verified answers
- `GET    /api/candidate/readiness` — Real-time readiness scorecard
- `POST   /api/candidate/preflight` — Preflight check for a target job
