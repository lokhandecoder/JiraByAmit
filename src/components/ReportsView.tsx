import React from 'react';
import { useJira } from '../context/JiraContext';
import { 
  CheckCircle2, 
  Clock, 
  Layers, 
  AlertCircle 
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { tasks, activeSprint, sprints } = useJira();
  const currentSprint = activeSprint || sprints[0];

  const sprintTasks = tasks.filter(t => t.sprintId === currentSprint?.id);

  const totalPoints = sprintTasks.reduce((sum, t) => sum + t.storyPoints, 0);
  const completedTasks = sprintTasks.filter(t => t.status === 'completed');
  const completedPoints = completedTasks.reduce((sum, t) => sum + t.storyPoints, 0);
  const inProgressTasks = sprintTasks.filter(t => t.status === 'in progres');
  const inProgressPoints = inProgressTasks.reduce((sum, t) => sum + t.storyPoints, 0);
  const draftTasks = sprintTasks.filter(t => t.status === 'draft');
  const draftPoints = draftTasks.reduce((sum, t) => sum + t.storyPoints, 0);

  const percent = totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;

  // Task type breakdown
  const stories = sprintTasks.filter(t => t.taskType === 'user story');
  const defects = sprintTasks.filter(t => t.taskType === 'defect');
  const randomTasks = sprintTasks.filter(t => t.taskType === 'random task');

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
        <h1 className="text-lg font-bold text-slate-900 dark:text-white">
          Sprint Progress
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Progress and capacity metrics for {currentSprint?.name || 'Active Sprint'}.
        </p>

        {/* Big clean progress bar */}
        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Overall Sprint Completion
            </span>
            <span className="font-bold text-slate-900 dark:text-white">
              {percent}% ({completedPoints} / {totalPoints} story pts)
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden flex">
            <div 
              className="bg-emerald-500 h-full transition-all duration-500" 
              style={{ width: `${percent}%` }}
              title={`Completed: ${completedPoints} pts`}
            />
            <div 
              className="bg-blue-500 h-full transition-all duration-500" 
              style={{ width: `${totalPoints > 0 ? (inProgressPoints / totalPoints) * 100 : 0}%` }}
              title={`In Progress: ${inProgressPoints} pts`}
            />
          </div>
          <div className="flex items-center space-x-4 text-[11px] text-slate-500 pt-1">
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Completed ({completedPoints} pts)</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span>In Progress ({inProgressPoints} pts)</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700" />
              <span>Draft / Remaining ({draftPoints} pts)</span>
            </span>
          </div>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="text-xs text-slate-500 mb-1">Draft Backlog</div>
          <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">
            {draftTasks.length}
          </div>
          <div className="text-xs text-slate-400 mt-1">{draftPoints} story points</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="text-xs text-blue-600 dark:text-blue-400 mb-1">In Progress</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {inProgressTasks.length}
          </div>
          <div className="text-xs text-slate-400 mt-1">{inProgressPoints} story points</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">Completed</div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {completedTasks.length}
          </div>
          <div className="text-xs text-slate-400 mt-1">{completedPoints} story points</div>
        </div>
      </div>

      {/* Composition by Task Type */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
          Sprint Scope by Type
        </h3>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
            <div className="text-xs font-medium text-emerald-800 dark:text-emerald-200">User Stories</div>
            <div className="text-xl font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">
              {stories.length}
            </div>
            <div className="text-[11px] text-emerald-600/70 mt-0.5">
              {stories.reduce((s, t) => s + t.storyPoints, 0)} pts
            </div>
          </div>

          <div className="p-3 rounded-lg bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40">
            <div className="text-xs font-medium text-rose-800 dark:text-rose-200">Defects</div>
            <div className="text-xl font-bold text-rose-700 dark:text-rose-300 mt-0.5">
              {defects.length}
            </div>
            <div className="text-[11px] text-rose-600/70 mt-0.5">
              {defects.reduce((s, t) => s + t.storyPoints, 0)} pts
            </div>
          </div>

          <div className="p-3 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40">
            <div className="text-xs font-medium text-blue-800 dark:text-blue-200">Tasks</div>
            <div className="text-xl font-bold text-blue-700 dark:text-blue-300 mt-0.5">
              {randomTasks.length}
            </div>
            <div className="text-[11px] text-blue-600/70 mt-0.5">
              {randomTasks.reduce((s, t) => s + t.storyPoints, 0)} pts
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
