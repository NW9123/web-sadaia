import { AppShell } from "@/components/layout/app-shell";
import { Hero } from "@/components/landing/hero";
import { SuggestedDestinations } from "@/components/landing/suggested-destinations";
import { HowItWorks } from "@/components/landing/how-it-works";
import { ExampleItinerary } from "@/components/landing/example-itinerary";
import { Features } from "@/components/landing/features";
import { LandingCta } from "@/components/landing/cta";

export default function HomePage() {
  return (
    <AppShell>
      <Hero />
      <SuggestedDestinations />
      <HowItWorks />
      <ExampleItinerary />
      <Features />
      <LandingCta />
    </AppShell>
  );
}
