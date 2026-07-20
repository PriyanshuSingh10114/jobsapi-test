import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { searchJobs, startAutomation, fetchProfile } from '../../services/api';
import { ExternalLink, MapPin, Building2, Calendar, Globe, Briefcase, Clock, Zap } from 'lucide-react';

const JobListing = ({ searchParams, onSearchStateChange }) => {
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState(searchParams?.role ? 'Most Relevant' : 'Newest First');
  const [applyingJobId, setApplyingJobId] = useState(null);
  const navigate = useNavigate();

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile
  });

  const applyMutation = useMutation({
    mutationFn: startAutomation,
    onMutate: (variables) => {
      setApplyingJobId(variables.jobId);
    },
    onSuccess: (data) => {
      alert(`Automation started! Session ID: ${data.sessionId}`);
      setApplyingJobId(null);
    },
    onError: (error) => {
      alert(`Failed to start automation: ${error.message}`);
      setApplyingJobId(null);
    }
  });

  const handleAutoApply = (job) => {
    // Nested checks for profile completeness
    const userProfile = profile?.profile || {};
    const basicInfo = userProfile?.basicInfo || {};
    const hasResume = userProfile?.assets && userProfile.assets.some(a => !a.isCoverLetter && !a.isPortfolio && !a.isCertificate);
    
    if (!hasResume || !basicInfo.firstName || !basicInfo.lastName || !basicInfo.email || !basicInfo.phone) {
      alert("Please complete your Profile Studio (including Resume upload) before using Auto-Apply.");
      navigate('/profile');
      return;
    }

    const payload = {
      jobId: job._id,
      userId: 'local_admin_1',
      connectorName: job.source
    };
    applyMutation.mutate(payload);
  };
  
  // Reset page when search params change
  useEffect(() => {
    setPage(1);
    if (searchParams?.role && sort === 'Newest First') {
      setSort('Most Relevant');
    } else if (!searchParams?.role && sort === 'Most Relevant') {
      setSort('Newest First');
    }
  }, [searchParams]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['jobs', page, searchParams, sort],
    queryFn: () => {
      const params = { page, limit: 10, sort, ...searchParams };
      return searchJobs(params); // Using searchJobs for everything to support advanced sort/filters
    },
    keepPreviousData: true,
  });

  // Notify parent of fetching state for the search button spinner
  useEffect(() => {
    if (onSearchStateChange) {
      onSearchStateChange(isFetching);
    }
  }, [isFetching, onSearchStateChange]);

  const formatDistanceToNow = (dateStr) => {
    const diff = new Date() - new Date(dateStr);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (hours < 24) return `${hours} hours ago`;
    if (days === 1) return `1 day ago`;
    if (days < 30) return `${days} days ago`;
    return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col min-h-[600px]">
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50 rounded-t-2xl">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-slate-800">
            {searchParams && Object.keys(searchParams).length > 0 ? 'Search Results' : 'Recommended Jobs'}
          </h2>
          {isFetching && <div className="text-sm font-medium text-primary-600 animate-pulse">Updating...</div>}
        </div>
        
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-500">Sort by:</label>
          <select 
            value={sort} 
            onChange={(e) => setSort(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg py-1.5 px-3 focus:ring-2 focus:ring-primary-500 outline-none bg-white font-medium text-slate-700"
          >
            {searchParams?.role && <option value="Most Relevant">Most Relevant</option>}
            <option value="Newest First">Newest First</option>
            <option value="Oldest First">Oldest First</option>
            <option value="Company Name">Company Name</option>
            <option value="Remote First">Remote First</option>
          </select>
        </div>
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
              <div key={job._id} className="p-6 hover:bg-slate-50 transition-colors group flex flex-col md:flex-row justify-between items-start gap-4 cursor-pointer">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 text-lg group-hover:text-primary-700 transition-colors mb-1.5">
                    {job.title}
                  </h3>
                  
                  <div className="text-slate-600 font-medium mb-3 flex items-center gap-2">
                    <Building2 size={16} className="text-slate-400"/>
                    {job.company}
                    <span className="text-slate-300">•</span>
                    <MapPin size={16} className="text-slate-400"/>
                    {job.location}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                    {job.jobType && (
                      <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md capitalize flex items-center gap-1">
                        <Briefcase size={12}/> {job.jobType.replace('-', ' ')}
                      </span>
                    )}
                    {job.experienceLevel && (
                      <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md flex items-center gap-1">
                        {job.experienceLevel}
                      </span>
                    )}
                    {job.jobRegion && (
                      <span className={`px-2.5 py-1 rounded-md flex items-center gap-1 ${
                        job.jobRegion === 'US Remote' ? 'bg-emerald-50 text-emerald-700' :
                        job.jobRegion === 'International Remote' ? 'bg-purple-50 text-purple-700' :
                        job.jobRegion === 'US Hybrid' ? 'bg-indigo-50 text-indigo-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        <Globe size={12} /> {job.jobRegion}
                      </span>
                    )}
                    <span className="bg-slate-50 border border-slate-100 text-slate-500 px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wider">
                      {job.source}
                    </span>
                  </div>
                </div>
                
                <div className="w-full md:w-auto flex flex-col md:items-end justify-between self-stretch shrink-0 gap-4 mt-2 md:mt-0">
                  <div className="text-sm text-slate-400 font-medium flex items-center gap-1">
                    <Clock size={14}/> {formatDistanceToNow(job.postedAt)}
                  </div>
                  <div className="flex items-center gap-2 w-full md:w-auto">
                    {job.source === 'Greenhouse' ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleAutoApply(job); }}
                        disabled={applyingJobId === job._id}
                        className="w-full md:w-auto text-center px-6 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 font-semibold rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                      >
                        {applyingJobId === job._id ? 'Starting AI...' : 'Auto Apply'} <Zap size={16} className={applyingJobId === job._id ? 'animate-pulse' : ''} />
                      </button>
                    ) : (
                      <a 
                        href={job.applyUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        onClick={(e) => e.stopPropagation()}
                        className="w-full md:w-auto text-center px-6 py-2.5 bg-primary-600 text-white hover:bg-primary-700 font-semibold rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm"
                      >
                        Apply Now <ExternalLink size={16} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {data?.pagination && data.pagination.pages > 0 && (
        <div className="p-5 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-500 bg-slate-50/50 rounded-b-2xl">
          <div>
            Showing <span className="font-medium text-slate-800">{((page - 1) * 10) + 1}</span> to <span className="font-medium text-slate-800">{Math.min(page * 10, data.total)}</span> of <span className="font-medium text-slate-800">{data.total}</span> jobs
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-sm"
            >
              Previous
            </button>
            <button 
              onClick={() => setPage(p => Math.min(data.pagination.pages, p + 1))}
              disabled={page === data.pagination.pages}
              className="px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-sm"
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
