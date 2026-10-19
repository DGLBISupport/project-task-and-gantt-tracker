"use client";

import React, { useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "./theme-toggle";
import { DatabaseDialog } from "./database-dialog";
import { useTasks } from "@/context/task-context";
import { Database } from "lucide-react";
import { Button } from "./ui/button";

export default function Navbar() {
    const { dbStatus } = useTasks();
    const [isDbOpen, setIsDbOpen] = useState(false);

    return (
        <>
            <nav className="flex items-center justify-between gap-4 border-b border-border dark:bg-sidebar bg-background px-4 py-2.5 backdrop-blur-xs">
                <div className="flex items-center gap-2">
                    <SidebarTrigger className="-ml-1 text-foreground" />
                    <span className="text-sm font-semibold text-foreground">
                        Project Task & Gantt Tracker
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {/* Database Status Button */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsDbOpen(true)}
                        className={`h-7 px-2.5 text-xs gap-1.5 rounded-full border transition-colors ${
                            dbStatus.healthy
                                ? "border-emerald-500/40 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20"
                                : dbStatus.configured
                                ? "border-amber-500/40 text-amber-700 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20"
                                : "border-border text-muted-foreground hover:text-foreground"
                        }`}
                        title="Click to view database connection status & configuration"
                    >
                        <span
                            className={`size-2 rounded-full shrink-0 ${
                                dbStatus.healthy
                                    ? "bg-emerald-500 animate-pulse"
                                    : dbStatus.configured
                                    ? "bg-amber-500"
                                    : "bg-muted-foreground"
                            }`}
                        />
                        <Database className="size-3" />
                        <span className="hidden sm:inline font-medium">
                            {dbStatus.healthy
                                ? "Supabase Connected"
                                : dbStatus.configured
                                ? "Database Verifying"
                                : "Database Setup"}
                        </span>
                    </Button>

                    <ThemeToggle />
                </div>
            </nav>

            <DatabaseDialog open={isDbOpen} onOpenChange={setIsDbOpen} />
        </>
    );
}