"use client";

import { useEffect, useRef, useState } from "react";
import { getTemplatePoster } from "@/lib/template-posters";
import styles from "./template-detail.module.css";

interface Props {
  previewUrl: string;
  /** Address the phone loads when a design has no cover image. */
  embedUrl: string;
  templateTitle: string;
}

/** A still phone mock-up of the design. The invitation itself opens only from the Preview button. */
export default function SimulatorStage({ previewUrl, embedUrl, templateTitle }: Props) {
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

  return (
    <div className={styles.simulatorWrap}>
      <div className={styles.simulatorStage}>
        {/* Realistic mobile device; the screen has the exact 390 × 844 shape templates are designed for */}
        <div className={styles.phoneDevice}>
          <div ref={screenRef} className={styles.phoneScreen}>
            <div className={styles.phoneNotch} />
            {poster ? (
              <img src={poster} alt={`${templateTitle} invitation preview`} className={styles.simulatorPoster} width={390} height={844} fetchPriority="high" onError={() => setPosterFailed(true)} />
            ) : (
              // Without a cover the design is shown live, but it cannot be tapped or scrolled here.
              <iframe
                src={embedUrl}
                title={`${templateTitle} invitation preview`}
                className={styles.phoneIframe}
                sandbox="allow-scripts"
                loading="eager"
                tabIndex={-1}
                style={{ pointerEvents: "none" }}
              />
            )}
          </div>
        </div>

        <p className={styles.simulatorTip}>
          Tap <span>Preview</span> to open the full invitation.
        </p>
      </div>
    </div>
  );
}
