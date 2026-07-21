import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

// Static, provider-independent copy so this renders even outside i18n context.
export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background p-6 text-center">
      <span className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <Compass className="size-8" />
      </span>
      <h1 className="text-2xl font-bold">الصفحة غير موجودة</h1>
      <p className="mt-2 text-muted-foreground">الرابط الذي تبحث عنه غير متوفر · Page not found</p>
      <Button asChild className="mt-6">
        <Link href="/">العودة للرئيسية</Link>
      </Button>
    </div>
  );
}
