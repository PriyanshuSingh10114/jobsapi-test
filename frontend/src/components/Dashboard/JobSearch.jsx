import { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Briefcase, Filter, Building, Calendar, Award, Database, Globe } from 'lucide-react';
import { getSuggestions } from '../../services/api';

const QUICK_ROLES = [
  'Software Engineer', 'Frontend Engineer', 'Backend Engineer',
  'Full Stack Engineer', 'Data Scientist', 'ML Engineer',
  'DevOps Engineer', 'Product Manager'
];

const SOURCES = ['Arbeitnow', 'Remotive', 'Greenhouse', 'Lever', 'Ashby', 'USAJobs', 'TheMuse', 'Workday', 'Teamtailor', 'Jobvite', 'BambooHR'];

const JobSearch = ({ onSearch, isSearching }) => {
  const [filters, setFilters] = useState(() => {
    const saved = localStorage.getItem('jobFilters');
    if (saved) return JSON.parse(saved);
    return {
      role: '',
      location: 'United States',
      company: '',
      jobType: '',
      experienceLevel: '',
      jobRegion: 'All Jobs',
      remote: false,
      source: '',
      datePosted: ''
    };
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('jobFilters', JSON.stringify(filters));
  }, [filters]);

  const handleChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleRoleChange = (e) => {
    const val = e.target.value;
    handleChange('role', val);
    
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    if (val.length >= 2) {
      timeoutRef.current = setTimeout(async () => {
        try {
          const sugs = await getSuggestions(val);
          setSuggestions(sugs);
          setShowSuggestions(true);
        } catch (error) {
          console.error(error);
        }
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (sug) => {
    handleChange('role', sug);
    setShowSuggestions(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowSuggestions(false);
    onSearch(filters);
  };

  const applyQuickRole = (role) => {
    handleChange('role', role);
    onSearch({ ...filters, role });
  };

  return (
    <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          {/* Role Input with Autocomplete */}
          <div className="flex-1 w-full relative">
            <label className="block text-sm font-medium text-slate-700 mb-1">What</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                value={filters.role}
                onChange={handleRoleChange}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="Job title, keywords, or company"
                className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-slate-900 bg-slate-50 focus:bg-white transition-colors outline-none"
              />
            </div>
            {showSuggestions && suggestions.length > 0 && (
              <ul className="absolute z-10 w-full bg-white border border-slate-200 rounded-xl mt-1 shadow-lg max-h-60 overflow-y-auto">
                {suggestions.map((sug, idx) => (
                  <li 
                    key={idx} 
                    className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-slate-700"
                    onMouseDown={() => selectSuggestion(sug)}
                  >
                    {sug}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Location Input */}
          <div className="flex-1 w-full relative">
            <label className="block text-sm font-medium text-slate-700 mb-1">Where</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                value={filters.location}
                onChange={(e) => handleChange('location', e.target.value)}
                placeholder="City, state, or country"
                className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-slate-900 bg-slate-50 focus:bg-white transition-colors outline-none"
              />
            </div>
          </div>

          {/* Job Type Dropdown */}
          <div className="w-full md:w-48">
            <label className="block text-sm font-medium text-slate-700 mb-1">Job Type</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Briefcase className="h-5 w-5 text-slate-400" />
              </div>
              <select
                value={filters.jobType}
                onChange={(e) => handleChange('jobType', e.target.value)}
                className="block w-full pl-10 pr-8 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-slate-900 bg-slate-50 focus:bg-white transition-colors outline-none appearance-none"
              >
                <option value="">Any Type</option>
                <option value="Full Time">Full-Time</option>
                <option value="Part Time">Part-Time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSearching}
            className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-8 rounded-xl shadow-sm transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 w-full md:w-auto"
          >
            {isSearching ? <Search className="animate-pulse" size={20} /> : 'Search'}
          </button>
        </div>

        {/* Action Row */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mt-2 border-t border-slate-100 pt-4">
          <div className="flex items-center gap-4">
            <button 
              type="button" 
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${showAdvanced ? 'text-primary-600' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <Filter size={16} /> Advanced Filters
            </button>
            
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  checked={filters.remote}
                  onChange={(e) => handleChange('remote', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
              </div>
              <span className="text-sm font-medium text-slate-700 flex items-center gap-1">
                <Globe size={14} /> Remote Only
              </span>
            </label>
          </div>

          {/* Quick Role Chips */}
          <div className="flex flex-wrap gap-2">
            {QUICK_ROLES.map(role => (
              <button
                key={role}
                type="button"
                onClick={() => applyQuickRole(role)}
                className="text-xs px-3 py-1.5 bg-slate-50 text-slate-600 rounded-full border border-slate-200 hover:bg-primary-50 hover:text-primary-600 hover:border-primary-200 transition-colors font-medium"
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        {/* Advanced Filters Panel */}
        {showAdvanced && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-top-2">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1 flex items-center gap-1"><Building size={12}/> Company</label>
              <input
                type="text"
                value={filters.company}
                onChange={(e) => handleChange('company', e.target.value)}
                placeholder="e.g. Google"
                className="block w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1 flex items-center gap-1"><Globe size={12}/> Job Region</label>
              <select
                value={filters.jobRegion}
                onChange={(e) => handleChange('jobRegion', e.target.value)}
                className="block w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              >
                <option value="All Jobs">All Jobs</option>
                <option value="Onsite">Onsite</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Remote">Remote</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1 flex items-center gap-1"><Award size={12}/> Experience Level</label>
              <select
                value={filters.experienceLevel}
                onChange={(e) => handleChange('experienceLevel', e.target.value)}
                className="block w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              >
                <option value="">Any Level</option>
                <option value="Internship">Internship</option>
                <option value="New Grad">New Grad</option>
                <option value="Entry Level">Entry Level</option>
                <option value="Mid Level">Mid Level</option>
                <option value="Senior">Senior</option>
                <option value="Leadership">Leadership</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1 flex items-center gap-1"><Calendar size={12}/> Date Posted</label>
              <select
                value={filters.datePosted}
                onChange={(e) => handleChange('datePosted', e.target.value)}
                className="block w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              >
                <option value="">Any Time</option>
                <option value="Past 24 hours">Past 24 hours</option>
                <option value="Past Week">Past Week</option>
                <option value="Past Month">Past Month</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1 flex items-center gap-1"><Database size={12}/> Source</label>
              <select
                value={filters.source}
                onChange={(e) => handleChange('source', e.target.value)}
                className="block w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              >
                <option value="">All Sources</option>
                {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default JobSearch;
