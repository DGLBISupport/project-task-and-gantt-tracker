"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useTasks } from "@/context/task-context";
import { parseExcelOrCsv, downloadTemplateCsv } from "@/lib/task-utils";
import { TaskItem } from "@/types/task";
import {
  FileSpreadsheet,
  Upload,
  ClipboardPaste,
  CheckCircle2,
  AlertCircle,
  Download,
  Loader2,
  FileCheck,
} from "lucide-react";
import { toast } from "sonner";

interface ImportExcelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Function to load SheetJS XLSX parser dynamically from CDN
async function loadSheetJs(): Promise<any> {
  if (typeof window === "undefined") return null;
  if ((window as any).XLSX) return (window as any).XLSX;

  return new Promise((resolve, reject) => {
    const existing = document.getElementById("sheetjs-cdn-script");
    if (existing) {
      existing.addEventListener("load", () => resolve((window as any).XLSX));
      return;
    }

    const script = document.createElement("script");
    script.id = "sheetjs-cdn-script";
    script.src = "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";
    script.async = true;
    script.onload = () => resolve((window as any).XLSX);
    script.onerror = () => {
      // Fallback to cdnjs
      const fallbackScript = document.createElement("script");
      fallbackScript.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
      fallbackScript.async = true;
      fallbackScript.onload = () => resolve((window as any).XLSX);
      fallbackScript.onerror = () => reject(new Error("Unable to load Excel parser from CDN"));
      document.head.appendChild(fallbackScript);
    };
    document.head.appendChild(script);
  });
}

