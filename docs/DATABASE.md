# 🗄️ JobsAPI — Database & Index Specification

## 1. Overview
JobsAPI uses **MongoDB Atlas / MongoDB 7.0+** with Mongoose ODM.

---

## 2. Collections & Production Indexes

### `jobs` Collection
| Index | Type | Justification |
| :--- | :--- | :--- |
| `{ jobHash: 1 }` | **Unique** | Deterministic SHA-256 deduplication across sync runs. |
| `{ is_active: 1, isUSJob: 1, postedAt: -1 }` | **Compound** | Primary search query path for active US jobs sorted by recency. |
| `{ title: 'text', company: 'text', description: 'text', skills: 'text' }` | **Text** | Full-text search and keyword relevance scoring. |
| `{ company: 1, postedAt: -1 }` | **Compound** | Company-specific job listings. |
| `{ source: 1, postedAt: -1 }` | **Compound** | ATS source analytics and connector inspection. |
| `{ is_active: 1, last_seen: 1 }` | **Compound** | Job freshness lifecycle sweep and automatic archival. |

### `sources` Collection
Tracks connector sync state, success rates, latency, and consecutive failures.

### `uck_profiles` & `userprofiles` Collections
Stores candidate profile data, work authorization, ITAR status, education, experience, and uploaded resume paths.

### `applicationsessions` Collection
Tracks application automation lifecycle states (`Created`, `WorkerAssigned`, `FillingFields`, `Submitted`, etc.). Indexed on `{ jobId: 1, userId: 1 }` and `{ status: 1 }`.
