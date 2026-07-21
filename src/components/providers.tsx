"use client";

import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { I18nProvider } from "@/lib/i18n/provider";
import type { Locale } from "@/lib/i18n/config";
import { AuthProvider } from "@/features/auth/store";
import { TripStoreProvider } from "@/features/trips/store";

/** Composes all client-side context providers used across the app. */
export function Providers({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <I18nProvider initialLocale={locale}>
        <AuthProvider>
          <TripStoreProvider>
            <TooltipProvider delayDuration={200}>
              {children}
              <Toaster />
            </TooltipProvider>
          </TripStoreProvider>
        </AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
