import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { MobileNav } from './MobileNav';
import { CommandPalette } from '../ui/CommandPalette';
import { X } from 'lucide-react';

export const AppShell = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-canvas text-charcoal selection:bg-brand-secondary/20 selection:text-brand-primary">
      {/* Desktop Fixed Sidebar */}
      <div className="hidden md:flex shrink-0 w-64 fixed inset-y-0 left-0 z-40">
        <Sidebar />
      </div>

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-surface shadow-warm-lg">
            <div className="absolute top-4 right-4 z-10">
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 text-charcoal-muted hover:text-charcoal rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <Sidebar onCloseMobile={() => setIsMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:pl-64 min-w-0 pb-16 md:pb-0">
        <TopBar
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        />

        <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav />

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={setIsCommandPaletteOpen}
      />
    </div>
  );
};
export default AppShell;
