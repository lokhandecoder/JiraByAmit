import React, { useState, useEffect } from 'react';
import { useJira } from '../context/JiraContext';
import { TaskStatus, TaskType, TaskPriority } from '../types';
import { 
  X, 
  Bug, 
  Bookmark, 
  CheckSquare, 
  Trash2
} from 'lucide-react';

export const TaskModal: React.FC = () => {
  const { 
    isTaskModalOpen, 
    setIsTaskModalOpen, 
    selectedTaskId, 
    setSelectedTaskId, 
    tasks, 
    users, 
    sprints, 
    activeSprint, 
    currentUser,
    createTask, 
    updateTask, 
    deleteTask 
  } = useJira();

  const selectedTask = selectedTaskId ? tasks.find(t => t.id === selectedTaskId) : null;
  const isEditing = Boolean(selectedTask);
  const isAdmin = currentUser.role === 'admin';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [taskType, setTaskType] = useState<TaskType>('user story');
  const [status, setStatus] = useState<TaskStatus>('draft');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [sprintId, setSprintId] = useState<string>('');
  const [storyPoints, setStoryPoints] = useState<number>(3);

  useEffect(() => {
    if (selectedTask) {
      setTitle(selectedTask.title);
      setDescription(selectedTask.description);
      setTaskType(selectedTask.taskType);
      setStatus(selectedTask.status);
      setPriority(selectedTask.priority);
      setAssigneeId(selectedTask.assigneeId);
      setSprintId(selectedTask.sprintId);
      setStoryPoints(selectedTask.storyPoints);
    } else {
      setTitle('');
      setDescription('');
      setTaskType('user story');
      setStatus('draft');
      setPriority('medium');
      setAssigneeId(currentUser.id || users[0]?.id || '');
      setSprintId(activeSprint?.id || sprints[0]?.id || '');
      setStoryPoints(3);
    }
  }, [selectedTask, users, sprints, activeSprint, currentUser, isTaskModalOpen]);

  if (!isTaskModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const assignedSprint = sprintId || activeSprint?.id || sprints[0]?.id || 'sprint-1';
    const assignedUser = assigneeId || currentUser.id || users[0]?.id || 'user-admin';

    if (isEditing && selectedTask) {
      updateTask(selectedTask.id, {
        title: title.trim(),
        description: description.trim(),
        taskType,
        status: isAdmin ? status : selectedTask.status,
        priority,
        assigneeId: isAdmin ? assignedUser : selectedTask.assigneeId,
        sprintId: isAdmin ? assignedSprint : selectedTask.sprintId,
        storyPoints,
      });
    } else {
      createTask({
        title: title.trim(),
        description: description.trim(),
        taskType,
        status: 'draft',
        priority,
        assigneeId: assignedUser,
        sprintId: assignedSprint,
        storyPoints,
      });
    }

    setIsTaskModalOpen(false);
    setSelectedTaskId(null);
  };

  const handleDelete = () => {
    if (selectedTask && confirm(`Delete task "${selectedTask.title}"?`)) {
      deleteTask(selectedTask.id);
      setIsTaskModalOpen(false);
      setSelectedTaskId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-100">
      <div className="bg-white dark:bg-slate-900 rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            {isEditing && (
              <span className="text-xs font-mono font-medium px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded">
                {selectedTask?.key}
              </span>
            )}
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              {isEditing ? 'Task Details' : 'Create Task'}
            </h2>
          </div>

          <button
            onClick={() => {
              setIsTaskModalOpen(false);
              setSelectedTaskId(null);
            }}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Task Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Title */}
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Title <span className="text-rose-500">*</span>
            </label>
            <input
              id="input-task-title"
              type="text"
              required
              placeholder="What needs to be done?"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Description
            </label>
            <textarea
              id="input-task-description"
              rows={3}
              placeholder="Add details, acceptance criteria, or notes..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 leading-relaxed"
            />
          </div>

          {/* Task Type */}
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Task Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                id="type-btn-story"
                onClick={() => setTaskType('user story')}
                className={`flex items-center justify-center space-x-1.5 p-2 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                  taskType === 'user story'
                    ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5 text-emerald-600" />
                <span>User Story</span>
              </button>

              <button
                type="button"
                id="type-btn-defect"
                onClick={() => setTaskType('defect')}
                className={`flex items-center justify-center space-x-1.5 p-2 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                  taskType === 'defect'
                    ? 'border-rose-600 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Bug className="w-3.5 h-3.5 text-rose-600" />
                <span>Defect</span>
              </button>

              <button
                type="button"
                id="type-btn-random"
                onClick={() => setTaskType('random task')}
                className={`flex items-center justify-center space-x-1.5 p-2 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                  taskType === 'random task'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-200'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
                <span>Task</span>
              </button>
            </div>
          </div>

          {/* Priority & Story Points */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Priority
              </label>
              <select
                id="select-task-priority"
                value={priority}
                onChange={e => setPriority(e.target.value as TaskPriority)}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Story Points
              </label>
              <select
                id="select-task-points"
                value={storyPoints}
                onChange={e => setStoryPoints(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value={1}>1 pt</option>
                <option value={2}>2 pts</option>
                <option value={3}>3 pts</option>
                <option value={5}>5 pts</option>
                <option value={8}>8 pts</option>
              </select>
            </div>
          </div>

          {/* Admin-only controls: Status, Assignee, Sprint */}
          {isAdmin ? (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Admin Controls
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Status</label>
                  <select
                    id="select-task-status"
                    value={status}
                    onChange={e => setStatus(e.target.value as TaskStatus)}
                    className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  >
                    <option value="draft">Draft</option>
                    <option value="in progres">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Assignee</label>
                  <select
                    id="select-task-assignee"
                    value={assigneeId}
                    onChange={e => setAssigneeId(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  >
                    {users.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Sprint</label>
                  <select
                    id="select-task-sprint"
                    value={sprintId}
                    onChange={e => setSprintId(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  >
                    {sprints.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ) : (
            /* Regular user info */
            <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg text-[11px] text-slate-500 dark:text-slate-400">
              Assigned automatically to active sprint: <span className="font-semibold text-slate-700 dark:text-slate-300">{activeSprint?.name || 'Sprint 1'}</span>. Status will start in <span className="font-semibold text-slate-700 dark:text-slate-300">Draft</span>.
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
            {isEditing && isAdmin ? (
              <button
                type="button"
                id="btn-delete-task"
                onClick={handleDelete}
                className="inline-flex items-center space-x-1 text-xs text-rose-600 hover:text-rose-700 p-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            ) : <div />}

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => {
                  setIsTaskModalOpen(false);
                  setSelectedTaskId(null);
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="btn-save-task"
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium rounded-lg shadow-xs transition-colors cursor-pointer text-xs"
              >
                {isEditing ? 'Save Changes' : 'Create Task'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
