import React from 'react';
import { motion } from 'motion/react';
import { Store, User as UserIcon, Shield, Bell, Lock, Camera, Save, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi, uploadApi } from '../services/api';
import toast from 'react-hot-toast';

export default function Settings() {
  const { user, setUser } = useAuth();
  const [isEditingProfile, setIsEditingProfile] = React.useState(false);
  const [isChangingPassword, setIsChangingPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const [profileData, setProfileData] = React.useState({
    displayName: user?.displayName || '',
    photoURL: user?.photoURL || ''
  });

  const [passwordData, setPasswordData] = React.useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await authApi.updateProfile(profileData);
      setUser({ ...user!, ...profileData });
      toast.success('Profile updated successfully');
      setIsEditingProfile(false);
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return toast.error('New passwords do not match');
    }
    setIsLoading(true);
    try {
      await authApi.updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      toast.success('Password updated successfully');
      setIsChangingPassword(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const toastId = toast.loading('Uploading photo...');
    try {
      const url = await uploadApi.uploadFile(file);
      setProfileData({ ...profileData, photoURL: url });
      toast.success('Photo uploaded', { id: toastId });
    } catch (error) {
      toast.error('Failed to upload photo', { id: toastId });
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold mb-0.5">Settings</h1>
        <p className="text-xs text-slate-500">Manage your account and business preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-3"
        >
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Store size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold">Business Management</h2>
              <p className="text-[10px] text-slate-500">Register or update your business details.</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <Link 
              to="/register-business"
              className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors group"
            >
              <span className="text-sm font-medium text-slate-700">Register New Business</span>
              <Store className="text-slate-400 group-hover:text-primary transition-colors" size={16} />
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-3"
        >
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center">
              <UserIcon size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold">Profile Settings</h2>
              <p className="text-[10px] text-slate-500">Update your personal information.</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <button 
              onClick={() => setIsEditingProfile(true)}
              className="w-full flex items-center justify-between p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors group"
            >
              <span className="text-sm font-medium text-slate-700">Edit Profile</span>
              <UserIcon className="text-slate-400 group-hover:text-secondary transition-colors" size={16} />
            </button>
            <button 
              onClick={() => setIsChangingPassword(true)}
              className="w-full flex items-center justify-between p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors group"
            >
              <span className="text-sm font-medium text-slate-700">Security & Password</span>
              <Lock className="text-slate-400 group-hover:text-secondary transition-colors" size={16} />
            </button>
          </div>
        </motion.div>
      </div>

      {/* Profile Edit Modal */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden"
          >
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold">Edit Profile</h3>
              <button onClick={() => setIsEditingProfile(false)} className="p-1.5 hover:bg-slate-100 rounded-lg">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleProfileUpdate} className="p-4 space-y-4">
              <div className="flex flex-col items-center gap-2">
                <div className="relative group">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-slate-200">
                    {profileData.photoURL ? (
                      <img src={profileData.photoURL} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon size={24} className="text-slate-400" />
                    )}
                  </div>
                  <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full">
                    <Camera size={18} />
                    <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                  </label>
                </div>
                <p className="text-[10px] text-slate-500">Click to upload new photo</p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Display Name</label>
                <input
                  type="text"
                  required
                  value={profileData.displayName}
                  onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:ring-1 focus:ring-primary outline-none"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 btn-primary py-1.5 text-sm flex items-center justify-center gap-1.5"
                >
                  {isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={14} />}
                  Save Changes
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Password Change Modal */}
      {isChangingPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden"
          >
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold">Security & Password</h3>
              <button onClick={() => setIsChangingPassword(false)} className="p-1.5 hover:bg-slate-100 rounded-lg">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handlePasswordUpdate} className="p-4 space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Current Password</label>
                <input
                  type="password"
                  required
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:ring-1 focus:ring-primary outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">New Password</label>
                <input
                  type="password"
                  required
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:ring-1 focus:ring-primary outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:ring-1 focus:ring-primary outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsChangingPassword(false)}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 btn-primary py-1.5 text-sm flex items-center justify-center gap-1.5"
                >
                  {isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Lock size={14} />}
                  Update Password
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
