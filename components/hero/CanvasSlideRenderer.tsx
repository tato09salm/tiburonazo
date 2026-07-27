"use client";

import Image from "next/image";
import Link from "next/link";
import type { CanvasSlideData, CanvasElement } from "@/components/admin/hero/canvas/types";

interface Props {
  data: CanvasSlideData;
  className?: string;
}

export function CanvasSlideRenderer({ data, className }: Props) {
  const { background, elements } = data;

  const bgStyle: React.CSSProperties = {};
  if (background.type === "color") {
    bgStyle.backgroundColor = background.color;
  }

  return (
    <div
      className={`relative w-full h-full overflow-hidden ${className || ""}`}
      style={bgStyle}
    >
      {/* Background image */}
      {background.type === "image" && background.imageUrl && (
        <Image
          src={background.imageUrl}
          alt=""
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
      )}

      {/* Gradient overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/20 to-transparent pointer-events-none" />

      {/* Elements */}
      {elements
        .filter((el) => el.visible)
        .sort((a, b) => a.zIndex - b.zIndex)
        .map((el) => (
          <CanvasElementRenderer key={el.id} element={el} />
        ))}
    </div>
  );
}

function CanvasElementRenderer({ element }: { element: CanvasElement }) {
  const style: React.CSSProperties = {
    position: "absolute",
    left: `${(element.x / 1440) * 100}%`,
    top: `${(element.y / 720) * 100}%`,
    width: `${(element.width / 1440) * 100}%`,
    height: `${(element.height / 720) * 100}%`,
    transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
    opacity: element.opacity,
  };

  switch (element.type) {
    case "text":
      return (
        <div
          style={{
            ...style,
            fontFamily: element.fontFamily,
            fontSize: `${(element.fontSize / 1440) * 100}vw`,
            fontWeight: element.fontWeight,
            fontStyle: element.fontStyle || undefined,
            color: element.textColor,
            textAlign: element.textAlign,
            letterSpacing: `${element.letterSpacing}px`,
            lineHeight: element.lineHeight,
            display: "flex",
            alignItems: "center",
          }}
        >
          <span
            className="inline-block drop-shadow-lg"
            style={{
              maxWidth: "100%",
              wordBreak: "break-word",
            }}
          >
            {element.text}
          </span>
        </div>
      );

    case "image":
    case "gif":
      return (
        <div style={style}>
          <Image
            src={element.src}
            alt=""
            fill
            className="object-contain drop-shadow-2xl"
            sizes="50vw"
          />
        </div>
      );

    case "button":
      return (
        <Link
          href={element.url || "#"}
          style={{
            ...style,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: element.backgroundColor,
            color: element.textColor,
            borderRadius: element.borderRadius,
            fontFamily: element.fontFamily,
            fontSize: `${(element.fontSize / 1440) * 100}vw`,
            fontWeight: element.fontWeight,
            textDecoration: "none",
            padding: `${(element.paddingY / 720) * 100}% ${(element.paddingX / 1440) * 100}%`,
            width: "auto",
            height: "auto",
            minWidth: `${(element.width / 1440) * 100}%`,
            minHeight: `${(element.height / 720) * 100}%`,
          }}
          className="hover:scale-105 transition-transform shadow-lg whitespace-nowrap"
        >
          {element.text}
        </Link>
      );

    default:
      return null;
  }
}
