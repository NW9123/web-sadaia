"use client";

import { useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeftRight,
  Check,
  Clock,
  Minus,
  Plus,
  RotateCcw,
  Send,
  Sparkles,
  Wallet,
  X,
} from "lucide-react";
import type { Localized, ModificationPreview, Trip } from "@/types";
import type { ValidatedModification } from "@/lib/validation/ai";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { buildPreview } from "@/lib/ai/preview";
import { parseModifications } from "@/lib/validation/ai";
import { useI18n } from "@/lib/i18n/provider";
import { useTrips } from "@/features/trips/store";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface PendingChange {
  message: Localized;
  modifications: ValidatedModification[];
  preview: ModificationPreview;
}

let msgCounter = 0;
const nextId = () => `m${(msgCounter += 1)}`;

export function AiAssistant({ trip, onClose }: { trip: Trip; onClose?: () => void }) {
  const { t, locale, fmt } = useI18n();
  const { applyAi } = useTrips();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [pending, setPending] = useState<PendingChange | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const suggestions = ["ai.s1", "ai.s2", "ai.s3", "ai.s4", "ai.s5", "ai.s6"] as const;

  async function send(text: string) {
    const instruction = text.trim();
    if (!instruction || thinking) return;
    setInput("");
    setPending(null);
    setMessages((m) => [...m, { id: nextId(), role: "user", content: instruction }]);
    setThinking(true);
    try {
      const res = await fetch("/api/modify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ trip, instruction, locale }),
      });
      if (!res.ok) throw new Error("modify failed");
      const data = (await res.json()) as {
        message: Localized;
        modifications: unknown;
        isDestructive: boolean;
      };
      const { valid } = parseModifications(data.modifications);
      setMessages((m) => [...m, { id: nextId(), role: "assistant", content: data.message[locale] }]);
      if (valid.length > 0) {
        setPending({ message: data.message, modifications: valid, preview: buildPreview(trip, valid) });
      }
    } catch {
      setMessages((m) => [
        ...m,
        { id: nextId(), role: "assistant", content: t("ai.error") },
      ]);
    } finally {
      setThinking(false);
      requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: 999999 }));
    }
  }

  function apply() {
    if (!pending) return;
    applyAi(trip.id, pending.modifications, pending.message);
    setMessages((m) => [...m, { id: nextId(), role: "assistant", content: t("ai.applied") }]);
    setPending(null);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-secondary/15 text-secondary">
            <Sparkles className="size-4" />
          </span>
          <div>
            <p className="text-sm font-semibold leading-tight">{t("ai.title")}</p>
            <p className="text-xs text-muted-foreground">{t("ai.subtitle")}</p>
          </div>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" className="size-8" onClick={onClose} aria-label={t("common.close")}>
            <X className="size-4" />
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div ref={scrollRef} className="space-y-3 p-4">
          {messages.length === 0 && (
            <div className="rounded-xl bg-muted/60 p-3 text-sm text-muted-foreground">{t("ai.welcome")}</div>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm",
                m.role === "user"
                  ? "ms-auto bg-primary text-primary-foreground"
                  : "bg-muted text-foreground",
              )}
            >
              {m.content}
            </div>
          ))}
          {thinking && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="size-2 animate-bounce rounded-full bg-secondary [animation-delay:-0.2s]" />
              <span className="size-2 animate-bounce rounded-full bg-secondary [animation-delay:-0.1s]" />
              <span className="size-2 animate-bounce rounded-full bg-secondary" />
              {t("ai.thinking")}
            </div>
          )}

          {pending && (
            <ModificationPreviewCard preview={pending.preview} trip={trip} onApply={apply} onDiscard={() => setPending(null)} />
          )}
        </div>
      </ScrollArea>

      {messages.length === 0 && (
        <div className="border-t p-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">{t("ai.suggestionsTitle")}</p>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => send(t(s))}
                className="rounded-full border bg-card px-2.5 py-1 text-xs transition-colors hover:border-secondary hover:bg-muted"
              >
                {t(s)}
              </button>
            ))}
          </div>
        </div>
      )}

      <form
        className="flex items-center gap-2 border-t p-3"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("ai.placeholder")}
          aria-label={t("ai.placeholder")}
        />
        <Button type="submit" size="icon" disabled={!input.trim() || thinking} aria-label={t("ai.send")}>
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
}

