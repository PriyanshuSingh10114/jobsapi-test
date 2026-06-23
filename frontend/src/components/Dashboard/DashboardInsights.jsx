import { useQuery } from '@tanstack/react-query';
import { 
  fetchStats,
  fetchAnalyticsSources
} from '../../services/api';
import { 
  MapPin, 
  PieChart as PieChartIcon, 
  Zap
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';

const COLORS = ['#0284c7', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#f43f5e', '#64748b'];

const InsightCard = ({ title, icon: Icon, children }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-[400px]">
    <div className="flex items-center gap-2 mb-6">
      <div className="p-2 bg-primary-50 text-primary-600 rounded-lg">
        <Icon size={18} />
      </div>
      <h3 className="font-semibold text-slate-800">{title}</h3>
    </div>
    <div className="flex-1 overflow-hidden">
      {children}
    </div>
  </div>
);

const ListWidget = ({ data, valueFormatter, suffix = '' }) => {
  if (!data || data.length === 0) return <div className="text-slate-400 text-sm text-center py-4">Data unavailable</div>;
  return (
    <div className="flex flex-col gap-3 h-full overflow-y-auto pr-2">
      {data.map((item, i) => {
        const name = item._id || item.role || item.skill || item.source || item.company || item.title || item.state;
        return (
          <div key={name || i} className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-600 truncate max-w-[70%]">{name}</span>
            <span className={`text-sm font-semibold px-2 py-1 rounded-md bg-slate-100 text-slate-700`}>
              {valueFormatter ? valueFormatter(item) : item.count?.toLocaleString()}
              {suffix}
            </span>
          </div>
        );
      })}
    </div>
  );
};

const DashboardInsights = () => {
  const { data: stats, isLoading: isStatsLoading, isError: isStatsError } = useQuery({
    queryKey: ['stats'],
    queryFn: fetchStats
  });

  const { data: sourcesData, isLoading: isSourcesLoading, isError: isSourcesError } = useQuery({
    queryKey: ['analytics-sources'],
    queryFn: fetchAnalyticsSources
  });

  const isError = isStatsError || isSourcesError;
  const isLoading = isStatsLoading || isSourcesLoading;

  if (isError) {
    return (
      <div className="text-center p-12 text-slate-500 font-medium bg-white rounded-2xl border border-slate-100 shadow-sm mt-6">
        Data unavailable
      </div>
    );
  }

  if (isLoading || !stats?.insights) return null;

  const { insights } = stats;

  return (
    <div className="flex flex-col gap-6 mt-6 mb-8">
      <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
        <Zap size={24} className="text-primary-600" /> Market Intelligence
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <InsightCard title="ATS Market Share" icon={PieChartIcon}>
          {sourcesData && sourcesData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sourcesData}
                  cx="50%"
                  cy="45%"
                  innerRadius={65}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="count"
                  nameKey="source"
                >
                  {sourcesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => {
                  const total = sourcesData.reduce((acc, curr) => acc + curr.count, 0);
                  const percent = ((value / total) * 100).toFixed(1);
                  return [`${value} (${percent}%)`, name];
                }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
             <div className="text-slate-400 text-sm text-center py-4">Data unavailable</div>
          )}
        </InsightCard>

        <InsightCard title="Top Hiring States" icon={MapPin}>
          <ListWidget data={insights.topStates} />
        </InsightCard>

      </div>
    </div>
  );
};

export default DashboardInsights;
