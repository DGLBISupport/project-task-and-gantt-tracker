"use client";

import React, { useState } from "react";
import { TaskItem, TaskStatus, PriorityLevel } from "@/types/task";
import { useTasks } from "@/context/task-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Plus,
  FileSpreadsheet,
  Download,
  Trash2,
  Edit2,
  CalendarRange,
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  ChevronDown,
  Database,
  RefreshCw,
} from "lucide-react";
import { exportToCsv, downloadCsvFile, downloadTemplateCsv } from "@/lib/task-utils";
import Link from "next/link";
import { toast } from "sonner";

interface TaskTableProps {
  onAddTask: () => void;
  onEditTask: (task: TaskItem) => void;
  onOpenImport: () => void;
}

export function TaskTable({ onAddTask, onEditTask, onOpenImport }: TaskTableProps) {
  const {
    tasks,
    filteredTasks,
    filters,
    setFilters,
    resetFilters,
    deleteTask,
    updateTask,
    addTask,
    resetToSampleData,
    clearAllTasks,
    categories,
    projects,
    resources,
    dbStatus,
    syncWithDb,
  } = useTasks();

  const [isSyncing, setIsSyncing] = useState(false);

  const [sortField, setSortField] = useState<keyof TaskItem>("endDate");
  const [sortAsc, setSortAsc] = useState(true);

  // Stats calculation
  const totalCount = tasks.length;
  const completedCount = tasks.filter((t) => t.status === "Completed").length;
  const inProgressCount = tasks.filter((t) => t.status === "In Progress").length;
  const delayedCount = tasks.filter((t) => t.status === "Delayed").length;
  const criticalCount = tasks.filter((t) => t.priority === "Critical").length;

  const handleSort = (field: keyof TaskItem) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const valA = a[sortField] || "";
    const valB = b[sortField] || "";
    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  const handleDuplicate = (task: TaskItem) => {
    const { id, ...rest } = task;
    addTask({
      ...rest,
      taskName: `${task.taskName} (Copy)`,
    });
    toast.success("Task duplicated");
  };

  const getPriorityBadge = (p: PriorityLevel) => {
    switch (p) {
      case "Critical":
        return "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30";
      case "High":
        return "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30";
      case "Medium":
        return "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30";
      case "Low":
        return "bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30";
    }
  };

  const getStatusBadge = (s: TaskStatus) => {
    switch (s) {
      case "Completed":
        return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
      case "In Progress":
        return "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30";
      case "Under Review":
        return "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30";
      case "Delayed":
        return "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30";
      case "Not Started":
        return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <div className="space-y-4">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-card p-3.5 rounded-xl border border-border shadow-2xs">
          <span className="text-[11px] text-muted-foreground font-medium block">Total Tasks</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold tracking-tight text-foreground">{totalCount}</span>
            <span className="text-xs text-muted-foreground font-mono">{projects.length} Projects</span>
          </div>
        </div>

        <div className="bg-card p-3.5 rounded-xl border border-border shadow-2xs">
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
            <CheckCircle2 className="size-3" /> Completed
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {completedCount}
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              {totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%
            </span>
          </div>
        </div>

        <div className="bg-card p-3.5 rounded-xl border border-border shadow-2xs">
          <span className="text-[11px] text-sky-600 dark:text-sky-400 font-medium flex items-center gap-1">
            <Clock className="size-3" /> In Progress
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold tracking-tight text-sky-600 dark:text-sky-400">
              {inProgressCount}
            </span>
            <span className="text-xs text-muted-foreground font-mono">Active</span>
          </div>
        </div>

        <div className="bg-card p-3.5 rounded-xl border border-border shadow-2xs">
          <span className="text-[11px] text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1">
            <AlertCircle className="size-3" /> Delayed
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
              {delayedCount}
            </span>
            <span className="text-xs text-muted-foreground font-mono">Attention</span>
          </div>
        </div>

        <div className="bg-card p-3.5 rounded-xl border border-border shadow-2xs col-span-2 sm:col-span-1">
          <span className="text-[11px] text-rose-500 font-medium block">Critical Priority</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold tracking-tight text-foreground">{criticalCount}</span>
            <span className="text-xs text-muted-foreground font-mono">High Impact</span>
          </div>
        </div>
      </div>

      {/* Main Action Bar */}
      <div className="bg-card p-4 rounded-xl border border-border shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={onAddTask} size="sm" className="h-9 gap-1.5 font-medium shadow-xs">
              <Plus className="size-4" />
              Add Task
            </Button>

            <Button
              onClick={onOpenImport}
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 border-emerald-600/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 font-medium"
            >
              <FileSpreadsheet className="size-4" />
              Import from Excel
            </Button>

            <Button
              onClick={() => {
                const csv = exportToCsv(filteredTasks);
                downloadCsvFile(csv, `project_tasks_${new Date().toISOString().split("T")[0]}.csv`);
                toast.success("Downloaded Excel CSV with all 9 columns");
              }}
              variant="outline"
              size="sm"
              className="h-9 gap-1.5"
            >
              <Download className="size-3.5" />
              Export Excel / CSV
            </Button>

            <Button
              onClick={downloadTemplateCsv}
              variant="ghost"
              size="sm"
              className="h-9 text-xs text-muted-foreground hover:text-foreground hidden lg:flex"
            >
              Excel Template
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/gantt-chart">
              <Button size="sm" variant="secondary" className="h-9 gap-1.5 font-medium">
                <CalendarRange className="size-4 text-primary" />
                Open Full Gantt Chart
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters Row */}
        <div className="pt-2 border-t border-border/60 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            {/* Search input */}
            <div className="relative w-52">
              <Search className="size-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
              <Input
                value={filters.search}
                onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
                placeholder="Search tasks, deliverables..."
                className="h-8 text-xs pl-8 bg-background"
              />
            </div>

            {/* Project Filter */}
            <Select
              value={filters.mainProject}
              onValueChange={(v) => setFilters((p) => ({ ...p, mainProject: v }))}
            >
              <SelectTrigger className="h-8 text-xs w-[140px] bg-background">
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Category Filter */}
            <Select
              value={filters.category}
              onValueChange={(v) => setFilters((p) => ({ ...p, category: v }))}
            >
              <SelectTrigger className="h-8 text-xs w-[130px] bg-background">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select
              value={filters.status}
              onValueChange={(v) => setFilters((p) => ({ ...p, status: v }))}
            >
              <SelectTrigger className="h-8 text-xs w-[125px] bg-background">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Under Review">Under Review</SelectItem>
                <SelectItem value="Delayed">Delayed</SelectItem>
                <SelectItem value="Not Started">Not Started</SelectItem>
              </SelectContent>
            </Select>

            {/* Priority Filter */}
            <Select
              value={filters.priority}
              onValueChange={(v) => setFilters((p) => ({ ...p, priority: v }))}
            >
              <SelectTrigger className="h-8 text-xs w-[120px] bg-background">
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="Critical">Critical</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>

            {/* Resource Filter */}
            <Select
              value={filters.resource}
              onValueChange={(v) => setFilters((p) => ({ ...p, resource: v }))}
            >
              <SelectTrigger className="h-8 text-xs w-[130px] bg-background">
                <SelectValue placeholder="All Resources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Resources</SelectItem>
                {resources.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            {(filters.search ||
              filters.category !== "all" ||
              filters.mainProject !== "all" ||
              filters.status !== "all" ||
              filters.priority !== "all" ||
              filters.resource !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="h-8 text-xs text-muted-foreground hover:text-foreground"
              >
                Reset
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={resetToSampleData}
              className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1"
              title="Reset data to realistic sample projects"
            >
              <RotateCcw className="size-3" />
              Sample Data
            </Button>

            <Button
              variant="outline"
              size="sm"
              disabled={isSyncing}
              onClick={async () => {
                setIsSyncing(true);
                await syncWithDb();
                setIsSyncing(false);
                toast.success("Synchronized with database");
              }}
              className="h-8 text-xs gap-1 border-primary/20 text-primary hover:bg-primary/10"
              title="Pull latest tasks from Supabase database"
            >
              <RefreshCw className={`size-3 ${isSyncing ? "animate-spin" : ""}`} />
              Sync DB
            </Button>
          </div>
        </div>
      </div>

      {/* Excel Columns Data Table */}
      <div className="bg-card rounded-xl border border-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] font-semibold tracking-wider border-b border-border">
              <tr>
                <th
                  onClick={() => handleSort("category")}
                  className="p-3 cursor-pointer hover:text-foreground"
                >
                  Category
                </th>
                <th
                  onClick={() => handleSort("mainProject")}
                  className="p-3 cursor-pointer hover:text-foreground"
                >
                  Main Project
                </th>
                <th
                  onClick={() => handleSort("keyProjectDeliveries")}
                  className="p-3 cursor-pointer hover:text-foreground"
                >
                  Key Deliverables
                </th>
                <th
                  onClick={() => handleSort("taskName")}
                  className="p-3 cursor-pointer hover:text-foreground min-w-[180px]"
                >
                  Task Name
                </th>
                <th
                  onClick={() => handleSort("priority")}
                  className="p-3 cursor-pointer hover:text-foreground"
                >
                  Priority
                </th>
                <th
                  onClick={() => handleSort("status")}
                  className="p-3 cursor-pointer hover:text-foreground"
                >
                  Status
                </th>
                <th
                  onClick={() => handleSort("resource")}
                  className="p-3 cursor-pointer hover:text-foreground"
                >
                  Resource
                </th>
                <th
                  onClick={() => handleSort("endDate")}
                  className="p-3 cursor-pointer hover:text-foreground whitespace-nowrap"
                >
                  End Date
                </th>
                <th className="p-3 min-w-[160px]">Comments</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {sortedTasks.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-muted-foreground">
                    No tasks found. Click "Add Task" or "Import from Excel" to begin.
                  </td>
                </tr>
              ) : (
                sortedTasks.map((task) => (
                  <tr
                    key={task.id}
                    className="hover:bg-muted/30 transition-colors group"
                  >
                    {/* Category */}
                    <td className="p-3 whitespace-nowrap">
                      <span className="bg-muted/80 text-foreground px-2 py-0.5 rounded text-[11px] font-medium border border-border/60">
                        {task.category}
                      </span>
                    </td>

                    {/* Main Project */}
                    <td className="p-3 font-semibold text-foreground whitespace-nowrap">
                      {task.mainProject}
                    </td>

                    {/* Key Deliveries */}
                    <td className="p-3 text-muted-foreground whitespace-nowrap">
                      {task.keyProjectDeliveries}
                    </td>

                    {/* Task Name */}
                    <td className="p-3 font-medium text-foreground">
                      <div className="flex flex-col">
                        <span>{task.taskName}</span>
                        {task.startDate && (
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {task.startDate} → {task.endDate}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Priority */}
                    <td className="p-3 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getPriorityBadge(
                          task.priority
                        )}`}
                      >
                        {task.priority}
                      </span>
                    </td>

                    {/* Status with quick switcher */}
                    <td className="p-3 whitespace-nowrap">
                      <Select
                        value={task.status}
                        onValueChange={(val) =>
                          updateTask(task.id, {
                            status: val as TaskStatus,
                            progress: val === "Completed" ? 100 : val === "In Progress" ? 50 : 0,
                          })
                        }
                      >
                        <SelectTrigger
                          className={`h-6 text-[11px] font-medium px-2 rounded-full border ${getStatusBadge(
                            task.status
                          )}`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Not Started">Not Started</SelectItem>
                          <SelectItem value="In Progress">In Progress</SelectItem>
                          <SelectItem value="Under Review">Under Review</SelectItem>
                          <SelectItem value="Completed">Completed</SelectItem>
                          <SelectItem value="Delayed">Delayed</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>

                    {/* Resource */}
                    <td className="p-3 font-medium text-foreground whitespace-nowrap">
                      {task.resource}
                    </td>

                    {/* End Date */}
                    <td className="p-3 font-mono text-[11px] font-semibold text-foreground whitespace-nowrap">
                      {task.endDate}
                    </td>

                    {/* Comments */}
                    <td className="p-3 text-muted-foreground text-[11px] max-w-xs truncate" title={task.comments}>
                      {task.comments || "—"}
                    </td>

                    {/* Actions */}
                    <td className="p-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDuplicate(task)}
                          className="size-7 text-muted-foreground hover:text-foreground"
                          title="Duplicate Task"
                        >
                          <Copy className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEditTask(task)}
                          className="size-7 text-muted-foreground hover:text-foreground"
                          title="Edit Task"
                        >
                          <Edit2 className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteTask(task.id)}
                          className="size-7 text-muted-foreground hover:text-destructive"
                          title="Delete Task"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-border bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Showing {sortedTasks.length} of {tasks.length} total tasks
          </span>
          {tasks.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllTasks}
              className="h-7 text-[11px] text-destructive hover:bg-destructive/10"
            >
              Clear All Tasks
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
