import { User, Sprint, TaskItem } from '../types';

// Fresh initial state with ONLY the Admin user and password: '12345678'
export const INITIAL_USERS: User[] = [
  {
    id: 'user-admin',
    name: 'Admin',
    email: 'admin@personaljira.io',
    role: 'admin',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-09-01T08:00:00Z',
    password: '12345678',
  },
];

// Initial Sprint ready for task assignments
export const INITIAL_SPRINTS: Sprint[] = [
  {
    id: 'sprint-1',
    name: 'Sprint 1',
    goal: 'Initial sprint planning, backlog grooming, and user provisioning.',
    startDate: '2026-09-01',
    endDate: '2026-09-15',
    status: 'in_progress',
    createdAt: '2026-09-01T08:00:00Z',
  },
];

// Fresh start: All tasks empty
export const INITIAL_TASKS: TaskItem[] = [];
