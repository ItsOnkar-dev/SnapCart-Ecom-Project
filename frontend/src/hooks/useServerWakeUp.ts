import { useCallback, useRef, useState } from "react";

type WakeUpStatus = "idle" | "waking" | "ready" | "failed";

interface UseServerWakeUpOptions {
  healthUrl: string;
  maxAttempts?: number;
  baseDelayMs?: number;
  timeoutMs?: number;
}

interface UseServerWakeUpResult {
  status: WakeUpStatus;
  attempt: number;
  maxAttempts: number;
  elapsedMs: number;
  wake: () => Promise<boolean>;
}

export function useServerWakeUp({
  healthUrl,
  maxAttempts = 6,
  baseDelayMs = 2000,
  timeoutMs = 8000,
}: UseServerWakeUpOptions): UseServerWakeUpResult {
  const [status, setStatus] = useState<WakeUpStatus>("idle");
  const [attempt, setAttempt] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const startTimeRef = useRef<number>(0);

  const wake = useCallback(async (): Promise<boolean> => {
    setStatus("waking");
    startTimeRef.current = Date.now();

    for (let i = 1; i <= maxAttempts; i++) {
      setAttempt(i);
      setElapsedMs(Date.now() - startTimeRef.current);

      try {
        const controller = new AbortController();
        // Kill this attempt if server doesn't respond in timeoutMs
        const timer = setTimeout(() => controller.abort(), timeoutMs);

        const res = await fetch(healthUrl, {
          signal: controller.signal,
          cache: "no-store", // never hit a cached response
        });

        clearTimeout(timer);

        if (res.ok) {
          setStatus("ready");
          setElapsedMs(Date.now() - startTimeRef.current);
          return true;
        }
      } catch (err) {
        const isOffline = err instanceof TypeError && !navigator.onLine;

        if (isOffline) {
          setStatus("failed");
          return false;
        }
      }

      if (i < maxAttempts) {
        // Exponential backoff: 2s, 4s, 8s, 8s, 8s (capped)
        const delay = Math.min(baseDelayMs * Math.pow(2, i - 1), 8000);
        await new Promise((r) => setTimeout(r, delay));
      }
    }

    setStatus("failed");
    return false;
  }, [healthUrl, maxAttempts, baseDelayMs, timeoutMs]);

  return { status, attempt, maxAttempts, elapsedMs, wake };
}
