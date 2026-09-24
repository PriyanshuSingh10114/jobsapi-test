# Frontend Architecture & Design Audit: JobsAPI Workspace

**Version:** 2.0.0  
**Status:** In Progress (Redesign Execution)  
**Target Experience:** Premium Career-Tech Platform (Inspired by Resume2Hire-style calm aesthetic, balanced hierarchy, and rich typography)

---

## 1. Executive Summary & Existing Assessment

### Existing Frontend Characteristics:
- **Framework & Libraries:** React 19, Vite, Tailwind CSS v4, `@tanstack/react-query`, `lucide-react`, `recharts`, `axios`, `react-router-dom` v7.
- **Visual Gaps Identified:**
  1. *Generic Dashboard Feel:* High reliance on standard grey boxes, basic blue buttons, and generic Bootstrap/Tailwind admin cards.
  2. *Information Overload & Poor Hierarchy:* Large charts taking up valuable screen space without answering core candidate questions ("What jobs match me?", "Is my profile ready?").
  3. *Incomplete Product Journey:* Missing dedicated discover workflows, detailed job intelligence overlays, state machine application timeline viewer, calm auto-apply controls, and market insights exploration.
  4. *Lack of Brand Identity:* Missing custom design tokens, refined typography (editorial display + modern clean sans-serif), warm linen backgrounds, and dark forest green brand accents.

---

## 2. Design System Tokens & Foundations

### 2.1 Color Palette
- **Background (Canvas):** `#F7F5EF` (Warm Linen Cream) / Dark Mode: `#141815`
- **Surface (Card/Panels):** `#FFFFFF` (Pure Crisp White) / Dark Mode: `#1C211D`
- **Soft Surface:** `#EFEEE8` / Dark Mode: `#232A24`
- **Primary Text:** `#20251F` (Charcoal Forest) / Dark Mode: `#F2F1EB`
- **Secondary Text:** `#6D726B` (Muted Sage Grey) / Dark Mode: `#A4AAA2`
- **Brand Primary:** `#234B36` (Deep Evergreen) / Dark Mode: `#91B59A`
- **Brand Secondary:** `#7E987F` (Soft Sage) / Dark Mode: `#5E7E63`
- **Brand Accent / Highlight:** `#DCE8DE` (Subtle Forest Wash)
- **Border / Divider:** `#DDDAD2` / Dark Mode: `#2E3830`
- **State Indicators:**
  - *Success:* `#2E6F4E` / Soft bg: `#EAF5EE`
  - *Warning:* `#A36A18` / Soft bg: `#FEF7ED`
  - *Danger:* `#A83B3B` / Soft bg: `#FDEEEE`
  - *Info/ATS:* `#2A5E72` / Soft bg: `#EBF5FA`

### 2.2 Typography Scale
- **Display / Editorial Serifs:** `Newsreader` / `Playfair Display` / `Instrument Serif` (for high-level warm greetings and section accents)
- **UI Sans-Serif:** `Plus Jakarta Sans` / `Inter` (for legibility, stats, navigation, metadata)
- **Type Scale:**
  - Hero Display: 48px - 56px (weight 500/600)
  - Page Heading: 32px - 36px (weight 600)
  - Section Heading: 20px - 24px (weight 600)
  - Card Title: 16px - 18px (weight 600)
  - Body Text: 14px - 15px (weight 400/500)
  - Metadata & Badges: 12px - 13px (weight 500)

---

## 3. Navigation & Route Architecture

| Route | Page | Purpose & Core Capabilities |
|---|---|---|
| `/` | `OverviewPage` | Personalized workspace, recommended jobs, quick stats, readiness snapshot, quick search |
| `/discover` | `DiscoverPage` | Advanced split-view job search, multi-faceted filtering (role, location, remote, salary, experience, skills, source), pagination, debounced query |
| `/jobs/:id` | `JobDetailPage` | Full job dossier, responsibilities, requirements, and **Job Intelligence Panel** (matching skills, missing skills, readiness verification, auto-apply trigger) |
| `/saved` | `SavedJobsPage` | Bookmarked roles, local & synced persistent storage, quick apply, clean empty states |
| `/applications` | `ApplicationsPage` | Application tracking workspace with status filters (`All`, `Queued`, `Running`, `Submitted`, `Failed`), ATS source badges, execution diagnostics |
| `/applications/:id` | `ApplicationDetailPage` | Visual state machine timeline (`Created` -> `Profile Loaded` -> `Browser Launched` -> `ATS Detected` -> `Form Filled` -> `Submitted`), execution logs |
| `/auto-apply` | `AutoApplyPage` | Calm automation workspace, daily application limits, safety guards, targeted criteria, instant dry-run/batch trigger |
| `/profile` | `ProfilePage` | Candidate Knowledge Graph profile editor (Identity, Experience, Skills, Education, Work Authorization) + ATS Readiness scorecard |
| `/insights` | `InsightsPage` | Macro job market intelligence (Index count, remote distribution, salary bands, active hiring companies) |
| `/insights/skills` | `SkillTrendsPage` | In-demand tech skills, job frequency, role associations (Recharts integration) |
| `/insights/sources` | `SourceHealthPage` | ATS sync health (Greenhouse, Lever, Workday, Ashby, USAJobs, etc.), sync latency, job counts |
| `/settings` | `SettingsPage` | User preferences, theme settings (Light/Dark mode), API configuration |

---

## 4. Component Inventory Plan

### UI Primitives (`src/components/ui/`)
1. `Button` (Primary, Secondary, Outline, Ghost, Danger with subtle hover transitions)
2. `Badge` (Subtle tinted status pill indicators)
3. `Card` (Clean white container with warm border `#DDDAD2` and subtle shadow)
4. `Input` & `SearchInput` (Debounced, keyboard-friendly, icon prefix/suffix)
5. `Select` & `MultiSelect` (Accessible custom dropdowns)
6. `Skeleton` & `LoadingScreen` (Shimmering placeholders with calm palettes)
7. `EmptyState` & `ErrorState` (Meaningful messages with actionable CTAs)
8. `CommandPalette` (`⌘K` global quick launcher for lightning navigation)
9. `MatchScore` (Honest match indicator based on real candidate profile skills overlap)
10. `Timeline` (Step-by-step state machine visualizer for application executions)
11. `ThemeToggle` (Warm light / dark theme toggle with persistence)

### Domain Components
- **Layout:** `AppShell`, `Sidebar`, `TopBar`, `MobileNav`
- **Jobs:** `JobCard`, `JobFilterSidebar`, `JobIntelligencePanel`, `JobShareModal`
- **Applications:** `ApplicationTableRow`, `ApplicationTimeline`, `AutomationMetrics`
- **Profile:** `ReadinessWidget`, `CandidateFormSection`, `ResumeUploader`, `SkillTagInput`
- **Intelligence:** `MarketMetricCard`, `SkillBarChart`, `SourceHealthGrid`
