import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { ip } = await request.json()

    if (!ip) {
      return NextResponse.json({ error: "IP address is required" }, { status: 400 })
    }

    const response = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Accept: "application/json",
        },
      },
    )

    const contentType = response.headers.get("content-type")
    console.log("[v0] IP API response status:", response.status)
    console.log("[v0] IP API content-type:", contentType)

    if (!response.ok) {
      const text = await response.text()
      console.log("[v0] IP API error response:", text)
      return NextResponse.json({ error: `API returned ${response.status}: ${text}` }, { status: 500 })
    }

    if (!contentType?.includes("application/json")) {
      const text = await response.text()
      console.log("[v0] IP API returned non-JSON:", text)
      return NextResponse.json({ error: `API returned non-JSON response: ${text}` }, { status: 500 })
    }

    const data = await response.json()
    console.log("[v0] IP API data:", data)

    if (data.status === "fail") {
      return NextResponse.json({ error: data.message || "IP lookup failed" }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] IP lookup error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        details: "Failed to fetch IP geolocation data",
      },
      { status: 500 },
    )
  }
}
