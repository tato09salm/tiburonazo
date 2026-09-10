"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

interface HeroSlideContentProps {
  title: string;
  subtitle?: string | null;
  description?: string | null;
  badge?: string | null;
  button1Text?: string | null;
  button1Url?: string | null;
  button2Text?: string | null;
  button2Url?: string | null;
  imageUrl?: string | null;
  gifUrl?: string | null;
  backgroundImageUrl?: string | null;
  backgroundColor?: string | null;
  textColor: string;
  buttonColor: string;
  contentPosition: "LEFT" | "CENTER" | "RIGHT";
  className?: string;
  backgroundSizes?: string;
  mediaSizes?: string;
}

export function HeroSlideContent({
  title,
  subtitle,
  description,
  badge,
  button1Text,
  button1Url,
  button2Text,
  button2Url,
  imageUrl,
  gifUrl,
  backgroundImageUrl,
  backgroundColor,
  textColor,
  buttonColor,
  contentPosition,
  className,
  backgroundSizes = "100vw",
  mediaSizes = "(max-width: 768px) 50vw, 45vw",
}: HeroSlideContentProps) {
  const hasMedia = !!(imageUrl || gifUrl);
  const mediaUrl = gifUrl || imageUrl;
  const isCentered = contentPosition === "CENTER";

  return (
    <div className={cn("relative w-full h-full overflow-hidden", className)}>
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden">
        {backgroundColor && (
          <div className="absolute inset-0" style={{ backgroundColor }} />
        )}
        {backgroundImageUrl && (
          <div className="absolute inset-x-0 top-0 bottom-6 sm:bottom-8 md:bottom-10 lg:bottom-12">
            <Image
              src={backgroundImageUrl}
              alt=""
              fill
              className="object-contain"
              priority
              sizes={backgroundSizes}
            />
          </div>
        )}
      </div>
      {!backgroundImageUrl && backgroundColor && (
        <div className="absolute inset-0" style={{ backgroundColor }} />
      )}

      {/* Gradient overlay for readability when there's content */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/20 to-black/10" />

      {/* Content */}
      <div
        className={cn(
          "relative z-10 h-full flex items-center px-6 pt-12 pb-10 md:px-12 md:pt-16 md:pb-12 lg:px-16 lg:pt-20 lg:pb-14",
          isCentered ? "justify-center text-center" : contentPosition === "RIGHT" ? "justify-end text-right" : "justify-start text-left"
        )}
      >
        <div className={cn(
          "flex flex-col gap-3 md:gap-4",
          isCentered ? "items-center max-w-2xl" : hasMedia ? "max-w-[55%] lg:max-w-[48%]" : "max-w-2xl"
        )}>
          {badge && (
            <span
              className="inline-block bg-white/20 backdrop-blur-md border border-white/30 text-xs md:text-sm font-semibold px-3 py-1 md:px-4 md:py-1.5 rounded-full uppercase tracking-widest animate-fade-in"
              style={{ color: textColor, borderColor: `${textColor}40` }}
            >
              {badge}
            </span>
          )}

          {title && (
            <h1
              className="font-display text-4xl md:text-5xl lg:text-7xl font-bold leading-tight"
              style={{ color: textColor }}
            >
              {title}
            </h1>
          )}

          {subtitle && (
            <h2
              className="text-xl md:text-2xl lg:text-3xl font-semibold"
              style={{ color: textColor }}
            >
              {subtitle}
            </h2>
          )}

          {description && (
            <p
              className="text-sm md:text-base lg:text-lg max-w-lg opacity-90"
              style={{ color: textColor }}
            >
              {description}
            </p>
          )}

          {(button1Text || button2Text) && (
            <div className={cn(
              "flex flex-wrap gap-3 mt-2",
              isCentered ? "justify-center" : contentPosition === "RIGHT" ? "justify-end" : "justify-start"
            )}>
              {button1Text && (
                <Link
                  href={button1Url || "#"}
                  className="inline-flex items-center gap-2 font-bold px-6 py-3 md:px-8 md:py-3 rounded-xl text-sm md:text-base transition-all hover:shadow-lg hover:scale-105 active:scale-95"
                  style={{
                    backgroundColor: buttonColor,
                    color: "#FFFFFF",
                  }}
                >
                  {button1Text}
                </Link>
              )}
              {button2Text && (
                <Link
                  href={button2Url || "#"}
                  className="inline-flex items-center gap-2 font-bold px-6 py-3 md:px-8 md:py-3 rounded-xl text-sm md:text-base transition-all hover:shadow-lg hover:scale-105 active:scale-95"
                  style={{
                    backgroundColor: "transparent",
                    color: textColor,
                    border: `2px solid ${textColor}`,
                  }}
                >
                  {button2Text}
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Media (image/GIF) */}
      {mediaUrl && (
        <div className={cn(
          "absolute top-[10%] bottom-[8%] right-0 w-[30%] sm:w-[26%] md:w-[20%] lg:w-[17%] xl:w-[15%] flex items-center justify-center pr-1 md:pr-2",
          isCentered ? "hidden" : contentPosition === "RIGHT" ? "left-0" : "right-0"
        )}>
          <div className="relative w-full h-full max-h-[80%]">
            <Image
              src={mediaUrl}
              alt={title || "Slide image"}
              fill
              className="object-contain object-right drop-shadow-2xl"
              priority
              sizes={mediaSizes}
            />
          </div>
        </div>
      )}
    </div>
  );
}
