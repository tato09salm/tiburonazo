interface WaterEffectProps {
  waveColor?: string;
  gradientFrom?: string;
  gradientTo?: string;
}

function Bubble({ delay, size, left, duration }: { delay: number; size: number; left: number; duration: number }) {
  return (
    <div
      className="absolute rounded-full bg-white/10"
      style={{
        width: size,
        height: size,
        left: `${left}%`,
        bottom: 0,
        animation: `water-bubble-rise ${duration}s ease-in-out ${delay}s infinite`,
      }}
    />
  );
}

export function WaterEffect({
  waveColor = "#f8fbff",
  gradientFrom = "transparent",
  gradientTo = "rgba(17, 171, 196, 0.08)",
}: WaterEffectProps) {
  return (
    <>
      <style>{`
        @keyframes water-wave-1 {
          0% { transform: translateX(0) scaleY(1); }
          50% { transform: translateX(-60px) scaleY(1.1); }
          100% { transform: translateX(0) scaleY(1); }
        }
        @keyframes water-wave-2 {
          0% { transform: translateX(0) scaleY(1); }
          50% { transform: translateX(40px) scaleY(0.9); }
          100% { transform: translateX(0) scaleY(1); }
        }
        @keyframes water-bubble-rise {
          0% { transform: translateY(0) scale(1); opacity: 0; }
          10% { opacity: 0.4; }
          90% { opacity: 0.3; }
          100% { transform: translateY(-400px) scale(0.3); opacity: 0; }
        }
      `}</style>

      {/* Background gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(to top, ${gradientTo}, ${gradientFrom})`,
        }}
      />

      {/* Bubbles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <Bubble delay={0} size={8} left={10} duration={18} />
        <Bubble delay={3} size={5} left={25} duration={22} />
        <Bubble delay={7} size={12} left={45} duration={20} />
        <Bubble delay={2} size={6} left={60} duration={25} />
        <Bubble delay={9} size={10} left={75} duration={17} />
        <Bubble delay={5} size={4} left={85} duration={21} />
        <Bubble delay={11} size={7} left={35} duration={19} />
        <Bubble delay={4} size={9} left={55} duration={23} />
        <Bubble delay={8} size={5} left={15} duration={16} />
        <Bubble delay={6} size={11} left={70} duration={24} />
      </div>

      {/* Double wave */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none overflow-hidden leading-none" style={{ height: 80 }}>
        {/* Wave 1 (back) - slower, wider */}
        <svg
          viewBox="0 0 1440 80"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute w-[105%]"
          style={{
            bottom: 0,
            animation: `water-wave-1 25s ease-in-out infinite`,
            opacity: 0.5,
          }}
        >
          <path
            d="M0 40C240 60 480 10 720 30C960 50 1200 15 1440 35V80H0Z"
            fill={waveColor}
          />
        </svg>

        {/* Wave 2 (front) - parallax, different speed */}
        <svg
          viewBox="0 0 1440 80"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute w-[105%]"
          style={{
            bottom: 0,
            animation: `water-wave-2 20s ease-in-out infinite`,
          }}
        >
          <path
            d="M0 50C180 30 360 55 540 40C720 25 900 50 1080 35C1260 20 1350 40 1440 30V80H0Z"
            fill={waveColor}
          />
        </svg>
      </div>
    </>
  );
}
