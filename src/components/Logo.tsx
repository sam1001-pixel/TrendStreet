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

// Trend Street authentic logo lockups
const LOGO_SRC_MAP = {
  burgundy: "/trend-street-logo-burgundy.png",
  crimson: "/trend-street-logo-burgundy.png",
  ivory: "/trend-street-logo-white.png",
  gold: "/trend-street-logo-gold.png",
};

const LOGO_HEIGHT = {
  sm: "h-7 sm:h-8",
  md: "h-9 sm:h-11",
  lg: "h-12 sm:h-14",
  xl: "h-16 sm:h-20",
};

export const Logo: React.FC<LogoProps> = ({
  variant = "burgundy",
  size = "md",
  showTagline = false,
  className = "",
  href = "/",
}) => {
  const src = LOGO_SRC_MAP[variant] || LOGO_SRC_MAP.burgundy;
  const heightClass = LOGO_HEIGHT[size] || LOGO_HEIGHT.md;

  const content = (
    <span className={`inline-flex items-center justify-center select-none ${className}`}>
      <Image
        src={src}
        alt="Trend Street - The Style Hub"
        width={1179}
        height={779}
        className={`${heightClass} w-auto object-contain transition-transform duration-200 hover:scale-[1.02]`}
        priority
      />
    </span>
  );

  if (href) {
    return (
      <Link href={href} aria-label="Trend Street home" className="inline-flex items-center justify-center">
        {content}
      </Link>
    );
  }

  return content;
};
