import { Logo } from "@/components/home/Logo";
import { AlertCircle, WifiOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Outlet } from "react-router";
import { useServerWakeUp } from "../hooks/useServerWakeUp";
import { useAuthStore } from "../store/auth.store";

const HEALTH_URL = `${import.meta.env.VITE_API_URL}/v1/health`;

const SNAPCART_TIPS = [
  { emoji: "⚡", text: "Lightning-fast checkouts with our secure gateway." },
  {
    emoji: "📦",
    text: "Track your items from warehouse straight to your door.",
  },
  { emoji: "🏷️", text: "Flash sales tailored directly to your cart choices." },
  { emoji: "🛒", text: "Save favorites now, checkout seamlessly anytime." },
];

const DOTS = 3;

export const AuthGate = () => {
  const initAuth = useAuthStore((s) => s.initAuth);
  const isAuthLoading = useAuthStore((s) => s.isAuthLoading);

  const [tipIndex, setTipIndex] = useState(0);
  const [dots, setDots] = useState(1);
  const [serverReady, setServerReady] = useState(false);
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false); // phase 2 — shows after 3s
  const didInit = useRef(false);

  const { status, attempt, maxAttempts, elapsedMs, wake } = useServerWakeUp({
    healthUrl: HEALTH_URL,
    maxAttempts: 6,
    baseDelayMs: 2000,
    timeoutMs: 8000,
  });

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setShowDetails(true), 3000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    wake().then((ok) => {
      if (ok) {
        setServerReady(true);
        initAuth();
      }
    });
  }, [wake, initAuth]);

  useEffect(() => {
    if (serverReady && !isAuthLoading) return;
    const interval = setInterval(
      () => setTipIndex((p) => (p + 1) % SNAPCART_TIPS.length),
      4000,
    );
    return () => clearInterval(interval);
  }, [serverReady, isAuthLoading]);

  useEffect(() => {
    if (serverReady && !isAuthLoading) return;
    const interval = setInterval(() => setDots((p) => (p % DOTS) + 1), 500);
    return () => clearInterval(interval);
  }, [serverReady, isAuthLoading]);

  if (serverReady && !isAuthLoading) return <Outlet />;

  const isColdStart = status === "waking";
  const elapsedSec = Math.round(elapsedMs / 1000);
  const progress = attempt > 0 ? attempt / maxAttempts : 0;
  const isAlmostDone = attempt >= maxAttempts - 1;
  const currentTip = SNAPCART_TIPS[tipIndex];

  if (status === "failed") {
    const isOffline = !navigator.onLine;
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="flex flex-col items-center text-center max-w-sm w-full space-y-5 animate-in zoom-in-95 duration-300">
          <BrandMark visible />
          <div className="w-full border border-destructive/20 bg-destructive/5 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-center gap-2 text-destructive text-sm font-semibold">
              {isOffline ? (
                <WifiOff className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <p>
                {isOffline ? "No Internet Connection" : "Server Unreachable"}
              </p>
            </div>
            <p className="text-xs text-muted-foreground/70 leading-relaxed">
              {isOffline
                ? "Please check your network connection and try again."
                : `Tried ${maxAttempts} times over ${Math.round(elapsedMs / 1000)}s. The server may be down or under high load.`}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-2 px-4 rounded-lg bg-indigo-500 hover:bg-indigo-600 active:scale-95 text-white text-xs font-semibold shadow-md shadow-indigo-500/10 transition-all cursor-pointer"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 overflow-hidden">
      <div
        className={`flex flex-col items-center justify-center text-center max-w-sm w-full space-y-6 transition-all duration-700 ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <BrandMark visible={visible} />

        <div className="relative flex items-center justify-center h-10 w-10">
          <div
            className="absolute inset-0 rounded-full bg-indigo-500/30 animate-ping"
            style={{ animationDuration: isAlmostDone ? "2s" : "1.2s" }}
          />
          <div className="absolute inset-0 rounded-full border-4 border-indigo-500/10" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-400 animate-spin" />
        </div>

        <div
          className={`flex flex-col items-center w-full gap-4 transition-all duration-700 ${
            showDetails
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-3 pointer-events-none"
          }`}
        >
          <div className="space-y-1 min-h-[52px] flex flex-col justify-center">
            {isColdStart ? (
              <>
                <p className="text-sm font-semibold text-foreground/80">
                  {isAlmostDone ? "Almost there" : "Waking up the server"}
                  {".".repeat(dots)}
                </p>
                <p className="text-[11px] text-muted-foreground/50">
                  This may take up to 30 seconds on the first load because we
                  are using the render's free hosting tier
                  {elapsedSec >= 5 && ` · ${elapsedSec}s`}
                  {attempt > 1 && ` · attempt ${attempt}/${maxAttempts}`}
                </p>
              </>
            ) : (
              <p className="text-sm font-semibold text-foreground/80">
                Signing you in{".".repeat(dots)}
              </p>
            )}
          </div>

          {isColdStart && (
            <div className="w-full max-w-[200px]">
              <div className="h-[3px] w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-400 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
            </div>
          )}

          <div
            key={tipIndex}
            className="flex items-center justify-center gap-2.5 bg-muted/30 border border-border/40 rounded-xl px-4 py-3 max-w-[400px] text-left animate-in fade-in slide-in-from-bottom-2 duration-500"
          >
            <span className="text-base leading-none mt-0.5 shrink-0">
              {currentTip.emoji}
            </span>
            <p className="text-[11px] text-muted-foreground/70 leading-relaxed">
              {currentTip.text}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

function BrandMark({ visible }: { visible: boolean }) {
  return (
    <div
      className={`flex flex-col items-center space-y-2 transition-all duration-500 delay-150 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
      }`}
    >
      <div className="inline-flex items-center gap-2.5 text-2xl font-black tracking-tight">
        <Logo />
      </div>
      <p className="text-sm font-semibold text-muted-foreground/60 tracking-wider uppercase">
        Your marketplace awaits
      </p>
    </div>
  );
}
