import type { DestinationRecommendation, DestinationRecommendationInput, Localized } from "@/types";
import { destinations } from "@/data/destinations";

/**
 * Deterministic destination scoring, shared by the mock AI provider and the
 * Discover UI so both rank identically.
 */
export function recommendDestinationsSync(
  input: DestinationRecommendationInput,
): DestinationRecommendation[] {
  const wanted = new Set([...(input.styles ?? []), ...(input.interests ?? [])]);

  return destinations
    .map((destination) => {
      let score = destination.popularity * 0.35;
      const reasons: Localized[] = [];

      if (input.weather && input.weather !== "any" && destination.weather === input.weather) {
        score += 18;
        reasons.push({ ar: "أجواء مناسبة لتفضيلك.", en: "Weather matches your preference." });
      }
      if (input.maxFlightHours && destination.flightTimeHours <= input.maxFlightHours) {
        score += 12;
        reasons.push({ ar: "مدة طيران ضمن حدك.", en: "Flight time within your limit." });
      }
      if (input.budgetPerDay && destination.avgDailyCost <= input.budgetPerDay) {
        score += 15;
        reasons.push({ ar: "ضمن ميزانيتك اليومية.", en: "Fits your daily budget." });
      }
      const tagMatches = destination.tags.filter((tg) => wanted.has(tg)).length;
      if (tagMatches > 0) {
        score += tagMatches * 6;
        reasons.push({ ar: "يناسب أسلوبك واهتماماتك.", en: "Matches your style and interests." });
      }
      if (reasons.length === 0) {
        reasons.push({ ar: "وجهة مميزة ننصح بها.", en: "A standout destination we recommend." });
      }

      return { destination, matchScore: Math.min(100, Math.round(score)), reasons: reasons.slice(0, 3) };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}
