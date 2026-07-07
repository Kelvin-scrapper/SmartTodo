import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SEED_TASKS, Task } from '../data/seed';

const STORAGE_KEY = 'tasks:v1';

interface TasksContextValue {
  tasks: Task[];
  hydrated: boolean;
  toggleTask: (id: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  addTask: (task: Task) => void;
}

const TasksContext = createContext<TasksContextValue | null>(null);

export function TasksProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(SEED_TASKS);
  const [hydrated, setHydrated] = useState(false);
  const skipPersist = useRef(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(raw => {
        if (raw) setTasks(JSON.parse(raw));
      })
      .catch(() => {})
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (skipPersist.current) {
      skipPersist.current = false;
      return;
    }
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)).catch(() => {});
  }, [tasks, hydrated]);

  const toggleTask = (id: string) =>
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, done: !t.done } : t)));

  const toggleSubtask = (taskId: string, subtaskId: string) =>
    setTasks(prev =>
      prev.map(t =>
        t.id === taskId && t.subtasks
          ? {
              ...t,
              subtasks: t.subtasks.map(s =>
                s.id === subtaskId ? { ...s, done: !s.done } : s,
              ),
            }
          : t,
      ),
    );

  const addTask = (task: Task) => setTasks(prev => [...prev, task]);

  return (
    <TasksContext.Provider value={{ tasks, hydrated, toggleTask, toggleSubtask, addTask }}>
      {children}
    </TasksContext.Provider>
  );
}

export function useTasks() {
  const ctx = useContext(TasksContext);
  if (!ctx) throw new Error('useTasks must be used inside TasksProvider');
  return ctx;
}
