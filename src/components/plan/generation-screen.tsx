"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/shared/brand-logo";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

const STAGE_KEYS = [
  "generate.stageAnalyze",
  "generate.stageSearch",
  "generate.stageDistribute",
  "generate.stageHotels",
  "generate.stageBudget",
  "generate.stageFinalize",
] as const;

/**
 * Generation experience. Cycles through real pipeline stages (indeterminate —
 * no fake fixed percentage) while the async generation runs, enforcing a small
 * minimum display time so the stages are readable, then calls onDone.
 */
export function GenerationScreen({
  generate,
  onDone,
}: {
  generate: () => Promise<string>;
  onDone: (tripId: string) => void;
}) {
  const { t } = useI18n();
  const [stage, setStage] = useState(0);
  const [error, setError] = useState(false);
  const startedRef = useRef(false);

  const run = () => {
    setError(false);
    setStage(0);
    const interval = setInterval(() => {
      setStage((s) => Math.min(s + 1, STAGE_KEYS.length - 1));
    }, 650);

    const minDelay = new Promise((resolve) => setTimeout(resolve, 2600));
    Promise.all([generate(), minDelay])
      .then(([tripId]) => {
        clearInterval(interval);
        setStage(STAGE_KEYS.length - 1);
        onDone(tripId as string);
      })
      .catch(() => {
        clearInterval(interval);
        setError(true);
      });
  };

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-muted/40 to-background p-6">
      <div className="w-full max-w-md rounded-3xl border bg-card p-8 shadow-card">
        <div className="mb-6 flex justify-center">
          <BrandLogo />
        </div>

        {error ? (
          <div className="text-center">
            <h1 className="text-lg font-bold">{t("generate.error")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("generate.errorDesc")}</p>
            <Button
              className="mt-5"
              onClick={() => {
                startedRef.current = true;
                run();
              }}
            >
              {t("common.retry")}
            </Button>
          </div>
        ) : (
          <>
            <h1 className="text-center text-xl font-bold">{t("generate.title")}</h1>
            <p className="mt-1 text-center text-sm text-muted-foreground">{t("generate.subtitle")}</p>

            <ul className="mt-7 space-y-3" aria-live="polite">
              {STAGE_KEYS.map((key, i) => {
                const done = i < stage;
                const active = i === stage;
                return (
                  <li key={key} className="flex items-center gap-3">
                    <span
                      className={cn(
                        "flex size-7 items-center justify-center rounded-full border transition-colors",
                        done && "border-success bg-success text-success-foreground",
                        active && "border-secondary bg-secondary/10 text-secondary",
                        !done && !active && "border-border text-muted-foreground",
                      )}
                    >
                      {done ? (
                        <Check className="size-4" />
                      ) : active ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <span className="size-1.5 rounded-full bg-current" />
                      )}
                    </span>
                    <span
                      className={cn(
                        "text-sm",
                        done && "text-muted-foreground line-through/0",
                        active ? "font-semibold text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {t(key)}
                    </span>
                  </li>
                );
              })}
            </ul>

            {/* Indeterminate bar (no fake percentage). */}
            <div className="mt-7 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full w-1/3 animate-[shimmer_1.4s_infinite] rounded-full bg-secondary" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
