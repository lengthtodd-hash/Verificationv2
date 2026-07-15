/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/AuthContext';
import { SecureAccess } from './components/SecureAccess';
import { AdminLogin } from './components/AdminLogin';
import { Layout } from './components/Layout';
import { EmployeeDashboard } from './components/EmployeeDashboard';
import { AdminDashboard } from './components/AdminDashboard';

// Protected Route wrappers
const RequireAuth = ({ children, role }: { children: React.ReactElement, role?: 'employee' | 'admin' }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/employee'} replace />;
  }
  
  return children;
};

// Root redirect based on auth status
const RootRedirect = () => {
  const { user } = useAuth();
  if (!user) return <SecureAccess />;
  return <Navigate to={user.role === 'admin' ? '/admin' : '/employee'} replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          
          <Route path="/" element={<Layout />}>
            <Route path="employee" element={
              <RequireAuth role="employee">
                <EmployeeDashboard />
              </RequireAuth>
            } />
            
            <Route path="admin" element={
              <RequireAuth role="admin">
                <AdminDashboard />
              </RequireAuth>
            } />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
