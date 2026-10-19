"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTasks } from "@/context/task-context";
import {
  Database,
  CheckCircle2,
  AlertCircle,
  Copy,
  RefreshCw,
  ExternalLink,
  Code2,
  Check,
} from "lucide-react";
import { toast } from "sonner";

interface DatabaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DatabaseDialog({ open, onOpenChange }: DatabaseDialogProps) {
  const { dbStatus, checkDbStatus, syncWithDb, tasks } = useTasks();
  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const sqlSchemaSnippet = `-- Run this in Supabase Dashboard -> SQL Editor:
CREATE TABLE IF NOT EXISTS public.tasks (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL DEFAULT 'General',
    main_project TEXT NOT NULL,
    key_project_deliveries TEXT NOT NULL,
    task_name TEXT NOT NULL,
    priority TEXT NOT NULL CHECK (priority IN ('Critical', 'High', 'Medium', 'Low')),
    status TEXT NOT NULL CHECK (status IN ('Not Started', 'In Progress', 'Under Review', 'Completed', 'Delayed')),
    resource TEXT NOT NULL DEFAULT 'Unassigned',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    progress INTEGER NOT NULL DEFAULT 0,
    comments TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public all" ON public.tasks FOR ALL USING (true);`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlSchemaSnippet);
    setCopied(true);
    toast.success("SQL Schema copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTestAndSync = async () => {
    setIsRefreshing(true);
    await checkDbStatus();
    await syncWithDb();
    setIsRefreshing(false);
    toast.success("Connection test and sync completed");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="bg-primary/10 text-primary p-2.5 rounded-xl">
              <Database className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">
                Supabase PostgreSQL Database
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Persistent cloud storage for your project tasks, deliveries, and Gantt tracking.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Status Banner */}
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 text-xs ${
              dbStatus.healthy
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
                : dbStatus.configured
                ? "bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300"
                : "bg-muted border-border text-foreground"
            }`}
          >
            {dbStatus.healthy ? (
              <CheckCircle2 className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
            ) : (
              <AlertCircle className="size-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            )}

            <div className="flex-1 space-y-1">
              <p className="font-semibold text-sm">
                {dbStatus.healthy
                  ? "Connected to Supabase PostgreSQL"
                  : dbStatus.configured
                  ? "Configured, but table verification needed"
                  : "Database Configuration Required"}
              </p>
              <p className="text-xs opacity-90">{dbStatus.message}</p>
              <p className="text-[11px] opacity-75">
                Current Storage Source: <b>{dbStatus.source === "supabase" ? "Supabase (Cloud)" : "Local Storage (Offline Backup)"}</b> ({tasks.length} tasks active)
              </p>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={handleTestAndSync}
              disabled={isRefreshing}
              className="h-8 text-xs shrink-0 gap-1.5"
            >
              <RefreshCw className={`size-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              Test & Sync
            </Button>
          </div>

          {/* Setup Instructions */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
              Quick 2-Step Supabase Setup
            </h3>

            {/* Step 1 */}
            <div className="bg-card p-3.5 rounded-xl border border-border space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <span className="size-5 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[11px]">
                    1
                  </span>
                  Run SQL Schema in Supabase SQL Editor
                </span>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCopySql}
                  className="h-7 text-[11px] gap-1 text-primary"
                >
                  {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
                  {copied ? "Copied" : "Copy SQL"}
                </Button>
              </div>

              <div className="bg-muted p-2 rounded-lg font-mono text-[10px] text-muted-foreground overflow-x-auto max-h-24">
                <pre>{sqlSchemaSnippet}</pre>
              </div>

              <p className="text-[11px] text-muted-foreground">
                You can also find the full migration file at: <code>supabase/schema.sql</code>
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-card p-3.5 rounded-xl border border-border space-y-2 text-xs">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <span className="size-5 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[11px]">
                  2
                </span>
                Add Credentials to <code>.env.local</code>
              </span>

              <p className="text-[11px] text-muted-foreground">
                Open <code>.env.local</code> in the root directory and paste your Supabase Project URL and Anon Key (from Project Settings → API):
              </p>

              <div className="bg-muted p-2.5 rounded-lg font-mono text-[11px] text-foreground">
                NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co<br />
                NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsIn...
              </div>
            </div>
          </div>

          {/* Helpful Link */}
          <div className="pt-1 flex items-center justify-between text-xs text-muted-foreground">
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
            >
              Open Supabase Dashboard <ExternalLink className="size-3" />
            </a>

            <span>Restarts are not required; credentials are read dynamically.</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
