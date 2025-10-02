import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json()

    if (!phone) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 })
    }

    // Clean the phone number
    const cleanPhone = phone.replace(/^\+91|\s|-/g, "").trim()

    if (!/^\d{10,12}$/.test(cleanPhone)) {
      return NextResponse.json({ error: "Invalid phone number format" }, { status: 400 })
    }

    // Make request to calltracer.in
    const response = await fetch("https://calltracer.in", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      body: `country=IN&q=${cleanPhone}`,
    })

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch phone data" }, { status: 500 })
    }

    const html = await response.text()

    // Parse the HTML to extract information
    const result: any = {
      phone: cleanPhone,
      inputPhone: phone,
      country: "India",
      type: "Mobile Number",
    }

    // Extract owner name
    const ownerMatch = html.match(/Owner Name[:\s]*<\/td>\s*<td[^>]*>([^<]+)/i)
    if (ownerMatch) {
      result.owner = ownerMatch[1].trim()
    }

    // Extract operator
    const operatorMatch = html.match(/Operator[:\s]*<\/td>\s*<td[^>]*>([^<]+)/i)
    if (operatorMatch) {
      result.operator = operatorMatch[1].trim()
    }

    // Extract circle
    const circleMatch = html.match(/Circle[:\s]*<\/td>\s*<td[^>]*>([^<]+)/i)
    if (circleMatch) {
      result.circle = circleMatch[1].trim()
    }

    // Extract state
    const stateMatch = html.match(/State[:\s]*<\/td>\s*<td[^>]*>([^<]+)/i)
    if (stateMatch) {
      result.state = stateMatch[1].trim()
    }

    // Extract connection type
    const typeMatch = html.match(/Type[:\s]*<\/td>\s*<td[^>]*>([^<]+)/i)
    if (typeMatch) {
      result.connectionType = typeMatch[1].trim()
    }

    // Check if data was found
    result.found = !!(ownerMatch || operatorMatch || circleMatch)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Phone lookup error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
