"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MapPin, Edit } from "lucide-react"

interface IPLocationMapProps {
  latitude: number
  longitude: number
  ipAddress: string
  city: string
  country: string
}

export default function IPLocationMap({ latitude, longitude, ipAddress, city, country }: IPLocationMapProps) {
  const [customLat, setCustomLat] = useState(latitude.toString())
  const [customLon, setCustomLon] = useState(longitude.toString())
  const [showManualInput, setShowManualInput] = useState(false)
  const [mapKey, setMapKey] = useState(0)

  const currentLat = Number.parseFloat(customLat) || latitude
  const currentLon = Number.parseFloat(customLon) || longitude

  // Using Google Maps Embed API
  const mapUrl = `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${currentLat},${currentLon}&zoom=10`

  const handleUpdateLocation = () => {
    setMapKey((prev) => prev + 1)
    setShowManualInput(false)
  }

  const handleReset = () => {
    setCustomLat(latitude.toString())
    setCustomLon(longitude.toString())
    setMapKey((prev) => prev + 1)
    setShowManualInput(false)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>IP Location Map</CardTitle>
            <CardDescription>
              Geolocation for {ipAddress} - {city}, {country}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowManualInput(!showManualInput)}
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Manual Input
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Manual Coordinate Input */}
        {showManualInput && (
          <div className="bg-muted p-4 rounded-lg space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Manual Coordinate Input
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="0.000001"
                  value={customLat}
                  onChange={(e) => setCustomLat(e.target.value)}
                  placeholder="Enter latitude"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="0.000001"
                  value={customLon}
                  onChange={(e) => setCustomLon(e.target.value)}
                  placeholder="Enter longitude"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleUpdateLocation} size="sm">
                Update Map
              </Button>
              <Button onClick={handleReset} variant="outline" size="sm">
                Reset to Auto
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Use this if automatic geolocation is inaccurate or unavailable
            </p>
          </div>
        )}

        {/* Current Coordinates Display */}
        <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
          <p className="text-sm font-medium">Current Coordinates</p>
          <p className="text-sm text-muted-foreground">
            Latitude: {currentLat.toFixed(6)}, Longitude: {currentLon.toFixed(6)}
          </p>
        </div>

        {/* Google Map Display */}
        <div className="h-96 w-full rounded-lg overflow-hidden border">
          <iframe
            key={mapKey}
            src={mapUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={`Map for ${ipAddress}`}
          />
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Powered by Google Maps • Click "Manual Input" to adjust coordinates if needed
        </p>
      </CardContent>
    </Card>
  )
}
