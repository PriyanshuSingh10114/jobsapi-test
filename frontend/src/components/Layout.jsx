import { Outlet } from 'react-router-dom';
import { Search } from 'lucide-react';

const SidebarItem = ({ icon: Icon, label }) => (
  <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 text-slate-600 hover:text-primary-600 transition-all cursor-pointer font-medium">
    <Icon size={20} />
    <span>{label}</span>
  </div>
);

const Layout = () => {
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col">
        <div className="p-6 flex items-center gap-3 border-b border-slate-100">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white">
            <Search size={18} />
          </div>
          <span className="text-xl font-bold text-slate-800">JobSearch</span>
        </div>
        
        <nav className="p-4 space-y-2 flex-1">
          <SidebarItem icon={Search} label="Search Jobs" />
        </nav>
        
        <div className="p-4 border-t border-slate-100 text-xs text-slate-400 text-center">
          Job Search Platform v2.0
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <header className="bg-white border-b border-slate-200 p-4 sticky top-0 z-10 flex justify-between items-center md:hidden">
          <div className="flex items-center gap-2">
            <Search size={20} className="text-primary-600" />
            <span className="font-bold text-slate-800">JobSearch</span>
          </div>
        </header>
        
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
