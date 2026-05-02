"use client";

import { extractFlowSlides, type FlowSlide } from "@/lib/extractFlowSlides";
import {
  FLOWS,
  getFlowById,
  type FlowDefinition,
} from "@/lib/flow-definitions";
import { useRouter, useSearchParams } from "next/navigation";
import type { JSX } from "react";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import styles from "./play.module.css";

const PLAY_INTERVAL_MS = 2800;

function buildIframeDocument(slideHtml: string, origin: string): string {
  const cssHref = `${origin}/flows/flows.css`;
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><link rel="stylesheet" href="${cssHref}"/><meta name="viewport" content="width=device-width, initial-scale=1"/></head><body style="margin:0;background:#F4F5F7;display:flex;justify-content:center;align-items:flex-start;padding:40px 24px;box-sizing:border-box;min-height:100vh">${slideHtml}</body></html>`;
}

const noopSubscribe = (): (() => void) => (): void => {};

function readOriginSnapshot(): string {
  return typeof window === "undefined" ? "" : window.location.origin;
}

function useOrigin(): string {
  return useSyncExternalStore(noopSubscribe, readOriginSnapshot, () => "");
}

function useIframeBlobSrc(html: string, origin: string): string | null {
  const src = useMemo((): string | null => {
    if (!origin || html.length === 0) return null;
    const blob = new Blob([buildIframeDocument(html, origin)], {
      type: "text/html;charset=utf-8",
    });
    return URL.createObjectURL(blob);
  }, [html, origin]);

  useEffect(() => {
    return (): void => {
      if (src) URL.revokeObjectURL(src);
    };
  }, [src]);

  return src;
}

function PlayViewportInner(): JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryFlow = searchParams.get("flow");
  const origin = useOrigin();

  const resolvedFlow: FlowDefinition = useMemo(() => {
    return getFlowById(queryFlow) ?? FLOWS[0];
  }, [queryFlow]);

  const [slides, setSlides] = useState<FlowSlide[]>([]);
  const [slideIndex, setSlideIndex] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(true);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (queryFlow == null || getFlowById(queryFlow) === undefined) {
      router.replace(`/play?flow=${encodeURIComponent(FLOWS[0].id)}`, {
        scroll: false,
      });
    }
  }, [queryFlow, router]);

  useEffect(() => {
    let cancelled = false;
    async function load(): Promise<void> {
      setFetching(true);
      setLoadError(null);
      setPlaying(false);
      try {
        const res = await fetch(`/flows/${resolvedFlow.file}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        const nextSlides = extractFlowSlides(text);
        if (cancelled) return;
        setSlides(nextSlides);
        setSlideIndex(0);
      } catch (e) {
        if (cancelled) return;
        setSlides([]);
        setLoadError(e instanceof Error ? e.message : "Failed to load flow");
      } finally {
        if (!cancelled) setFetching(false);
      }
    }
    load();
    return (): void => {
      cancelled = true;
    };
  }, [resolvedFlow.file]);

  const maxSlide = slides.length > 0 ? slides.length - 1 : 0;
  const activeIndex = slides.length === 0 ? 0 : Math.min(slideIndex, maxSlide);
  const currentSlide = slides[activeIndex] ?? null;

  const iframeSrc = useIframeBlobSrc(currentSlide?.html ?? "", origin);

  useEffect(() => {
    if (!playing || slides.length <= 1) return;
    const id = window.setInterval(() => {
      setSlideIndex((i) => {
        const next = i + 1;
        if (next >= slides.length) {
          window.setTimeout(() => {
            setPlaying(false);
          }, 0);
          return i;
        }
        return next;
      });
    }, PLAY_INTERVAL_MS);
    return (): void => {
      window.clearInterval(id);
    };
  }, [playing, slides.length]);

  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      if (slides.length === 0) return;
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      )
        return;
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        setPlaying(false);
        setSlideIndex((i) => Math.min(i + 1, slides.length - 1));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setPlaying(false);
        setSlideIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Escape") {
        setPlaying(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return (): void => window.removeEventListener("keydown", onKey);
  }, [slides.length]);

  const onFlowChange = useCallback(
    (id: string): void => {
      const next = getFlowById(id);
      if (!next) return;
      router.replace(`/play?flow=${encodeURIComponent(next.id)}`, {
        scroll: false,
      });
    },
    [router],
  );

  const goPrev = (): void => {
    setPlaying(false);
    setSlideIndex((i) => Math.max(i - 1, 0));
  };

  const goNext = (): void => {
    setPlaying(false);
    setSlideIndex((i) => Math.min(i + 1, slides.length - 1));
  };

  const progressPct =
    slides.length > 0 ? ((activeIndex + 1) / slides.length) * 100 : 0;

  return (
    <div className={styles.shell}>
      <div className={styles.topBar}>
        <div className={styles.titleBlock}>
          <h1>Flow play mode</h1>
          <p>
            Figma-style stepping through screens — pick a journey, then use Prev
            / Next or Play. Arrow keys (← →), Space for next.&nbsp;
            <a href="/flows/index.html">Static canvas →</a>
          </p>
        </div>
        <div className={styles.controls}>
          <label className={styles.srOnly} htmlFor="flow-select">
            Select flow
          </label>
          <select
            id="flow-select"
            className={styles.select}
            value={resolvedFlow.id}
            onChange={(e) => onFlowChange(e.target.value)}
          >
            {FLOWS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.title}
              </option>
            ))}
          </select>
          <button
            type="button"
            className={styles.btn}
            onClick={goPrev}
            disabled={slides.length === 0 || activeIndex <= 0}
          >
            ← Prev
          </button>
          <button
            type="button"
            className={styles.btn}
            onClick={goNext}
            disabled={slides.length === 0 || activeIndex >= slides.length - 1}
          >
            Next →
          </button>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnPlay} ${playing ? styles.btnPlayActive : ""}`}
            onClick={() => setPlaying((p) => !p)}
            disabled={slides.length <= 1}
          >
            {playing ? "Pause" : "Play"}
          </button>
        </div>
      </div>

      <div className={styles.stageCard}>
        <div className={styles.chrome}>
          <span className={styles.stepLabel}>Screen</span>
          <strong title={currentSlide?.label ?? ""}>
            {fetching ? "Loading…" : currentSlide?.label ?? "—"}
          </strong>
          <span className={styles.counter}>
            {slides.length === 0
              ? "—"
              : `${activeIndex + 1} / ${slides.length}`}
          </span>
        </div>
        <div
          className={styles.progressTrack}
          aria-hidden
        >
          <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
        </div>
        <div className={styles.frameWrap}>
          {loadError !== null ? (
            <div className={styles.errorBox} role="alert">
              Could not load this flow ({loadError}).
            </div>
          ) : fetching ? (
            <div className={styles.frame} aria-busy>
              <div className={styles.frameLoading}>Fetching flow…</div>
            </div>
          ) : iframeSrc !== null ? (
            <iframe
              className={styles.frame}
              title={currentSlide?.label ?? "Flow screen"}
              src={iframeSrc}
            />
          ) : (
            <div className={styles.frame} aria-busy />
          )}
        </div>
        <div className={styles.hint}>
          ↑ Space / → next screen · ← previous · Escape pauses autoplay · Play
          auto-advances every {PLAY_INTERVAL_MS / 1000}s
        </div>
      </div>
    </div>
  );
}

export function PlayViewport(): JSX.Element {
  return (
    <Suspense fallback={<div className={styles.fallback}>Starting flow viewer…</div>}>
      <PlayViewportInner />
    </Suspense>
  );
}
