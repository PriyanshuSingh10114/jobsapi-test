import { Outlet, NavLink } from 'react-router-dom';
import { Search, LayoutDashboard, User } from 'lucide-react';

const Layout = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200 p-4 sticky top-0 z-50 flex justify-between items-center px-6 md:px-12">
        <NavLink to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white">
            <Search size={18} />
          </div>
          <span className="text-xl font-bold text-slate-800">JobSearch</span>
        </NavLink>
        
        <div className="flex items-center gap-6 text-sm font-medium">
          <NavLink 
            to="/dashboard" 
            className={({ isActive }) => `flex items-center gap-2 ${isActive ? 'text-primary-600' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <LayoutDashboard size={18} /> Dashboard
          </NavLink>
          <NavLink 
            to="/profile" 
            className={({ isActive }) => `flex items-center gap-2 ${isActive ? 'text-primary-600' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <User size={18} /> Profile Studio
          </NavLink>
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
