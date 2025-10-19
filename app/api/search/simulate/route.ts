import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { getSupabaseServer } from "@/lib/supabase-server"

export async function POST(request: NextRequest) {
  try {
    const { projectId, keywords } = await request.json()

    if (!projectId || !keywords || keywords.length === 0) {
      return NextResponse.json({ error: "Missing projectId or keywords" }, { status: 400 })
    }

    const supabase = await getSupabaseServer()

    // Get project details
    const { data: project } = await supabase.from("projects").select("*").eq("id", projectId).single()

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Get all keywords for this project
    const { data: allKeywords } = await supabase.from("keywords").select("*").eq("project_id", projectId)

    const results = []

    const engines = [
      { name: "gpt-4", model: "openai/gpt-4.1" },
      { name: "claude", model: "anthropic/claude-sonnet-4" },
      { name: "gemini", model: "google/gemini-2.5-flash" },
    ]

    // For each keyword, call multiple AI engines
    for (const keyword of allKeywords || []) {
      for (const engine of engines) {
        try {
          const { text: responseText } = await generateText({
            model: engine.model,
            prompt: `You are simulating a ${engine.name} search engine. Search for: "${keyword.keyword}". List the top 5 websites that would appear in search results for this query. Format as a simple numbered list with just the domain names.`,
          })

          // Check if project website appears in response
          const found =
            responseText.toLowerCase().includes(project.website_url.toLowerCase()) ||
            responseText.toLowerCase().includes(project.website_url.replace("https://", "").replace("http://", ""))

          // Extract position if found
          let position = null
          if (found) {
            const lines = responseText.split("\n")
            for (let i = 0; i < lines.length; i++) {
              if (lines[i].toLowerCase().includes(project.website_url.toLowerCase())) {
                position = i + 1
                break
              }
            }
          }

          // Store result in database
          await supabase.from("search_results").insert([
            {
              project_id: projectId,
              keyword_id: keyword.id,
              engine: engine.name,
              found,
              position,
              full_response: responseText,
            },
          ])

          results.push({
            keyword: keyword.keyword,
            engine: engine.name,
            found,
            position,
          })
        } catch (error) {
          console.error(`Error searching for keyword "${keyword.keyword}" on ${engine.name}:`, error)
        }
      }
    }

    return NextResponse.json({ success: true, results })
  } catch (error) {
    console.error("Search simulation error:", error)
    return NextResponse.json({ error: "Search simulation failed" }, { status: 500 })
  }
}
