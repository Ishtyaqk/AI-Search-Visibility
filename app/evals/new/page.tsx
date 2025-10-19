"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import DashboardHeader from "@/components/dashboard-header"

export default function NewEvalPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [configs, setConfigs] = useState<any[]>([])
  const [formData, setFormData] = useState({
    configId: "",
    input: "",
    output: "",
    score: "",
  })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

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

      // Fetch configs
      const { data } = await supabase.from("eval_config").select("*").eq("user_id", user.id)

      setConfigs(data || [])
      setLoading(false)
    }

    checkAuth()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !formData.configId) return

    setSubmitting(true)
    const supabase = getSupabaseClient()

    try {
      await supabase.from("evals").insert({
        user_id: user.id,
        config_id: formData.configId,
        input: formData.input,
        output: formData.output,
        score: formData.score ? Number.parseFloat(formData.score) : null,
      })

      router.push("/dashboard")
    } catch (error) {
      alert("Error creating eval")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={user} />
      <main className="max-w-2xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Create New Eval</CardTitle>
            <CardDescription>Add a new evaluation record</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Config</label>
                <select
                  value={formData.configId}
                  onChange={(e) => setFormData({ ...formData, configId: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md"
                  required
                >
                  <option value="">Select a config</option>
                  {configs.map((config) => (
                    <option key={config.id} value={config.id}>
                      {config.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Input</label>
                <textarea
                  value={formData.input}
                  onChange={(e) => setFormData({ ...formData, input: e.target.value })}
                  placeholder="Enter input"
                  className="w-full px-3 py-2 border border-border rounded-md"
                  rows={4}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Output</label>
                <textarea
                  value={formData.output}
                  onChange={(e) => setFormData({ ...formData, output: e.target.value })}
                  placeholder="Enter output"
                  className="w-full px-3 py-2 border border-border rounded-md"
                  rows={4}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Score (optional)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.score}
                  onChange={(e) => setFormData({ ...formData, score: e.target.value })}
                  placeholder="0.0"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Creating..." : "Create Eval"}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.push("/dashboard")}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
