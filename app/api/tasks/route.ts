import { NextResponse } from "next/server";
import {
  fetchTasksFromSupabase,
  insertTaskToSupabase,
  bulkInsertTasksToSupabase,
  isSupabaseConfigured,
} from "@/lib/supabase";
import { TaskItem } from "@/types/task";

export async function GET() {
  const configured = isSupabaseConfigured();

  if (!configured) {
    return NextResponse.json({
      configured: false,
      source: "local",
      tasks: [],
      message: "Supabase credentials not configured in .env.local",
    });
  }

  const result = await fetchTasksFromSupabase();

  if (result.error) {
    return NextResponse.json(
      {
        configured: true,
        source: "local_fallback",
        tasks: [],
        error: result.error,
      },
      { status: 200 }
    );
  }

  return NextResponse.json({
    configured: true,
    source: "supabase",
    tasks: result.tasks,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Check if bulk insert request
    if (body.tasks && Array.isArray(body.tasks)) {
      const mode = body.mode === "replace" ? "replace" : "append";
      const result = await bulkInsertTasksToSupabase(body.tasks, mode);
      return NextResponse.json(result);
    }

    // Single task insert
    const task: TaskItem = body;
    const result = await insertTaskToSupabase(task);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
