import type { Locale } from "@/lib/i18n/config";

/**
 * Booking-link helpers. Turn a provider URL into a human label (Booking.com /
 * المسافر / الخطوط السعودية) and build real, working search deep-links so every
 * hotel/flight card always has a usable booking link — even when live-deal
 * scraping returned nothing for that item.
 */

export function providerNameFromUrl(url: string | undefined, locale: Locale): string {
  if (!url) return locale === "ar" ? "الموقع" : "the site";
  let host = "";
  try {
    host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return locale === "ar" ? "الموقع" : "the site";
  }
  if (host.includes("booking.com")) return "Booking.com";
  if (host.includes("almosafer")) return locale === "ar" ? "المسافر" : "Almosafer";
  if (host.includes("saudia")) return locale === "ar" ? "الخطوط السعودية" : "Saudia";
  if (host.includes("agoda")) return "Agoda";
  if (host.includes("expedia")) return "Expedia";
  if (host.includes("google")) return "Google Flights";
  if (host.includes("skyscanner")) return "Skyscanner";
  return host;
}

/** Real Booking.com hotel-search deep link for a city + stay dates. */
export function bookingHotelSearchUrl(input: {
  city: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
}): string {
  const params = new URLSearchParams({
    ss: input.city,
    checkin: input.checkIn.slice(0, 10),
    checkout: input.checkOut.slice(0, 10),
    group_adults: String(Math.max(1, input.adults)),
    group_children: String(Math.max(0, input.children)),
    no_rooms: "1",
  });
  return `https://www.booking.com/searchresults.html?${params.toString()}`;
}

/** Real Almosafer flight-search deep link for a route + date. */
export function almosaferFlightSearchUrl(input: {
  originAirport: string;
  destinationAirport: string;
  departISO: string;
  returnISO?: string;
  adults: number;
  children: number;
}): string {
  const seg = (a: string, b: string, d: string) => `${a}-${b}-${d.slice(0, 10)}`;
  const legs = [seg(input.originAirport, input.destinationAirport, input.departISO)];
  if (input.returnISO) legs.push(seg(input.destinationAirport, input.originAirport, input.returnISO));
  const params = new URLSearchParams({
    adults: String(Math.max(1, input.adults)),
    children: String(Math.max(0, input.children)),
    cabinClass: "Economy",
    tripType: input.returnISO ? "2" : "1",
    legs: legs.join(","),
  });
  return `https://www.almosafer.com/en/flights/results?${params.toString()}`;
}
