"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TaskItem, PriorityLevel, TaskStatus } from "@/types/task";
import { useTasks } from "@/context/task-context";
import { computeDefaultStartDate, normalizeDate } from "@/lib/task-utils";

interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskToEdit?: TaskItem | null;
}

export function TaskFormDialog({
  open,
  onOpenChange,
  taskToEdit,
}: TaskFormDialogProps) {
  const { addTask, updateTask, categories, projects, resources } = useTasks();

  const [category, setCategory] = useState("");
  const [mainProject, setMainProject] = useState("");
  const [keyProjectDeliveries, setKeyProjectDeliveries] = useState("");
  const [taskName, setTaskName] = useState("");
  const [priority, setPriority] = useState<PriorityLevel>("Medium");
  const [status, setStatus] = useState<TaskStatus>("Not Started");
  const [resource, setResource] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [comments, setComments] = useState("");
  const [progress, setProgress] = useState<number>(0);

  // Populate when opened or taskToEdit changes
  useEffect(() => {
    if (taskToEdit) {
      setCategory(taskToEdit.category || "");
      setMainProject(taskToEdit.mainProject || "");
      setKeyProjectDeliveries(taskToEdit.keyProjectDeliveries || "");
      setTaskName(taskToEdit.taskName || "");
      setPriority(taskToEdit.priority || "Medium");
      setStatus(taskToEdit.status || "Not Started");
      setResource(taskToEdit.resource || "");
      setEndDate(taskToEdit.endDate || "");
      setStartDate(taskToEdit.startDate || computeDefaultStartDate(taskToEdit.endDate));
      setComments(taskToEdit.comments || "");
      setProgress(taskToEdit.progress ?? 0);
    } else {
      const today = new Date().toISOString().split("T")[0];
      const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];
      setCategory(categories[0] || "General");
      setMainProject(projects[0] || "Main Project");
      setKeyProjectDeliveries("Deliverable 1");
      setTaskName("");
      setPriority("Medium");
      setStatus("Not Started");
      setResource(resources[0] || "Unassigned");
      setStartDate(today);
      setEndDate(nextWeek);
      setComments("");
      setProgress(0);
    }
  }, [taskToEdit, open, categories, projects, resources]);

  // Automatically update start date if end date changes and start date is empty
  const handleEndDateChange = (val: string) => {
    setEndDate(val);
    if (!startDate || new Date(startDate) > new Date(val)) {
      setStartDate(computeDefaultStartDate(val, 7));
    }
  };

  const handleStatusChange = (val: TaskStatus) => {
    setStatus(val);
    if (val === "Completed") setProgress(100);
    else if (val === "In Progress" && progress === 0) setProgress(50);
    else if (val === "Not Started") setProgress(0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim()) return;

    const finalEndDate = normalizeDate(endDate);
    const finalStartDate = startDate ? normalizeDate(startDate) : computeDefaultStartDate(finalEndDate);

    const payload = {
      category: category.trim() || "General",
      mainProject: mainProject.trim() || "Main Project",
      keyProjectDeliveries: keyProjectDeliveries.trim() || "General Deliverable",
      taskName: taskName.trim(),
      priority,
      status,
      resource: resource.trim() || "Unassigned",
      startDate: finalStartDate,
      endDate: finalEndDate,
      comments: comments.trim(),
      progress: Number(progress) || 0,
    };

    if (taskToEdit) {
      updateTask(taskToEdit.id, payload);
    } else {
      addTask(payload);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            {taskToEdit ? "Edit Task" : "Add New Task"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Configure the task details matching your project Excel sheet columns.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Main Project & Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Main Project <span className="text-destructive">*</span>
              </label>
              <Input
                required
                value={mainProject}
                onChange={(e) => setMainProject(e.target.value)}
                placeholder="e.g. Enterprise Sales Analytics"
                className="h-9 text-xs"
                list="project-suggestions"
              />
              <datalist id="project-suggestions">
                {projects.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Category <span className="text-destructive">*</span>
              </label>
              <Input
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. BI & Analytics, Data Engineering"
                className="h-9 text-xs"
                list="category-suggestions"
              />
              <datalist id="category-suggestions">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Key Deliveries & Task Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Key Project Deliveries <span className="text-destructive">*</span>
              </label>
              <Input
                required
                value={keyProjectDeliveries}
                onChange={(e) => setKeyProjectDeliveries(e.target.value)}
                placeholder="e.g. Executive KPI Dashboard"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Task Name <span className="text-destructive">*</span>
              </label>
              <Input
                required
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                placeholder="e.g. Build Snowflake Data Ingestion"
                className="h-9 text-xs font-medium"
              />
            </div>
          </div>

          {/* Priority, Status, Resource */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Priority</label>
              <Select
                value={priority}
                onValueChange={(val) => setPriority(val as PriorityLevel)}
              >
                <SelectTrigger className="h-9 w-full text-xs">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Critical">🔴 Critical</SelectItem>
                  <SelectItem value="High">🟠 High</SelectItem>
                  <SelectItem value="Medium">🔵 Medium</SelectItem>
                  <SelectItem value="Low">⚪ Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Status</label>
              <Select
                value={status}
                onValueChange={(val) => handleStatusChange(val as TaskStatus)}
              >
                <SelectTrigger className="h-9 w-full text-xs">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Not Started">⚪ Not Started</SelectItem>
                  <SelectItem value="In Progress">🔵 In Progress</SelectItem>
                  <SelectItem value="Under Review">🟣 Under Review</SelectItem>
                  <SelectItem value="Completed">🟢 Completed</SelectItem>
                  <SelectItem value="Delayed">🔴 Delayed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Resource (Owner)
              </label>
              <Input
                value={resource}
                onChange={(e) => setResource(e.target.value)}
                placeholder="e.g. Anjalee K."
                className="h-9 text-xs"
                list="resource-suggestions"
              />
              <datalist id="resource-suggestions">
                {resources.map((r) => (
                  <option key={r} value={r} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Start Date, End Date, Progress */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Start Date
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                End Date (Deadline) <span className="text-destructive">*</span>
              </label>
              <Input
                type="date"
                required
                value={endDate}
                onChange={(e) => handleEndDateChange(e.target.value)}
                className="h-9 text-xs font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-foreground">Progress</label>
                <span className="text-xs text-muted-foreground font-mono">{progress}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={progress}
                onChange={(e) => setProgress(Number(e.target.value))}
                className="w-full accent-primary mt-2 cursor-pointer"
              />
            </div>
          </div>

          {/* Comments */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Comments / Notes</label>
            <Textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="e.g. Blockers, milestones, signoffs, dependencies..."
              rows={3}
              className="text-xs resize-none"
            />
          </div>

          <DialogFooter className="pt-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm">
              {taskToEdit ? "Update Task" : "Add Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
