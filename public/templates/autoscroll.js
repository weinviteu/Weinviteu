/**
 * WeInviteU Hero Device Auto-Tour & Auto-Scroll Controller
 * Plays invitation mockups continuously like an automated walkthrough video.
 * Only activates when `autoscroll=1` is in the URL search query.
 */
/**
 * Silent previews: the home page and template cards show invitations as moving previews.
 * They must never play music, so when `autoscroll` or `muted` is in the URL every audio
 * element is muted and every Web Audio context is kept suspended. This works at the browser
 * level, so it covers any template regardless of how its sound code is written.
 */
(function silencePreview() {
  if (typeof window === "undefined") return;
  if (!/[?&](autoscroll|muted)\b/.test(window.location.search)) return;
  try {
    const media = window.HTMLMediaElement && window.HTMLMediaElement.prototype;
    if (media) {
      const play = media.play;
      media.play = function () { this.muted = true; this.volume = 0; return play.call(this); };
      const silenceAll = () => document.querySelectorAll("audio, video").forEach((el) => { el.muted = true; el.volume = 0; if (el.tagName === "AUDIO") el.pause(); });
      silenceAll();
      new MutationObserver(silenceAll).observe(document.documentElement, { childList: true, subtree: true });
    }
    ["AudioContext", "webkitAudioContext"].forEach((name) => {
      const Original = window[name];
      if (!Original) return;
      Original.prototype.resume = function () { return Promise.resolve(); };
      const Silent = function (...args) { const ctx = new Original(...args); ctx.suspend(); return ctx; };
      Silent.prototype = Original.prototype;
      window[name] = Silent;
    });
  } catch (e) {}
})();

/** Opens any invitation style. Shared by the hero's auto-tour and the template page's tap-to-open. */
(function invitationOpener() {
  if (typeof window === "undefined") return;

  // Classic scripts may keep these in global let/const bindings rather than on window.
  function currentState() { return typeof state !== "undefined" ? state : window.state; }
  function currentPage() { return typeof page !== "undefined" ? page : window.page; }
  function lastPage() { return typeof LAST !== "undefined" ? LAST : window.LAST; }

  // Helper to trigger the opening sequence across different template styles
  function tryTriggerOpen() {
    try {
      // Royal Palace template
      if (typeof window.unlock === "function" && currentState() === "closed") {
        window.unlock();
        return true;
      }
      // Temple template
      if (typeof window.openSeal === "function" && (currentState() === "env" || !currentState())) {
        window.openSeal();
        setTimeout(() => {
          try {
            if (typeof window.enterTemple === "function") window.enterTemple();
            const hint = document.querySelector("#cardHint, #card");
            if (hint) hint.click();
          } catch (e) {}
        }, 1100);
        return true;
      }
      // Birthday / Pooja / Anniversary templates
      if (typeof window.openRibbon === "function" && (currentState() === "intro" || !currentState())) {
        window.openRibbon();
        return true;
      }
      // Baby Shower template
      if (typeof window.openDoor === "function" && (currentState() === "door" || !currentState())) {
        window.openDoor();
        return true;
      }
    } catch (e) {}

    // Fallback: click known interactive opening elements
    const triggers = [
      "#open", "#ribBtn", "#seal", "#balloon", "#door", "#cardHint", "#card",
      "#s1", ".ribbtn", ".seal", ".envelope", "#start-btn", ".enter-btn",
      "#key", ".door-gate", "#lamp", "#enter"
    ];
    for (const sel of triggers) {
      const el = document.querySelector(sel);
      if (el && (el.offsetParent !== null || el.style.display !== "none")) {
        try {
          el.click();
          return true;
        } catch (e) {}
      }
    }
    return false;
  }

  window.__invitationOpener = { currentState, currentPage, lastPage, tryTriggerOpen };
})();

/** The template page's phone asks the invitation to open when a visitor taps anywhere on it. */
(function tapToOpen() {
  if (typeof window === "undefined") return;
  if (!/[?&]embed\b/.test(window.location.search)) return;
  // Openers the preview tour leaves alone, so these designs keep their still hero previews.
  const tapOnly = ["#openBtn", "#clickBtn", "#heartBtn", "#tap-to-open-btn"];
  window.addEventListener("message", (event) => {
    if (event.source !== window.parent || event.data !== "invitation:open") return;
    if (window.__invitationOpener.tryTriggerOpen()) return;
    for (const selector of tapOnly) {
      const button = document.querySelector(selector);
      if (button) { button.click(); return; }
    }
  });
})();

