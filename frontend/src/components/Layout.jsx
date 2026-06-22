import { Outlet } from 'react-router-dom';
import { Search } from 'lucide-react';

const Layout = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200 p-4 sticky top-0 z-50 flex justify-between items-center px-6 md:px-12">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white">
            <Search size={18} />
          </div>
          <span className="text-xl font-bold text-slate-800">JobSearch</span>
        </div>
        
        <div className="text-sm font-medium text-slate-500 hidden md:block">
          US-First Job Platform
        </div>
      </header>
      
      {/* Main Content */}
      <main className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
