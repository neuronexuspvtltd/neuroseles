'use client';

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface AppLayoutProps {
  children: React.ReactNode;
  title: string;
  onAddLeadClick?: () => void;
  overdueCount?: number;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  title,
  onAddLeadClick,
  overdueCount = 0,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex">
      {/* Sidebar */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Header
          title={title}
          onOpenMobileMenu={() => setMobileOpen(true)}
          onAddLeadClick={onAddLeadClick}
          overdueCount={overdueCount}
        />

        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
