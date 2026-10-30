
/* ============================================================
   EDIT YOUR DETAILS HERE
   ============================================================ */
const INVITE = {
  bride: "Aanya",
  groom: "Vihaan",
  lineAbove: "Together with their families",
  lineBelow: "invite you to celebrate their wedding",
  date: "8 – 11 February 2027, Udaipur",

  // couple page
  couplePhoto: "/invitation-assets/asset_8.webp",
  brideFather: "Shri Rajiv Malhotra",
  groomFather: "Shri Arjun Rathore",

  // save-the-date page + countdown (India time)
  weddingAt: "2027-02-10T19:00:00+05:30",
  timeLine: "Pheras at 7:00 in the evening",
  venue: "The Lake Palace, Udaipur",
  venueName: "Sheesh Mahal Lawns",
  venueAddress: "The Lake Palace, Lake Pichola<br>Udaipur, Rajasthan 313001",
  mapUrl: "https://maps.google.com/?q=Udaipur"
};

/* lantern cut-outs (coordinates in the palace image) */
const LANTERNS = {"l1": {"x": 129, "y": 108, "w": 41, "h": 133, "cx": 149.0, "top": 108, "by": 182, "bcy": 210.5}, "l2": {"x": 217, "y": 32, "w": 43, "h": 173, "cx": 238.0, "top": 32, "by": 106, "bcy": 155.5}, "l3": {"x": 445, "y": 21, "w": 35, "h": 131, "cx": 461.5, "top": 21, "by": 93, "bcy": 121.5}, "l4": {"x": 494, "y": 44, "w": 35, "h": 164, "cx": 510.0, "top": 44, "by": 156, "bcy": 181.0}, "l5": {"x": 514, "y": 53, "w": 50, "h": 228, "cx": 539.0, "top": 53, "by": 188, "bcy": 234.0}};
const LSRC = { l1: "/invitation-assets/asset_9.webp", l2: "/invitation-assets/asset_10.webp", l3: "/invitation-assets/asset_11.webp", l4: "/invitation-assets/asset_12.webp", l5: "/invitation-assets/asset_13.webp" };

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const eio = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const eio4 = t => t < .5 ? 8 * t ** 4 : 1 - Math.pow(-2 * t + 2, 4) / 2;
const eout = t => 1 - Math.pow(1 - t, 3);
const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
const now = () => performance.now() / 1000;

/* ---------- layout ---------- */
const IMG1 = { w: 735, h: 983 }, IMG2 = { w: 736, h: 1003 }, IMG3 = { w: 736, h: 1307 };
const DOOR = { x0: 194, x1: 543, y0: 380, y1: 934, cx: 368.5, cy: 657 };
let L1 = {}, L2 = {}, L3 = {}, Z = 1, P = { x: 0, y: 0 }, R0, S2, B0, BS;
const lerpR = (a, b, e) => ({ x: lerp(a.x, b.x, e), y: lerp(a.y, b.y, e), w: lerp(a.w, b.w, e), h: lerp(a.h, b.h, e) });
function interiorRect(e, s) {
  const top = P.y + (L1.y + 239 * L1.f - P.y) * s, bot = P.y + (L1.y + 934 * L1.f - P.y) * s;
  const vt = Math.max(top, 0), vb = Math.min(bot, innerHeight), need = (vb - vt) * 1.04;
  let h = Math.max(lerp(R0.h, S2.h, e), need), cy = lerp(R0.y + R0.h / 2, S2.y + S2.h / 2, e);
  if (cy - h / 2 > vt) cy = vt + h / 2; if (cy + h / 2 < vb) cy = vb - h / 2;
  const w = h * S2.w / S2.h, cx = lerp(P.x, S2.x + S2.w / 2, e);
  return { x: cx - w / 2, y: cy - h / 2, w, h };
}
function placeLocal(el, r, s) { const x0 = (P.x + (r.x - P.x) / s - L1.x) / L1.f, y0 = (P.y + (r.y - P.y) / s - L1.y) / L1.f;
  const st = el.style; st.left = x0 + 'px'; st.top = y0 + 'px'; st.width = r.w / s / L1.f + 'px'; st.height = r.h / s / L1.f + 'px'; }
function fit(img) {
  const sw = innerWidth, sh = innerHeight, portrait = sh > sw;
  // always show the full height of the picture (nothing cut at top or bottom);
  // on narrow phones allow the sides to trim a little, never more than ~28%
  const f = Math.min(sh / img.h, sw / (img.w * 0.72));
  return { f, x: (sw - img.w * f) / 2, y: (sh - img.h * f) / 2 };
}
function layout() {
  L1 = fit(IMG1); L2 = fit(IMG2); L3 = fit(IMG3);
  if (FR) FR.forEach(layoutFrame);
  $("#st1").style.transform = `translate(${L1.x}px,${L1.y}px) scale(${L1.f})`;
  $("#st2").style.transform = `translate(${L2.x}px,${L2.y}px) scale(${L2.f})`;
  const sw = innerWidth, sh = innerHeight;
  // camera target: push until the doorway swallows the screen
  P = { x: L1.x + DOOR.cx * L1.f, y: L1.y + DOOR.cy * L1.f };
  Z = 1.12 * Math.max(sw / ((DOOR.x1 - DOOR.x0) * L1.f), sh / ((DOOR.y1 - DOOR.y0) * L1.f));
  // interior: starts as a view through the doorway, ends exactly where scene 2 sits (seamless hand-off)
  const H0 = 695 * L1.f * 1.1, W0 = H0 * IMG2.w / IMG2.h, cy0 = L1.y + 600 * L1.f;
  R0 = { x: P.x - W0 / 2, y: cy0 - H0 / 2, w: W0, h: H0 };
  S2 = { x: L2.x, y: L2.y, w: IMG2.w * L2.f, h: IMG2.h * L2.f };
  B0 = { x: R0.x - W0 * .4, y: R0.y - H0 * .3, w: W0 * 1.8, h: H0 * 1.6 };
  BS = { x: -sw * .1, y: -sh * .1, w: sw * 1.2, h: sh * 1.2 };
  [fx1, fx2, fx3].forEach(c => { c.width = sw * DPR; c.height = sh * DPR; c.getContext("2d").setTransform(DPR, 0, 0, DPR, 0, 0); });
}

/* ---------- sound (Web Audio, synthesised) ---------- */
const Sound = (() => {
  let ctx, master, on = true;
  function init() { if (ctx) return; const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ctx = new AC(); master = ctx.createGain(); master.gain.value = on ? .9 : 0; master.connect(ctx.destination); }
  function noise(d) { const b = ctx.createBuffer(1, ctx.sampleRate * d, ctx.sampleRate), a = b.getChannelData(0); for (let i = 0; i < a.length; i++) a[i] = Math.random() * 2 - 1;
    const s = ctx.createBufferSource(); s.buffer = b; return s; }
  function env(g, t, a, peak, d) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }
  function knock(delay = 0) { if (!ctx) return; const t = ctx.currentTime + delay;
    const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(60, t + .12);
    env(g, t, .004, .5, .16); o.connect(g).connect(master); o.start(t); o.stop(t + .25);
    const n = noise(.1), f = ctx.createBiquadFilter(), g2 = ctx.createGain(); f.type = "lowpass"; f.frequency.value = 900; env(g2, t, .002, .25, .06);
    n.connect(f).connect(g2).connect(master); n.start(t); }
  function creak(delay = 0, dur = 2.4) { if (!ctx) return; const t = ctx.currentTime + delay;
    const o = ctx.createOscillator(), lfo = ctx.createOscillator(), lg = ctx.createGain(), bp = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = "sawtooth"; o.frequency.setValueAtTime(62, t); o.frequency.linearRampToValueAtTime(48, t + dur);
    lfo.frequency.setValueAtTime(11, t); lfo.frequency.linearRampToValueAtTime(6, t + dur); lg.gain.value = 18; lfo.connect(lg).connect(o.frequency);
    bp.type = "bandpass"; bp.frequency.value = 700; bp.Q.value = 5;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(.09, t + .3); g.gain.setValueAtTime(.09, t + dur * .6); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(bp).connect(g).connect(master); o.start(t); lfo.start(t); o.stop(t + dur + .1); lfo.stop(t + dur + .1);
    const n = noise(dur), lp = ctx.createBiquadFilter(), g2 = ctx.createGain(); lp.type = "lowpass"; lp.frequency.setValueAtTime(300, t); lp.frequency.linearRampToValueAtTime(1600, t + dur);
    g2.gain.setValueAtTime(0.0001, t); g2.gain.exponentialRampToValueAtTime(.12, t + dur * .8); g2.gain.exponentialRampToValueAtTime(0.0001, t + dur + .6);
    n.connect(lp).connect(g2).connect(master); n.start(t); }
  function bell(freq, delay = 0, vol = .12, len = 2.2) { if (!ctx) return; const t = ctx.currentTime + delay;
    [[1, 1], [2.76, .35], [5.4, .15]].forEach(([m, v]) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = "sine"; o.frequency.value = freq * m;
      env(g, t, .005, vol * v, len / m); o.connect(g).connect(master); o.start(t); o.stop(t + len + .1); }); }
  function pad() { if (!ctx) return; const t = ctx.currentTime; [110, 164.8, 220.4].forEach((f, i) => { const o = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter();
      o.type = "triangle"; o.frequency.value = f; o.detune.value = (i - 1) * 6; lp.type = "lowpass"; lp.frequency.value = 700;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(.035, t + 4); o.connect(lp).connect(g).connect(master); o.start(t); pads.push({ o, g }); }); }
  const pads = [];
  function stopPad() { if (!ctx) return; pads.splice(0).forEach(({ o, g }) => { g.gain.cancelScheduledValues(ctx.currentTime); g.gain.setTargetAtTime(0.0001, ctx.currentTime, .4); o.stop(ctx.currentTime + 2); }); }
  function toggle() { on = !on; if (master) master.gain.setTargetAtTime(on ? .9 : 0, ctx.currentTime, .1); return on; }
  function whoosh() { if (!ctx) return; const t = ctx.currentTime, n = noise(3.2), bp = ctx.createBiquadFilter(), g = ctx.createGain();
    bp.type = "bandpass"; bp.Q.value = .8; bp.frequency.setValueAtTime(250, t); bp.frequency.exponentialRampToValueAtTime(2400, t + 2.6);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(.16, t + 2.2); g.gain.exponentialRampToValueAtTime(0.0001, t + 3.2);
    n.connect(bp).connect(g).connect(master); n.start(t); }
  return { init, knock, creak, bell, pad, stopPad, toggle, whoosh, get ctx() { return ctx; } };
})();
const NOTES = [587.3, 659.3, 784, 880, 987.8, 1174.7, 1318.5];

