"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Circle, GeoJSON, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import type { ThreatVector } from "@/types/site-risk";

// ── Helpers ───────────────────────────────────────────────────────────────────

// MODIS_Terra_NDVI_8Day lags ~2 weeks; recent dates 502 until processed.
function ndviDateFor(base?: string): string {
  const d = base ? new Date(base) : new Date();
  d.setDate(d.getDate() - 14);
  return d.toISOString().slice(0, 10);
}

function compassDir(deg: number): string {
  return ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][Math.round(deg / 45) % 8];
}

// ── Layer toggle pill ─────────────────────────────────────────────────────────

function LayerToggle({
  label, active, color, onClick,
}: { label: string; active: boolean; color: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "3px 7px", borderRadius: 5, border: "none", cursor: "pointer",
        background: active ? "rgba(99,102,241,0.06)" : "transparent",
        transition: "background 0.15s", width: "100%", textAlign: "left",
      }}
    >
      <span style={{
        width: 9, height: 9, borderRadius: 3, flexShrink: 0,
        background: active ? color : "transparent",
        border: active ? `1px solid ${color}` : "1px solid #cbd5e1",
        transition: "all 0.15s",
      }} />
      <span style={{
        fontSize: 9, fontWeight: 700, letterSpacing: "0.02em",
        color: active ? "#1e293b" : "#94a3b8",
      }}>
        {label}
      </span>
    </button>
  );
}

// ── Wind particle canvas overlay ──────────────────────────────────────────────

interface WindData { speed: number; direction: number }

function WindParticles({ wind }: { wind: WindData }) {
  const map = useMap();

  useEffect(() => {
    // FROM direction → TO direction that particles move
    const toRad = ((wind.direction + 180) % 360) * (Math.PI / 180);
    const dx = Math.sin(toRad);
    const dy = -Math.cos(toRad); // canvas y is inverted

    const baseSpeed = Math.max(wind.speed / 20, 0.15) * 3.5;

    const mapSize = map.getSize();
    const canvas = document.createElement("canvas");
    canvas.width  = mapSize.x;
    canvas.height = mapSize.y;
    canvas.style.cssText =
      "position:absolute;top:0;left:0;pointer-events:none;z-index:350;";

    const pane = map.getPanes().overlayPane;
    pane.appendChild(canvas);
    const ctx = canvas.getContext("2d")!;

    // Particle pool
    const N = 160;
    const particles = Array.from({ length: N }, () => ({
      x:     Math.random() * canvas.width,
      y:     Math.random() * canvas.height,
      age:   Math.floor(Math.random() * 80),
      life:  50 + Math.random() * 60,
      speed: (0.5 + Math.random() * 0.9) * baseSpeed,
    }));

    let raf: number;
    const draw = () => {
      // Erase trails (destination-out) instead of painting black, so the
      // basemap stays visible underneath while particle tails fade out.
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(0,0,0,0.10)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = "source-over";

      for (const p of particles) {
        p.age++;
        if (p.age > p.life) {
          p.x = Math.random() * canvas.width;
          p.y = Math.random() * canvas.height;
          p.age = 0;
          p.life = 50 + Math.random() * 60;
          p.speed = (0.5 + Math.random() * 0.9) * baseSpeed;
        }
        const px = p.x;
        const py = p.y;
        p.x += dx * p.speed;
        p.y += dy * p.speed;
        // Wrap edges
        if (p.x < -4) p.x = canvas.width + 4;
        if (p.x > canvas.width + 4) p.x = -4;
        if (p.y < -4) p.y = canvas.height + 4;
        if (p.y > canvas.height + 4) p.y = -4;

        const fadeIn  = Math.min(p.age / 10, 1);
        const fadeOut = Math.min((p.life - p.age) / 14, 1);
        const alpha   = fadeIn * fadeOut * 0.7;

        // Color: blue (slow) → green → yellow → red (fast), brighter on dark bg
        const norm = Math.min(p.speed / (baseSpeed * 1.4), 1);
        const h = 240 - norm * 240;
        ctx.strokeStyle = `hsla(${h},90%,65%,${alpha})`;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      }
      raf = requestAnimationFrame(draw);
    };
    draw();

    const onMoveStart = () => ctx.clearRect(0, 0, canvas.width, canvas.height);
    map.on("movestart zoomstart", onMoveStart);

    return () => {
      cancelAnimationFrame(raf);
      map.off("movestart zoomstart", onMoveStart);
      if (pane.contains(canvas)) pane.removeChild(canvas);
    };
  }, [map, wind.speed, wind.direction]);

  return null;
}

// ── Cinematic entry zoom ──────────────────────────────────────────────────────

