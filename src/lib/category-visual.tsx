import type { ComponentType } from "react";
import {
  Bed,
  Building2,
  Bus,
  Camera,
  Coffee,
  FerrisWheel,
  Landmark,
  MapPin,
  Mountain,
  ShoppingBag,
  Trees,
  UtensilsCrossed,
  Waves,
  type LucideProps,
} from "lucide-react";
import type { PlaceCategory } from "@/types";

interface Visual {
  icon: ComponentType<LucideProps>;
  /** Tailwind gradient classes for the placeholder background. */
  gradient: string;
}

const MAP: Record<PlaceCategory, Visual> = {
  attraction: { icon: Camera, gradient: "from-secondary/25 to-primary/20" },
  landmark: { icon: Landmark, gradient: "from-primary/25 to-secondary/20" },
  museum: { icon: Building2, gradient: "from-indigo-500/20 to-primary/20" },
  restaurant: { icon: UtensilsCrossed, gradient: "from-accent/25 to-amber-500/15" },
  cafe: { icon: Coffee, gradient: "from-amber-600/20 to-accent/15" },
  nature: { icon: Trees, gradient: "from-emerald-500/25 to-secondary/20" },
  beach: { icon: Waves, gradient: "from-sky-400/25 to-secondary/20" },
  shopping: { icon: ShoppingBag, gradient: "from-pink-500/20 to-accent/15" },
  entertainment: { icon: FerrisWheel, gradient: "from-violet-500/25 to-secondary/20" },
  activity: { icon: Mountain, gradient: "from-orange-500/20 to-emerald-500/15" },
  transport: { icon: Bus, gradient: "from-slate-500/20 to-primary/15" },
  hotel: { icon: Bed, gradient: "from-secondary/25 to-primary/20" },
};

export function categoryVisual(category: PlaceCategory): Visual {
  return MAP[category] ?? { icon: MapPin, gradient: "from-secondary/20 to-primary/15" };
}
