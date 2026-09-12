import React, { useState } from 'react';
import { useJira } from '../context/JiraContext';
import { TaskType } from '../types';
import { 
  Play, 
  CheckCircle, 
  Plus, 
  Calendar, 
  Bug, 
  Bookmark, 
  CheckSquare, 
  X
} from 'lucide-react';

const taskTypeIcon: Record<TaskType, React.ReactNode> = {
  'defect': <Bug className="w-3.5 h-3.5 text-rose-600" />,
  'user story': <Bookmark className="w-3.5 h-3.5 text-emerald-600" />,
  'random task': <CheckSquare className="w-3.5 h-3.5 text-blue-600" />,
};

const statusBadgeColors: Record<string, string> = {
  'draft': 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  'in progres': 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  'completed': 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
};

export const SprintPlanningView: React.FC = () => {
  const { 
    sprints, 
    tasks, 
    users, 
    createSprint, 
    startSprint, 
    completeSprint, 
    updateTask, 
    setSelectedTaskId, 
    setIsTaskModalOpen 
  } = useJira();

  const [isNewSprintModalOpen, setIsNewSprintModalOpen] = useState(false);
  const [newSprintName, setNewSprintName] = useState('');
  const [newSprintGoal, setNewSprintGoal] = useState('');
  const [newSprintStart, setNewSprintStart] = useState('2026-10-01');
  const [newSprintEnd, setNewSprintEnd] = useState('2026-10-15');

  const handleCreateSprint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSprintName.trim()) return;

    createSprint({
      name: newSprintName.trim(),
      goal: newSprintGoal.trim() || 'Deliver committed sprint tasks.',
      startDate: newSprintStart,
      endDate: newSprintEnd,
      status: 'planning',
    });

    setNewSprintName('');
    setNewSprintGoal('');
    setIsNewSprintModalOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">
            Sprint Planning
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Administer sprint cadences, capacity, and task allocations.
          </p>
        </div>

        <button
          id="btn-new-sprint"
          onClick={() => setIsNewSprintModalOpen(true)}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg shadow-xs cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Sprint</span>
        </button>
      </div>

      {/* Sprints List */}
      <div className="space-y-4">
        {sprints.map(sprint => {
          const sprintTasks = tasks.filter(t => t.sprintId === sprint.id);
          const totalPoints = sprintTasks.reduce((sum, t) => sum + t.storyPoints, 0);
          const completedPoints = sprintTasks
            .filter(t => t.status === 'completed')
            .reduce((sum, t) => sum + t.storyPoints, 0);

          const isCurrentActive = sprint.status === 'in_progress';
          const isPlanning = sprint.status === 'planning';

          return (
            <div 
              key={sprint.id}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs"
            >
              {/* Sprint Bar */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                      {sprint.name}
                    </h2>
                    {isCurrentActive && (
                      <span className="px-2 py-0.2 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        Active
                      </span>
                    )}
                    {isPlanning && (
                      <span className="px-2 py-0.2 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        Planning
                      </span>
                    )}
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs text-slate-500 flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{sprint.startDate} to {sprint.endDate}</span>
                    </span>
                  </div>
                  {sprint.goal && (
                    <p className="text-xs text-slate-500 italic">
                      Goal: {sprint.goal}
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-3 text-xs shrink-0">
                  <span className="text-slate-500">
                    <strong className="text-slate-800 dark:text-slate-200">{sprintTasks.length}</strong> tasks ({completedPoints}/{totalPoints} pts)
                  </span>

                  {isPlanning && (
                    <button
                      onClick={() => startSprint(sprint.id)}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-medium cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Start</span>
                    </button>
                  )}

                  {isCurrentActive && (
                    <button
                      onClick={() => completeSprint(sprint.id)}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-medium cursor-pointer"
                    >
                      <CheckCircle className="w-3 h-3" />
                      <span>Complete</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Sprint Tasks */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {sprintTasks.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400">
                    No tasks assigned to this sprint.
                  </div>
                ) : (
                  sprintTasks.map(task => {
                    const assignee = users.find(u => u.id === task.assigneeId);

                    return (
                      <div
                        key={task.id}
                        onClick={() => {
                          setSelectedTaskId(task.id);
                          setIsTaskModalOpen(true);
                        }}
                        className="px-4 py-2.5 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs transition-colors cursor-pointer"
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          {taskTypeIcon[task.taskType]}
                          <span className="font-mono text-slate-500 text-[11px]">
                            {task.key}
                          </span>
                          <span className="font-medium text-slate-900 dark:text-white truncate max-w-md">
                            {task.title}
                          </span>
                          <span className={`px-1.5 py-0.2 rounded text-[10px] capitalize ${statusBadgeColors[task.status]}`}>
                            {task.status}
                          </span>
                        </div>

                        <div className="flex items-center space-x-3 shrink-0" onClick={e => e.stopPropagation()}>
                          <span className="text-slate-500 text-[11px]">
                            {assignee?.name || 'Admin'}
                          </span>
                          <span className="font-mono text-slate-400 text-[11px]">
                            {task.storyPoints} pts
                          </span>

                          {/* Reassign Sprint dropdown */}
                          <select
                            value={task.sprintId}
                            onChange={e => updateTask(task.id, { sprintId: e.target.value })}
                            className="px-1.5 py-0.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[11px]"
                          >
                            {sprints.map(s => (
                              <option key={s.id} value={s.id}>
                                Move to {s.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: New Sprint */}
      {isNewSprintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-5 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Create New Sprint
              </h3>
              <button
                onClick={() => setIsNewSprintModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSprint} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Sprint Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sprint 2"
                  value={newSprintName}
                  onChange={e => setNewSprintName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Goal
                </label>
                <input
                  type="text"
                  placeholder="What is the objective of this sprint?"
                  value={newSprintGoal}
                  onChange={e => setNewSprintGoal(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newSprintStart}
                    onChange={e => setNewSprintStart(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newSprintEnd}
                    onChange={e => setNewSprintEnd(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewSprintModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-xs"
                >
                  Create Sprint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
