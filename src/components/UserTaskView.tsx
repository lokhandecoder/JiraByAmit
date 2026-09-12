import React, { useState } from 'react';
import { useJira } from '../context/JiraContext';
import { TaskType, TaskPriority } from '../types';
import { 
  Plus, 
  Search, 
  CheckSquare, 
  Bug, 
  Bookmark, 
  Clock, 
  Filter, 
  AlertCircle,
  Calendar,
  Layers
} from 'lucide-react';

const typeIcons: Record<TaskType, React.ReactNode> = {
  'user story': <Bookmark className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />,
  'defect': <Bug className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />,
  'random task': <CheckSquare className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />,
};

const typeLabels: Record<TaskType, string> = {
  'user story': 'User Story',
  'defect': 'Defect',
  'random task': 'Task',
};

const statusStyles = {
  'draft': 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  'in progres': 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  'completed': 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
};

const statusDisplayLabels = {
  'draft': 'Draft',
  'in progres': 'In Progress',
  'completed': 'Completed',
};

const priorityStyles: Record<TaskPriority, string> = {
  low: 'text-slate-500 bg-slate-100 dark:bg-slate-800',
  medium: 'text-blue-600 bg-blue-50 dark:bg-blue-950',
  high: 'text-amber-600 bg-amber-50 dark:bg-amber-950',
  critical: 'text-rose-600 bg-rose-50 dark:bg-rose-950 font-semibold',
};

export const UserTaskView: React.FC = () => {
  const { 
    tasks, 
    currentUser, 
    sprints,
    setIsTaskModalOpen, 
    setSelectedTaskId 
  } = useJira();

  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<TaskType | 'all'>('all');

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = 
      task.title.toLowerCase().includes(search.toLowerCase()) ||
      task.key.toLowerCase().includes(search.toLowerCase()) ||
      task.description.toLowerCase().includes(search.toLowerCase());
    
    const matchesType = selectedType === 'all' || task.taskType === selectedType;

    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      {/* Simple Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Tasks
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Create and view your tasks. Sprint assignments and planning are managed by the administrator.
          </p>
        </div>

        <button
          id="btn-user-create-task"
          onClick={() => {
            setSelectedTaskId(null);
            setIsTaskModalOpen(true);
          }}
          className="inline-flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-medium rounded-lg shadow-xs transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create Task</span>
        </button>
      </div>

      {/* Simple Controls */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="input-user-task-search"
            type="text"
            placeholder="Search tasks by title or key..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Filter Type Pills */}
        <div className="flex items-center space-x-1 self-start sm:self-auto overflow-x-auto pb-1 sm:pb-0">
          {(['all', 'user story', 'defect', 'random task'] as const).map(type => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors whitespace-nowrap cursor-pointer ${
                selectedType === type
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {type === 'all' ? 'All Types' : typeLabels[type]}
            </button>
          ))}
        </div>
      </div>

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto mb-3">
            <CheckSquare className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            {search || selectedType !== 'all' ? 'No matching tasks' : 'No tasks created yet'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-4">
            {search || selectedType !== 'all'
              ? 'Try adjusting your search query or filter to see results.'
              : 'Start by creating your first task. It will automatically be assigned to the active sprint.'}
          </p>
          <button
            onClick={() => {
              setSelectedTaskId(null);
              setIsTaskModalOpen(true);
            }}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Task</span>
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden shadow-xs">
          {filteredTasks.map(task => {
            const sprint = sprints.find(s => s.id === task.sprintId);
            return (
              <div
                key={task.id}
                id={`task-row-${task.id}`}
                onClick={() => {
                  setSelectedTaskId(task.id);
                  setIsTaskModalOpen(true);
                }}
                className="p-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start space-x-3 min-w-0">
                  <div className="mt-0.5 shrink-0">
                    {typeIcons[task.taskType]}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400">
                        {task.key}
                      </span>
                      <h4 className="text-sm font-medium text-slate-900 dark:text-white truncate">
                        {task.title}
                      </h4>
                    </div>
                    {task.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                        {task.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0 self-start sm:self-auto text-xs">
                  {/* Priority */}
                  <span className={`px-2 py-0.5 rounded text-[11px] capitalize ${priorityStyles[task.priority]}`}>
                    {task.priority}
                  </span>

                  {/* Story Points */}
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[11px] font-mono" title="Story points">
                    {task.storyPoints} pts
                  </span>

                  {/* Sprint badge */}
                  {sprint && (
                    <span className="hidden md:inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-[11px]">
                      <Layers className="w-3 h-3 text-slate-400" />
                      <span>{sprint.name}</span>
                    </span>
                  )}

                  {/* Status */}
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${statusStyles[task.status]}`}>
                    {statusDisplayLabels[task.status]}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Discreet footer notice */}
      <div className="text-center text-[11px] text-slate-400 dark:text-slate-500 pt-2">
        Sprint cycles, boards, and progress velocity are managed by the administrator.
      </div>
    </div>
  );
};
