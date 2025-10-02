"use client"

import { CardDescription } from "@/components/ui/card"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Loader2,
  Search,
  Globe,
  Phone,
  Mail,
  User,
  Car,
  Building2,
  Wallet,
  Wifi,
  FileText,
  CreditCard,
  MapPin,
  Shield,
  Send,
} from "lucide-react"
import dynamic from "next/dynamic"
import { useToast } from "@/hooks/use-toast"

// Dynamically import the map component to avoid SSR issues
const LocationMap = dynamic(() => import("@/components/location-map"), { ssr: false })
const IPLocationMap = dynamic(() => import("@/components/ip-location-map"), { ssr: false })
const PhoneLocationMap = dynamic(() => import("@/components/phone-location-map"), { ssr: false })

export default function OSINTTool() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [lookupType, setLookupType] = useState<string>("")
  const [visitorIp, setVisitorIp] = useState<string>("")
  const [loadingVisitorIp, setLoadingVisitorIp] = useState(true)
  const resultsRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    const fetchVisitorIp = async () => {
      try {
        const response = await fetch("/api/get-visitor-ip")
        const data = await response.json()
        if (data.success && data.ip) {
          setVisitorIp(data.ip)
        }
      } catch (error) {
        console.error("[v0] Failed to fetch visitor IP:", error)
      } finally {
        setLoadingVisitorIp(false)
      }
    }

    fetchVisitorIp()
  }, [])

  const playSuccessSound = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.value = 800
    oscillator.type = "sine"
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.3)
  }

  useEffect(() => {
    if (results && resultsRef.current) {
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      }, 100)
    }
  }, [results])

  const performLookup = async (type: string, query: string) => {
    if (!query.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a value to lookup",
        variant: "destructive",
      })
      setError("Please enter a value to lookup")
      return
    }

    setLoading(true)
    setError(null)
    setResults(null)
    setLookupType(type)

    try {
      const response = await fetch("/api/osint/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, query: query.trim() }),
      })

      const contentType = response.headers.get("content-type")

      if (!contentType?.includes("application/json")) {
        const text = await response.text()
        console.error("[v0] Non-JSON response:", text.substring(0, 200))
        throw new Error("Server returned an invalid response. Please try again.")
      }

      const data = await response.json()

      if (data.success) {
        setResults(data.data)
        playSuccessSound()
        toast({
          title: "Success!",
          description: "Data fetched successfully",
          duration: 3000,
        })
      } else {
        toast({
          title: "Lookup Failed",
          description: data.error || "Unable to fetch data. Please try again.",
          variant: "destructive",
        })
        setError(data.error || "Lookup failed")
      }
    } catch (err: any) {
      let errorMessage = "An unexpected error occurred"
      if (err.message.includes("Failed to fetch")) {
        errorMessage = "Network error: Unable to connect to server"
      } else if (err.message.includes("JSON")) {
        errorMessage = "Server error: Invalid response format"
      } else {
        errorMessage = err.message || errorMessage
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
      setError(errorMessage)
      console.error("[v0] Lookup error:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          STARK OSINT
        </h1>
        <p className="text-muted-foreground">Comprehensive Open Source Intelligence Gathering Tool</p>
      </div>

      <Tabs defaultValue="network" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="network">Network</TabsTrigger>
          <TabsTrigger value="identity">Identity</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="hardware">Vehicle</TabsTrigger>
          <TabsTrigger value="leak-search">Adv search</TabsTrigger>
        </TabsList>

        <TabsContent value="network" className="space-y-4">
          <LookupCard
            icon={<Globe className="h-5 w-5" />}
            title="IP Address Lookup"
            description="Get geolocation and ISP information"
            placeholder="Enter IP address (e.g., 8.8.8.8)"
            onLookup={(query) => performLookup("ip", query)}
            loading={loading}
            visitorIp={visitorIp}
            loadingVisitorIp={loadingVisitorIp}
          />

          <LookupCard
            icon={<Building2 className="h-5 w-5" />}
            title="Domain Information"
            description="DNS records and hosting details"
            placeholder="Enter domain (e.g., google.com)"
            onLookup={(query) => performLookup("domain", query)}
            loading={loading}
          />

          <LookupCard
            icon={<Wifi className="h-5 w-5" />}
            title="MAC Address Lookup"
            description="Find device manufacturer"
            placeholder="Enter MAC address (e.g., 00:1A:2B:3C:4D:5E)"
            onLookup={(query) => performLookup("mac", query)}
            loading={loading}
          />
        </TabsContent>

        <TabsContent value="identity" className="space-y-4">
          <LookupCard
            icon={<Phone className="h-5 w-5" />}
            title="Phone Number Lookup"
            description="Carrier and location information"
            placeholder="Enter phone number (e.g., 9876543210)"
            onLookup={(query) => performLookup("phone", query)}
            loading={loading}
          />

          <LookupCard
            icon={<Mail className="h-5 w-5" />}
            title="Email Validation"
            description="Verify email and check domain"
            placeholder="Enter email address"
            onLookup={(query) => performLookup("email", query)}
            loading={loading}
          />

          <LookupCard
            icon={<User className="h-5 w-5" />}
            title="Username Search"
            description="Find social media profiles"
            placeholder="Enter username"
            onLookup={(query) => performLookup("username", query)}
            loading={loading}
          />
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          <LookupCard
            icon={<Building2 className="h-5 w-5" />}
            title="IFSC Code Lookup"
            description="Bank branch details"
            placeholder="Enter IFSC code (e.g., SBIN0001234)"
            onLookup={(query) => performLookup("ifsc", query)}
            loading={loading}
          />

          <LookupCard
            icon={<Wallet className="h-5 w-5" />}
            title="Cryptocurrency Address"
            description="Validate crypto wallet addresses"
            placeholder="Enter BTC or ETH address"
            onLookup={(query) => performLookup("crypto", query)}
            loading={loading}
          />
        </TabsContent>

        <TabsContent value="hardware" className="space-y-4">
          <LookupCard
            icon={<Car className="h-5 w-5" />}
            title="Vehicle / RC Search"
            description="Vehicle registration and owner details"
            placeholder="Enter registration number (e.g., MH12AB1234)"
            onLookup={(query) => performLookup("vehicle", query)}
            loading={loading}
          />

          <LookupCard
            icon={<FileText className="h-5 w-5" />}
            title="Challan Search"
            description="Check traffic violations and fines"
            placeholder="Enter vehicle number (e.g., MH12AB1234)"
            onLookup={(query) => performLookup("challan", query)}
            loading={loading}
          />

          <LookupCard
            icon={<CreditCard className="h-5 w-5" />}
            title="Driving License (DL) Search"
            description="Driver's license information and validity"
            placeholder="Enter DL number (e.g., MH0120200012345)"
            onLookup={(query) => performLookup("dl", query)}
            loading={loading}
          />

          <LookupCard
            icon={<MapPin className="h-5 w-5" />}
            title="RTO Search"
            description="Regional Transport Office details"
            placeholder="Enter RTO code (e.g., MH01)"
            onLookup={(query) => performLookup("rto", query)}
            loading={loading}
          />
        </TabsContent>

        <TabsContent value="leak-search" className="space-y-4">
          <LeakSearchCard />
        </TabsContent>
      </Tabs>

      {error && (
        <Card className="border-red-500">
          <CardContent className="pt-6">
            <p className="text-red-500 text-center">{error}</p>
          </CardContent>
        </Card>
      )}

      <div ref={resultsRef}>{results && <ResultsDisplay results={results} lookupType={lookupType} />}</div>
    </div>
  )
}

function LookupCard({
  icon,
  title,
  description,
  placeholder,
  onLookup,
  loading,
  visitorIp,
  loadingVisitorIp,
}: {
  icon: React.ReactNode
  title: string
  description: string
  placeholder: string
  onLookup: (query: string) => void
  loading: boolean
  visitorIp?: string
  loadingVisitorIp?: boolean
}) {
  const [query, setQuery] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onLookup(query)
  }

  const handleQuickSearch = () => {
    if (visitorIp && visitorIp !== "Unable to detect") {
      setQuery(visitorIp)
      onLookup(visitorIp)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          {icon}
          <CardTitle>{title}</CardTitle>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {visitorIp && title === "IP Address Lookup" && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-slate-900 rounded-lg border border-blue-200 dark:border-slate-700">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">Your IP Address</p>
                {loadingVisitorIp ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    <span className="text-sm text-muted-foreground">Detecting...</span>
                  </div>
                ) : (
                  <p className="text-lg font-mono font-semibold text-blue-600 dark:text-blue-400">{visitorIp}</p>
                )}
              </div>
              {visitorIp && visitorIp !== "Unable to detect" && !loadingVisitorIp && (
                <Button
                  onClick={handleQuickSearch}
                  disabled={loading}
                  variant="outline"
                  size="sm"
                  className="shrink-0 text-black dark:text-white bg-transparent"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Lookup My IP
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            disabled={loading}
          />
          <Button type="submit" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function LeakSearchCard() {
  const [formData, setFormData] = useState({
    name: "",
    contactMethod: "telegram",
    telegramUsername: "",
    searchType: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter your name",
        variant: "destructive",
      })
      return false
    }

    if (!formData.telegramUsername.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter your Telegram username",
        variant: "destructive",
      })
      return false
    }

    if (!formData.telegramUsername.startsWith("@")) {
      toast({
        title: "Validation Error",
        description: "Telegram username must start with @",
        variant: "destructive",
      })
      return false
    }

    if (!formData.searchType) {
      toast({
        title: "Validation Error",
        description: "Please select a search type",
        variant: "destructive",
      })
      return false
    }

    if (!formData.message.trim() || formData.message.trim().length < 10) {
      toast({
        title: "Validation Error",
        description: "Please provide detailed information (minimum 10 characters)",
        variant: "destructive",
      })
      return false
    }

    return true
  }

  const playSuccessSound = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.value = 800
    oscillator.type = "sine"
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.5)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/telegram/send-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        playSuccessSound()
        toast({
          title: "Request Sent Successfully! 🎉",
          description:
            "Successfully sent your request. I will contact you soon on your given contact and provide the details you asked.",
          duration: 6000,
        })

        // Reset form
        setFormData({
          name: "",
          contactMethod: "telegram",
          telegramUsername: "",
          searchType: "",
          message: "",
        })
      } else {
        throw new Error(data.error || "Failed to send request")
      }
    } catch (error: any) {
      toast({
        title: "Error Sending Request",
        description:
          error.message ||
          "Failed to send request. Please try contacting directly via Telegram, WhatsApp, or Instagram.",
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          <CardTitle>Premium Data Lookup Services</CardTitle>
        </div>
        <CardDescription>
          Contact STARK OSINT for advanced data lookup services including breach data, Aadhaar info, and more
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Services Available */}
        <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg space-y-3 border border-blue-200 dark:border-blue-900">
          <h4 className="font-semibold text-sm flex items-center gap-2 text-gray-900 dark:text-white">
            <Badge variant="default">Premium Services</Badge>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-900 dark:text-white">
            <div className="flex items-start gap-2">
              <span className="text-green-600 dark:text-green-400">✓</span>
              <span>Mobile number lookup (10-digit)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600 dark:text-green-400">✓</span>
              <span>Aadhaar number lookup (12-digit)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600 dark:text-green-400">✓</span>
              <span>Email breach check & verification</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600 dark:text-green-400">✓</span>
              <span>Vehicle details (RC, owner, insurance)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600 dark:text-green-400">✓</span>
              <span>Pakistan mobile info lookup</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600 dark:text-green-400">✓</span>
              <span>Pakistan CNIC information</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600 dark:text-green-400">✓</span>
              <span>Ration card info lookup</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600 dark:text-green-400">✓</span>
              <span>FASTag info by RC number</span>
            </div>
          </div>
        </div>

        {/* Contact Methods */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm">Quick Contact Options</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button
              variant="outline"
              className="w-full justify-start gap-2 text-black dark:text-white bg-transparent"
              onClick={() => window.open("https://t.me/urstarkz", "_blank")}
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z" />
              </svg>
              Telegram
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-2 text-black dark:text-white bg-transparent"
              onClick={() => window.open("https://instagram.com/urstarkz", "_blank")}
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.073-1.689-.073-4.849 0-3.204.013-3.583.072-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
              Instagram
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-2 text-black dark:text-white bg-transparent"
              onClick={() => window.open("https://wa.me/+201121417464", "_blank")}
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .\16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              WhatsApp
            </Button>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-yellow-50 dark:bg-yellow-950/30 p-4 rounded-lg space-y-2 border border-yellow-200 dark:border-yellow-900">
          <h4 className="font-semibold text-sm flex items-center gap-2 text-gray-900 dark:text-white">
            <span className="text-yellow-600 dark:text-yellow-400">⚠️</span>
            Important Instructions
          </h4>
          <ul className="text-sm space-y-1 list-disc list-inside text-gray-900 dark:text-white">
            <li>Fill out the form below with your request details</li>
            <li>
              <strong>Send your search query directly to my Telegram DM</strong> - No chatting, just straightforward
              requests
            </li>
            <li>Provide your Telegram username where you want to receive the data</li>
            <li>Be specific about what information you need</li>
            <li>Response time: Usually within 24 hours</li>
          </ul>
        </div>

        {/* Contact Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Your Name *</label>
            <Input
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter your full name"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Your Telegram Username (where you want data) *</label>
            <Input
              name="telegramUsername"
              value={formData.telegramUsername}
              onChange={handleInputChange}
              placeholder="@yourusername"
              required
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">Must start with @ (e.g., @johndoe)</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Preferred Contact Method *</label>
            <select
              name="contactMethod"
              value={formData.contactMethod}
              onChange={handleInputChange}
              className="w-full p-2 rounded-md border border-input bg-background text-foreground text-sm"
              required
              disabled={isSubmitting}
            >
              <option value="telegram">Telegram (Recommended)</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="instagram">Instagram</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Search Type *</label>
            <select
              name="searchType"
              value={formData.searchType}
              onChange={handleInputChange}
              className="w-full p-2 rounded-md border border-input bg-background text-foreground text-sm"
              required
              disabled={isSubmitting}
            >
              <option value="">Select search type...</option>
              <option value="mobile">Mobile Number Lookup (10-digit)</option>
              <option value="aadhaar">Aadhaar Number Lookup (12-digit)</option>
              <option value="email">Email Breach Check</option>
              <option value="vehicle">Vehicle Details (RC, Owner, Insurance)</option>
              <option value="pakistan-mobile">Pakistan Mobile Info</option>
              <option value="pakistan-cnic">Pakistan CNIC Information</option>
              <option value="ration">Ration Card Info</option>
              <option value="fastag">FASTag Info by RC Number</option>
              <option value="other">Other (Specify in message)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Detailed Request Message *</label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              placeholder="Provide detailed information about what you're looking for. Include the specific number/ID/email you want to search, and any additional context that might help."
              className="w-full min-h-[120px] p-3 rounded-md border border-input bg-background text-foreground text-sm resize-y"
              required
              disabled={isSubmitting}
              minLength={10}
            />
            <p className="text-xs text-muted-foreground">Minimum 10 characters. Be as specific as possible.</p>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending Request...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Request to STARK OSINT
              </>
            )}
          </Button>
        </form>

        {/* Privacy Notice */}
        <div className="text-xs text-foreground bg-muted p-3 rounded border border-border">
          <strong>Privacy Notice:</strong> Your information will only be used to process your request and contact you
          with the results. We respect your privacy and will not share your data with third parties.
        </div>
      </CardContent>
    </Card>
  )
}

function ResultsDisplay({ results, lookupType }: { results: any; lookupType: string }) {
  if (lookupType === "ip") {
    const hasCoordinates =
      results.Latitude && results.Longitude && results.Latitude !== "N/A" && results.Longitude !== "N/A"

    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>IP Address Details</CardTitle>
            <CardDescription>Comprehensive geolocation and network information from multiple sources</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Basic Geographic Information */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-blue-600">Geographic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-4">
                  {results["IP Address"] && <InfoRow label="IP Address" value={results["IP Address"]} highlight />}
                  {results["Country"] && <InfoRow label="Country" value={results["Country"]} />}
                  {results["Country Code"] && <InfoRow label="Country Code" value={results["Country Code"]} />}
                  {results["Region"] && <InfoRow label="Region/State" value={results["Region"]} />}
                  {results["District"] && <InfoRow label="District" value={results["District"]} />}
                  {results["City"] && <InfoRow label="City" value={results["City"]} />}
                  {results["Postal/ZIP Code"] && <InfoRow label="ZIP Code" value={results["Postal/ZIP Code"]} />}
                  {results["Coordinates"] && <InfoRow label="Coordinates" value={results["Coordinates"]} />}
                </div>
              </div>

              {/* Network Information */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-green-600">Network Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-4">
                  {results["ISP"] && <InfoRow label="ISP" value={results["ISP"]} />}
                  {results["Organization"] && <InfoRow label="Organization" value={results["Organization"]} />}
                  {results["Domain"] && <InfoRow label="Domain" value={results["Domain"]} />}
                  {results["ASN"] && <InfoRow label="ASN" value={results["ASN"]} />}
                  {results["AS"] && <InfoRow label="AS" value={results["AS"]} />}
                  {results["Net Speed"] && <InfoRow label="Net Speed" value={results["Net Speed"]} />}
                  {results["Address Type"] && <InfoRow label="Address Type" value={results["Address Type"]} />}
                  {results["Usage Type"] && <InfoRow label="Usage Type" value={results["Usage Type"]} />}
                </div>
              </div>

              {/* Additional Details */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-purple-600">Additional Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-4">
                  {results["Time Zone"] && <InfoRow label="Time Zone" value={results["Time Zone"]} />}
                  {results["UTC Offset"] && <InfoRow label="UTC Offset" value={results["UTC Offset"]} />}
                  {results["IDD Code"] && <InfoRow label="IDD & Area Code" value={results["IDD Code"]} />}
                  {results["Area Code"] && <InfoRow label="Area Code" value={results["Area Code"]} />}
                  {results["Elevation"] && <InfoRow label="Elevation" value={results["Elevation"]} />}
                  {results["Weather Station"] && <InfoRow label="Weather Station" value={results["Weather Station"]} />}
                  {results["Currency"] && <InfoRow label="Currency" value={results["Currency"]} />}
                  {results["Languages"] && <InfoRow label="Languages" value={results["Languages"]} />}
                </div>
              </div>

              {/* Proxy & Security Detection */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-red-600">Proxy & Security Detection</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-4">
                  {results["Proxy Detected"] && <InfoRow label="Proxy Detected" value={results["Proxy Detected"]} />}
                  {results["Proxy Type"] && <InfoRow label="Proxy Type" value={results["Proxy Type"]} />}
                  {results["VPN Detected"] && <InfoRow label="VPN Detected" value={results["VPN Detected"]} />}
                  {results["Tor Exit Node"] && <InfoRow label="Tor Exit Node" value={results["Tor Exit Node"]} />}
                  {results["Residential Proxy"] && (
                    <InfoRow label="Residential Proxy" value={results["Residential Proxy"]} />
                  )}
                  {results["Fraud Score"] && <InfoRow label="Fraud Score" value={results["Fraud Score"]} />}
                  {results["Threat Level"] && <InfoRow label="Threat Level" value={results["Threat Level"]} />}
                  {results["Threat Type"] && <InfoRow label="Threat Type" value={results["Threat Type"]} />}
                  {results["Bot Status"] && <InfoRow label="Bot Status" value={results["Bot Status"]} />}
                  {results["Recent Abuse"] && <InfoRow label="Recent Abuse" value={results["Recent Abuse"]} />}
                </div>
              </div>

              {/* Connection Type */}
              {(results["Mobile Network"] || results["Hosting Provider"] || results["Data Center"]) && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-orange-600">Connection Type</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pl-4">
                    {results["Mobile Network"] && <InfoRow label="Mobile Network" value={results["Mobile Network"]} />}
                    {results["Hosting Provider"] && (
                      <InfoRow label="Hosting Provider" value={results["Hosting Provider"]} />
                    )}
                    {results["Data Center"] && <InfoRow label="Data Center" value={results["Data Center"]} />}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {hasCoordinates && (
          <IPLocationMap
            latitude={Number.parseFloat(results.Latitude)}
            longitude={Number.parseFloat(results.Longitude)}
            ipAddress={results["IP Address"]}
            city={results.City}
            country={results.Country}
          />
        )}
      </div>
    )
  }

  if (lookupType === "phone") {
    const locations = {
      hometown: results["Hometown"],
      mobileLocation: results["Mobile Locations"],
      referenceCity: results["Refrence City"],
      towerLocation: results["Tower Locations"],
      address: results["Owner Address"],
      state: results["Mobile State"],
    }

    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Phone Number Details</CardTitle>
            <CardDescription>Information retrieved from calltracer.in</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Basic Info Section */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-blue-600">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-4">
                  {results["Number (Input)"] && <InfoRow label="Number (Input)" value={results["Number (Input)"]} />}
                  {results["Number (Cleaned)"] && (
                    <InfoRow label="Number (Cleaned)" value={results["Number (Cleaned)"]} />
                  )}
                  {results["Country"] && <InfoRow label="Country" value={results["Country"]} />}
                  {results["Mobile State"] && <InfoRow label="State" value={results["Mobile State"]} />}
                </div>
              </div>

              {/* Owner Information Section */}
              {(results["Owner Name"] || results["Owner Address"] || results["Owner Personality"]) && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-green-600">Owner Information</h3>
                  <div className="grid grid-cols-1 gap-3 pl-4">
                    {results["Owner Name"] && <InfoRow label="Owner Name" value={results["Owner Name"]} highlight />}
                    {results["Owner Address"] && <InfoRow label="Address" value={results["Owner Address"]} />}
                    {results["Owner Personality"] && (
                      <InfoRow label="Personality" value={results["Owner Personality"]} />
                    )}
                  </div>
                </div>
              )}

              {/* Location Details Section */}
              {(results["Hometown"] ||
                results["Refrence City"] ||
                results["Mobile Locations"] ||
                results["Tower Locations"]) && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-purple-600">Location Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-4">
                    {results["Hometown"] && <InfoRow label="Hometown" value={results["Hometown"]} />}
                    {results["Refrence City"] && <InfoRow label="Reference City" value={results["Refrence City"]} />}
                    {results["Mobile Locations"] && (
                      <InfoRow label="Mobile Locations" value={results["Mobile Locations"]} />
                    )}
                    {results["Tower Locations"] && (
                      <InfoRow label="Tower Locations" value={results["Tower Locations"]} />
                    )}
                  </div>
                </div>
              )}

              {/* Technical Details Section */}
              {(results["SIM card"] || results["IMEI number"] || results["IP address"] || results["Connection"]) && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-orange-600">Technical Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-4">
                    {results["SIM card"] && <InfoRow label="SIM Card" value={results["SIM card"]} />}
                    {results["Connection"] && <InfoRow label="Connection Type" value={results["Connection"]} />}
                    {results["IMEI number"] && <InfoRow label="IMEI Number" value={results["IMEI number"]} />}
                    {results["IP address"] && <InfoRow label="IP Address" value={results["IP address"]} />}
                  </div>
                </div>
              )}

              {results["MAC address"] && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-cyan-600">Network Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-4">
                    {results["MAC address"] && <InfoRow label="MAC Address" value={results["MAC address"]} />}
                  </div>
                </div>
              )}

              {/* Additional Information Section */}
              {(results["Language"] ||
                results["Tracking History"] ||
                results["Tracker Id"] ||
                results["Complaints"]) && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-red-600">Additional Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-4">
                    {results["Language"] && <InfoRow label="Language" value={results["Language"]} />}
                    {results["Tracking History"] && (
                      <InfoRow label="Tracking History" value={results["Tracking History"]} />
                    )}
                    {results["Tracker Id"] && <InfoRow label="Tracker ID" value={results["Tracker Id"]} />}
                    {results["Complaints"] && <InfoRow label="Complaints" value={results["Complaints"]} />}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <PhoneLocationMap
          locations={locations}
          phoneNumber={results["Number (Input)"] || results["Number (Cleaned)"]}
        />
      </div>
    )
  }

  if (lookupType === "username") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Username Search Results</CardTitle>
          <CardDescription>Check these platforms for the username: {results.Username}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <InfoRow label="Username" value={results.Username} highlight />
              <InfoRow label="Search Status" value={results["Search Status"]} />
              <InfoRow label="Platforms to Check" value={results["Platforms to Check"]} />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Profile URLs</h3>
              <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                {results["Profile URLs"].split("\n").map((line: string, idx: number) => {
                  const urlMatch = line.match(/(https?:\/\/[^\s]+)/)
                  if (urlMatch) {
                    const url = urlMatch[1]
                    const platform = line.split(":")[0]
                    return (
                      <div key={idx} className="flex items-center justify-between">
                        <span>{platform}</span>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Visit Profile →
                        </a>
                      </div>
                    )
                  }
                  return null
                })}
              </div>
            </div>

            {results.Note && (
              <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950 p-3 rounded">
                <strong>Note:</strong> {results.Note}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Specialized vehicle results display with all fields
  if (lookupType === "vehicle") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Registration Details</CardTitle>
          <CardDescription>Comprehensive RC information for {results["Vehicle Number"]}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Owner Information Section */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-blue-600">Owner Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-4">
                {results["Owner Name"] && <InfoRow label="Owner Name" value={results["Owner Name"]} highlight />}
                {results["Father's Name"] && <InfoRow label="Father's Name" value={results["Father's Name"]} />}
                {results["Owner Serial No"] && <InfoRow label="Owner Serial No" value={results["Owner Serial No"]} />}
                {results["Address"] && <InfoRow label="Address" value={results["Address"]} />}
                {results["Present Address"] && <InfoRow label="Present Address" value={results["Present Address"]} />}
                {results["Permanent Address"] && (
                  <InfoRow label="Permanent Address" value={results["Permanent Address"]} />
                )}
              </div>
            </div>

            {/* Vehicle Details Section */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-green-600">Vehicle Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-4">
                {results["Vehicle Number"] && (
                  <InfoRow label="Vehicle Number" value={results["Vehicle Number"]} highlight />
                )}
                {results["Maker Model"] && <InfoRow label="Maker & Model" value={results["Maker Model"]} highlight />}
                {results["Model Name"] && <InfoRow label="Model Name" value={results["Model Name"]} />}
                {results["Maker Description"] && (
                  <InfoRow label="Maker Description" value={results["Maker Description"]} />
                )}
                {results["Body Type"] && <InfoRow label="Body Type" value={results["Body Type"]} />}
                {results["Vehicle Class"] && <InfoRow label="Vehicle Class" value={results["Vehicle Class"]} />}
                {results["Vehicle Category"] && (
                  <InfoRow label="Vehicle Category" value={results["Vehicle Category"]} />
                )}
                {results["Fuel Type"] && <InfoRow label="Fuel Type" value={results["Fuel Type"]} />}
                {results["Fuel Norms"] && <InfoRow label="Fuel Norms" value={results["Fuel Norms"]} />}
                {results["Color"] && <InfoRow label="Color" value={results["Color"]} />}
                {results["Seating Capacity"] && (
                  <InfoRow label="Seating Capacity" value={results["Seating Capacity"]} />
                )}
                {results["Sleeper Capacity"] && (
                  <InfoRow label="Sleeper Capacity" value={results["Sleeper Capacity"]} />
                )}
                {results["Standing Capacity"] && (
                  <InfoRow label="Standing Capacity" value={results["Standing Capacity"]} />
                )}
                {results["Manufacturing Year"] && (
                  <InfoRow label="Manufacturing Year" value={results["Manufacturing Year"]} highlight />
                )}
                {results["Manufacturing Month & Year"] && (
                  <InfoRow label="Manufacturing Month & Year" value={results["Manufacturing Month & Year"]} />
                )}
                {results["Number of Cylinders"] && (
                  <InfoRow label="Number of Cylinders" value={results["Number of Cylinders"]} />
                )}
                {results["Cubic Capacity"] && <InfoRow label="Cubic Capacity" value={results["Cubic Capacity"]} />}
                {results["Wheelbase"] && <InfoRow label="Wheelbase" value={results["Wheelbase"]} />}
              </div>
            </div>

            {/* Registration & Compliance Section */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-purple-600">Registration & Compliance</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-4">
                {results["Registration Date"] && (
                  <InfoRow label="Registration Date (Day-Month-Year)" value={results["Registration Date"]} highlight />
                )}
                {results["Vehicle Age"] && <InfoRow label="Vehicle Age" value={results["Vehicle Age"]} highlight />}
                {results["Registered At"] && <InfoRow label="Registered At" value={results["Registered At"]} />}
                {results["Registered RTO"] && <InfoRow label="Registered RTO" value={results["Registered RTO"]} />}
                {results["Registration Authority"] && (
                  <InfoRow label="Registration Authority" value={results["Registration Authority"]} />
                )}
                {results["Office Code"] && <InfoRow label="Office Code" value={results["Office Code"]} />}
                {results["RC Status"] && <InfoRow label="RC Status" value={results["RC Status"]} />}
                {results["Status as on"] && <InfoRow label="Status as on" value={results["Status as on"]} />}
                {results["Status Message"] && <InfoRow label="Status Message" value={results["Status Message"]} />}
                {results["Vehicle Status"] && <InfoRow label="Vehicle Status" value={results["Vehicle Status"]} />}
                {results["Insurance Company"] && (
                  <InfoRow label="Insurance Company" value={results["Insurance Company"]} />
                )}
                {results["Insurance Policy Number"] && (
                  <InfoRow label="Insurance Policy Number" value={results["Insurance Policy Number"]} />
                )}
                {results["Insurance Upto"] && <InfoRow label="Insurance Upto" value={results["Insurance Upto"]} />}
                {results["Insurance Expiry"] && (
                  <InfoRow label="Insurance Expiry" value={results["Insurance Expiry"]} />
                )}
                {results["Fitness Upto"] && <InfoRow label="Fitness Upto" value={results["Fitness Upto"]} />}
                {results["Fitness Valid Upto"] && (
                  <InfoRow label="Fitness Valid Upto" value={results["Fitness Valid Upto"]} />
                )}
                {results["Tax Upto"] && <InfoRow label="Tax Upto" value={results["Tax Upto"]} />}
                {results["Tax Paid Upto"] && <InfoRow label="Tax Paid Upto" value={results["Tax Paid Upto"]} />}
                {results["Tax Valid Upto"] && <InfoRow label="Tax Valid Upto" value={results["Tax Valid Upto"]} />}
                {results["PUCC Number"] && <InfoRow label="PUCC Number" value={results["PUCC Number"]} />}
                {results["PUCC Upto"] && <InfoRow label="PUCC Upto" value={results["PUCC Upto"]} />}
                {results["Permit Number"] && <InfoRow label="Permit Number" value={results["Permit Number"]} />}
                {results["Permit Issue Date"] && (
                  <InfoRow label="Permit Issue Date" value={results["Permit Issue Date"]} />
                )}
                {results["Permit Valid From"] && (
                  <InfoRow label="Permit Valid From" value={results["Permit Valid From"]} />
                )}
                {results["Permit Valid Upto"] && (
                  <InfoRow label="Permit Valid Upto" value={results["Permit Valid Upto"]} />
                )}
                {results["Permit Type"] && <InfoRow label="Permit Type" value={results["Permit Type"]} />}
                {results["National Permit Number"] && (
                  <InfoRow label="National Permit Number" value={results["National Permit Number"]} />
                )}
                {results["National Permit Upto"] && (
                  <InfoRow label="National Permit Upto" value={results["National Permit Upto"]} />
                )}
                {results["National Permit Issued By"] && (
                  <InfoRow label="National Permit Issued By" value={results["National Permit Issued By"]} />
                )}
              </div>
            </div>

            {/* Financial Information Section */}
            {(results["Financed"] ||
              results["Financier Name"] ||
              results["Financer"] ||
              results["Hypothecation Date"]) && (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-yellow-600">Financial Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-4">
                  {results["Financed"] && <InfoRow label="Financed" value={results["Financed"]} />}
                  {results["Financier Name"] && <InfoRow label="Financier Name" value={results["Financier Name"]} />}
                  {results["Financer"] && <InfoRow label="Financer" value={results["Financer"]} />}
                  {results["Hypothecation Date"] && (
                    <InfoRow label="Hypothecation Date" value={results["Hypothecation Date"]} />
                  )}
                </div>
              </div>
            )}

            {/* Technical Specifications Section */}
            {(results["Chassis Number"] ||
              results["Engine Number"] ||
              results["Unladen Weight"] ||
              results["Gross Weight"] ||
              results["Vehicle Gross Weight"]) && (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-orange-600">Technical Specifications</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-4">
                  {results["Chassis Number"] && <InfoRow label="Chassis Number" value={results["Chassis Number"]} />}
                  {results["Engine Number"] && <InfoRow label="Engine Number" value={results["Engine Number"]} />}
                  {results["Unladen Weight"] && <InfoRow label="Unladen Weight" value={results["Unladen Weight"]} />}
                  {results["Gross Weight"] && <InfoRow label="Gross Weight" value={results["Gross Weight"]} />}
                  {results["Vehicle Gross Weight"] && (
                    <InfoRow label="Vehicle Gross Weight" value={results["Vehicle Gross Weight"]} />
                  )}
                </div>
              </div>
            )}

            {/* Additional Information Section - catch any remaining fields */}
            {Object.keys(results).filter(
              (key) =>
                ![
                  "Owner Name",
                  "Father's Name",
                  "Owner Serial No",
                  "Present Address",
                  "Permanent Address",
                  "Address",
                  "Vehicle Number",
                  "Maker Model",
                  "Model Name",
                  "Maker Description",
                  "Body Type",
                  "Vehicle Class",
                  "Vehicle Category",
                  "Fuel Type",
                  "Fuel Norms",
                  "Color",
                  "Seating Capacity",
                  "Sleeper Capacity",
                  "Standing Capacity",
                  "Manufacturing Year",
                  "Manufacturing Month & Year",
                  "Number of Cylinders",
                  "Cubic Capacity",
                  "Wheelbase",
                  "Registration Date",
                  "Registered At",
                  "Registered RTO",
                  "Registration Authority",
                  "Office Code",
                  "RC Status",
                  "Status as on",
                  "Status Message",
                  "Vehicle Status",
                  "Insurance Company",
                  "Insurance Policy Number",
                  "Insurance Upto",
                  "Insurance Expiry",
                  "Fitness Upto",
                  "Fitness Valid Upto",
                  "Tax Upto",
                  "Tax Paid Upto",
                  "Tax Valid Upto",
                  "PUCC Number",
                  "PUCC Upto",
                  "Permit Number",
                  "Permit Issue Date",
                  "Permit Valid From",
                  "Permit Valid Upto",
                  "Permit Type",
                  "National Permit Number",
                  "National Permit Upto",
                  "National Permit Issued By",
                  "Financed",
                  "Financier Name",
                  "Financer",
                  "Hypothecation Date",
                  "Chassis Number",
                  "Engine Number",
                  "Unladen Weight",
                  "Gross Weight",
                  "Vehicle Gross Weight",
                ].includes(key),
            ).length > 0 && (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-pink-600">Additional Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-4">
                  {Object.entries(results)
                    .filter(
                      ([key]) =>
                        ![
                          "Owner Name",
                          "Father's Name",
                          "Owner Serial No",
                          "Present Address",
                          "Permanent Address",
                          "Address",
                          "Vehicle Number",
                          "Maker Model",
                          "Model Name",
                          "Maker Description",
                          "Body Type",
                          "Vehicle Class",
                          "Vehicle Category",
                          "Fuel Type",
                          "Fuel Norms",
                          "Color",
                          "Seating Capacity",
                          "Sleeper Capacity",
                          "Standing Capacity",
                          "Manufacturing Year",
                          "Manufacturing Month & Year",
                          "Number of Cylinders",
                          "Cubic Capacity",
                          "Wheelbase",
                          "Registration Date",
                          "Registered At",
                          "Registered RTO",
                          "Registration Authority",
                          "Office Code",
                          "RC Status",
                          "Status as on",
                          "Status Message",
                          "Vehicle Status",
                          "Insurance Company",
                          "Insurance Policy Number",
                          "Insurance Upto",
                          "Insurance Expiry",
                          "Fitness Upto",
                          "Fitness Valid Upto",
                          "Tax Upto",
                          "Tax Paid Upto",
                          "Tax Valid Upto",
                          "PUCC Number",
                          "PUCC Upto",
                          "Permit Number",
                          "Permit Issue Date",
                          "Permit Valid From",
                          "Permit Valid Upto",
                          "Permit Type",
                          "National Permit Number",
                          "National Permit Upto",
                          "National Permit Issued By",
                          "Financed",
                          "Financier Name",
                          "Financer",
                          "Hypothecation Date",
                          "Chassis Number",
                          "Engine Number",
                          "Unladen Weight",
                          "Gross Weight",
                          "Vehicle Gross Weight",
                        ].includes(key),
                    )
                    .map(([key, value]) => (
                      <InfoRow key={key} label={key} value={String(value)} />
                    ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Specialized DL results display
  if (lookupType === "dl") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Driving License Details</CardTitle>
          <CardDescription>Driver's license information for {results["DL Number"]}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Personal Information Section */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-blue-600">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-4">
                {results["DL Number"] && <InfoRow label="DL Number" value={results["DL Number"]} highlight />}
                {results["Holder Name"] && <InfoRow label="Holder Name" value={results["Holder Name"]} highlight />}
                {results["Father's Name"] && <InfoRow label="Father's Name" value={results["Father's Name"]} />}
                {results["Date of Birth"] && <InfoRow label="Date of Birth" value={results["Date of Birth"]} />}
                {results["Blood Group"] && <InfoRow label="Blood Group" value={results["Blood Group"]} />}
                {results["Address"] && <InfoRow label="Address" value={results["Address"]} />}
              </div>
            </div>

            {/* License Validity Section */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-green-600">License Validity</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-4">
                {results["Issue Date"] && <InfoRow label="Issue Date" value={results["Issue Date"]} />}
                {results["Initial Issue Date"] && (
                  <InfoRow label="Initial Issue Date" value={results["Initial Issue Date"]} />
                )}
                {results["Valid From"] && <InfoRow label="Valid From" value={results["Valid From"]} />}
                {results["Valid Upto"] && <InfoRow label="Valid Upto" value={results["Valid Upto"]} />}
                {results["DL Status"] && <InfoRow label="DL Status" value={results["DL Status"]} />}
                {results["Last Transaction Date"] && (
                  <InfoRow label="Last Transaction Date" value={results["Last Transaction Date"]} />
                )}
              </div>
            </div>

            {/* Vehicle Classes Section */}
            {results["Vehicle Classes"] && (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-purple-600">Authorized Vehicle Classes</h3>
                <div className="grid grid-cols-1 gap-3 pl-4">
                  <InfoRow label="Vehicle Classes" value={results["Vehicle Classes"]} highlight />
                </div>
              </div>
            )}

            {/* Transport & Non-Transport Validity */}
            {(results["Transport Valid From"] ||
              results["Transport Valid Upto"] ||
              results["Non-Transport Valid From"] ||
              results["Non-Transport Valid Upto"]) && (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-orange-600">Category-wise Validity</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-4">
                  {results["Transport Valid From"] && (
                    <InfoRow label="Transport Valid From" value={results["Transport Valid From"]} />
                  )}
                  {results["Transport Valid Upto"] && (
                    <InfoRow label="Transport Valid Upto" value={results["Transport Valid Upto"]} />
                  )}
                  {results["Non-Transport Valid From"] && (
                    <InfoRow label="Non-Transport Valid From" value={results["Non-Transport Valid From"]} />
                  )}
                  {results["Non-Transport Valid Upto"] && (
                    <InfoRow label="Non-Transport Valid Upto" value={results["Non-Transport Valid Upto"]} />
                  )}
                </div>
              </div>
            )}

            {/* Additional Information */}
            {(results["Issuing RTO"] ||
              results["Badge Number"] ||
              results["Hazardous Valid Upto"] ||
              results["Hill Valid Upto"]) && (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-cyan-600">Additional Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-4">
                  {results["Issuing RTO"] && <InfoRow label="Issuing RTO" value={results["Issuing RTO"]} />}
                  {results["Badge Number"] && <InfoRow label="Badge Number" value={results["Badge Number"]} />}
                  {results["Hazardous Valid Upto"] && (
                    <InfoRow label="Hazardous Valid Upto" value={results["Hazardous Valid Upto"]} />
                  )}
                  {results["Hill Valid Upto"] && <InfoRow label="Hill Valid Upto" value={results["Hill Valid Upto"]} />}
                </div>
              </div>
            )}

            {/* Catch any remaining fields */}
            {Object.keys(results).filter(
              (key) =>
                ![
                  "DL Number",
                  "Holder Name",
                  "Father's Name",
                  "Date of Birth",
                  "Blood Group",
                  "Address",
                  "Issue Date",
                  "Initial Issue Date",
                  "Valid From",
                  "Valid Upto",
                  "DL Status",
                  "Last Transaction Date",
                  "Vehicle Classes",
                  "Transport Valid From",
                  "Transport Valid Upto",
                  "Non-Transport Valid From",
                  "Non-Transport Valid Upto",
                  "Issuing RTO",
                  "Badge Number",
                  "Hazardous Valid Upto",
                  "Hill Valid Upto",
                ].includes(key),
            ).length > 0 && (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-pink-600">Other Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-4">
                  {Object.entries(results)
                    .filter(
                      ([key]) =>
                        ![
                          "DL Number",
                          "Holder Name",
                          "Father's Name",
                          "Date of Birth",
                          "Blood Group",
                          "Address",
                          "Issue Date",
                          "Initial Issue Date",
                          "Valid From",
                          "Valid Upto",
                          "DL Status",
                          "Last Transaction Date",
                          "Vehicle Classes",
                          "Transport Valid From",
                          "Transport Valid Upto",
                          "Non-Transport Valid From",
                          "Non-Transport Valid Upto",
                          "Issuing RTO",
                          "Badge Number",
                          "Hazardous Valid Upto",
                          "Hill Valid Upto",
                        ].includes(key),
                    )
                    .map(([key, value]) => (
                      <InfoRow key={key} label={key} value={String(value)} />
                    ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Specialized RTO results display
  if (lookupType === "rto") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>RTO Details</CardTitle>
          <CardDescription>Regional Transport Office details for {results["RTO Code"]}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {results["RTO Code"] && <InfoRow label="RTO Code" value={results["RTO Code"]} highlight />}
            {results["RTO Name"] && <InfoRow label="RTO Name" value={results["RTO Name"]} />}
            {results["State"] && <InfoRow label="State" value={results["State"]} />}
            {results["City"] && <InfoRow label="City" value={results["City"]} />}
            {results["Address"] && <InfoRow label="Address" value={results["Address"]} />}
            {results["Contact"] && <InfoRow label="Contact" value={results["Contact"]} />}
            {results["Message"] && <InfoRow label="Note" value={results["Message"]} />}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (lookupType === "challan") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Challan Details</CardTitle>
          <CardDescription>Traffic violations and fines for {results["Vehicle Number"]}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Vehicle Number</p>
                <p className="text-xl font-bold text-blue-600">{results["Vehicle Number"]}</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Total Challans</p>
                <p className="text-xl font-bold text-orange-600">{results["Total Challans"]}</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-xl font-bold text-red-600">{results["Total Amount"]}</p>
              </div>
            </div>

            {results.Challans && results.Challans.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Challan Details</h3>
                {results.Challans.map((challan: any, index: number) => (
                  <Card key={index} className="border-l-4 border-l-red-500">
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {Object.entries(challan).map(([key, value]) => (
                          <InfoRow key={key} label={key} value={String(value)} />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {(!results.Challans || results.Challans.length === 0) && results["Total Challans"] === "0" && (
              <div className="text-center py-8 text-green-600">
                <p className="text-lg font-semibold">✓ No pending challans found</p>
                <p className="text-sm text-muted-foreground">This vehicle has a clean record</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Default display for other lookup types
  return (
    <Card>
      <CardHeader>
        <CardTitle>Results</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {Object.entries(results).map(([key, value]) => (
            <div key={key} className="flex justify-between items-start py-2 border-b last:border-0">
              <span className="font-medium capitalize">{key.replace(/([A-Z])/g, " $1").trim()}:</span>
              <span className="text-muted-foreground text-right max-w-md">
                {typeof value === "object" && value !== null ? (
                  <pre className="text-xs">{JSON.stringify(value, null, 2)}</pre>
                ) : typeof value === "boolean" ? (
                  <Badge variant={value ? "default" : "secondary"}>{value ? "Yes" : "No"}</Badge>
                ) : (
                  String(value)
                )}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex flex-col space-y-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`font-medium ${highlight ? "text-lg text-primary" : ""}`}>{value}</span>
    </div>
  )
}
