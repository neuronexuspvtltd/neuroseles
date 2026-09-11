'use client';

import React from 'react';
import { Menu, Plus } from 'lucide-react';
import { HeaderNotificationBell } from './HeaderNotificationBell';

interface HeaderProps {
  title: string;
  onOpenMobileMenu?: () => void;
  onAddLeadClick?: () => void;
  overdueCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  onOpenMobileMenu,
  onAddLeadClick,
}) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 lg:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 lg:hidden"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Interactive In-App Reminders Dropdown Bell */}
        <HeaderNotificationBell />

        {onAddLeadClick && (
          <button
            onClick={onAddLeadClick}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Lead</span>
          </button>
        )}
      </div>
    </header>
  );
};