/* ---------- particles ---------- */
const DPR = Math.min(2, devicePixelRatio || 1);
const fx1 = $("#fx1"), fx2 = $("#fx2"), fx3 = $("#fx3");
function makeFX(canvas, kind) {
  const ctx = canvas.getContext("2d"), P = [];
  const cols = kind === 1 ? ["#d6246e", "#e0378a", "#b81c5c", "#f06aa5"] : kind === 3 ? ["#f4b6c4", "#f7c9d2", "#eea0b3", "#fbe0e6"] : ["#f2a0b5", "#f6c26a", "#e98fa8", "#ffe1a1"];
  function add(init) { const w = innerWidth, h = innerHeight, petal = Math.random() < (kind === 1 ? .55 : kind === 3 ? .7 : .3);
    P.push({ petal, x: Math.random() * w, y: init ? Math.random() * h : -20, z: Math.random(),
      vx: (Math.random() - .5) * .25, vy: petal ? .35 + Math.random() * .5 : .05 + Math.random() * .12,
      r: Math.random() * 6.28, vr: (Math.random() - .5) * .04, fl: Math.random() * 6.28, c: cols[Math.random() * cols.length | 0], ph: Math.random() * 6.28 }); }
  const N = REDUCED ? 14 : (innerWidth < 600 ? 34 : 60); for (let i = 0; i < N; i++) add(true);
  const sparks = [];
  function burst(x, y, n = 26) { for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, s = .3 + Math.random() * 1.6;
      sparks.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - .4, life: 0, max: 50 + Math.random() * 50 }); } }
  function frame(t, f, boost = 1) { const w = innerWidth, h = innerHeight; ctx.clearRect(0, 0, w, h);
    for (let i = P.length - 1; i >= 0; i--) { const p = P[i];
      p.x += (p.vx + Math.sin(t * .6 + p.ph) * (p.petal ? .45 : .15)) * f * boost; p.y += p.vy * f * boost; p.r += p.vr * f; p.fl += .05 * f;
      if (p.y > h + 30 || p.x < -40 || p.x > w + 40) { P.splice(i, 1); add(false); continue; }
      if (p.petal) { const s = 3 + p.z * 5; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.scale(1, Math.abs(Math.cos(p.fl)) * .8 + .2);
        ctx.globalAlpha = .55 + p.z * .4; ctx.fillStyle = p.c; ctx.beginPath(); ctx.ellipse(0, 0, s, s * .62, 0, 0, 6.28); ctx.fill(); ctx.restore(); }
      else { const a = .25 + .45 * (0.5 + 0.5 * Math.sin(t * 2 + p.ph)), r = 1 + p.z * 1.8;
        ctx.globalAlpha = a; ctx.fillStyle = "#ffe6a8"; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 6.28); ctx.fill(); } }
    ctx.globalCompositeOperation = "lighter";
    for (let i = sparks.length - 1; i >= 0; i--) { const s = sparks[i]; s.life += f; s.x += s.vx * f; s.y += s.vy * f; s.vy += .012 * f; s.vx *= .985;
      if (s.life > s.max) { sparks.splice(i, 1); continue; } const k = 1 - s.life / s.max;
      ctx.globalAlpha = k; ctx.fillStyle = "#ffe7a3"; ctx.beginPath(); ctx.arc(s.x, s.y, 1.6 * k + .4, 0, 6.28); ctx.fill(); }
    ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1; }
  return { frame, burst };
}
const FX1 = makeFX(fx1, 1), FX2 = makeFX(fx2, 2), FX3 = makeFX(fx3, 3);

/* ---------- scene 2 build ---------- */
const lanEls = [];
function buildScene2() {
  const lw = $("#lans"), gw = $("#glows");
  Object.entries(LANTERNS).forEach(([k, v], i) => {
    const d = document.createElement("div"); d.className = "lan";
    Object.assign(d.style, { left: v.x + "px", top: v.y + "px", width: v.w + "px", height: v.h + "px", transformOrigin: `${v.cx - v.x}px ${-(v.y - 0)}px` });
    d.innerHTML = `<div class="chain" style="left:${v.cx - v.x - 1}px"></div><img src="${LSRC[k]}" alt="">`;
    lw.appendChild(d);
    const g = document.createElement("div"); g.className = "glow"; g.style.left = v.cx + "px"; g.style.top = v.bcy + "px"; gw.appendChild(g);
    lanEls.push({ el: d, glow: g, v, delay: [0.2, 0.75, 0.45, 1.05, 1.35][i], ph: Math.random() * 6.28, landed: false, amp: (i % 2 ? -1 : 1) * (5 + Math.random() * 3) });
  });
  const split = (id, txt) => { $(id).innerHTML = [...txt].map(c => `<span class="ch">${c === " " ? "&nbsp;" : c}</span>`).join(""); };
  split("#bride", INVITE.bride); split("#groom", INVITE.groom);
  $("#l1").textContent = INVITE.lineAbove; $("#l2").textContent = INVITE.lineBelow; Object.assign($("#l1").dataset, { en: INVITE.lineAbove, hi: "अपने परिवारों के आशीर्वाद सहित" }); Object.assign($("#l2").dataset, { en: INVITE.lineBelow, hi: "आपको अपने विवाह में सादर आमंत्रित करते हैं" }); $("#dt").textContent = INVITE.date;
  $("#names").setAttribute("aria-label", `${INVITE.lineAbove}, ${INVITE.bride} and ${INVITE.groom} ${INVITE.lineBelow}, ${INVITE.date}`);
}


/* ============================================================
   MORE DETAILS (events, story, RSVP, guest info) — edit freely
   ============================================================ */
const EVENTS = [
  { key: "haldi", name: "Haldi", hi: "हल्दी", tag: "The Rang Leela", date: "Monday, 8 February 2027", time: "10:00 am onwards", venue: "Zenana Mahal Terrace",
    dress: "Sunshine yellows & marigold", dressHi: "पीले और गेंदा रंग", sw: ["#f6c338", "#f29b1d", "#fff3c4"] },
  { key: "mehendi", name: "Mehendi", hi: "मेहंदी", tag: "The Mehendi Bazaar", date: "Monday, 8 February 2027", time: "4:00 pm onwards", venue: "Durbar Courtyard",
    dress: "Greens & jewel tones", dressHi: "हरे और रत्न रंग", sw: ["#2f6b3a", "#7bb661", "#c9a24a"] },
  { key: "sangeet", name: "Sangeet", hi: "संगीत", tag: "A Starlit Promise", date: "Tuesday, 9 February 2027", time: "7:30 pm onwards", venue: "The Moonlit Lawns",
    dress: "Shimmer, sequins & metallics", dressHi: "चमक और धातुई रंग", sw: ["#1f2a5c", "#c0c0d8", "#d4af37"] },
  { key: "wedding", name: "Wedding", hi: "विवाह", tag: "The Anant Milan", date: "Wednesday, 10 February 2027", time: "Baraat 5:00 pm, Pheras 7:00 pm", venue: "Sheesh Mahal Lawns",
    dress: "Traditional Indian attire", dressHi: "पारंपरिक भारतीय परिधान", sw: ["#a3162a", "#d4a24c", "#f4e1c1"] },
  { key: "reception", name: "Reception", hi: "रिसेप्शन", tag: "Chandni Raat", date: "Thursday, 11 February 2027", time: "8:00 pm onwards", venue: "The Rooftop Terrace",
    dress: "Black tie, Indian or Western", dressHi: "ब्लैक टाई, भारतीय या पश्चिमी", sw: ["#1c1c1c", "#e8d9c0", "#b98a35"] }
];
// photos: leave empty to use crops of the couple portrait, or list image URLs / data URIs
const PHOTOS = [
  { src: "", size: "cover", pos: "50% 30%", cap: "The day we said yes", hi: "जिस दिन हमने हाँ कहा" },
  { src: "", size: "230%", pos: "52% 16%", cap: "Just us", hi: "बस हम दोनों" },
  { src: "", size: "200%", pos: "82% 34%", cap: "Her smile", hi: "उसकी मुस्कान" },
  { src: "", size: "200%", pos: "22% 22%", cap: "His calm", hi: "उसका सुकून" },
  { src: "", size: "300%", pos: "46% 50%", cap: "Hand in hand", hi: "हाथों में हाथ" }
];
const STORY = [
  { year: "2019", title: "First hello", hi: "पहली मुलाक़ात", text: "A chance meeting at a friend's Diwali party in Delhi.", photo: 1 },
  { year: "2021", title: "Miles apart", hi: "दूरियाँ", text: "Late-night calls between Mumbai and Bengaluru kept us close.", photo: 3 },
  { year: "2025", title: "The proposal", hi: "प्रस्ताव", text: "A sunset by Lake Pichola and one very nervous question.", photo: 2 },
  { year: "2027", title: "Forever begins", hi: "हमेशा के लिए", text: "Udaipur, surrounded by everyone we love.", photo: 0 }
];
const MUSIC = { src: "", title: "Raag Yaman, a soft evening melody" };   // put an audio data URI in src to use your own song
const RSVP = { whatsapp: "919000000000", email: "rsvp@aanya-vihaan.in", by: "10 January 2027" };
const INFO = {
  travel: [
    "<b>By air:</b> Maharana Pratap Airport (UDR), about 25 minutes from the venue. Our team will receive you.",
    "<b>By train:</b> Udaipur City station, 15 minutes away.",
    "<b>Stay:</b> Rooms are reserved for you at The Lake Palace and Fateh Garh from 7 to 12 February. Quote “Malhotra–Rathore wedding”.",
    "<b>Getting around:</b> Shuttles run between the hotels and every event."
  ],
  contacts: [{ name: "Ishita Malhotra", role: "Bride's side", phone: "+919000000001" }, { name: "Kabir Rathore", role: "Groom's side", phone: "+919000000002" }, { name: "Neha Joshi", role: "Travel & stay", phone: "+919000000003" }],
  gifts: "Your presence and blessings are the only gift we wish for. If you'd still like to give, a contribution towards our first home would mean the world.",
  upi: "aanyavihaan@upi",
  live: { url: "https://youtube.com/", note: "The pheras will stream live on 10 February from 6:45 pm IST." },
  signoff: "With love, the Malhotra & Rathore families"
};

const THANKS = {
  subtitle: "धन्यवाद · நன்றி · ধন্যবাদ",
  lead: "Thank you for being part of our story. Every blessing, every smile and every mile travelled has made this celebration whole.",
  notes: [
    ["To our parents,", "for every sacrifice, every prayer and every quiet blessing that brought us to this day. Everything we are began with you."],
    ["To our families,", "for the laughter at every haldi, the late nights before every sangeet and the warmth that turned two homes into one."],
    ["To our friends,", "for the endless teasing, the playlists and for loving us loudly, exactly as we are."],
    ["To everyone travelling from near and far,", "your journey to Udaipur means more to us than words can hold. We will remember every face in the crowd."],
    ["And to you, reading this,", "thank you for opening our invitation and our hearts. We cannot wait to celebrate with you."]
  ],
  families: "and the Malhotra & Rathore families",
  hashtag: "#AanyaWedsVihaan"
};

