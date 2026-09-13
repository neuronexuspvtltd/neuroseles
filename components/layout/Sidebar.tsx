'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  CalendarClock,
  Presentation,
  FileText,
  Building2,
  Settings,
  UserCheck,
  X,
  LogOut,
  User,
  ChevronUp,
  Shield,
} from 'lucide-react';
import { hasPermission, Permission } from '@/lib/auth/permissions';

interface SidebarProps {
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen = false, setMobileOpen }) => {
  const pathname = usePathname();
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
      }
    } catch (err) {
      console.error('Failed to load sidebar user details:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const allNavItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      active: pathname === '/' || pathname === '/dashboard',
      permission: 'dashboard.view' as Permission,
    },
    {
      name: 'Leads',
      href: '/leads',
      icon: Users,
      active: pathname.startsWith('/leads'),
      permission: 'leads.view' as Permission,
    },
    {
      name: 'Follow-ups',
      href: '/follow-ups',
      icon: CalendarClock,
      active: pathname.startsWith('/follow-ups'),
      permission: 'followups.view' as Permission,
    },
    {
      name: 'Demos',
      href: '/demos',
      icon: Presentation,
      active: pathname.startsWith('/demos'),
      permission: 'demos.view' as Permission,
    },
    {
      name: 'Quotations',
      href: '/quotations',
      icon: FileText,
      active: pathname.startsWith('/quotations'),
      permission: 'quotations.view' as Permission,
    },
    {
      name: 'Clients',
      href: '/clients',
      icon: Building2,
      active: pathname.startsWith('/clients'),
      permission: 'clients.view' as Permission,
    },
    {
      name: 'Users',
      href: '/users',
      icon: UserCheck,
      active: pathname.startsWith('/users'),
      permission: 'users.view' as Permission,
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
      active: pathname.startsWith('/settings'),
      permission: 'settings.view' as Permission,
    },
  ];

  // Filter navigation items based on current user permissions
  const navItems = allNavItems.filter((item) => {
    if (!currentUser) return true; // Show baseline while loading
    return hasPermission(currentUser, item.permission);
  });

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileOpen && setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white shadow-xs">
          <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/40 p-1 flex items-center justify-center shrink-0 shadow-xs">
              <img
                src="/icon.png"
                alt="N"
                className="h-full w-full object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-white text-sm leading-tight tracking-wider uppercase">
                NEURONEXUS
              </span>
              <span className="text-[9px] font-bold tracking-widest text-teal-400 uppercase leading-none mt-0.5">
                Next-Gen CRM
              </span>
            </div>
          </Link>
          {setMobileOpen && (
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 no-scrollbar">
          <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Main Menu
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileOpen && setMobileOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                  item.active
                    ? 'bg-gradient-to-r from-teal-500/10 via-indigo-500/10 to-indigo-500/5 text-teal-700 border-l-4 border-teal-600 shadow-2xs font-bold'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                      item.active ? 'text-teal-600' : 'text-slate-400'
                    }`}
                  />
                  <span>{item.name}</span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Footer User Profile & Logout Dropdown Section */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/70 relative">
          {userDropdownOpen && (
            <div className="absolute bottom-full left-3 right-3 mb-2 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-xl p-1.5 space-y-0.5 animate-in fade-in slide-in-from-bottom-2 duration-150 z-50">
              <Link
                href="/profile"
                onClick={() => setUserDropdownOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100/80 rounded-xl transition-colors"
              >
                <User className="w-4 h-4 text-teal-600" />
                <span>My Profile</span>
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50/80 rounded-xl transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-rose-500" />
                <span>Sign Out</span>
              </button>
            </div>
          )}

          <button
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-200/60 transition-all text-left group cursor-pointer border border-transparent hover:border-slate-200"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-teal-600 to-indigo-600 flex items-center justify-center text-xs font-black text-white shadow-xs">
                  {currentUser?.name ? currentUser.name.substring(0, 2).toUpperCase() : 'AD'}
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {currentUser?.name || 'Loading...'}
                </p>
                <div className="flex items-center gap-1 text-[10px] font-bold text-teal-600 uppercase tracking-tight">
                  <Shield className="w-3 h-3 text-teal-600" />
                  <span>{currentUser?.role || 'User'}</span>
                </div>
              </div>
            </div>
            <ChevronUp
              className={`w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-transform duration-200 ${
                userDropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>
      </aside>
    </>
  );
};
