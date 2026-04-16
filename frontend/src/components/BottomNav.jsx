import React from 'react';
import { Home, Search, Users, MessageSquare, BarChart3 as AnalyticsIcon } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import clsx from 'clsx';

const NavItem = ({ icon: Icon, to, label, badgeCount }) => (
  <NavLink
    to={to}
    className={({ isActive }) => clsx(
      "flex flex-col items-center justify-center flex-1 py-1 transition-all duration-300 relative",
      isActive ? "text-sporthub-neon scale-110" : "text-sporthub-muted hover:text-white"
    )}
  >
    <div className="relative">
      <Icon className="w-5 h-5 mb-0.5" />
      {badgeCount > 0 && (
        <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[9px] font-bold min-w-[14px] h-3.5 px-0.5 rounded-full flex items-center justify-center animate-bounce shadow-[0_0_8px_rgba(239,68,68,0.4)]">
          {badgeCount > 9 ? '9+' : badgeCount}
        </span>
      )}
    </div>
    <span className="text-[9px] font-medium tracking-tight uppercase">{label}</span>
  </NavLink>
);

export const BottomNav = () => {
  const { unreadCount } = useAuth();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0B0F19]/90 backdrop-blur-xl border-t border-sporthub-border z-50 px-2 pb-safe w-full">
      <div className="flex h-16 items-center">
        <NavItem icon={Home} to="/feed" label="Feed" />
        <NavItem icon={Search} to="/search" label="Buscar" />
        <NavItem icon={Users} to="/network" label="Red" />
        <NavItem icon={MessageSquare} to="/messages" label="Chat" badgeCount={unreadCount} />
        <NavItem icon={AnalyticsIcon} to="/dashboard" label="Analítica" />
      </div>
    </nav>
  );
};
