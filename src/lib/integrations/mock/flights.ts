import type { Currency, Flight, FlightDirection, FlightRecommendation } from "@/types";
import { airlines } from "@/data/airlines";
import { cities } from "@/data/cities";
import { convertStatic } from "@/data/currencies";
import { hashString } from "@/lib/utils";
import type { FlightsProvider, SearchFlightsInput } from "../types";
import { mockMapsProvider } from "./maps";

function airportCoords(code: string) {
  return cities.find((c) => c.airport === code)?.coordinates ?? { lat: 24.7136, lng: 46.6753 };
}

/** Add minutes to an ISO/day string, returning ISO. */
function atTime(dateISO: string, hour: number, minute: number): string {
  const d = new Date(`${dateISO.slice(0, 10)}T00:00:00`);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function buildLeg(
  input: SearchFlightsInput,
  direction: FlightDirection,
  dateISO: string,
  index: number,
): Flight {
  const from = direction === "outbound" ? input.originAirport : input.destinationAirport;
  const to = direction === "outbound" ? input.destinationAirport : input.originAirport;
  const km = mockMapsProvider.distanceKm(airportCoords(from), airportCoords(to));
  const flightHours = km / 780 + 0.5; // cruise + taxi/climb overhead

  const seed = hashString(`${from}${to}${dateISO}${index}`);
  const airline = airlines[Math.abs(seed) % airlines.length]!;
  const stops = km > 4500 && index % 3 === 1 ? 1 : 0;
  const extraForStop = stops * 2.2; // hours added by a layover
  const totalMinutes = Math.round((flightHours + extraForStop) * 60);

  const departHour = 6 + ((Math.abs(seed >> 2) % 8) * 2); // 06:00–20:00
  const departMinute = (Math.abs(seed) % 2) * 30;
  const departISO = atTime(dateISO, departHour % 24, departMinute);
  const arriveISO = new Date(new Date(departISO).getTime() + totalMinutes * 60_000).toISOString();

  // Base fare in SAR then convert to requested currency.
  const perPax =
    (900 + km * 0.11) * airline.priceFactor * (stops ? 0.85 : 1) * (1 + ((Math.abs(seed) % 20) - 10) / 100);
  const paxCount = input.adults + input.children * 0.75;
  const priceSar = Math.round((perPax * paxCount) / 10) * 10;
  const price = Math.round(convertStatic(priceSar, "SAR", input.currency));

  return {
    id: `fl-${direction}-${index}-${from}${to}`,
    airline: airline.name,
    airlineCode: airline.code,
    originAirport: from,
    destinationAirport: to,
    departISO,
    arriveISO,
    durationMinutes: totalMinutes,
    stops,
    baggageIncluded: airline.fullService,
    price,
    currency: input.currency,
    recommendation: "bestValue",
    direction,
    meta: { source: "demo", isEstimated: true, lastUpdatedISO: dateISO.slice(0, 10) },
  };
}

/** Assign one recommendation badge per category across a set of same-direction flights. */
function assignBadges(flights: Flight[]): Flight[] {
  if (flights.length === 0) return flights;
  const byId = new Map(flights.map((f) => [f.id, { ...f }]));
  const pick = (rec: FlightRecommendation, id: string) => {
    const f = byId.get(id);
    if (f) f.recommendation = rec;
  };
  const arr = [...flights];
  const cheapest = [...arr].sort((a, b) => a.price - b.price)[0]!;
  const fastest = [...arr].sort((a, b) => a.durationMinutes - b.durationMinutes)[0]!;
  const bestValue = [...arr].sort(
    (a, b) => a.price / 1000 + a.durationMinutes / 60 - (b.price / 1000 + b.durationMinutes / 60),
  )[0]!;
  const bestArrival = [...arr].sort(
    (a, b) => new Date(a.arriveISO).getHours() - new Date(b.arriveISO).getHours(),
  )[0]!;
  const family = [...arr].sort(
    (a, b) => Number(b.baggageIncluded) - Number(a.baggageIncluded) || a.stops - b.stops,
  )[0]!;

  pick("cheapest", cheapest.id);
  pick("fastest", fastest.id);
  pick("bestValue", bestValue.id);
  pick("bestArrival", bestArrival.id);
  pick("family", family.id);
  return Array.from(byId.values());
}

/** Synchronous core, reused by the trip generator. */
export function generateFlights(input: SearchFlightsInput): Flight[] {
  const outbound = assignBadges(
    Array.from({ length: 5 }, (_, i) => buildLeg(input, "outbound", input.departDate, i)),
  );
  const returns = input.returnDate
    ? assignBadges(
        Array.from({ length: 5 }, (_, i) => buildLeg(input, "return", input.returnDate!, i)),
      )
    : [];
  return [...outbound, ...returns];
}

export const mockFlightsProvider: FlightsProvider = {
  id: "mock",
  async searchFlights(input: SearchFlightsInput): Promise<Flight[]> {
    return generateFlights(input);
  },
};
