import React from 'react';
import { Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { Badge } from './Badge';

export const MatchScore = ({
  score = null,
  matchedSkills = [],
  missingSkills = [],
  size = 'md',
  showBreakdown = false,
  className = '',
}) => {
  // If no explicit score provided, compute honest heuristic if skills exist
  let displayScore = score;
  let hasRealScore = typeof score === 'number' && score > 0;

  if (displayScore === null && (matchedSkills.length > 0 || missingSkills.length > 0)) {
    const total = matchedSkills.length + missingSkills.length;
    if (total > 0) {
      displayScore = Math.round((matchedSkills.length / total) * 100);
      hasRealScore = true;
    }
  }

  const getVariant = (val) => {
    if (val >= 85) return { badge: 'success', text: 'text-success', bg: 'bg-success-bg', border: 'border-success/30' };
    if (val >= 60) return { badge: 'brand', text: 'text-brand-primary', bg: 'bg-brand-subtle', border: 'border-brand-secondary/30' };
    return { badge: 'warning', text: 'text-warning', bg: 'bg-warning-bg', border: 'border-warning/30' };
  };

  const style = hasRealScore ? getVariant(displayScore) : { badge: 'neutral', text: 'text-charcoal-muted', bg: 'bg-surface-soft', border: 'border-border-warm' };

  return (
    <div className={`inline-flex flex-col gap-1.5 ${className}`}>
      <Badge variant={style.badge} size={size} className="font-semibold tracking-tight">
        <Sparkles className="w-3 h-3 shrink-0" />
        {hasRealScore ? `${displayScore}% Match` : 'Alignment pending'}
      </Badge>

      {showBreakdown && (matchedSkills.length > 0 || missingSkills.length > 0) && (
        <div className="text-xs space-y-1 mt-1 p-2.5 rounded-lg bg-surface-soft border border-border-warm/60">
          {matchedSkills.length > 0 && (
            <div className="flex items-center gap-1.5 text-success">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span className="font-medium">{matchedSkills.length} Matching skills</span>
            </div>
          )}
          {missingSkills.length > 0 && (
            <div className="flex items-center gap-1.5 text-charcoal-muted">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{missingSkills.length} Skills to acquire</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