/* ---------- language: English + Hindi ---------- */
let LANG = "en";
const L = (en, hi) => `<span data-en="${en.replace(/"/g, "&quot;")}" data-hi="${(hi || en).replace(/"/g, "&quot;")}">${en}</span>`;
function setLang(l) { LANG = l; document.documentElement.lang = l;
  $$("[data-hi]").forEach(e => { e.textContent = l === "hi" ? e.dataset.hi : e.dataset.en; });
  $("#lang").textContent = l === "hi" ? "English" : "हिंदी"; }

/* ---------- build pages 5–9 ---------- */
const ICONS = {
  haldi: '<path d="M8 26h32a16 12 0 0 1-32 0z"/><path d="M16 21c1-5 6-5 8-11 2 6 7 6 8 11"/><circle cx="24" cy="31" r="2"/>',
  mehendi: '<path d="M24 6c11 4 15 15 11 25-3 8-12 12-18 8-5-3-5-10 0-12 4-2 8 1 7 5"/><path d="M20 30c-2-4 1-8 5-8"/>',
  sangeet: '<circle cx="12" cy="34" r="4"/><circle cx="34" cy="30" r="4"/><path d="M16 34V12l22-4v22"/><path d="M16 17l22-4"/>',
  wedding: '<path d="M16 22h16l-2 16H18z"/><path d="M13 22h22"/><path d="M19 22c0-6 10-6 10 0"/><path d="M24 7v9"/><path d="M18 11c2 2 4 3 6 3s4-1 6-3"/>',
  reception: '<path d="M11 8h10l-1 10a4 4 0 0 1-8 0z"/><path d="M16 22v14M12 36h8"/><path d="M27 8h10l-1 10a4 4 0 0 1-8 0z"/><path d="M32 22v14M28 36h8"/>'
};
const ORN = '<svg class="orn" viewBox="0 0 150 14" aria-hidden="true"><path d="M2 7 H60 M90 7 H148" stroke="#b08238"/><path d="M75 1 L81 7 L75 13 L69 7 Z" fill="none" stroke="#b08238"/></svg>';
let evIdx = 0, evAng = 0, evTarget = 0, evAuto = true, deckIdx = 0;
const rsvp = { attend: null, guests: 2, events: new Set(), meal: null };
function photoStyle(i) { const p = PHOTOS[i % PHOTOS.length], src = p.src || COUPLE_SRC;
  return `background-image:url(${src});background-size:${p.src ? "cover" : p.size};background-position:${p.src ? "50% 50%" : p.pos}`; }
