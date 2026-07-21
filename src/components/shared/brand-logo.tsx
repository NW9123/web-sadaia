"use client";

import Link from "next/link";
import { Plane } from "lucide-react";
import { brand } from "@/config/brand";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

/** Product wordmark. Reads the name from the central brand config. */
export function BrandLogo({ className, href = "/" }: { className?: string; href?: string }) {
  const { locale } = useI18n();
  const name = locale === "ar" ? brand.nameAr : brand.name;
  return (
    <Link href={href} className={cn("flex items-center gap-2 font-bold", className)}>
      <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
        <Plane className="size-5 -rotate-12" aria-hidden />
      </span>
      <span className="text-lg tracking-tight">{name}</span>
    </Link>
  );
}
