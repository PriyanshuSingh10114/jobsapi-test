import { useState } from 'react';
import { Search, MapPin, Briefcase, Globe } from 'lucide-react';

const JobSearch = ({ onSearch, isSearching }) => {
  const [role, setRole] = useState('');
  const [location, setLocation] = useState('');
  const [jobType, setJobType] = useState('');
  const [remote, setRemote] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch({ role, location, jobType, remote });
  };

  return (
    <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100">
      <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-end">
        {/* Role Input */}
        <div className="flex-1 w-full">
          <label className="block text-sm font-medium text-slate-700 mb-1">What</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Job title, keywords, or company"
              className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-slate-900 bg-slate-50 focus:bg-white transition-colors outline-none"
            />
          </div>
        </div>

        {/* Location Input */}
        <div className="flex-1 w-full">
          <label className="block text-sm font-medium text-slate-700 mb-1">Where</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MapPin className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
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
              value={jobType}
              onChange={(e) => setJobType(e.target.value)}
              className="block w-full pl-10 pr-8 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-slate-900 bg-slate-50 focus:bg-white transition-colors outline-none appearance-none"
            >
              <option value="">Any Type</option>
              <option value="full-time">Full-Time</option>
              <option value="part-time">Part-Time</option>
              <option value="contract">Contract</option>
              <option value="freelance">Freelance</option>
              <option value="internship">Internship</option>
            </select>
          </div>
        </div>

        {/* Remote Toggle & Submit */}
        <div className="flex w-full md:w-auto items-center justify-between md:justify-start gap-4">
          <label className="flex items-center gap-2 cursor-pointer group">
            <div className="relative flex items-center">
              <input
                type="checkbox"
                checked={remote}
                onChange={(e) => setRemote(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </div>
            <span className="text-sm font-medium text-slate-700 group-hover:text-primary-600 transition-colors flex items-center gap-1">
              <Globe size={16} /> Remote Only
            </span>
          </label>

          <button
            type="submit"
            disabled={isSearching}
            className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-8 rounded-xl shadow-sm transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSearching ? (
              <Search className="animate-pulse" size={20} />
            ) : (
              'Search'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default JobSearch;