let COUPLE_SRC = "";
function buildPages() {
  COUPLE_SRC = INVITE.couplePhoto;
  const ui = FR[0].ui, d = (i, s) => `<section class="pgu" id="pg${i}" aria-label="${s}">`;
  const evCards = EVENTS.map((e, i) => `<div class="ev" data-i="${i}"><div class="evc th-${e.key}"><div class="gl"></div>
      <svg class="ic" viewBox="0 0 48 48" aria-hidden="true">${ICONS[e.key]}</svg>
      <div class="en">${L(e.name, e.hi)}</div><div class="et">${e.tag}</div><hr>
      <div class="ed">${e.date}</div><div class="eti">${e.time}</div><div class="ev1">${e.venue}</div>
      <div class="dc"><div class="dl">${L("Dress code", "परिधान")}</div><div class="dt2">${L(e.dress, e.dressHi)}</div>
      <div class="sw">${e.sw.map(c => `<i style="background:${c}"></i>`).join("")}</div></div></div></div>`).join("");
  const deck = PHOTOS.map((p, i) => `<div class="pcard" data-i="${i}"><div class="im" style="${photoStyle(i)}" role="img" aria-label="${p.cap}"></div><div class="cap">${L(p.cap, p.hi)}</div></div>`).join("");
  const story = STORY.map((st, i) => { const side = i % 2 ? "R" : "L", dd = (.6 + i * .45).toFixed(2);
    return `<div class="row ${side}" style="--d:${dd}s;--from:${side === "L" ? "-40px" : "40px"};--rot:${side === "L" ? "-1.6deg" : "1.6deg"}">
      <div class="card2"><div class="pic2" style="${photoStyle(st.photo)}"></div><div class="tt">${L(st.title, st.hi)}</div><div class="tx">${st.text}</div></div>
      <div class="node"></div><div class="yr2">${st.year}</div></div>`; }).join("");
  const ic = {
    travel: '<path d="M4 28l40-16-8 20-10-6-6 8v-10z"/>', contact: '<path d="M14 6l6 10-4 4c2 5 7 10 12 12l4-4 10 6-4 8C22 42 6 26 6 10z"/>',
    gift: '<rect x="7" y="18" width="34" height="24" rx="2"/><path d="M5 12h38v6H5zM24 12v30M24 12c-4-8-12-6-10 0M24 12c4-8 12-6 10 0"/>',
    live: '<rect x="5" y="11" width="30" height="26" rx="3"/><path d="M35 20l9-5v18l-9-5z"/><circle cx="14" cy="18" r="2"/>'
  };
  const acc = (id, icon, en, hi, body, open) => `<div class="it glass${open ? " open" : ""}" id="${id}"><button class="hd" aria-expanded="${!!open}"><svg viewBox="0 0 48 48" aria-hidden="true">${icon}</svg><b>${L(en, hi)}</b><i>+</i></button><div class="bd"><div><div class="bi">${body}</div></div></div></div>`;
  ui.innerHTML = `
  ${d(5, "The celebrations")}<div class="ph1 fade">${L("The Celebrations", "उत्सव")}</div><div class="ph2 fade" style="--d:.2s">${L("Five gatherings, one joyful week", "पाँच उत्सव, एक आनंदमय सप्ताह")}</div>
    <div class="car" id="car"><div class="evshadow"></div><div class="ring" id="ring">${evCards}</div></div>
    <div class="carnav fade" style="--d:.8s"><button class="navb" id="evPrev" aria-label="Previous event">‹</button><div class="edots" id="edots">${EVENTS.map((e, i) => `<button aria-label="${e.name}" data-i="${i}"></button>`).join("")}</div><button class="navb" id="evNext" aria-label="Next event">›</button></div></section>
  ${d(6, "Moments")}<div class="ph1 fade">${L("Moments", "यादें")}</div><div class="ph2 fade" style="--d:.2s">${L("Before the big day", "बड़े दिन से पहले")}</div>
    <div class="deck" id="deck">${deck}</div>
    <div class="music fade" id="music" style="--d:.7s"><button class="navb" id="dPrev" aria-label="Previous photo">‹</button>
      <button class="btn alt" id="song" aria-pressed="false"><span class="eq" aria-hidden="true"><i></i><i></i><i></i><i></i></span> <span id="songL">${L("Play our song", "हमारा गीत")}</span></button>
      <button class="navb" id="dNext" aria-label="Next photo">›</button></div></section>
  ${d(7, "Our story")}<div class="ph1 fade">${L("Our Story", "हमारी कहानी")}</div><div class="ph2 fade" style="--d:.2s">${L("How two paths became one", "दो राहें कैसे एक हुईं")}</div>
    <div class="tl2 scroll"><div class="spine"></div>${story}
      <div class="fin" style="--d:${(.6 + STORY.length * .45).toFixed(2)}s"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.5-9.2C1 8.3 3.2 5 6.6 5c2.1 0 3.6 1.2 5.4 3.2C13.8 6.2 15.3 5 17.4 5 20.8 5 23 8.3 21.5 11.8 19.5 16.4 12 21 12 21z"/></svg><span>${L("and the story continues…", "और कहानी चलती रहेगी…")}</span></div></div></section>
  ${d(8, "RSVP")}<div class="ph1 fade">${L("Kindly Reply", "कृपया उत्तर दें")}</div><div class="ribbon fade" style="--d:.25s">${L("by " + RSVP.by, RSVP.by + " तक")}</div>
    <div class="glass rs scroll fade" style="--d:.45s">
      <div class="sec"><div class="fl2"><input type="text" id="rName" autocomplete="name" placeholder=" "><label for="rName">${L("Your full name", "आपका पूरा नाम")}</label></div></div>
      <div class="sec"><span class="l">${L("Will you be with us?", "क्या आप पधारेंगे?")}</span><div class="tiles" id="rAtt">
        <button class="chip tile" data-v="yes" aria-pressed="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16v11H4z"/><path d="M4 7l8 6 8-6"/><path d="M12 17.5s-2.6-1.6-3.2-3c-.4-1 .3-2 1.3-2 .8 0 1.4.5 1.9 1.1.5-.6 1.1-1.1 1.9-1.1 1 0 1.7 1 1.3 2-.6 1.4-3.2 3-3.2 3z"/></svg>${L("Joyfully accept", "सहर्ष स्वीकार")}</button>
        <button class="chip tile" data-v="no" aria-pressed="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4c-1 2-1 5 0 8M9 6c-2 2-3 6-1 10 1 2 3 3 4 4M15 6c2 2 3 6 1 10-1 2-3 3-4 4"/></svg>${L("Regretfully decline", "खेद सहित असमर्थ")}</button></div></div>
      <div id="rMore">
        <div class="sec gs"><span class="l" style="margin:0">${L("Guests including you", "आप सहित अतिथि")}</span>
          <div class="step"><button class="navb" id="gMinus" aria-label="Fewer guests">−</button><output id="gCount">2</output><button class="navb" id="gPlus" aria-label="More guests">+</button></div>
          <div class="ppl" id="ppl" aria-hidden="true"></div></div>
        <div class="sec"><span class="l">${L("Which celebrations?", "कौन से उत्सव?")}</span><div class="chips" id="rEv">${EVENTS.map(e => `<button class="chip ev-chip" style="--c:${e.sw[0]}" data-v="${e.name}" aria-pressed="false">${L(e.name, e.hi)}</button>`).join("")}</div></div>
        <div class="sec"><span class="l">${L("Meal preference", "भोजन")}</span><div class="tiles three" id="rMeal">
          <button class="chip tile" data-v="Vegetarian" aria-pressed="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19C5 10 11 5 19 5c0 8-5 14-14 14z"/><path d="M5 19L14 10"/></svg>${L("Vegetarian", "शाकाहारी")}</button>
          <button class="chip tile" data-v="Jain" aria-pressed="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20c-4-2-6-5-6-8 3 0 5 2 6 4 1-2 3-4 6-4 0 3-2 6-6 8z"/><path d="M12 16c-2-3-2-7 0-11 2 4 2 8 0 11z"/></svg>${L("Jain", "जैन")}</button>
          <button class="chip tile" data-v="Non-vegetarian" aria-pressed="false"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="13" r="7"/><circle cx="12" cy="13" r="4"/><path d="M12 3v3"/></svg>${L("Non-veg", "मांसाहारी")}</button></div></div></div>
      <div class="sec" style="border:0"><div class="fl2"><textarea id="rMsg" placeholder=" "></textarea><label for="rMsg">${L("Blessings or a note (optional)", "आशीर्वाद या संदेश (वैकल्पिक)")}</label></div></div>
      <div class="sendrow"><button class="btn" id="rWa"><svg class="wa" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20l1.2-3.6A8 8 0 1 1 8 19z"/><path d="M9 8.5c0 3 2.5 6 6 6.5l1-1.5-2-1-1 1c-1-.5-2-1.5-2.5-2.5l1-1-1-2z"/></svg> ${L("Send on WhatsApp", "व्हाट्सऐप पर भेजें")}</button><button class="btn alt" id="rMail">${L("Email instead", "ईमेल से भेजें")}</button></div>
      <div class="thanks" id="thanks"><svg class="tick" viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="24"/><path d="M15 27l7 7 15-16"/></svg><div class="ph1">${L("Thank you!", "धन्यवाद!")}</div><p class="ph2" id="thanksT"></p><button class="btn alt" id="rEdit" style="margin-top:.8em">${L("Edit my reply", "उत्तर बदलें")}</button></div>
    </div></section>
  ${d(9, "Good to know")}<div class="ph1 fade">${L("Good to Know", "आवश्यक जानकारी")}</div>${ORN}
    <div class="acc scroll fade" style="--d:.3s">
      ${acc("aT", ic.travel, "Travel & stay", "यात्रा और ठहराव", INFO.travel.map(x => `<p>${x}</p>`).join(""), true)}
      ${acc("aC", ic.contact, "Contact for coordination", "संपर्क सूत्र", INFO.contacts.map(c => `<div class="ct"><div><b>${c.name}</b><br><i>${c.role}</i></div><a class="btn" href="tel:${c.phone}">${L("Call", "कॉल करें")}</a></div>`).join(""))}
      ${acc("aG", ic.gift, "Gifts & blessings", "उपहार और आशीर्वाद", `<p>${INFO.gifts}</p><p style="display:flex;gap:.5em;align-items:center;flex-wrap:wrap"><span>UPI: <b id="upi">${INFO.upi}</b></span><button class="chip" id="copyUpi">${L("Copy", "कॉपी")}</button></p>`)}
      ${acc("aL", ic.live, "Watch live", "सीधा प्रसारण", `<p>${INFO.live.note}</p><p><a class="btn" href="${INFO.live.url}" target="_blank" rel="noopener" style="text-decoration:none;display:inline-block">${L("Open live stream", "प्रसारण देखें")}</a></p>`)}
      <div class="signoff">${INFO.signoff}</div>
    </div></section>
  ${d(10, "Thank you")}<div class="tyh fade">${L("Thank You", "धन्यवाद")}</div>
    <div class="tyhi fade" style="--d:.3s">${THANKS.subtitle}</div>
    <svg class="lotus fade" style="--d:.5s" viewBox="0 0 120 30" aria-hidden="true"><path d="M60 4c5 6 5 14 0 20-5-6-5-14 0-20z" fill="#d23a7d"/><path d="M60 24c-8-1-14-6-16-13 7 0 13 5 16 13zM60 24c8-1 14-6 16-13-7 0-13 5-16 13z" fill="#e6679a"/><path d="M60 26c-12 1-20-3-24-9 9-1 17 3 24 9zM60 26c12 1 20-3 24-9-9-1-17 3-24 9z" fill="#f29abb"/><path d="M4 26H34M86 26H116" stroke="#c9953a" stroke-width="1.2"/></svg>
    <div class="tyb scroll"><p class="lead fade" style="--d:.7s">${THANKS.lead}</p>${THANKS.notes.map((n, i) => `<p class="fade n${i % 4}" style="--d:${(1 + i * .35).toFixed(2)}s"><b>${n[0]}</b> ${n[1]}</p>`).join("")}
      <div class="tysig fade" style="--d:${(1.2 + THANKS.notes.length * .35).toFixed(2)}s"><i>${L("With love and gratitude,", "प्रेम और आभार सहित,")}</i><span>${INVITE.bride} &amp; ${INVITE.groom}</span><em>${THANKS.families}</em></div>
      <div class="tyhash fade" style="--d:${(1.5 + THANKS.notes.length * .35).toFixed(2)}s">${THANKS.hashtag}</div>
      <div class="sendrow fade" style="--d:${(1.7 + THANKS.notes.length * .35).toFixed(2)}s;margin:.8em 0 .4em"><button class="btn" id="tyShare">${L("Share the invitation", "निमंत्रण साझा करें")}</button><button class="btn alt" id="tyReplay">${L("Watch again", "फिर से देखें")}</button></div>
    </div></section>`;

  // carousel
  const car = $("#car"); let dx0 = null, a0 = 0, moved = false;
  car.addEventListener("pointerdown", e => { if (e.target.closest("button")) return; dx0 = e.clientX; a0 = evTarget; moved = false; evAuto = false; car.setPointerCapture(e.pointerId); });
  car.addEventListener("pointermove", e => { const r = car.getBoundingClientRect(); pointerCard.x = (e.clientX - r.left) / r.width * 2 - 1; pointerCard.y = (e.clientY - r.top) / r.height * 2 - 1;
    if (dx0 == null) return; const dx = e.clientX - dx0; if (Math.abs(dx) > 4) moved = true; evTarget = a0 + dx / r.width * 110; });
  car.addEventListener("pointerup", () => { if (dx0 == null) return; dx0 = null; evTarget = Math.round(evTarget / 72) * 72; evIdx = ((-Math.round(evTarget / 72)) % 5 + 5) % 5; if (!moved) {} Sound.bell(NOTES[evIdx + 1], 0, .04, 1); });
  car.addEventListener("pointerleave", () => { pointerCard.x = pointerCard.y = 0; });
  const goEv = dir => { evAuto = false; evTarget -= 72 * dir; evIdx = ((-Math.round(evTarget / 72)) % 5 + 5) % 5; Sound.bell(NOTES[evIdx + 1], 0, .04, 1); };
  $("#evPrev").onclick = () => goEv(-1); $("#evNext").onclick = () => goEv(1);
  $$("#edots button").forEach(b => b.onclick = () => { evAuto = false; const cur = -Math.round(evTarget / 72), want = +b.dataset.i;
    let diff = ((want - cur) % 5 + 5) % 5; if (diff > 2) diff -= 5; evTarget -= 72 * diff; evIdx = want; });
  car.addEventListener("keydown", e => { if (e.key === "ArrowLeft") goEv(-1); if (e.key === "ArrowRight") goEv(1); });
  // deck
  const deckEl = $("#deck"); let px0 = null;
  const flick = dir => { const cards = $$("#deck .pcard"), front = cards.find(c => +c.dataset.i === deckIdx);
    front.style.transform = `translate3d(${dir * 130}%,-10%,60px) rotateZ(${dir * 20}deg)`; front.style.opacity = "0";
    Sound.paperSoft && Sound.paperSoft(); setTimeout(() => { deckIdx = (deckIdx + (dir > 0 ? 1 : PHOTOS.length - 1)) % PHOTOS.length; layoutDeck(); }, 330); };
  deckEl.addEventListener("pointerdown", e => { px0 = e.clientX; deckEl.setPointerCapture(e.pointerId); });
  deckEl.addEventListener("pointerup", e => { if (px0 == null) return; const dx = e.clientX - px0; px0 = null; if (Math.abs(dx) > 30) flick(dx > 0 ? 1 : -1); else flick(1); });
  $("#dPrev").onclick = () => flick(-1); $("#dNext").onclick = () => flick(1);
  layoutDeck();
  $("#song").onclick = () => { const on = Music.toggle(); $("#song").setAttribute("aria-pressed", on); $("#music").classList.toggle("playing", on); };
  // rsvp
  const pick = (id, single, fn) => $$(`#${id} .chip`).forEach(c => c.onclick = () => { if (single) $$(`#${id} .chip`).forEach(x => x.setAttribute("aria-pressed", x === c));
    else c.setAttribute("aria-pressed", c.getAttribute("aria-pressed") !== "true"); fn(c); });
  pick("rAtt", true, c => { rsvp.attend = c.dataset.v; $("#rMore").style.opacity = rsvp.attend === "no" ? .35 : 1; });
  pick("rEv", false, c => { rsvp.events.has(c.dataset.v) ? rsvp.events.delete(c.dataset.v) : rsvp.events.add(c.dataset.v); });
  pick("rMeal", true, c => { rsvp.meal = c.dataset.v; });
  const ppl = () => { $("#gCount").textContent = rsvp.guests; $("#ppl").innerHTML = Array.from({ length: rsvp.guests }, (_, i) => `<i style="animation-delay:${i * .04}s"></i>`).join(""); };
  $("#gMinus").onclick = () => { rsvp.guests = Math.max(1, rsvp.guests - 1); ppl(); };
  $("#gPlus").onclick = () => { rsvp.guests = Math.min(12, rsvp.guests + 1); ppl(); }; ppl();
  const msg = () => { const n = $("#rName").value.trim() || "A guest";
    if (rsvp.attend === "no") return `RSVP for ${INVITE.bride} & ${INVITE.groom}'s wedding\n${n} regretfully cannot attend.${$("#rMsg").value ? "\nNote: " + $("#rMsg").value : ""}`;
    return `RSVP for ${INVITE.bride} & ${INVITE.groom}'s wedding\nName: ${n}\nAttending: Yes\nGuests: ${rsvp.guests}\nEvents: ${[...rsvp.events].join(", ") || "All"}\nMeal: ${rsvp.meal || "No preference"}${$("#rMsg").value ? "\nNote: " + $("#rMsg").value : ""}`; };
  const done = () => { $("#thanksT").textContent = rsvp.attend === "no" ? "We'll miss you, and we're grateful for your blessings." : "We can't wait to celebrate with you.";
    $("#thanks").classList.add("show"); const r = $("#thanks").getBoundingClientRect(); FX3.burst(r.left + r.width / 2, r.top + r.height / 3, 50); NOTES.slice(2).forEach((n, i) => Sound.bell(n, i * .08, .05, 1.6)); };
  const check = () => { if (!rsvp.attend) { $("#rAtt").animate([{ transform: "translateX(0)" }, { transform: "translateX(-6px)" }, { transform: "translateX(6px)" }, { transform: "translateX(0)" }], { duration: 300 }); return false; } return true; };
  $("#rWa").onclick = () => { if (!check()) return; window.open(`https://wa.me/${RSVP.whatsapp}?text=${encodeURIComponent(msg())}`, "_blank", "noopener"); done(); };
  $("#rMail").onclick = () => { if (!check()) return; window.open(`mailto:${RSVP.email}?subject=${encodeURIComponent("RSVP: " + INVITE.bride + " & " + INVITE.groom)}&body=${encodeURIComponent(msg())}`, "_blank"); done(); };
  $("#rEdit").onclick = () => $("#thanks").classList.remove("show");
  // accordion
  $$(".acc .it").forEach(it => it.querySelector(".hd").onclick = () => { const open = !it.classList.contains("open");
    $$(".acc .it").forEach(x => { x.classList.remove("open"); x.querySelector(".hd").setAttribute("aria-expanded", "false"); });
    if (open) { it.classList.add("open"); it.querySelector(".hd").setAttribute("aria-expanded", "true"); } });
  $("#tyReplay").onclick = () => reset();
  $("#tyShare").onclick = async e => { const url = location.href; try { if (navigator.share) { await navigator.share({ title: `${INVITE.bride} & ${INVITE.groom}`, url }); return; } await navigator.clipboard.writeText(url); e.currentTarget.textContent = LANG === "hi" ? "लिंक कॉपी हो गया" : "Link copied"; } catch (_) {} };
  $("#copyUpi").onclick = async e => { try { await navigator.clipboard.writeText(INFO.upi); e.target.textContent = LANG === "hi" ? "कॉपी हो गया" : "Copied"; } catch (_) { const r = document.createRange(); r.selectNodeContents($("#upi")); getSelection().removeAllRanges(); getSelection().addRange(r); } };
}
const pointerCard = { x: 0, y: 0 }, pcs = { x: 0, y: 0 };
function layoutDeck() { const n = PHOTOS.length;
  $$("#deck .pcard").forEach(c => { const i = +c.dataset.i, pos = (i - deckIdx + n) % n, r = [0, -4, 3.5, -2.5, 5][pos] || 0;
    c.style.zIndex = n - pos; c.style.opacity = pos > 3 ? 0 : 1; c.style.filter = `brightness(${1 - pos * .06})`;
    c.style.transform = `translate3d(${pos * .5}em,${-pos * .55}em,${-pos * 38}px) rotateZ(${r}deg)`; }); }
