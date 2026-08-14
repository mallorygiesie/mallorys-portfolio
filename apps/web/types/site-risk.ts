export type RiskLevel = "Low" | "Moderate" | "High" | "Very High" | "Extreme";

export interface ThreatVector {
  fire_lat: number;
  fire_lng: number;
  distance_km: number;
  frp_mw?: number;
  wind_speed_kmh: number;
  wind_gusts_kmh?: number;
  wind_from_deg: number;
  bearing_to_site_deg?: number;
  alignment_deg?: number;
  spread_rate_kmh?: number;
  est_hours: number | null;
}

export interface RiskDimension {
  dimension: "wildfire" | "flood" | "air_quality" | "weather" | "history";
  score: number;
  level: RiskLevel;
  headline: string;
  details: string[];
  sources: string[];
  geojson?: unknown;
  threat_vector?: ThreatVector;
  data_as_of: string;
  agent_skipped: boolean;
  skip_reason?: string;
}

export type SSEEvent =
  | { type: "status"; text: string }
  | { type: "location"; lat: number; lng: number; display_name: string }
  | { type: "agents_selected"; agents: string[] }
  | { type: "agent_running"; dimension: string }
  | { type: "risk_update"; result: RiskDimension }
  | { type: "briefing_token"; text: string }
  | { type: "done"; summary_score: number }
  | { type: "error"; text: string };
