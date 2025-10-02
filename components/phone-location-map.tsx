"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, MapPin } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface PhoneLocationMapProps {
  locations: {
    hometown?: string
    mobileLocation?: string
    referenceCity?: string
    towerLocation?: string
    address?: string
    state?: string
  }
  phoneNumber: string
}

export default function PhoneLocationMap({ locations, phoneNumber }: PhoneLocationMapProps) {
  const [activeLocation, setActiveLocation] = useState<string>("")
  const [mapUrl, setMapUrl] = useState<string>("")
  const [loading, setLoading] = useState(false)

  // Filter out undefined/null locations
  const availableLocations = Object.entries(locations)
    .filter(([_, value]) => value && value.trim() !== "")
    .map(([key, value]) => ({
      key,
      label: key
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (str) => str.toUpperCase())
        .trim(),
      value: value as string,
    }))

  useEffect(() => {
    if (availableLocations.length > 0 && !activeLocation) {
      setActiveLocation(availableLocations[0].key)
    }
  }, [availableLocations, activeLocation])

  useEffect(() => {
    if (activeLocation) {
      const location = availableLocations.find((loc) => loc.key === activeLocation)
      if (location) {
        loadMap(location.value)
      }
    }
  }, [activeLocation, availableLocations])

  const loadMap = (locationQuery: string) => {
    setLoading(true)
    // Using Google Maps Embed API
    const encodedLocation = encodeURIComponent(locationQuery)
    const url = `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodedLocation}&zoom=12`
    setMapUrl(url)
    setLoading(false)
  }

  if (availableLocations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Location Map</CardTitle>
          <CardDescription>No location data available</CardDescription>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
          <p>No location information found for this phone number</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Location Map</CardTitle>
        <CardDescription>Multiple locations associated with {phoneNumber}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Location Tabs */}
        <Tabs value={activeLocation} onValueChange={setActiveLocation} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            {availableLocations.map((location) => (
              <TabsTrigger key={location.key} value={location.key} className="text-xs">
                <MapPin className="h-3 w-3 mr-1" />
                {location.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {availableLocations.map((location) => (
            <TabsContent key={location.key} value={location.key} className="space-y-2">
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm font-medium">{location.label}</p>
                <p className="text-sm text-muted-foreground">{location.value}</p>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Map Display */}
        <div className="relative h-96 w-full rounded-lg overflow-hidden border">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <iframe
              src={mapUrl}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={`Map for ${activeLocation}`}
            />
          )}
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Switch between tabs to view different locations associated with this phone number
        </p>
      </CardContent>
    </Card>
  )
}