function renderCarousel(t, dt) {
  if (evAuto && page === 5 && !tr && Math.floor(t / 4.5) !== renderCarousel.k) { if (renderCarousel.k !== undefined) { evTarget -= 72; evIdx = (evIdx + 1) % 5; } renderCarousel.k = Math.floor(t / 4.5); }
  evAng = lerp(evAng, evTarget, 1 - Math.exp(-dt * 6));
  pcs.x = lerp(pcs.x, pointerCard.x, 1 - Math.exp(-dt * 5)); pcs.y = lerp(pcs.y, pointerCard.y, 1 - Math.exp(-dt * 5));
  // coverflow in 3D: the chosen card faces you, neighbours swing back on either side
  $("#ring").style.transform = "";
  $$("#ring .ev").forEach(c => { const i = +c.dataset.i; let rel = ((i + evAng / 72) % 5 + 7.5) % 5 - 2.5;
    const ar = Math.abs(rel), near = Math.max(0, 1 - ar), sgn = Math.sign(rel), cr = Math.min(ar, 1.6);
    c.style.transform = `translateX(${sgn * (cr * 7.2 + Math.max(0, ar - 1) * 2)}em) translateZ(${-cr * 5.5}em) rotateY(${-sgn * Math.min(ar, 1) * 42}deg)`;
    c.style.zIndex = 10 - Math.round(ar * 3); c.style.opacity = ar > 1.9 ? 0 : ar > 1.3 ? (1.9 - ar) / .6 : 1;
    c.style.pointerEvents = ar < .5 ? "auto" : "none";
    const card = c.firstChild; card.style.filter = `brightness(${.7 + .3 * near}) saturate(${.8 + .2 * near})`;
    card.style.transform = near > .5 ? `rotateX(${-pcs.y * 7 * near}deg) rotateY(${pcs.x * 9 * near}deg) translateZ(${near * 1.2}em)` : "";
    card.style.setProperty("--gx", `${50 + pcs.x * 35}%`); card.style.setProperty("--gy", `${30 + pcs.y * 30}%`); });
  $$("#edots button").forEach((b, i) => b.setAttribute("aria-current", i === evIdx));
}
/* soft generated melody for "Play our song" (used when MUSIC.src is empty) */
const Music = (() => { let on = false, iv = null, step = 0, audio = null;
  const scale = [261.6, 293.7, 329.6, 370, 392, 440, 493.9, 523.3]; // Yaman-flavoured (tivra Ma)
  const phrase = [7, 6, 5, 3, 2, 1, 2, 4, 5, 6, 5, 3, 2, 0, 1, 2];
  function toggle() { on = !on; Sound.init(); if (Sound.ctx && Sound.ctx.state === "suspended") Sound.ctx.resume();
    if (MUSIC.src) { if (!audio) { audio = new Audio(MUSIC.src); audio.loop = true; } on ? audio.play() : audio.pause(); return on; }
    if (on) { Sound.pad(); iv = setInterval(() => { const n = phrase[step++ % phrase.length]; Sound.bell(scale[n], 0, .05, 2.6); if (step % 4 === 0) Sound.bell(scale[n] / 2, .02, .03, 3); }, 520); }
    else { clearInterval(iv); Sound.stopPad(); }
    return on; }
  return { toggle, get on() { return on; } };
})();

/* ---------- scene 3/4 build ---------- */
const GLOW3 = [[68, 262], [123, 112], [175, 72], [567, 82], [625, 108], [675, 272], [98, 810], [648, 812], [110, 1108], [245, 1110], [490, 1108], [622, 1110], [655, 1100]];
const g3 = [];
const BGS = {
  arch: { src: "/invitation-assets/asset_14.webp", blur: "/invitation-assets/asset_15.jpg", w: 736, h: 1307, filter: "blur(18px) sepia(.35) brightness(.55)", ui: [92, 104, 552, 820, 24.5], glows: GLOW3 },
  thanks: { src: "/invitation-assets/asset_16.webp", blur: "/invitation-assets/asset_17.jpg", w: 514, h: 774, filter: "blur(16px) saturate(1.1) brightness(.62)", ui: [140, 58, 234, 626, 17.5], glows: [[47, 300], [482, 290], [90, 124], [392, 92]] }
};
const PORTAL = { cx: 368.3, cy: 1014.8, h: 50.5, path: [[355.5, 1040], [355.5, 1000], [355.5, 993, 362, 991, 368.3, 989.5], [374.5, 991, 381, 993, 381, 1000], [381, 1040]] };
let FR = null, front = 0;
function setBg(F, key) { F.bg = key; const b = BGS[key];
  F.img.src = b.src; Object.assign(F.img.style, { width: b.w + "px", height: b.h + "px" }); Object.assign(F.stage.style, { width: b.w + "px", height: b.h + "px" });
  F.blur.style.backgroundImage = `url(${b.blur})`; F.blur.style.filter = b.filter;
  F.glw.innerHTML = ""; F.glows = b.glows.map(([x, y]) => { const g = document.createElement("div"); g.className = "gl3"; g.style.left = x + "px"; g.style.top = y + "px"; F.glw.appendChild(g);
    return { el: g, ph: Math.random() * 6.28, sp: 5 + Math.random() * 4 }; });
  layoutFrame(F); }
function layoutFrame(F) { const b = BGS[F.bg], L = F.L = fit(b), [x, y, w, h, div] = b.ui;
  F.stage.style.transform = F.t3.style.transform = `translate(${L.x}px,${L.y}px) scale(${L.f})`;
  Object.assign(F.ui.style, { left: L.x + x * L.f + "px", top: L.y + y * L.f + "px", width: w * L.f + "px", height: h * L.f + "px", fontSize: (w * L.f / div) + "px" }); }
function movePage(p, F) { const el = $("#pg" + p), host = p <= 4 ? F.t3 : F.ui; if (el.parentNode !== host) host.appendChild(el);
  const want = p === 10 ? "thanks" : "arch"; if (F.bg !== want) setBg(F, want); }
