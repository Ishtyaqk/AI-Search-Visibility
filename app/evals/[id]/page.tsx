"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import DashboardHeader from "@/components/dashboard-header"

export default function EvalDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [user, setUser] = useState<any>(null)
  const [eval_, setEval] = useState<any>(null)
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

      // Fetch eval
      const { data } = await supabase.from("evals").select("*").eq("id", params.id).eq("user_id", user.id).single()

      setEval(data)
      setLoading(false)
    }

    checkAuth()
  }, [router, params.id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!eval_) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Eval not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={user} />
      <main className="max-w-2xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Eval Details</CardTitle>
            <CardDescription>Created {new Date(eval_.created_at).toLocaleDateString()}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Input</label>
              <p className="mt-1 p-3 bg-muted rounded-md">{eval_.input}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Output</label>
              <p className="mt-1 p-3 bg-muted rounded-md">{eval_.output}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Score</label>
              <p className="mt-1 text-2xl font-bold">{eval_.score || "N/A"}</p>
            </div>
            <Button variant="outline" onClick={() => router.push("/dashboard")}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
