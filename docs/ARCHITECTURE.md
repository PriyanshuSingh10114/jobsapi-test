# 🏛️ JobsAPI — System Architecture Specification

## 1. Overview
JobsAPI is an enterprise platform for real-time job harvesting, data normalization, AI-powered enrichment, search indexing, and automated candidate applications.

```mermaid
flowchart TD
    subgraph Ingestion ["1. Multi-Source Ingestion"]
        ATS[13+ ATS Connectors] --> SP[SyncPipeline]
        SP --> DEDUP[Deterministic Hasher (SHA-256)]
        DEDUP --> BULK[MongoDB Bulk Writer]
    end

    subgraph Core_API ["2. Express.js REST API"]
        API[API Router / Middleware]
        API --> AUTH[Auth & Rate Limiting]
        AUTH --> CTRL[Controllers & Services]
        CTRL --> MDB[(MongoDB Database)]
    end

    subgraph Automation ["3. Autonomous Application Worker"]
        QUEUE[BullMQ Queue] --> WORKER[Playwright Automation Worker]
        WORKER --> SM[State Machine]
        WORKER --> BPOOL[Browser Pool]
        WORKER --> KG[Candidate Knowledge Graph]
    end

    subgraph Frontend ["4. React 19 Frontend"]
        UI[Vite + React 19 + Tailwind CSS] --> API
    end
```

## 2. Core Subsystems

### 2.1 SyncPipeline & Ingestion Engine
- **Independent Failure Isolation:** Connectors execute with `Promise.allSettled()`. Failure of one external ATS does not abort other sync jobs.
- **Deduplication:** Jobs are hashed with deterministic SHA-256 (`company|title|location|type|source|url|descHash`).
- **Bulk Write Batching:** Database writes are chunked in 1,000 document batches to avoid memory spikes and lock contention.

### 2.2 RPA Automation Worker
- **BullMQ + Redis:** Decoupled asynchronous queue processing with exponential retry backoff.
- **Playwright BrowserPool:** Bounded Chromium instance pooling with graceful shutdown and process leak prevention.
- **Candidate Knowledge Graph (UCKGraph):** Canonical truth source for candidate identities, work authorizations, and career preferences.

### 2.3 Layered Application Design
- **Routes:** Thin endpoint mounters with rate limiters and validators.
- **Controllers:** Request/Response formatters.
- **Services:** Pure business and domain logic.
- **Errors:** Typed `AppError` hierarchy.
