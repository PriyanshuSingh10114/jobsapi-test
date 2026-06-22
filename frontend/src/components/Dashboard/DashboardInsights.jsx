import { useQuery } from '@tanstack/react-query';
import { fetchStats } from '../../services/api';
import { BarChart as BarChartIcon, Map, Building, Briefcase } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const COLORS = ['#0284c7', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#f43f5e', '#64748b'];

const InsightCard = ({ title, icon: Icon, data, formatter, type = 'list' }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-full flex flex-col">
    <div className="flex items-center gap-2 mb-4">
      <div className="p-2 bg-primary-50 text-primary-600 rounded-lg">
        <Icon size={18} />
      </div>
      <h3 className="font-semibold text-slate-800">{title}</h3>
    </div>
    <div className="flex-1 flex flex-col justify-center gap-3">
      {data && data.length > 0 ? (
        type === 'list' ? (
          data.map((item, index) => (
            <div key={item._id} className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600 truncate max-w-[70%]" title={item._id}>
                {formatter ? formatter(item._id) : item._id}
              </span>
              <span className="text-sm font-semibold bg-slate-100 px-2 py-1 rounded-md text-slate-700">
                {item.count.toLocaleString()}
              </span>
            </div>
          ))
        ) : type === 'pie' ? (
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="count"
                  nameKey="_id"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name) => [value, name]}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : type === 'bar' ? (
          <div className="h-48 w-full -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: 40 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="_id" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} width={80} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}/>
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : null
      ) : (
        <div className="text-sm text-slate-400 text-center py-4">No data available</div>
      )}
    </div>
  </div>
);

const DashboardInsights = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: fetchStats
  });

  if (isLoading || !stats?.insights) return null;

  const { insights } = stats;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
      <InsightCard 
        title="Top Hiring Companies" 
        icon={Building} 
        data={insights.topCompanies} 
      />
      <InsightCard 
        title="Top Locations" 
        icon={Map} 
        data={insights.topLocations} 
      />
      <InsightCard 
        title="Jobs by Source" 
        icon={BarChartIcon} 
        data={insights.jobsBySource} 
        type="pie"
      />
      <InsightCard 
        title="Jobs by Type" 
        icon={Briefcase} 
        data={insights.jobsByType} 
        type="bar"
      />
    </div>
  );
};

export default DashboardInsights;
