import { useQuery } from '@tanstack/react-query';
import { fetchStats } from '../../services/api';
import { Briefcase, Building2, Globe, Clock, CalendarPlus } from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, colorClass, bgColorClass }) => (
  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3 justify-center transition-all hover:shadow-md">
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bgColorClass} ${colorClass}`}>
        <Icon size={20} />
      </div>
      <div className="text-sm font-medium text-slate-500">{label}</div>
    </div>
    <div className="text-2xl font-bold text-slate-800">{value}</div>
  </div>
);

const DashboardStats = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: fetchStats
  });

  if (isLoading) {
    return <div className="h-24 flex items-center justify-center text-slate-400">Loading stats...</div>;
  }

  const formatTime = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      <StatCard 
        icon={Briefcase} 
        label="Total Jobs" 
        value={stats?.totalJobs?.toLocaleString() || 0} 
        colorClass="text-blue-600"
        bgColorClass="bg-blue-50"
      />
      <StatCard 
        icon={Building2} 
        label="Total Companies" 
        value={stats?.totalCompanies?.toLocaleString() || 0} 
        colorClass="text-purple-600"
        bgColorClass="bg-purple-50"
      />
      <StatCard 
        icon={Globe} 
        label="Remote Jobs" 
        value={stats?.remoteJobs?.toLocaleString() || 0} 
        colorClass="text-emerald-600"
        bgColorClass="bg-emerald-50"
      />
      <StatCard 
        icon={CalendarPlus} 
        label="New Jobs Today" 
        value={stats?.newJobsToday?.toLocaleString() || 0} 
        colorClass="text-indigo-600"
        bgColorClass="bg-indigo-50"
      />
      <StatCard 
        icon={Clock} 
        label="Last Sync" 
        value={formatTime(stats?.lastSyncTime)} 
        colorClass="text-slate-600"
        bgColorClass="bg-slate-50"
      />
    </div>
  );
};

export default DashboardStats;