function ModificationPreviewCard({
  preview,
  trip,
  onApply,
  onDiscard,
}: {
  preview: ModificationPreview;
  trip: Trip;
  onApply: () => void;
  onDiscard: () => void;
}) {
  const { t, locale, fmt } = useI18n();
  const costUp = preview.costDelta > 0;
  const timeUp = preview.timeDeltaMinutes > 0;

  return (
    <div className="rounded-2xl border border-secondary/30 bg-secondary/5 p-3">
      <p className="mb-2 text-sm font-semibold">{t("ai.previewTitle")}</p>

      <div className="space-y-2 text-sm">
        {preview.added.length > 0 && (
          <PreviewGroup icon={Plus} tone="add" label={t("ai.willAdd")} items={preview.added.map((a) => a.name[locale])} />
        )}
        {preview.removed.length > 0 && (
          <PreviewGroup icon={Minus} tone="remove" label={t("ai.willRemove")} items={preview.removed.map((a) => a.name[locale])} />
        )}
        {preview.moved.length > 0 && (
          <PreviewGroup icon={ArrowLeftRight} tone="move" label={t("ai.willMove")} items={preview.moved.map((a) => a.name[locale])} />
        )}
        {preview.updated.length > 0 && (
          <PreviewGroup icon={Clock} tone="update" label={t("ai.willUpdate")} items={preview.updated.map((a) => a.name[locale])} />
        )}
        {preview.hotelChange && (
          <p className="flex items-center gap-1.5 text-xs">
            <Wallet className="size-3.5 text-secondary" />
            {t("ai.willChangeHotel")}: {preview.hotelChange.toName[locale]}
          </p>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Badge variant={costUp ? "warning" : "success"} className="gap-1 tnum">
          <Wallet className="size-3" />
          {t("ai.costDiff")}: {costUp ? "+" : ""}
          {fmt.currency(preview.costDelta, trip.currency)}
        </Badge>
        <Badge variant="muted" className="gap-1 tnum">
          <Clock className="size-3" />
          {t("ai.timeDiff")}: {timeUp ? "+" : ""}
          {fmt.duration(Math.abs(preview.timeDeltaMinutes))}
        </Badge>
      </div>

      {preview.isDestructive && (
        <p className="mt-2 flex items-center gap-1.5 rounded-lg bg-destructive/10 p-2 text-xs text-destructive">
          <AlertTriangle className="size-3.5 shrink-0" />
          {t("ai.destructiveWarning")}
        </p>
      )}

      <div className="mt-3 flex gap-2">
        <Button
          size="sm"
          className={cn("flex-1 gap-1", preview.isDestructive && "bg-destructive hover:bg-destructive/90")}
          onClick={onApply}
        >
          <Check className="size-4" />
          {t("ai.applyChanges")}
        </Button>
        <Button size="sm" variant="ghost" className="gap-1" onClick={onDiscard}>
          <RotateCcw className="size-4" />
          {t("ai.discard")}
        </Button>
      </div>
    </div>
  );
}

function PreviewGroup({
  icon: Icon,
  tone,
  label,
  items,
}: {
  icon: typeof Plus;
  tone: "add" | "remove" | "move" | "update";
  label: string;
  items: string[];
}) {
  const toneClass = {
    add: "text-success",
    remove: "text-destructive",
    move: "text-secondary",
    update: "text-accent",
  }[tone];
  return (
    <div>
      <p className={cn("flex items-center gap-1 text-xs font-medium", toneClass)}>
        <Icon className="size-3.5" /> {label}
      </p>
      <ul className="mt-0.5 ps-5 text-xs text-muted-foreground">
        {items.slice(0, 5).map((item, i) => (
          <li key={i} className="list-disc">{item}</li>
        ))}
      </ul>
    </div>
  );
}
