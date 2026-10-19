"use client";

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import { TaskItem, TaskFilterState } from "@/types/task";
import { SAMPLE_TASKS } from "@/lib/task-utils";
import { toast } from "sonner";

export interface DbStatusInfo {
  configured: boolean;
  healthy: boolean;
  checking: boolean;
  message: string;
  source: "supabase" | "local";
}

interface TaskContextType {
  tasks: TaskItem[];
  filteredTasks: TaskItem[];
  filters: TaskFilterState;
  setFilters: React.Dispatch<React.SetStateAction<TaskFilterState>>;
  resetFilters: () => void;
  addTask: (task: Omit<TaskItem, "id">) => Promise<void>;
  updateTask: (id: string, updated: Partial<TaskItem>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  importTasks: (newTasks: TaskItem[], mode: "append" | "replace") => Promise<void>;
  resetToSampleData: () => Promise<void>;
  clearAllTasks: () => Promise<void>;
  categories: string[];
  projects: string[];
  resources: string[];
  deliveries: string[];
  dbStatus: DbStatusInfo;
  checkDbStatus: () => Promise<void>;
  syncWithDb: () => Promise<void>;
}

const LOCAL_STORAGE_KEY = "ptgt_tasks_v1";

const initialFilters: TaskFilterState = {
  search: "",
  category: "all",
  mainProject: "all",
  resource: "all",
  status: "all",
  priority: "all",
};

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [filters, setFilters] = useState<TaskFilterState>(initialFilters);
  const [dbStatus, setDbStatus] = useState<DbStatusInfo>({
    configured: false,
    healthy: false,
    checking: true,
    message: "Initializing connection...",
    source: "local",
  });

  // Check Supabase connection status
  const checkDbStatus = useCallback(async () => {
    try {
      setDbStatus((prev) => ({ ...prev, checking: true }));
      const res = await fetch("/api/db-status");
      const data = await res.json();
      setDbStatus({
        configured: Boolean(data.configured),
        healthy: Boolean(data.healthy),
        checking: false,
        message: data.message || "",
        source: data.healthy ? "supabase" : "local",
      });
      return data;
    } catch (e: any) {
      setDbStatus({
        configured: false,
        healthy: false,
        checking: false,
        message: "Failed to connect to database API",
        source: "local",
      });
      return { configured: false, healthy: false };
    }
  }, []);

  // Fetch tasks from Supabase or fallback to localStorage
  const syncWithDb = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks");
      const data = await res.json();

