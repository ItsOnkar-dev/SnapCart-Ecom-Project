import { ChevronRight, Moon, Sun, SunMoon } from "lucide-react";
import { useEffect, useState } from "react";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({
  className = "",
  showLabel = true,
}: ThemeToggleProps) {
  const [isLight, setIsLight] = useState(() =>
    document.documentElement.classList.contains("light"),
  );

  useEffect(() => {
    const handler = () => {
      setIsLight(document.documentElement.classList.contains("light"));
    };
    window.addEventListener("theme-change", handler);
    return () => window.removeEventListener("theme-change", handler);
  }, []);

  const toggle = () => {
    const next = !document.documentElement.classList.contains("light");
    document.documentElement.classList.toggle("light", next);
    localStorage.setItem("snapcart-theme", next ? "light" : "dark");
    setIsLight(next);
    window.dispatchEvent(new Event("theme-change"));
  };

  return (
    <button
      onClick={toggle}
      className={`flex items-center gap-2.5 cursor-pointer ${className}`}
      aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
    >
      {isLight ? (
        <Moon className="w-5 h-5 text-foreground hover:text-nav-hover" />
      ) : (
        <Sun className="w-5 h-5 text-foreground hover:text-orange-200" />
      )}
      {showLabel && <span>{isLight ? "Dark Mode" : "Light Mode"}</span>}
    </button>
  );
}

interface AppearanceRowProps {
  className?: string;
  variant?: "sidebar" | "dropdown";
}

export function AppearanceRow({
  className = "",
  variant = "sidebar",
}: AppearanceRowProps) {
  const [isLight, setIsLight] = useState(() =>
    document.documentElement.classList.contains("light"),
  );
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const handler = () => {
      setIsLight(document.documentElement.classList.contains("light"));
    };
    window.addEventListener("theme-change", handler);
    return () => window.removeEventListener("theme-change", handler);
  }, []);

  const apply = (light: boolean) => {
    document.documentElement.classList.toggle("light", light);
    localStorage.setItem("snapcart-theme", light ? "light" : "dark");
    setIsLight(light);
    window.dispatchEvent(new Event("theme-change"));
    setExpanded(false);
  };

  const sidebarTriggerStyles =
    "w-full group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-foreground/60 hover:text-foreground hover:bg-white/5 transition-colors duration-200 cursor-pointer";
  const sidebarOptionContainer =
    "flex flex-col gap-1 mt-2 pl-5 pr-1 overflow-hidden w-full transition-all duration-300 ease-in-out";
  const sidebarOptionButton = (active: boolean) =>
    `flex items-center cursor-pointer gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left ${
      active
        ? "bg-primary/10 text-primary font-semibold"
        : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
    }`;

  const dropdownTriggerStyles =
    "w-full group flex items-center justify-between px-3 py-2 gap rounded-full text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-200 cursor-pointer";
  const dropdownOptionContainer =
    "flex flex-col gap-1 mt-2 pl-4 pr-1 overflow-hidden w-full transition-all duration-300 ease-in-out";
  const dropdownOptionButton = (active: boolean) =>
    `flex items-center cursor-pointer gap-2.5 px-2.5 py-2 rounded-md text-xs transition-colors text-left ${
      active
        ? "bg-accent text-accent-foreground font-semibold"
        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
    }`;

  const isSidebar = variant === "sidebar";
  const triggerStyles = isSidebar
    ? sidebarTriggerStyles
    : dropdownTriggerStyles;
  const optionContainerStyles = isSidebar
    ? sidebarOptionContainer
    : dropdownOptionContainer;
  const optionButtonStyles = isSidebar
    ? sidebarOptionButton
    : dropdownOptionButton;

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className={triggerStyles}
      >
        <div className="flex items-center gap-2">
          <SunMoon className="w-5 h-5 opacity-60 group-hover:opacity-100 transition-opacity shrink-0" />
          <span className="font-medium">Appearance</span>
        </div>

        <div className="flex items-center gap-2.5">
          {!expanded && (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground/70 group-hover:text-foreground transition-colors duration-200">
              {isLight ? (
                <>
                  <Sun className="w-3.5 h-3.5" /> Light
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5" /> Dark
                </>
              )}
            </span>
          )}
          <ChevronRight
            className={`w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-foreground transition-all duration-200 shrink-0
                      ${expanded ? "rotate-90" : ""}`}
          />
        </div>
      </button>

      <div
        className={`${optionContainerStyles} ${
          expanded
            ? "max-h-24 opacity-100"
            : "max-h-0 opacity-0 pointer-events-none"
        }`}
      >
        <button
          type="button"
          onClick={() => apply(false)}
          className={optionButtonStyles(!isLight)}
        >
          <Moon className="w-4 h-4 shrink-0" />
          Dark
          {!isLight && (
            <span
              className={`ml-auto text-[10px] font-bold ${isSidebar ? "text-primary" : "text-foreground"}`}
            >
              Active
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => apply(true)}
          className={optionButtonStyles(isLight)}
        >
          <Sun className="w-4 h-4 shrink-0" />
          Light
          {isLight && (
            <span
              className={`ml-auto text-[10px] font-bold ${isSidebar ? "text-primary" : "text-foreground"}`}
            >
              Active
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
