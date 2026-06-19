import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchJobs, searchJobs } from '../../services/api';
import { ExternalLink, MapPin, Building2, Calendar, Globe, Briefcase } from 'lucide-react';

const JobListing = ({ searchParams, onSearchStateChange }) => {
  const [page, setPage] = useState(1);
  
  // Reset page when search params change
  useEffect(() => {
    setPage(1);
  }, [searchParams]);

  const isSearching = searchParams && (searchParams.role || searchParams.location || searchParams.jobType || searchParams.remote);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['jobs', page, searchParams],
    queryFn: () => {
      const params = { page, limit: 10, ...searchParams };
      return isSearching ? searchJobs(params) : fetchJobs(params);
    },
    keepPreviousData: true,
  });

  // Notify parent of fetching state for the search button spinner
  useEffect(() => {
    if (onSearchStateChange) {
      onSearchStateChange(isFetching);
    }
  }, [isFetching, onSearchStateChange]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col min-h-[600px]">
      <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
        <h2 className="text-lg font-bold text-slate-800">
          {isSearching ? 'Search Results' : 'Latest Jobs'}
        </h2>
        {isFetching && <div className="text-sm font-medium text-primary-600 animate-pulse">Updating...</div>}
      </div>

      <div className="flex-1">
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-slate-400 p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : data?.data?.length === 0 ? (
          <div className="flex flex-col h-full items-center justify-center text-slate-400 p-12 text-center">
            <Briefcase size={48} className="mb-4 opacity-20" />
            <h3 className="text-lg font-medium text-slate-600">No jobs found</h3>
            <p className="text-sm mt-1">Try adjusting your search criteria or removing some filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {data?.data?.map(job => (
              <div key={job._id} className="p-6 hover:bg-slate-50 transition-colors group">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-800 text-lg group-hover:text-primary-600 transition-colors mb-2">
                      {job.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-sm text-slate-500">
                      <span className="flex items-center gap-1 font-medium text-slate-700">
                        <Building2 size={16} /> {job.company}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={16} /> {job.location}
                      </span>
                      
                      {/* Job Type Badge (derived or default) */}
                      {searchParams?.jobType && (
                        <span className="flex items-center gap-1 bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize">
                          {searchParams.jobType.replace('-', ' ')}
                        </span>
                      )}

                      {/* Remote Badge */}
                      {job.remote && (
                        <span className="flex items-center gap-1 bg-green-50 text-green-600 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                          <Globe size={14} /> Remote
                        </span>
                      )}
                      
                      <span className="flex items-center gap-1 ml-auto md:ml-0 text-slate-400">
                        <Calendar size={14} /> 
                        {new Date(job.postedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  
                  <div className="w-full md:w-auto flex shrink-0">
                    <a 
                      href={job.applyUrl} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="w-full md:w-auto text-center px-6 py-2.5 bg-white border border-primary-200 text-primary-600 hover:bg-primary-50 hover:border-primary-300 font-semibold rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      Apply Now <ExternalLink size={16} />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {data?.pagination && data.pagination.pages > 0 && (
        <div className="p-4 border-t border-slate-100 flex justify-between items-center text-sm text-slate-500 bg-slate-50/50 rounded-b-2xl">
          <div>
            Showing <span className="font-medium text-slate-800">{((page - 1) * 10) + 1}</span> to <span className="font-medium text-slate-800">{Math.min(page * 10, data.total)}</span> of <span className="font-medium text-slate-800">{data.total}</span> jobs
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Previous
            </button>
            <button 
              onClick={() => setPage(p => Math.min(data.pagination.pages, p + 1))}
              disabled={page === data.pagination.pages}
              className="px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobListing;
