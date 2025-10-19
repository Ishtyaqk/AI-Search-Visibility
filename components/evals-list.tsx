"use client"

import { useEffect, useState } from "react"
import { getSupabaseClient } from "@/lib/supabase-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function EvalsList() {
  const router = useRouter()
  const [evals, setEvals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEvals = async () => {
      const supabase = getSupabaseClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data } = await supabase
        .from("evals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10)

      setEvals(data || [])
      setLoading(false)
    }

    fetchEvals()
  }, [])

  if (loading) {
    return <div className="text-muted-foreground">Loading evals...</div>
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recent Evals</CardTitle>
            <CardDescription>Your latest evaluations</CardDescription>
          </div>
          <Button onClick={() => router.push("/evals/new")}>New Eval</Button>
        </div>
      </CardHeader>
      <CardContent>
        {evals.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No evals yet. Create your first evaluation.</div>
        ) : (
          <div className="space-y-2">
            {evals.map((eval_) => (
              <div
                key={eval_.id}
                className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 cursor-pointer"
                onClick={() => router.push(`/evals/${eval_.id}`)}
              >
                <div className="flex-1">
                  <p className="font-medium text-sm">{eval_.input.substring(0, 50)}...</p>
                  <p className="text-xs text-muted-foreground">{new Date(eval_.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{eval_.score || "N/A"}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
