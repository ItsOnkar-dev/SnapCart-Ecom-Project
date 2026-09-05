import { Moon, Sun } from "lucide-react";
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
