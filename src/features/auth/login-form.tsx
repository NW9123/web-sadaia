"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { LogIn, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandLogo } from "@/components/shared/brand-logo";
import { Disclaimer } from "@/components/shared/data-badges";
import { useI18n } from "@/lib/i18n/provider";
import { useAuth } from "@/features/auth/store";

function LoginInner() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useSearchParams();
  const { login, loginGoogle, loginDemo } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const next = params.get("next") || "/trips";

  const finish = (fn: () => void) => {
    setLoading(true);
    fn();
    router.push(next);
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-muted/40 to-background p-6">
      <div className="mb-6">
        <BrandLogo />
      </div>
      <Card className="w-full max-w-sm p-6 sm:p-8">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold">{t("auth.loginTitle")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("auth.loginSubtitle")}</p>
        </div>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (email.trim()) finish(() => login(email.trim()));
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="email">{t("auth.email")}</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("auth.emailPlaceholder")}
                className="ps-9"
                dir="ltr"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">{t("auth.password")}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              dir="ltr"
            />
          </div>
          <Button type="submit" className="w-full gap-2" disabled={loading || !email.trim()}>
            <LogIn className="size-4" />
            {loading ? t("auth.loggingIn") : t("auth.continueEmail")}
          </Button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          {t("auth.or")}
          <span className="h-px flex-1 bg-border" />
        </div>

        <Button variant="outline" className="w-full gap-2" onClick={() => finish(loginGoogle)}>
          <GoogleIcon />
          {t("auth.continueGoogle")}
        </Button>
        <Button variant="ghost" className="mt-2 w-full" onClick={() => finish(loginDemo)}>
          {t("auth.demoLogin")}
        </Button>

        <Disclaimer icon="info" className="mt-6">
          {t("auth.demoNote")}
        </Disclaimer>
      </Card>

      <Link href="/" className="mt-6 text-sm text-muted-foreground hover:text-foreground">
        {t("states.goHome")}
      </Link>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z" />
    </svg>
  );
}

export function LoginForm() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}
