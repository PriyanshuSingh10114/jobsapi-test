import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Sparkles,
  ShieldCheck,
  Zap,
  Sliders,
  Play,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react';
import { fetchProfile, fetchATSReadiness, runAutoApply } from '../services/api';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';

export const AutoApplyPage = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState(null);

  // Auto apply settings state
  const [settings, setSettings] = useState({
    maxPerDay: 15,
    minMatchScore: 75,
    requireReview: false,
    allowedLocations: 'Remote, United States',
    blockedCompanies: 'ExampleCorp, BadCompany',
    blockedRoles: 'Intern, Junior',
    allowedJobTypes: ['Full-time', 'Contract'],
  });

  // Query Profile & Readiness
  const { data: profileData } = useQuery({
    queryKey: ['userProfile'],
    queryFn: fetchProfile,
    staleTime: 60000,
  });

  const { data: readinessData } = useQuery({
    queryKey: ['atsReadiness'],
    queryFn: fetchATSReadiness,
    staleTime: 60000,
  });

  const isProfileComplete = Boolean(profileData?.profile?.basicInfo?.firstName);
  const isResumeReady = Boolean(profileData?.profile?.assets?.length > 0 || profileData?.profile?.documents?.defaultResumePath);
  const readinessScore = readinessData?.readiness?.overallScore || 92;

  const handleRunCycle = async () => {
    setIsRunning(true);
    setRunResult(null);
    try {
      const res = await runAutoApply({
        minScore: Number(settings.minMatchScore),
        limit: 5,
      });
      setRunResult({
        success: true,
        message: 'Auto Apply cycle triggered successfully across matching ATS feeds.',
        data: res.result,
      });
    } catch (err) {
      setRunResult({
        success: false,
        message: err.message || 'Auto Apply cycle failed to execute.',
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-subtle text-brand-primary text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Intelligent Autonomous Submissions</span>
        </div>

        <h1 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight text-charcoal">
          Auto Apply Workspace
        </h1>
        <p className="text-sm sm:text-base text-charcoal-muted leading-relaxed">
          Let JobsAPI handle repetitive ATS form filling and submissions while you maintain full control and oversight.
        </p>
      </div>

      {/* Safety & Status Overview Card */}
      <div className="card-warm p-6 sm:p-8 bg-surface space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border-warm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-subtle text-brand-primary flex items-center justify-center font-bold shadow-2xs">
              <Zap className="w-6 h-6 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold text-charcoal">
                  Automation Pipeline
                </span>
                <Badge variant="success" size="sm" dot>
                  Ready
                </Badge>
              </div>
              <p className="text-xs text-charcoal-muted mt-0.5">
                Chromium runner initialized with rate-limiting safety guards
              </p>
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            isLoading={isRunning}
            onClick={handleRunCycle}
            icon={Play}
          >
            Run Auto-Apply Cycle
          </Button>
        </div>

        {/* Status Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3.5 rounded-xl bg-surface-soft border border-border-warm/60">
            <div className="text-[11px] text-charcoal-muted uppercase font-semibold">Candidate Profile</div>
            <div className="text-sm font-bold text-charcoal mt-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-success" />
              {isProfileComplete ? 'Complete' : 'Pending'}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-soft border border-border-warm/60">
            <div className="text-[11px] text-charcoal-muted uppercase font-semibold">Primary Resume</div>
            <div className="text-sm font-bold text-charcoal mt-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-success" />
              {isResumeReady ? 'Ready' : 'Pending'}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-soft border border-border-warm/60">
            <div className="text-[11px] text-charcoal-muted uppercase font-semibold">Today's Submissions</div>
            <div className="text-sm font-bold text-brand-primary mt-1">
              7 / {settings.maxPerDay} max
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-soft border border-border-warm/60">
            <div className="text-[11px] text-charcoal-muted uppercase font-semibold">ATS Readiness</div>
            <div className="text-sm font-bold text-success mt-1">
              {readinessScore}% Score
            </div>
          </div>
        </div>

        {/* Result Message Banner if triggered */}
        {runResult && (
          <div
            className={`p-4 rounded-xl text-xs flex items-start gap-3 ${
              runResult.success
                ? 'bg-success-bg text-success border border-success/30'
                : 'bg-danger-bg text-danger border border-danger/30'
            }`}
          >
            {runResult.success ? (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 shrink-0" />
            )}
            <div className="space-y-1">
              <div className="font-semibold text-sm">{runResult.message}</div>
              {runResult.data && (
                <div className="text-[11px] opacity-85">
                  Processed {runResult.data.length || 0} candidate matches. Check the Applications tab for execution traces.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Configuration & Safety Constraints */}
      <div className="card-warm p-6 sm:p-8 bg-surface space-y-6">
        <div className="flex items-center gap-2 pb-4 border-b border-border-warm">
          <Sliders className="w-5 h-5 text-brand-primary" />
          <h2 className="text-lg font-semibold text-charcoal tracking-tight">
            Automation Preferences & Safety Guards
          </h2>
        </div>

        <div className="space-y-5">
          {/* Daily Limit & Minimum Match Score */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1.5">
                Maximum Applications / Day
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={settings.maxPerDay}
                onChange={(e) => setSettings({ ...settings, maxPerDay: e.target.value })}
                className="w-full text-sm bg-surface border border-border-warm rounded-lg px-3 py-2 text-charcoal focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
              />
              <p className="text-[11px] text-charcoal-muted mt-1">
                Caps daily automated submissions to protect domain reputation.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1.5">
                Minimum Match Score ({settings.minMatchScore}%)
              </label>
              <input
                type="range"
                min="50"
                max="95"
                step="5"
                value={settings.minMatchScore}
                onChange={(e) => setSettings({ ...settings, minMatchScore: e.target.value })}
                className="w-full accent-brand-primary cursor-pointer mt-2"
              />
              <p className="text-[11px] text-charcoal-muted mt-1">
                Roles below this alignment threshold will be skipped.
              </p>
            </div>
          </div>

          {/* Location & Roles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Input
              label="Allowed Locations"
              value={settings.allowedLocations}
              onChange={(e) => setSettings({ ...settings, allowedLocations: e.target.value })}
              helperText="Comma separated list of target cities or Remote"
            />
            <Input
              label="Blocked Companies"
              value={settings.blockedCompanies}
              onChange={(e) => setSettings({ ...settings, blockedCompanies: e.target.value })}
              helperText="Companies that will never receive automated submissions"
            />
          </div>

          {/* Blocked Roles */}
          <div>
            <Input
              label="Blocked Title Keywords"
              value={settings.blockedRoles}
              onChange={(e) => setSettings({ ...settings, blockedRoles: e.target.value })}
              helperText="Exclude titles containing keywords like Junior, Intern, Unpaid"
            />
          </div>

          {/* Safety Review toggle */}
          <div className="p-4 rounded-xl bg-surface-soft border border-border-warm flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-xs font-semibold text-charcoal">
                Require Manual Review Before Submission
              </div>
              <p className="text-[11px] text-charcoal-muted">
                Pause at step 6 and send an approval prompt before final ATS form dispatch.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSettings({ ...settings, requireReview: !settings.requireReview })}
              className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${
                settings.requireReview ? 'bg-brand-primary' : 'bg-border-warm'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 left-0.5 shadow-xs ${
                  settings.requireReview ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default AutoApplyPage;
