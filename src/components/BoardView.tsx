import React, { useMemo } from 'react';
import { useJira } from '../context/JiraContext';
import { TaskStatus, TaskType, TaskPriority } from '../types';
import { 
  Bug, 
  Bookmark, 
  CheckSquare, 
  Plus, 
  Search, 
  ArrowRight, 
  ArrowLeft,
  Calendar,
  CheckCircle2
} from 'lucide-react';

const typeIcons: Record<TaskType, React.ReactNode> = {
  'user story': <Bookmark className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />,
  'defect': <Bug className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />,
  'random task': <CheckSquare className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />,
};

const priorityBadges: Record<TaskPriority, string> = {
  low: 'text-slate-500 bg-slate-100 dark:bg-slate-800',
  medium: 'text-blue-600 bg-blue-50 dark:bg-blue-950',
  high: 'text-amber-600 bg-amber-50 dark:bg-amber-950',
  critical: 'text-rose-600 bg-rose-50 dark:bg-rose-950 font-semibold',
};

export const BoardView: React.FC = () => {
  const { 
    tasks, 
    sprints, 
    users, 
    activeSprint, 
    filters, 
    setFilters, 
    updateTaskStatus, 
    setSelectedTaskId, 
    setIsTaskModalOpen 
  } = useJira();

  const currentSprint = activeSprint || sprints[0];

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (t.sprintId !== currentSprint?.id) return false;

      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase();
        const matches = 
          t.key.toLowerCase().includes(query) ||
          t.title.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query);
        if (!matches) return false;
      }

      if (filters.taskType !== 'all' && t.taskType !== filters.taskType) return false;
      return true;
    });
  }, [tasks, currentSprint, filters]);

  const columns: { status: TaskStatus; label: string; count: number }[] = [
    { 
      status: 'draft', 
      label: 'Draft', 
      count: filteredTasks.filter(t => t.status === 'draft').length 
    },
    { 
      status: 'in progres', 
      label: 'In Progress', 
      count: filteredTasks.filter(t => t.status === 'in progres').length 
    },
    { 
      status: 'completed', 
      label: 'Completed', 
      count: filteredTasks.filter(t => t.status === 'completed').length 
    },
  ];

  const totalPoints = filteredTasks.reduce((sum, t) => sum + t.storyPoints, 0);
  const completedPoints = filteredTasks
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + t.storyPoints, 0);
  const percentDone = totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;

  return (
    <div className="space-y-5">
      {/* Minimalist Sprint Header */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              {currentSprint?.name || 'Sprint 1'}
            </span>
            <span>·</span>
            <span className="flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>{currentSprint?.startDate} — {currentSprint?.endDate}</span>
            </span>
          </div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">
            Sprint Board
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl">
            {currentSprint?.goal || 'Administer tasks, assign statuses, and monitor sprint progress.'}
          </p>
        </div>

        {/* Minimal Progress indicator & Search */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center space-x-3 bg-slate-50 dark:bg-slate-800/60 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700/60 text-xs">
            <div className="text-slate-500">
              <span className="font-semibold text-slate-900 dark:text-white">{completedPoints}</span> / {totalPoints} pts
            </div>
            <div className="w-20 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${percentDone}%` }}
              />
            </div>
            <span className="font-medium text-slate-700 dark:text-slate-300">{percentDone}%</span>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="input-board-search"
              type="text"
              placeholder="Filter board..."
              value={filters.searchQuery}
              onChange={e => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 w-48"
            />
          </div>

          <button
            id="btn-board-create-task"
            onClick={() => {
              setSelectedTaskId(null);
              setIsTaskModalOpen(true);
            }}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg shadow-xs cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* 3-Column Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {columns.map(col => {
          const colTasks = filteredTasks.filter(t => t.status === col.status);

          return (
            <div
              key={col.status}
              id={`column-${col.status.replace(/\s+/g, '-')}`}
              className="bg-slate-50/70 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800 p-3 min-h-[480px] flex flex-col"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-200/80 dark:border-slate-800 px-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {col.label}
                  </span>
                  <span className="text-[11px] font-mono font-medium px-1.5 py-0.2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-500">
                    {col.count}
                  </span>
                </div>
              </div>

              {/* Tasks List */}
              <div className="space-y-2.5 flex-1 overflow-y-auto">
                {colTasks.length === 0 ? (
                  <div className="h-32 flex items-center justify-center text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                    No tasks in {col.label}
                  </div>
                ) : (
                  colTasks.map(task => {
                    const assignee = users.find(u => u.id === task.assigneeId);

                    return (
                      <div
                        key={task.id}
                        id={`task-card-${task.id}`}
                        onClick={() => {
                          setSelectedTaskId(task.id);
                          setIsTaskModalOpen(true);
                        }}
                        className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200/90 dark:border-slate-700 p-3 shadow-2xs hover:border-blue-400 dark:hover:border-blue-500 transition-colors cursor-pointer space-y-2"
                      >
                        {/* Top: Type & Key & Priority */}
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-1.5">
                            {typeIcons[task.taskType]}
                            <span className="font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                              {task.key}
                            </span>
                          </div>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] capitalize ${priorityBadges[task.priority]}`}>
                            {task.priority}
                          </span>
                        </div>

                        {/* Title */}
                        <h4 className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-2">
                          {task.title}
                        </h4>

                        {/* Bottom: Assignee, Story points & Status Controls */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px]">
                          <div className="flex items-center space-x-2">
                            <span className="text-slate-600 dark:text-slate-400 truncate max-w-[80px]">
                              {assignee?.name || 'Admin'}
                            </span>
                            <span className="text-slate-300 dark:text-slate-600">·</span>
                            <span className="font-mono text-slate-500">
                              {task.storyPoints} pts
                            </span>
                          </div>

                          {/* Quick transition arrows */}
                          <div className="flex items-center space-x-1" onClick={e => e.stopPropagation()}>
                            {task.status === 'in progres' && (
                              <button
                                title="Move to Draft"
                                onClick={() => updateTaskStatus(task.id, 'draft')}
                                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
                              >
                                <ArrowLeft className="w-3 h-3" />
                              </button>
                            )}

                            {task.status === 'draft' && (
                              <button
                                title="Move to In Progress"
                                onClick={() => updateTaskStatus(task.id, 'in progres')}
                                className="flex items-center space-x-1 px-1.5 py-0.5 text-[11px] font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded"
                              >
                                <span>Start</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}

                            {task.status === 'in progres' && (
                              <button
                                title="Complete task"
                                onClick={() => updateTaskStatus(task.id, 'completed')}
                                className="flex items-center space-x-1 px-1.5 py-0.5 text-[11px] font-medium text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded"
                              >
                                <span>Done</span>
                                <CheckCircle2 className="w-3 h-3" />
                              </button>
                            )}

                            {task.status === 'completed' && (
                              <button
                                title="Reopen to In Progress"
                                onClick={() => updateTaskStatus(task.id, 'in progres')}
                                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
                              >
                                <ArrowLeft className="w-3 h-3" />
                              </button>
                            )}
                          </div>
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
    </div>
  );
};
