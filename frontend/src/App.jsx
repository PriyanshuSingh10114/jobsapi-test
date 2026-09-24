import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/layout/AppShell';

// Lazy-loaded page components for optimal performance
const OverviewPage = lazy(() => import('./pages/OverviewPage'));
const DiscoverPage = lazy(() => import('./pages/DiscoverPage'));
const JobDetailPage = lazy(() => import('./pages/JobDetailPage'));
const SavedJobsPage = lazy(() => import('./pages/SavedJobsPage'));
const ApplicationsPage = lazy(() => import('./pages/ApplicationsPage'));
const ApplicationDetailPage = lazy(() => import('./pages/ApplicationDetailPage'));
const AutoApplyPage = lazy(() => import('./pages/AutoApplyPage'));
const InsightsPage = lazy(() => import('./pages/InsightsPage'));
const SkillTrendsPage = lazy(() => import('./pages/SkillTrendsPage'));
const SourceHealthPage = lazy(() => import('./pages/SourceHealthPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

// Fallback loading shimmer
const PageLoader = () => (
  <div className="p-8 space-y-6 max-w-5xl mx-auto animate-pulse">
    <div className="h-10 w-1/3 bg-surface-soft rounded-xl" />
    <div className="h-5 w-1/2 bg-surface-soft rounded-lg" />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
      <div className="h-36 bg-surface-soft rounded-2xl" />
      <div className="h-36 bg-surface-soft rounded-2xl" />
      <div className="h-36 bg-surface-soft rounded-2xl" />
    </div>
  </div>
);

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<AppShell />}>
          <Route index element={<OverviewPage />} />
          <Route path="discover" element={<DiscoverPage />} />
          <Route path="jobs/:id" element={<JobDetailPage />} />
          <Route path="saved" element={<SavedJobsPage />} />
          <Route path="applications" element={<ApplicationsPage />} />
          <Route path="applications/:id" element={<ApplicationDetailPage />} />
          <Route path="auto-apply" element={<AutoApplyPage />} />
          <Route path="insights" element={<InsightsPage />} />
          <Route path="insights/skills" element={<SkillTrendsPage />} />
          <Route path="insights/sources" element={<SourceHealthPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
          {/* Legacy redirect */}
          <Route path="dashboard" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default App;


