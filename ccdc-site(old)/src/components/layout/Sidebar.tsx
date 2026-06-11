'use client';

import { useState } from 'react';
import Link from 'next/link';

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  return (
    <nav className={`hidden md:flex flex-col bg-surface-container-low text-on-surface fixed left-0 top-0 h-full p-4 z-40 border-r border-surface-border transition-all duration-300 ${collapsed ? 'w-[80px]' : 'w-[260px]'}`}>
      {/* Header / Logo */}
      <div className="mb-8 px-2 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-surface-container-lowest flex items-center justify-center overflow-hidden shrink-0">
          <span className="material-symbols-outlined text-navy-vibrant text-[24px]">school</span>
        </div>
        {!collapsed && (
          <div className="logo-text overflow-hidden whitespace-nowrap">
            <h1 className="text-title-lg font-title-lg font-bold text-gold-leaf truncate">IIT Patna Portal</h1>
            <p className="text-label-sm font-label-sm text-on-primary-fixed-variant uppercase tracking-wider truncate">Career Development Centre</p>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 space-y-1 overflow-y-auto pr-2 overflow-x-hidden">
        <Link href="/student-dashboard" className={`nav-link flex items-center gap-3 bg-primary/10 text-primary rounded-xl py-3 transition-all ${collapsed ? 'justify-center px-0' : 'px-4'}`}>
          <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>dashboard</span>
          {!collapsed && <span className="text-label-md font-label-md nav-text">Dashboard</span>}
        </Link>
        <Link href="/drive-catalogue" className={`nav-link flex items-center gap-3 text-on-surface-variant py-3 hover:bg-surface-variant transition-all rounded-xl group ${collapsed ? 'justify-center px-0' : 'px-4'}`}>
          <span className="material-symbols-outlined text-[24px]">work</span>
          {!collapsed && <span className="text-label-md font-label-md nav-text">Drives</span>}
        </Link>
        <Link href="/my-profile" className={`nav-link flex items-center gap-3 text-on-surface-variant py-3 hover:bg-surface-variant transition-all rounded-xl group ${collapsed ? 'justify-center px-0' : 'px-4'}`}>
          <span className="material-symbols-outlined text-[24px]">person_search</span>
          {!collapsed && <span className="text-label-md font-label-md nav-text">Profiles</span>}
        </Link>
        <Link href="#" className={`nav-link flex items-center gap-3 text-on-surface-variant py-3 hover:bg-surface-variant transition-all rounded-xl group ${collapsed ? 'justify-center px-0' : 'px-4'}`}>
          <span className="material-symbols-outlined text-[24px]">assignment_turned_in</span>
          {!collapsed && <span className="text-label-md font-label-md nav-text">Applications</span>}
        </Link>
        <Link href="/calendar" className={`nav-link flex items-center gap-3 text-on-surface-variant py-3 hover:bg-surface-variant transition-all rounded-xl group ${collapsed ? 'justify-center px-0' : 'px-4'}`}>
          <span className="material-symbols-outlined text-[24px]">event</span>
          {!collapsed && <span className="text-label-md font-label-md nav-text">Interviews</span>}
        </Link>
        <Link href="/coordinator-dashboard" className={`nav-link flex items-center gap-3 text-on-surface-variant py-3 hover:bg-surface-variant transition-all rounded-xl group ${collapsed ? 'justify-center px-0' : 'px-4'}`}>
          <span className="material-symbols-outlined text-[24px]">admin_panel_settings</span>
          {!collapsed && <span className="text-label-md font-label-md nav-text">Coordinator DB</span>}
        </Link>
        <Link href="#" className={`nav-link flex items-center gap-3 text-on-surface-variant py-3 hover:bg-surface-variant transition-all rounded-xl group ${collapsed ? 'justify-center px-0' : 'px-4'}`}>
          <span className="material-symbols-outlined text-[24px]">settings</span>
          {!collapsed && <span className="text-label-md font-label-md nav-text">Settings</span>}
        </Link>
      </div>

      {/* CTA & Footer Tabs */}
      <div className="mt-4 pt-4 border-t border-on-primary-fixed-variant/30 space-y-2">
        {!collapsed && (
          <Link href="/jaf" className="w-full btn-gradient text-on-primary rounded-xl py-3 px-4 mb-6 text-label-md font-label-md shadow-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
            New Application
          </Link>
        )}
        <div className="pt-2">
          <Link href="#" className={`flex items-center gap-3 text-on-primary-fixed-variant py-2 hover:bg-primary-container transition-all duration-200 rounded-xl group ${collapsed ? 'justify-center px-0' : 'px-4'}`}>
            <span className="material-symbols-outlined text-[20px] group-hover:text-primary-fixed">help</span>
            {!collapsed && <span className="text-label-md font-label-md group-hover:text-primary-fixed">Support</span>}
          </Link>
          <Link href="/" className={`flex items-center gap-3 text-on-primary-fixed-variant py-2 hover:bg-primary-container transition-all duration-200 rounded-xl group ${collapsed ? 'justify-center px-0' : 'px-4'}`}>
            <span className="material-symbols-outlined text-[20px] group-hover:text-error-container">logout</span>
            {!collapsed && <span className="text-label-md font-label-md group-hover:text-error-container">Logout</span>}
          </Link>
        </div>
      </div>
      <div className="mt-auto pt-4">
        <button onClick={toggleSidebar} className="w-full flex items-center justify-center gap-3 text-on-surface-variant p-3 hover:bg-surface-variant rounded-xl transition-all">
          <span className="material-symbols-outlined">{collapsed ? 'menu' : 'menu_open'}</span>
          {!collapsed && <span className="text-label-md font-label-md nav-text">Collapse</span>}
        </button>
      </div>
    </nav>
  );
};

export default Sidebar;
