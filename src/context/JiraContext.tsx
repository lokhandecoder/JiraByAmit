import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Sprint, TaskItem, FilterState, ActiveTab, TaskStatus, TaskType, TaskPriority, UserRole } from '../types';
import { INITIAL_USERS, INITIAL_SPRINTS, INITIAL_TASKS } from '../data/mockData';

interface JiraContextType {
  users: User[];
  sprints: Sprint[];
  tasks: TaskItem[];
  currentUser: User;
  activeSprint: Sprint | undefined;
  activeTab: ActiveTab;
  filters: FilterState;
  selectedTaskId: string | null;
  isTaskModalOpen: boolean;
  isCreateUserModalOpen: boolean;
  isCreateSprintModalOpen: boolean;
  isAuthenticated: boolean;
  login: (emailOrUsername: string, password: string) => { success: boolean; message: string };
  logout: () => void;
  setActiveTab: (tab: ActiveTab) => void;
  setCurrentUser: (user: User) => void;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  setSelectedTaskId: (id: string | null) => void;
  setIsTaskModalOpen: (open: boolean) => void;
  setIsCreateUserModalOpen: (open: boolean) => void;
  setIsCreateSprintModalOpen: (open: boolean) => void;
  createUser: (user: Omit<User, 'id' | 'createdAt'> & { password?: string }) => { success: boolean; message: string; user?: User };
  createSprint: (sprint: Omit<Sprint, 'id' | 'createdAt'>) => Sprint;
  updateSprint: (id: string, updates: Partial<Sprint>) => void;
  startSprint: (id: string) => void;
  completeSprint: (id: string) => void;
  createTask: (task: Omit<TaskItem, 'id' | 'key' | 'createdAt' | 'updatedAt'>) => TaskItem;
  updateTask: (id: string, updates: Partial<TaskItem>) => void;
  updateTaskStatus: (id: string, status: TaskStatus) => void;
  deleteTask: (id: string) => void;
  resetToInitialData: () => void;
}

const STORAGE_KEY_USERS = 'personal_jira_users_v3';
const STORAGE_KEY_SPRINTS = 'personal_jira_sprints_v3';
const STORAGE_KEY_TASKS = 'personal_jira_tasks_v3';
const STORAGE_KEY_ACTIVE_USER = 'personal_jira_active_user_v3';
const STORAGE_KEY_AUTH = 'personal_jira_auth_v3';

// Clear out legacy mock cache from prior runs if any
try {
  localStorage.removeItem('personal_jira_users_v2');
  localStorage.removeItem('personal_jira_sprints_v2');
  localStorage.removeItem('personal_jira_tasks_v2');
  localStorage.removeItem('personal_jira_active_user_v2');
} catch (e) {
  // ignore
}

const JiraContext = createContext<JiraContextType | undefined>(undefined);

