import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Cpu,
  ArrowLeft,
  TrendingUp,
  Sparkles,
  BarChart2
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';

export const SkillTrendsPage = () => {
  const navigate = useNavigate();

  const skillData = [
    { skill: 'AWS', count: 1240, growth: '+28%', primaryRole: 'Cloud & DevOps' },
    { skill: 'Kubernetes', count: 834, growth: '+34%', primaryRole: 'Platform / SRE' },
    { skill: 'Terraform', count: 710, growth: '+22%', primaryRole: 'Infrastructure' },
    { skill: 'Docker', count: 692, growth: '+15%', primaryRole: 'Containerization' },
    { skill: 'Python', count: 654, growth: '+19%', primaryRole: 'Backend / AI' },
    { skill: 'TypeScript', count: 580, growth: '+41%', primaryRole: 'Full Stack' },
    { skill: 'React', count: 520, growth: '+12%', primaryRole: 'Frontend' },
    { skill: 'Go (Golang)', count: 440, growth: '+38%', primaryRole: 'Distributed Systems' },
    { skill: 'PostgreSQL', count: 395, growth: '+18%', primaryRole: 'Data Engineering' },
  ];

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Back button */}
      <div>
        <button
          type="button"
          onClick={() => navigate('/insights')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-charcoal-muted hover:text-charcoal transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Market Insights
        </button>
      </div>

      {/* Header */}
      <div className="space-y-1 pb-4 border-b border-border-warm">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-subtle text-brand-primary text-xs font-semibold">
          <Cpu className="w-3.5 h-3.5" />
          <span>Technical Demand Analytics</span>
        </div>
        <h1 className="font-serif text-3xl font-medium tracking-tight text-charcoal">
          Skill & Technology Trends
        </h1>
        <p className="text-xs sm:text-sm text-charcoal-muted">
          Frequency and market momentum across 17,000+ indexed developer & infrastructure roles
        </p>
      </div>

      {/* Chart Card */}
      <div className="card-warm p-6 sm:p-8 bg-surface space-y-6">
        <h2 className="text-base font-semibold text-charcoal tracking-tight">
          Top Skills by Active Requisition Count
        </h2>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={skillData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
              <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--charcoal-muted)' }} axisLine={{ stroke: 'var(--border-warm)' }} />
              <YAxis dataKey="skill" type="category" tick={{ fontSize: 12, fill: 'var(--charcoal)' }} axisLine={{ stroke: 'var(--border-warm)' }} />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border-warm)', color: 'var(--charcoal)', borderRadius: '8px', fontSize: '12px' }}
                itemStyle={{ color: 'var(--charcoal)' }}
                labelStyle={{ color: 'var(--charcoal)' }}
                cursor={{ fill: 'rgba(126, 152, 127, 0.1)' }}
              />
              <Bar dataKey="count" fill="var(--brand-primary)" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>


      {/* Detailed Skill Table */}
      <div className="card-warm overflow-hidden bg-surface">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border-warm bg-surface-soft/60 text-[11px] font-semibold uppercase tracking-wider text-charcoal-muted">
              <th className="py-3 px-4 sm:px-6">Technology / Skill</th>
              <th className="py-3 px-4">Active Postings</th>
              <th className="py-3 px-4">30-Day Growth</th>
              <th className="py-3 px-4 sm:px-6">Primary Role Focus</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-warm text-xs text-charcoal">
            {skillData.map((item) => (
              <tr key={item.skill} className="hover:bg-surface-soft/60 transition-colors">
                <td className="py-4 px-4 sm:px-6 font-semibold text-charcoal flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-brand-primary" />
                  {item.skill}
                </td>
                <td className="py-4 px-4 font-mono font-medium">
                  {item.count.toLocaleString()} roles
                </td>
                <td className="py-4 px-4 text-success font-semibold">
                  {item.growth}
                </td>
                <td className="py-4 px-4 sm:px-6 text-charcoal-muted">
                  <Badge variant="neutral" size="sm">
                    {item.primaryRole}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default SkillTrendsPage;
