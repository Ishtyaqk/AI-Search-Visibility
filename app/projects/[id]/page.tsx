"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"

interface Project {
  id: string
  name: string
  website_url: string
  description: string
}

interface Keyword {
  id: string
  keyword: string
}

interface Competitor {
  id: string
  name: string
  website_url: string
}

export default function ProjectDetailPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [keywords, setKeywords] = useState<Keyword[]>([])
  const [competitors, setCompetitors] = useState<Competitor[]>([])
  const [newKeyword, setNewKeyword] = useState("")
  const [newCompetitorName, setNewCompetitorName] = useState("")
  const [newCompetitorUrl, setNewCompetitorUrl] = useState("")
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = getSupabaseClient()

      // Fetch project
      const { data: projectData } = await supabase.from("projects").select("*").eq("id", projectId).single()

      setProject(projectData)

      // Fetch keywords
      const { data: keywordsData } = await supabase.from("keywords").select("*").eq("project_id", projectId)

      setKeywords(keywordsData || [])

      // Fetch competitors
      const { data: competitorsData } = await supabase.from("competitors").select("*").eq("project_id", projectId)

      setCompetitors(competitorsData || [])

      setLoading(false)
    }

    fetchData()
  }, [projectId])

  const addKeyword = async () => {
    if (!newKeyword.trim()) return

    const supabase = getSupabaseClient()
    const { data } = await supabase
      .from("keywords")
      .insert([{ project_id: projectId, keyword: newKeyword }])
      .select()

    if (data) {
      setKeywords([...keywords, data[0]])
      setNewKeyword("")
    }
  }

  const deleteKeyword = async (keywordId: string) => {
    const supabase = getSupabaseClient()
    await supabase.from("keywords").delete().eq("id", keywordId)

    setKeywords(keywords.filter((k) => k.id !== keywordId))
  }

  const addCompetitor = async () => {
    if (!newCompetitorName.trim() || !newCompetitorUrl.trim()) return

    const supabase = getSupabaseClient()
    const { data } = await supabase
      .from("competitors")
      .insert([{ project_id: projectId, name: newCompetitorName, website_url: newCompetitorUrl }])
      .select()

    if (data) {
      setCompetitors([...competitors, data[0]])
      setNewCompetitorName("")
      setNewCompetitorUrl("")
    }
  }

  const deleteCompetitor = async (competitorId: string) => {
    const supabase = getSupabaseClient()
    await supabase.from("competitors").delete().eq("id", competitorId)

    setCompetitors(competitors.filter((c) => c.id !== competitorId))
  }

  const runSearch = async () => {
    setSearching(true)
    try {
      const response = await fetch("/api/search/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          keywords: keywords.map((k) => k.keyword),
        }),
      })

      if (response.ok) {
        // Refresh keywords to show updated results
        const supabase = getSupabaseClient()
        const { data: keywordsData } = await supabase.from("keywords").select("*").eq("project_id", projectId)
        setKeywords(keywordsData || [])
      }
    } catch (error) {
      console.error("Search failed:", error)
    } finally {
      setSearching(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!project) {
    return <div className="min-h-screen flex items-center justify-center">Project not found</div>
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/projects" className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block">
            ← Back to Projects
          </Link>
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <p className="text-muted-foreground">{project.website_url}</p>
        </div>

        <Tabs defaultValue="keywords" className="space-y-6">
          <TabsList>
            <TabsTrigger value="keywords">Keywords</TabsTrigger>
            <TabsTrigger value="competitors">Competitors</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
          </TabsList>

          {/* Keywords Tab */}
          <TabsContent value="keywords">
            <Card>
              <CardHeader>
                <CardTitle>Track Keywords</CardTitle>
                <CardDescription>Add keywords to monitor your visibility in AI search results</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex gap-2">
                  <Input
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    placeholder="e.g., best AI tools"
                    onKeyPress={(e) => e.key === "Enter" && addKeyword()}
                  />
                  <Button onClick={addKeyword}>Add Keyword</Button>
                </div>

                <div className="space-y-2">
                  {keywords.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No keywords added yet</p>
                  ) : (
                    keywords.map((keyword) => (
                      <div key={keyword.id} className="flex items-center justify-between p-3 bg-muted rounded">
                        <span>{keyword.keyword}</span>
                        <Button variant="ghost" size="sm" onClick={() => deleteKeyword(keyword.id)}>
                          Remove
                        </Button>
                      </div>
                    ))
                  )}
                </div>

                {keywords.length > 0 && (
                  <Button onClick={runSearch} disabled={searching} className="w-full">
                    {searching ? "Searching..." : "Run AI Search Simulation"}
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Competitors Tab */}
          <TabsContent value="competitors">
            <Card>
              <CardHeader>
                <CardTitle>Competitors</CardTitle>
                <CardDescription>Track your competitors' visibility alongside yours</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Input
                    value={newCompetitorName}
                    onChange={(e) => setNewCompetitorName(e.target.value)}
                    placeholder="Competitor name"
                  />
                  <div className="flex gap-2">
                    <Input
                      value={newCompetitorUrl}
                      onChange={(e) => setNewCompetitorUrl(e.target.value)}
                      placeholder="Competitor website URL"
                    />
                    <Button onClick={addCompetitor}>Add</Button>
                  </div>
                </div>

                <div className="space-y-2">
                  {competitors.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No competitors added yet</p>
                  ) : (
                    competitors.map((competitor) => (
                      <div key={competitor.id} className="flex items-center justify-between p-3 bg-muted rounded">
                        <div>
                          <p className="font-medium">{competitor.name}</p>
                          <p className="text-sm text-muted-foreground">{competitor.website_url}</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => deleteCompetitor(competitor.id)}>
                          Remove
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results">
            <Card>
              <CardHeader>
                <CardTitle>Search Results</CardTitle>
                <CardDescription>View your visibility in AI search results</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href={`/projects/${projectId}/results`}>
                  <Button>View Detailed Results</Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
