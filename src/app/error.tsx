"use client";

import { useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background p-6 text-center">
      <h1 className="text-2xl font-bold">حدث خطأ ما</h1>
      <p className="mt-2 text-muted-foreground">تعذّر تحميل المحتوى. حاول مرة أخرى · Something went wrong</p>
      <Button onClick={reset} className="mt-6 gap-2">
        <RefreshCw className="size-4" />
        إعادة المحاولة
      </Button>
    </div>
  );
}
