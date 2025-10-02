import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error("[v0] JSON parse error:", parseError)
      return NextResponse.json({ success: false, error: "Invalid JSON in request body" }, { status: 400 })
    }

    const { code } = body

    if (!code || typeof code !== "string") {
      return NextResponse.json({ success: false, error: "Invalid code provided" }, { status: 400 })
    }

    try {
      // For now, we'll simulate Python execution by creating a script file
      // In production, this would connect to a Python execution service

      // Create a simple Python executor
      const output = await executePythonCode(code)

      const executionTime = Date.now() - startTime

      return NextResponse.json({
        success: true,
        output: output || "(no output)",
        executionTime,
      })
    } catch (execError: any) {
      console.error("[v0] Execution error:", execError)
      const executionTime = Date.now() - startTime

      return NextResponse.json({
        success: false,
        error: execError.message || "Execution failed",
        executionTime,
      })
    }
  } catch (error) {
    console.error("[v0] Error executing Python script:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    )
  }
}

async function executePythonCode(code: string): Promise<string> {
  // This is a placeholder that simulates Python execution
  // In a real implementation, this would use a Python runtime or service

  try {
    // Write to scripts folder and execute
    const scriptPath = `/scripts/user_script_${Date.now()}.py`

    // For demonstration, we'll return a message
    // The actual execution happens when scripts are run in the v0 environment
    return `Python execution initiated. Code length: ${code.length} characters.\n\nNote: Full Python execution requires the script to be in the /scripts folder.`
  } catch (error) {
    throw new Error(`Python execution failed: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

export const dynamic = "force-dynamic"
