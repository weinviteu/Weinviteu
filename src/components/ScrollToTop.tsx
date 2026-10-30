"use client";

import { useLayoutEffect } from "react";

// Mounted by the route loading screen: a new page starts at the top straight away,
// instead of keeping the previous page's scroll position (which landed on the footer).
export default function ScrollToTop() {
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);
  return null;
}
