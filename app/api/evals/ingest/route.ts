import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase-server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServer()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { configId, input, output, score, metadata } = body

    if (!configId || !input || !output) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Verify config belongs to user
    const { data: config } = await supabase
      .from("eval_config")
      .select("id")
      .eq("id", configId)
      .eq("user_id", user.id)
      .single()

    if (!config) {
      return NextResponse.json({ error: "Config not found" }, { status: 404 })
    }

    // Insert eval
    const { data, error } = await supabase
      .from("evals")
      .insert({
        user_id: user.id,
        config_id: configId,
        input,
        output,
        score: score ? Number.parseFloat(score) : null,
        metadata: metadata || {},
      })
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
