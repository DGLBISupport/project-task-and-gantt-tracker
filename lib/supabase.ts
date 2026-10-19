import { TaskItem, PriorityLevel, TaskStatus } from "@/types/task";

export interface DbTaskRow {
  id: string;
  category: string;
  main_project: string;
  key_project_deliveries: string;
  task_name: string;
  priority: string;
  status: string;
  resource: string;
  start_date: string;
  end_date: string;
  progress: number;
  comments: string;
  created_at?: string;
  updated_at?: string;
}

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  return Boolean(url && key && url.trim().startsWith("http") && key.trim().length > 10);
}

function getSupabaseConfig() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "").trim().replace(/\/+$/, "");
  const key = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    ""
  ).trim();

  return { url, key };
}

// Convert DB snake_case row to frontend TaskItem
export function rowToTask(row: DbTaskRow): TaskItem {
  return {
    id: row.id,
    category: row.category,
    mainProject: row.main_project,
    keyProjectDeliveries: row.key_project_deliveries,
    taskName: row.task_name,
    priority: (row.priority as PriorityLevel) || "Medium",
    status: (row.status as TaskStatus) || "Not Started",
    resource: row.resource || "Unassigned",
    startDate: row.start_date,
    endDate: row.end_date,
    progress: row.progress ?? 0,
    comments: row.comments || "",
    createdAt: row.created_at,
  };
}

// Convert frontend TaskItem to DB snake_case row
export function taskToRow(task: Partial<TaskItem>): Partial<DbTaskRow> {
  const row: Partial<DbTaskRow> = {};
  if (task.id !== undefined) row.id = task.id;
  if (task.category !== undefined) row.category = task.category;
  if (task.mainProject !== undefined) row.main_project = task.mainProject;
  if (task.keyProjectDeliveries !== undefined) row.key_project_deliveries = task.keyProjectDeliveries;
  if (task.taskName !== undefined) row.task_name = task.taskName;
  if (task.priority !== undefined) row.priority = task.priority;
  if (task.status !== undefined) row.status = task.status;
  if (task.resource !== undefined) row.resource = task.resource;
  if (task.startDate !== undefined) row.start_date = task.startDate;
  if (task.endDate !== undefined) row.end_date = task.endDate;
  if (task.progress !== undefined) row.progress = task.progress;
  if (task.comments !== undefined) row.comments = task.comments;
  return row;
}

// Fetch all tasks from Supabase PostgREST API
export async function fetchTasksFromSupabase(): Promise<{ tasks: TaskItem[]; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { tasks: [], error: "Supabase credentials not configured in .env.local" };
  }

  const { url, key } = getSupabaseConfig();

  try {
    const res = await fetch(`${url}/rest/v1/tasks?select=*&order=end_date.asc`, {
      method: "GET",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const errText = await res.text();
      return { tasks: [], error: `Supabase error (${res.status}): ${errText}` };
    }

    const rows: DbTaskRow[] = await res.json();
    return { tasks: rows.map(rowToTask) };
  } catch (err: any) {
    return { tasks: [], error: err.message || "Failed to reach Supabase" };
  }
}

// Insert single task
export async function insertTaskToSupabase(task: TaskItem): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: "Supabase credentials not configured" };
  }

  const { url, key } = getSupabaseConfig();
  const row = taskToRow(task);

  try {
    const res = await fetch(`${url}/rest/v1/tasks`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(row),
    });

    if (!res.ok) {
      const errText = await res.text();
      return { success: false, error: errText };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// Bulk insert / upsert tasks (e.g. from Excel import)
export async function bulkInsertTasksToSupabase(
  tasks: TaskItem[],
  mode: "append" | "replace" = "append"
): Promise<{ count: number; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { count: 0, error: "Supabase credentials not configured" };
  }

  const { url, key } = getSupabaseConfig();

  try {
    // If replace mode, delete all existing first
    if (mode === "replace") {
      await fetch(`${url}/rest/v1/tasks?id=neq.placeholder`, {
        method: "DELETE",
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
      });
    }

    const rows = tasks.map(taskToRow);

    const res = await fetch(`${url}/rest/v1/tasks`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify(rows),
    });

    if (!res.ok) {
      const errText = await res.text();
      return { count: 0, error: errText };
    }

    return { count: tasks.length };
  } catch (err: any) {
    return { count: 0, error: err.message };
  }
}

// Update single task
export async function updateTaskInSupabase(
  id: string,
  updates: Partial<TaskItem>
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: "Supabase credentials not configured" };
  }

  const { url, key } = getSupabaseConfig();
  const rowUpdates = taskToRow(updates);

  try {
    const res = await fetch(`${url}/rest/v1/tasks?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(rowUpdates),
    });

    if (!res.ok) {
      const errText = await res.text();
      return { success: false, error: errText };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// Delete single task
export async function deleteTaskFromSupabase(id: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: "Supabase credentials not configured" };
  }

  const { url, key } = getSupabaseConfig();

  try {
    const res = await fetch(`${url}/rest/v1/tasks?id=eq.${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      return { success: false, error: errText };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
