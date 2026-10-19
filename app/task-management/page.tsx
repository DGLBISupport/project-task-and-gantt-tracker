"use client";

import React, { useState } from "react";
import { TaskTable } from "@/components/tasks/task-table";
import { TaskFormDialog } from "@/components/tasks/task-form-dialog";
import { ImportExcelDialog } from "@/components/tasks/import-excel-dialog";
import { GanttChart } from "@/components/gantt/gantt-chart";
import { TaskItem } from "@/types/task";
import { Button } from "@/components/ui/button";
import { ListFilter, CalendarRange, Table2, Plus, FileSpreadsheet } from "lucide-react";

export default function TaskManagementPage() {
  const [activeView, setActiveView] = useState<"table" | "gantt">("table");
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
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Project Task Management
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Manage your project deliverables, enter tasks, import from Excel, and generate downloadable Gantt charts.
          </p>
        </div>

        {/* View Switcher Tabs & Quick Buttons */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-border bg-muted/40 p-1">
            <button
              onClick={() => setActiveView("table")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeView === "table"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Table2 className="size-3.5" />
              Task Table
            </button>
            <button
              onClick={() => setActiveView("gantt")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeView === "gantt"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <CalendarRange className="size-3.5" />
              Gantt View
            </button>
          </div>

          <Button onClick={handleAdd} size="sm" className="h-9 gap-1 font-medium shadow-xs">
            <Plus className="size-4" />
            New Task
          </Button>

          <Button
            onClick={() => setIsImportOpen(true)}
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 border-emerald-600/30 text-emerald-700 dark:text-emerald-400 font-medium"
          >
            <FileSpreadsheet className="size-4" />
            Import Excel
          </Button>
        </div>
      </div>

      {/* Active View: Table or Gantt Chart */}
      {activeView === "table" ? (
        <TaskTable
          onAddTask={handleAdd}
          onEditTask={handleEdit}
          onOpenImport={() => setIsImportOpen(true)}
        />
      ) : (
        <div className="h-[750px]">
          <GanttChart onEditTask={handleEdit} />
        </div>
      )}

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