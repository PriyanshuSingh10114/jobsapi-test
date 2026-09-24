import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Compass,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Inbox,
  RefreshCw
} from 'lucide-react';

import { fetchJobs, searchJobs, fetchProfile } from '../services/api';
import { SearchInput } from '../components/ui/SearchInput';
import { JobCard } from '../components/jobs/JobCard';
import { JobFilterSidebar } from '../components/jobs/JobFilterSidebar';
import { JobCardSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { Button } from '../components/ui/Button';
import { extractSkillList } from '../utils/skills';

export const DiscoverPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Search and filter state from URL query params
  const [filters, setFilters] = useState({
    role: searchParams.get('role') || '',
    location: searchParams.get('location') || '',
    remote: searchParams.get('remote') || '',
    jobType: searchParams.get('jobType') || '',
    experienceLevel: searchParams.get('experienceLevel') || '',
    source: searchParams.get('source') || '',
    sort: searchParams.get('sort') || 'Most Relevant',
    page: parseInt(searchParams.get('page') || '1', 10),
  });

  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Sync state to URL params
  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== '' && val !== null && val !== undefined) {
        params.set(key, String(val));
      }
    });
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  // Fetch candidate profile for skill matching
  const { data: profileData } = useQuery({
    queryKey: ['userProfile'],
    queryFn: fetchProfile,
    staleTime: 60000,
  });
  const userSkills = extractSkillList(profileData?.profile?.skills || profileData?.profile?.professionalInfo?.skills);


  // Query jobs
  const {
    data: jobsData,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['discoverJobs', filters],
    queryFn: () => {
      const apiParams = {
        page: filters.page,
        limit: 12,
        sort: filters.sort,
        role: filters.role || undefined,
        location: filters.location || undefined,
        remote: filters.remote || undefined,
        jobType: filters.jobType || undefined,
        experienceLevel: filters.experienceLevel || undefined,
        source: filters.source || undefined,
      };

      return filters.role ? searchJobs(apiParams) : fetchJobs(apiParams);
    },
    staleTime: 30000,
  });

  const jobs = jobsData?.data || [];
  const totalCount = jobsData?.total || 0;
  const totalPages = jobsData?.pagination?.pages || 1;
  const currentPage = filters.page;

  const handleSearchChange = (val) => {
    setFilters(prev => ({ ...prev, role: val, page: 1 }));
  };

  const handleResetFilters = () => {
    setFilters({
      role: '',
      location: '',
      remote: '',
      jobType: '',
      experienceLevel: '',
      source: '',
      sort: 'Most Relevant',
      page: 1,
    });
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setFilters(prev => ({ ...prev, page: newPage }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Search Bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-serif text-3xl font-medium tracking-tight text-charcoal">
              Discover Jobs
            </h1>
            <p className="text-xs sm:text-sm text-charcoal-muted mt-0.5">
              Explore aggregated roles across 13+ verified ATS feeds
            </p>
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
              className="lg:hidden px-3 py-2 rounded-xl bg-surface border border-border-warm text-xs font-semibold text-charcoal flex items-center gap-2"
            >
              <Filter className="w-4 h-4 text-brand-primary" />
              Filters
            </button>

            {/* Refresh button */}
            <button
              type="button"
              onClick={() => refetch()}
              className="px-3 py-1.5 rounded-xl bg-surface border border-border-warm text-xs font-semibold text-charcoal hover:bg-surface-soft flex items-center gap-1.5 transition-all cursor-pointer"
              title="Refresh job search results"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-brand-primary ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <div className="flex items-center gap-2 bg-surface border border-border-warm rounded-xl px-3 py-1.5 text-xs text-charcoal">
              <ArrowUpDown className="w-3.5 h-3.5 text-charcoal-muted" />
              <select
                value={filters.sort}
                onChange={(e) => setFilters(prev => ({ ...prev, sort: e.target.value, page: 1 }))}
                className="bg-transparent text-charcoal font-medium focus:outline-none cursor-pointer"
              >
                <option value="Most Relevant">Most Relevant</option>
                <option value="Remote First">Remote First</option>
                <option value="Company Name">Company Name</option>
                <option value="Oldest First">Oldest First</option>
              </select>
            </div>

          </div>
        </div>

        {/* Search Input */}
        <SearchInput
          value={filters.role}
          onChange={handleSearchChange}
          size="lg"
          placeholder="Search by role title, technical keyword, or skills (e.g., DevOps, AWS, Senior Architect)..."
          shortcut
        />
      </div>

      {/* Main Split: Filter Sidebar (Left) & Results Grid (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Left Filter Sidebar (Desktop) */}
        <div className="hidden lg:block lg:col-span-1 card-warm p-5 sticky top-20 bg-surface">
          <JobFilterSidebar
            filters={filters}
            onChange={setFilters}
            onReset={handleResetFilters}
            totalCount={totalCount}
          />
        </div>

        {/* Mobile Filter Drawer */}
        {isMobileFilterOpen && (
          <div className="lg:hidden card-warm p-5 bg-surface mb-4">
            <JobFilterSidebar
              filters={filters}
              onChange={setFilters}
              onReset={handleResetFilters}
              totalCount={totalCount}
            />
          </div>
        )}

        {/* Right Job Results Container */}
        <div className="lg:col-span-3 space-y-6">
          {/* Results summary bar */}
          <div className="flex items-center justify-between text-xs text-charcoal-muted pb-1 border-b border-border-warm/60">
            <span>
              Showing <strong className="text-charcoal">{jobs.length}</strong> of{' '}
              <strong className="text-charcoal">{totalCount.toLocaleString()}</strong> positions
            </span>
            <span>Page {currentPage} of {totalPages}</span>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <JobCardSkeleton key={i} />
              ))}
            </div>
          ) : isError ? (
            <ErrorState
              title="Unable to load jobs"
              message={error?.message || 'Could not connect to job indexing engine.'}
              onRetry={() => refetch()}
            />
          ) : jobs.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No matching roles found"
              description="Try broadening your search keywords or resetting some of your active filters."
              actionLabel="Reset Filters"
              onAction={handleResetFilters}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {jobs.map((job) => (
                <JobCard
                  key={job._id || job.id}
                  job={job}
                  userSkills={userSkills}
                />
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-border-warm">
              <Button
                variant="secondary"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => handlePageChange(currentPage - 1)}
                icon={ChevronLeft}
              >
                Previous
              </Button>

              <div className="text-xs text-charcoal-muted">
                Page <strong className="text-charcoal">{currentPage}</strong> of{' '}
                <strong className="text-charcoal">{totalPages}</strong>
              </div>

              <Button
                variant="secondary"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
                icon={ChevronRight}
                iconPosition="right"
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default DiscoverPage;
