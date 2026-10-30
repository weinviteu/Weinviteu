"use client";

import { useEffect, useRef, useState, type IframeHTMLAttributes } from "react";

// Every live template is a full animated page (large embedded photos, several canvases).
// Running many at once makes iPhones kill the tab ("A problem repeatedly occurred"), so a
// template only runs while it is on screen. Phones run one normally, or the two hero devices.
const MOBILE_QUERY = "(max-width: 768px), (pointer: coarse)";
const slots = { active: new Set<number>(), heroes: new Set<number>(), queue: [] as number[], listeners: new Set<() => void>() };
let nextId = 0;

function limit() {
  if (slots.heroes.size) return 2;
  return typeof window !== "undefined" && window.matchMedia(MOBILE_QUERY).matches ? 1 : 2;
}
function fill() {
  while (slots.queue.length && slots.active.size < limit()) slots.active.add(slots.queue.shift()!);
  slots.listeners.forEach((listener) => listener());
}
function request(id: number) {
  if (!slots.active.has(id) && !slots.queue.includes(id)) slots.queue.push(id);
  fill();
}
function release(id: number) {
  slots.queue = slots.queue.filter((queued) => queued !== id);
  slots.active.delete(id);
  fill();
}

type Props = IframeHTMLAttributes<HTMLIFrameElement> & { title: string; label?: string; poster?: string | null; hero?: boolean };

export default function LiveFrame({ label, title, poster, hero = false, ...iframeProps }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const id = useRef(-1);
  const [live, setLive] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);
  const cover = posterFailed ? null : poster;

  useEffect(() => {
    if (id.current < 0) id.current = nextId++;
    const me = id.current;
    if (hero) slots.heroes.add(me);
    const update = () => {
      const active = slots.active.has(me);
      setLive(active);
      if (!active) setLoaded(false);
    };
    slots.listeners.add(update);
    let timer: ReturnType<typeof setTimeout> | undefined;
    let visible = false;
    const sync = () => {
      clearTimeout(timer);
      // Brief scrolls should not start or restart a multi-megabyte animated page.
      timer = setTimeout(() => {
        if (visible && !document.hidden) request(me);
        else release(me);
      }, visible && !document.hidden ? 180 : 600);
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    }, { rootMargin: "0px", threshold: 0.1 });
    document.addEventListener("visibilitychange", sync);
    if (box.current) observer.observe(box.current);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      slots.listeners.delete(update);
      slots.heroes.delete(me);
      release(me);
    };
  }, [hero]);

  return (
    <div ref={box} className="live-frame">
      {/* Until it has loaded, the iframe is taken out of the layout so the placeholder fills the screen. */}
      {live && <iframe title={title} {...iframeProps} style={loaded ? iframeProps.style : { ...iframeProps.style, position: "absolute", visibility: "hidden" }} onLoad={event => {
        setLoaded(true);
        iframeProps.onLoad?.(event);
      }} />}
      {(!live || !loaded) && (
        <div className={`live-frame-placeholder${cover ? " live-frame-with-cover" : ""}`} aria-hidden="true">
          {cover ? <img className="template-cover" src={cover} alt="" width={390} height={844} loading="eager" fetchPriority="high" onError={() => setPosterFailed(true)} /> : <span>{label ?? title}</span>}
        </div>
      )}
    </div>
  );
}
