# 🧪 JobsAPI — Comprehensive Test Matrix

**Version:** 1.0.0  
**Date:** 2026-09-24  
**Runner:** Node.js Native Test Runner (`node --test`)  
**Total Tests:** 28  
**Passing:** 28 (100%)  
**Failing:** 0  

---

## 1. Unit Test Suite (`tests/unit/`)

| Test Name | Test File | Setup / Input | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Deterministic Hashing** | `hashHelper.test.js` | 2 job objects with whitespace & URL query discrepancies | Identical 64-char SHA-256 hash | Exact match | **PASS** |
| **Distinct Job Hashes** | `hashHelper.test.js` | 2 different job objects | Distinct SHA-256 hashes | Unique hashes | **PASS** |
| **Regex Escaping** | `sanitizer.test.js` | `Senior C++ Developer (Remote) [Contract] *.*` | All special chars escaped (`\+`, `\(`, `\)`, `\[`, `\]`, `\*`) | `Senior C\+\+...` compiles safely | **PASS** |
| **NoSQL Operator Sanitization** | `sanitizer.test.js` | Malicious object with `$where`, `$gt`, `nested.key` | `$where` and `nested.key` stripped | Clean sanitized object | **PASS** |
| **Pagination Bounds Enforcement** | `sanitizer.test.js` | `page: -5`, `limit: 500` | Capped at `page: 1`, `limit: 100` | Safe bounded values | **PASS** |
| **Skill Extraction** | `dataExtractor.test.js` | Job description mentioning React, Node, Python, AWS, Docker | Returns array of recognized skills | `['React', 'Node.js', 'Python', ...]` | **PASS** |
| **Salary Extraction** | `dataExtractor.test.js` | `$130,000 - $170,000` & `$120k to $160k` | `{ min, max, average }` numerical values | Exact bounds computed | **PASS** |
| **Experience Level Parsing** | `dataExtractor.test.js` | Titles: 'Senior Staff', 'Junior', 'Intern', 'Director' | Maps to 'Senior', 'Entry Level', 'Internship', 'Leadership' | Correct taxonomy | **PASS** |
| **Employment Type Parsing** | `dataExtractor.test.js` | Titles with 'Full-time', 'Contract', 'Part-time', 'Intern' | Categorizes into standard employment types | Exact category matches | **PASS** |
| **Job Validation - Complete** | `validationHelper.test.js`| Valid US job posted today | `{ isValid: true, reason: null }` | Validation passes | **PASS** |
| **Job Validation - Missing Fields**| `validationHelper.test.js`| Job missing title | `{ isValid: false, reason: 'Title' }` | Rejected cleanly | **PASS** |
| **Job Validation - Invalid URL** | `validationHelper.test.js`| Apply URL with `ftp://` protocol | `{ isValid: false, reason: 'applyUrl' }` | Rejected cleanly | **PASS** |
| **Job Validation - Retention Cutoff**| `validationHelper.test.js`| Job posted 45 days ago | `{ isValid: false, reason: 'older than 30 days' }` | Rejected cleanly | **PASS** |
| **State Machine - Forward Transitions**| `state_machine.test.js` | Sequential steps `Created -> Queued -> ... -> Completed` | All linear transitions allowed (`true`) | Allowed | **PASS** |
| **State Machine - Illegal Transitions**| `state_machine.test.js` | Jump from `Created -> Submitting` or `Failed -> Completed` | Transition rejected (`false`) | Blocked | **PASS** |
| **State Machine - Terminal Recovery**| `state_machine.test.js` | Transition from active state to `Failed` / `Cancelled` | Permitted (`true`) | Allowed | **PASS** |
| **Secure Filename Generation** | `file_upload.test.js` | Original name `My Resume 2026.pdf` | Randomized UUID filename `resume-<uuid>.pdf` | UUID format generated | **PASS** |
| **Executable Upload Rejection** | `file_upload.test.js` | Uploading `malware.exe`, `script.sh`, `payload.php` | Throws `ValidationError` | Blocked with error | **PASS** |
| **Path Traversal Sanitization** | `file_upload.test.js` | Filename with `../../etc/passwd` | Path normalized, `..` prevented | Confined to upload dir | **PASS** |

---

## 2. Integration Test Suite (`tests/integration/`)

| Test Name | Test File | Target Endpoint | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Liveness Probe** | `health.test.js` | `GET /health` | HTTP 200 `{ status: 'ok', uptimeSeconds }` | HTTP 200 with uptime | **PASS** |
| **API Index Route** | `health.test.js` | `GET /` | HTTP 200 with documentation & health links | HTTP 200 with `/api-docs` | **PASS** |
| **Request Correlation Header** | `health.test.js` | `GET /health` | Header `X-Request-Id` present in response | UUID correlation ID set | **PASS** |
| **Admin API Key Authorization** | `auth_rbac.test.js` | `GET /api/admin/health` with `x-api-key` | Access granted (non-401/403) | Key authenticated | **PASS** |
| **Malformed JWT Rejection** | `auth_rbac.test.js` | `GET /api/admin/health` with malformed token | HTTP 401 `{ error: { code: 'AUTHENTICATION_REQUIRED' } }` | HTTP 401 with typed error | **PASS** |
| **RBAC Role Escalation Rejection** | `auth_rbac.test.js` | `GET /api/admin/health` with role: USER token | HTTP 403 `{ error: { code: 'PERMISSION_DENIED' } }` | HTTP 403 Forbidden | **PASS** |
| **Unknown Route Handling** | `api_abuse.test.js` | `GET /api/non_existent_route_12345` | HTTP 404 `{ error: { code: 'NOT_FOUND' } }` | HTTP 404 with standard format | **PASS** |
| **Malformed JSON Body** | `api_abuse.test.js` | `POST /api/discovery/ingest` with truncated JSON | HTTP 400 `{ error: { code: 'MALFORMED_JSON' } }` | HTTP 400 caught by error handler | **PASS** |
| **Validation Failure on Missing Body**| `api_abuse.test.js`| `POST /api/automation/start` with empty `{}` | HTTP 400 `{ error: { code: 'VALIDATION_ERROR', details: ... } }` | HTTP 400 with details | **PASS** |
