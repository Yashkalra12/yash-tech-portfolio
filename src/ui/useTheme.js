/**
 * Light/dark theme, stored as `.dark` on <html>.
 *
 * Starts from whatever the OS says and only remembers a choice once one has been
 * made, so a visitor who has never touched the toggle keeps following their system
 * setting — including if they change it while the page is open.
 */

import { useCallback, useEffect, useState } from "react";

const KEY = "theme";

const systemPrefersDark = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;

const stored = () => {
  try {
    const value = localStorage.getItem(KEY);
    return value === "dark" || value === "light" ? value : null;
  } catch {
    // Private mode, or storage disabled. Fall back to the system preference.
    return null;
  }
};

const apply = (theme) => {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
};

export default function useTheme() {
  const [theme, setTheme] = useState(() => stored() ?? (systemPrefersDark() ? "dark" : "light"));

  useEffect(() => {
    apply(theme);
  }, [theme]);

  // Follow the OS until the visitor has expressed a preference of their own.
  useEffect(() => {
    if (stored()) return undefined;
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (event) => setTheme(event.matches ? "dark" : "light");
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  const toggle = useCallback(() => {
    setTheme((current) => {
      const next = current === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(KEY, next);
      } catch {
        // Not being able to remember it is not a reason to refuse to switch.
      }
      return next;
    });
  }, []);

  return { theme, toggle };
}
