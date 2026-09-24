import React from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, Search, Bell, Sparkles } from 'lucide-react';
import { ThemeToggle } from '../ui/ThemeToggle';

export const TopBar = ({ onOpenMobileMenu, onOpenCommandPalette }) => {
  return (
    <header className="h-16 bg-surface/80 backdrop-blur-md border-b border-border-warm sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between gap-4">
      {/* Mobile Menu trigger & quick title */}
      <div className="flex items-center gap-3 md:hidden">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="p-2 rounded-lg text-charcoal hover:bg-surface-soft border border-border-warm"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="font-serif font-bold text-lg text-charcoal tracking-tight">
          JobsAPI
        </span>
      </div>

      {/* Global Search Button (acts as Command Palette trigger) */}
      <div className="flex-1 max-w-xl hidden md:block">
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="w-full bg-surface-soft/80 hover:bg-surface-soft border border-border-warm rounded-xl px-3.5 py-2 text-xs text-charcoal-muted flex items-center justify-between transition-all group cursor-pointer shadow-2xs hover:border-brand-secondary/40"
        >
          <div className="flex items-center gap-2.5">
            <Search className="w-4 h-4 text-charcoal-muted group-hover:text-charcoal transition-colors" />
            <span className="text-charcoal-muted/80 group-hover:text-charcoal transition-colors">
              Search jobs, companies, skills, or run command...
            </span>
          </div>
          <div className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium text-charcoal-muted bg-surface border border-border-warm rounded">
            <span>⌘</span>
            <span>K</span>
          </div>
        </button>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2.5">
        {/* Mobile search button */}
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="md:hidden p-2 rounded-lg text-charcoal-muted hover:text-charcoal hover:bg-surface-soft border border-border-warm"
          aria-label="Search"
        >
          <Search className="w-4 h-4" />
        </button>

        <ThemeToggle />

        {/* Quick AutoApply CTA */}
        <NavLink
          to="/auto-apply"
          className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-brand-subtle text-brand-primary border border-brand-secondary/30 hover:bg-brand-primary hover:text-white transition-all shadow-2xs"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Auto Apply</span>
        </NavLink>

        {/* Candidate Avatar & Profile link */}
        <NavLink
          to="/profile"
          className="flex items-center gap-2.5 pl-2 pr-1.5 py-1 rounded-xl hover:bg-surface-soft transition-colors"
          title="Candidate Profile"
        >
          <div className="w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center text-xs font-semibold border border-brand-secondary/30 shadow-warm-sm">
            CP
          </div>
        </NavLink>
      </div>
    </header>
  );
};