function clearFrame(F) { Object.assign(F.el.style, { transform: "", clipPath: "", opacity: "", filter: "", zIndex: "" }); F.blur.style.visibility = ""; }
const units = [];
function buildScene3() {
  FR = ["#frA", "#frB"].map(id => { const el = $(id); return { el, world: el.querySelector(".world"), blur: el.querySelector(".bgblur"), stage: el.querySelector(".stage"),
    img: el.querySelector(".bgi"), glw: el.querySelector(".glw"), ui: el.querySelector(".ui3"), t3: el.querySelector(".t3"), bg: null, glows: [], L: null }; });
  FR.forEach(F => setBg(F, "arch"));
  $("#c3b").textContent = INVITE.bride; $("#c3g").textContent = INVITE.groom;
  $("#c3bo").textContent = "Daughter of"; $("#c3go").textContent = "Son of"; $("#c3bo").dataset.en = "Daughter of"; $("#c3bo").dataset.hi = "सुपुत्री"; $("#c3go").dataset.en = "Son of"; $("#c3go").dataset.hi = "सुपुत्र";
  $("#vName").textContent = INVITE.venueName; $("#vAddr").innerHTML = INVITE.venueAddress;
  $("#c3bf").textContent = INVITE.brideFather; $("#c3gf").textContent = INVITE.groomFather;
  if (INVITE.couplePhoto) setPhoto(INVITE.couplePhoto);
  $("#cframe").setAttribute("aria-label", `Portrait of ${INVITE.bride} and ${INVITE.groom}`);
  const d = new Date(INVITE.weddingAt), tz = { timeZone: "Asia/Kolkata" };
  $("#sdDay").textContent = d.toLocaleDateString("en-IN", { weekday: "long", ...tz });
  $("#sdDate").textContent = d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", ...tz });
  $("#sdTime").innerHTML = `${INVITE.timeLine}<br>${INVITE.venue}`;
  $("#maplink").href = INVITE.mapUrl;
  // mandala dial behind the countdown
  const NS = "http://www.w3.org/2000/svg"; let m = `<svg class="mand" viewBox="0 0 500 500" aria-hidden="true"><g class="rot" id="mrot" fill="none" stroke="#b08238" stroke-width="1" opacity=".55">`;
  for (let i = 0; i < 16; i++) m += `<path transform="rotate(${i * 22.5} 250 250)" d="M250 70 C272 120 272 170 250 205 C228 170 228 120 250 70 Z"/>`;
  for (let i = 0; i < 32; i++) m += `<path transform="rotate(${i * 11.25} 250 250)" d="M250 34 C258 48 258 60 250 70 C242 60 242 48 250 34 Z" opacity=".7"/>`;
  m += `<circle cx="250" cy="250" r="45"/><circle cx="250" cy="250" r="205"/><circle cx="250" cy="250" r="232" stroke-dasharray="2 6"/></g><g id="ticks">`;
  for (let i = 0; i < 60; i++) m += `<line class="tk" transform="rotate(${i * 6} 250 250)" x1="250" y1="4" x2="250" y2="${i % 5 ? 16 : 24}"/>`;
  m += `</g></svg>`;
  $("#pg4").insertAdjacentHTML("afterbegin", m.replace('class="mand"', 'class="mand fade" style="--d:1.1s"'));
  [["Days", 999], ["Hours", 24], ["Minutes", 60], ["Seconds", 60]].forEach(([lb], i) => {
    const c = document.createElement("div"); c.className = "card fade"; c.style.setProperty("--d", (1.3 + i * .15) + "s");
    c.innerHTML = `<div class="gem"></div><div class="fl"><div class="h t"><span></span></div><div class="h b"><span></span></div><div class="h ft"><span></span></div><div class="h fb"><span></span></div><div class="mid"></div></div>
      <svg class="cb" viewBox="-5 -5 126 146"><path d="M0,136 L0,40 C0,16 38,10 58,0 C78,10 116,16 116,40 L116,136 Z" fill="none" stroke="url(#gGold3)" stroke-width="3"/><path d="M-4,140 L-4,39 C-4,13 36,6 58,-5 C80,6 120,13 120,39 L120,140 Z" fill="none" stroke="url(#gGold3)" stroke-width="1"/></svg><div class="lb" data-en="${lb}" data-hi="${{Days:"दिन",Hours:"घंटे",Minutes:"मिनट",Seconds:"सेकंड"}[lb]}">${lb}</div>`;
    $("#cd").appendChild(c); const fl = c.querySelector(".fl"), sp = [...fl.querySelectorAll("span")];
    units.push({ fl, t: sp[0], b: sp[1], ft: sp[2], fb: sp[3], v: null }); });
}
function setPhoto(src) { const im = $("#cimg"); im.src = src; im.hidden = false; $("#empty").hidden = true; }
$("#cframe").addEventListener("click", e => { if (!INVITE.couplePhoto) { e.stopPropagation(); $("#pick").click(); } });
$("#pick").addEventListener("change", e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => setPhoto(r.result); r.readAsDataURL(f); });
let lastSec = -1;
function tickCountdown() {
  const ms = new Date(INVITE.weddingAt) - Date.now(), sec = Math.floor(ms / 1000);
  if (sec === lastSec) return; lastSec = sec;
  if (ms <= 0) { $("#cdl").textContent = "The celebrations have begun"; }
  const v = ms <= 0 ? [0, 0, 0, 0] : [Math.floor(sec / 86400), Math.floor(sec / 3600) % 24, Math.floor(sec / 60) % 60, sec % 60];
  units.forEach((u, i) => { if (u.v === v[i]) return; const old = u.v === null ? null : String(u.v).padStart(2, "0"); u.v = v[i];
    const txt = String(v[i]).padStart(2, "0"); u.fl.classList.toggle("three", txt.length > 2);
    if (old === null || REDUCED) { u.t.textContent = u.b.textContent = txt; return; }
    // split-flap: old top falls away, new bottom swings down
    u.t.textContent = txt; u.ft.textContent = old; u.b.textContent = old; u.fb.textContent = txt;
    u.fl.classList.remove("go"); void u.fl.offsetWidth; u.fl.classList.add("go");
    clearTimeout(u.to); u.to = setTimeout(() => { u.b.textContent = txt; u.fl.classList.remove("go"); }, 660); });
  const idx = (60 - sec % 60) % 60; $$("#ticks .tk").forEach((e, i) => e.classList.toggle("on", ms > 0 && i === idx));
}

/* ---------- page navigation (scroll / swipe / keys) ---------- */
let tEnter3 = 0, page = 2, tr = null, names2Done = false, wheelAcc = 0, wheelT = 0;
const LAST = 10;
function goPage(p) {
  if (state !== "palace" || tr || p === page || p < 2 || p > LAST) return;
  if (p > page + 1) { goPage(page + 1); return; }
  if (p < page - 1) { goPage(page - 1); return; }
  const gate = Math.min(page, p) === 2, fwd = p > page, dur = REDUCED ? .7 : (gate ? 3.6 : 2.7);
  tr = { a: page, b: p, t0: now(), dur, gate };
  if (gate) { if (p === 3) movePage(3, FR[front]); }
  else { const cur = FR[front], other = FR[1 - front]; movePage(p, other);
    tr.outer = fwd ? cur : other; tr.inner = fwd ? other : cur; }
  page = p;
  if (p >= 3) $("#s3").classList.add("live");
  if (fwd) { Sound.whoosh && Sound.whoosh(); Sound.bell(NOTES[1] / 2, dur * .6, .06, 3.5); } else Sound.bell(NOTES[Math.min(6, p - 1)] / 2, .1, .05, 3);
  const el = $("#pg" + p);
  if (p >= 3) { el.classList.remove("on"); later(() => { el.classList.add("on"); if (p === 3 || p === 10) FX3.burst(innerWidth / 2, innerHeight * .35, p === 10 ? 70 : 30); if (p === 10) NOTES.forEach((n, i) => Sound.bell(n, i * .1, .045, 2)); }, fwd ? dur - .15 : .1); }
  updateNav();
}
function updateNav() {
  const inPalace = state === "palace";
  $("#cue").classList.toggle("show", inPalace && !tr && page < LAST && (page > 2 || names2Done));
  $("#dots").classList.toggle("show", inPalace && (names2Done || page > 2));
  $$("#dots button").forEach(b => b.setAttribute("aria-current", +b.dataset.p === page));
}
$("#dots").innerHTML = ["Names", "The couple", "Date and countdown", "Events", "Moments", "Our story", "RSVP", "Good to know", "Thank you"].map((n, i) => `<button aria-label="${n}" data-p="${i + 2}"></button>`).join("");
const canScroll = (el, dir) => { const sc = el && el.closest && el.closest(".scroll"); if (!sc) return false;
  return dir > 0 ? sc.scrollTop + sc.clientHeight < sc.scrollHeight - 2 : sc.scrollTop > 1; };
addEventListener("wheel", e => { if (state !== "palace") return; if (canScroll(e.target, Math.sign(e.deltaY))) { wheelAcc = 0; return; }
  const t = now(); if (t - wheelT > .4) wheelAcc = 0; wheelT = t; wheelAcc += e.deltaY;
  if (Math.abs(wheelAcc) > 45) { goPage(page + Math.sign(wheelAcc)); wheelAcc = 0; } }, { passive: true });
let ty0 = null, tx0 = null, tTarget = null, tScroll0 = 0;
addEventListener("touchstart", e => { ty0 = e.touches[0].clientY; tx0 = e.touches[0].clientX; tTarget = e.target; const sc = tTarget.closest && tTarget.closest(".scroll"); tScroll0 = sc ? sc.scrollTop : 0; }, { passive: true });
addEventListener("touchend", e => { if (ty0 == null) return; const dy = ty0 - e.changedTouches[0].clientY, dx = tx0 - e.changedTouches[0].clientX; ty0 = null;
  if (Math.abs(dy) < 50 || Math.abs(dx) > Math.abs(dy)) return;
  const sc = tTarget && tTarget.closest && tTarget.closest(".scroll");
  if (sc && (sc.scrollTop !== tScroll0 || canScroll(tTarget, Math.sign(dy)))) return;
  if (tTarget && tTarget.closest && tTarget.closest("input,textarea,#car,#deck")) return;
  goPage(page + Math.sign(dy)); }, { passive: true });
$$("#dots button").forEach(b => b.addEventListener("click", () => goPage(+b.dataset.p)));
addEventListener("keydown", e => { if (state !== "palace" || (e.target.closest && e.target.closest("input,textarea,button,a,#car"))) return;
  if (["ArrowDown", "PageDown", " "].includes(e.key)) { e.preventDefault(); goPage(page + 1); }
  if (["ArrowUp", "PageUp"].includes(e.key)) { e.preventDefault(); goPage(page - 1); } });
$("#cue").addEventListener("click", () => goPage(page + 1));
$("#cue").addEventListener("keydown", e => { if (e.key === "Enter") goPage(page + 1); });


/* ---------- timeline ---------- */
let state = "closed", tOpen = 0, t2 = 0, pointer = { x: 0, y: 0 }, pt = { x: 0, y: 0 };
const timers = [];
const later = (fn, s) => timers.push(setTimeout(fn, s * 1000));
function open() {
  if (state !== "closed") return;
  Sound.init(); if (Sound.ctx && Sound.ctx.state === "suspended") Sound.ctx.resume();
  state = "opening"; tOpen = now(); $("#s1").classList.add("opened");
  Sound.creak(.15, 2.6); Sound.bell(NOTES[0] / 2, .8, .08, 4);
}
function enterPalace() {
  state = "palace"; t2 = now(); page = 2;
  $("#s2").classList.add("live"); $("#s1").style.visibility = "hidden";
  Sound.pad();
  lanEls.forEach(l => later(() => Sound.bell(NOTES[(Math.random() * 4 | 0) + 2], 0, .07, 2.4), l.delay + (REDUCED ? .1 : 1.5)));
  const base = REDUCED ? .6 : 2.6;
  later(() => $("#l1").classList.add("in"), base);
  const reveal = (id, st) => $$(id + " .ch").forEach((c, i) => later(() => c.classList.add("in"), st + i * .09));
  reveal("#bride", base + .6);
  later(() => $("#amp").classList.add("in"), base + 1.5);
  reveal("#groom", base + 1.9);
  later(() => { const r = $("#names").getBoundingClientRect(); FX2.burst(r.left + r.width / 2, r.top + r.height * .45, 40); NOTES.slice(2).forEach((n, i) => Sound.bell(n, i * .09, .05, 2)); }, base + 2.6);
  later(() => $("#orn").classList.add("in"), base + 2.9);
  later(() => $("#l2").classList.add("in"), base + 3.2);
  later(() => $("#dt").classList.add("in"), base + 3.6);
  later(() => { $("#names").classList.add("shine"); $("#replay").classList.add("show"); names2Done = true; updateNav(); }, base + 4.4);
}
function reset() {
  timers.splice(0).forEach(clearTimeout); Sound.stopPad();
  $$(".names .in").forEach(e => e.classList.remove("in")); $("#names").classList.remove("shine"); $("#replay").classList.remove("show");
  lanEls.forEach(l => { l.landed = false; });
  $("#s2").classList.remove("live"); $("#s1").style.visibility = ""; $("#s1").classList.remove("opened");
  page = 2; tr = null; names2Done = false; tEnter3 = 0; $("#pg3").classList.remove("on"); $("#pg4").classList.remove("on");
  $("#s3").classList.remove("live"); ["#s2", "#s3"].forEach(id => { $(id).style.opacity = ""; $(id).style.transform = ""; $(id).style.filter = ""; $(id).style.clipPath = ""; }); $$(".pgu.on,.pg.on").forEach(e => e.classList.remove("on")); front = 0; for (let i = 3; i <= LAST; i++) movePage(i, FR[0]); movePage(3, FR[0]); FR.forEach(clearFrame);
  $("#w1").style.transform = ""; state = "closed"; updateNav();
  K.mode = "idle"; seam.style.transform = "scaleY(0)"; seam.style.opacity = ""; plate.style.opacity = "";
  $("#s1").classList.remove("unlocking"); $("#hintTxt").textContent = "Drag the golden key to the lock"; $("#s1").focus({ preventScroll: true });
}


