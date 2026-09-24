import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Compass, Bookmark, Send, Sparkles, LineChart, Cpu, User, Settings, ArrowRight, X } from 'lucide-react';

export const CommandPalette = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onClose(!isOpen);
      }
      if (e.key === 'Escape' && isOpen) {
        onClose(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const navigationCommands = [
    { label: 'Discover Jobs', description: 'Search and filter active roles', path: '/discover', icon: Compass },
    { label: 'Saved Jobs', description: 'View bookmarked job listings', path: '/saved', icon: Bookmark },
    { label: 'Applications', description: 'Track in-flight applications', path: '/applications', icon: Send },
    { label: 'Auto Apply Workspace', description: 'Configure automated submissions', path: '/auto-apply', icon: Sparkles },
    { label: 'Market Insights', description: 'Job market and compensation analytics', path: '/insights', icon: LineChart },
    { label: 'Skill Trends', description: 'Analyze high-demand technologies', path: '/insights/skills', icon: Cpu },
    { label: 'Candidate Profile & Resume', description: 'Edit your knowledge graph and upload resume', path: '/profile', icon: User },
    { label: 'Settings', description: 'Workspace preferences and API settings', path: '/settings', icon: Settings },
  ];

  const filteredCommands = navigationCommands.filter((cmd) =>
    cmd.label.toLowerCase().includes(query.toLowerCase()) ||
    cmd.description.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (path) => {
    navigate(path);
    onClose(false);
    setQuery('');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/discover?role=${encodeURIComponent(query.trim())}`);
      onClose(false);
      setQuery('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl bg-surface border border-border-warm rounded-2xl shadow-warm-lg overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search header */}
        <form onSubmit={handleSearchSubmit} className="relative flex items-center px-4 py-3.5 border-b border-border-warm">
          <Search className="w-5 h-5 text-charcoal-muted mr-3 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search roles, jump to pages, or execute actions..."
            className="w-full bg-transparent text-charcoal placeholder:text-charcoal-muted/60 text-sm focus:outline-none"
            autoFocus
          />
          <button
            type="button"
            onClick={() => onClose(false)}
            className="p-1 text-charcoal-muted hover:text-charcoal rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </form>

        {/* Command list */}
        <div className="p-2 overflow-y-auto space-y-1">
          {query.trim() && (
            <button
              onClick={handleSearchSubmit}
              className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-surface-soft flex items-center justify-between group transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-brand-subtle text-brand-primary">
                  <Search className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-medium text-charcoal">
                    Search for "{query}" in Discover
                  </div>
                  <div className="text-xs text-charcoal-muted">
                    Press Enter to find matching live jobs
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-charcoal-muted group-hover:text-charcoal group-hover:translate-x-0.5 transition-all" />
            </button>
          )}

          <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-charcoal-muted">
            Navigation & Workspace
          </div>

          {filteredCommands.length > 0 ? (
            filteredCommands.map((cmd) => {
              const Icon = cmd.icon;
              return (
                <button
                  key={cmd.path}
                  onClick={() => handleSelect(cmd.path)}
                  className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-surface-soft flex items-center justify-between group transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-surface-soft text-charcoal-muted group-hover:text-brand-primary group-hover:bg-brand-subtle transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-charcoal">
                        {cmd.label}
                      </div>
                      <div className="text-xs text-charcoal-muted">
                        {cmd.description}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-charcoal-muted/50 group-hover:text-charcoal group-hover:translate-x-0.5 transition-all" />
                </button>
              );
            })
          ) : (
            <div className="py-6 text-center text-xs text-charcoal-muted">
              No matching pages found for "{query}".
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-surface-soft border-t border-border-warm flex items-center justify-between text-[11px] text-charcoal-muted">
          <span>Use <strong>↑</strong> <strong>↓</strong> to navigate</span>
          <span><strong>ESC</strong> to close</span>
        </div>
      </div>
    </div>
  );
};
