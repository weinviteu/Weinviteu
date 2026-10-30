"use client";

import { useEffect, useRef, useState } from "react";
import { getTemplatePoster } from "@/lib/template-posters";
import styles from "./template-detail.module.css";

interface Props {
  previewUrl: string;
  /** Address the phone loads, which carries the tap-to-open script. */
  embedUrl: string;
  templateTitle: string;
}

export default function SimulatorStage({ previewUrl, embedUrl, templateTitle }: Props) {
  // The cover shows immediately; the invitation itself downloads only when the visitor taps it.
  const [loaded, setLoaded] = useState(false);
  const [started, setStarted] = useState(false);
  const [engaged, setEngaged] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const openWhenLoaded = useRef(false);
  const [posterFailed, setPosterFailed] = useState(false);
  const poster = posterFailed ? null : getTemplatePoster(previewUrl);
  const screenRef = useRef<HTMLDivElement>(null);

  // Scale the true-size invitation to whatever width the phone has on this device.
  useEffect(() => {
    const screen = screenRef.current;
    if (!screen) return;
    const observer = new ResizeObserver(([entry]) => {
      screen.style.setProperty("--screen-scale", String(entry.contentRect.width / 390));
    });
    observer.observe(screen);
    return () => observer.disconnect();
  }, []);

  const askToOpen = () => iframeRef.current?.contentWindow?.postMessage("invitation:open", "*");
  const handleTap = () => {
    setEngaged(true);
    setStarted(true);
    if (loaded) askToOpen();
    else openWhenLoaded.current = true;
  };
  const handleLoad = () => {
    setLoaded(true);
    if (openWhenLoaded.current) askToOpen();
  };

  return (
    <div className={styles.simulatorWrap}>
      <div className={styles.simulatorStage}>
        {/* Realistic mobile device; the screen has the exact 390 × 844 shape templates are designed for */}
        <div className={styles.phoneDevice}>
          <div ref={screenRef} className={styles.phoneScreen}>
            <div className={styles.phoneNotch} />
            {(started || !poster) && <iframe
              ref={iframeRef}
              onLoad={handleLoad}
              src={embedUrl}
              title={`Interactive preview of ${templateTitle}`}
              className={styles.phoneIframe}
              sandbox="allow-scripts allow-forms allow-popups allow-modals"
              allow="autoplay; fullscreen"
              loading="eager"
            />}
            {!loaded && poster && <img src={poster} alt={`${templateTitle} invitation preview`} className={styles.simulatorPoster} width={390} height={844} fetchPriority="high" onError={() => setPosterFailed(true)} />}
            {started && !loaded && <span className={styles.phoneLoading} role="status" aria-label="Opening the invitation" />}
            {/* Until the first tap the page owns touches, so a swipe scrolls instead of getting stuck inside the invitation. */}
            {!engaged && <button type="button" className={styles.phoneTapLayer} onClick={handleTap} aria-label={`Open the ${templateTitle} invitation`} />}
          </div>
        </div>

        <p className={styles.simulatorTip}>
          Tap the invitation to open it here, or use <span>Preview</span> for full screen.
        </p>
      </div>
    </div>
  );
}
