"use client";

import type { ComponentType } from "react";
import { AlertTriangle, Inbox, RefreshCw, WifiOff, type LucideProps } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

interface StateProps {
  title: string;
  description?: string;
  icon?: ComponentType<LucideProps>;
  action?: React.ReactNode;
  className?: string;
}

function BaseState({ title, description, icon: Icon = Inbox, action, className }: StateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center",
        className,
      )}
    >
      <span className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <Icon className="size-7" aria-hidden />
      </span>
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function EmptyState(props: StateProps) {
  return <BaseState {...props} />;
}

export function ErrorState({ onRetry, ...props }: StateProps & { onRetry?: () => void }) {
  const { t } = useI18n();
  return (
    <BaseState
      icon={AlertTriangle}
      {...props}
      action={
        props.action ??
        (onRetry ? (
          <Button variant="outline" onClick={onRetry} className="gap-2">
            <RefreshCw className="size-4" aria-hidden />
            {t("common.retry")}
          </Button>
        ) : undefined)
      }
    />
  );
}

export function OfflineState({ onRetry }: { onRetry?: () => void }) {
  const { t } = useI18n();
  return (
    <BaseState
      icon={WifiOff}
      title={t("states.offlineTitle")}
      description={t("states.offlineDesc")}
      action={
        onRetry ? (
          <Button variant="outline" onClick={onRetry} className="gap-2">
            <RefreshCw className="size-4" aria-hidden />
            {t("common.retry")}
          </Button>
        ) : undefined
      }
    />
  );
}

/** Simple skeleton grid used as a loading placeholder. */
export function LoadingCards({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-3 rounded-2xl border p-4">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}
