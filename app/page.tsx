"use client";

import React, { useState } from "react";
import { useTasks } from "@/context/task-context";
import { Button } from "@/components/ui/button";
import {
  CalendarRange,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FolderGit2,
  Users,
  Plus,
  FileSpreadsheet,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { TaskFormDialog } from "@/components/tasks/task-form-dialog";
import { ImportExcelDialog } from "@/components/tasks/import-excel-dialog";
import { GanttChart } from "@/components/gantt/gantt-chart";
import { TaskItem } from "@/types/task";

export default function DashboardPage() {
  const { tasks, projects, categories, resources } = useTasks();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<TaskItem | null>(null);

  const completedTasks = tasks.filter((t) => t.status === "Completed");
  const inProgressTasks = tasks.filter((t) => t.status === "In Progress");
  const delayedTasks = tasks.filter((t) => t.status === "Delayed");
  const criticalTasks = tasks.filter((t) => t.priority === "Critical");

  const completionRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  // Upcoming deadlines in the next 14 days
  const now = new Date().getTime();
  const upcomingTasks = tasks
    .filter((t) => {
      const end = new Date(t.endDate).getTime();
      const diffDays = (end - now) / 86400000;
      return diffDays >= 0 && diffDays <= 14 && t.status !== "Completed";
    })
    .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());

  // Project progress breakdown
  const projectStats = projects.map((proj) => {
    const projTasks = tasks.filter((t) => t.mainProject === proj);
    const projDone = projTasks.filter((t) => t.status === "Completed").length;
    const pct = projTasks.length > 0 ? Math.round((projDone / projTasks.length) * 100) : 0;
    return {
      name: proj,
      total: projTasks.length,
      done: projDone,
      percent: pct,
    };
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-primary/15 via-primary/5 to-transparent p-6 rounded-2xl border border-primary/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-semibold mb-2">
            <TrendingUp className="size-3.5" /> Project Delivery Hub
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Project Task & Gantt Tracker
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl">
            Track key project deliveries from your Excel sheets, manage resources, and generate presentation-ready downloadable Gantt charts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Button
            onClick={() => setIsImportOpen(true)}
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 border-emerald-600/30 text-emerald-700 dark:text-emerald-400 font-medium bg-background"
          >
            <FileSpreadsheet className="size-4" />
            Import Excel
          </Button>

          <Button
            onClick={() => {
              setTaskToEdit(null);
              setIsAddOpen(true);
            }}
            size="sm"
            className="h-9 gap-1.5 font-medium shadow-xs"
          >
            <Plus className="size-4" />
            New Task
          </Button>

          <Link href="/gantt-chart">
            <Button variant="secondary" size="sm" className="h-9 gap-1.5 font-medium">
              <CalendarRange className="size-4 text-primary" />
              View Gantt Chart
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card p-5 rounded-2xl border border-border shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Active Projects</span>
            <FolderGit2 className="size-4 text-primary" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-foreground">
              {projects.length}
            </span>
            <span className="text-xs text-muted-foreground">({categories.length} Categories)</span>
          </div>
          <p className="text-[11px] text-muted-foreground">{tasks.length} total tasks managed</p>
        </div>

        <div className="bg-card p-5 rounded-2xl border border-border shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Overall Completion</span>
            <CheckCircle2 className="size-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {completionRate}%
            </span>
            <span className="text-xs text-muted-foreground">({completedTasks.length} tasks)</span>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>

        <div className="bg-card p-5 rounded-2xl border border-border shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">In Progress & Review</span>
            <Clock className="size-4 text-sky-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-sky-600 dark:text-sky-400">
              {inProgressTasks.length}
            </span>
            <span className="text-xs text-muted-foreground">in active sprint</span>
          </div>
          <p className="text-[11px] text-muted-foreground">{resources.length} team resources assigned</p>
        </div>

        <div className="bg-card p-5 rounded-2xl border border-border shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Attention Needed</span>
            <AlertTriangle className="size-4 text-rose-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
              {delayedTasks.length}
            </span>
            <span className="text-xs text-muted-foreground">Delayed ({criticalTasks.length} Critical)</span>
          </div>
          <p className="text-[11px] text-rose-500 font-medium">Review schedule & blockers</p>
        </div>
      </div>

      {/* 2-Column: Projects Progress & Upcoming Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Delivery Progress */}
        <div className="bg-card p-5 rounded-2xl border border-border shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-foreground">Project Delivery Health</h2>
              <p className="text-xs text-muted-foreground">Completion breakdown across main projects</p>
            </div>
            <Link href="/task-management">
              <Button variant="ghost" size="sm" className="h-7 text-xs text-primary gap-1">
                View All <ArrowRight className="size-3" />
              </Button>
            </Link>
          </div>

          <div className="space-y-3.5">
            {projectStats.map((p) => (
              <div key={p.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground truncate">{p.name}</span>
                  <span className="text-muted-foreground font-mono">
                    {p.done}/{p.total} tasks ({p.percent}%)
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      p.percent === 100
                        ? "bg-emerald-500"
                        : p.percent >= 50
                        ? "bg-primary"
                        : "bg-amber-500"
                    }`}
                    style={{ width: `${p.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Deadlines (Next 14 Days) */}
        <div className="bg-card p-5 rounded-2xl border border-border shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-foreground">Upcoming Deadlines (Next 14 Days)</h2>
              <p className="text-xs text-muted-foreground">Urgent deliveries requiring team focus</p>
            </div>
            <Link href="/gantt-chart">
              <Button variant="ghost" size="sm" className="h-7 text-xs text-primary gap-1">
                Gantt Timeline <ArrowRight className="size-3" />
              </Button>
            </Link>
          </div>

          <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
            {upcomingTasks.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-6 text-center">
                No pending deadlines in the next 14 days!
              </p>
            ) : (
              upcomingTasks.map((t) => (
                <div
                  key={t.id}
                  onClick={() => {
                    setTaskToEdit(t);
                    setIsAddOpen(true);
                  }}
                  className="p-2.5 rounded-xl border border-border/70 hover:bg-muted/40 transition-colors flex items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-foreground truncate">
                        {t.taskName}
                      </span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                          t.priority === "Critical"
                            ? "bg-rose-500/20 text-rose-600"
                            : "bg-orange-500/20 text-orange-600"
                        }`}
                      >
                        {t.priority}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground block truncate">
                      {t.mainProject} • {t.resource}
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-mono font-bold text-primary block">
                      {t.endDate}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{t.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Embedded Gantt Chart Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">Interactive Gantt Timeline</h2>
            <p className="text-xs text-muted-foreground">
              Timeline view of project tasks with downloadable export options.
            </p>
          </div>

          <Link href="/gantt-chart">
            <Button size="sm" variant="outline" className="text-xs gap-1.5">
              <CalendarRange className="size-3.5" />
              Fullscreen Gantt
            </Button>
          </Link>
        </div>

        <div className="h-[600px]">
          <GanttChart
            onEditTask={(task) => {
              setTaskToEdit(task);
              setIsAddOpen(true);
            }}
          />
        </div>
      </div>

      {/* Modals */}
      <TaskFormDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        taskToEdit={taskToEdit}
      />

      <ImportExcelDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
      />
    </div>
  );
}
