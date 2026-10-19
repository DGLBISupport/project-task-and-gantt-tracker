export type PriorityLevel = "Critical" | "High" | "Medium" | "Low";
export type TaskStatus = "Not Started" | "In Progress" | "Under Review" | "Completed" | "Delayed";

export interface TaskItem {
  id: string;
  category: string;
  mainProject: string;
  keyProjectDeliveries: string;
  taskName: string;
  priority: PriorityLevel;
  status: TaskStatus;
  resource: string;
  endDate: string; // YYYY-MM-DD
  startDate?: string; // YYYY-MM-DD (calculated or specified)
  comments?: string;
  progress?: number; // 0 - 100
  createdAt?: string;
}

export type GanttTimeScale = "day" | "week" | "month";
export type GanttGrouping = "project" | "category" | "resource" | "status" | "none";
export type GanttColorMode = "status" | "priority" | "category";

export interface TaskFilterState {
  search: string;
  category: string;
  mainProject: string;
  resource: string;
  status: string;
  priority: string;
}
