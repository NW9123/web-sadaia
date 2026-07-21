"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/shared/brand-logo";
import { useI18n } from "@/lib/i18n/provider";
import { brand } from "@/config/brand";

export function SiteFooter() {
  const { t } = useI18n();
  const year = 2026;

  const columns = [
    {
      title: t("footer.product"),
      links: [
        { href: "/discover", label: t("nav.discover") },
        { href: "/plan", label: t("nav.plan") },
        { href: "/trips", label: t("nav.trips") },
      ],
    },
    {
      title: t("footer.company"),
      links: [
        { href: "/", label: t("footer.about") },
        { href: "/", label: t("footer.contact") },
      ],
    },
    {
      title: t("footer.legal"),
      links: [
        { href: "/", label: t("footer.privacy") },
        { href: "/", label: t("footer.terms") },
      ],
    },
  ];

  return (
    <footer className="mt-16 border-t border-border bg-card no-print">
      <div className="container-page py-12">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="space-y-3">
            <BrandLogo />
            <p className="max-w-xs text-sm text-muted-foreground">{t("footer.tagline")}</p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="mb-3 text-sm font-semibold">{col.title}</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {col.links.map((link, i) => (
                  <li key={i}>
                    <Link href={link.href} className="transition-colors hover:text-foreground">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-xl bg-muted/60 p-4 text-xs leading-relaxed text-muted-foreground">
          {t("footer.disclaimerShort")}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          © {year} {brand.name}. {t("footer.rights")}.
        </p>
      </div>
    </footer>
  );
}
