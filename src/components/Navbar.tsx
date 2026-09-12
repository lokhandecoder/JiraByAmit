import React, { useState } from 'react';
import { useJira } from '../context/JiraContext';
import { ActiveTab, UserRole } from '../types';
import { 
  Kanban, 
  Layers, 
  BarChart3, 
  Users, 
  Plus, 
  LogOut, 
  ChevronDown,
  ShieldCheck,
  CheckSquare
} from 'lucide-react';

const roleBadge: Record<UserRole, string> = {
  admin: 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  developer: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  qa: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  product_owner: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800',
};

export const Navbar: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    currentUser, 
    setCurrentUser, 
    users, 
    setIsTaskModalOpen,
    setSelectedTaskId,
    logout 
  } = useJira();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const isAdmin = currentUser.role === 'admin';

  const adminTabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'board', label: 'Sprint Board', icon: <Kanban className="w-3.5 h-3.5" /> },
    { id: 'planning', label: 'Sprint Planning', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'reports', label: 'Progress', icon: <BarChart3 className="w-3.5 h-3.5" /> },
    { id: 'users', label: 'Team', icon: <Users className="w-3.5 h-3.5" /> },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Left: Brand + Navigation for Admin */}
          <div className="flex items-center space-x-6">
            <div 
              className="flex items-center space-x-2.5 cursor-pointer"
              onClick={() => setActiveTab(isAdmin ? 'board' : 'tasks')}
            >
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                <CheckSquare className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                Personal Jira
              </span>
            </div>

            {/* Admin Tabs */}
            {isAdmin && (
              <nav className="hidden sm:flex items-center space-x-1 pl-2">
                {adminTabs.map(tab => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      id={`nav-tab-${tab.id}`}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      {tab.icon}
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            )}
          </div>

          {/* Right: Create Task button + User Switcher */}
          <div className="flex items-center space-x-3">
            <button
              id="btn-create-task-nav"
              onClick={() => {
                setSelectedTaskId(null);
                setIsTaskModalOpen(true);
              }}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Task</span>
            </button>

            {/* User Dropdown */}
            <div className="relative">
              <button
                id="btn-user-switcher"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-2 py-1 px-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-slate-200 dark:border-slate-800 text-xs"
              >
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  className="w-5 h-5 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <span className="font-medium text-slate-800 dark:text-slate-200 hidden sm:inline">
                  {currentUser.name}
                </span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium border ${roleBadge[currentUser.role]}`}>
                  {currentUser.role === 'admin' ? 'Admin' : 'User'}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 p-2 z-40 text-xs">
                  <div className="px-2 py-1.5 border-b border-slate-100 dark:border-slate-800 mb-1">
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {currentUser.name}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {currentUser.email}
                    </div>
                  </div>

                  {/* Switch user */}
                  <div className="py-1">
                    <div className="text-[10px] uppercase font-semibold text-slate-400 px-2 py-1">
                      Switch Active User
                    </div>
                    {users.map(u => (
                      <button
                        key={u.id}
                        onClick={() => {
                          setCurrentUser(u);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                          currentUser.id === u.id
                            ? 'bg-slate-100 dark:bg-slate-800 font-semibold text-slate-900 dark:text-white'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <img
                            src={u.avatarUrl}
                            alt={u.name}
                            className="w-4 h-4 rounded-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <span className="truncate max-w-[110px]">{u.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {u.role === 'admin' ? 'Admin' : 'User'}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Sign Out */}
                  <div className="pt-1 border-t border-slate-100 dark:border-slate-800 mt-1">
                    <button
                      id="btn-logout"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center space-x-1.5 px-2 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer text-xs"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
