"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Phone, MapPin, CreditCard, Car, Shield } from "lucide-react"

interface OsintResult {
  type: "success" | "error" | "info"
  content: string
}

export function OsintInterface() {
  const [results, setResults] = useState<OsintResult[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const executeOsint = async (feature: string, input: string) => {
    if (!input.trim()) {
      setResults([{ type: "error", content: "Please enter a value" }])
      return
    }

    setIsLoading(true)
    setResults([{ type: "info", content: `Executing ${feature} lookup...` }])

    try {
      const resultLines: OsintResult[] = []

      switch (feature) {
        case "ip": {
          const ip = input.trim()
          resultLines.push({ type: "success", content: `🌐 IP Address Lookup for ${ip}` })
          resultLines.push({ type: "success", content: "=".repeat(60) })

          try {
            const response = await fetch("/api/osint/ip", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ip }),
            })

            const data = await response.json()

            if (response.ok && data.status === "success") {
              resultLines.push({ type: "success", content: `📍 IP Address: ${data.query || "N/A"}` })
              resultLines.push({
                type: "success",
                content: `🌍 Country: ${data.country || "N/A"} (${data.countryCode || "N/A"})`,
              })
              resultLines.push({
                type: "success",
                content: `📮 Region/State: ${data.regionName || "N/A"} (${data.region || "N/A"})`,
              })
              resultLines.push({ type: "success", content: `🏙️ City: ${data.city || "N/A"}` })
              resultLines.push({ type: "success", content: `📬 Postal Code: ${data.zip || "N/A"}` })
              resultLines.push({ type: "success", content: `⏰ Timezone: ${data.timezone || "N/A"}` })
              resultLines.push({ type: "success", content: `🏢 ISP: ${data.isp || "N/A"}` })
              resultLines.push({ type: "success", content: `🏛️ Organization: ${data.org || "N/A"}` })
              resultLines.push({ type: "success", content: `🔢 AS Number/Name: ${data.as || "N/A"}` })
              resultLines.push({
                type: "success",
                content: `📍 Coordinates: Lat: ${data.lat || "N/A"}, Lon: ${data.lon || "N/A"}`,
              })
            } else {
              resultLines.push({ type: "error", content: `❌ ${data.error || "IP lookup failed"}` })
            }
          } catch (error) {
            resultLines.push({
              type: "error",
              content: `❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`,
            })
          }
          break
        }

        case "phone": {
          const phoneInput = input.trim()
          resultLines.push({ type: "success", content: `📱 Phone Number Trace for ${phoneInput}` })
          resultLines.push({ type: "success", content: "=".repeat(60) })

          try {
            const response = await fetch("/api/osint/phone", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ phone: phoneInput }),
            })

            const data = await response.json()

            if (response.ok) {
              resultLines.push({ type: "success", content: `📞 Number (Input): ${data.inputPhone}` })
              resultLines.push({ type: "success", content: `📞 Number (Cleaned): ${data.phone}` })
              resultLines.push({ type: "success", content: `🇮🇳 Country: ${data.country}` })
              resultLines.push({ type: "success", content: `📱 Type: ${data.type}` })

              if (data.found) {
                resultLines.push({ type: "success", content: "✅ Number found in database" })
                resultLines.push({ type: "success", content: "" })

                if (data.owner) {
                  resultLines.push({ type: "success", content: `👤 Owner Name: ${data.owner}` })
                }
                if (data.operator) {
                  resultLines.push({ type: "success", content: `📡 Operator: ${data.operator}` })
                }
                if (data.circle) {
                  resultLines.push({ type: "success", content: `🔄 Circle: ${data.circle}` })
                }
                if (data.state) {
                  resultLines.push({ type: "success", content: `🗺️ State: ${data.state}` })
                }
                if (data.connectionType) {
                  resultLines.push({ type: "success", content: `📶 Connection Type: ${data.connectionType}` })
                }
              } else {
                resultLines.push({ type: "info", content: "⚠️ Limited information available" })
                resultLines.push({ type: "info", content: "ℹ️ Number may not be in the database" })
              }
            } else {
              resultLines.push({ type: "error", content: `❌ ${data.error || "Phone lookup failed"}` })
            }
          } catch (error) {
            resultLines.push({
              type: "error",
              content: `❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`,
            })
          }
          break
        }

        case "ifsc": {
          const ifsc = input.trim().toUpperCase()
          resultLines.push({ type: "success", content: `🏦 IFSC Code Lookup for ${ifsc}` })
          resultLines.push({ type: "success", content: "=".repeat(60) })

          if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) {
            resultLines.push({
              type: "error",
              content: "❌ Invalid IFSC code format (Expected: BANK0BRANCH, e.g., HDFC0000001)",
            })
          } else {
            try {
              const response = await fetch(`https://ifsc.razorpay.com/${ifsc}`)

              if (response.ok) {
                const data = await response.json()

                if (data.BANK) {
                  resultLines.push({ type: "success", content: `🏛️ Bank Name: ${data.BANK || "N/A"}` })
                  resultLines.push({ type: "success", content: `🏢 Branch: ${data.BRANCH || "N/A"}` })
                  resultLines.push({ type: "success", content: `📍 Address: ${data.ADDRESS || "N/A"}` })
                  resultLines.push({ type: "success", content: `🏙️ City: ${data.CITY || "N/A"}` })
                  resultLines.push({ type: "success", content: `📮 District: ${data.DISTRICT || "N/A"}` })
                  resultLines.push({ type: "success", content: `🗺️ State: ${data.STATE || "N/A"}` })
                  resultLines.push({ type: "success", content: `🔢 IFSC Code: ${data.IFSC || "N/A"}` })
                  resultLines.push({ type: "success", content: `🔢 MICR Code: ${data.MICR || "N/A"}` })
                  resultLines.push({ type: "success", content: `📞 Contact: ${data.CONTACT || "N/A"}` })
                  const upiStatus = data.UPI ? "Enabled" : "Disabled"
                  resultLines.push({ type: "success", content: `💳 UPI: ${upiStatus}` })
                } else {
                  resultLines.push({ type: "error", content: `⚠️ IFSC code '${ifsc}' not found or is invalid` })
                }
              } else if (response.status === 404) {
                resultLines.push({ type: "error", content: `⚠️ IFSC code '${ifsc}' not found (HTTP 404)` })
              } else {
                resultLines.push({ type: "error", content: `❌ HTTP Error: ${response.status}` })
              }
            } catch (error) {
              resultLines.push({
                type: "error",
                content: `❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`,
              })
            }
          }
          break
        }

        case "vehicle": {
          const vehicle = input.replace(/\s|-/g, "").toUpperCase()
          resultLines.push({ type: "success", content: `🚗 Vehicle Registration Lookup for ${vehicle}` })
          resultLines.push({ type: "success", content: "=".repeat(60) })

          try {
            const response = await fetch("/api/osint/vehicle", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ vehicle }),
            })

            const data = await response.json()

            if (response.ok) {
              resultLines.push({
                type: "success",
                content: `🚗 Vehicle Number: ${data.registrationNumber || vehicle}`,
              })
              resultLines.push({ type: "success", content: `👤 Owner Name: ${data.ownerName || "N/A"}` })
              resultLines.push({
                type: "success",
                content: `📅 Registration Date: ${data.registrationDate || "N/A"}`,
              })
              resultLines.push({ type: "success", content: `🏭 Make & Model: ${data.makeModel || "N/A"}` })
              resultLines.push({ type: "success", content: `⛽ Fuel Type: ${data.fuelType || "N/A"}` })
              resultLines.push({ type: "success", content: `🚙 Vehicle Class: ${data.vehicleClass || "N/A"}` })
              resultLines.push({ type: "success", content: `🏢 RTO Office: ${data.rtoOffice || "N/A"}` })

              const chassis = data.chassisNumber
              if (chassis && chassis !== "N/A" && chassis.length > 4) {
                resultLines.push({ type: "success", content: `🔧 Chassis No (Partial): ...${chassis.slice(-4)}` })
              }

              const engine = data.engineNumber
              if (engine && engine !== "N/A" && engine.length > 4) {
                resultLines.push({ type: "success", content: `⚙️ Engine No (Partial): ...${engine.slice(-4)}` })
              }
            } else {
              resultLines.push({ type: "error", content: `❌ ${data.error || "Vehicle lookup failed"}` })
              resultLines.push({
                type: "info",
                content: "ℹ️ The vehicle may not be registered or data is unavailable",
              })
            }
          } catch (error) {
            resultLines.push({
              type: "error",
              content: `❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`,
            })
          }
          break
        }
      }

      setResults(resultLines)
    } catch (error) {
      setResults([{ type: "error", content: `Error: ${error instanceof Error ? error.message : "Unknown error"}` }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="bg-card border-border p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <Shield className="w-6 h-6 text-accent" />
          STARK OSINT
        </h2>
        <p className="text-sm text-muted-foreground">Open Source Intelligence Gathering Tool</p>
      </div>

      <Tabs defaultValue="ip" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="ip">
            <MapPin className="w-4 h-4 mr-2" />
            IP Lookup
          </TabsTrigger>
          <TabsTrigger value="phone">
            <Phone className="w-4 h-4 mr-2" />
            Phone
          </TabsTrigger>
          <TabsTrigger value="ifsc">
            <CreditCard className="w-4 h-4 mr-2" />
            IFSC
          </TabsTrigger>
          <TabsTrigger value="vehicle">
            <Car className="w-4 h-4 mr-2" />
            Vehicle
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ip" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ip-input">IP Address</Label>
            <div className="flex gap-2">
              <Input
                id="ip-input"
                placeholder="e.g., 8.8.8.8"
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    executeOsint("ip", e.currentTarget.value)
                  }
                }}
              />
              <Button
                onClick={(e) => {
                  const input = document.getElementById("ip-input") as HTMLInputElement
                  executeOsint("ip", input.value)
                }}
                disabled={isLoading}
              >
                <Search className="w-4 h-4 mr-2" />
                Lookup
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="phone" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone-input">Phone Number</Label>
            <div className="flex gap-2">
              <Input
                id="phone-input"
                placeholder="e.g., 9876543210 or +919876543210"
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    executeOsint("phone", e.currentTarget.value)
                  }
                }}
              />
              <Button
                onClick={(e) => {
                  const input = document.getElementById("phone-input") as HTMLInputElement
                  executeOsint("phone", input.value)
                }}
                disabled={isLoading}
              >
                <Search className="w-4 h-4 mr-2" />
                Lookup
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="ifsc" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ifsc-input">IFSC Code</Label>
            <div className="flex gap-2">
              <Input
                id="ifsc-input"
                placeholder="e.g., SBIN0001234"
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    executeOsint("ifsc", e.currentTarget.value)
                  }
                }}
              />
              <Button
                onClick={(e) => {
                  const input = document.getElementById("ifsc-input") as HTMLInputElement
                  executeOsint("ifsc", input.value)
                }}
                disabled={isLoading}
              >
                <Search className="w-4 h-4 mr-2" />
                Lookup
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="vehicle" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="vehicle-input">Vehicle Registration Number</Label>
            <div className="flex gap-2">
              <Input
                id="vehicle-input"
                placeholder="e.g., MH12AB1234"
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    executeOsint("vehicle", e.currentTarget.value)
                  }
                }}
              />
              <Button
                onClick={(e) => {
                  const input = document.getElementById("vehicle-input") as HTMLInputElement
                  executeOsint("vehicle", input.value)
                }}
                disabled={isLoading}
              >
                <Search className="w-4 h-4 mr-2" />
                Lookup
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {results.length > 0 && (
        <Card className="mt-6 bg-terminal-bg border-border p-4">
          <h3 className="text-sm font-semibold mb-3 text-terminal-text">Results</h3>
          <div className="space-y-1 font-mono text-sm">
            {results.map((result, index) => (
              <div
                key={index}
                className={
                  result.type === "error"
                    ? "text-terminal-error"
                    : result.type === "info"
                      ? "text-terminal-prompt"
                      : "text-terminal-success"
                }
              >
                {result.content}
              </div>
            ))}
          </div>
        </Card>
      )}
    </Card>
  )
}