(function initAutoTour() {
  if (typeof window === "undefined") return;
  if (!window.location.search.includes("autoscroll")) return;

  let isTourRunning = true;
  let isResetting = false;

  const { currentState, currentPage, lastPage, tryTriggerOpen } = window.__invitationOpener;

  // Smooth continuous scroller for vertical scrolling templates / sections
  let previousScrollTime = 0;
  const pausedScrollers = new WeakSet();
  let scrollPaused = false;
  function stepScroll(time) {
    const elapsed = previousScrollTime ? Math.min(time - previousScrollTime, 50) : 16.67;
    previousScrollTime = time;
    const docH = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
    const viewH = window.innerHeight;
    const maxScroll = docH - viewH;

    // Only vertical scroll if the document is genuinely scrollable (traditional web page)
    if (maxScroll > 120 && !document.body.style.overflow?.includes("hidden")) {
      if (!scrollPaused) {
        window.scrollBy({ top: elapsed * 0.09, behavior: "auto" });
        if (window.scrollY >= maxScroll - 6) {
          scrollPaused = true;
          setTimeout(() => {
            window.scrollTo({ top: 0, behavior: "smooth" });
            setTimeout(() => { scrollPaused = false; }, 2200);
          }, 2500);
        }
      }
    }

    // Also check for inner .scroll element (e.g. story or itinerary cards)
    const activeScroll = document.querySelector(".page.on .scroll, .pg.on .scroll, .scroll");
    if (activeScroll && !pausedScrollers.has(activeScroll) && activeScroll.scrollHeight > activeScroll.clientHeight + 30) {
      activeScroll.scrollBy({ top: elapsed * 0.06, behavior: "auto" });
      if (activeScroll.scrollTop >= activeScroll.scrollHeight - activeScroll.clientHeight - 4) {
        pausedScrollers.add(activeScroll);
        setTimeout(() => {
          activeScroll.scrollTo({ top: 0, behavior: "smooth" });
          setTimeout(() => pausedScrollers.delete(activeScroll), 1200);
        }, 1200);
      }
    }

    requestAnimationFrame(stepScroll);
  }

  // Step through 3D interactive pages/scenes like a video presentation
  function stepTour() {
    if (!isTourRunning || isResetting) return;

    // 1. If currently in intro/closed state, trigger the opening reveal
    try {
      if (
        currentState() === "closed" ||
        currentState() === "env" ||
        currentState() === "intro" ||
        currentState() === "door"
      ) {
        tryTriggerOpen();
        return;
      }
    } catch (e) {}

    // 2. Temple card hint check
    const cardHint = document.querySelector("#cardHint");
    if (cardHint && (cardHint.classList.contains("show"))) {
      try {
        if (typeof window.enterTemple === "function") window.enterTemple();
        cardHint.click();
        return;
      } catch (e) {}
    }

    // Newer housewarming invitations keep their scenes in an inner scrolling deck.
    if (document.querySelector("#invitation-pages") && typeof window.stepTo === "function") {
      window.stepTo(1);
      return;
    }
    // Curtain invitations own their navigation inside a closure. Their hint advances
    // film frames as well as pages and returns to the beginning after the last scene.
    const sceneHint = document.querySelector(".film.content-ready #hint");
    if (sceneHint) { sceneHint.click(); return; }

    // 3. Gentle carousel rotation on events card
    try {
      if (typeof window.goEv === "function" && Math.random() < 0.45) {
        window.goEv(1);
      }
      if (typeof window.flick === "function" && Math.random() < 0.35) {
        window.flick(1);
      }
    } catch (e) {}

    // 4. Page progression
    let advanced = false;

    // Try goPage() API
    try {
      if (typeof window.goPage === "function" && typeof currentPage() === "number") {
        const finalPage = typeof lastPage() === "number" ? lastPage() : 4;
        if (currentPage() < finalPage) {
          // Wait for the scene's reveal before moving on.
          const nextCue = document.querySelector("#cue");
          if (nextCue && !nextCue.classList.contains("show")) return;
          window.goPage(currentPage() + 1);
          advanced = true;
        } else {
          // Reached final RSVP page! Let it linger like a video outro, then loop back.
          isResetting = true;
          setTimeout(() => {
            try {
              if (typeof window.reset === "function") {
                window.reset();
              } else if (typeof window.goPage === "function") {
                window.goPage(0);
              }
            } catch (e) {}
            isResetting = false;

            // Re-open after returning to closed state
            setTimeout(() => {
              tryTriggerOpen();
            }, 1800);
          }, 4500);
          return;
        }
      }
    } catch (e) {}

    // If goPage wasn't available, click the cue arrow button (#cue)
    if (!advanced) {
      const cue = document.querySelector("#cue, .cue, .next-arrow, .down-arrow");
      if (cue && (cue.classList.contains("show") || cue.offsetParent !== null)) {
        try {
          cue.click();
          advanced = true;
        } catch (e) {}
      }
    }

    // If replay button is visible, loop back
    const replay = document.querySelector("#replay");
    if (!advanced && replay && replay.classList.contains("show") && !isResetting) {
      isResetting = true;
      setTimeout(() => {
        try {
          if (typeof window.reset === "function") window.reset();
          else replay.click();
        } catch (e) {}
        isResetting = false;
        setTimeout(() => {
          tryTriggerOpen();
        }, 1800);
      }, 4000);
    }
  }

  function start() {
    // Initial opening after assets load
    setTimeout(() => {
      tryTriggerOpen();
    }, 1400);

    // Continuous page progression interval (approx 3.4s per scene)
    setInterval(stepTour, 3400);

    // Start vertical continuous scroll loop for scrolling pages
    requestAnimationFrame(stepScroll);
  }

  if (document.readyState === "complete") {
    start();
  } else {
    window.addEventListener("load", start);
  }
})();
