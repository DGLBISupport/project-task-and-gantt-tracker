import { NextResponse } from "next/server";
import { isSupabaseConfigured, fetchTasksFromSupabase } from "@/lib/supabase";

export async function GET() {
  const configured = isSupabaseConfigured();

  if (!configured) {
    return NextResponse.json({
      configured: false,
      healthy: false,
      message: "Supabase credentials are not set in .env.local",
    });
  }

  const result = await fetchTasksFromSupabase();

  if (result.error) {
    return NextResponse.json({
      configured: true,
      healthy: false,
      message: result.error,
    });
  }

  return NextResponse.json({
    configured: true,
    healthy: true,
    taskCount: result.tasks.length,
    message: `Connected successfully to Supabase. Found ${result.tasks.length} tasks in public.tasks.`,
  });
}
