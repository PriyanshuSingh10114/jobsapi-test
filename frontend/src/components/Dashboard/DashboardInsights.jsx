import { useQuery } from '@tanstack/react-query';
import { fetchStats } from '../../services/api';
import { 
  MapPin, 
  Building, 
  Globe, 
  TrendingUp, 
  PieChart as PieChartIcon, 
  DollarSign,
  Code,
  Zap
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis,
  CartesianGrid
} from 'recharts';

const COLORS = ['#0284c7', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#f43f5e', '#64748b'];

const InsightCard = ({ title, icon: Icon, children }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-[340px]">
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
  if (!data || data.length === 0) return <div className="text-slate-400 text-sm text-center py-4">No data</div>;
  return (
    <div className="flex flex-col gap-3 h-full overflow-y-auto pr-2">
      {data.map((item, i) => (
        <div key={item._id || i} className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-600 truncate max-w-[70%]">{item._id}</span>
          <span className={`text-sm font-semibold px-2 py-1 rounded-md ${
            item.growth && item.growth > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'
          }`}>
            {valueFormatter ? valueFormatter(item) : item.count?.toLocaleString()}
            {suffix}
          </span>
        </div>
      ))}
    </div>
  );
};

const DashboardInsights = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: fetchStats
  });

  if (isLoading || !stats?.insights) return null;

  const { insights } = stats;

  return (
    <div className="flex flex-col gap-6 mt-6 mb-8">
      {/* Real Market Insights Row 1 */}
      <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
        <Zap size={24} className="text-primary-600" /> Market Intelligence
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <InsightCard title="Fastest Growing Roles" icon={TrendingUp}>
          <ListWidget 
            data={insights.fastestGrowingRoles} 
            valueFormatter={(item) => `${item.growth > 0 ? '+' : ''}${item.growth}%`}
          />
        </InsightCard>

        <InsightCard title="In-Demand Skills" icon={Code}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={insights.inDemandSkills?.slice(0,6)} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 40 }}>
              <XAxis type="number" hide />
              <YAxis dataKey="_id" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} width={80} />
              <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}/>
              <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]}>
                {insights.inDemandSkills?.slice(0,6).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </InsightCard>

        <InsightCard title="ATS Market Share" icon={PieChartIcon}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={insights.atsShare}
                cx="50%"
                cy="45%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={2}
                dataKey="count"
                nameKey="_id"
              >
                {insights.atsShare?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name, props) => {
                const total = insights.atsShare.reduce((acc, curr) => acc + curr.count, 0);
                const percent = ((value / total) * 100).toFixed(1);
                return [`${value} (${percent}%)`, name];
              }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
            </PieChart>
          </ResponsiveContainer>
        </InsightCard>

        <InsightCard title="Salary Insights" icon={DollarSign}>
          {insights.salaryInsights && insights.salaryInsights.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={insights.salaryInsights} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 40 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="_id" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} width={90} />
                <Tooltip 
                  formatter={(value) => `$${value.toLocaleString()}`}
                  cursor={{fill: '#f8fafc'}} 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="avgSalary" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-slate-400 text-sm text-center py-4">Not enough salary data</div>
          )}
        </InsightCard>

      </div>

      {/* Real Market Insights Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <InsightCard title="Hiring Velocity (30D)" icon={TrendingUp}>
          <ListWidget data={insights.hiringVelocity} />
        </InsightCard>

        <InsightCard title="Remote Hiring Leaders" icon={Globe}>
          <ListWidget data={insights.topRemoteCompanies} />
        </InsightCard>

        <InsightCard title="Top Hiring States" icon={MapPin}>
          <ListWidget data={insights.topStates} />
        </InsightCard>
      </div>
    </div>
  );
};

export default DashboardInsights;
