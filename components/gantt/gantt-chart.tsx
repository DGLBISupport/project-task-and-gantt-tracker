"use client";

import React, { useState, useMemo, useRef } from "react";
import {
  TaskItem,
  GanttTimeScale,
  GanttGrouping,
  GanttColorMode,
} from "@/types/task";
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
  Download,
  Calendar,
  Layers,
  Palette,
  Search,
  Filter,
  Maximize2,
  Printer,
  ChevronRight,
  ChevronDown,
  Info,
  Clock,
  User,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
} from "lucide-react";
import { exportToCsv, downloadCsvFile } from "@/lib/task-utils";
import { toast } from "sonner";

interface GanttChartProps {
  onEditTask?: (task: TaskItem) => void;
}

export function GanttChart({ onEditTask }: GanttChartProps) {
  const { filteredTasks, tasks, categories, projects, resources, filters, setFilters, resetFilters } =
    useTasks();

  const [timeScale, setTimeScale] = useState<GanttTimeScale>("week");
  const [grouping, setGrouping] = useState<GanttGrouping>("project");
  const [colorMode, setColorMode] = useState<GanttColorMode>("status");
  const [hoveredTask, setHoveredTask] = useState<TaskItem | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const containerRef = useRef<HTMLDivElement>(null);
  const ganttSvgRef = useRef<SVGSVGElement>(null);

  const toggleGroup = (key: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // 1. Determine timeline boundaries from tasks
  const { minDate, maxDate, totalDays, datesArray } = useMemo(() => {
    if (tasks.length === 0) {
      const today = new Date();
      const start = new Date(today);
      start.setDate(today.getDate() - 7);
      const end = new Date(today);
      end.setDate(today.getDate() + 21);
      return {
        minDate: start,
        maxDate: end,
        totalDays: 28,
        datesArray: [],
      };
    }

    let minTimestamp = Infinity;
    let maxTimestamp = -Infinity;

    tasks.forEach((t) => {
      const s = new Date(t.startDate || t.endDate).getTime();
      const e = new Date(t.endDate).getTime();
      if (!isNaN(s) && s < minTimestamp) minTimestamp = s;
      if (!isNaN(e) && e > maxTimestamp) maxTimestamp = e;
    });

    const todayTs = Date.now();
    if (minTimestamp > todayTs) minTimestamp = todayTs;
    if (maxTimestamp < todayTs) maxTimestamp = todayTs;

    // Add padding (7 days before, 14 days after)
    const minD = new Date(minTimestamp);
    minD.setDate(minD.getDate() - 5);
    minD.setHours(0, 0, 0, 0);

    const maxD = new Date(maxTimestamp);
    maxD.setDate(maxD.getDate() + 10);
    maxD.setHours(23, 59, 59, 999);

    const diffDays = Math.max(14, Math.ceil((maxD.getTime() - minD.getTime()) / 86400000));

    const arr: Date[] = [];
    for (let i = 0; i < diffDays; i++) {
      const d = new Date(minD);
      d.setDate(minD.getDate() + i);
      arr.push(d);
    }

    return {
      minDate: minD,
      maxDate: maxD,
      totalDays: diffDays,
      datesArray: arr,
    };
  }, [tasks]);

  // Column width based on scale
  const colWidth = useMemo(() => {
    if (timeScale === "day") return 40;
    if (timeScale === "week") return 24;
    return 14; // month view
  }, [timeScale]);

  const timelineWidth = Math.max(800, totalDays * colWidth);
  const leftColWidth = 320; // Task info table width

  // Helper: date to X coordinate on the SVG
  const getXForDate = (dateStr: string | undefined): number => {
    if (!dateStr) return 0;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 0;
    const diff = (d.getTime() - minDate.getTime()) / 86400000;
    return Math.max(0, diff * colWidth);
  };

  const todayX = getXForDate(new Date().toISOString().split("T")[0]);

  // Color mapper
  const getTaskColor = (task: TaskItem): { bg: string; border: string; text: string } => {
    if (colorMode === "priority") {
      switch (task.priority) {
        case "Critical":
          return { bg: "#f43f5e", border: "#e11d48", text: "#ffffff" };
        case "High":
          return { bg: "#f97316", border: "#ea580c", text: "#ffffff" };
        case "Medium":
          return { bg: "#3b82f6", border: "#2563eb", text: "#ffffff" };
        case "Low":
          return { bg: "#94a3b8", border: "#64748b", text: "#ffffff" };
      }
    } else if (colorMode === "status") {
      switch (task.status) {
        case "Completed":
          return { bg: "#10b981", border: "#059669", text: "#ffffff" };
        case "In Progress":
          return { bg: "#0284c7", border: "#0369a1", text: "#ffffff" };
        case "Under Review":
          return { bg: "#8b5cf6", border: "#7c3aed", text: "#ffffff" };
        case "Delayed":
          return { bg: "#ef4444", border: "#dc2626", text: "#ffffff" };
        case "Not Started":
          return { bg: "#64748b", border: "#475569", text: "#ffffff" };
      }
    } else {
      // By category hash
      const hash = task.category.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
      const colors = [
        { bg: "#0d9488", border: "#0f766e", text: "#ffffff" },
        { bg: "#6366f1", border: "#4f46e5", text: "#ffffff" },
        { bg: "#d97706", border: "#b45309", text: "#ffffff" },
        { bg: "#ec4899", border: "#db2777", text: "#ffffff" },
        { bg: "#06b6d4", border: "#0891b2", text: "#ffffff" },
      ];
      return colors[hash % colors.length];
    }
  };

  // Grouped task structure
  const groupedStructure = useMemo(() => {
    if (grouping === "none") {
      return [{ key: "all", title: "All Tasks", items: filteredTasks }];
    }

    if (grouping === "project") {
      const map: Record<string, TaskItem[]> = {};
      filteredTasks.forEach((t) => {
        const key = t.mainProject || "Unassigned Project";
        if (!map[key]) map[key] = [];
        map[key].push(t);
      });
      return Object.keys(map).map((k) => ({
        key: k,
        title: k,
        items: map[k],
      }));
    }

    if (grouping === "category") {
      const map: Record<string, TaskItem[]> = {};
      filteredTasks.forEach((t) => {
        const key = t.category || "General";
        if (!map[key]) map[key] = [];
        map[key].push(t);
      });
      return Object.keys(map).map((k) => ({
        key: k,
        title: k,
        items: map[k],
      }));
    }

    if (grouping === "resource") {
      const map: Record<string, TaskItem[]> = {};
      filteredTasks.forEach((t) => {
        const key = t.resource || "Unassigned";
        if (!map[key]) map[key] = [];
        map[key].push(t);
      });
      return Object.keys(map).map((k) => ({
        key: k,
        title: k,
        items: map[k],
      }));
    }

    if (grouping === "status") {
      const map: Record<string, TaskItem[]> = {};
      filteredTasks.forEach((t) => {
        const key = t.status || "Not Started";
        if (!map[key]) map[key] = [];
        map[key].push(t);
      });
      return Object.keys(map).map((k) => ({
        key: k,
        title: k,
        items: map[k],
      }));
    }

    return [{ key: "all", title: "All Tasks", items: filteredTasks }];
  }, [filteredTasks, grouping]);

  // Calculate row positions
  const rowHeight = 44;
  const headerHeight = 52;
  const groupHeaderHeight = 34;

  let currentY = 0;
  const rows: Array<
    | { type: "group"; key: string; title: string; count: number; y: number }
    | { type: "task"; task: TaskItem; y: number; index: number }
  > = [];

  groupedStructure.forEach((group) => {
    if (grouping !== "none") {
      rows.push({
        type: "group",
        key: group.key,
        title: group.title,
        count: group.items.length,
        y: currentY,
      });
      currentY += groupHeaderHeight;
    }

    const isCollapsed = collapsedGroups[group.key];
    if (!isCollapsed) {
      group.items.forEach((task, idx) => {
        rows.push({
          type: "task",
          task,
          y: currentY,
          index: idx,
        });
        currentY += rowHeight;
      });
    }
  });

  const totalContentHeight = Math.max(300, currentY);

  // Jump to today in timeline
  const scrollToToday = () => {
    if (containerRef.current) {
      containerRef.current.scrollLeft = Math.max(0, todayX - 250);
    }
  };

  // Export to PNG using Canvas rendering
  const handleDownloadPNG = async () => {
    setIsExporting(true);
    toast.info("Generating high-resolution Gantt Chart image...");

    try {
      const canvas = document.createElement("canvas");
      const scaleFactor = 2; // High-res retina
      const exportWidth = leftColWidth + timelineWidth;
      const exportHeight = headerHeight + totalContentHeight + 80; // with footer legend

      canvas.width = exportWidth * scaleFactor;
      canvas.height = exportHeight * scaleFactor;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not initialize canvas context");

      ctx.scale(scaleFactor, scaleFactor);

      // Background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, exportWidth, exportHeight);

      // Banner Header
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, exportWidth, 40);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 15px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillText("Project Task & Gantt Tracker", 20, 25);

      ctx.font = "normal 11px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillStyle = "#94a3b8";
      ctx.fillText(
        `Generated: ${new Date().toLocaleDateString()} | Total Tasks: ${filteredTasks.length}`,
        exportWidth - 260,
        25
      );

      // Draw Left Header
      const startY = 40;
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(0, startY, leftColWidth, headerHeight);
      ctx.fillStyle = "#475569";
      ctx.font = "bold 12px sans-serif";
      ctx.fillText("Task Name / Project", 16, startY + 32);
      ctx.fillText("Resource", leftColWidth - 110, startY + 32);

      // Draw Timeline Header
      ctx.fillStyle = "#f1f5f9";
      ctx.fillRect(leftColWidth, startY, timelineWidth, headerHeight);

      // Draw Day / Week columns
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 1;

      datesArray.forEach((d, idx) => {
        const x = leftColWidth + idx * colWidth;
        const isMonday = d.getDay() === 1;
        const isMonthStart = d.getDate() === 1;

        if (timeScale === "day" || isMonday || isMonthStart) {
          ctx.beginPath();
          ctx.moveTo(x, startY);
          ctx.lineTo(x, startY + headerHeight + totalContentHeight);
          ctx.stroke();

          ctx.fillStyle = isMonday ? "#0f172a" : "#64748b";
          ctx.font = isMonday ? "bold 10px sans-serif" : "9px sans-serif";
          ctx.fillText(`${d.getDate()}`, x + 4, startY + 44);

          if (isMonday || isMonthStart) {
            ctx.fillStyle = "#2563eb";
            ctx.font = "bold 10px sans-serif";
            const monthName = d.toLocaleDateString("en-US", { month: "short" });
            ctx.fillText(`${monthName}`, x + 4, startY + 20);
          }
        }
      });

      // Today line
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(leftColWidth + todayX, startY);
      ctx.lineTo(leftColWidth + todayX, startY + headerHeight + totalContentHeight);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Rows & Bars
      rows.forEach((row) => {
        const rowY = startY + headerHeight + row.y;

        if (row.type === "group") {
          ctx.fillStyle = "#f8fafc";
          ctx.fillRect(0, rowY, exportWidth, groupHeaderHeight);
          ctx.strokeStyle = "#cbd5e1";
          ctx.strokeRect(0, rowY, exportWidth, groupHeaderHeight);

          ctx.fillStyle = "#0f172a";
          ctx.font = "bold 12px sans-serif";
          ctx.fillText(`📁 ${row.title} (${row.count} tasks)`, 16, rowY + 22);
        } else {
          // Task row background
          ctx.fillStyle = row.index % 2 === 0 ? "#ffffff" : "#fbfcfd";
          ctx.fillRect(0, rowY, exportWidth, rowHeight);
          ctx.strokeStyle = "#f1f5f9";
          ctx.strokeRect(0, rowY, exportWidth, rowHeight);

          // Left table texts
          ctx.fillStyle = "#0f172a";
          ctx.font = "500 12px sans-serif";
          ctx.fillText(row.task.taskName, 20, rowY + 22);

          ctx.fillStyle = "#64748b";
          ctx.font = "10px sans-serif";
          ctx.fillText(
            `${row.task.keyProjectDeliveries || row.task.category} • Due: ${row.task.endDate}`,
            20,
            rowY + 36
          );

          ctx.fillStyle = "#334155";
          ctx.font = "11px sans-serif";
          ctx.fillText(row.task.resource, leftColWidth - 110, rowY + 26);

          // Draw Gantt Bar
          const barStart = leftColWidth + getXForDate(row.task.startDate || row.task.endDate);
          const barEnd = leftColWidth + getXForDate(row.task.endDate) + colWidth;
          const barWidth = Math.max(colWidth, barEnd - barStart);
          const barH = 22;
          const barY = rowY + (rowHeight - barH) / 2;

          const colors = getTaskColor(row.task);

          // Bar background
          ctx.fillStyle = colors.bg;
          ctx.beginPath();
          ctx.roundRect(barStart, barY, barWidth, barH, 4);
          ctx.fill();

          // Progress fill
          if (row.task.progress && row.task.progress > 0) {
            ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
            ctx.beginPath();
            ctx.roundRect(barStart, barY, (barWidth * row.task.progress) / 100, barH, 4);
            ctx.fill();
          }

          // Bar label
          ctx.fillStyle = colors.text;
          ctx.font = "bold 10px sans-serif";
          ctx.fillText(row.task.taskName, barStart + 8, barY + 15);
        }
      });

      // Export canvas to PNG
      const link = document.createElement("a");
      link.download = `Gantt_Chart_${new Date().toISOString().split("T")[0]}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("Gantt Chart downloaded as PNG!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to export image. Please try SVG export.");
    } finally {
      setIsExporting(false);
    }
  };

  // Export to SVG file
  const handleDownloadSVG = () => {
    if (!ganttSvgRef.current) return;
    try {
      const serializer = new XMLSerializer();
      let source = serializer.serializeToString(ganttSvgRef.current);
      source = '<?xml version="1.0" standalone="no"?>\r\n' + source;
      const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(source);
      const link = document.createElement("a");
      link.download = `Gantt_Chart_${new Date().toISOString().split("T")[0]}.svg`;
      link.href = url;
      link.click();
      toast.success("Gantt Chart downloaded as SVG!");
    } catch (e) {
      toast.error("Could not export SVG");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col h-full bg-background rounded-xl border border-border shadow-xs overflow-hidden">
      {/* Top Toolbar */}
      <div className="p-3 border-b border-border bg-card/60 flex flex-wrap items-center justify-between gap-3">
        {/* Left: View Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Time scale */}
          <div className="flex items-center rounded-lg border border-border bg-muted/30 p-0.5">
            <button
              onClick={() => setTimeScale("day")}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                timeScale === "day"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setTimeScale("week")}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                timeScale === "week"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setTimeScale("month")}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                timeScale === "month"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Month
            </button>
          </div>

          {/* Grouping */}
          <div className="flex items-center gap-1 text-xs">
            <Layers className="size-3.5 text-muted-foreground" />
            <Select value={grouping} onValueChange={(v) => setGrouping(v as GanttGrouping)}>
              <SelectTrigger className="h-8 text-xs w-[140px]">
                <SelectValue placeholder="Group by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="project">Main Project</SelectItem>
                <SelectItem value="category">Category</SelectItem>
                <SelectItem value="resource">Resource</SelectItem>
                <SelectItem value="status">Status</SelectItem>
                <SelectItem value="none">Flat List</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Color Mode */}
          <div className="flex items-center gap-1 text-xs">
            <Palette className="size-3.5 text-muted-foreground" />
            <Select value={colorMode} onValueChange={(v) => setColorMode(v as GanttColorMode)}>
              <SelectTrigger className="h-8 text-xs w-[130px]">
                <SelectValue placeholder="Color by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="status">Color by Status</SelectItem>
                <SelectItem value="priority">Color by Priority</SelectItem>
                <SelectItem value="category">Color by Category</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Jump to Today */}
          <Button variant="outline" size="sm" onClick={scrollToToday} className="h-8 text-xs gap-1.5">
            <Calendar className="size-3.5" />
            Today
          </Button>
        </div>

        {/* Right: Export & Download Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Download as PNG */}
          <Button
            size="sm"
            onClick={handleDownloadPNG}
            disabled={isExporting}
            className="h-8 text-xs gap-1.5 font-medium shadow-xs"
          >
            <Download className="size-3.5" />
            {isExporting ? "Exporting..." : "Download PNG"}
          </Button>

          {/* Download as SVG */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadSVG}
            className="h-8 text-xs gap-1.5 hidden sm:flex"
          >
            SVG
          </Button>

          {/* Export to Excel / CSV */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const csv = exportToCsv(filteredTasks);
              downloadCsvFile(csv, `project_tasks_${new Date().toISOString().split("T")[0]}.csv`);
              toast.success("Tasks exported as Excel-compatible CSV");
            }}
            className="h-8 text-xs gap-1.5"
          >
            <FileSpreadsheet className="size-3.5 text-emerald-600" />
            Excel
          </Button>

          {/* Print */}
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="h-8 text-xs gap-1.5 hidden md:flex"
            title="Print or Save as PDF"
          >
            <Printer className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Filter Quick Strip */}
      <div className="px-3 py-2 border-b border-border/80 bg-muted/20 flex flex-wrap items-center justify-between text-xs gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-44">
            <Search className="size-3.5 absolute left-2 top-2 text-muted-foreground" />
            <Input
              value={filters.search}
              onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
              placeholder="Search in gantt..."
              className="h-7 text-xs pl-7 bg-background"
            />
          </div>

          <Select
            value={filters.mainProject}
            onValueChange={(v) => setFilters((p) => ({ ...p, mainProject: v }))}
          >
            <SelectTrigger className="h-7 text-xs w-[130px] bg-background">
              <SelectValue placeholder="Project" />
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

          <Select
            value={filters.status}
            onValueChange={(v) => setFilters((p) => ({ ...p, status: v }))}
          >
            <SelectTrigger className="h-7 text-xs w-[120px] bg-background">
              <SelectValue placeholder="Status" />
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

          {(filters.search || filters.mainProject !== "all" || filters.status !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="h-7 text-[11px] text-muted-foreground hover:text-foreground"
            >
              Reset Filters
            </Button>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          {colorMode === "status" ? (
            <>
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-emerald-500" /> Completed
              </span>
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-sky-500" /> In Progress
              </span>
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-purple-500" /> Review
              </span>
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-rose-500" /> Delayed
              </span>
            </>
          ) : (
            <>
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-rose-500" /> Critical
              </span>
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-orange-500" /> High
              </span>
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-blue-500" /> Medium
              </span>
            </>
          )}
          <span className="flex items-center gap-1 text-red-500 font-medium">
            <span className="w-3 border-t-2 border-dashed border-red-500 inline-block" /> Today
          </span>
        </div>
      </div>

      {/* Main Gantt Canvas / Scroll Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Side: Fixed Task Tree Columns */}
        <div
          style={{ width: `${leftColWidth}px` }}
          className="shrink-0 border-r border-border bg-card/90 z-20 flex flex-col shadow-xs"
        >
          {/* Header */}
          <div
            style={{ height: `${headerHeight}px` }}
            className="border-b border-border flex items-center px-4 font-semibold text-xs text-muted-foreground bg-muted/40"
          >
            <span className="flex-1">Task & Deliverable</span>
            <span className="w-24 text-right">Owner</span>
          </div>

          {/* Task rows */}
          <div className="flex-1 overflow-y-hidden">
            {rows.map((row, idx) => {
              if (row.type === "group") {
                const isCollapsed = collapsedGroups[row.key];
                return (
                  <div
                    key={`group-left-${row.key}`}
                    onClick={() => toggleGroup(row.key)}
                    style={{ height: `${groupHeaderHeight}px` }}
                    className="flex items-center gap-2 px-3 bg-muted/60 border-b border-border/80 font-bold text-xs text-foreground cursor-pointer hover:bg-muted select-none"
                  >
                    {isCollapsed ? (
                      <ChevronRight className="size-3.5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="size-3.5 text-muted-foreground" />
                    )}
                    <span className="truncate flex-1">{row.title}</span>
                    <span className="text-[10px] bg-background/80 px-1.5 py-0.5 rounded text-muted-foreground font-normal">
                      {row.count}
                    </span>
                  </div>
                );
              }

              return (
                <div
                  key={`task-left-${row.task.id}`}
                  style={{ height: `${rowHeight}px` }}
                  onClick={() => onEditTask?.(row.task)}
                  className="flex items-center px-4 border-b border-border/60 hover:bg-muted/40 transition-colors cursor-pointer group"
                >
                  <div className="flex flex-col min-w-0 flex-1 pr-2">
                    <span className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                      {row.task.taskName}
                    </span>
                    <span className="text-[10px] text-muted-foreground truncate">
                      {row.task.keyProjectDeliveries || row.task.category}
                    </span>
                  </div>
                  <div className="w-24 text-right truncate">
                    <span className="text-[11px] font-medium text-foreground/80">
                      {row.task.resource}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Horizontal Scrollable Timeline */}
        <div
          ref={containerRef}
          className="flex-1 overflow-x-auto overflow-y-auto relative bg-background select-none"
        >
          <div
            style={{
              width: `${timelineWidth}px`,
              minHeight: `${headerHeight + totalContentHeight}px`,
            }}
            className="relative"
          >
            {/* SVG Canvas for Gantt Rendering */}
            <svg
              ref={ganttSvgRef}
              width={timelineWidth}
              height={headerHeight + totalContentHeight}
              className="absolute inset-0 block"
            >
              {/* Header Background */}
              <rect
                x="0"
                y="0"
                width={timelineWidth}
                height={headerHeight}
                fill="var(--color-muted)"
                opacity="0.3"
              />
              <line
                x1="0"
                y1={headerHeight}
                x2={timelineWidth}
                y2={headerHeight}
                stroke="var(--color-border)"
                strokeWidth="1"
              />

              {/* Grid vertical lines & Date labels */}
              {datesArray.map((date, idx) => {
                const x = idx * colWidth;
                const isMonday = date.getDay() === 1;
                const isMonthStart = date.getDate() === 1;
                const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                return (
                  <g key={`grid-col-${idx}`}>
                    {/* Weekend shading */}
                    {isWeekend && (
                      <rect
                        x={x}
                        y={headerHeight}
                        width={colWidth}
                        height={totalContentHeight}
                        fill="currentColor"
                        className="text-muted/20"
                      />
                    )}

                    {/* Vertical line */}
                    {(timeScale === "day" || isMonday || isMonthStart) && (
                      <line
                        x1={x}
                        y1={0}
                        x2={x}
                        y2={headerHeight + totalContentHeight}
                        stroke="var(--color-border)"
                        strokeWidth="1"
                        strokeDasharray={isMonday ? undefined : "2 2"}
                        opacity={isMonday ? "0.8" : "0.4"}
                      />
                    )}

                    {/* Month Label */}
                    {(isMonthStart || (idx === 0 && date.getDate() <= 7)) && (
                      <text
                        x={x + 4}
                        y={18}
                        fontSize="11"
                        fontWeight="bold"
                        fill="var(--color-foreground)"
                      >
                        {date.toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                      </text>
                    )}

                    {/* Day / Week Header text */}
                    <text
                      x={x + (colWidth > 30 ? colWidth / 2 : 4)}
                      y={headerHeight - 12}
                      textAnchor={colWidth > 30 ? "middle" : "start"}
                      fontSize={timeScale === "day" ? "10" : "9"}
                      fontWeight={isMonday ? "bold" : "normal"}
                      fill={isMonday ? "var(--color-primary)" : "var(--color-muted-foreground)"}
                    >
                      {timeScale === "month"
                        ? isMonthStart
                          ? date.toLocaleDateString("en-US", { month: "narrow" })
                          : ""
                        : date.getDate()}
                    </text>
                  </g>
                );
              })}

              {/* Today line */}
              {todayX > 0 && todayX < timelineWidth && (
                <g>
                  <line
                    x1={todayX}
                    y1={headerHeight}
                    x2={todayX}
                    y2={headerHeight + totalContentHeight}
                    stroke="#ef4444"
                    strokeWidth="2"
                    strokeDasharray="4 3"
                  />
                  <rect
                    x={todayX - 22}
                    y={headerHeight - 20}
                    width={44}
                    height={16}
                    rx="3"
                    fill="#ef4444"
                  />
                  <text
                    x={todayX}
                    y={headerHeight - 8}
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="bold"
                    fill="#ffffff"
                  >
                    TODAY
                  </text>
                </g>
              )}

              {/* Rows */}
              {rows.map((row) => {
                const rowY = headerHeight + row.y;

                if (row.type === "group") {
                  return (
                    <g key={`svg-group-${row.key}`}>
                      <rect
                        x="0"
                        y={rowY}
                        width={timelineWidth}
                        height={groupHeaderHeight}
                        fill="var(--color-muted)"
                        opacity="0.5"
                      />
                      <line
                        x1="0"
                        y1={rowY + groupHeaderHeight}
                        x2={timelineWidth}
                        y2={rowY + groupHeaderHeight}
                        stroke="var(--color-border)"
                        strokeWidth="1"
                      />
                    </g>
                  );
                }

                // Task bar calculations
                const task = row.task;
                const startX = getXForDate(task.startDate || task.endDate);
                const endX = getXForDate(task.endDate) + colWidth;
                const barWidth = Math.max(colWidth * 0.8, endX - startX);
                const barH = 24;
                const barY = rowY + (rowHeight - barH) / 2;
                const colors = getTaskColor(task);
                const progressPct = task.progress || 0;

                return (
                  <g
                    key={`svg-task-${task.id}`}
                    className="cursor-pointer group"
                    onClick={() => onEditTask?.(task)}
                    onMouseEnter={(e) => {
                      const rect = containerRef.current?.getBoundingClientRect();
                      if (rect) {
                        setHoverPos({
                          x: e.clientX - rect.left,
                          y: e.clientY - rect.top,
                        });
                      }
                      setHoveredTask(task);
                    }}
                    onMouseMove={(e) => {
                      const rect = containerRef.current?.getBoundingClientRect();
                      if (rect) {
                        setHoverPos({
                          x: e.clientX - rect.left,
                          y: e.clientY - rect.top,
                        });
                      }
                    }}
                    onMouseLeave={() => setHoveredTask(null)}
                  >
                    {/* Row boundary line */}
                    <line
                      x1="0"
                      y1={rowY + rowHeight}
                      x2={timelineWidth}
                      y2={rowY + rowHeight}
                      stroke="var(--color-border)"
                      strokeWidth="1"
                      opacity="0.4"
                    />

                    {/* Task Bar Base */}
                    <rect
                      x={startX}
                      y={barY}
                      width={barWidth}
                      height={barH}
                      rx="5"
                      ry="5"
                      fill={colors.bg}
                      stroke={colors.border}
                      strokeWidth="1.5"
                      className="filter drop-shadow-xs transition-opacity hover:opacity-90"
                    />

                    {/* Progress Fill */}
                    {progressPct > 0 && (
                      <rect
                        x={startX}
                        y={barY}
                        width={(barWidth * progressPct) / 100}
                        height={barH}
                        rx="5"
                        ry="5"
                        fill="rgba(255, 255, 255, 0.25)"
                      />
                    )}

                    {/* Milestone diamond at End Date */}
                    <polygon
                      points={`${endX},${barY + barH / 2 - 5} ${endX + 5},${barY + barH / 2} ${endX},${
                        barY + barH / 2 + 5
                      } ${endX - 5},${barY + barH / 2}`}
                      fill="#ffffff"
                      stroke={colors.border}
                      strokeWidth="1.5"
                    />

                    {/* Bar Text Label */}
                    {barWidth > 45 && (
                      <text
                        x={startX + 8}
                        y={barY + 16}
                        fontSize="10"
                        fontWeight="600"
                        fill={colors.text}
                        className="pointer-events-none select-none"
                      >
                        {task.taskName}
                      </text>
                    )}

                    {/* Completion indicator if 100% */}
                    {task.status === "Completed" && (
                      <circle
                        cx={startX + barWidth - 10}
                        cy={barY + barH / 2}
                        r="4"
                        fill="#ffffff"
                      />
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Hover Popover Tooltip */}
        {hoveredTask && hoverPos && (
          <div
            style={{
              position: "absolute",
              left: Math.min(hoverPos.x + 15, (containerRef.current?.clientWidth || 600) - 280),
              top: Math.max(10, hoverPos.y - 120),
            }}
            className="z-50 pointer-events-none bg-popover/95 backdrop-blur-md text-popover-foreground border border-border p-3.5 rounded-xl shadow-xl w-72 text-xs space-y-2 animate-in fade-in-50 zoom-in-95"
          >
            <div className="flex items-start justify-between gap-2 border-b border-border/80 pb-2">
              <div>
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">
                  {hoveredTask.mainProject}
                </span>
                <p className="font-bold text-sm text-foreground leading-tight">
                  {hoveredTask.taskName}
                </p>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${
                  hoveredTask.priority === "Critical"
                    ? "bg-rose-500/20 text-rose-600 dark:text-rose-400"
                    : hoveredTask.priority === "High"
                    ? "bg-orange-500/20 text-orange-600 dark:text-orange-400"
                    : "bg-blue-500/20 text-blue-600 dark:text-blue-400"
                }`}
              >
                {hoveredTask.priority}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-muted-foreground block text-[10px]">Deliverable:</span>
                <span className="font-medium text-foreground truncate block">
                  {hoveredTask.keyProjectDeliveries || "—"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">Category:</span>
                <span className="font-medium text-foreground truncate block">
                  {hoveredTask.category || "—"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">Resource:</span>
                <span className="font-medium text-foreground truncate block flex items-center gap-1">
                  <User className="size-3 text-muted-foreground" />
                  {hoveredTask.resource}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">Status:</span>
                <span className="font-medium text-foreground truncate block">
                  {hoveredTask.status} ({hoveredTask.progress || 0}%)
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">Start Date:</span>
                <span className="font-mono text-foreground">{hoveredTask.startDate || "—"}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">End Date:</span>
                <span className="font-mono text-foreground font-semibold text-primary">
                  {hoveredTask.endDate}
                </span>
              </div>
            </div>

            {hoveredTask.comments && (
              <div className="bg-muted/50 p-2 rounded border border-border/60 text-[11px]">
                <span className="text-muted-foreground text-[10px] block font-semibold">
                  Comments:
                </span>
                <p className="text-foreground italic line-clamp-2">"{hoveredTask.comments}"</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Empty State */}
      {filteredTasks.length === 0 && (
        <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
          <AlertTriangle className="size-8 text-amber-500" />
          <p className="text-sm font-semibold text-foreground">No tasks match your current filters</p>
          <p className="text-xs text-muted-foreground">Try clearing filters or search criteria.</p>
          <Button variant="outline" size="sm" onClick={resetFilters}>
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}
