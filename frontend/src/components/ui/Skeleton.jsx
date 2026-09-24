import React from 'react';

export const Skeleton = ({
  className = '',
  variant = 'rectangular',
  ...props
}) => {
  const variants = {
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
    text: 'rounded h-4 my-1',
  };

  return (
    <div
      className={`animate-pulse bg-surface-soft border border-border-warm/40 ${variants[variant] || variants.rectangular} ${className}`}
      {...props}
    />
  );
};

export const JobCardSkeleton = () => {
  return (
    <div className="card-warm p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 w-full">
          <Skeleton className="w-11 h-11 rounded-xl shrink-0" />
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-5 w-3/5" />
            <Skeleton className="h-3.5 w-2/5" />
          </div>
        </div>
        <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Skeleton className="h-6 w-16 rounded-md" />
        <Skeleton className="h-6 w-20 rounded-md" />
        <Skeleton className="h-6 w-14 rounded-md" />
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border-warm/60">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
    </div>
  );
};

export const TableRowSkeleton = () => {
  return (
    <tr className="border-b border-border-warm animate-pulse">
      <td className="py-4 px-4"><Skeleton className="h-4 w-32" /></td>
      <td className="py-4 px-4"><Skeleton className="h-4 w-24" /></td>
      <td className="py-4 px-4"><Skeleton className="h-4 w-20" /></td>
      <td className="py-4 px-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
      <td className="py-4 px-4"><Skeleton className="h-8 w-16 rounded-lg ml-auto" /></td>
    </tr>
  );
};
