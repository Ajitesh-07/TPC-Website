"use client";

import { useState } from "react";
import Link from "next/link";
import { SIDEBAR_ITEMS } from "@/data/navigation";

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <nav
      className={`hidden md:flex flex-col bg-surface-container-low text-on-surface fixed left-0 top-0 h-full p-4 z-40 border-r border-surface-border transition-all duration-300 ${
        collapsed ? "w-[80px]" : "w-[260px]"
      }`}
    >
      {/* Header / Logo */}
      <div className="mb-8 px-2 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-surface-container-lowest flex items-center justify-center overflow-hidden shrink-0">
          <span className="material-symbols-outlined text-navy-vibrant text-[24px]">
            school
          </span>
        </div>
        {!collapsed && (
          <div className="logo-text overflow-hidden whitespace-nowrap">
            <h1 className="text-title-lg font-title-lg font-bold text-gold-leaf truncate">
              IIT Patna Portal
            </h1>
            <p className="text-label-sm font-label-sm text-on-primary-fixed-variant uppercase tracking-wider truncate">
              Career Development Centre
            </p>
          </div>
        )}
      </div>

      {/* Navigation links */}
      <div className="flex-1 space-y-1 overflow-y-auto pr-2 overflow-x-hidden">
        {SIDEBAR_ITEMS.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`nav-link flex items-center gap-3 py-3 transition-all rounded-xl ${
              item.active
                ? "bg-primary/10 text-primary"
                : "text-on-surface-variant hover:bg-surface-variant group"
            } ${collapsed ? "justify-center px-0" : "px-4"}`}
          >
            <span
              className="material-symbols-outlined text-[24px]"
              style={item.active ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              {item.icon}
            </span>
            {!collapsed && (
              <span className="text-label-md font-label-md nav-text">
                {item.label}
              </span>
            )}
          </Link>
        ))}
      </div>

      {/* CTA & footer tabs */}
      <div className="mt-4 pt-4 border-t border-on-primary-fixed-variant/30 space-y-2">
        {!collapsed && (
          <Link
            href="/jaf"
            className="w-full btn-gradient text-on-primary rounded-xl py-3 px-4 mb-6 text-label-md font-label-md shadow-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            New Application
          </Link>
        )}
        <div className="pt-2">
          <Link
            href="#"
            className={`flex items-center gap-3 text-on-primary-fixed-variant py-2 hover:bg-primary-container transition-all duration-200 rounded-xl group ${
              collapsed ? "justify-center px-0" : "px-4"
            }`}
          >
            <span className="material-symbols-outlined text-[20px] group-hover:text-primary-fixed">
              help
            </span>
            {!collapsed && (
              <span className="text-label-md font-label-md group-hover:text-primary-fixed">
                Support
              </span>
            )}
          </Link>
          <Link
            href="/"
            className={`flex items-center gap-3 text-on-primary-fixed-variant py-2 hover:bg-primary-container transition-all duration-200 rounded-xl group ${
              collapsed ? "justify-center px-0" : "px-4"
            }`}
          >
            <span className="material-symbols-outlined text-[20px] group-hover:text-error-container">
              logout
            </span>
            {!collapsed && (
              <span className="text-label-md font-label-md group-hover:text-error-container">
                Logout
              </span>
            )}
          </Link>
        </div>
      </div>
      <div className="mt-auto pt-4">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-3 text-on-surface-variant p-3 hover:bg-surface-variant rounded-xl transition-all"
        >
          <span className="material-symbols-outlined">
            {collapsed ? "menu" : "menu_open"}
          </span>
          {!collapsed && (
            <span className="text-label-md font-label-md nav-text">Collapse</span>
          )}
        </button>
      </div>
    </nav>
  );
};

export default Sidebar;
