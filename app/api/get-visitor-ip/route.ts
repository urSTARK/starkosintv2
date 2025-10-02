import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // Try to get IP from various headers (for different proxy/CDN setups)
    const forwarded = request.headers.get("x-forwarded-for")
    const realIp = request.headers.get("x-real-ip")
    const cfConnectingIp = request.headers.get("cf-connecting-ip")

    // Priority: CF-Connecting-IP > X-Real-IP > X-Forwarded-For
    let visitorIp = cfConnectingIp || realIp || forwarded?.split(",")[0]

    // Clean up the IP if we got one
    if (visitorIp) {
      visitorIp = visitorIp.trim()
    }

    // Validate if we got a real IP (not localhost, not empty)
    const isValidIp =
      visitorIp &&
      visitorIp !== "Unable to detect" &&
      visitorIp !== "::1" &&
      visitorIp !== "127.0.0.1" &&
      !visitorIp.startsWith("192.168.") &&
      !visitorIp.startsWith("10.") &&
      !visitorIp.startsWith("172.")

    // If no valid IP from headers, use external service as fallback
    if (!isValidIp) {
      try {
        // Try ipify.org first (simple and reliable)
        const ipifyResponse = await fetch("https://api.ipify.org?format=json", {
          signal: AbortSignal.timeout(3000), // 3 second timeout
        })

        if (ipifyResponse.ok) {
          const data = await ipifyResponse.json()
          if (data.ip) {
            visitorIp = data.ip
          }
        }
      } catch (ipifyError) {
        console.error("[v0] ipify.org failed, trying ip-api.com:", ipifyError)

        // Fallback to ip-api.com
        try {
          const ipapiResponse = await fetch("http://ip-api.com/json/?fields=query", {
            signal: AbortSignal.timeout(3000), // 3 second timeout
          })

          if (ipapiResponse.ok) {
            const data = await ipapiResponse.json()
            if (data.query) {
              visitorIp = data.query
            }
          }
        } catch (ipapiError) {
          console.error("[v0] ip-api.com also failed:", ipapiError)
        }
      }
    }

    // Final fallback
    if (!visitorIp) {
      visitorIp = "Unable to detect"
    }

    console.log("[v0] Detected visitor IP:", visitorIp)

    return NextResponse.json({
      success: true,
      ip: visitorIp,
    })
  } catch (error: any) {
    console.error("[v0] Error getting visitor IP:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to detect IP address",
        ip: "Unable to detect",
      },
      { status: 500 },
    )
  }
}
