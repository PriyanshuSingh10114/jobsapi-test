import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Compass,
  Bookmark,
  Send,
  Sparkles,
  LineChart,
  Cpu,
  Server,
  User,
  Settings,
  Briefcase,
  LayoutDashboard,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

export const Sidebar = ({ className = '', onCloseMobile }) => {
  const navSections = [
    {
      title: 'WORKSPACE',
      items: [
        { name: 'Overview', to: '/', icon: LayoutDashboard },
      ],
    },
    {
      title: 'JOBS',
      items: [
        { name: 'Discover', to: '/discover', icon: Compass },
        { name: 'Saved Jobs', to: '/saved', icon: Bookmark },
      ],
    },
    {
      title: 'APPLICATIONS',
      items: [
        { name: 'Applications', to: '/applications', icon: Send },
        { name: 'Auto Apply', to: '/auto-apply', icon: Sparkles },
      ],
    },
    {
      title: 'INTELLIGENCE',
      items: [
        { name: 'Market Insights', to: '/insights', icon: LineChart },
        { name: 'Skill Trends', to: '/insights/skills', icon: Cpu },
        { name: 'Source Health', to: '/insights/sources', icon: Server },
      ],
    },
    {
      title: 'PROFILE',
      items: [
        { name: 'Candidate Profile', to: '/profile', icon: User },
        { name: 'Settings', to: '/settings', icon: Settings },
      ],
    },
  ];

  return (
    <aside className={`w-64 bg-surface border-r border-border-warm flex flex-col h-full select-none ${className}`}>
      {/* Brand Header */}
      <div className="p-5 border-b border-border-warm flex items-center justify-between">
        <NavLink to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-brand-primary text-white flex items-center justify-center font-serif font-bold text-lg shadow-warm-sm group-hover:scale-102 transition-transform">
            J
          </div>
          <div>
            <div className="font-serif text-lg font-bold tracking-tight text-charcoal flex items-center gap-1.5 leading-none">
              JobsAPI
              <span className="text-[10px] font-sans font-semibold tracking-wider text-brand-primary bg-brand-subtle px-1.5 py-0.5 rounded">
                PRO
              </span>
            </div>
            <div className="text-[11px] text-charcoal-muted mt-0.5">
              Career Workspace
            </div>
          </div>
        </NavLink>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navSections.map((section) => (
          <div key={section.title} className="space-y-1">
            <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-charcoal-muted/80">
              {section.title}
            </div>
            <div className="space-y-0.5 pt-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/' || item.to === '/insights'}
                    onClick={() => onCloseMobile && onCloseMobile()}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors group ${
                        isActive
                          ? 'bg-brand-subtle text-brand-primary font-semibold shadow-2xs'
                          : 'text-charcoal-light hover:text-charcoal hover:bg-surface-soft'
                      }`
                    }
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-105" />
                      <span>{item.name}</span>
                    </div>
                    <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" />
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Readiness Status Card at bottom of sidebar */}
      <div className="p-3 border-t border-border-warm">
        <NavLink
          to="/profile"
          onClick={() => onCloseMobile && onCloseMobile()}
          className="p-3 rounded-xl bg-surface-soft border border-border-warm/70 hover:border-brand-primary/40 block transition-all group"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-charcoal flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-primary" />
              ATS Readiness
            </span>
            <span className="text-[11px] font-bold text-brand-primary">
              Ready
            </span>
          </div>
          <div className="w-full bg-border-warm/60 h-1.5 rounded-full overflow-hidden">
            <div className="bg-brand-primary h-full rounded-full transition-all duration-500" style={{ width: '92%' }} />
          </div>
          <div className="text-[10px] text-charcoal-muted mt-1.5 flex items-center justify-between">
            <span>Knowledge graph</span>
            <span className="group-hover:text-brand-primary font-medium transition-colors">Edit profile →</span>
          </div>
        </NavLink>
      </div>
    </aside>
  );
};
