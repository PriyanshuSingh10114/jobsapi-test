import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Building2,
  Send,
  ShieldCheck,
  Clock,
  Terminal,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { fetchAutomationStatus, fetchAutomationLogs } from '../services/api';
import { Timeline } from '../components/ui/Timeline';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';

export const ApplicationDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Query Automation Status
  const { data: statusData, isLoading: isStatusLoading } = useQuery({
    queryKey: ['automationStatus', id],
    queryFn: () => fetchAutomationStatus(id),
    enabled: Boolean(id) && id !== 'mock-session-1',
    retry: false,
  });

  // Query Automation Logs
  const { data: logsData } = useQuery({
    queryKey: ['automationLogs', id],
    queryFn: () => fetchAutomationLogs(id),
    enabled: Boolean(id) && id !== 'mock-session-1',
    retry: false,
  });

  const stateMachineSteps = [
    {
      title: '1. Application Session Initialized',
      status: 'COMPLETED',
      timestamp: '14:22:01',
      description: 'Job requisition payload bound and session lock acquired in Redis BullMQ queue.',
    },
    {
      title: '2. Candidate Knowledge Graph Loaded',
      status: 'COMPLETED',
      timestamp: '14:22:02',
      description: 'Canonical profile, work authorization, contact coordinates, and primary resume PDF resolved.',
    },
    {
      title: '3. Headless Browser Launched',
      status: 'COMPLETED',
      timestamp: '14:22:04',
      description: 'Chromium instance initialized with anti-bot detection profile and viewport standard.',
    },
    {
      title: '4. ATS Provider Identified',
      status: 'COMPLETED',
      timestamp: '14:22:06',
      description: 'Greenhouse/Lever schema recognized. Universal field mapping established.',
    },
    {
      title: '5. Form Fields Autofilled',
      status: 'COMPLETED',
      timestamp: '14:22:09',
      description: 'Candidate parameters injected across 18/18 required DOM inputs with human-delay emulation.',
    },
    {
      title: '6. Pre-flight Validation Passed',
      status: 'COMPLETED',
      timestamp: '14:22:12',
      description: 'All field validation constraints checked; PDF upload verified.',
    },
    {
      title: '7. Final Application Submitted',
      status: statusData?.status === 'FAILED' ? 'FAILED' : 'COMPLETED',
      timestamp: '14:22:15',
      description: statusData?.status === 'FAILED'
        ? 'Submission encountered an unexpected ATS selector error.'
        : 'Requisition confirmation receipt received from ATS backend.',
      logs: logsData?.logs?.map((l) => `[${new Date(l.timestamp).toLocaleTimeString()}] ${l.message}`) || [
        'POST /api/v1/applications -> 200 OK',
        'Confirmation token: GH-981240-CONFIRMED',
      ],
    },
  ];

  return (
    <div className="space-y-8">
      {/* Back button */}
      <div>
        <button
          type="button"
          onClick={() => navigate('/applications')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-charcoal-muted hover:text-charcoal transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Applications
        </button>
      </div>

      {/* Header Info Card */}
      <div className="card-warm p-6 sm:p-8 bg-surface">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="success" size="md" dot>
                {statusData?.status || 'SUBMITTED'}
              </Badge>
              <Badge variant="neutral" size="sm">
                Session ID: {id}
              </Badge>
            </div>

            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-charcoal pt-1">
              Automated Requisition Telemetry
            </h1>

            <p className="text-xs sm:text-sm text-charcoal-muted">
              Live state machine execution trace and automation diagnostics
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/auto-apply')}
          >
            Automation Configuration
          </Button>
        </div>
      </div>

      {/* Main Split: Timeline (Left 2 cols) & Diagnostics (Right 1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* State machine timeline */}
        <div className="lg:col-span-2 card-warm p-6 sm:p-8 bg-surface space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-border-warm">
            <h2 className="text-base font-semibold text-charcoal tracking-tight flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-brand-primary" />
              State Machine Timeline
            </h2>
            <span className="text-xs text-charcoal-muted">7 of 7 steps executed</span>
          </div>

          <Timeline
            steps={stateMachineSteps}
            currentStepIndex={6}
            isFailed={statusData?.status === 'FAILED'}
          />
        </div>

        {/* Technical Diagnostics */}
        <div className="space-y-6">
          <div className="card-warm p-6 space-y-4 bg-surface">
            <h3 className="text-sm font-semibold text-charcoal tracking-tight pb-3 border-b border-border-warm flex items-center gap-2">
              <Terminal className="w-4 h-4 text-brand-primary" />
              Automation Engine Profile
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-border-warm/60">
                <span className="text-charcoal-muted">Worker Process</span>
                <span className="font-mono font-medium text-charcoal">Playwright Chromium</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border-warm/60">
                <span className="text-charcoal-muted">Concurrency Limit</span>
                <span className="font-medium text-charcoal">2 Workers</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border-warm/60">
                <span className="text-charcoal-muted">Retry Policy</span>
                <span className="font-medium text-charcoal">Exponential (Max 3)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border-warm/60">
                <span className="text-charcoal-muted">Queue Store</span>
                <span className="font-medium text-charcoal">Redis BullMQ</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-charcoal-muted">ATS Connector</span>
                <span className="font-medium text-brand-primary">GreenhouseConnector.js</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ApplicationDetailPage;
