import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";
import { brand } from "@/config/brand";
import { dirForLocale } from "@/lib/i18n/config";
import { getServerLocale } from "@/lib/i18n/server";
import { Providers } from "@/components/providers";

const arabicFont = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${brand.name} — ${brand.tagline.ar}`,
    template: `%s · ${brand.name}`,
  },
  description: brand.description.ar,
  applicationName: brand.name,
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
};

export const viewport: Viewport = {
  themeColor: "#14213d",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getServerLocale();
  const dir = dirForLocale(locale);

  return (
    <html lang={locale} dir={dir} className={arabicFont.variable} suppressHydrationWarning>
      <body className="min-h-dvh bg-background font-sans text-foreground antialiased">
        <Providers locale={locale}>{children}</Providers>
      </body>
    </html>
  );
}
