import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileText,
  ShieldCheck,
  Zap,
  ArrowUpRight
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { startAutomation } from '../../services/api';
import { extractSkillList } from '../../utils/skills';

export const JobIntelligencePanel = ({
  job,
  profile,
  readiness,
  onAutomationTriggered,
}) => {
  const [isApplying, setIsApplying] = useState(false);
  const [applyResult, setApplyResult] = useState(null);

  if (!job) return null;

  const userSkills = profile?.skills || profile?.professionalInfo?.skills || [];
  const extractedUserSkills = extractSkillList(userSkills);
  const normalizedUserSkills = extractedUserSkills.map((s) => s.toLowerCase());

  const jobSkills = extractSkillList(job.skills);
  const matchingSkills = jobSkills.filter((s) => normalizedUserSkills.includes(s.toLowerCase()));
  const missingSkills = jobSkills.filter((s) => !normalizedUserSkills.includes(s.toLowerCase()));


  const totalEvaluated = matchingSkills.length + missingSkills.length;
  const matchPercentage = totalEvaluated > 0 ? Math.round((matchingSkills.length / totalEvaluated) * 100) : 85;

  const isResumeReady = Boolean(profile?.assets?.length > 0 || profile?.documents?.defaultResumePath);
  const profileScore = readiness?.overallScore || readiness?.score || 92;

  const handleTriggerAutoApply = async () => {
    setIsApplying(true);
    setApplyResult(null);
    try {
      const payload = {
        jobId: job._id || job.id,
        connectorName: job.source ? `${job.source}Connector` : 'greenhouseConnector',
      };
      const res = await startAutomation(payload);
      setApplyResult({
        success: true,
        message: res.message || 'Application queued for automation',
        sessionId: res.sessionId,
      });
      if (onAutomationTriggered) onAutomationTriggered(res);
    } catch (err) {
      setApplyResult({
        success: false,
        message: err.message || 'Unable to trigger Auto Apply at this time.',
      });
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="card-warm p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border-warm">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-brand-subtle text-brand-primary">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-charcoal tracking-tight">
              Job Intelligence
            </h3>
            <p className="text-xs text-charcoal-muted">
              AI-driven profile alignment & readiness
            </p>
          </div>
        </div>

        <Badge variant="brand" size="md" className="font-bold">
          {matchPercentage}% Match
        </Badge>
      </div>

      {/* Profile & ATS Readiness Snapshot */}
      <div className="space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted">
          Readiness & Assets
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3 rounded-xl bg-surface-soft border border-border-warm/60">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-charcoal-muted flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-brand-primary" />
                Resume
              </span>
              <span className="font-semibold text-charcoal">
                {isResumeReady ? 'Ready' : 'Pending'}
              </span>
            </div>
            <div className="text-[11px] text-charcoal-muted">
              {isResumeReady ? 'Primary PDF attached' : 'Upload in profile'}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-surface-soft border border-border-warm/60">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-charcoal-muted flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-primary" />
                Profile
              </span>
              <span className="font-semibold text-brand-primary">
                {profileScore}%
              </span>
            </div>
            <div className="text-[11px] text-charcoal-muted">
              Universal fields filled
            </div>
          </div>
        </div>
      </div>

      {/* Skills Matrix */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted">
            Skill Alignment ({matchingSkills.length}/{jobSkills.length || totalEvaluated})
          </span>
        </div>

        {matchingSkills.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-xs font-medium text-success flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Matching in your profile
            </div>
            <div className="flex flex-wrap gap-1.5">
              {matchingSkills.map((skill) => (
                <span
                  key={skill}
                  className="text-xs px-2.5 py-1 rounded-md font-medium bg-success-bg text-success border border-success/30"
                >
                  ✓ {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {missingSkills.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <div className="text-xs font-medium text-charcoal-muted flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              Not listed in your skills
            </div>
            <div className="flex flex-wrap gap-1.5">
              {missingSkills.map((skill) => (
                <span
                  key={skill}
                  className="text-xs px-2.5 py-1 rounded-md font-medium bg-surface-soft text-charcoal-muted border border-border-warm"
                >
                  ○ {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Auto Apply Action Box */}
      <div className="p-4 rounded-xl bg-brand-wash border border-brand-secondary/30 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs font-bold text-brand-primary flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 fill-current" />
              Auto Apply Ready
            </div>
            <p className="text-[11px] text-charcoal-muted mt-0.5 leading-relaxed">
              JobsAPI can handle form detection and submission for this {job.source || 'ATS'} role.
            </p>
          </div>
        </div>

        {applyResult ? (
          <div
            className={`p-3 rounded-lg text-xs ${
              applyResult.success
                ? 'bg-success-bg text-success border border-success/30'
                : 'bg-danger-bg text-danger border border-danger/30'
            }`}
          >
            <div className="font-semibold">{applyResult.message}</div>
            {applyResult.sessionId && (
              <div className="text-[11px] mt-1 opacity-80">
                Session ID: {applyResult.sessionId}
              </div>
            )}
          </div>
        ) : (
          <Button
            variant="primary"
            size="md"
            className="w-full"
            isLoading={isApplying}
            onClick={handleTriggerAutoApply}
            icon={Zap}
          >
            Launch Auto Apply
          </Button>
        )}
      </div>
    </div>
  );
};
