-- Teddy Dreams on iPhone: the opening envelope was blank until the video started playing.
-- Shows the envelope as an image over the video until it plays. Applies to orders that saved their own copy.
-- After running this, open each Teddy Dreams order in the Customizer and click Save once so its link is rebuilt.
-- Safe to run more than once: rows that already have the cover are skipped.
UPDATE public.orders
SET source_html = replace(replace(replace(source_html,
  $t$.stage-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
$t$,
  $t$.stage-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* Phones don't load a video until it plays, so the opening envelope is shown as a
   plain image on top and fades out once the video is really moving. */
.stage-video-cover {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
  transition: opacity 0.35s ease;
}

.stage-video-cover.is-hidden {
  opacity: 0;
}
$t$),
  $t$            preload="auto"
          ></video>
        </div>

        <!-- Dreamy cloud bloom$t$,
  $t$            preload="auto"
          ></video>
          <img id="video-opening-cover" class="stage-video-cover" src="/template-assets/premium/teddy-dreams-opening-poster.jpg" alt="" aria-hidden="true" />
        </div>

        <!-- Dreamy cloud bloom$t$),
  $t$  const parkOnTeddy = () => {
    try { vOpening.currentTime = cfg.introStartSec; } catch {}
  };
  if (vOpening) {
$t$,
  $t$  const parkOnTeddy = () => {
    // Skip a needless seek: on iPhone it blanks the video while the frame is not downloaded yet.
    if (Math.abs(vOpening.currentTime - cfg.introStartSec) < 0.05) return;
    try { vOpening.currentTime = cfg.introStartSec; } catch {}
  };
  const openingCover = document.getElementById("video-opening-cover");
  if (vOpening && openingCover) {
    const hideCover = () => {
      if (vOpening.paused || vOpening.currentTime <= cfg.introStartSec + 0.05) return;
      openingCover.classList.add("is-hidden");
      vOpening.removeEventListener("timeupdate", hideCover);
    };
    vOpening.addEventListener("timeupdate", hideCover);
  }
  if (vOpening) {
$t$)
WHERE template_filename = 'baby-shower-teddy-dreams.html'
  AND source_html IS NOT NULL
  AND position('video-opening-cover' in source_html) = 0;
