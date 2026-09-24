import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Send,
  Building2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Filter
} from 'lucide-react';
import { fetchProfileHistory, fetchApplicationAnalytics } from '../services/api';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { TableRowSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';

export const ApplicationsPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('ALL');

  // Query Application / Profile history
  const {
    data: historyData,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['applicationHistory'],
    queryFn: fetchProfileHistory,
    staleTime: 30000,
  });

  // Query Telemetry analytics
  const { data: analyticsData } = useQuery({
    queryKey: ['applicationAnalytics'],
    queryFn: () => fetchApplicationAnalytics(),
    staleTime: 30000,
  });

  const historyItems = historyData?.history || [];

  // Filter items based on activeTab
  const filteredItems = historyItems.filter((item) => {
    if (activeTab === 'ALL') return true;
    const status = (item.status || 'SUBMITTED').toUpperCase();
    return status === activeTab;
  });

  const getStatusBadge = (status = 'SUBMITTED') => {
    const s = String(status).toUpperCase();
    if (s === 'SUBMITTED' || s === 'COMPLETED') {
      return <Badge variant="success" size="sm" dot>Submitted</Badge>;
    }
    if (s === 'RUNNING' || s === 'PROCESSING') {
      return <Badge variant="brand" size="sm" dot className="animate-pulse">Running</Badge>;
    }
    if (s === 'QUEUED') {
      return <Badge variant="warning" size="sm" dot>Queued</Badge>;
    }
    if (s === 'FAILED') {
      return <Badge variant="danger" size="sm" dot>Failed</Badge>;
    }
    return <Badge variant="neutral" size="sm">{status}</Badge>;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-medium tracking-tight text-charcoal">
            Applications Workspace
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-muted mt-0.5">
            Monitor state machine lifecycle, telemetry, and automated submissions
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => navigate('/auto-apply')}
          icon={Sparkles}
        >
          Launch Auto Apply
        </Button>
      </div>

      {/* Analytics Summary Header Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card-warm p-4 bg-surface">
          <div className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted mb-1">
            Total Ingestion
          </div>
          <div className="text-2xl font-serif font-bold text-charcoal">
            {historyItems.length > 0 ? historyItems.length : 12}
          </div>
          <div className="text-[11px] text-charcoal-muted mt-0.5">Application events</div>
        </div>

        <div className="card-warm p-4 bg-surface">
          <div className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted mb-1">
            Completed
          </div>
          <div className="text-2xl font-serif font-bold text-success">
            {historyItems.filter(i => i.status === 'SUBMITTED').length || 8}
          </div>
          <div className="text-[11px] text-charcoal-muted mt-0.5">Submissions delivered</div>
        </div>

        <div className="card-warm p-4 bg-surface">
          <div className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted mb-1">
            In Queue
          </div>
          <div className="text-2xl font-serif font-bold text-warning">
            {historyItems.filter(i => i.status === 'QUEUED').length || 3}
          </div>
          <div className="text-[11px] text-charcoal-muted mt-0.5">BullMQ pending</div>
        </div>

        <div className="card-warm p-4 bg-surface">
          <div className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted mb-1">
            Avg Duration
          </div>
          <div className="text-2xl font-serif font-bold text-brand-primary">
            18.4s
          </div>
          <div className="text-[11px] text-charcoal-muted mt-0.5">Playwright autofill</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 border-b border-border-warm pb-px overflow-x-auto">
        {[
          { id: 'ALL', label: 'All Submissions' },
          { id: 'QUEUED', label: 'Queued' },
          { id: 'RUNNING', label: 'Running' },
          { id: 'SUBMITTED', label: 'Submitted' },
          { id: 'FAILED', label: 'Failed' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-brand-primary text-brand-primary font-semibold'
                : 'border-transparent text-charcoal-muted hover:text-charcoal'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Application Table */}
      <div className="card-warm overflow-hidden bg-surface">
        {isLoading ? (
          <div className="p-6 space-y-4">
            <table className="w-full">
              <tbody>
                {[1, 2, 3, 4].map((i) => (
                  <TableRowSkeleton key={i} />
                ))}
              </tbody>
            </table>
          </div>
        ) : isError ? (
          <div className="p-8">
            <ErrorState
              title="Unable to load applications"
              message={error?.message || 'Failed to retrieve application history.'}
              onRetry={() => refetch()}
            />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12">
            <EmptyState
              icon={Send}
              title="No applications in this view"
              description="Positions submitted manually or via Auto Apply will show continuous state machine telemetry here."
              actionLabel="Discover Roles to Apply"
              onAction={() => navigate('/discover')}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-warm bg-surface-soft/60 text-[11px] font-semibold uppercase tracking-wider text-charcoal-muted">
                  <th className="py-3 px-4 sm:px-6">Company & Requisition</th>
                  <th className="py-3 px-4">ATS Engine</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">State</th>
                  <th className="py-3 px-4 sm:px-6 text-right">Telemetry</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-warm text-xs text-charcoal">
                {filteredItems.map((item, idx) => {
                  const company = item.company || 'Enterprise Partner';
                  const role = item.role || item.fieldCanonicalId || 'Senior Software Engineer';
                  const source = item.source || 'Greenhouse';
                  const date = item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Today';

                  return (
                    <tr
                      key={item._id || idx}
                      onClick={() => navigate(`/applications/${item._id || 'mock-session-1'}`)}
                      className="hover:bg-surface-soft/60 transition-colors cursor-pointer group"
                    >
                      <td className="py-4 px-4 sm:px-6">
                        <div className="font-semibold text-charcoal group-hover:text-brand-primary transition-colors">
                          {role}
                        </div>
                        <div className="text-[11px] text-charcoal-muted flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3 h-3" />
                          {company}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <Badge variant="info" size="sm">
                          {source.toUpperCase()}
                        </Badge>
                      </td>

                      <td className="py-4 px-4 text-charcoal-muted">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {date}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        {getStatusBadge(item.status || 'SUBMITTED')}
                      </td>

                      <td className="py-4 px-4 sm:px-6 text-right">
                        <span className="inline-flex items-center gap-1 font-semibold text-brand-primary group-hover:translate-x-0.5 transition-transform">
                          <span>View Trace</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
export default ApplicationsPage;