export const JiraProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USERS);
      return saved ? JSON.parse(saved) : INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });

  const [currentUser, setCurrentUserState] = useState<User>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ACTIVE_USER);
      if (saved) {
        const parsed = JSON.parse(saved);
        const match = users.find(u => u.id === parsed.id);
        if (match) return match;
      }
      return users.find(u => u.role === 'admin') || users[0] || INITIAL_USERS[0];
    } catch {
      return INITIAL_USERS[0];
    }
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_AUTH);
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const [sprints, setSprints] = useState<Sprint[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SPRINTS);
      return saved ? JSON.parse(saved) : INITIAL_SPRINTS;
    } catch {
      return INITIAL_SPRINTS;
    }
  });

  const [tasks, setTasks] = useState<TaskItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TASKS);
      return saved ? JSON.parse(saved) : INITIAL_TASKS;
    } catch {
      return INITIAL_TASKS;
    }
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('board');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [isCreateSprintModalOpen, setIsCreateSprintModalOpen] = useState(false);

  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    assigneeId: 'all',
    taskType: 'all',
    priority: 'all',
    sprintId: 'all',
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
    } catch (e) {
      console.error(e);
    }
  }, [users]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SPRINTS, JSON.stringify(sprints));
    } catch (e) {
      console.error(e);
    }
  }, [sprints]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
    } catch (e) {
      console.error(e);
    }
  }, [tasks]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(isAuthenticated));
    } catch (e) {
      console.error(e);
    }
  }, [isAuthenticated]);

  const setCurrentUser = (user: User) => {
    setCurrentUserState(user);
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE_USER, JSON.stringify(user));
    } catch (e) {
      console.error(e);
    }
  };

  const login = (emailOrUsername: string, passwordAttempt: string) => {
    const query = emailOrUsername.trim().toLowerCase();
    const foundUser = users.find(u => 
      u.email.toLowerCase() === query || 
      u.name.toLowerCase() === query || 
      (query === 'admin' && u.role === 'admin')
    );

    if (!foundUser) {
      return { 
        success: false, 
        message: 'No user registered with this email or username.' 
      };
    }

    const expectedPassword = foundUser.password || '12345678';
    if (passwordAttempt !== expectedPassword) {
      return { 
        success: false, 
        message: 'Invalid password. (Admin password is: 12345678)' 
      };
    }

    setCurrentUser(foundUser);
    setIsAuthenticated(true);
    return { 
      success: true, 
      message: `Welcome back, ${foundUser.name}!` 
    };
  };

  const logout = () => {
    setIsAuthenticated(false);
  };

  const activeSprint = sprints.find(s => s.status === 'in_progress') || sprints[0];

  // Admin user creation handler
  const createUser = (userData: Omit<User, 'id' | 'createdAt'> & { password?: string }) => {
    if (currentUser.role !== 'admin') {
      return {
        success: false,
        message: 'Permission denied: Only Administrators can create new team users.',
      };
    }

    const emailExists = users.some(u => u.email.toLowerCase() === userData.email.toLowerCase());
    if (emailExists) {
      return {
        success: false,
        message: 'A user with this email address already exists.',
      };
    }

    const newUser: User = {
      ...userData,
      id: `user-${Date.now()}`,
      password: userData.password || '12345678',
      avatarUrl: userData.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userData.name)}`,
      createdAt: new Date().toISOString(),
    };

    setUsers(prev => [...prev, newUser]);
    return {
      success: true,
      message: `User '${newUser.name}' created successfully with role ${newUser.role}.`,
      user: newUser,
    };
  };

  const createSprint = (sprintData: Omit<Sprint, 'id' | 'createdAt'>) => {
    const newSprint: Sprint = {
      ...sprintData,
      id: `sprint-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setSprints(prev => [newSprint, ...prev]);
    return newSprint;
  };

  const updateSprint = (id: string, updates: Partial<Sprint>) => {
    setSprints(prev => prev.map(s => (s.id === id ? { ...s, ...updates } : s)));
  };

  const startSprint = (id: string) => {
    setSprints(prev =>
      prev.map(s => {
        if (s.id === id) return { ...s, status: 'in_progress' };
        if (s.status === 'in_progress') return { ...s, status: 'planning' };
        return s;
      })
    );
  };

  const completeSprint = (id: string) => {
    setSprints(prev =>
      prev.map(s => (s.id === id ? { ...s, status: 'completed' } : s))
    );
  };

  const createTask = (taskData: Omit<TaskItem, 'id' | 'key' | 'createdAt' | 'updatedAt'>) => {
    const nextNum = 100 + tasks.length + 1;
    const newTask: TaskItem = {
      ...taskData,
      id: `task-${Date.now()}`,
      key: `PJ-${nextNum}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setTasks(prev => [newTask, ...prev]);
    return newTask;
  };

  const updateTask = (id: string, updates: Partial<TaskItem>) => {
    setTasks(prev =>
      prev.map(t =>
        t.id === id
          ? {
              ...t,
              ...updates,
              updatedAt: new Date().toISOString(),
            }
          : t
      )
    );
  };

  const updateTaskStatus = (id: string, status: TaskStatus) => {
    setTasks(prev =>
      prev.map(t =>
        t.id === id
          ? {
              ...t,
              status,
              updatedAt: new Date().toISOString(),
            }
          : t
      )
    );
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const resetToInitialData = () => {
    setUsers(INITIAL_USERS);
    setCurrentUser(INITIAL_USERS[0]);
    setSprints(INITIAL_SPRINTS);
    setTasks(INITIAL_TASKS);
    setIsAuthenticated(true);
    try {
      localStorage.removeItem(STORAGE_KEY_USERS);
      localStorage.removeItem(STORAGE_KEY_SPRINTS);
      localStorage.removeItem(STORAGE_KEY_TASKS);
      localStorage.removeItem(STORAGE_KEY_ACTIVE_USER);
      localStorage.removeItem(STORAGE_KEY_AUTH);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <JiraContext.Provider
      value={{
        users,
        sprints,
        tasks,
        currentUser,
        activeSprint,
        activeTab,
        filters,
        selectedTaskId,
        isTaskModalOpen,
        isCreateUserModalOpen,
        isCreateSprintModalOpen,
        isAuthenticated,
        login,
        logout,
        setActiveTab,
        setCurrentUser,
        setFilters,
        setSelectedTaskId,
        setIsTaskModalOpen,
        setIsCreateUserModalOpen,
        setIsCreateSprintModalOpen,
        createUser,
        createSprint,
        updateSprint,
        startSprint,
        completeSprint,
        createTask,
        updateTask,
        updateTaskStatus,
        deleteTask,
        resetToInitialData,
      }}
    >
      {children}
    </JiraContext.Provider>
  );
};

export const useJira = () => {
  const context = useContext(JiraContext);
  if (!context) {
    throw new Error('useJira must be used within a JiraProvider');
  }
  return context;
};
