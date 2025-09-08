"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { MapPin, CloudRain, Sun } from "lucide-react";

interface OpenMeteoHourly {
  time: string[];
  rain?: number[];
}

interface OpenMeteoResponse {
  hourly?: OpenMeteoHourly;
}

export interface TimelinePoint {
  time: Date;
  value: number;
}

type Status =
  | { kind: "idle" }
  | { kind: "locating" }
  | { kind: "loading"; coords: { lat: number; lon: number } }
  | { kind: "ready"; message: string; points: TimelinePoint[]; isRaining: boolean }
  | { kind: "error"; message: string };

const NL_TZ = "Europe/Amsterdam";
const DEFAULT_COORDS = { lat: 52.3676, lon: 4.9041 };
const RAIN_EPS = 0.05;

function RainTimeline({ points }: { points: TimelinePoint[] }) {
  const wanted = 6;
  const pts: TimelinePoint[] = (() => {
    if (!points || points.length === 0) return [];
    const copy = points.slice(0, wanted);
    if (copy.length >= wanted) return copy;
    const last = copy[copy.length - 1] ?? { time: new Date(), value: 0 };
    const arr = [...copy];
    for (let i = copy.length; i < wanted; i++) {
      arr.push({ time: new Date(last.time.getTime() + 60 * 60 * 1000 * (i - copy.length + 1)), value: 0 });
    }
    return arr;
  })();

  const max = Math.max(0.2, ...pts.map((p) => p.value));

  return (
    <div className="w-full">
      <div className="relative mb-2">
        <div className="absolute inset-x-0 top-0 h-full flex flex-col justify-between pointer-events-none">
          {[0, 0.25, 0.5, 0.75, 1].map((s, i) => (
            <div key={i} className="border-t border-dashed border-border/30 h-0" />
          ))}
        </div>
      </div>

      <div className="flex items-end gap-2 sm:gap-3 h-20 sm:h-28">
        {pts.map((p, idx) => {
          const ratio = Math.min(1, p.value / max);
          const minH = 6;
          const height = minH + ratio * (window?.innerWidth && window.innerWidth < 640 ? 68 : 96);
          const intensity = Math.min(1, 0.2 + ratio * 0.8);
          const hour = p.time.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });
          const isZero = p.value <= RAIN_EPS;

          return (
            <div key={idx} className="flex flex-col items-center justify-end flex-1 min-w-[0]">
              <div className="mb-2 h-5 sm:h-6 text-xs text-muted-foreground">
                {!isZero ? `${p.value.toFixed(1)} mm/u` : ""}
              </div>

              <div
                role="img"
                aria-label={`${hour}: ${p.value.toFixed(1)} mm per uur`}
                title={`${hour}: ${p.value.toFixed(1)} mm/u`}
                className="w-full rounded-xl timeline-bar transition-all duration-300"
                style={{
                  height,
                  background: isZero
                    ? 'linear-gradient(180deg, rgba(14,165,233,0.05) 0%, rgba(14,165,233,0.01) 100%)'
                    : `linear-gradient(180deg, rgba(14,165,233,${0.9 * intensity}) 0%, rgba(7,89,133,${0.9 * intensity}) 100%)`,
                  boxShadow: isZero ? 'none' : `0 6px 16px rgba(14,165,233,${0.05 + ratio * 0.1})`,
                  border: isZero ? '1px solid rgba(125,138,151,0.06)' : `1px solid rgba(14,165,233,${0.12 + ratio * 0.1})`,
                }}
              />

              <span className="mt-2 sm:mt-3 text-[11px] sm:text-sm text-muted-foreground tabular-nums">{hour}</span>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground">Max: {max.toFixed(1)} mm/u</div>
        <div className="text-sm text-muted-foreground text-center">
          <span className="inline-flex items-center gap-3">
            <span className="inline-flex flex-col items-center text-xs">
              <span className="h-3 w-6 rounded-full" style={{ background: 'linear-gradient(90deg, rgba(14,165,233,0.2), rgba(7,89,133,0.2))' }} />
              <span className="mt-1">Licht</span>
            </span>
            <span className="inline-flex flex-col items-center text-xs">
              <span className="h-3 w-6 rounded-full" style={{ background: 'linear-gradient(90deg, rgba(14,165,233,0.5), rgba(7,89,133,0.5))' }} />
              <span className="mt-1">Matig</span>
            </span>
            <span className="inline-flex flex-col items-center text-xs">
              <span className="h-3 w-6 rounded-full" style={{ background: 'linear-gradient(90deg, rgba(14,165,233,1), rgba(7,89,133,1))' }} />
              <span className="mt-1">Zwaar</span>
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}

export default function Index() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  useEffect(() => {
    setStatus({ kind: "locating" });
    const onSuccess = (pos: GeolocationPosition) => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      void fetchRain({ lat, lon });
    };
    const onError = () => {
      void fetchRain(DEFAULT_COORDS);
    };
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(onSuccess, onError, {
        enableHighAccuracy: true,
        maximumAge: 60_000,
        timeout: 10_000,
      });
    } else {
      void fetchRain(DEFAULT_COORDS);
    }
  }, []);

  const fetchRain = async ({ lat, lon }: { lat: number; lon: number }) => {
    setStatus({ kind: "loading", coords: { lat, lon } });
    try {
      const url = new URL("https://api.open-meteo.com/v1/forecast");
      url.searchParams.set("latitude", String(lat));
      url.searchParams.set("longitude", String(lon));
      url.searchParams.set("hourly", "rain");
      url.searchParams.set("timezone", NL_TZ);
      url.searchParams.set("forecast_days", "3");
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Netwerkfout bij ophalen weerdata");
      const data = (await res.json()) as OpenMeteoResponse;
      const hourly = data.hourly;
      if (!hourly || !hourly.time || !hourly.rain) throw new Error("Onvolledige weerdata ontvangen");

      const times = hourly.time.map((t) => new Date(t));
      const values = hourly.rain;

      const now = new Date();
      const nowHour = new Date(now);
      nowHour.setMinutes(0, 0, 0);

      let idx = times.findIndex((t) => t.getTime() >= nowHour.getTime());
      if (idx === -1) idx = 0;

      const isRainingNow = values[idx] > RAIN_EPS;
      const stopIdx = values.slice(idx).findIndex((v) => v <= RAIN_EPS);
      const lastForecastIdx = times.length - 1;

      let message = "";
      if (isRainingNow) {
        if (stopIdx === -1) {
          const last = times[lastForecastIdx];
          const timeStr = formatTime(last);
          message = `Het blijft regenen tot ${timeStr}.`;
        } else if (stopIdx === 0) {
          const t = times[idx];
          message = `Het stopt met regenen om ${formatTime(t)}.`;
        } else {
          const t = times[idx + stopIdx];
          message = `Het stopt met regenen om ${formatTime(t)}.`;
        }
      } else {
        message = "Het regent nu niet.";
      }

      const previewPoints: TimelinePoint[] = times.slice(idx, idx + 3).map((t, i) => ({
        time: t,
        value: values[idx + i] ?? 0,
      }));

      setStatus({ kind: "ready", message, points: previewPoints, isRaining: isRainingNow });
    } catch (e) {
      setStatus({ kind: "error", message: e instanceof Error ? e.message : "Onbekende fout" });
    }
  };

  const subtitle = useMemo(() => {
    if (status.kind === "loading") return "Data laden...";
    if (status.kind === "locating") return "Locatie bepalen...";
    return "";
  }, [status]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-start justify-center">
      <main className="px-6 w-full">
        <section className="max-w-screen-sm mx-auto py-12 sm:py-20 flex items-center justify-center">
          <div className="rounded-2xl p-6 sm:p-8 bg-card/60 backdrop-blur border border-border shadow-sm card-surface text-center w-full">
            <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-lg border border-border bg-card/40">
              {status.kind === "ready" ? (
                status.isRaining ? (
                  <CloudRain className="h-8 w-8 text-[hsl(var(--brand-600))]" aria-hidden />
                ) : (
                  <Sun className="h-8 w-8 text-amber-400" aria-hidden />
                )
              ) : (
                <MapPin className="h-6 w-6 text-[hsl(var(--brand-600))] animate-pulse" aria-hidden />
              )}
            </div>

            <p className="text-sm text-muted-foreground mb-1">{subtitle}</p>
            <h2
              className={`mt-1 font-bold tracking-tight ${
                status.kind === "ready"
                  ? "text-3xl sm:text-5xl animate-fade-up"
                  : "text-2xl sm:text-4xl"
              }`}
            >
              {status.kind === "ready"
                ? status.message
                : status.kind === "error"
                ? status.message
                : ""}
            </h2>

            {status.kind !== "ready" && status.kind !== "error" && (
              <div className="mt-6 h-6 w-40 rounded-md bg-muted animate-pulse mx-auto" />
            )}

            {status.kind === "ready" && (
              <div className="mt-8">
                <h3 className="text-sm font-medium text-muted-foreground mb-4">Komende uren</h3>
                <RainTimeline points={status.points} />
              </div>
            )}

            {status.kind === "error" && (
              <p className="mt-6 text-sm text-destructive-foreground">Kon voorspelling niet laden. Probeer opnieuw.</p>
            )}

            <p className="mt-8 text-[11px] text-muted-foreground leading-relaxed">
              Bron: Open‑Meteo (uurdata, regen in mm/uur, tijdzone Europe/Amsterdam). Voorspelling ~3 dagen. Alleen bij laden wordt
              data opgehaald voor snelle prestaties.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

function formatTime(d: Date) {
  return new Intl.DateTimeFormat("nl-NL", { hour: "2-digit", minute: "2-digit" }).format(d);
}
