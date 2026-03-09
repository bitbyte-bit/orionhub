import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Mail, Lock, User as UserIcon, ArrowRight, Github, Chrome } from 'lucide-react';
import { authApi } from '../services/api';
import toast from 'react-hot-toast';
import { APP_NAME, ADMIN_EMAIL } from '../constants';

interface AuthProps {
  type: 'login' | 'register';
}

export default function Auth({ type }: AuthProps) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [displayName, setDisplayName] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (type === 'login') {
        const userData = await authApi.login({ email, password });
        
        if (userData?.role === 'admin' || email === ADMIN_EMAIL) {
          toast.success('Welcome back, Admin!');
          window.location.href = '/admin';
        } else {
          toast.success('Welcome back!');
          window.location.href = '/dashboard';
        }
      } else {
        const userData = await authApi.register({ 
          email, 
          password, 
          displayName,
          role: email === ADMIN_EMAIL ? 'admin' : 'user'
        });

        toast.success('Account created successfully!');
        window.location.href = '/dashboard';
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      toast.error(error.response?.data?.error || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    toast.error('Google Sign-In is not available in custom database mode yet.');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 rounded-full blur-3xl -z-10" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-4">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-lg">
              Z
            </div>
            <span className="text-xl font-bold gradient-text">{APP_NAME}</span>
          </Link>
          <h2 className="text-xl font-bold mb-1">
            {type === 'login' ? 'Welcome Back' : 'Join Zionn'}
          </h2>
          <p className="text-xs text-slate-500">
            {type === 'login' 
              ? 'Enter your credentials to access your dashboard' 
              : 'Create an account to start your business journey'}
          </p>
        </div>

        <div className="card p-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            {type === 'register' && (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:ring-1 focus:ring-primary outline-none transition-all"
                    placeholder="John Doe"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:ring-1 focus:ring-primary outline-none transition-all"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:ring-1 focus:ring-primary outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-2 text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {type === 'login' ? 'Sign In' : 'Create Account'}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-[10px]">
              <span className="px-2 bg-white text-slate-500">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleGoogleSignIn}
              className="flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors font-medium text-slate-700 text-xs"
            >
              <Chrome size={14} />
              Google
            </button>
            <button className="flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors font-medium text-slate-700 text-xs">
              <Github size={14} />
              GitHub
            </button>
          </div>
        </div>

        <p className="text-center mt-6 text-xs text-slate-600">
          {type === 'login' ? (
            <>
              Don't have an account?{' '}
              <Link to="/register" className="text-primary font-bold hover:underline">
                Register
              </Link>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <Link to="/login" className="text-primary font-bold hover:underline">
                Login
              </Link>
            </>
          )}
        </p>
      </motion.div>
    </div>
  );
}
