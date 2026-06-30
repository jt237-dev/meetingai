import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  UploadCloud,
  Users,
  Settings,
  Menu,
  X,
  Sparkles,
  Bell,
  Search,
  FileText,
  BarChart3,
  CheckSquare } from
'lucide-react';
import { AIAssistant } from './AIAssistant';
interface LayoutProps {
  children: React.ReactNode;
}
export function Layout({ children }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navItems = [
  {
    path: '/',
    label: 'Tableau de bord',
    icon: LayoutDashboard
  },
  {
    path: '/meetings',
    label: 'Réunions',
    icon: Calendar
  },
  {
    path: '/import',
    label: 'Importer',
    icon: UploadCloud
  },
  {
    path: '/participants',
    label: 'Participants',
    icon: Users
  },
  {
    path: '/tasks',
    label: 'Tâches & Décisions',
    icon: CheckSquare
  },
  {
    path: '/analytics',
    label: 'Analytiques',
    icon: BarChart3
  },
  {
    path: '/exports',
    label: 'Exports',
    icon: FileText
  },
  {
    path: '/settings',
    label: 'Paramètres',
    icon: Settings
  }];

  return (
    <div className="flex h-screen bg-[#f5f5f5] overflow-hidden">
      {/* Mobile sidebar backdrop */}
      {isMobileMenuOpen &&
      <div
        className="fixed inset-0 z-20 bg-black/50 lg:hidden"
        onClick={() => setIsMobileMenuOpen(false)} />

      }

      {/* Sidebar */}
      <aside
        className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-[#333333] text-white transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        
        <div className="flex items-center h-16 px-6 border-b border-white/10">
          <Link
            to="/"
            className="flex items-center gap-2 font-bold text-xl tracking-tight">
            
            <div className="w-8 h-8 bg-[#ee3124] rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            MeetSense AI
          </Link>
        </div>

        <div className="p-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 px-3">
            Menu
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
              location.pathname === item.path ||
              item.path !== '/' && location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`
                    relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                    ${isActive ? 'text-white bg-white/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}
                  `}>
                  
                  {isActive &&
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#ee3124] rounded-r-full" />
                  }
                  <Icon
                    className={`w-5 h-5 ${isActive ? 'text-[#ee3124]' : 'text-gray-400'}`} />
                  
                  {item.label}
                </Link>);

            })}
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 py-2">
            <img
              src="https://i.pravatar.cc/150?u=admin"
              alt="User avatar"
              className="w-9 h-9 rounded-full border border-white/20" />
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">
                Alex Rivera
              </p>
              <p className="text-xs text-gray-400 truncate">
                alex@enterprise.com
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 z-10">
          <div className="flex items-center flex-1">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 mr-2 text-[#333333] hover:bg-gray-100 rounded-md">
              
              <Menu className="w-5 h-5" />
            </button>

            <div className="max-w-md w-full hidden sm:block relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#ee3124]/20 focus:border-[#ee3124] sm:text-sm transition-all"
                placeholder="Rechercher réunions, décisions, participants..." />
              
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 text-[#333333] hover:bg-gray-100 rounded-full transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-[#ee3124] ring-2 ring-white" />
            </button>
            <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>
            <div className="hidden sm:flex items-center gap-2 text-sm font-bold text-[#333333]">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              Teams connecté
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-[#f5f5f5]">{children}</main>
      </div>

      {/* Global AI Assistant */}
      <AIAssistant />
    </div>);

}