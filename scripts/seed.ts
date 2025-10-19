import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function seed() {
  console.log("Starting seed...")

  try {
    // Create test user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: "test@example.com",
      password: "Test123!@#",
      email_confirm: true,
    })

    if (authError) {
      console.log("User might already exist:", authError.message)
    } else {
      console.log("Created test user:", authData.user?.id)
    }

    const userId = authData?.user?.id || (await supabase.auth.admin.listUsers()).data?.users?.[0]?.id

    if (!userId) {
      console.error("No user found")
      return
    }

    // Create profile
    await supabase.from("profiles").upsert({
      id: userId,
      email: "test@example.com",
      full_name: "Test User",
    })

    // Create eval configs
    const { data: configs } = await supabase
      .from("eval_config")
      .insert([
        {
          user_id: userId,
          name: "Sentiment Analysis",
          description: "Evaluate sentiment classification",
          metrics: ["accuracy", "precision", "recall"],
        },
        {
          user_id: userId,
          name: "Text Summarization",
          description: "Evaluate summary quality",
          metrics: ["rouge", "bleu"],
        },
      ])
      .select()

    console.log("Created configs:", configs?.length)

    // Create sample evals
    if (configs && configs.length > 0) {
      const evals = []
      for (let i = 0; i < 20; i++) {
        const daysAgo = Math.floor(Math.random() * 7)
        const date = new Date()
        date.setDate(date.getDate() - daysAgo)

        evals.push({
          user_id: userId,
          config_id: configs[i % configs.length].id,
          input: `Sample input ${i + 1}`,
          output: `Sample output ${i + 1}`,
          score: Math.random() * 100,
          created_at: date.toISOString(),
        })
      }

      await supabase.from("evals").insert(evals)
      console.log("Created evals:", evals.length)
    }

    console.log("Seed completed successfully!")
    console.log("Test credentials:")
    console.log("Email: test@example.com")
    console.log("Password: Test123!@#")
  } catch (error) {
    console.error("Seed error:", error)
  }
}

seed()
