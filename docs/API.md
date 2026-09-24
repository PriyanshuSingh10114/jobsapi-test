# 📡 JobsAPI — REST API Reference

Base URL: `http://localhost:5000/api`  
Swagger UI: `http://localhost:5000/api-docs`

---

## 1. Authentication
Protected routes require an Authorization header or API Key:
```http
Authorization: Bearer <token>
```
or
```http
x-api-key: <admin_api_key>
```
*(In development mode, requests automatically default to `local_admin_1` with full ADMIN permissions if headers are omitted).*

---

## 2. Endpoints

### Health & Observability
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Liveness check | Public |
| `GET` | `/health/ready` | Readiness check (MongoDB & Redis ping) | Public |
| `GET` | `/api/metrics` | System & DB telemetry | Admin |

### Job Management & Search
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/jobs` | Paginated job list with filters (`page`, `limit`, `company`, `location`, `remote`, `jobType`, `source`) | Public |
| `GET` | `/api/jobs/search` | Full-text and keyword search with relevance scoring | Public |
| `GET` | `/api/jobs/suggestions` | Search autocompletion suggestions | Public |
| `POST` | `/api/jobs/sync` | Trigger full ATS sync | Admin |

### Automation & Auto-Apply
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/automation/start` | Enqueue an automated application task | User / Admin |
| `GET` | `/api/automation/status/:id` | Poll application state machine status | User / Admin |
| `GET` | `/api/automation/logs/:id` | View automation trace logs | User / Admin |

### Candidate Profile & Assets
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/user/profile` | Retrieve unified candidate profile | User / Admin |
| `PATCH` | `/api/user/profile` | Update profile fields | User / Admin |
| `POST` | `/api/user/resume` | Upload candidate resume PDF | User / Admin |
| `GET` | `/api/user/readiness` | Evaluate candidate profile ATS score | User / Admin |
| `GET` | `/api/user/registry` | Fetch universal ATS field registry | Public |

---

## 3. Standardized Error Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request payload",
    "details": {
      "jobId": "Valid MongoDB jobId is required"
    }
  },
  "requestId": "3b35f2be-d387-484d-a502-126a0c3144cd"
}
```
