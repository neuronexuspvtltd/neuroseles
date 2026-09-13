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
    <header className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-8 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100/80 lg:hidden transition-colors"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">{title}</h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Interactive In-App Reminders Dropdown Bell */}
        <HeaderNotificationBell />

        {onAddLeadClick && (
          <button
            onClick={onAddLeadClick}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-700 hover:to-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm shadow-teal-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Lead</span>
          </button>
        )}
      </div>
    </header>
  );
};