const GATE = { cx: 374.5, cy: 631.5, h: 33, path: [[366, 648], [366, 626], [366, 620, 371, 618, 374.5, 615], [378, 618, 383, 620, 383, 626], [383, 648]] };
function zoomCurve(u, g0, h1, Ci, Hi) {
  const zEnd = Hi / h1, a = clamp(u / .8), ea = eio(a), eaz = a < .5 ? 4 * a ** 3 : 1 - (-2 * a + 2) ** 3 / 2;
  const z = Math.exp(Math.log(zEnd) * eaz), e2 = eio(clamp((u - .8) / .2));
  return { u, z, zEnd, a, e2, g0, h1, C3: Ci, H3: Hi, gs: { x: lerp(g0.x, Ci.x, ea), y: lerp(g0.y, Ci.y, ea) } };
}
function gateState(u) {
  const sb = 1 + .03 * eout(clamp((now() - t2) / 14)), W = innerWidth, H = innerHeight;
  const g0 = { x: W / 2 + (L2.x + GATE.cx * L2.f - W / 2) * sb, y: H / 2 + (L2.y + GATE.cy * L2.f - H / 2) * sb };
  const H3 = IMG3.h * L3.f, W3 = IMG3.w * L3.f;
  return Object.assign(zoomCurve(u, g0, GATE.h * L2.f * sb, { x: L3.x + W3 / 2, y: L3.y + H3 / 2 }, H3), { sb });
}
function portalState(u, Fo, Fi) {
  const Lo = Fo.L, Li = Fi.L, bi = BGS[Fi.bg], Hi = bi.h * Li.f;
  return zoomCurve(u, { x: Lo.x + PORTAL.cx * Lo.f, y: Lo.y + PORTAL.cy * Lo.f }, PORTAL.h * Lo.f, { x: Li.x + bi.w * Li.f / 2, y: Li.y + Hi / 2 }, Hi);
}
function applyPortal(el, g, PD) {
  if (g.u >= 1) { el.style.transform = ""; el.style.clipPath = ""; return; }
  const k = Math.min(1, g.h1 * g.z / g.H3);
  el.style.transform = `translate(${g.gs.x}px,${g.gs.y}px) scale(${k}) translate(${-g.C3.x}px,${-g.C3.y}px)`;
  const sc = g.H3 / PD.h * (1 + g.e2 * 5), P2 = (x, y) => `${(g.C3.x + (x - PD.cx) * sc).toFixed(1)},${(g.C3.y + (y - PD.cy) * sc + g.e2 * g.H3 * .4).toFixed(1)}`;
  const p = PD.path; el.style.clipPath = `path('M${P2(...p[0])} L${P2(...p[1])} C${P2(p[2][0], p[2][1])} ${P2(p[2][2], p[2][3])} ${P2(p[2][4], p[2][5])} C${P2(p[3][0], p[3][1])} ${P2(p[3][2], p[3][3])} ${P2(p[3][4], p[3][5])} L${P2(...p[4])} Z')`;
}
function renderPalace(t, T, f, g) {
    const s = g.sb + .006 * Math.sin(t * .4) * (1 - g.a);
    const cx = innerWidth / 2 + pt.x * -8 * (1 - g.a), cy = innerHeight / 2 + pt.y * -6 * (1 - g.a);
    const zoom = g.u > 0 ? `translate(${g.gs.x}px,${g.gs.y}px) scale(${g.z}) translate(${-g.g0.x}px,${-g.g0.y}px) ` : "";
    w2.style.transform = zoom + `translate(${cx}px,${cy}px) scale(${s}) translate(${-innerWidth / 2}px,${-innerHeight / 2}px)`;
    // depth: the arch frame, vines and lanterns rush past faster than the far palace
    const fg = g.u > 0 ? `scale(${Math.pow(g.z, .3)})` : "";
    ["#p2over", "#lans", "#glows"].forEach(id => { const e = $(id); e.style.transformOrigin = `${GATE.cx}px ${GATE.cy}px`; e.style.transform = fg; });
    const nm = $("#names"); nm.style.opacity = 1 - clamp(g.u / .16); nm.style.transform = g.u > 0 ? `translateY(${-g.u * 160}px) scale(${1 + g.u * 1.5})` : "";
    $("#gateglow").style.opacity = Math.sin(clamp(g.a * 1.1) * Math.PI) * .85;
    lanEls.forEach(l => { const u = T - l.delay, v = l.v, D = REDUCED ? .6 : 2.3;
      const drop = -(v.y + v.h + 80);
      let y, rot;
      if (u < 0) { y = drop; rot = l.amp; }
      else if (u < D) { const e = eout(u / D); y = drop * (1 - e) + Math.sin(e * Math.PI) * 6; rot = l.amp * (1 - e) * Math.cos(u * 3); }
      else { if (!l.landed) { l.landed = true; } const w = u - D; rot = l.amp * .55 * Math.exp(-w / 1.6) * Math.sin(w * 2.6) + Math.sin(t * .9 + l.ph) * .7; y = Math.sin(t * .7 + l.ph) * .6; }
      l.el.style.transform = `translateY(${y}px) rotate(${rot + pt.x * 1.2}deg)`;
      l.glow.style.opacity = l.landed ? (.55 + .25 * Math.sin(t * 7 + l.ph) * Math.sin(t * 2.3 + l.ph * 2)) : 0;
      l.glow.style.transform = `translate(${-rot * 1.6}px, ${y}px)`; });
    FX2.frame(t, f, 1 + g.a * 5);
}
function applyGate(g) { applyPortal($("#s3"), g, GATE); }
function renderArch(t, f, dt) {
  let u = null, lowP = null, highP = null;
  if (tr && Math.min(tr.a, tr.b) >= 3) { const k = clamp((t - tr.t0) / tr.dur); u = tr.b > tr.a ? k : 1 - k; lowP = Math.min(tr.a, tr.b); highP = Math.max(tr.a, tr.b); }
  // which page shows where
  for (let i = 3; i <= LAST; i++) { const el = $("#pg" + i); if (!el) continue; const st = el.style;
    const show = u === null ? i === page || (tr && i === 3 && Math.min(tr.a, tr.b) === 2) : i === lowP || i === highP;
    if (!show) { st.visibility = "hidden"; el.classList.remove("vis"); continue; }
    const op = u !== null && i === lowP ? 1 - clamp(u / .2) : 1;
    st.visibility = op > .001 ? "visible" : "hidden"; st.opacity = op; st.transform = ""; st.filter = "";
    if (i >= 5) el.classList.toggle("vis", u === null || (i === highP ? u > .95 : u < .05)); }
  if (u === null) { const F = FR[front], O = FR[1 - front]; clearFrame(F); F.el.style.visibility = "visible"; O.el.style.visibility = "hidden"; }
  else { const Fo = tr.outer, Fi = tr.inner, g = portalState(u, Fo, Fi);
    Fo.el.style.visibility = Fi.el.style.visibility = "visible"; Fo.el.style.zIndex = 1; Fi.el.style.zIndex = 2;
    Fo.el.style.transform = `translate(${g.gs.x}px,${g.gs.y}px) scale(${g.z}) translate(${-g.g0.x}px,${-g.g0.y}px)`;
    Fo.el.style.clipPath = ""; Fo.el.style.opacity = 1 - g.e2; Fo.el.style.filter = "";
    if (g.e2 > .98) Fo.el.style.visibility = "hidden";
    Fo.blur.style.visibility = g.z > 1.6 ? "hidden" : ""; Fi.blur.style.visibility = "";
    Fi.el.style.opacity = 1; Fi.el.style.filter = ""; applyPortal(Fi.el, g, PORTAL); }
  const mr = $("#mrot"); if (mr) mr.setAttribute("transform", `rotate(${(t * 3) % 360} 250 250)`);
  FR.forEach(F => F.glows.forEach(g => { g.el.style.opacity = .55 + .3 * Math.sin(t * g.sp + g.ph) * Math.sin(t * 1.7 + g.ph * 2); }));
  if (page === 5 || (tr && (tr.a === 5 || tr.b === 5))) renderCarousel(t, dt);
  FX3.frame(t, f, u === null ? 1 : 1 + Math.sin(u * Math.PI) * 4);
  const F = FR[front]; if (u !== null || F.bg !== "arch") return;
  // lake shimmer + fountain sparkle on the arch scene
  const Lf = F.L, c = fx3.getContext("2d"), map = (x, y) => [Lf.x + x * Lf.f, Lf.y + y * Lf.f];
  c.globalCompositeOperation = "lighter";
  for (let i = 0; i < 26; i++) { const ph = i * 12.9898, x = 240 + ((i * 97.3) % 260), y = 1066 + ((i * 37.7) % 48);
    const a = Math.max(0, Math.sin(t * (1.2 + (i % 5) * .3) + ph)); if (a < .2) continue;
    const [sx, sy] = map(x + Math.sin(t * .5 + i) * 6, y); c.globalAlpha = a * .5; c.fillStyle = "#fff3d6";
    c.beginPath(); c.ellipse(sx, sy, 3.5 * Lf.f, .8 * Lf.f, 0, 0, 6.28); c.fill(); }
  for (let i = 0; i < 14; i++) { const k = ((t * .7 + i / 14) % 1), ang = (i / 14 - .5) * 1.4;
    const [sx, sy] = map(368 + Math.sin(ang) * 22 * k, 1060 - Math.sin(k * Math.PI) * 26 - k * 4);
    c.globalAlpha = (1 - k) * .6; c.fillStyle = "#fffaf0"; c.beginPath(); c.arc(sx, sy, 1.2, 0, 6.28); c.fill(); }
  c.globalCompositeOperation = "source-over"; c.globalAlpha = 1;
}

