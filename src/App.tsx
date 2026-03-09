import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { authApi } from './services/api';
import { User } from './types';

// Components
import Layout from './components/Layout';
import LandingPage from './components/LandingPage';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import BusinessRegistration from './components/BusinessRegistration';
import ProductManagement from './components/ProductManagement';
import Negotiations from './components/Negotiations';
import Marketplace from './components/Marketplace';
import Settings from './components/Settings';
import ErrorBoundary from './components/ErrorBoundary';

import { AuthProvider, useAuth } from './context/AuthContext';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-slate-500 font-medium animate-pulse">Loading Zionn...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={user ? <Navigate to="/dashboard" /> : <LandingPage />} />
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Auth type="login" />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Auth type="register" />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            user ? (
              <Layout user={user}>
                <Dashboard />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/admin"
          element={
            user?.role === 'admin' ? (
              <Layout user={user}>
                <AdminDashboard />
              </Layout>
            ) : (
              <Navigate to="/dashboard" />
            )
          }
        />
        <Route
          path="/register-business"
          element={
            user ? (
              <Layout user={user}>
                <BusinessRegistration />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/my-business"
          element={
            user ? (
              <Layout user={user}>
                <ProductManagement />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/negotiations"
          element={
            user ? (
              <Layout user={user}>
                <Negotiations />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/marketplace"
          element={
            user ? (
              <Layout user={user}>
                <Marketplace />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/settings"
          element={
            user ? (
              <Layout user={user}>
                <Settings />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}
