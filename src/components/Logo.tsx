import React from "react";
import Link from "next/link";
import Image from "next/image";

interface LogoProps {
  variant?: "burgundy" | "ivory" | "gold" | "crimson";
  size?: "sm" | "md" | "lg" | "xl";
  showTagline?: boolean;
  className?: string;
  href?: string;
}

export const Logo: React.FC<LogoProps> = ({
  variant = "burgundy",
  size = "md",
  className = "",
  href = "/",
}) => {
  const logoSrcMap = {
    burgundy: "/trend-street-logo-burgundy.png",
    crimson: "/trend-street-logo-burgundy.png",
    ivory: "/trend-street-logo-white.png",
    gold: "/trend-street-logo-gold.png",
  };

  const dimensionsMap = {
    sm: { width: 140, height: 42, imgClass: "h-8 sm:h-9 w-auto" },
    md: { width: 180, height: 54, imgClass: "h-10 sm:h-12 w-auto" },
    lg: { width: 240, height: 72, imgClass: "h-14 sm:h-16 w-auto" },
    xl: { width: 320, height: 96, imgClass: "h-20 sm:h-24 w-auto" },
  };

  const src = logoSrcMap[variant] || logoSrcMap.burgundy;
  const dim = dimensionsMap[size] || dimensionsMap.md;

  const content = (
    <div className={`inline-flex items-center justify-center select-none group transition-transform duration-300 hover:scale-[1.02] ${className}`}>
      {/* Genuine Trend Street - The Style Hub Logo */}
      <Image
        src={src}
        alt="Trend Street - The Style Hub"
        width={dim.width}
        height={dim.height}
        className={`${dim.imgClass} object-contain transition-opacity duration-200`}
        priority
      />
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center justify-center focus:outline-none">
        {content}
      </Link>
    );
  }

  return content;
};
