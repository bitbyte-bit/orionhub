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

  const [isConfirmModalOpen, setIsConfirmModalOpen] = React.useState(false);
  const [confirmAction, setConfirmAction] = React.useState<{ userId: string, status: string } | null>(null);

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
    if (status === 'banned' || status === 'suspended') {
      setConfirmAction({ userId, status });
      setIsConfirmModalOpen(true);
      return;
    }
    
    try {
      await adminApi.updateUserStatus(userId, status);
      toast.success(`User status updated to ${status}`);
      fetchData();
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  const executeStatusUpdate = async () => {
    if (!confirmAction) return;
    try {
      await adminApi.updateUserStatus(confirmAction.userId, confirmAction.status);
      toast.success(`User status updated to ${confirmAction.status}`);
      setIsConfirmModalOpen(false);
      setConfirmAction(null);
      fetchData();
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  const filteredUsers = users.filter(u => 
    (u.displayName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (u.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  if (loading && !stats) return <div className="p-8 text-center">Loading master dashboard...</div>;

  return (
    <div className="space-y-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-bold mb-0.5">Master Dashboard</h1>
          <p className="text-[10px] text-slate-500">Platform-wide overview and management.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={fetchData}
            className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[10px] font-medium hover:bg-slate-50 transition-colors flex items-center gap-1.5"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            Refresh Data
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {[
          { label: 'Total Users', value: stats?.users || 0, icon: Users, color: 'bg-blue-500' },
          { label: 'Businesses', value: stats?.businesses || 0, icon: Store, color: 'bg-emerald-500' },
          { label: 'Total Volume', value: `$${stats?.totalVolume.toFixed(2) || 0}`, icon: TrendingUp, color: 'bg-amber-500' },
          { label: 'Total Commission', value: `$${stats?.totalCommission.toFixed(2) || 0}`, icon: DollarSign, color: 'bg-rose-500' },
        ].map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="card p-2.5"
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className={`w-7 h-7 rounded-lg ${stat.color} text-white flex items-center justify-center`}>
                <stat.icon size={14} />
              </div>
            </div>
            <p className="text-[9px] font-medium text-slate-500 mb-0.5">{stat.label}</p>
            <h3 className="text-base font-bold">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Commission Settings */}
        <div className="card lg:col-span-1 p-2.5">
          <h3 className="font-bold text-xs mb-3 flex items-center gap-1.5">
            <DollarSign size={14} className="text-primary" />
            Commission Settings
          </h3>
          <div className="space-y-2.5">
            <div>
              <label className="text-[9px] font-medium text-slate-700 block mb-1">Platform Fee (%)</label>
              <div className="flex gap-1.5">
                <input 
                  type="number"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(e.target.value)}
                  className="flex-1 px-2.5 py-1 rounded-lg border border-slate-200 text-xs outline-none focus:ring-1 focus:ring-primary"
                  placeholder="10"
                />
                <button 
                  onClick={handleUpdateCommission}
                  className="btn-primary px-2.5 py-1 text-[10px]"
                >
                  Update
                </button>
              </div>
              <p className="text-[9px] text-slate-500 mt-1">
                This percentage will be deducted from every successful negotiation.
              </p>
            </div>
          </div>
        </div>

        {/* User Management */}
        <div className="card lg:col-span-2 overflow-hidden p-0">
          <div className="p-2.5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-xs">User Management</h3>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
              <input 
                type="text" 
                placeholder="Search users..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-7 pr-2 py-1 rounded-lg border border-slate-200 text-[10px] outline-none w-32"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-slate-500 text-[9px] font-bold uppercase tracking-wider">
                  <th className="px-2.5 py-1.5">User</th>
                  <th className="px-2.5 py-1.5">Role</th>
                  <th className="px-2.5 py-1.5">Status</th>
                  <th className="px-2.5 py-1.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-2.5 py-1.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
                          {u.photoURL ? <img src={u.photoURL} className="w-full h-full object-cover" /> : <Users size={12} />}
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-slate-900 leading-tight">{u.displayName}</p>
                          <p className="text-[9px] text-slate-500 leading-tight">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-2.5 py-1.5">
                      <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase ${
                        u.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-2.5 py-1.5">
                      <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase ${
                        u.status === 'active' ? 'bg-emerald-100 text-emerald-600' : 
                        u.status === 'warned' ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="px-2.5 py-1.5 text-right">
                      <div className="flex items-center justify-end gap-0">
                        <button 
                          onClick={() => handleUserStatus(u.id, 'warned')}
                          className="p-1 text-amber-600 hover:bg-amber-50 rounded-md transition-colors" 
                          title="Warn User"
                        >
                          <AlertTriangle size={12} />
                        </button>
                        <button 
                          onClick={() => handleUserStatus(u.id, 'suspended')}
                          className="p-1 text-rose-600 hover:bg-rose-50 rounded-md transition-colors" 
                          title="Suspend User"
                        >
                          <UserMinus size={12} />
                        </button>
                        <button 
                          onClick={() => handleUserStatus(u.id, 'banned')}
                          className="p-1 text-slate-900 hover:bg-slate-100 rounded-md transition-colors" 
                          title="Ban User"
                        >
                          <UserX size={12} />
                        </button>
                        <button 
                          onClick={() => handleUserStatus(u.id, 'active')}
                          className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors" 
                          title="Activate User"
                        >
                          <CheckCircle2 size={12} />
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

      {/* Confirmation Modal */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl w-full max-w-xs overflow-hidden p-4"
          >
            <div className="flex items-center gap-2 mb-2 text-rose-600">
              <AlertTriangle size={18} />
              <h3 className="text-sm font-bold">Confirm Action</h3>
            </div>
            <p className="text-[11px] text-slate-600 mb-4">
              Are you sure you want to <span className="font-bold uppercase">{confirmAction?.status}</span> this user? 
              This will restrict their access to the platform.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setIsConfirmModalOpen(false)}
                className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-[10px] font-medium hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={executeStatusUpdate}
                className="flex-1 bg-rose-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-medium hover:bg-rose-700 transition-all"
              >
                Confirm
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
