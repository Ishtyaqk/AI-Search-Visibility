"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function NewProjectPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [websiteUrl, setWebsiteUrl] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      // Validate inputs
      if (!name.trim() || !websiteUrl.trim()) {
        throw new Error("Brand name and website URL are required")
      }

      const supabase = getSupabaseClient()

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        console.log("[v0] Auth error:", userError)
        router.push("/login")
        return
      }

      const { data: profileData, error: profileCheckError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .single()

      if (!profileData) {
        console.log("[v0] Profile not found, creating one...")
        const { error: profileCreateError } = await supabase.from("profiles").insert([
          {
            id: user.id,
            email: user.email,
            full_name: user.email?.split("@")[0] || "User",
          },
        ])
        if (profileCreateError) {
          console.log("[v0] Profile creation error:", profileCreateError)
          throw new Error("Failed to create user profile. Please try again.")
        }
      }

      console.log("[v0] Creating project for user:", user.id)

      const { data, error: insertError } = await supabase
        .from("projects")
        .insert([
          {
            user_id: user.id,
            name: name.trim(),
            website_url: websiteUrl.trim(),
            description: description.trim(),
          },
        ])
        .select()

      if (insertError) {
        console.log("[v0] Insert error:", insertError)
        throw new Error(insertError.message || "Failed to create project")
      }

      if (!data || data.length === 0) {
        throw new Error("Project created but no data returned")
      }

      console.log("[v0] Project created successfully:", data[0].id)
      setSuccess(true)

      // Redirect after a short delay to show success message
      setTimeout(() => {
        router.push(`/projects/${data[0].id}`)
      }, 500)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred"
      console.log("[v0] Error:", errorMessage)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Create New Project</h1>
          <p className="text-muted-foreground">Add a new brand to track its AI visibility</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
            <CardDescription>Enter your brand information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="text-sm font-medium">Brand Name *</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., My AI Startup"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Website URL *</label>
                <Input
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="e.g., https://myai.com"
                  required
                  disabled={loading}
                  type="url"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What does your brand do?"
                  rows={4}
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-4 rounded border border-destructive/20">
                  <p className="font-semibold mb-1">Error creating project:</p>
                  <p>{error}</p>
                </div>
              )}

              {success && (
                <div className="text-sm text-green-600 bg-green-50 p-4 rounded border border-green-200">
                  Project created successfully! Redirecting...
                </div>
              )}

              <div className="flex gap-4">
                <Button type="submit" disabled={loading || success}>
                  {loading ? "Creating..." : success ? "Created!" : "Create Project"}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
