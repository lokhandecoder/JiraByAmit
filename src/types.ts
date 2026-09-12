export type TaskStatus = 'draft' | 'in progres' | 'completed';

export type TaskType = 'defect' | 'user story' | 'random task';

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export type UserRole = 'admin' | 'developer' | 'qa' | 'product_owner';

export type SprintStatus = 'planning' | 'in_progress' | 'completed';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
  createdAt: string;
  password?: string;
}

export interface Sprint {
  id: string;
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
  status: SprintStatus;
  createdAt: string;
}

export interface TaskItem {
  id: string;
  key: string; // e.g. "PJ-101"
  title: string;
  description: string;
  taskType: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string;
  sprintId: string; // Every task is assigned to some sprint
  storyPoints: number;
  createdAt: string;
  updatedAt: string;
}

export interface FilterState {
  searchQuery: string;
  assigneeId: string | 'all';
  taskType: TaskType | 'all';
  priority: TaskPriority | 'all';
  sprintId: string | 'all';
}

export type ActiveTab = 'board' | 'planning' | 'reports' | 'users' | 'tasks';
