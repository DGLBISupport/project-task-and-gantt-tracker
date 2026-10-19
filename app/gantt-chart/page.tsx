"use client";

import React, { useState } from "react";
import { GanttChart } from "@/components/gantt/gantt-chart";
import { TaskFormDialog } from "@/components/tasks/task-form-dialog";
import { ImportExcelDialog } from "@/components/tasks/import-excel-dialog";
import { TaskItem } from "@/types/task";
import { Button } from "@/components/ui/button";
import { Plus, FileSpreadsheet, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function GanttChartPage() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<TaskItem | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);

  const handleEdit = (task: TaskItem) => {
    setTaskToEdit(task);
    setIsAddOpen(true);
  };

  const handleAdd = () => {
    setTaskToEdit(null);
    setIsAddOpen(true);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1700px] mx-auto space-y-4 flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/task-management">
            <Button variant="ghost" size="icon" className="size-8 text-muted-foreground">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Interactive Gantt Chart
            </h1>
            <p className="text-xs text-muted-foreground">
              Visualize project timelines, key deliveries, milestones, and download high-resolution PNG or SVG charts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsImportOpen(true)}
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 border-emerald-600/30 text-emerald-700 dark:text-emerald-400 font-medium"
          >
            <FileSpreadsheet className="size-4" />
            Import Excel
          </Button>
          <Button onClick={handleAdd} size="sm" className="h-9 gap-1.5 font-medium shadow-xs">
            <Plus className="size-4" />
            New Task
          </Button>
        </div>
      </div>

      {/* Main Gantt Canvas (flex-1 to fill the remaining page height) */}
      <div className="flex-1 min-h-0">
        <GanttChart onEditTask={handleEdit} />
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
