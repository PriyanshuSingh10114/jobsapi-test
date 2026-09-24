import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Clock,
  Bookmark,
  ExternalLink,
  Zap,
  Globe2,
  DollarSign,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { fetchJobById, fetchProfile, fetchATSReadiness } from '../services/api';
import { JobIntelligencePanel } from '../components/jobs/JobIntelligencePanel';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { ErrorState } from '../components/ui/ErrorState';

export const JobDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isSaved, setIsSaved] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('jobsapi_saved_jobs') || '[]');
      return saved.some((j) => (j._id || j.id) === id);
    } catch {
      return false;
    }
  });

  // Query single job
  const {
    data: job,
    isLoading: isJobLoading,
    isError: isJobError,
    error: jobError,
    refetch: refetchJob
  } = useQuery({
    queryKey: ['jobDetail', id],
    queryFn: () => fetchJobById(id),
    enabled: Boolean(id),
    staleTime: 60000,
  });

  // Query Profile
  const { data: profileData } = useQuery({
    queryKey: ['userProfile'],
    queryFn: fetchProfile,
    staleTime: 60000,
  });

  // Query Readiness
  const { data: readinessData } = useQuery({
    queryKey: ['atsReadiness'],
    queryFn: fetchATSReadiness,
    staleTime: 60000,
  });

  const handleToggleSave = () => {
    if (!job) return;
    const nextState = !isSaved;
    setIsSaved(nextState);
    try {
      const saved = JSON.parse(localStorage.getItem('jobsapi_saved_jobs') || '[]');
      if (nextState) {
        if (!saved.some(j => (j._id || j.id) === (job._id || job.id))) {
          saved.push(job);
        }
      } else {
        const filtered = saved.filter(j => (j._id || j.id) !== (job._id || job.id));
        localStorage.setItem('jobsapi_saved_jobs', JSON.stringify(filtered));
        return;
      }
      localStorage.setItem('jobsapi_saved_jobs', JSON.stringify(saved));
    } catch {
      // ignore
    }
  };

  if (isJobLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-28" />
        <div className="card-warm p-8 space-y-4">
          <Skeleton className="h-8 w-3/5" />
          <Skeleton className="h-5 w-2/5" />
          <div className="flex gap-2 pt-4">
            <Skeleton className="h-8 w-24 rounded-lg" />
            <Skeleton className="h-8 w-24 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (isJobError || !job) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} icon={ArrowLeft}>
          Back to listings
        </Button>
        <ErrorState
          title="Job listing not found"
          message={jobError?.message || 'We could not locate this job requisition.'}
          onRetry={() => refetchJob()}
        />
      </div>
    );
  }

  const {
    title = 'Software Engineer',
    company = 'Company',
    location = 'United States',
    remote = false,
    jobType = 'Full-time',
    experienceLevel = '',
    salary = null,
    skills = [],
    description = '',
    applyUrl = '',
    source = '',
    postedAt
  } = job;

  // Format Salary
  const formatSalary = (sal) => {
    if (!sal) return null;
    if (typeof sal === 'string') return sal;
    if (sal.min && sal.max) {
      return `$${Math.round(sal.min / 1000)}k – $${Math.round(sal.max / 1000)}k / year`;
    }
    if (sal.min) return `From $${Math.round(sal.min / 1000)}k / year`;
    return null;
  };

  const salaryDisplay = formatSalary(salary);

  return (
    <div className="space-y-8">
      {/* Back button */}
      <div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs font-semibold text-charcoal-muted hover:text-charcoal transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Jobs
        </button>
      </div>

      {/* Main Hero Header Card */}
      <div className="card-warm p-6 sm:p-8 bg-surface">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-surface-soft border border-border-warm flex items-center justify-center font-bold text-2xl text-brand-primary shrink-0 shadow-warm-sm">
              {company.charAt(0).toUpperCase()}
            </div>

            <div className="space-y-1.5">
              <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-charcoal">
                {title}
              </h1>

              <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-charcoal-muted">
                <span className="font-semibold text-charcoal flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-brand-primary" />
                  {company}
                </span>
                <span className="text-border-warm">•</span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-charcoal-muted" />
                  {location || 'Remote'}
                </span>
                {postedAt && (
                  <>
                    <span className="text-border-warm">•</span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-charcoal-muted" />
                      Posted {new Date(postedAt).toLocaleDateString()}
                    </span>
                  </>
                )}
              </div>

              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                {remote && (
                  <Badge variant="brand" size="md" dot>
                    Remote Verified
                  </Badge>
                )}
                {jobType && (
                  <Badge variant="neutral" size="md">
                    {jobType}
                  </Badge>
                )}
                {experienceLevel && (
                  <Badge variant="neutral" size="md">
                    {experienceLevel}
                  </Badge>
                )}
                {source && (
                  <Badge variant="info" size="md">
                    {source.toUpperCase()} ATS
                  </Badge>
                )}
                {salaryDisplay && (
                  <Badge variant="neutral" size="md" className="font-bold text-charcoal">
                    <DollarSign className="w-3.5 h-3.5 -mr-1 text-brand-primary" />
                    {salaryDisplay}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-3 shrink-0 self-start">
            <button
              type="button"
              onClick={handleToggleSave}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                isSaved
                  ? 'bg-brand-subtle text-brand-primary border-brand-secondary/40 shadow-xs'
                  : 'bg-surface-soft text-charcoal-muted hover:text-charcoal border-border-warm'
              }`}
              title={isSaved ? 'Saved to bookmarks' : 'Save role'}
            >
              <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
            </button>

            {applyUrl && (
              <a
                href={applyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-surface-soft hover:bg-border-warm/60 border border-border-warm text-charcoal transition-all"
              >
                <span>ATS Direct</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Main Split: Job Description & Intelligence Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left 2 Cols: Job Description & Responsibilities */}
        <div className="lg:col-span-2 space-y-6">
          {/* Required Skills list */}
          {skills.length > 0 && (
            <div className="card-warm p-6 space-y-3 bg-surface">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-charcoal-muted">
                Required Technical Skills
              </h2>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="text-xs px-3 py-1.5 rounded-lg font-medium bg-surface-soft text-charcoal border border-border-warm/80"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description Content */}
          <div className="card-warm p-6 sm:p-8 space-y-4 bg-surface">
            <h2 className="text-lg font-semibold text-charcoal tracking-tight pb-3 border-b border-border-warm">
              Role Description & Specifications
            </h2>

            {description ? (
              <div
                className="prose prose-sm max-w-none text-charcoal-light leading-relaxed space-y-4"
                dangerouslySetInnerHTML={{ __html: description }}
              />
            ) : (
              <p className="text-sm text-charcoal-muted leading-relaxed">
                Detailed role description is available directly on the {source || 'ATS'} application portal.
              </p>
            )}
          </div>
        </div>

        {/* Right 1 Col: Job Intelligence Panel */}
        <div className="lg:col-span-1 sticky top-20">
          <JobIntelligencePanel
            job={job}
            profile={profileData?.profile}
            readiness={readinessData?.readiness}
            onAutomationTriggered={() => {
              // trigger refresh of application tracking if needed
            }}
          />
        </div>
      </div>
    </div>
  );
};
export default JobDetailPage;
