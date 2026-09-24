import React from 'react';
import { Filter, RotateCcw, Check, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';

export const JobFilterSidebar = ({
  filters = {},
  onChange,
  onReset,
  className = '',
  totalCount = 0,
}) => {
  const jobTypes = ['Full-time', 'Part-time', 'Contract', 'Internship'];
  const experienceLevels = ['Entry Level', 'Mid Level', 'Senior', 'Lead / Principal', 'Executive'];
  const popularSources = ['greenhouse', 'lever', 'ashby', 'workday', 'smartrecruiters', 'usajobs'];

  const handleFieldChange = (field, value) => {
    onChange({
      ...filters,
      [field]: value,
      page: 1, // reset to page 1 on filter modification
    });
  };

  const handleToggle = (field, value) => {
    const current = filters[field];
    handleFieldChange(field, current === value ? '' : value);
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== '' && v !== false && v !== undefined && v !== 1);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border-warm">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-brand-primary" />
          <h3 className="text-sm font-semibold text-charcoal tracking-tight">
            Filters
          </h3>
          {totalCount > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-surface-soft border border-border-warm text-charcoal-muted">
              {totalCount.toLocaleString()} roles
            </span>
          )}
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs text-charcoal-muted hover:text-danger flex items-center gap-1 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        )}
      </div>

      {/* Remote toggle */}
      <div className="p-3.5 rounded-xl bg-brand-wash border border-brand-secondary/30 flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-brand-primary flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Remote Roles Only
          </div>
          <p className="text-[11px] text-charcoal-muted mt-0.5">
            Filter for 100% remote positions
          </p>
        </div>
        <button
          type="button"
          onClick={() => handleFieldChange('remote', filters.remote ? '' : 'true')}
          className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
            filters.remote === 'true' || filters.remote === true ? 'bg-brand-primary' : 'bg-border-warm'
          }`}
        >
          <div
            className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-0.5 left-0.5 shadow-xs ${
              filters.remote === 'true' || filters.remote === true ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Experience Level */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-charcoal uppercase tracking-wider text-[10px] text-charcoal-muted">
          Experience Level
        </label>
        <div className="space-y-1">
          {experienceLevels.map((lvl) => {
            const isSelected = filters.experienceLevel === lvl;
            return (
              <button
                key={lvl}
                type="button"
                onClick={() => handleToggle('experienceLevel', lvl)}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-brand-primary text-white font-semibold shadow-2xs'
                    : 'text-charcoal-light hover:bg-surface-soft'
                }`}
              >
                <span>{lvl}</span>
                {isSelected && <Check className="w-3.5 h-3.5" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Job Type */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-charcoal uppercase tracking-wider text-[10px] text-charcoal-muted">
          Employment Type
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {jobTypes.map((type) => {
            const isSelected = filters.jobType === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => handleToggle('jobType', type)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium text-center border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-brand-subtle text-brand-primary border-brand-secondary/40 font-semibold'
                    : 'bg-surface text-charcoal-muted border-border-warm hover:bg-surface-soft hover:text-charcoal'
                }`}
              >
                {type}
              </button>
            );
          })}
        </div>
      </div>

      {/* ATS Source Filter */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-charcoal uppercase tracking-wider text-[10px] text-charcoal-muted">
          ATS Source
        </label>
        <select
          value={filters.source || ''}
          onChange={(e) => handleFieldChange('source', e.target.value)}
          className="w-full text-xs bg-surface border border-border-warm rounded-lg px-2.5 py-2 text-charcoal focus:outline-none focus:ring-1 focus:ring-brand-primary"
        >
          <option value="">All ATS Sources (13+)</option>
          {popularSources.map((src) => (
            <option key={src} value={src}>
              {src.charAt(0).toUpperCase() + src.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Location Filter */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-charcoal uppercase tracking-wider text-[10px] text-charcoal-muted">
          Location
        </label>
        <input
          type="text"
          value={filters.location || ''}
          onChange={(e) => handleFieldChange('location', e.target.value)}
          placeholder="e.g. San Francisco, Remote, Austin"
          className="w-full text-xs bg-surface border border-border-warm rounded-lg px-2.5 py-2 text-charcoal placeholder:text-charcoal-muted/60 focus:outline-none focus:ring-1 focus:ring-brand-primary"
        />
      </div>
    </div>
  );
};
