import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { syncJobs } from '../services/api';
import { RefreshCw } from 'lucide-react';
import DashboardStats from '../components/Dashboard/DashboardStats';
import JobSearch from '../components/Dashboard/JobSearch';
import JobListing from '../components/Dashboard/JobListing';

const DashboardPage = () => {
  const [searchParams, setSearchParams] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = (params) => {
    setSearchParams(params);
  };

  const queryClient = useQueryClient();

  const syncMutation = useMutation({
    mutationFn: syncJobs,
    onSuccess: () => {
      queryClient.invalidateQueries(['jobs']);
      queryClient.invalidateQueries(['stats']);
    }
  });

  return (
    <>
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Find your next role</h1>
          <p className="text-slate-500">Search thousands of jobs aggregated from multiple ATS systems and job boards.</p>
        </div>
        <button
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
          className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition-all disabled:opacity-50"
        >
          <RefreshCw size={16} className={syncMutation.isPending ? 'animate-spin text-primary-600' : 'text-primary-600'} />
          {syncMutation.isPending ? 'Updating...' : 'Update Jobs'}
        </button>
      </div>

      {/* Main Search Bar */}
      <section className="mb-8">
        <JobSearch onSearch={handleSearch} isSearching={isSearching} />
      </section>

      {/* Stats Cards */}
      <section className="mb-8">
        <DashboardStats />
      </section>

      {/* Search Results / Latest Jobs */}
      <section className="h-[800px] flex flex-col">
        <JobListing 
          searchParams={searchParams} 
          onSearchStateChange={setIsSearching} 
        />
      </section>
    </>
  );
};

export default DashboardPage;