      if (data.source === "supabase" && Array.isArray(data.tasks)) {
        if (data.tasks.length > 0) {
          setTasks(data.tasks);
          setIsLoaded(true);
          setDbStatus((prev) => ({ ...prev, source: "supabase", healthy: true, configured: true }));
          return;
        } else {
          // Connected to Supabase, but table is empty -> seed with sample or localStorage
          const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
          const initial = stored ? JSON.parse(stored) : SAMPLE_TASKS;
          if (Array.isArray(initial) && initial.length > 0) {
            setTasks(initial);
            // Optionally sync initial to Supabase
            fetch("/api/tasks", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ tasks: initial, mode: "append" }),
            }).catch(() => { });
          }
          setIsLoaded(true);
          return;
        }
      }
    } catch (e) {
      console.warn("Could not sync with Supabase API:", e);
    }

    // Fallback to localStorage
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTasks(parsed);
          setIsLoaded(true);
          return;
        }
      }
    } catch (e) { }

    setTasks(SAMPLE_TASKS);
    setIsLoaded(true);
  }, []);

  // Initial load on mount
  useEffect(() => {
    checkDbStatus();
    syncWithDb();
  }, [checkDbStatus, syncWithDb]);

  // Keep localStorage as local offline backup
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tasks));
      } catch (e) { }
    }
  }, [tasks, isLoaded]);

  const categories = useMemo(() => {
    return Array.from(new Set(tasks.map((t) => t.category).filter(Boolean))).sort();
  }, [tasks]);

  const projects = useMemo(() => {
    return Array.from(new Set(tasks.map((t) => t.mainProject).filter(Boolean))).sort();
  }, [tasks]);

  const resources = useMemo(() => {
    return Array.from(new Set(tasks.map((t) => t.resource).filter(Boolean))).sort();
  }, [tasks]);

  const deliveries = useMemo(() => {
    return Array.from(new Set(tasks.map((t) => t.keyProjectDeliveries).filter(Boolean))).sort();
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const matchName = task.taskName.toLowerCase().includes(q);
        const matchProj = task.mainProject.toLowerCase().includes(q);
        const matchDeliv = task.keyProjectDeliveries.toLowerCase().includes(q);
        const matchRes = task.resource.toLowerCase().includes(q);
        const matchCat = task.category.toLowerCase().includes(q);
        const matchComm = (task.comments || "").toLowerCase().includes(q);
        if (!matchName && !matchProj && !matchDeliv && !matchRes && !matchCat && !matchComm) {
          return false;
        }
      }

      if (filters.category !== "all" && task.category !== filters.category) return false;
      if (filters.mainProject !== "all" && task.mainProject !== filters.mainProject) return false;
      if (filters.resource !== "all" && task.resource !== filters.resource) return false;
      if (filters.status !== "all" && task.status !== filters.status) return false;
      if (filters.priority !== "all" && task.priority !== filters.priority) return false;

      return true;
    });
  }, [tasks, filters]);

  const resetFilters = () => setFilters(initialFilters);

  const addTask = async (newTask: Omit<TaskItem, "id">) => {
    const id = `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const fullTask: TaskItem = {
      ...newTask,
      id,
      progress:
        newTask.progress !== undefined
          ? newTask.progress
          : newTask.status === "Completed"
            ? 100
            : newTask.status === "In Progress"
              ? 50
              : 0,
    };

    // Optimistic local update
    setTasks((prev) => [fullTask, ...prev]);
    toast.success("Task added successfully");

    // Persist to Supabase if configured
    try {
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fullTask),
      });
    } catch (e) {
      console.warn("Failed to persist task to database:", e);
    }
  };

  const updateTask = async (id: string, updated: Partial<TaskItem>) => {
    // Optimistic local update
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const merged = { ...t, ...updated };
          if (updated.status === "Completed" && updated.progress === undefined) {
            merged.progress = 100;
          }
          return merged;
        }
        return t;
      })
    );
    toast.success("Task updated");

    // Persist to Supabase
    try {
      await fetch(`/api/tasks/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
    } catch (e) {
      console.warn("Failed to persist task update to database:", e);
    }
  };

  const deleteTask = async (id: string) => {
    // Optimistic local update
    setTasks((prev) => prev.filter((t) => t.id !== id));
    toast.info("Task deleted");

    // Persist to Supabase
    try {
      await fetch(`/api/tasks/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
    } catch (e) {
      console.warn("Failed to delete task from database:", e);
    }
  };

  const importTasks = async (newTasks: TaskItem[], mode: "append" | "replace") => {
    if (mode === "replace") {
      setTasks(newTasks);
      toast.success(`Imported ${newTasks.length} tasks (replaced existing)`);
    } else {
      setTasks((prev) => [...newTasks, ...prev]);
      toast.success(`Appended ${newTasks.length} tasks`);
    }

    // Persist to Supabase in bulk
    try {
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks: newTasks, mode }),
      });
    } catch (e) {
      console.warn("Failed to bulk persist tasks to database:", e);
    }
  };

  const resetToSampleData = async () => {
    setTasks(SAMPLE_TASKS);
    toast.success("Reset to sample project tasks");

    try {
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks: SAMPLE_TASKS, mode: "replace" }),
      });
    } catch (e) { }
  };

  const clearAllTasks = async () => {
    setTasks([]);
    toast.info("All tasks cleared");

    try {
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks: [], mode: "replace" }),
      });
    } catch (e) { }
  };

  return (
    <TaskContext.Provider
      value={{
        tasks,
        filteredTasks,
        filters,
        setFilters,
        resetFilters,
        addTask,
        updateTask,
        deleteTask,
        importTasks,
        resetToSampleData,
        clearAllTasks,
        categories,
        projects,
        resources,
        deliveries,
        dbStatus,
        checkDbStatus,
        syncWithDb,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks() {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error("useTasks must be used within a TaskProvider");
  }
  return context;
}
