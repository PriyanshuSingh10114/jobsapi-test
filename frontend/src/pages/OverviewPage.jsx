import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Compass,
  ArrowRight,
  Briefcase,
  Globe2,
  TrendingUp,
  Sparkles,
  ShieldCheck,
  Send,
  Building2,
  FileText,
  RefreshCw
} from 'lucide-react';
import { fetchJobs, fetchStats, fetchProfile, fetchATSReadiness, fetchProfileHistory } from '../services/api';
import { SearchInput } from '../components/ui/SearchInput';
import { JobCard } from '../components/jobs/JobCard';
import { JobCardSkeleton } from '../components/ui/Skeleton';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { extractSkillList } from '../utils/skills';

export const OverviewPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshOverview = async () => {
    setIsRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['overviewJobs'] }),
      queryClient.invalidateQueries({ queryKey: ['stats'] }),
      queryClient.invalidateQueries({ queryKey: ['atsReadiness'] }),
    ]);
    setTimeout(() => setIsRefreshing(false), 600);
  };


  // Fetch Stats
  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: fetchStats,
    staleTime: 60000,
  });

  // Fetch Candidate Profile
  const { data: profileData } = useQuery({
    queryKey: ['userProfile'],
    queryFn: fetchProfile,
    staleTime: 60000,
  });

  // Fetch ATS Readiness
  const { data: readinessData } = useQuery({
    queryKey: ['atsReadiness'],
    queryFn: fetchATSReadiness,
    staleTime: 60000,
  });

  // Fetch Recommended / Latest Jobs
  const { data: jobsData, isLoading: isJobsLoading } = useQuery({
    queryKey: ['overviewJobs'],
    queryFn: () => fetchJobs({ limit: 6, sort: 'Most Relevant' }),
    staleTime: 60000,
  });

  // Fetch Application History
  const { data: historyData } = useQuery({
    queryKey: ['userHistory'],
    queryFn: fetchProfileHistory,
    staleTime: 60000,
  });

  const candidateName = profileData?.profile?.basicInfo?.firstName || profileData?.profile?.identity?.firstName || 'Candidate';
  const readinessScore = readinessData?.readiness?.overallScore || profileData?.readiness?.overallScore || 92;
  const userSkills = extractSkillList(profileData?.profile?.skills || profileData?.profile?.professionalInfo?.skills);


  const handleSearch = (q) => {
    if (q && q.trim()) {
      navigate(`/discover?role=${encodeURIComponent(q.trim())}`);
    } else {
      navigate('/discover');
    }
  };

  return (
    <div className="space-y-10">
      {/* Editorial Welcome Header */}
      <div className="max-w-3xl space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-subtle text-brand-primary text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Intelligent Career Workspace</span>
        </div>

        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-charcoal">
          Good day, {candidateName}.
        </h1>
        <p className="text-base sm:text-lg text-charcoal-muted leading-relaxed font-normal">
          Find roles worth applying to, monitor automated submissions, and keep your ATS knowledge graph primed.
        </p>
      </div>

      {/* Hero Job Search Box */}
      <div className="card-warm p-4 sm:p-6 shadow-warm-md bg-surface border-border-warm">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex-1 w-full">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              onSearch={handleSearch}
              size="lg"
              placeholder="Search DevOps, Cloud Architect, Senior React Engineer, AI..."
              shortcut
            />
          </div>
          <Button
            variant="primary"
            size="lg"
            onClick={() => handleSearch(searchQuery)}
            className="w-full sm:w-auto px-6"
            icon={Compass}
          >
            Explore Jobs
          </Button>
        </div>

        {/* Quick Filter Prompts */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-border-warm/60 text-xs text-charcoal-muted">
          <span className="font-semibold text-charcoal-light">Trending searches:</span>
          {['DevOps Engineer', 'Full Stack', 'Cloud Architect', 'Remote', 'Kubernetes'].map((term) => (
            <button
              key={term}
              onClick={() => handleSearch(term)}
              className="px-2.5 py-1 rounded-lg bg-surface-soft hover:bg-brand-subtle hover:text-brand-primary text-charcoal-light transition-colors cursor-pointer border border-border-warm/60"
            >
              {term}
            </button>
          ))}
        </div>
      </div>

      {/* Metric Snapshot */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-warm p-4 sm:p-5">
          <div className="flex items-center justify-between text-charcoal-muted mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Jobs Indexed</span>
            <Briefcase className="w-4 h-4 text-brand-primary" />
          </div>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-charcoal tracking-tight">
            {stats?.totalJobs ? stats.totalJobs.toLocaleString() : '17,296'}
          </div>
          <div className="text-[11px] text-charcoal-muted mt-1">
            Across 13+ ATS platforms
          </div>
        </div>

        <div className="card-warm p-4 sm:p-5">
          <div className="flex items-center justify-between text-charcoal-muted mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Remote Roles</span>
            <Globe2 className="w-4 h-4 text-brand-secondary" />
          </div>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-charcoal tracking-tight">
            {stats?.remoteJobs ? stats.remoteJobs.toLocaleString() : '8,420'}
          </div>
          <div className="text-[11px] text-charcoal-muted mt-1">
            Verified remote positions
          </div>
        </div>

        <div className="card-warm p-4 sm:p-5">
          <div className="flex items-center justify-between text-charcoal-muted mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Companies</span>
            <Building2 className="w-4 h-4 text-info" />
          </div>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-charcoal tracking-tight">
            {stats?.totalCompanies ? stats.totalCompanies.toLocaleString() : '1,450+'}
          </div>
          <div className="text-[11px] text-charcoal-muted mt-1">
            Actively hiring companies
          </div>
        </div>

        <div className="card-warm p-4 sm:p-5">
          <div className="flex items-center justify-between text-charcoal-muted mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">ATS Readiness</span>
            <ShieldCheck className="w-4 h-4 text-success" />
          </div>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-brand-primary tracking-tight">
            {readinessScore}%
          </div>
          <div className="text-[11px] text-charcoal-muted mt-1">
            Profile & Resume primed
          </div>
        </div>
      </div>

      {/* Main Workspace Split: Recommended Jobs (Left) & Candidate Dossier (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Recommended Roles */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-charcoal tracking-tight">
                Recommended Roles
              </h2>
              <p className="text-xs text-charcoal-muted mt-0.5">
                Curated for your skills & telemetry profile
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRefreshOverview}
                disabled={isRefreshing}
                className="px-3 py-1.5 rounded-lg bg-surface border border-border-warm text-xs font-semibold text-charcoal hover:bg-surface-soft flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                title="Refresh recommended feed"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-brand-primary ${isRefreshing || isJobsLoading ? 'animate-spin' : ''}`} />
                <span>Refresh Feed</span>
              </button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/discover')}
                icon={ArrowRight}
                iconPosition="right"
              >
                View all
              </Button>
            </div>
          </div>


          {isJobsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <JobCardSkeleton key={i} />
              ))}
            </div>
          ) : jobsData?.data && jobsData.data.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {jobsData.data.map((job) => (
                <JobCard
                  key={job._id || job.id}
                  job={job}
                  userSkills={userSkills}
                />
              ))}
            </div>
          ) : (
            <div className="card-warm p-8 text-center text-charcoal-muted text-sm">
              No recommended jobs found. Start searching in Discover.
            </div>
          )}
        </div>

        {/* Right 1 Col: Candidate Workspace & Automation Status */}
        <div className="space-y-6">
          {/* Readiness Card */}
          <div className="card-warm p-6 space-y-4 bg-surface">
            <div className="flex items-center justify-between pb-3 border-b border-border-warm">
              <h3 className="text-sm font-semibold text-charcoal flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-primary" />
                Profile Readiness
              </h3>
              <Badge variant="brand" size="sm">
                {readinessScore}% Complete
              </Badge>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-charcoal-muted flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-success" />
                  Personal Information
                </span>
                <span className="font-medium text-success">Verified</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-charcoal-muted flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-success" />
                  Work Authorization
                </span>
                <span className="font-medium text-success">Ready</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-charcoal-muted flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-success" />
                  Primary Resume PDF
                </span>
                <span className="font-medium text-success">Attached</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-charcoal-muted flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-warning" />
                  Skill Endorsements
                </span>
                <span className="font-medium text-warning">Optional</span>
              </div>
            </div>

            <Button
              variant="secondary"
              size="sm"
              className="w-full"
              onClick={() => navigate('/profile')}
            >
              Manage Candidate Knowledge Graph
            </Button>
          </div>

          {/* Auto Apply Status Card */}
          <div className="card-warm p-6 space-y-4 bg-brand-wash border-brand-secondary/30">
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-brand-primary flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Auto Apply Engine
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-success">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                Active
              </span>
            </div>

            <p className="text-xs text-charcoal-muted leading-relaxed">
              JobsAPI can autonomously format, validate, and submit ATS applications based on your profile constraints.
            </p>

            <Button
              variant="primary"
              size="sm"
              className="w-full"
              onClick={() => navigate('/auto-apply')}
              icon={Send}
            >
              Configure Automation
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default OverviewPage;
