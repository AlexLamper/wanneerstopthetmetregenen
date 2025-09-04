"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, Cloud, CloudRain, Sun } from "lucide-react"

interface WeatherData {
  hourly: {
    time: string[]
    precipitation: number[]
  }
}

interface LocationData {
  latitude: number
  longitude: number
}

export default function RainForecastPage() {
  const [location, setLocation] = useState<LocationData | null>(null)
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)

  const getCurrentLocation = () => {
    setLoading(true)
    setLocationError(null)

    if (!navigator.geolocation) {
      setLocationError("Geolocatie wordt niet ondersteund door deze browser.")
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setLocation({ latitude, longitude })
        fetchWeatherData(latitude, longitude)
      },
      (error) => {
        setLocationError("Kon locatie niet bepalen. Controleer je locatie-instellingen.")
        setLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
    )
  }

  const fetchWeatherData = async (lat: number, lon: number) => {
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=precipitation&timezone=Europe/Amsterdam&forecast_days=3&model=harmonie_arome`,
      )

      if (!response.ok) {
        throw new Error("Kon weerdata niet ophalen")
      }

      const data = await response.json()
      setWeatherData(data)
      setError(null)
    } catch (err) {
      setError("Fout bij ophalen weerdata. Probeer opnieuw.")
    } finally {
      setLoading(false)
    }
  }

  const getRainStatus = () => {
    if (!weatherData) return null

    const now = new Date()
    const currentHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours())

    const hourlyData = weatherData.hourly.time.map((time, index) => ({
      time: new Date(time),
      precipitation: weatherData.hourly.precipitation[index],
    }))

    // Find current precipitation
    const currentIndex = hourlyData.findIndex((item) => item.time.getTime() === currentHour.getTime())

    if (currentIndex === -1) return null

    const currentPrecipitation = hourlyData[currentIndex]?.precipitation || 0
    const isCurrentlyRaining = currentPrecipitation > 0.1

    if (!isCurrentlyRaining) {
      return {
        message: "Het regent nu niet.",
        isRaining: false,
        nextHours: hourlyData.slice(currentIndex, currentIndex + 3),
      }
    }

    // Find when rain stops
    const futureData = hourlyData.slice(currentIndex + 1)
    const rainStopsIndex = futureData.findIndex((item) => item.precipitation <= 0.1)

    if (rainStopsIndex === -1) {
      const lastForecast = hourlyData[hourlyData.length - 1]
      return {
        message: `Het blijft regenen tot ${lastForecast.time.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}.`,
        isRaining: true,
        nextHours: hourlyData.slice(currentIndex, currentIndex + 3),
      }
    }

    const stopTime = futureData[rainStopsIndex].time
    return {
      message: `Het stopt met regenen om ${stopTime.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}.`,
      isRaining: true,
      nextHours: hourlyData.slice(currentIndex, currentIndex + 3),
    }
  }

  const rainStatus = getRainStatus()

  const getIntensityColor = (precipitation: number) => {
    if (precipitation <= 0.1) return "bg-gray-200"
    if (precipitation <= 0.5) return "bg-blue-200"
    if (precipitation <= 2.0) return "bg-blue-400"
    if (precipitation <= 5.0) return "bg-blue-600"
    return "bg-blue-800"
  }

  const getIntensityLabel = (precipitation: number) => {
    if (precipitation <= 0.1) return "Droog"
    if (precipitation <= 0.5) return "Lichte regen"
    if (precipitation <= 2.0) return "Matige regen"
    if (precipitation <= 5.0) return "Zware regen"
    return "Zeer zware regen"
  }

  useEffect(() => {
    getCurrentLocation()
  }, [])

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 p-4" itemScope itemType="https://schema.org/WebPage">
      <article className="max-w-md mx-auto pt-8" itemScope itemType="https://schema.org/Article">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-slate-800 mb-2" itemProp="headline">Wanneer stopt het met regenen?</h1>
        </header>

        <Card className="p-6 mb-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg" aria-label="Regenvoorspelling kaart">
          {loading && (
            <section className="text-center py-8" aria-live="polite">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" aria-label="Laden"></div>
              <p className="text-slate-600">Locatie bepalen en weerdata ophalen...</p>
            </section>
          )}

          {locationError && (
            <section className="text-center py-6" aria-live="polite">
              <MapPin className="h-8 w-8 text-slate-400 mx-auto mb-4" aria-label="Locatie fout" />
              <p className="text-slate-600 mb-4">{locationError}</p>
              <Button onClick={getCurrentLocation} variant="outline">
                Probeer opnieuw
              </Button>
            </section>
          )}

          {error && (
            <section className="text-center py-6" aria-live="polite">
              <Cloud className="h-8 w-8 text-slate-400 mx-auto mb-4" aria-label="Weerdata fout" />
              <p className="text-slate-600 mb-4">{error}</p>
              <Button
                onClick={() => location && fetchWeatherData(location.latitude, location.longitude)}
                variant="outline"
              >
                Opnieuw laden
              </Button>
            </section>
          )}

          {rainStatus && (
            <section className="text-center" aria-live="polite">
              <div className="mb-6">
                {rainStatus.isRaining ? (
                  <CloudRain className="h-12 w-12 text-blue-600 mx-auto mb-4" aria-label="Het regent" />
                ) : (
                  <Sun className="h-12 w-12 text-yellow-500 mx-auto mb-4" aria-label="Het is droog" />
                )}
                <p className="text-xl font-semibold text-slate-800 mb-2" itemProp="about">{rainStatus.message}</p>
              </div>

              {rainStatus.nextHours && rainStatus.nextHours.length > 0 && (
                <section className="mt-6" aria-label="Regenintensiteit komende uren">
                  <h2 className="text-base font-semibold text-slate-700 mb-3">Regenintensiteit komende uren</h2>
                  <div className="space-y-2">
                    {rainStatus.nextHours.map((hour, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="text-slate-600 w-16">
                          {hour.time.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <div className="flex-1 mx-3">
                          <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${getIntensityColor(hour.precipitation)} transition-all duration-300`}
                              style={{ width: `${Math.min(100, (hour.precipitation / 5) * 100)}%` }}
                              aria-label={`Regenintensiteit: ${getIntensityLabel(hour.precipitation)}`}
                            />
                          </div>
                        </div>
                        <span className="text-slate-500 text-xs w-20 text-right">
                          {getIntensityLabel(hour.precipitation)}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </section>
          )}
        </Card>

        <footer className="text-center text-xs text-slate-500 mt-8" aria-label="Bronvermelding">
          <p>Data van <a href="https://www.knmi.nl" target="_blank" rel="noopener" className="underline">KNMI HARMONIE-AROME</a> model via <a href="https://open-meteo.com" target="_blank" rel="noopener" className="underline">Open-Meteo</a></p>
          <p className="mt-1">Nauwkeurigheid: ~2km resolutie, uurlijkse updates</p>
        </footer>
      </article>
    </main>
  )
}
