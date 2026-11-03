import React from "react";
import Link from "next/link";
import Image from "next/image";

interface LogoProps {
  /** Colour of the background the logo sits on: dark logo for light backgrounds ("burgundy"/"crimson"), light logo for dark ones ("ivory"/"gold"). */
  variant?: "burgundy" | "ivory" | "gold" | "crimson";
  size?: "sm" | "md" | "lg" | "xl";
  /** Stacked lockup with the "Wear your own vibe" line under the name. */
  showTagline?: boolean;
  className?: string;
  href?: string;
}

// PNG lockups made from the OFFVYBE brand sheet (public/brand).
const HORIZONTAL = { w: 1360, h: 216 };
const STACKED = { w: 1361, h: 668 };

const HORIZONTAL_HEIGHT = {
  sm: "h-[18px] sm:h-5",
  md: "h-[22px] sm:h-7",
  lg: "h-8 sm:h-9",
  xl: "h-10 sm:h-12",
};
const STACKED_HEIGHT = {
  sm: "h-12",
  md: "h-16 sm:h-20",
  lg: "h-20 sm:h-24",
  xl: "h-28 sm:h-32",
};

export const Logo: React.FC<LogoProps> = ({
  variant = "burgundy",
  size = "md",
  showTagline = false,
  className = "",
  href = "/",
}) => {
  const tone = variant === "ivory" || variant === "gold" ? "light" : "dark";
  const stacked = showTagline;
  const dim = stacked ? STACKED : HORIZONTAL;
  const src = stacked ? `/brand/offvybe-logo-stacked-${tone}.png` : `/brand/offvybe-logo-${tone}.png`;
  const heightClass = (stacked ? STACKED_HEIGHT : HORIZONTAL_HEIGHT)[size] || HORIZONTAL_HEIGHT.md;

  const content = (
    <span className={`inline-flex items-center justify-center select-none ${className}`}>
      <Image
        src={src}
        alt="OFFVYBE"
        width={dim.w}
        height={dim.h}
        className={`${heightClass} w-auto object-contain`}
        priority
        unoptimized
      />
    </span>
  );

  if (href) {
    return (
      <Link href={href} aria-label="OFFVYBE home" className="inline-flex items-center justify-center">
        {content}
      </Link>
    );
  }

  return content;
};
