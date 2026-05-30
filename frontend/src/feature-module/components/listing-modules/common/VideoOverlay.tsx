import { useEffect, useState } from "react";
import { resolveMediaUrl } from "./funnelUtils";
import { isIosWebKit, withWebkitBackdropFilter } from "./iosSafari";

const DIRECT_VIDEO_RE = /\.(mp4|m4v|mov|webm|ogv|ogg)(?:[?#].*)?$/i;

function isDirectVideoUrl(url: string): boolean {
  const raw = String(url || "").trim();
  return DIRECT_VIDEO_RE.test(raw) || raw.startsWith("/public/");
}

function appendQueryParams(url: string, params: string): string {
  const [baseAndQuery, hash = ""] = url.split("#");
  const separator = baseAndQuery.includes("?") ? "&" : "?";
  return `${baseAndQuery}${separator}${params}${hash ? `#${hash}` : ""}`;
}

/**
 * Converts any YouTube/Vimeo URL to an embeddable URL.
 * Supports: youtube.com/watch, youtu.be, youtube.com/shorts, youtube.com/embed, vimeo.
 */
export function toEmbedUrl(url: string): string {
  const raw = String(url || "").trim();
  if (!raw) return "";
  if (isDirectVideoUrl(raw)) return "";
  if (raw.includes("youtube.com/embed/")) return raw;
  // YouTube Shorts
  if (raw.includes("youtube.com/shorts/")) {
    const id = raw.split("youtube.com/shorts/")[1]?.split(/[?&#]/)[0];
    return id ? `https://www.youtube.com/embed/${id}` : raw;
  }
  // youtu.be short links
  if (raw.includes("youtu.be/")) {
    const id = raw.split("youtu.be/")[1]?.split(/[?&#]/)[0];
    return id ? `https://www.youtube.com/embed/${id}` : raw;
  }
  // youtube.com/watch?v=
  if (raw.includes("youtube.com/watch")) {
    const q = raw.split("?")[1] || "";
    const id = new URLSearchParams(q).get("v");
    return id ? `https://www.youtube.com/embed/${id}` : raw;
  }
  // Vimeo
  const vm = raw.match(/vimeo\.com\/(\d+)/);
  if (vm?.[1]) return `https://player.vimeo.com/video/${vm[1]}`;
  return raw;
}

/**
 * Detects if a video URL is a YouTube Short (vertical format).
 */
export function isShortVideo(url: string): boolean {
  const raw = String(url || "").trim();
  return raw.includes("youtube.com/shorts/");
}

export function toDirectVideoUrl(url: string): string {
  const raw = String(url || "").trim();
  return isDirectVideoUrl(raw) ? resolveMediaUrl(raw) : "";
}

/**
 * VideoOverlay — fullscreen-like modal that shows the first video of a property.
 * - Dark semi-transparent backdrop (click to dismiss)
 * - Video centered, responsive sizing
 * - Auto-shows on mount if `autoShow` is true
 */
interface VideoOverlayProps {
  videoUrl: string;
  autoShow?: boolean;
  onClose?: () => void;
}

export function VideoOverlay({ videoUrl, autoShow = true, onClose }: VideoOverlayProps) {
  const iosWebKit = isIosWebKit();
  const shouldAutoShow = autoShow && !iosWebKit;
  const [visible, setVisible] = useState(shouldAutoShow);
  const directVideoUrl = toDirectVideoUrl(videoUrl);
  const embedUrl = toEmbedUrl(videoUrl);
  const isVertical = isShortVideo(videoUrl);

  useEffect(() => {
    setVisible(shouldAutoShow);
  }, [shouldAutoShow, videoUrl]);

  useEffect(() => {
    if (!visible) return;
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [visible]);

  const handleClose = () => {
    setVisible(false);
    onClose?.();
  };

  if (!visible || (!embedUrl && !directVideoUrl)) return null;

  return (
    <div
      onClick={handleClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.82)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        padding: 20,
        animation: "fadeIn 0.25s ease",
        }}
      >
      <div
        style={{
          position: "absolute",
          inset: 0,
          ...withWebkitBackdropFilter("1px"),
        }}
      />
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          width: isVertical ? "min(380px, 90vw)" : "min(900px, 92vw)",
          maxHeight: "88vh",
          aspectRatio: isVertical ? "9/16" : "16/9",
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0 12px 60px rgba(0,0,0,0.5)",
          cursor: "default",
        }}
      >
        {directVideoUrl ? (
          <video
            src={directVideoUrl}
            controls
            playsInline
            autoPlay={shouldAutoShow}
            muted={shouldAutoShow}
            preload="metadata"
            style={{ width: "100%", height: "100%", background: "#000", display: "block" }}
          />
        ) : (
          <iframe
            src={appendQueryParams(embedUrl, `${shouldAutoShow ? "autoplay=1&" : ""}rel=0&playsinline=1`)}
            title="Video propiedad"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            style={{ width: "100%", height: "100%", border: 0 }}
          />
        )}
        {/* Close button */}
        <button
          onClick={handleClose}
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "rgba(0,0,0,0.6)",
            border: "none",
            color: "#fff",
            fontSize: 20,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            lineHeight: 1,
          }}
          aria-label="Cerrar video"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

/**
 * VideoSection — renders video embeds in the detail page.
 * Handles both horizontal (16:9) and vertical/Shorts (9:16) aspect ratios.
 */
interface VideoSectionProps {
  videoUrls: string[];
  accentColor: string;
  SectionHeader: React.ComponentType<{ title: string; accent: string }>;
}

export function VideoSection({ videoUrls, accentColor, SectionHeader }: VideoSectionProps) {
  if (!videoUrls || videoUrls.length === 0) return null;

  return (
    <div className="mb-5">
      <SectionHeader title="Video tour" accent={accentColor} />
      <div className="d-flex flex-column gap-3">
        {videoUrls.map((url, i) => {
          const directVideo = toDirectVideoUrl(url);
          const embed = toEmbedUrl(url);
          if (!embed && !directVideo) return null;
          const vertical = isShortVideo(url);
          return (
            <div
              key={i}
              className="rounded-3 overflow-hidden"
              style={{
                boxShadow: "0 4px 24px rgba(0,0,0,0.1)",
                width: vertical ? "min(380px, 100%)" : "100%",
                aspectRatio: vertical ? "9/16" : "16/9",
                margin: vertical ? "0 auto" : undefined,
              }}
            >
              {directVideo ? (
                <video
                  src={directVideo}
                  controls
                  playsInline
                  preload="metadata"
                  style={{ width: "100%", height: "100%", background: "#000", display: "block" }}
                />
              ) : (
                <iframe
                  src={appendQueryParams(embed, "rel=0&playsinline=1")}
                  title={`Video ${i + 1}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  style={{ width: "100%", height: "100%", border: 0 }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
