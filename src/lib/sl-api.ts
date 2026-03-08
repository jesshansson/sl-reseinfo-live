const TRANSPORT_BASE = "https://transport.integration.sl.se/v1";
const DEVIATIONS_BASE = "https://deviations.integration.sl.se/v1";
const JOURNEY_BASE = "https://journeyplanner.integration.sl.se/v2";

// --- Types ---

export interface Site {
  id: number;
  name: string;
  lat?: number;
  lon?: number;
  stop_areas?: number[];
}

export interface Departure {
  direction: string;
  direction_code: number;
  via?: string;
  destination: string;
  state: string;
  scheduled: string;
  expected: string;
  display: string;
  journey: {
    id: number;
    state: string;
    prediction_state: string;
    passenger_level?: string;
  };
  stop_area: {
    id: number;
    name: string;
    sname?: string;
    type: string;
  };
  stop_point: {
    id: number;
    name: string;
    designation?: string;
  };
  line: {
    id: number;
    designation: string;
    transport_mode: string;
    group_of_lines?: string;
  };
  deviations?: Array<{
    importance_level?: number;
    consequence?: string;
    message?: string;
  }>;
}

export interface DeparturesResponse {
  departures: Departure[];
  stop_deviations?: Array<{
    importance?: number;
    consequence?: string;
    message?: string;
  }>;
}

export interface Deviation {
  version: number;
  created: string;
  modified: string;
  deviation_case_id: number;
  publish: {
    from: string;
    upto: string;
  };
  priority: {
    importance_level: number;
    influence_level: number;
    urgency_level: number;
  };
  message_variants: Array<{
    header: string;
    details: string;
    scope_alias: string;
    weblink?: string;
    language: string;
  }>;
  scope: {
    stop_areas?: Array<{
      id: number;
      name: string;
      transport_mode: string;
    }>;
    lines?: Array<{
      id: number;
      designation: string;
      transport_mode: string;
      name: string;
      group_of_lines?: string;
    }>;
  };
}

export interface JourneyLocation {
  id: string;
  isGlobalId: boolean;
  name: string;
  disassembledName: string;
  coord: [number, number];
  type: string;
  matchQuality: number;
  isBest: boolean;
  productClasses?: number[];
  parent?: {
    id: string;
    name: string;
    type: string;
  };
}

export interface JourneyLeg {
  duration: number;
  origin: {
    id: string;
    name: string;
    disassembledName?: string;
    type: string;
    coord?: [number, number];
    departureTimePlanned?: string;
    departureTimeEstimated?: string;
    parent?: { name: string };
  };
  destination: {
    id: string;
    name: string;
    disassembledName?: string;
    type: string;
    coord?: [number, number];
    arrivalTimePlanned?: string;
    arrivalTimeEstimated?: string;
    parent?: { name: string };
  };
  transportation?: {
    id?: string;
    name?: string;
    disassembledName?: string;
    number?: string;
    description?: string;
    product?: {
      name?: string;
      class?: number;
      iconId?: number;
    };
    destination?: {
      name?: string;
    };
  };
  infos?: Array<{
    priority?: string;
    id?: string;
    version?: number;
    type?: string;
    urlText?: string;
    url?: string;
    content?: string;
    subtitle?: string;
    title?: string;
    additionalText?: string;
  }>;
  stopSequence?: Array<{
    id: string;
    name: string;
    disassembledName?: string;
    type: string;
    coord?: [number, number];
    arrivalTimePlanned?: string;
    departureTimePlanned?: string;
  }>;
}

export interface Journey {
  tripId: string;
  tripDuration: number;
  tripRtDuration?: number;
  interchanges: number;
  legs: JourneyLeg[];
}

export interface TripsResponse {
  systemMessages?: Array<{ type: string; text: string }>;
  journeys?: Journey[];
}

// --- API Functions ---

export async function fetchSites(): Promise<Site[]> {
  const res = await fetch(`${TRANSPORT_BASE}/sites`);
  if (!res.ok) throw new Error("Kunde inte hämta stationer");
  return res.json();
}

