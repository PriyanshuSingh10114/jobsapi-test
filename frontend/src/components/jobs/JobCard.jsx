import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  MapPin,
  Clock,
  Bookmark,
  Sparkles,
  ArrowRight,
  DollarSign,
  Briefcase
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { MatchScore } from '../ui/MatchScore';
import { extractSkillList } from '../../utils/skills';

export const JobCard = ({
  job,
  onSave,
  isSaved = false,
  onAutoApply,
  userSkills = [],
}) => {
  const navigate = useNavigate();
  const [isSavedInternal, setIsSavedInternal] = useState(isSaved);

  if (!job) return null;

  const {
    _id,
    id,
    title = 'Software Engineer',
    company = 'Innovative Tech',
    location = 'Remote',
    remote = false,
    salary = null,
    jobType = 'Full-time',
    experienceLevel = '',
    skills = [],
    postedAt,
    source = '',
    relevanceScore = null
  } = job;

  const jobId = _id || id;

  // Format posted time
  const getRelativeTime = (dateStr) => {
    if (!dateStr) return 'Recently posted';
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours < 1) return 'Just now';
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return 'Yesterday';
      return `${diffDays}d ago`;
    } catch {
      return 'Recently posted';
    }
  };

  // Format Salary
  const formatSalary = (sal) => {
    if (!sal) return null;
    if (typeof sal === 'string') return sal;
    if (sal.min && sal.max) {
      const minK = Math.round(sal.min / 1000);
      const maxK = Math.round(sal.max / 1000);
      return `$${minK}k – $${maxK}k`;
    }
    if (sal.min) return `From $${Math.round(sal.min / 1000)}k`;
    return null;
  };

  const salaryDisplay = formatSalary(salary);

  // Skill alignment safely normalized
  const extractedUserSkills = extractSkillList(userSkills);
  const normalizedUserSkills = extractedUserSkills.map(s => s.toLowerCase());
  const jobSkills = extractSkillList(skills);
  const matchedSkills = jobSkills.filter(s => normalizedUserSkills.includes(s.toLowerCase()));
  const missingSkills = jobSkills.filter(s => !normalizedUserSkills.includes(s.toLowerCase()));


  const handleToggleSave = (e) => {
    e.stopPropagation();
    const nextState = !isSavedInternal;
    setIsSavedInternal(nextState);

    // Save to local storage for persistence
    try {
      const savedList = JSON.parse(localStorage.getItem('jobsapi_saved_jobs') || '[]');
      if (nextState) {
        if (!savedList.some(item => (item._id || item.id) === jobId)) {
          savedList.push(job);
        }
      } else {
        const filtered = savedList.filter(item => (item._id || item.id) !== jobId);
        localStorage.setItem('jobsapi_saved_jobs', JSON.stringify(filtered));
        if (onSave) onSave(job, false);
        return;
      }
      localStorage.setItem('jobsapi_saved_jobs', JSON.stringify(savedList));
      if (onSave) onSave(job, nextState);
    } catch {
      if (onSave) onSave(job, nextState);
    }
  };

  const handleCardClick = () => {
    navigate(`/jobs/${jobId}`);
  };

  // Generate clean company monogram
  const companyInitial = company ? company.charAt(0).toUpperCase() : 'C';

  return (
    <div
      onClick={handleCardClick}
      className="card-warm p-5 sm:p-6 group flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-warm-md cursor-pointer relative"
    >
      {/* Top row: Company avatar, title, and save button */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-surface-soft border border-border-warm flex items-center justify-center font-bold text-base text-brand-primary shrink-0 group-hover:border-brand-primary/40 transition-colors shadow-2xs">
              {companyInitial}
            </div>

            <div>
              <h3 className="text-base font-semibold text-charcoal group-hover:text-brand-primary transition-colors tracking-tight line-clamp-1">
                {title}
              </h3>
              <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-charcoal-muted">
                <span className="font-medium text-charcoal-light flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-charcoal-muted" />
                  {company}
                </span>
                <span className="text-border-warm">•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-charcoal-muted" />
                  {location || 'United States'}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleToggleSave}
            className={`p-2 rounded-xl transition-all ${
              isSavedInternal
                ? 'bg-brand-subtle text-brand-primary border border-brand-secondary/40'
                : 'text-charcoal-muted hover:text-charcoal hover:bg-surface-soft border border-transparent'
            }`}
            title={isSavedInternal ? 'Remove from saved' : 'Save role'}
            aria-label="Bookmark job"
          >
            <Bookmark className={`w-4 h-4 ${isSavedInternal ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Badges: Remote, Job Type, Source, Salary */}
        <div className="flex flex-wrap items-center gap-1.5 mt-3.5">
          {remote && (
            <Badge variant="brand" size="sm" dot>
              Remote
            </Badge>
          )}
          {jobType && (
            <Badge variant="neutral" size="sm">
              {jobType}
            </Badge>
          )}
          {experienceLevel && (
            <Badge variant="neutral" size="sm">
              {experienceLevel}
            </Badge>
          )}
          {source && (
            <Badge variant="info" size="sm">
              {source.toUpperCase()}
            </Badge>
          )}
          {salaryDisplay && (
            <Badge variant="neutral" size="sm" className="font-semibold text-charcoal">
              <DollarSign className="w-3 h-3 -mr-1" />
              {salaryDisplay}
            </Badge>
          )}
        </div>

        {/* Relevant Skills Pill List */}
        {jobSkills.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mt-3">
            {jobSkills.slice(0, 5).map((skill) => {
              const isMatch = normalizedUserSkills.includes(skill.toLowerCase());
              return (
                <span
                  key={skill}
                  className={`text-[11px] px-2 py-0.5 rounded-md font-medium transition-colors ${
                    isMatch
                      ? 'bg-success-bg text-success border border-success/30 font-semibold'
                      : 'bg-surface-soft text-charcoal-muted border border-border-warm/60'
                  }`}
                >
                  {skill}
                </span>
              );
            })}
            {jobSkills.length > 5 && (
              <span className="text-[11px] text-charcoal-muted px-1.5 py-0.5">
                +{jobSkills.length - 5} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer info: Posted time, Match score, CTA button */}
      <div className="flex items-center justify-between pt-4 mt-4 border-t border-border-warm/70">
        <div className="flex items-center gap-2 text-xs text-charcoal-muted">
          <Clock className="w-3.5 h-3.5" />
          <span>{getRelativeTime(postedAt)}</span>
        </div>

        <div className="flex items-center gap-2">
          {normalizedUserSkills.length > 0 && (
            <MatchScore
              score={relevanceScore}
              matchedSkills={matchedSkills}
              missingSkills={missingSkills}
              size="sm"
            />
          )}

          <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-primary group-hover:translate-x-0.5 transition-transform">
            View Job
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </div>
  );
};
