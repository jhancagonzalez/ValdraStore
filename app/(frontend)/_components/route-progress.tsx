"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const SAFETY_TIMEOUT_MS = 8000;

/**
 * Thin progress line shown while an internal navigation or a GET form submit is
 * in flight. Next has no global router events, so we observe the two entry
 * points (links and form submits) and hide the bar when the route commits.
 */
export const RouteProgress = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [active, setActive] = useState(false);
  const timer = useRef<number | null>(null);
  const lastRoute = useRef<string | null>(null);

  const stop = useCallback(() => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
    setActive(false);
  }, []);

  const start = useCallback(() => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
    }
    setActive(true);
    timer.current = window.setTimeout(stop, SAFETY_TIMEOUT_MS);
  }, [stop]);

  useEffect(() => {
    // Hide the bar whenever the route actually commits.
    const route = `${pathname}?${searchParams.toString()}`;
    if (lastRoute.current === route) {
      return;
    }
    lastRoute.current = route;
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
    setActive(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const plainLeftClick =
        event.button === 0 &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.shiftKey &&
        !event.altKey &&
        !event.defaultPrevented;
      if (!plainLeftClick) {
        return;
      }
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }
      const anchor = target.closest("a[href]");
      if (
        !(anchor instanceof HTMLAnchorElement) ||
        anchor.getAttribute("target") === "_blank" ||
        anchor.hasAttribute("download")
      ) {
        return;
      }
      const href = anchor.getAttribute("href") ?? "";
      if (!href || href.startsWith("#")) {
        return;
      }
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) {
        return;
      }
      if (url.pathname === window.location.pathname && url.search === window.location.search) {
        return;
      }
      start();
    };

    const onSubmit = (event: SubmitEvent) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) {
        return;
      }
      if ((form.getAttribute("method") ?? "get").toLowerCase() !== "get") {
        return;
      }
      const action = new URL(
        form.getAttribute("action") || window.location.href,
        window.location.href,
      );
      if (action.origin !== window.location.origin) {
        return;
      }
      start();
    };

    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onSubmit, true);
    };
  }, [start]);

  return (
    <div className={active ? "route-progress is-active" : "route-progress"} aria-hidden="true" />
  );
};