function CinematicEntry({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 5, { animate: false });
    const t1 = setTimeout(() => map.flyTo([lat, lng], 9,  { duration: 1.5, easeLinearity: 0.5 }), 150);
    const t2 = setTimeout(() => map.flyTo([lat, lng], 13, { duration: 2.2, easeLinearity: 0.4 }), 2100);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [lat, lng, map]);
  return null;
}

// ── Pulsing site marker ───────────────────────────────────────────────────────

function SiteMarker({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    const icon = L.divIcon({
      className: "",
      html: `<div style="position:relative;width:16px;height:16px">
        <div style="position:absolute;inset:0;border-radius:50%;background:#6366f1;animation:srPulse 2s ease-out infinite;opacity:0.6"></div>
        <div style="position:absolute;inset:3px;border-radius:50%;background:#6366f1;border:2px solid #fff;box-shadow:0 2px 8px rgba(99,102,241,0.6)"></div>
      </div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
    const m = L.marker([lat, lng], { icon }).addTo(map);
    return () => { m.remove(); };
  }, [lat, lng, map]);
  return null;
}

// ── Zoom out to frame fire + site ─────────────────────────────────────────────

function ThreatReveal({ tv, siteLat, siteLng }: { tv: ThreatVector; siteLat: number; siteLng: number }) {
  const map = useMap();
  useEffect(() => {
    const bounds = L.latLngBounds([[siteLat, siteLng], [tv.fire_lat, tv.fire_lng]]);
    const t = setTimeout(() => map.fitBounds(bounds.pad(0.25), { animate: true, duration: 2.0 }), 350);
    return () => clearTimeout(t);
  }, [tv, siteLat, siteLng, map]);
  return null;
}

// ── Animated threat cone ──────────────────────────────────────────────────────

function AnimatedThreatCone({ tv, siteLat, siteLng }: { tv: ThreatVector; siteLat: number; siteLng: number }) {
  const map = useMap();
  useEffect(() => {
    const svgNS = "http://www.w3.org/2000/svg";
    const build = (): SVGSVGElement | null => {
      const fp = map.latLngToLayerPoint([tv.fire_lat, tv.fire_lng]);
      const sp = map.latLngToLayerPoint([siteLat, siteLng]);
      const dx = sp.x - fp.x, dy = sp.y - fp.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len < 2) return null;

      const half = Math.min(Math.max(Math.PI / 12, ((tv.alignment_deg ?? 45) / 75) * (Math.PI / 4)), Math.PI / 4);
      const nx = dx / len, ny = dy / len;
      const s = len * Math.tan(half);
      const px = -ny * s, py = nx * s;
      const p1 = { x: sp.x + px, y: sp.y + py };
      const p2 = { x: sp.x - px, y: sp.y - py };

      const svg = document.createElementNS(svgNS, "svg");
      svg.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:400;overflow:visible;";

      const defs = document.createElementNS(svgNS, "defs");
      const mkr = document.createElementNS(svgNS, "marker");
      mkr.setAttribute("id", "srArrow"); mkr.setAttribute("markerWidth", "8");
      mkr.setAttribute("markerHeight", "6"); mkr.setAttribute("refX", "8");
      mkr.setAttribute("refY", "3"); mkr.setAttribute("orient", "auto");
      const ap = document.createElementNS(svgNS, "polygon");
      ap.setAttribute("points", "0 0, 8 3, 0 6"); ap.setAttribute("fill", "#dc2626");
      mkr.appendChild(ap); defs.appendChild(mkr); svg.appendChild(defs);

      const cone = document.createElementNS(svgNS, "polygon");
      cone.setAttribute("points", `${fp.x},${fp.y} ${p1.x},${p1.y} ${p2.x},${p2.y}`);
      cone.setAttribute("fill", "#f97316"); cone.setAttribute("fill-opacity", "0.10");
      cone.setAttribute("stroke", "#ea580c"); cone.setAttribute("stroke-width", "1");
      cone.setAttribute("stroke-opacity", "0.35"); cone.setAttribute("stroke-dasharray", "5 4");
      svg.appendChild(cone);

      const arrow = document.createElementNS(svgNS, "line");
      arrow.setAttribute("x1", String(fp.x)); arrow.setAttribute("y1", String(fp.y));
      arrow.setAttribute("x2", String(sp.x)); arrow.setAttribute("y2", String(sp.y));
      arrow.setAttribute("stroke", "#dc2626"); arrow.setAttribute("stroke-width", "2");
      arrow.setAttribute("stroke-dasharray", "10 7"); arrow.setAttribute("stroke-opacity", "0.85");
      arrow.setAttribute("marker-end", "url(#srArrow)");
      arrow.style.animation = "srWindFlow 0.85s linear infinite";
      svg.appendChild(arrow);

      const glow = document.createElementNS(svgNS, "circle");
      glow.setAttribute("cx", String(fp.x)); glow.setAttribute("cy", String(fp.y));
      glow.setAttribute("r", "6"); glow.setAttribute("fill", "#ef4444"); glow.setAttribute("fill-opacity", "0.15");
      const ar = document.createElementNS(svgNS, "animate");
      ar.setAttribute("attributeName", "r"); ar.setAttribute("values", "6;14;6");
      ar.setAttribute("dur", "1.8s"); ar.setAttribute("repeatCount", "indefinite");
      glow.appendChild(ar);
      const ao = document.createElementNS(svgNS, "animate");
      ao.setAttribute("attributeName", "fill-opacity"); ao.setAttribute("values", "0.12;0.35;0.12");
      ao.setAttribute("dur", "1.8s"); ao.setAttribute("repeatCount", "indefinite");
      glow.appendChild(ao); svg.appendChild(glow);

      const dot = document.createElementNS(svgNS, "circle");
      dot.setAttribute("cx", String(fp.x)); dot.setAttribute("cy", String(fp.y));
      dot.setAttribute("r", "4"); dot.setAttribute("fill", "#ef4444"); dot.setAttribute("fill-opacity", "0.95");
      svg.appendChild(dot);
      return svg;
    };

    const pane = map.getPanes().overlayPane;
    let cur: SVGSVGElement | null = build();
    if (cur) pane.appendChild(cur);
    const redraw = () => {
      if (cur && pane.contains(cur)) pane.removeChild(cur);
      cur = build(); if (cur) pane.appendChild(cur);
    };
    map.on("zoom move viewreset", redraw);
    return () => {
      map.off("zoom move viewreset", redraw);
      if (cur && pane.contains(cur)) pane.removeChild(cur);
    };
  }, [map, tv, siteLat, siteLng]);
  return null;
}

// ── Exported component ────────────────────────────────────────────────────────

interface Props {
  lat: number;
  lng: number;
  threatVector?: ThreatVector;
  fireGeoJSON?: unknown;
  fireResultArrived?: boolean;
  ndviDate?: string; // pin NDVI to a snapshot's capture date
}

export default function SiteRiskMap({ lat, lng, threatVector, fireGeoJSON, fireResultArrived, ndviDate }: Props) {
  const NDVI_DATE = ndviDateFor(ndviDate);
  const [ndviVisible, setNdviVisible] = useState(false);
  const [windVisible, setWindVisible] = useState(true);
  const [darkBasemap, setDarkBasemap] = useState(true);
  const [coneVisible, setConeVisible] = useState(true);
  const [wind, setWind] = useState<WindData | null>(null);

  // Fetch live wind from Open-Meteo (free, no key)
  useEffect(() => {
    const ctrl = new AbortController();
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=wind_speed_10m,wind_direction_10m&wind_speed_unit=kmh`,
      { signal: ctrl.signal }
    )
      .then(r => r.json())
      .then(d => setWind({ speed: d.current.wind_speed_10m, direction: d.current.wind_direction_10m }))
      .catch(() => {});
    return () => ctrl.abort();
  }, [lat, lng]);

  // Auto-enable NDVI when wildfire agent result arrives
  useEffect(() => {
    if (fireResultArrived) setNdviVisible(true);
  }, [fireResultArrived]);

  // Use threat_vector wind if available (more precise), else Open-Meteo
  const displayWind: WindData | null = threatVector
    ? { speed: threatVector.wind_speed_kmh, direction: threatVector.wind_from_deg }
    : wind;

  return (
    <div style={{ position: "relative", height: "100%", width: "100%" }}>
      <style>{`
        @keyframes srPulse {
          0%  { transform:scale(1);   opacity:0.6; }
          70% { transform:scale(2.6); opacity:0;   }
          100%{ transform:scale(1);   opacity:0;   }
        }
        @keyframes srWindFlow {
          from { stroke-dashoffset:0;   }
          to   { stroke-dashoffset:-34; }
        }
        .sr-map .leaflet-control-attribution { font-size:7px!important; opacity:0.4; }
      `}</style>

      <MapContainer
        center={[lat, lng]}
        zoom={5}
        className="sr-map"
        style={{ height: "100%", width: "100%", borderRadius: "8px" }}
        zoomControl={false}
        scrollWheelZoom={false}
      >
        {/* Dark Matter makes the wind particles glow; Voyager is the clean light map */}
        <TileLayer
          key={darkBasemap ? "dark" : "light"}
          url={
            darkBasemap
              ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          }
          subdomains="abcd"
          attribution="&copy; CARTO"
          maxZoom={20}
        />

        {ndviVisible && (
          <TileLayer
            key={NDVI_DATE}
            url={`https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_NDVI_8Day/default/${NDVI_DATE}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.png`}
            attribution="MODIS NDVI &copy; NASA GIBS"
            opacity={0.7}
            maxNativeZoom={9}
            maxZoom={20}
          />
        )}

        <CinematicEntry lat={lat} lng={lng} />
        <SiteMarker lat={lat} lng={lng} />

        {/* Wind particle animation — renders as soon as wind data arrives */}
        {windVisible && displayWind && <WindParticles wind={displayWind} />}

        {!!threatVector && (
          <>
            <ThreatReveal tv={threatVector} siteLat={lat} siteLng={lng} />
            {coneVisible && <AnimatedThreatCone tv={threatVector} siteLat={lat} siteLng={lng} />}
            {coneVisible && (
              <Circle
                center={[threatVector.fire_lat, threatVector.fire_lng]}
                radius={900}
                pathOptions={{ color: "#ef4444", fillColor: "#ef4444", fillOpacity: 0, weight: 1.5, dashArray: "4 4" }}
              />
            )}
          </>
        )}

        {!!fireGeoJSON && (
          <GeoJSON
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data={fireGeoJSON as any}
            style={{ color: "#dc2626", fillColor: "#ef4444", fillOpacity: 0.15, weight: 1.5 }}
          />
        )}
      </MapContainer>

      {/* Layer controls */}
      <div style={{
        position: "absolute", top: 8, right: 8, zIndex: 1000,
        display: "flex", flexDirection: "column", gap: 4,
        background: "rgba(255,255,255,0.92)", border: "1px solid #e2e8f0",
        borderRadius: 7, padding: 5, boxShadow: "0 1px 6px rgba(0,0,0,0.14)",
        backdropFilter: "blur(6px)",
      }}>
        <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: "0.12em", color: "#94a3b8", padding: "1px 2px 2px" }}>
          LAYERS
        </div>
        <LayerToggle label="Wind" active={windVisible} color="#6366f1" onClick={() => setWindVisible(v => !v)} />
        <LayerToggle label="NDVI" active={ndviVisible} color="#16a34a" onClick={() => setNdviVisible(v => !v)} />
        <LayerToggle label="Dark map" active={darkBasemap} color="#334155" onClick={() => setDarkBasemap(v => !v)} />
        {!!threatVector && (
          <LayerToggle label="Fire cone" active={coneVisible} color="#dc2626" onClick={() => setConeVisible(v => !v)} />
        )}
      </div>

      {/* Wind compass — shows as soon as wind data arrives */}
      {!!displayWind && (
        <div style={{
          position: "absolute", top: 8, left: 8, zIndex: 1000,
          background: "rgba(255,255,255,0.92)", border: "1px solid #e2e8f0",
          borderRadius: 6, padding: "5px 8px", boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
          backdropFilter: "blur(4px)", display: "flex", alignItems: "center", gap: 7,
        }}>
          <div style={{ position: "relative", width: 20, height: 20, flexShrink: 0 }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "1.5px solid #e2e8f0" }} />
            <div style={{
              position: "absolute", bottom: "50%", left: "calc(50% - 1px)",
              width: 2, height: 8, borderRadius: 1,
              background: "linear-gradient(to top, #94a3b8, #6366f1)",
              transformOrigin: "bottom center",
              transform: `rotate(${displayWind.direction}deg)`,
            }} />
            <div style={{
              position: "absolute", top: "50%", left: "50%",
              width: 3, height: 3, borderRadius: "50%",
              background: "#64748b", transform: "translate(-50%,-50%)",
            }} />
          </div>
          <div>
            <div style={{ fontSize: 9, fontWeight: 800, color: "#6366f1", lineHeight: 1.2 }}>
              {compassDir(displayWind.direction)} {displayWind.speed} km/h
            </div>
            <div style={{ fontSize: 7.5, color: "#94a3b8", fontWeight: 500 }}>
              {threatVector ? `fire ${threatVector.distance_km} km upwind` : "live wind"}
            </div>
          </div>
        </div>
      )}

      {/* Threat banner */}
      {!!threatVector && threatVector.est_hours != null && (
        <div style={{
          position: "absolute", bottom: 8, left: 8, right: 8, zIndex: 1000,
          display: "flex", alignItems: "center", gap: 5,
          background: "rgba(255,255,255,0.94)", border: "1px solid #fecaca",
          borderRadius: 6, padding: "4px 8px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)", backdropFilter: "blur(4px)",
          fontSize: 8.5, color: "#b91c1c", fontWeight: 600,
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: "50%", background: "#ef4444", flexShrink: 0,
            animation: "srPulse 1.8s ease-out infinite",
          }} />
          Estimated arrival <strong style={{ margin: "0 2px" }}>~{threatVector.est_hours}h</strong>
          at current spread · {threatVector.spread_rate_kmh?.toFixed(1) ?? "—"} km/h
        </div>
      )}
    </div>
  );
}