/* ---------- the golden key ---------- */
const KH = { x: 368.5, y: 728 }, KREST = { x: 452, y: 742 }, KLEN = 172;
const keyEl = $("#key"), keyIn = keyEl.querySelector(".kin"), seam = $("#seam"), plate = $("#plate");
const K = { mode: "idle", t0: 0, x: 0, y: 0, fx: 0, fy: 0, ox: 0, oy: 0, vx: 0 };
let cur1S = 1;
const s2scr = p => ({ x: P.x + (L1.x + p.x * L1.f - P.x) * cur1S, y: P.y + (L1.y + p.y * L1.f - P.y) * cur1S });
function unlock() {
  if (state !== "closed" || (K.mode !== "idle" && K.mode !== "drag")) return;
  Sound.init(); if (Sound.ctx && Sound.ctx.state === "suspended") Sound.ctx.resume();
  K.r0 = K.mode === "idle" ? -24 : 0; K.fx = K.x; K.fy = K.y; K.mode = "fly"; K.t0 = now(); keyEl.classList.remove("drag");
  $("#s1").classList.add("unlocking"); $("#hintTxt").textContent = "Unlocking…";
  Sound.bell(NOTES[4], 0, .04, 1.2); Sound.bell(NOTES[6], .12, .03, 1.2);
}
keyEl.addEventListener("pointerdown", e => { e.stopPropagation(); if (state !== "closed" || K.mode !== "idle") return;
  K.mode = "drag"; K.ox = e.clientX - K.x; K.oy = e.clientY - K.y; keyEl.setPointerCapture(e.pointerId); keyEl.classList.add("drag"); });
keyEl.addEventListener("pointermove", e => { if (K.mode !== "drag") return; const nx = e.clientX - K.ox;
  K.vx = lerp(K.vx, nx - K.x, .3); K.x = nx; K.y = e.clientY - K.oy;
  const h = s2scr(KH); if (Math.hypot(K.x - h.x, K.y - h.y) < 46 * L1.f) unlock(); });
keyEl.addEventListener("pointerup", e => { e.stopPropagation(); if (K.mode === "drag") unlock(); });
keyEl.addEventListener("click", e => e.stopPropagation());
keyEl.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); unlock(); } });
function renderKey(t) {
  const k = KLEN / 176 * L1.f * cur1S, h = s2scr(KH);
  let rotZ = 0, rotY = 0, clip = 0, op = 1, T = t - K.t0;
  if (K.mode === "idle") { const r = s2scr(KREST); K.x = r.x + Math.sin(t * .8) * 4; K.y = r.y + Math.sin(t * 1.6) * 6; rotZ = -24 + Math.sin(t * 1.1) * 7; }
  else if (K.mode === "drag") { rotZ = clamp(K.vx * 1.5, -25, 25); K.vx *= .9; }
  else if (K.mode === "fly") { const D = REDUCED ? .3 : .95, u = clamp(T / D), e = eio(u);
    K.x = lerp(K.fx, h.x, e); K.y = lerp(K.fy, h.y, e) - Math.sin(u * Math.PI) * 70 * L1.f; rotZ = lerp(K.r0 || 0, 360, e);
    if (u >= 1) { K.mode = "insert"; K.t0 = t; Sound.knock(0); Sound.bell(2400, 0, .04, .25); } }
  else if (K.mode === "insert") { const e = eout(clamp(T / .4)); K.x = h.x; K.y = h.y - 22 * L1.f * cur1S * e; clip = 22 * 176 / KLEN * e;
    if (T > .5) { K.mode = "turn"; K.t0 = t; } }
  else if (K.mode === "turn") { const e = eio(clamp(T / .55)); K.x = h.x; K.y = h.y - 22 * L1.f * cur1S; clip = 22 * 176 / KLEN; rotY = 82 * e;
    if (T > .6) { K.mode = "done"; K.t0 = t; Sound.knock(0); Sound.bell(1400, .02, .06, .5); FX1.burst(h.x, h.y, 46); } }
  else if (K.mode === "done") { const e = clamp(T / .5); K.x = h.x; K.y = h.y - 22 * L1.f * cur1S; clip = 22 * 176 / KLEN; rotY = 82; op = 1 - e;
    seam.style.transform = `scaleY(${eout(clamp(T / .55))})`; plate.style.opacity = 1 - e;
    if (T > .6 && state === "closed") open(); }
  keyEl.style.transform = `translate(${K.x - 30}px,${K.y}px) scale(${k})`;
  keyEl.style.clipPath = clip ? `inset(${clip}px -60px 0 -60px)` : "";
  keyEl.style.opacity = op; keyEl.style.visibility = op <= .01 ? "hidden" : "";
  keyIn.style.transform = `perspective(260px) rotateZ(${rotZ}deg) rotateY(${rotY}deg)`;
  keyEl.querySelector(".halo").style.display = K.mode === "idle" || K.mode === "drag" ? "" : "none";
}
/* ---------- render loop ---------- */
const iimg = $("#iimg"), ibg = $("#ibg"), leafL = $("#leafL"), leafR = $("#leafR"), rays = $("#rays"), ilight = $("#ilight"), w1 = $("#w1"), w2 = $("#w2"), tilt = $("#tilt1"), flash = $("#flash");
const partsOf = el => ({ shade: el.querySelector(".shade"), sheen: el.querySelector(".sheen"), spill: el.querySelector(".spill") });
const PL = partsOf(leafL), PR = partsOf(leafR);
let last = now();
function loop() {
  const t = now(), dt = Math.min(.05, t - last); last = t; const f = dt * 60;
  pt.x = lerp(pt.x, pointer.x, 1 - Math.exp(-dt * 3)); pt.y = lerp(pt.y, pointer.y, 1 - Math.exp(-dt * 3));
  if (state !== "palace") {
    const T = state === "opening" ? t - tOpen : 0, sp = REDUCED ? 2.2 : 1;
    // knock jiggle, then the swing
    const jig = T > 0 && T < .45 ? Math.sin(T * 40) * (1 - T / .45) * 1.4 : 0;
    const th = 86 * eio(clamp((T * sp - .5) / 2.7));
    const ang = th + jig;
    leafL.style.transform = `rotateY(${ang}deg)`; leafR.style.transform = `rotateY(${-ang}deg)`;
    const k = ang / 86;
    [PL, PR].forEach(p => { p.shade.style.opacity = Math.sin(k * Math.PI / 2) * .62; p.spill.style.opacity = clamp(k * 3) * (1 - k * .4);
      p.sheen.style.opacity = k > 0 ? Math.sin(k * Math.PI) * .9 : 0; p.sheen.style.backgroundPosition = `${100 - k * 100}% 0`; });
    ilight.style.opacity = state === "opening" ? .96 * (1 - eio(clamp((T * sp - 1.0) / 2.2))) : .96;
    rays.style.opacity = state === "opening" ? Math.sin(clamp((T * sp - .6) / 3.2) * Math.PI) * .95 : 0;
    // camera: idle breathing + pointer tilt, then the dolly through the doorway
    const push = state === "opening" ? eio4(clamp((T * sp - 1.5) / 3.1)) : 0;
    const breathe = 1 + .012 * Math.sin(t * .45);
    const s = lerp(breathe, Z, push); cur1S = s;
    renderKey(t);
    if (state === "opening") seam.style.opacity = 1 - clamp((T * sp - .4) / 1.4);
    w1.style.transform = `translate(${P.x}px,${P.y}px) scale(${s}) translate(${-P.x}px,${-P.y}px)`;
    placeLocal(iimg, interiorRect(push, s), s); placeLocal(ibg, lerpR(B0, BS, push), s);
    tilt.style.transform = `rotateX(${-pt.y * 2.2 * (1 - push)}deg) rotateY(${pt.x * 3 * (1 - push)}deg)`;
    FX1.frame(t, f, 1 + push * 6);
    if (state === "opening" && T * sp > 4.65) enterPalace();
  } else {
    const T = t - t2;
    let p23 = page >= 3 ? 1 : 0;
    if (tr) { const k = clamp((t - tr.t0) / tr.dur), lo = Math.min(tr.a, tr.b), fwd = tr.b > tr.a;
      if (lo === 2) p23 = fwd ? k : 1 - k;
      if (t - tr.t0 > tr.dur) { if (tr.outer) { front = FR.indexOf(tr.b > tr.a ? tr.inner : tr.outer); FR.forEach(clearFrame); }
        tr = null; if (page === 2) $("#s3").classList.remove("live"); updateNav(); } }
    const s2 = $("#s2"), s3 = $("#s3"), g = gateState(p23);
    if (p23 < 1) { s2.style.visibility = ""; renderPalace(t, T, f, g); s2.style.opacity = 1 - g.e2;
      s2.style.filter = ""; s2.style.transform = ""; if (g.e2 > .98) s2.style.visibility = "hidden";
      $("#s2 .bgblur").style.visibility = g.z > 1.6 ? "hidden" : "";
    } else s2.style.visibility = "hidden";
    if (p23 > 0) { s3.style.opacity = 1; applyGate(g); renderArch(t, f, dt); }
  }
  tickCountdown();
  requestAnimationFrame(loop);
}

/* ---------- input ---------- */
$("#s1").addEventListener("click", () => unlock());
$("#s1").addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); unlock(); } });
$("#replay").addEventListener("click", reset);
$("#snd").addEventListener("click", e => { Sound.init(); const on = Sound.toggle(); e.currentTarget.textContent = on ? "Sound on" : "Sound off"; e.currentTarget.setAttribute("aria-pressed", on); });
addEventListener("pointermove", e => { pointer.x = e.clientX / innerWidth * 2 - 1; pointer.y = e.clientY / innerHeight * 2 - 1; });
addEventListener("deviceorientation", e => { if (e.gamma == null) return; pointer.x = clamp(e.gamma / 30, -1, 1); pointer.y = clamp((e.beta - 45) / 30, -1, 1); });
addEventListener("resize", layout);

document.querySelectorAll("[data-copy]").forEach(i => i.src = $(i.dataset.copy).src);
[leafL, leafR].forEach(l => l.style.setProperty("--m", `url(${l.querySelector("img").src})`));
buildScene2(); buildScene3(); buildPages(); layout(); updateNav();
$("#lang").addEventListener("click", () => setLang(LANG === "en" ? "hi" : "en")); requestAnimationFrame(loop);
