import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()

    if (!code) {
      return NextResponse.json({ success: false, error: "No code provided" }, { status: 400 })
    }

    // Use Piston API for Python execution
    const response = await fetch("https://emkc.org/api/v2/piston/execute", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        language: "python",
        version: "3.10.0",
        files: [
          {
            name: "main.py",
            content: code,
          },
        ],
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: result.message || "Failed to execute code",
        },
        { status: 500 },
      )
    }

    // Piston API returns output in run.output and run.stderr
    const output = result.run?.output || ""
    const stderr = result.run?.stderr || ""

    return NextResponse.json({
      success: !stderr || stderr.trim() === "",
      output: output,
      error: stderr || null,
    })
  } catch (error) {
    console.error("[v0] Python execution error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
