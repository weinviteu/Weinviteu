"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useLayoutEffect, Suspense } from "react";

function ScrollToTopWatcher() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Disable browser's automatic scroll restoration which remembers previous page scroll positions
  useEffect(() => {
    if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  const snapToTop = () => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    const prev = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    root.scrollTop = 0;
    document.body.scrollTop = 0;
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      root.scrollTop = 0;
      document.body.scrollTop = 0;
      root.style.scrollBehavior = prev;
    });
  };

  useLayoutEffect(() => {
    snapToTop();
  }, [pathname, searchParams]);

  useEffect(() => {
    snapToTop();
    const timer = setTimeout(snapToTop, 15);
    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  return null;
}

export default function ScrollToTop() {
  return (
    <Suspense fallback={null}>
      <ScrollToTopWatcher />
    </Suspense>
  );
}
