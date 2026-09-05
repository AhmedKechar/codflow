"use client";

import { useState } from "react";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-12 w-12 text-sm",
  lg: "h-20 w-20 text-lg",
};

export function ProductImage({
  src,
  alt,
  className,
  fallbackClassName,
  size = "md",
}: ProductImageProps) {
  const [hasError, setHasError] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  if (!src || hasError) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-md bg-muted text-muted-foreground",
          sizeClasses[size],
          fallbackClassName,
        )}
      >
        <Package className="h-1/2 w-1/2" />
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden rounded-md", sizeClasses[size], className)}>
      {!hasLoaded && (
        <div className="absolute inset-0 animate-pulse bg-muted" />
      )}
      <img
        src={src}
        alt={alt}
        className={cn("h-full w-full object-cover transition-opacity", hasLoaded ? "opacity-100" : "opacity-0")}
        onLoad={() => setHasLoaded(true)}
        onError={() => setHasError(true)}
      />
    </div>
  );
}
