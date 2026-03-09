import React from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight,
  Plus,
  MoreVertical,
  Search,
  MessageSquare
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

const data = [
  { name: 'Jan', value: 4000 },
  { name: 'Feb', value: 3000 },
  { name: 'Mar', value: 2000 },
  { name: 'Apr', value: 2780 },
  { name: 'May', value: 1890 },
  { name: 'Jun', value: 2390 },
  { name: 'Jul', value: 3490 },
];

const recentActivity = [
  { id: 1, type: 'sale', user: 'Alex Johnson', amount: '$120.00', time: '2 mins ago', status: 'completed' },
  { id: 2, type: 'negotiation', user: 'Sarah Miller', amount: '$450.00', time: '15 mins ago', status: 'pending' },
  { id: 3, type: 'sale', user: 'Mike Brown', amount: '$85.50', time: '1 hour ago', status: 'completed' },
  { id: 4, type: 'registration', user: 'Tech Solutions', amount: 'N/A', time: '3 hours ago', status: 'new' },
];

import { businessApi } from '../services/api';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [hasBusiness, setHasBusiness] = React.useState<boolean | null>(null);
  const [stats, setStats] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const business = await businessApi.getMy();
        if (business) {
          setHasBusiness(true);
          const statsData = await businessApi.getStats();
          setStats(statsData);
        } else {
          setHasBusiness(false);
        }
      } catch (error) {
        setHasBusiness(false);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-8 text-center">Loading dashboard...</div>;

  if (!hasBusiness) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6">
          <ShoppingBag size={40} />
        </div>
        <h1 className="text-3xl font-bold mb-4">No Business Registered</h1>
        <p className="text-slate-500 max-w-md mb-8">
          You need to register your business before you can access the dashboard and start selling.
        </p>
        <Link to="/register-business" className="btn-primary px-8 py-3">
          Register Business Now
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">Welcome back!</h1>
          <p className="text-slate-500">Here's what's happening with your business today.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/products" className="btn-primary py-2 px-4 text-sm flex items-center gap-2">
            <Plus size={18} />
            Manage Products
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Sales', value: `$${stats?.totalVolume.toFixed(2) || '0.00'}`, icon: ShoppingBag, color: 'bg-blue-500' },
          { label: 'Commission Paid', value: `$${stats?.totalCommission.toFixed(2) || '0.00'}`, icon: DollarSign, color: 'bg-rose-500' },
          { label: 'Net Income', value: `$${stats?.netIncome.toFixed(2) || '0.00'}`, icon: TrendingUp, color: 'bg-emerald-500' },
          { label: 'Active Negotiations', value: stats?.negotiations || 0, icon: MessageSquare, color: 'bg-amber-500' },
        ].map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl ${stat.color} text-white flex items-center justify-center`}>
                <stat.icon size={20} />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-500 mb-1">{stat.label}</p>
            <h3 className="text-2xl font-bold">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg">Revenue Overview</h3>
            <select className="bg-slate-50 border-none text-sm font-medium rounded-lg px-2 py-1 outline-none">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>Last year</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg">Recent Activity</h3>
            <button className="text-primary text-sm font-medium hover:underline">View all</button>
          </div>
          <div className="space-y-6">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    activity.type === 'sale' ? 'bg-emerald-100 text-emerald-600' : 
                    activity.type === 'negotiation' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                  }`}>
                    {activity.type === 'sale' ? <ShoppingBag size={18} /> : 
                     activity.type === 'negotiation' ? <MessageSquare size={18} /> : <Users size={18} />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{activity.user}</p>
                    <p className="text-xs text-slate-500">{activity.time} • {activity.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">{activity.amount}</p>
                  <p className={`text-xs font-medium uppercase tracking-wider ${
                    activity.status === 'completed' ? 'text-emerald-600' : 
                    activity.status === 'pending' ? 'text-amber-600' : 'text-blue-600'
                  }`}>{activity.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