export function ImportExcelDialog({ open, onOpenChange }: ImportExcelDialogProps) {
  const { importTasks } = useTasks();
  const [pasteData, setPasteData] = useState("");
  const [parsedResult, setParsedResult] = useState<{
    tasks: TaskItem[];
    errors: string[];
  } | null>(null);
  const [mode, setMode] = useState<"append" | "replace">("append");
  const [activeTab, setActiveTab] = useState<"upload" | "paste">("upload");
  const [fileName, setFileName] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pre-load SheetJS in the background when modal is mounted
  useEffect(() => {
    if (open) {
      loadSheetJs().catch(() => {});
    }
  }, [open]);

  const handleParseContent = (content: string) => {
    if (!content.trim()) {
      setParsedResult(null);
      return;
    }
    const result = parseExcelOrCsv(content);
    setParsedResult(result);
  };

  const handlePasteChange = (val: string) => {
    setPasteData(val);
    handleParseContent(val);
  };

  // Central file processor supporting .xlsx, .xls, .csv, .tsv, .txt
  const processFile = async (file: File) => {
    if (!file) return;

    setFileName(file.name);
    setIsParsing(true);
    setParsedResult(null);

    const isBinaryExcel =
      file.name.endsWith(".xlsx") ||
      file.name.endsWith(".xls") ||
      file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.type === "application/vnd.ms-excel";

    try {
      if (isBinaryExcel) {
        // Load SheetJS and parse binary workbook
        const XLSX = await loadSheetJs();
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });

        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          setParsedResult({
            tasks: [],
            errors: ["Excel workbook does not contain any sheets."],
          });
          setIsParsing(false);
          return;
        }

        const worksheet = workbook.Sheets[firstSheetName];
        // Convert sheet to Tab-Separated string
        const tsv = XLSX.utils.sheet_to_csv(worksheet, { FS: "\t" });

        setPasteData(tsv);
        handleParseContent(tsv);
        toast.success(`Excel file "${file.name}" parsed (${firstSheetName})`);
      } else {
        // Text / CSV file
        const text = await file.text();
        setPasteData(text);
        handleParseContent(text);
        toast.success(`CSV file "${file.name}" parsed`);
      }
    } catch (err: any) {
      console.error("Failed to parse file:", err);
      setParsedResult({
        tasks: [],
        errors: [`Could not parse ${file.name}: ${err.message || "Invalid Excel file format."}`],
      });
      toast.error(`Error reading ${file.name}`);
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Drag and drop event handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };

  const handleConfirmImport = () => {
    if (parsedResult && parsedResult.tasks.length > 0) {
      importTasks(parsedResult.tasks, mode);
      handleClose();
    }
  };

  const handleClose = () => {
    setPasteData("");
    setParsedResult(null);
    setFileName("");
    setIsDragging(false);
    setIsParsing(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-2.5 rounded-xl">
              <FileSpreadsheet className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">
                Import Tasks from Excel / CSV
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Drag and drop your Excel (.xlsx, .xls) or CSV sheet, or paste rows directly.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Expected columns pill list */}
        <div className="bg-muted/50 p-3 rounded-lg border border-border/60 text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-semibold text-foreground">Expected Excel Columns:</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={downloadTemplateCsv}
              className="h-6 text-[11px] gap-1 text-primary hover:text-primary font-normal p-0"
            >
              <Download className="size-3" />
              Download Excel Template
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5 text-[11px]">
            {[
              "Category",
              "Main Project",
              "Key Project Deliveries",
              "Task Name",
              "Priority",
              "Status",
              "Resource",
              "End Date",
              "Comments",
            ].map((col) => (
              <span
                key={col}
                className="bg-background px-2 py-0.5 rounded border border-border/80 text-foreground font-mono"
              >
                {col}
              </span>
            ))}
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 border-b border-border pb-1">
          <button
            type="button"
            onClick={() => setActiveTab("upload")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-t border-b-2 transition-colors ${
              activeTab === "upload"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Upload className="size-3.5" />
            Upload / Drag & Drop Excel (.xlsx, .xls, .csv)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("paste")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-t border-b-2 transition-colors ${
              activeTab === "paste"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <ClipboardPaste className="size-3.5" />
            Paste from Excel (Ctrl + V)
          </button>
        </div>

        {activeTab === "upload" ? (
          <div className="space-y-3">
            {/* Drag & Drop Zone */}
            <div
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-8 transition-all cursor-pointer text-center select-none ${
                isDragging
                  ? "border-primary bg-primary/10 scale-[1.01] shadow-md"
                  : "border-border hover:border-primary/50 hover:bg-muted/40"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv, .tsv, .txt, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                onChange={handleFileInputChange}
                className="hidden"
              />

              {isParsing ? (
                <div className="flex flex-col items-center py-4 space-y-2">
                  <Loader2 className="size-8 text-primary animate-spin" />
                  <span className="text-xs font-semibold text-foreground">
                    Reading and parsing Excel file...
                  </span>
                </div>
              ) : fileName ? (
                <div className="flex flex-col items-center py-2 space-y-2">
                  <div className="size-12 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <FileCheck className="size-6" />
                  </div>
                  <span className="text-xs font-bold text-foreground">{fileName}</span>
                  <span className="text-[11px] text-muted-foreground">
                    Click or drag another file to replace
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-2">
                  <div
                    className={`size-12 rounded-full flex items-center justify-center transition-colors ${
                      isDragging
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Upload className="size-6" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-foreground block">
                      {isDragging
                        ? "Drop your Excel file here!"
                        : "Drag & drop your Excel file here, or click to browse"}
                    </span>
                    <span className="text-[11px] text-muted-foreground mt-0.5 block">
                      Supports Microsoft Excel (<b>.xlsx, .xls</b>) and <b>.csv</b> files
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Select rows in Microsoft Excel (including the column headers), press <b>Ctrl+C</b>, then paste below:
            </p>
            <Textarea
              value={pasteData}
              onChange={(e) => handlePasteChange(e.target.value)}
              placeholder="Category	Main Project	Key Project Deliveries	Task Name	Priority	Status	Resource	End Date	Comments&#10;BI & Analytics	Sales Tracker	KPI Dashboards	Build Visuals	High	In Progress	Anjalee K.	2026-10-31	On track"
              rows={7}
              className="font-mono text-xs whitespace-pre"
            />
          </div>
        )}

        {/* Live parse feedback */}
        {parsedResult && (
          <div className="space-y-3 pt-2">
            {parsedResult.errors.length > 0 ? (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl p-3.5 text-xs flex gap-2.5 items-start">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">Unable to import tasks</p>
                  <p>{parsedResult.errors[0]}</p>
                  <p className="text-[11px] opacity-80">
                    Make sure your Excel sheet includes: <b>Task Name</b> and <b>End Date</b> columns.
                  </p>
                </div>
              </div>
            ) : parsedResult.tasks.length > 0 ? (
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                    <CheckCircle2 className="size-4" />
                    <span>Successfully parsed {parsedResult.tasks.length} task(s)!</span>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="importMode"
                        checked={mode === "append"}
                        onChange={() => setMode("append")}
                        className="accent-primary"
                      />
                      <span>Append to existing</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="importMode"
                        checked={mode === "replace"}
                        onChange={() => setMode("replace")}
                        className="accent-primary"
                      />
                      <span>Replace all existing</span>
                    </label>
                  </div>
                </div>

                {/* Preview Table */}
                <div className="max-h-48 overflow-auto border border-border rounded-xl">
                  <table className="w-full text-[11px] text-left">
                    <thead className="bg-muted text-muted-foreground sticky top-0 font-medium">
                      <tr>
                        <th className="p-2">Task Name</th>
                        <th className="p-2">Main Project</th>
                        <th className="p-2">Deliverable</th>
                        <th className="p-2">Category</th>
                        <th className="p-2">Resource</th>
                        <th className="p-2">Priority</th>
                        <th className="p-2">Status</th>
                        <th className="p-2">End Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {parsedResult.tasks.slice(0, 6).map((t, idx) => (
                        <tr key={idx} className="hover:bg-muted/30">
                          <td className="p-2 font-medium text-foreground">{t.taskName}</td>
                          <td className="p-2 truncate max-w-[120px]">{t.mainProject}</td>
                          <td className="p-2 truncate max-w-[120px]">{t.keyProjectDeliveries}</td>
                          <td className="p-2">{t.category}</td>
                          <td className="p-2">{t.resource}</td>
                          <td className="p-2">{t.priority}</td>
                          <td className="p-2">{t.status}</td>
                          <td className="p-2 font-mono">{t.endDate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {parsedResult.tasks.length > 6 && (
                    <div className="p-2 text-center text-[10px] text-muted-foreground bg-muted/20">
                      + {parsedResult.tasks.length - 6} more tasks ready to import
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        )}

        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={!parsedResult || parsedResult.tasks.length === 0}
            onClick={handleConfirmImport}
          >
            Import {parsedResult?.tasks.length ? `${parsedResult.tasks.length} Tasks` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
