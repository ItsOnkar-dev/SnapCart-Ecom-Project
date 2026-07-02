const COLORS = {
  error: "\x1b[31m",
  warn: "\x1b[33m",
  info: "\x1b[32m",
  http: "\x1b[36m",
  debug: "\x1b[35m",
  reset: "\x1b[0m",
};

type LogLevel = "error" | "warn" | "info" | "http" | "debug";

const LEVELS: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const activeLevel = (): LogLevel =>
  process.env.NODE_ENV === "production" ? "warn" : "debug";

const shouldLog = (level: LogLevel): boolean =>
  LEVELS[level] <= LEVELS[activeLevel()];

const format = (level: LogLevel, message: string, meta?: unknown): string => {
  const ts = new Date().toISOString();
  const c = COLORS[level];
  const r = COLORS.reset;
  const extra = meta !== undefined ? " " + JSON.stringify(meta) : "";
  return `${c}[${ts}] [${level.toUpperCase()}] ${message}${extra}${r}`;
};

export const logger = {
  error: (message: string, meta?: unknown): void => {
    if (shouldLog("error")) console.error(format("error", message, meta));
  },
  warn: (message: string, meta?: unknown): void => {
    if (shouldLog("warn")) console.warn(format("warn", message, meta));
  },
  info: (message: string, meta?: unknown): void => {
    if (shouldLog("info")) console.log(format("info", message, meta));
  },
  http: (message: string, meta?: unknown): void => {
    if (shouldLog("http")) console.log(format("http", message, meta));
  },
  debug: (message: string, meta?: unknown): void => {
    if (shouldLog("debug")) console.log(format("debug", message, meta));
  },
};
