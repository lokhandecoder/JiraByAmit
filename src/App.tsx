/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { JiraProvider, useJira } from './context/JiraContext';
import { Navbar } from './components/Navbar';
import { BoardView } from './components/BoardView';
import { SprintPlanningView } from './components/SprintPlanningView';
import { ReportsView } from './components/ReportsView';
import { UsersView } from './components/UsersView';
import { UserTaskView } from './components/UserTaskView';
import { DotnetBackendView } from './components/DotnetBackendView';
import { TaskModal } from './components/TaskModal';
import { LoginView } from './components/LoginView';
import { RotateCcw, Code, X } from 'lucide-react';

const JiraDashboardContent: React.FC = () => {
  const { activeTab, resetToInitialData, currentUser, isAuthenticated } = useJira();
  const [showBackendModal, setShowBackendModal] = useState(false);

  if (!isAuthenticated) {
    return <LoginView />;
  }

  const isAdmin = currentUser.role === 'admin';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">
        {/* If user is not Admin: show only the minimalist Task workspace */}
        {!isAdmin ? (
          <UserTaskView />
        ) : (
          /* Admin views */
          <>
            {activeTab === 'board' && <BoardView />}
            {activeTab === 'planning' && <SprintPlanningView />}
            {activeTab === 'reports' && <ReportsView />}
            {activeTab === 'users' && <UsersView />}
            {activeTab === 'tasks' && <BoardView />}
          </>
        )}
      </main>

      {/* Task Creation & Edit Modal */}
      <TaskModal />

      {/* Optional .NET Backend & PostgreSQL schema modal for reference */}
      {showBackendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-4xl w-full p-5 border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center space-x-2">
                <Code className="w-4 h-4 text-blue-600" />
                <span>.NET Core 8 & PostgreSQL Architecture</span>
              </h3>
              <button
                onClick={() => setShowBackendModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-3">
              <DotnetBackendView />
            </div>
          </div>
        </div>
      )}

      {/* Minimal Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-3 px-4 sm:px-6 text-xs text-slate-400">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span>Personal Jira</span>
            <span>·</span>
            <span>{isAdmin ? 'Admin Portal' : 'Member Workspace'}</span>
          </div>

          <div className="flex items-center space-x-4">
            {isAdmin && (
              <button
                onClick={() => setShowBackendModal(true)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer text-[11px]"
              >
                .NET 8 & SQL Specs
              </button>
            )}
            <button
              id="btn-reset-data-footer"
              onClick={() => {
                if (confirm('Reset workspace to fresh Admin-only state?')) {
                  resetToInitialData();
                }
              }}
              className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer text-[11px] flex items-center space-x-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <JiraProvider>
      <JiraDashboardContent />
    </JiraProvider>
  );
}
