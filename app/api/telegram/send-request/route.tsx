import { NextResponse } from "next/server"

const TELEGRAM_BOT_TOKEN = "8153567405:AAGbCcKn1uyu352_wCao5kJO-jtZfoP3xXY"
const TELEGRAM_CHAT_ID = "8479858938"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, contactMethod, telegramUsername, searchType, message } = body

    // Validate required fields
    if (!name || !telegramUsername || !searchType || !message) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    // Format message for Telegram
    const telegramMessage = `
🔔 <b>New STARK OSINT Request</b>

👤 <b>Name:</b> ${name}
📱 <b>Contact Method:</b> ${contactMethod}
💬 <b>Telegram Username:</b> ${telegramUsername}
🔍 <b>Search Type:</b> ${searchType}

📝 <b>Request Details:</b>
${message}

⏰ <b>Received:</b> ${new Date().toLocaleString()}
    `.trim()

    // Send message to Telegram
    const telegramApiUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`

    const response = await fetch(telegramApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: telegramMessage,
        parse_mode: "HTML",
      }),
    })

    const data = await response.json()

    if (!data.ok) {
      console.error("[v0] Telegram API error:", data)
      throw new Error(data.description || "Failed to send message to Telegram")
    }

    return NextResponse.json({
      success: true,
      message: "Request sent successfully",
    })
  } catch (error: any) {
    console.error("[v0] Error sending Telegram message:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to send request",
      },
      { status: 500 },
    )
  }
}
