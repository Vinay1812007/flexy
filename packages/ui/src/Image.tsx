import { useState, type ImgHTMLAttributes } from "react";
import { cn } from "./cn";

interface Props extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallback?: string;
}

/** Image with built-in skeleton + error fallback + lazy loading. */
export function Image({ src, alt, fallback, className, ...rest }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  return (
    <div className={cn("relative overflow-hidden bg-white/5", className)}>
      {!loaded && !errored ? (
        <div className="absolute inset-0 animate-pulse bg-white/5" />
      ) : null}
      <img
        src={errored && fallback ? fallback : src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setErrored(true)}
        className={cn(
          "h-full w-full object-cover transition-opacity duration-500",
          loaded ? "opacity-100" : "opacity-0",
        )}
        {...rest}
      />
    </div>
  );
}
