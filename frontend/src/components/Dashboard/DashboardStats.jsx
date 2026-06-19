import { useQuery } from '@tanstack/react-query';
import { fetchStats } from '../../services/api';
import { Briefcase, Building2, Globe, Clock } from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, colorClass, bgColorClass }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bgColorClass} ${colorClass}`}>
      <Icon size={24} />
    </div>
    <div>
      <div className="text-2xl font-bold text-slate-800">{value}</div>
      <div className="text-sm font-medium text-slate-500">{label}</div>
    </div>
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard 
        icon={Briefcase} 
        label="Total Jobs" 
        value={stats?.totalJobs?.toLocaleString() || 0} 
        colorClass="text-blue-600"
        bgColorClass="bg-blue-50"
      />
      <StatCard 
        icon={Building2} 
        label="Companies" 
        value={stats?.totalCompanies?.toLocaleString() || 0} 
        colorClass="text-purple-600"
        bgColorClass="bg-purple-50"
      />
      <StatCard 
        icon={Globe} 
        label="Remote Roles" 
        value={stats?.remoteJobs?.toLocaleString() || 0} 
        colorClass="text-green-600"
        bgColorClass="bg-green-50"
      />
      <StatCard 
        icon={Clock} 
        label="Last Sync" 
        value={formatTime(stats?.lastSyncTime)} 
        colorClass="text-orange-600"
        bgColorClass="bg-orange-50"
      />
    </div>
  );
};

export default DashboardStats;
