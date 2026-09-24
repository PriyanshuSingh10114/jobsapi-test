import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Compass, Trash2, ArrowRight } from 'lucide-react';
import { JobCard } from '../components/jobs/JobCard';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';

export const SavedJobsPage = () => {
  const navigate = useNavigate();
  const [savedJobs, setSavedJobs] = useState([]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('jobsapi_saved_jobs') || '[]');
      setSavedJobs(stored);
    } catch {
      setSavedJobs([]);
    }
  }, []);

  const handleRemoveAll = () => {
    localStorage.removeItem('jobsapi_saved_jobs');
    setSavedJobs([]);
  };

  const handleCardSaveToggle = (job, isSaved) => {
    if (!isSaved) {
      setSavedJobs(prev => prev.filter(j => (j._id || j.id) !== (job._id || job.id)));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border-warm">
        <div>
          <h1 className="font-serif text-3xl font-medium tracking-tight text-charcoal">
            Saved Roles
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-muted mt-0.5">
            Keep track of open positions you are evaluating or preparing to submit
          </p>
        </div>

        {savedJobs.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-charcoal-muted">
              {savedJobs.length} {savedJobs.length === 1 ? 'saved role' : 'saved roles'}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRemoveAll}
              icon={Trash2}
            >
              Clear All
            </Button>
          </div>
        )}
      </div>

      {/* Grid or Empty State */}
      {savedJobs.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="No saved jobs yet"
          description="Bookmark roles you are evaluating and they will be conveniently collected here for review and automation."
          actionLabel="Explore Discover Jobs"
          onAction={() => navigate('/discover')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {savedJobs.map((job) => (
            <JobCard
              key={job._id || job.id}
              job={job}
              isSaved={true}
              onSave={handleCardSaveToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
};
export default SavedJobsPage;
