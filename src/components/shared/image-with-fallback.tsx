"use client";

import { useState } from "react";
import Image from "next/image";
import type { PlaceCategory } from "@/types";
import { categoryVisual } from "@/lib/category-visual";
import { cn } from "@/lib/utils";

interface ImageWithFallbackProps {
  src?: string;
  alt: string;
  category?: PlaceCategory;
  className?: string;
  /** Fill parent (parent must be relative). */
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
  rounded?: string;
}

/**
 * Image with a graceful, on-brand gradient + icon fallback used whenever a
 * remote image is missing or fails to load — so the UI never shows a broken
 * image and works even offline.
 */
export function ImageWithFallback({
  src,
  alt,
  category = "attraction",
  className,
  fill,
  width,
  height,
  sizes,
  priority,
  rounded = "rounded-2xl",
}: ImageWithFallbackProps) {
  const [errored, setErrored] = useState(false);
  const visual = categoryVisual(category);
  const Icon = visual.icon;

  if (!src || errored) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn(
          "flex items-center justify-center bg-gradient-to-br",
          visual.gradient,
          fill ? "absolute inset-0 h-full w-full" : "h-full w-full",
          rounded,
          className,
        )}
      >
        <Icon className="size-8 text-primary/40" aria-hidden />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      width={fill ? undefined : (width ?? 400)}
      height={fill ? undefined : (height ?? 300)}
      sizes={sizes ?? (fill ? "100vw" : undefined)}
      priority={priority}
      onError={() => setErrored(true)}
      className={cn("object-cover", rounded, className)}
    />
  );
}
