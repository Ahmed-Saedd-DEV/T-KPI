/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { PickersView } from './components/PickersView';
import { BranchKpisView } from './components/BranchKpisView';
import { AdminInputView } from './components/AdminInputView';
import { AdminLoginView } from './components/AdminLoginView';
import { Toast } from './components/Toast';

const MainLayout: React.FC = () => {
  const { activeTab, authLoading, isAuthenticated } = useApp();

  const renderView = () => {
    if (activeTab === 'dashboard') {
      return <DashboardView />;
    }

    if (activeTab === 'pickers') {
      return <PickersView />;
    }

    if (activeTab === 'branch-kpis') {
      return <BranchKpisView />;
    }

    if (activeTab === 'admin') {
      if (authLoading) {
        return (
          <div className="flex flex-1 items-center justify-center bg-[#0B1120] text-[#94A3B8]">
            Validating session...
          </div>
        );
      }

      return isAuthenticated ? <AdminInputView /> : <AdminLoginView />;
    }

    return null;
  };

  return (
    <div className="bg-[#0B1120] text-[#F8FAFC] min-h-screen flex antialiased">
      <Sidebar />
      <div className="lg:pl-64 flex-1 flex flex-col min-h-screen min-w-0">
        {renderView()}
      </div>
      <Toast />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
