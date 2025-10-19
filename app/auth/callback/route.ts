import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase-server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")

  if (code) {
    const supabase = await getSupabaseServer()
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(new URL("/dashboard", request.url))
}
