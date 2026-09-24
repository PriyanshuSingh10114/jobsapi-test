import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Compass, Bookmark, Send, User } from 'lucide-react';

export const MobileNav = () => {
  const items = [
    { name: 'Overview', to: '/', icon: LayoutDashboard },
    { name: 'Discover', to: '/discover', icon: Compass },
    { name: 'Saved', to: '/saved', icon: Bookmark },
    { name: 'Applications', to: '/applications', icon: Send },
    { name: 'Profile', to: '/profile', icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-surface/95 backdrop-blur-md border-t border-border-warm flex items-center justify-around py-2 px-1 safe-area-pb">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 px-3 rounded-lg text-[10px] font-medium transition-colors ${
                isActive
                  ? 'text-brand-primary font-semibold'
                  : 'text-charcoal-muted hover:text-charcoal'
              }`
            }
          >
            <Icon className="w-5 h-5 mb-0.5" />
            <span>{item.name}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};
