"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import Link from "next/link"

interface Project {
  id: string
  name: string
  website_url: string
  description: string
}

interface VisibilityData {
  keyword: string
  found: number
  missing: number
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [visibilityData, setVisibilityData] = useState<VisibilityData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = getSupabaseClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
        return
      }

      setUser(user)

      // Fetch projects
      const { data: projectsData } = await supabase.from("projects").select("*").eq("user_id", user.id)

      setProjects(projectsData || [])

      // Fetch visibility summary
      if (projectsData && projectsData.length > 0) {
        const projectIds = projectsData.map((p) => p.id)
        const { data: resultsData } = await supabase
          .from("search_results")
          .select("keyword_id, found, keywords(keyword)")
          .in("project_id", projectIds)
          .order("created_at", { ascending: false })
          .limit(100)

        // Group by keyword
        const grouped: Record<string, { found: number; missing: number }> = {}
        resultsData?.forEach((result: any) => {
          const keyword = result.keywords?.keyword || "Unknown"
          if (!grouped[keyword]) {
            grouped[keyword] = { found: 0, missing: 0 }
          }
          if (result.found) {
            grouped[keyword].found++
          } else {
            grouped[keyword].missing++
          }
        })

        const chartData = Object.entries(grouped).map(([keyword, data]) => ({
          keyword,
          found: data.found,
          missing: data.missing,
        }))

        setVisibilityData(chartData)
      }

      setLoading(false)
    }

    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">AI Visibility Tracker</h1>
            <p className="text-sm text-muted-foreground">Monitor your brand visibility in AI search results</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button
              variant="outline"
              onClick={() =>
                getSupabaseClient()
                  .auth.signOut()
                  .then(() => router.push("/login"))
              }
            >
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Projects Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold">Your Projects</h2>
              <p className="text-sm text-muted-foreground">Manage your brands and track their visibility</p>
            </div>
            <Link href="/projects/new">
              <Button>Create Project</Button>
            </Link>
          </div>

          {projects.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground mb-4">No projects yet. Create one to get started.</p>
                <Link href="/projects/new">
                  <Button>Create Your First Project</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <CardHeader>
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      <CardDescription className="truncate">{project.website_url}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Visibility Overview */}
        {visibilityData.length > 0 && (
          <section>
            <div>
              <h2 className="text-xl font-semibold mb-6">Visibility Overview</h2>
              <Card>
                <CardContent className="pt-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={visibilityData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="keyword" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="found" fill="hsl(var(--chart-1))" name="Found" />
                      <Bar dataKey="missing" fill="hsl(var(--chart-2))" name="Missing" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
