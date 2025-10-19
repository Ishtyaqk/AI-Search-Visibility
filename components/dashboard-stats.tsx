"use client"

import { useEffect, useState } from "react"
import { getSupabaseClient } from "@/lib/supabase-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

export default function DashboardStats() {
  const [stats, setStats] = useState<any>(null)
  const [chartData, setChartData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      const supabase = getSupabaseClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      // Fetch evals
      const { data: evals } = await supabase.from("evals").select("*").eq("user_id", user.id)

      // Fetch eval configs
      const { data: configs } = await supabase.from("eval_config").select("*").eq("user_id", user.id)

      const totalEvals = evals?.length || 0
      const avgScore =
        evals && evals.length > 0 ? (evals.reduce((sum, e) => sum + (e.score || 0), 0) / evals.length).toFixed(2) : 0

      setStats({
        totalEvals,
        totalConfigs: configs?.length || 0,
        avgScore,
      })

      // Prepare chart data (last 7 days)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - (6 - i))
        return date.toISOString().split("T")[0]
      })

      const chartData = last7Days.map((date) => {
        const dayEvals = evals?.filter((e) => e.created_at.startsWith(date)) || []
        return {
          date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          count: dayEvals.length,
          avgScore:
            dayEvals.length > 0
              ? (dayEvals.reduce((sum, e) => sum + (e.score || 0), 0) / dayEvals.length).toFixed(2)
              : 0,
        }
      })

      setChartData(chartData)
      setLoading(false)
    }

    fetchStats()
  }, [])

  if (loading) {
    return <div className="text-muted-foreground">Loading stats...</div>
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Evals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalEvals || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.avgScore || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Configs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalConfigs || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Evals Over Time</CardTitle>
          <CardDescription>Last 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="hsl(var(--chart-1))" name="Eval Count" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
