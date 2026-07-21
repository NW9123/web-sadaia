"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Globe, Save, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencySelect } from "@/components/shared/currency-select";
import { NumberStepper } from "@/components/shared/number-stepper";
import { ChipGroup } from "@/components/shared/chip-group";
import { SectionHeading } from "@/components/shared/section";
import { EmptyState } from "@/components/shared/states";
import { PACES, TRAVEL_STYLES, type Currency, type Pace, type TravelStyle } from "@/types/enums";
import { locales, localeLabels, type Locale } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/provider";
import { useAuth } from "@/features/auth/store";
import { cn } from "@/lib/utils";

const SETTINGS_KEY = "tripmind.settings.v1";

interface AppSettings {
  currency: Currency;
  defaultAdults: number;
  defaultChildren: number;
  defaultStyle: TravelStyle;
  defaultPace: Pace;
  homeCity: string;
}

const DEFAULTS: AppSettings = {
  currency: "SAR",
  defaultAdults: 2,
  defaultChildren: 0,
  defaultStyle: "family",
  defaultPace: "balanced",
  homeCity: "الرياض",
};

export function SettingsPage() {
  const { t, locale, setLocale } = useI18n();
  const { user, ready, updateUser } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [settings, setSettings] = useState<AppSettings>(DEFAULTS);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) setSettings({ ...DEFAULTS, ...(JSON.parse(raw) as Partial<AppSettings>) });
    } catch {
      /* ignore */
    }
  }, [user]);

  if (ready && !user) {
    return (
      <div className="container-page py-16">
        <EmptyState
          icon={User}
          title={t("auth.loginTitle")}
          description={t("auth.loginSubtitle")}
          action={
            <Button asChild>
              <Link href="/auth/login?next=/settings">{t("nav.login")}</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const save = () => {
    updateUser({ name, email });
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      /* ignore */
    }
    toast.success(t("settings.settingsSaved"));
  };

  const set = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) =>
    setSettings((s) => ({ ...s, [key]: value }));

  return (
    <div className="container-page max-w-2xl py-8">
      <SectionHeading title={t("settings.title")} />

      <div className="mt-6 space-y-5">
        {/* Profile */}
        <Card className="p-5">
          <h2 className="mb-4 flex items-center gap-2 font-semibold">
            <User className="size-5 text-secondary" /> {t("settings.profile")}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="s-name">{t("settings.fullName")}</Label>
              <Input id="s-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-email">{t("settings.email")}</Label>
              <Input id="s-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" />
            </div>
          </div>
        </Card>

        {/* Language & currency */}
        <Card className="p-5">
          <h2 className="mb-4 flex items-center gap-2 font-semibold">
            <Globe className="size-5 text-secondary" /> {t("settings.language")} & {t("settings.currency")}
          </h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("settings.language")}</Label>
              <div className="flex gap-2">
                {locales.map((l: Locale) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLocale(l)}
                    className={cn(
                      "rounded-xl border px-4 py-2 text-sm font-medium transition-colors",
                      locale === l ? "border-secondary bg-secondary/10 text-secondary" : "hover:bg-muted",
                    )}
                  >
                    {localeLabels[l].native}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("settings.currency")}</Label>
              <CurrencySelect value={settings.currency} onChange={(v) => set("currency", v)} className="max-w-xs" />
            </div>
          </div>
        </Card>

        {/* Travel preferences */}
        <Card className="p-5">
          <h2 className="mb-4 font-semibold">{t("settings.preferences")}</h2>
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center justify-between rounded-xl border p-3">
                <Label>{t("settings.defaultAdults")}</Label>
                <NumberStepper value={settings.defaultAdults} min={1} onChange={(v) => set("defaultAdults", v)} />
              </div>
              <div className="flex items-center justify-between rounded-xl border p-3">
                <Label>{t("settings.defaultChildren")}</Label>
                <NumberStepper value={settings.defaultChildren} min={0} onChange={(v) => set("defaultChildren", v)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("settings.homeCity")}</Label>
              <Input value={settings.homeCity} onChange={(e) => set("homeCity", e.target.value)} className="max-w-xs" />
            </div>
            <div className="space-y-2">
              <Label>{t("settings.defaultStyle")}</Label>
              <ChipGroup
                values={TRAVEL_STYLES}
                selected={[settings.defaultStyle]}
                onToggle={(v) => set("defaultStyle", v)}
                labelPrefix="enums.style"
                single
              />
            </div>
            <div className="space-y-2">
              <Label>{t("settings.defaultPace")}</Label>
              <ChipGroup
                values={PACES}
                selected={[settings.defaultPace]}
                onToggle={(v) => set("defaultPace", v)}
                labelPrefix="enums.pace"
                single
              />
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button onClick={save} className="gap-2">
            <Save className="size-4" />
            {t("settings.saveSettings")}
          </Button>
        </div>
      </div>
    </div>
  );
}
