import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Store, Mail, Phone, MapPin, Type, FileText, Tag, ArrowRight, Upload } from 'lucide-react';
import { BUSINESS_CATEGORIES } from '../constants';
import toast from 'react-hot-toast';
import { businessApi, uploadApi } from '../services/api';
import { Business } from '../types';

export default function BusinessRegistration() {
  const [formData, setFormData] = React.useState({
    name: '',
    description: '',
    category: BUSINESS_CATEGORIES[0],
    customCategory: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    logo: '',
  });
  const [isLoading, setIsLoading] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const navigate = useNavigate();

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await uploadApi.uploadFile(file);
      setFormData(prev => ({ ...prev, logo: url }));
      toast.success('Logo uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload logo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const finalCategory = formData.category === 'Other' ? formData.customCategory : formData.category;
      await businessApi.register({
        ...formData,
        category: finalCategory
      });
      toast.success('Business registered successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to register business');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
          <Store size={24} />
        </div>
        <h1 className="text-xl font-bold mb-1">Register Your Business</h1>
        <p className="text-xs text-slate-500">Fill in the details below to get started with Zionn.</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-4"
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Business Name</label>
              <div className="relative">
                <Type className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:ring-1 focus:ring-primary outline-none transition-all"
                  placeholder="Acme Corp"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Category</label>
              <div className="relative">
                <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:ring-1 focus:ring-primary outline-none transition-all appearance-none"
                >
                  {BUSINESS_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {formData.category === 'Other' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-1"
            >
              <label className="text-xs font-medium text-slate-700">Custom Category</label>
              <div className="relative">
                <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input
                  type="text"
                  required
                  value={formData.customCategory}
                  onChange={(e) => setFormData({ ...formData, customCategory: e.target.value })}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:ring-1 focus:ring-primary outline-none transition-all"
                  placeholder="Enter your business category"
                />
              </div>
            </motion.div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Business Logo</label>
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-lg bg-slate-100 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden">
                {formData.logo ? (
                  <img src={formData.logo} alt="Logo Preview" className="w-full h-full object-cover" />
                ) : (
                  <Store className="text-slate-400" size={20} />
                )}
              </div>
              <div className="flex-1">
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors">
                  <Upload size={14} />
                  {isUploading ? 'Uploading...' : 'Choose Logo'}
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={isUploading}
                  />
                </label>
                <p className="text-[10px] text-slate-500 mt-1">Recommended: Square image, max 2MB</p>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Description</label>
            <div className="relative">
              <FileText className="absolute left-2.5 top-2.5 text-slate-400" size={14} />
              <textarea
                required
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:ring-1 focus:ring-primary outline-none transition-all"
                placeholder="Tell us about your business..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Contact Email</label>
              <div className="relative">
                <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input
                  type="email"
                  required
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:ring-1 focus:ring-primary outline-none transition-all"
                  placeholder="contact@acme.com"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Contact Phone</label>
              <div className="relative">
                <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input
                  type="tel"
                  required
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:ring-1 focus:ring-primary outline-none transition-all"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Address</label>
            <div className="relative">
              <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:ring-1 focus:ring-primary outline-none transition-all"
                placeholder="123 Business St, City, Country"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-2 text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Complete Registration <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
