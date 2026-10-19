-- ==============================================================================
-- Supabase PostgreSQL Schema for Project Task & Gantt Tracker
-- Run this script in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- ==============================================================================

-- 1. Create tasks table matching the exact Excel columns and Gantt requirements
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
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    comments TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create indexes for high-performance Gantt queries and filters
CREATE INDEX IF NOT EXISTS idx_tasks_main_project ON public.tasks(main_project);
CREATE INDEX IF NOT EXISTS idx_tasks_category ON public.tasks(category);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON public.tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_resource ON public.tasks(resource);
CREATE INDEX IF NOT EXISTS idx_tasks_end_date ON public.tasks(end_date);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies for full access
DROP POLICY IF EXISTS "Allow select for all" ON public.tasks;
CREATE POLICY "Allow select for all" ON public.tasks FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert for all" ON public.tasks;
CREATE POLICY "Allow insert for all" ON public.tasks FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update for all" ON public.tasks;
CREATE POLICY "Allow update for all" ON public.tasks FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow delete for all" ON public.tasks;
CREATE POLICY "Allow delete for all" ON public.tasks FOR DELETE USING (true);

-- 5. Seed Initial Sample Data (Optional)
INSERT INTO public.tasks (id, category, main_project, key_project_deliveries, task_name, priority, status, resource, start_date, end_date, progress, comments)
VALUES 
    ('task-1', 'BI & Analytics', 'Enterprise Sales Analytics', 'Executive KPI Dashboard', 'Define Revenue & Margin Metrics', 'High', 'Completed', 'Anjalee K.', '2026-10-01', '2026-10-07', 100, 'Metrics signed off by CFO and VP of Sales.'),
    ('task-2', 'Data Engineering', 'Enterprise Sales Analytics', 'ETL Pipeline v2', 'Build Snowflake Sales Data Ingestion', 'Critical', 'Completed', 'David Chen', '2026-10-05', '2026-10-14', 100, 'Automated incremental refresh configured every 2 hours.'),
    ('task-3', 'BI & Analytics', 'Enterprise Sales Analytics', 'Executive KPI Dashboard', 'Develop PowerBI Interactive Visuals', 'High', 'In Progress', 'Anjalee K.', '2026-10-12', '2026-10-24', 70, 'Drill-down filters and regional breakdown being refined.'),
    ('task-4', 'Data Governance', 'Enterprise Sales Analytics', 'Security & Compliance', 'Implement Row-Level Security (RLS)', 'Critical', 'In Progress', 'Elena Rostova', '2026-10-16', '2026-10-26', 50, 'Assigning user security groups per geographical market.'),
    ('task-5', 'QA & Testing', 'Enterprise Sales Analytics', 'User Acceptance Testing', 'Conduct Stakeholder UAT Sign-off', 'High', 'Not Started', 'Marcus Vance', '2026-10-25', '2026-11-04', 0, 'Test scripts distributed to regional sales managers.')
ON CONFLICT (id) DO NOTHING;
