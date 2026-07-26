import { RefreshCw, ShieldCheck, Star, Truck, Zap } from "lucide-react";
import { useEffect, useState } from "react";

const usps = [
  {
    icon: Truck,
    main: "Free shipping over ₹999",
    sub: "Pan-India delivery",
    badge: null,
  },
  {
    icon: ShieldCheck,
    main: "Razorpay secured checkout",
    sub: "256-bit encryption",
    badge: null,
  },
  {
    icon: RefreshCw,
    main: "365-day hassle-free returns",
    sub: "No questions asked",
    badge: null,
  },
  {
    icon: Star,
    main: "1,00,000+ happy customers",
    sub: "Rated 4.8 / 5",
    badge: null,
  },
  {
    icon: Zap,
    main: "Flash sale — 20% off electronics",
    sub: null,
    badge: "SNAP20",
  },
];

const StatusBar = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  const goTo = (idx: number) => {
    setVisible(false);
    setTimeout(() => {
      setCurrentIndex(idx);
      setVisible(true);
    }, 250);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      goTo((currentIndex + 1) % usps.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [currentIndex]);

  const current = usps[currentIndex];
  const Icon = current.icon;

  return (
    <div className="bg-gradient-hero py-2 px-4">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        {/* Left — static anchor */}
        <div className="hidden items-center gap-1.5 sm:flex shrink-0">
          <span className="text-xs">🇮🇳</span>
          <span className="text-[11px] text-white/45 tracking-wide">
            Made for India
          </span>
        </div>

        {/* Center — rotating USP */}
        <div className="flex flex-1 items-center justify-center gap-2.5 overflow-hidden">
          <div
            className="flex items-center gap-2.5 transition-all duration-250"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(-5px)",
            }}
          >
            {/* Icon pill */}
            <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-white/15">
              <Icon size={12} className=" text-white" />
            </span>

            {/* Main text */}
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white whitespace-nowrap">
              {current.main}
            </span>

            {/* Sub or badge */}
            {current.sub && (
              <>
                <span className="text-white/30 text-xs hidden sm:inline">
                  ·
                </span>
                <span className="hidden text-[11px] text-white/55 sm:inline whitespace-nowrap">
                  {current.sub}
                </span>
              </>
            )}
            {current.badge && (
              <span className="rounded-[3px] border border-white/20 bg-white/12 px-1.5 py-px text-[10px] font-bold tracking-[0.05em] text-white">
                {current.badge}
              </span>
            )}
          </div>
        </div>

        {/* Right — dots + CTA */}
        <div className="hidden items-center gap-1.5 sm:flex shrink-0">
          {usps.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goTo(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className="cursor-pointer transition-all duration-300"
              style={{
                height: "5px",
                width: idx === currentIndex ? "14px" : "5px",
                borderRadius: idx === currentIndex ? "3px" : "50%",
                background:
                  idx === currentIndex
                    ? "rgba(255,255,255,0.85)"
                    : "rgba(255,255,255,0.25)",
              }}
            />
          ))}
          <div className="mx-1.5 h-3 w-px bg-white/15" />

          <a
            href="/products"
            className="text-[11px] text-white/50 tracking-wide hover:text-white/80 transition-colors"
          >
            Shop now
          </a>
        </div>
      </div>
    </div>
  );
};

export default StatusBar;
