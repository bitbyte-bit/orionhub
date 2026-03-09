import React from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  Store, 
  ShieldCheck, 
  AlertCircle, 
  Search, 
  Filter, 
  MoreVertical, 
  CheckCircle2, 
  XCircle,
  BarChart3,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  TrendingUp,
  UserX,
  UserMinus,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { adminApi } from '../services/api';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [stats, setStats] = React.useState<any>(null);
  const [users, setUsers] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [commissionRate, setCommissionRate] = React.useState('');
  const [searchTerm, setSearchTerm] = React.useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsData, usersData] = await Promise.all([
        adminApi.getStats(),
        adminApi.getUsers()
      ]);
      setStats(statsData);
      setUsers(usersData);
      setCommissionRate(statsData.commissionRate.toString());
    } catch (error) {
      toast.error('Failed to fetch admin data');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateCommission = async () => {
    try {
      await adminApi.updateSettings({ commission_rate: parseFloat(commissionRate) });
      toast.success('Commission rate updated');
      fetchData();
    } catch (error) {
      toast.error('Failed to update commission rate');
    }
  };

  const handleUserStatus = async (userId: string, status: string) => {
    try {
      await adminApi.updateUserStatus(userId, status);
      toast.success(`User status updated to ${status}`);
      fetchData();
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  const filteredUsers = users.filter(u => 
    u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && !stats) return <div className="p-8 text-center">Loading master dashboard...</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">Master Dashboard</h1>
          <p className="text-slate-500">Platform-wide overview and management.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchData}
            className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm font-medium hover:bg-slate-50 transition-colors flex items-center gap-2"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            Refresh Data
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Users', value: stats?.users || 0, icon: Users, color: 'bg-blue-500' },
          { label: 'Businesses', value: stats?.businesses || 0, icon: Store, color: 'bg-emerald-500' },
          { label: 'Total Volume', value: `$${stats?.totalVolume.toFixed(2) || 0}`, icon: TrendingUp, color: 'bg-amber-500' },
          { label: 'Total Commission', value: `$${stats?.totalCommission.toFixed(2) || 0}`, icon: DollarSign, color: 'bg-rose-500' },
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Commission Settings */}
        <div className="card lg:col-span-1">
          <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
            <DollarSign size={20} className="text-primary" />
            Commission Settings
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-2">Platform Fee (%)</label>
              <div className="flex gap-2">
                <input 
                  type="number"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(e.target.value)}
                  className="flex-1 px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary"
                  placeholder="10"
                />
                <button 
                  onClick={handleUpdateCommission}
                  className="btn-primary px-4 py-2 text-sm"
                >
                  Update
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                This percentage will be deducted from every successful negotiation.
              </p>
            </div>
          </div>
        </div>

        {/* User Management */}
        <div className="card lg:col-span-2 overflow-hidden p-0">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-lg">User Management</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search users..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-1.5 rounded-lg border border-slate-200 text-sm outline-none w-48"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
                          {u.photoURL ? <img src={u.photoURL} className="w-full h-full object-cover" /> : <Users size={16} />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{u.displayName}</p>
                          <p className="text-xs text-slate-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                        u.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                        u.status === 'active' ? 'bg-emerald-100 text-emerald-600' : 
                        u.status === 'warned' ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => handleUserStatus(u.id, 'warned')}
                          className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" 
                          title="Warn User"
                        >
                          <AlertTriangle size={16} />
                        </button>
                        <button 
                          onClick={() => handleUserStatus(u.id, 'suspended')}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" 
                          title="Suspend User"
                        >
                          <UserMinus size={16} />
                        </button>
                        <button 
                          onClick={() => handleUserStatus(u.id, 'banned')}
                          className="p-1.5 text-slate-900 hover:bg-slate-100 rounded-lg transition-colors" 
                          title="Ban User"
                        >
                          <UserX size={16} />
                        </button>
                        <button 
                          onClick={() => handleUserStatus(u.id, 'active')}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" 
                          title="Activate User"
                        >
                          <CheckCircle2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