export async function fetchDepartures(siteId: number): Promise<DeparturesResponse> {
  const res = await fetch(`${TRANSPORT_BASE}/sites/${siteId}/departures`);
  if (!res.ok) throw new Error("Kunde inte hämta avgångar");
  return res.json();
}

export async function fetchDeviations(params?: {
  future?: boolean;
  transportMode?: string[];
}): Promise<Deviation[]> {
  const url = new URL(`${DEVIATIONS_BASE}/messages`);
  if (params?.future !== undefined) url.searchParams.set("future", String(params.future));
  if (params?.transportMode) {
    params.transportMode.forEach(m => url.searchParams.append("transport_mode", m));
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Kunde inte hämta störningar");
  return res.json();
}

export async function searchStops(query: string): Promise<JourneyLocation[]> {
  if (!query || query.length < 2) return [];
  const url = new URL(`${JOURNEY_BASE}/stop-finder`);
  url.searchParams.set("name_sf", query);
  url.searchParams.set("type_sf", "any");
  url.searchParams.set("any_obj_filter_sf", "2");
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Kunde inte söka hållplatser");
  const data = await res.json();
  return data.locations || [];
}

export interface TripSearchParams {
  originId: string;
  destinationId: string;
  numTrips?: number;
  inclCommuter?: boolean;
  inclMetro?: boolean;
  inclTram?: boolean;
  inclBus?: boolean;
  inclShip?: boolean;
  inclTrain?: boolean;
  routeType?: "leasttime" | "leastinterchange" | "leastwalking";
}

export async function searchTrips(params: TripSearchParams): Promise<TripsResponse> {
  const url = new URL(`${JOURNEY_BASE}/trips`);
  url.searchParams.set("type_origin", "any");
  url.searchParams.set("type_destination", "any");
  url.searchParams.set("name_origin", params.originId);
  url.searchParams.set("name_destination", params.destinationId);
  url.searchParams.set("calc_number_of_trips", String(params.numTrips ?? 3));
  
  if (params.inclCommuter !== undefined) url.searchParams.set("incl_mot_0", String(params.inclCommuter));
  if (params.inclMetro !== undefined) url.searchParams.set("incl_mot_2", String(params.inclMetro));
  if (params.inclTram !== undefined) url.searchParams.set("incl_mot_4", String(params.inclTram));
  if (params.inclBus !== undefined) url.searchParams.set("incl_mot_5", String(params.inclBus));
  if (params.inclShip !== undefined) url.searchParams.set("incl_mot_9", String(params.inclShip));
  if (params.inclTrain !== undefined) url.searchParams.set("incl_mot_14", String(params.inclTrain));
  if (params.routeType) url.searchParams.set("route_type", params.routeType);
  
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Kunde inte söka resor");
  return res.json();
}

// --- Helpers ---

export function getTransportModeLabel(mode: string): string {
  const map: Record<string, string> = {
    BUS: "Buss",
    METRO: "Tunnelbana",
    TRAIN: "Tåg",
    TRAM: "Spårvagn",
    SHIP: "Båt",
    FERRY: "Färja",
    TAXI: "Taxi",
  };
  return map[mode?.toUpperCase()] || mode;
}

export function getTransportModeColor(mode: string): string {
  const map: Record<string, string> = {
    BUS: "bg-bus",
    METRO: "bg-metro",
    TRAIN: "bg-train",
    TRAM: "bg-tram",
    SHIP: "bg-ship",
    FERRY: "bg-ship",
  };
  return map[mode?.toUpperCase()] || "bg-muted-foreground";
}

export function formatTime(isoString: string | undefined): string {
  if (!isoString) return "—";
  const date = new Date(isoString);
  return date.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
}

export function getMinutesUntil(isoString: string | undefined): number | null {
  if (!isoString) return null;
  const now = new Date();
  const target = new Date(isoString);
  return Math.round((target.getTime() - now.getTime()) / 60000);
}
