import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, Store, MessageSquare, LayoutDashboard, ShieldCheck, Zap, Globe } from 'lucide-react';
import { APP_NAME, APP_DESCRIPTION } from '../constants';

export default function LandingPage() {
  const features = [
    {
      title: 'Business Registration',
      description: 'Register your business in minutes and join a global network of entrepreneurs.',
      icon: Store,
      color: 'bg-primary/10 text-primary',
    },
    {
      title: 'Smart Dashboards',
      description: 'Manage your products, posts, and business data with intuitive, real-time dashboards.',
      icon: LayoutDashboard,
      color: 'bg-secondary/10 text-secondary',
    },
    {
      title: 'Trade Negotiations',
      description: 'Directly negotiate with customers through our secure, real-time messaging system.',
      icon: MessageSquare,
      color: 'bg-accent/10 text-accent',
    },
  ];

  const stats = [
    { label: 'Businesses', value: '10K+' },
    { label: 'Countries', value: '50+' },
    { label: 'Transactions', value: '$2M+' },
    { label: 'Active Users', value: '100K+' },
  ];

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold">
            Z
          </div>
          <span className="text-xl font-bold gradient-text">{APP_NAME}</span>
        </Link>
        <div className="flex items-center gap-6">
          <Link to="/" className="text-slate-600 font-medium hover:text-primary transition-colors">
            Home
          </Link>
          <Link to="/login" className="text-slate-600 font-medium hover:text-primary transition-colors">
            Login
          </Link>
          <Link to="/register" className="btn-primary py-2 px-4 text-sm">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 rounded-full blur-3xl -z-10" />
        
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
              Empower Your <span className="gradient-text">Business</span> <br />
              with Zionn
            </h1>
            <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
              {APP_DESCRIPTION}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register" className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center">
                Start Your Business <ArrowRight size={20} />
              </Link>
              <Link to="/about" className="px-6 py-3 rounded-xl font-medium border border-slate-200 hover:bg-slate-50 transition-colors w-full sm:w-auto text-center">
                Learn More
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-20 relative"
          >
            <div className="glass rounded-3xl p-4 shadow-2xl max-w-5xl mx-auto overflow-hidden">
              <img
                src="https://picsum.photos/seed/dashboard/1200/800"
                alt="Dashboard Preview"
                className="rounded-2xl w-full h-auto shadow-inner"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-secondary/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need to Succeed</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Zionn provides a complete ecosystem for modern businesses to thrive in the digital age.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="card group hover:-translate-y-2"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${feature.color}`}>
                  <feature.icon size={24} />
                </div>
                <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">{feature.title}</h3>
                <p className="text-slate-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <p className="text-4xl font-bold gradient-text mb-2">{stat.value}</p>
                <p className="text-slate-500 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto glass rounded-[2rem] p-12 md:p-20 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 -z-10" />
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to Scale Your Business?</h2>
          <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
            Join thousands of businesses already growing with Zionn. Start your free trial today.
          </p>
          <Link to="/register" className="btn-primary inline-flex items-center gap-2">
            Get Started Now <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-slate-100">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-xs">
              Z
            </div>
            <span className="text-lg font-bold gradient-text">{APP_NAME}</span>
          </div>
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} Zionn Platform. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link to="/terms" className="text-slate-500 hover:text-primary text-sm transition-colors">Terms</Link>
            <Link to="/privacy" className="text-slate-500 hover:text-primary text-sm transition-colors">Privacy</Link>
            <Link to="/contact" className="text-slate-500 hover:text-primary text-sm transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
