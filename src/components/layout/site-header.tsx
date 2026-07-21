"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, Shield, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BrandLogo } from "@/components/shared/brand-logo";
import { LocaleSwitcher } from "@/components/shared/locale-switcher";
import { useI18n } from "@/lib/i18n/provider";
import { useAuth } from "@/features/auth/store";
import { cn } from "@/lib/utils";
import { useState } from "react";

const NAV = [
  { href: "/", key: "nav.home" },
  { href: "/discover", key: "nav.discover" },
  { href: "/plan", key: "nav.plan" },
  { href: "/trips", key: "nav.trips" },
] as const;

export function SiteHeader() {
  const { t } = useI18n();
  const pathname = usePathname();
  const { user, isAdmin, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="glass-header sticky top-0 z-40 border-b border-border/70">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <BrandLogo />
          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive(item.href)
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {t(item.key)}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <LocaleSwitcher />
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full" aria-label={user.name}>
                  <Avatar className="size-9">
                    <AvatarFallback className="bg-secondary/15 text-secondary">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5 text-sm">
                  <p className="font-medium">{user.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <User className="size-4" /> {t("nav.settings")}
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin">
                      <Shield className="size-4" /> {t("nav.admin")}
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="size-4" /> {t("nav.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href="/auth/login">{t("nav.login")}</Link>
            </Button>
          )}

          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href="/plan">{t("nav.startPlanning")}</Link>
          </Button>

          {/* Mobile menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden" aria-label={t("nav.menu")}>
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="start" className="w-72">
              <SheetHeader>
                <SheetTitle>
                  <BrandLogo />
                </SheetTitle>
              </SheetHeader>
              <nav className="mt-6 flex flex-col gap-1" aria-label="Mobile">
                {NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "rounded-lg px-3 py-2.5 text-base font-medium",
                      isActive(item.href) ? "bg-muted" : "hover:bg-muted",
                    )}
                  >
                    {t(item.key)}
                  </Link>
                ))}
                <div className="my-2 h-px bg-border" />
                {!user && (
                  <Link
                    href="/auth/login"
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-2.5 text-base font-medium hover:bg-muted"
                  >
                    {t("nav.login")}
                  </Link>
                )}
                <Button asChild className="mt-2" onClick={() => setOpen(false)}>
                  <Link href="/plan">{t("nav.startPlanning")}</Link>
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
