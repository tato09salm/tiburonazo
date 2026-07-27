import { cn } from "@/lib/utils";

interface WaveDividerProps {
  color?: string;
  flipped?: boolean;
  className?: string;
}

const WAVES: Record<string, string> = {
  default: "M0 60L60 50C120 40 240 20 360 15C480 10 600 20 720 25C840 30 960 30 1080 25C1200 20 1320 10 1380 5L1440 0V60H0Z",
};

export function WaveDivider({ color = "#f8fbff", flipped = false, className }: WaveDividerProps) {
  return (
    <div className={cn("pointer-events-none overflow-hidden leading-none", className)}>
      <svg
        viewBox="0 0 1440 60"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full"
        style={{ transform: flipped ? "rotateX(180deg)" : undefined, display: "block" }}
      >
        <path d={WAVES.default} fill={color} />
      </svg>
    </div>
  );
}
