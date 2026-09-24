# 🔒 JobsAPI — Security Audit & Threat Model

**Document Version:** 1.0.0  
**Audit Date:** 2026-09-24  
**Auditor:** Senior Staff Architect & Security Specialist  
**Status:** Remediated & Hardened

---

## 1. Executive Summary

A comprehensive security analysis of the **JobsAPI** codebase was conducted covering authentication, authorization, input validation, injection vectors, file storage, secrets management, and denial of service mitigations.

All identified vulnerabilities have been classified and remediated with production defenses.

---

## 2. Security Findings & Classification

| Risk ID | Category | Severity | Description | Status |
| :--- | :--- | :--- | :--- | :--- |
| **SEC-001** | **Injection** | 🔴 **HIGH** | ReDoS / Unescaped Regex in search queries (`company`, `location`, `jobType`). | ✅ **Remediated** via `escapeRegex()` |
| **SEC-002** | **Broken Access Control** | 🔴 **HIGH** | Sensitive triggers (`/api/jobs/sync`, `/api/automation/start`) were unauthenticated. | ✅ **Remediated** via JWT & API Key RBAC middleware |
| **SEC-003** | **Path Traversal / Info Leak** | 🟡 **MEDIUM** | Resume upload saved files with predictable names and exposed absolute OS paths. | ✅ **Remediated** via `StorageService` (UUID filenames, path normalization) |
| **SEC-004** | **Denial of Service** | 🟡 **MEDIUM** | Lack of rate limiting on expensive automation triggers and sync operations. | ✅ **Remediated** via Token Bucket Rate Limiters |
| **SEC-005** | **Data Exposure** | 🟢 **LOW** | Potential stack trace leakage in Express error responses. | ✅ **Remediated** via Centralized `errorHandler` |

---

## 3. Threat Model & Implemented Defenses

### 3.1 Injection Defense (NoSQL & ReDoS)
- **Regular Expression Sanitization:** All user query inputs are passed through `escapeRegex()` in `src/utils/sanitizer.js` before compiling regex queries, neutralizing catastrophic backtracking attacks.
- **NoSQL Operator Stripping:** `sanitizeNoSql()` strips keys starting with `$` or containing `.` from untrusted bodies.

### 3.2 Authentication & Role-Based Access Control (RBAC)
- **JWT & Admin API Key Authentication:** Protected routes verify `Bearer <token>` or `X-API-Key: <admin_key>`.
- **Local Dev Frictionless Fallback:** In non-production environments (`NODE_ENV !== 'production'`), requests without headers automatically fall back to `local_admin_1` with `ADMIN` privileges, preserving developer ergonomics.

### 3.3 File Upload Hardening
- **MIME & Extension Whitelisting:** Enforces strict `.pdf` checks and MIME type verification.
- **Randomized Storage UUIDs:** Files are stored as `resume-<uuid>.pdf`, preventing filename collisions and execution of arbitrary extensions.
- **Relative URL Masking:** Internal server filesystem paths are never exposed; clients receive sanitized URLs (`/uploads/resumes/...`).

### 3.4 Rate Limiting & Resource Caps
- **API Rate Limiter:** 200 requests/minute.
- **Automation Rate Limiter:** 30 jobs/hour to prevent browser process saturation.
- **Sync Rate Limiter:** 10 sync triggers / 10 minutes.
- **Max Upload Size:** Bounded to 5MB.
