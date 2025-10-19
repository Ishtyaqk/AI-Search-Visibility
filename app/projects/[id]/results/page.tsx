"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase-client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import Link from "next/link"

interface SearchResult {
  id: string
  keyword_id: string
  keyword: string
  found: boolean
  position: number | null
  created_at: string
  engine: string
}

interface KeywordStats {
  keyword: string
  totalSearches: number
  foundCount: number
  visibility: number
  lastFound: boolean
  lastPosition: number | null
  byEngine: Record<string, { found: boolean; position: number | null }>
}

export default function ResultsPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string

  const [results, setResults] = useState<SearchResult[]>([])
  const [stats, setStats] = useState<KeywordStats[]>([])
  const [engineStats, setEngineStats] = useState<Record<string, { found: number; total: number }>>({})
  const [trendData, setTrendData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchResults = async () => {
      const supabase = getSupabaseClient()

      // Fetch all search results for this project
      const { data: resultsData } = await supabase
        .from("search_results")
        .select("*, keywords(keyword)")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })

      const formattedResults =
        resultsData?.map((r: any) => ({
          ...r,
          keyword: r.keywords?.keyword || "Unknown",
        })) || []

      setResults(formattedResults)

      const statsMap: Record<string, KeywordStats> = {}
      const engineStatsMap: Record<string, { found: number; total: number }> = {}

      formattedResults.forEach((result: SearchResult) => {
        if (!statsMap[result.keyword]) {
          statsMap[result.keyword] = {
            keyword: result.keyword,
            totalSearches: 0,
            foundCount: 0,
            visibility: 0,
            lastFound: false,
            lastPosition: null,
            byEngine: {},
          }
        }

        if (!engineStatsMap[result.engine]) {
          engineStatsMap[result.engine] = { found: 0, total: 0 }
        }

        statsMap[result.keyword].totalSearches++
        engineStatsMap[result.engine].total++

        if (result.found) {
          statsMap[result.keyword].foundCount++
          engineStatsMap[result.engine].found++
        }

        statsMap[result.keyword].lastFound = result.found
        statsMap[result.keyword].lastPosition = result.position
        statsMap[result.keyword].byEngine[result.engine] = {
          found: result.found,
          position: result.position,
        }
      })

      // Calculate visibility percentage
      Object.values(statsMap).forEach((stat) => {
        stat.visibility = Math.round((stat.foundCount / stat.totalSearches) * 100)
      })

      setStats(Object.values(statsMap))
      setEngineStats(engineStatsMap)

      // Create trend data (last 7 days)
      const trendMap: Record<string, { date: string; found: number; missing: number }> = {}

      formattedResults.forEach((result: SearchResult) => {
        const date = new Date(result.created_at).toLocaleDateString()
        if (!trendMap[date]) {
          trendMap[date] = { date, found: 0, missing: 0 }
        }
        if (result.found) {
          trendMap[date].found++
        } else {
          trendMap[date].missing++
        }
      })

      setTrendData(Object.values(trendMap).reverse())

      setLoading(false)
    }

    fetchResults()
  }, [projectId])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <Link
            href={`/projects/${projectId}`}
            className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block"
          >
            ← Back to Project
          </Link>
          <h1 className="text-3xl font-bold">Visibility Results</h1>
          <p className="text-muted-foreground">Track your brand's appearance across AI search engines</p>
        </div>

        {Object.keys(engineStats).length > 0 && (
          <section>
            <h2 className="text-xl font-semibold mb-4">Engine Performance</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(engineStats).map(([engine, stats]) => (
                <Card key={engine}>
                  <CardHeader>
                    <CardTitle className="text-lg capitalize">{engine}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Visibility Rate</p>
                      <p className="text-2xl font-bold">{Math.round((stats.found / stats.total) * 100)}%</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Found</p>
                        <p className="text-lg font-semibold">{stats.found}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total</p>
                        <p className="text-lg font-semibold">{stats.total}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Keyword Stats */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Keyword Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.map((stat) => (
              <Card key={stat.keyword}>
                <CardHeader>
                  <CardTitle className="text-lg">{stat.keyword}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Overall Visibility</p>
                    <p className="text-2xl font-bold">{stat.visibility}%</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Found</p>
                      <p className="text-lg font-semibold">{stat.foundCount}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="text-lg font-semibold">{stat.totalSearches}</p>
                    </div>
                  </div>
                  <div className="text-xs space-y-1 pt-2 border-t">
                    {Object.entries(stat.byEngine).map(([engine, data]) => (
                      <div key={engine} className="flex justify-between">
                        <span className="capitalize text-muted-foreground">{engine}:</span>
                        <span className={data.found ? "text-green-600 font-semibold" : "text-red-600"}>
                          {data.found ? `✓ Pos ${data.position}` : "✗"}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Trend Chart */}
        {trendData.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold mb-4">Visibility Trend</h2>
            <Card>
              <CardContent className="pt-6">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="found" fill="hsl(var(--chart-1))" name="Found" />
                    <Bar dataKey="missing" fill="hsl(var(--chart-2))" name="Missing" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Detailed Results */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Recent Searches</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {results.length === 0 ? (
                  <p className="text-muted-foreground">No search results yet</p>
                ) : (
                  results.slice(0, 20).map((result) => (
                    <div key={result.id} className="flex items-center justify-between p-4 border border-border rounded">
                      <div>
                        <p className="font-medium">{result.keyword}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(result.created_at).toLocaleDateString()} -{" "}
                          <span className="capitalize font-semibold">{result.engine}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        {result.found ? (
                          <div className="text-right">
                            <p className="text-sm font-semibold text-green-600">Found</p>
                            {result.position && (
                              <p className="text-xs text-muted-foreground">Position {result.position}</p>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm font-semibold text-red-600">Not Found</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Improvement Suggestions */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Improvement Suggestions</h2>
          <Card>
            <CardContent className="pt-6 space-y-3">
              {Object.entries(engineStats).map(([engine, stats]) => {
                const visibility = Math.round((stats.found / stats.total) * 100)
                if (visibility < 50) {
                  return (
                    <div key={engine} className="p-4 bg-yellow-50 border border-yellow-200 rounded">
                      <p className="font-medium text-yellow-900 capitalize">Low visibility on {engine}</p>
                      <p className="text-sm text-yellow-800 mt-1">
                        Your site appears in only {visibility}% of {engine} results. Consider optimizing your content.
                      </p>
                    </div>
                  )
                }
                return null
              })}

              {stats.filter((s) => s.visibility === 0).length > 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded">
                  <p className="font-medium text-red-900">Missing Keywords</p>
                  <p className="text-sm text-red-800 mt-1">
                    Your site doesn't appear for:{" "}
                    {stats
                      .filter((s) => s.visibility === 0)
                      .map((s) => s.keyword)
                      .join(", ")}
                    . These are opportunities to improve your AI visibility.
                  </p>
                </div>
              )}

              {stats.filter((s) => s.visibility === 100).length > 0 && (
                <div className="p-4 bg-green-50 border border-green-200 rounded">
                  <p className="font-medium text-green-900">Strong Keywords</p>
                  <p className="text-sm text-green-800 mt-1">
                    Great job! Your site consistently appears for:{" "}
                    {stats
                      .filter((s) => s.visibility === 100)
                      .map((s) => s.keyword)
                      .join(", ")}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}
