import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";

const IOS_SAFARI_CLASS = "is-ios-safari";

function getUserAgent(): string {
  return typeof navigator === "undefined" ? "" : navigator.userAgent || "";
}

export function isIosDevice(): boolean {
  if (typeof navigator === "undefined") return false;

  const ua = getUserAgent();
  const platform = navigator.platform || "";
  const maxTouchPoints = navigator.maxTouchPoints || 0;

  return /iPad|iPhone|iPod/i.test(ua) || /iPad|iPhone|iPod/i.test(platform) || (platform === "MacIntel" && maxTouchPoints > 1);
}

export function isIosSafari(): boolean {
  if (typeof navigator === "undefined") return false;

  const ua = getUserAgent();
  const vendor = navigator.vendor || "";
  const isSafari = /Safari/i.test(ua);
  const isWebKit = /AppleWebKit/i.test(ua);
  const isOtherIosBrowser = /CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo|YaBrowser/i.test(ua);

  return isIosDevice() && isWebKit && isSafari && !isOtherIosBrowser && (!vendor || /Apple/i.test(vendor));
}

export function isIosWebKit(): boolean {
  return isIosDevice() && /AppleWebKit/i.test(getUserAgent());
}

function readViewportHeight(): number {
  if (typeof window === "undefined") return 0;
  const visualHeight = window.visualViewport?.height || 0;
  const innerHeight = window.innerHeight || 0;
  const documentHeight = document.documentElement?.clientHeight || 0;

  return Math.round(visualHeight || innerHeight || documentHeight);
}

export function useIosSafariDetection() {
  return useMemo(
    () => ({
      isIosSafari: isIosSafari(),
      isIosWebKit: isIosWebKit(),
    }),
    [],
  );
}

export function useIosSafariClass(enabled: boolean): void {
  useEffect(() => {
    if (typeof document === "undefined" || !enabled) return;

    document.documentElement.classList.add(IOS_SAFARI_CLASS);
    return () => document.documentElement.classList.remove(IOS_SAFARI_CLASS);
  }, [enabled]);
}

export function useIosWebKitViewportHeight(enabled: boolean): number | null {
  const [height, setHeight] = useState<number | null>(() => (enabled && typeof window !== "undefined" ? readViewportHeight() : null));

  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      setHeight(null);
      return;
    }

    let frame: number | null = null;
    const update = () => {
      if (frame != null) window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => setHeight(readViewportHeight()));
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    window.visualViewport?.addEventListener("resize", update);
    window.visualViewport?.addEventListener("scroll", update);

    return () => {
      if (frame != null) window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
      window.visualViewport?.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("scroll", update);
    };
  }, [enabled]);

  return height;
}

export function withWebkitBackdropFilter(blur: string): CSSProperties {
  return {
    backdropFilter: `blur(${blur})`,
    WebkitBackdropFilter: `blur(${blur})`,
  } as CSSProperties;
}

export function scrollToElementForBrowser(element: HTMLElement | null, useInstantScroll: boolean, offset = 72): void {
  if (!element || typeof window === "undefined") return;

  const top = Math.max(element.getBoundingClientRect().top + window.scrollY - offset, 0);

  if (useInstantScroll) {
    window.scrollTo(0, top);
    return;
  }

  try {
    element.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch {
    window.scrollTo(0, top);
  }
}
