import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { vehicle } = await request.json()

    if (!vehicle) {
      return NextResponse.json({ error: "Vehicle number is required" }, { status: 400 })
    }

    const cleanVehicle = vehicle.replace(/\s|-/g, "").toUpperCase()

    if (!/^[A-Z]{2}[0-9]{1,2}[A-Z]{0,2}[0-9]{4}$/.test(cleanVehicle)) {
      return NextResponse.json({ error: "Invalid vehicle registration format" }, { status: 400 })
    }

    // Try vahan-api first
    try {
      const response = await fetch(`https://vahan-api.vercel.app/api/vehicle/${cleanVehicle}`)

      if (response.ok) {
        const result = await response.json()
        if (result && result.data) {
          return NextResponse.json(result.data)
        }
      }
    } catch (error) {
      console.error("Vahan API error:", error)
    }

    // If vahan-api fails, try scraping vahanx.in
    try {
      const response = await fetch("https://vahanx.in/api/vehicle-info", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        body: JSON.stringify({ vehicleNumber: cleanVehicle }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data && data.success) {
          return NextResponse.json(data.data)
        }
      }
    } catch (error) {
      console.error("VahanX API error:", error)
    }

    return NextResponse.json({ error: "Vehicle data not found" }, { status: 404 })
  } catch (error) {
    console.error("Vehicle lookup error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
