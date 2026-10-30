import type { EditorState } from './models';

import { templateFields, replaceTemplateFields } from './template-fields';
export interface TextField { id: string; text: string; section: string; sectionOrder: number; label: string; original: string }
export function portraitSlots(html: string) {
  const fields = templateFields(html).filter(field => field.kind === 'image');
  let index = 0;
  for (const match of html.matchAll(/<(div|span)\b[^>]*>\s*\[(PHOTO|PORTRAIT|COMPANY LOGO)\]\s*<\/\1>/gi)) {
    fields.push({ id: `HTMLPHOTO.${index++}`, label: `${match[2] === 'COMPANY LOGO' ? 'Company logo' : 'Portrait'} ${index}`, group: 'Photos', kind: 'image', value: '', start: match.index!, end: match.index! + match[0].length });
  }
  return fields;
}
export function imageSlots(html: string) { return portraitSlots(html).map(field => field.id.split('.').at(-1)!); }

// This function is serialized into the invitation. Keep it self-contained.
function invitationRuntime(initial: EditorState, channel: string, mediaSlots: { id: string; src: string }[]) {
  let state = initial;
  let lastFields = '';
  const style = document.createElement('style');
  style.id = 'invitation-colors';
  document.head.appendChild(style);

  const visualStyle = document.createElement('style');
  visualStyle.id = 'invitation-visual-edit';
  document.head.appendChild(visualStyle);
  let visualMode = false;
  let editableNodes = new Map<Element, { path: string; node: Node }[]>();
  let editor: HTMLDivElement | undefined;
  let selectedNode: Node | undefined;
  function closeEditor() { editor?.remove(); editor = undefined; selectedNode = undefined; }
  function editText(el: Element) {
    const entries = editableNodes.get(el);
    if (!entries?.length) return;
    closeEditor();
    editor = document.createElement('div');
    editor.id = 'weinviteu-text-editor';
    editor.setAttribute('role', 'dialog');
    editor.setAttribute('aria-label', 'Edit selected text');
    editor.style.cssText = 'position:fixed;inset:auto 12px 12px;z-index:2147483647;background:#fff;color:#222;padding:14px;border:2px solid #b88b32;border-radius:10px;box-shadow:0 4px 24px #0008;font:14px sans-serif;max-width:420px;margin:auto;pointer-events:auto';
    const label = document.createElement('label');
    label.textContent = 'Edit selected text';
    const input = document.createElement('textarea');
    input.setAttribute('aria-label', 'Selected template text');
    input.maxLength = 10000;
    input.style.cssText = 'display:block;width:100%;box-sizing:border-box;min-height:80px;margin:8px 0;color:#222;background:white;font:16px sans-serif;user-select:text';
    let chosen = entries[0];
    const selectEntry = (index: number) => {
      chosen = entries[index]; selectedNode = chosen.node;
      input.value = chosen.node.nodeValue || '';
      parent.postMessage({ type: 'invitation-field-focus', channel, path: chosen.path }, '*');
    };
    if (entries.length > 1) {
      const select = document.createElement('select');
      select.setAttribute('aria-label', 'Text part');
      entries.forEach((entry, index) => { const option = document.createElement('option'); option.value = String(index); option.textContent = `Part ${index + 1}: ${(entry.node.nodeValue || '').trim().slice(0, 50)}`; select.appendChild(option); });
      select.addEventListener('change', () => selectEntry(Number(select.value)));
      editor.appendChild(select);
    }
    label.appendChild(input); editor.appendChild(label);
    const done = document.createElement('button');
    done.type = 'button'; done.textContent = 'Done';
    done.style.cssText = 'padding:8px 18px;color:#222;background:#f3dc9a;border:0;border-radius:6px;cursor:pointer';
    done.addEventListener('click', closeEditor); editor.appendChild(done);
    const hint = document.createElement('p'); hint.textContent = 'Updates the preview as you type. Save changes in the admin panel to keep your edits.'; hint.style.cssText = 'font:12px sans-serif;margin:8px 0 0;color:#555'; editor.appendChild(hint);
    input.addEventListener('input', () => {
      state.texts = { ...state.texts, [chosen.path]: input.value };
      chosen.node.nodeValue = input.value;
      parent.postMessage({ type: 'invitation-inline-edit', channel, path: chosen.path, text: input.value }, '*');
      apply();
    });
    for (const type of ['pointerdown', 'mousedown', 'click', 'keydown', 'keyup', 'wheel', 'touchstart', 'touchmove']) editor.addEventListener(type, e => e.stopPropagation());
    input.addEventListener('keydown', e => { if (e.key === 'Escape') closeEditor(); });
    document.body.appendChild(editor); selectEntry(0); input.focus();
  }

  let hitTimer: ReturnType<typeof setInterval> | undefined;
  function refreshHitTargets() {
    document.querySelectorAll('.weinviteu-editable').forEach(el => {
      let visible = true;
      for (let ancestor: Element | null = el; ancestor; ancestor = ancestor.parentElement) {
        const css = getComputedStyle(ancestor);
        if (css.display === 'none' || css.visibility === 'hidden' || css.opacity === '0') { visible = false; break; }
      }
      el.classList.toggle('weinviteu-hit-target', visible);
    });
  }
  function updateVisualStyles() {
    clearInterval(hitTimer);
    document.querySelectorAll('.weinviteu-hit-target').forEach(el => el.classList.remove('weinviteu-hit-target'));
    if (!channel || !visualMode) {
      visualStyle.textContent = '';
      return;
    }
    hitTimer = setInterval(refreshHitTargets, 150);
    refreshHitTargets();
    visualStyle.textContent = '.weinviteu-hit-target{pointer-events:auto!important}.weinviteu-editable{outline:1.5px dashed rgba(212,175,55,0.45)!important;outline-offset:3px!important;cursor:pointer!important;border-radius:4px!important;transition:outline .15s ease,background .15s ease!important;user-select:text!important;-webkit-user-select:text!important}.weinviteu-editable:hover{outline:2px dashed #f3dc9a!important;background:rgba(212,175,55,0.18)!important}.weinviteu-editable:focus{outline:2.5px solid #d4af37!important;background:rgba(212,175,55,0.28)!important}';
  }
  updateVisualStyles();

  // Section navigation for the editor: drives the template's own intro and page controls,
  // then checks that the chosen page is really on screen. Templates differ, so nothing is assumed.
  const CLOSING_ORDER = 9999;
  let pageList: Element[] = [];
  let navToken = 0;
  const probeStyle = document.createElement('style');
  probeStyle.textContent = '.weinviteu-probe,.weinviteu-probe *{pointer-events:auto!important}';
  document.head.appendChild(probeStyle);
  const openers = ['openDoors', 'openDoor', 'openRibbon', 'openCurtains', 'openEnv', 'openSeal', 'enterTemple', 'unlock'];
  type NavState = { page: number | null; busy: boolean; go: string } | undefined;
  function runGlobal<T>(code: string): T | undefined {
    // Template functions and their let/const state live in the page's global scope.
    const w = window as unknown as { __weinviteuResult?: T };
    w.__weinviteuResult = undefined;
    const script = document.createElement('script');
    script.textContent = `try{window.__weinviteuResult=(function(){${code}})()}catch(e){window.__weinviteuResult=undefined}`;
    document.documentElement.appendChild(script); script.remove();
    return w.__weinviteuResult;
  }
  const readNav = () => runGlobal<NavState>("return { page: typeof page === 'number' ? page : null, busy: !!((typeof tr !== 'undefined' && tr) || (typeof busy !== 'undefined' && busy === true)), go: typeof goPage === 'function' ? 'goPage' : typeof goCard === 'function' ? 'goCard' : '' }");
  function isShown(el: Element) {
    const r = el.getBoundingClientRect();
    const w = Math.min(r.right, innerWidth) - Math.max(r.left, 0), h = Math.min(r.bottom, innerHeight) - Math.max(r.top, 0);
    if (w < 40 || h < 40 || w * h < 0.3 * Math.min(r.width * r.height, innerWidth * innerHeight)) return false;
    for (let a: Element | null = el; a; a = a.parentElement) {
      const css = getComputedStyle(a);
      if (css.display === 'none' || css.visibility === 'hidden' || Number(css.opacity) < 0.05) return false;
    }
    // Something on top (a closed door, an envelope) means the page is not really visible yet.
    // Pages often ignore pointer events, so let them catch hits while probing.
    const cx = Math.max(r.left, 0) + w / 2, cy = Math.max(r.top, 0) + h / 2;
    el.classList.add('weinviteu-probe');
    const clear = [[cx, cy], [cx, Math.max(r.top, 0) + h * 0.25], [cx, Math.max(r.top, 0) + h * 0.75]].some(([x, y]) => {
      const hit = document.elementFromPoint(x, y);
      return !hit || el.contains(hit) || hit.contains(el);
    });
    el.classList.remove('weinviteu-probe');
    return clear;
  }
  function celebrate(label: string) {
    document.getElementById('weinviteu-nav-glow')?.remove();
    const glow = document.createElement('div');
    glow.id = 'weinviteu-nav-glow';
    glow.setAttribute('aria-hidden', 'true');
    glow.innerHTML = '<style>@keyframes wiuGlow{0%{opacity:0}18%{opacity:1}100%{opacity:0}}@keyframes wiuChip{0%{opacity:0;transform:translate(-50%,-12px) scale(.96)}15%,75%{opacity:1;transform:translate(-50%,0) scale(1)}100%{opacity:0;transform:translate(-50%,-6px) scale(.98)}}</style>'
      + '<div style="position:fixed;inset:0;pointer-events:none;z-index:2147483646;box-shadow:inset 0 0 0 2px rgba(212,175,55,.85),inset 0 0 60px 6px rgba(212,175,55,.35);animation:wiuGlow 1.8s ease-out forwards"></div>'
      + '<div style="position:fixed;top:14px;left:50%;pointer-events:none;z-index:2147483647;padding:7px 16px;border-radius:999px;background:rgba(18,14,6,.82);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);color:#fce7b2;border:1px solid rgba(212,175,55,.6);font:600 12px/1.2 system-ui,sans-serif;letter-spacing:.04em;white-space:nowrap;max-width:80vw;overflow:hidden;text-overflow:ellipsis;box-shadow:0 6px 24px rgba(0,0,0,.35);animation:wiuChip 1.8s ease forwards"></div>';
    (glow.lastElementChild as HTMLElement).textContent = `✦ ${label}`;
    document.documentElement.appendChild(glow);
    setTimeout(() => glow.remove(), 1900);
  }
  function gotoSection(order: number, label: string) {
    const token = ++navToken;
    const report = (status: 'moving' | 'arrived' | 'unreachable', step?: number) => parent.postMessage({ type: 'invitation-section-status', channel, status, order, step, total: pageList.length }, '*');
    const target = order === CLOSING_ORDER ? pageList.at(-1) : pageList.find(el => sectionRank.get(el) === order - 1);
    if (!target) { report('unreachable'); return; }
    const targetIndex = pageList.indexOf(target);
    const started = Date.now();
    let mode: 'jump' | 'forward' | 'back' = 'jump', jumps = 0, stalls = 0, sweeps = 0;
    report('moving');
    const arrive = () => {
      if (order === CLOSING_ORDER) target.scrollIntoView({ behavior: 'smooth', block: 'end' });
      celebrate(label); report('arrived');
    };
    const tick = () => {
      if (token !== navToken) return;
      // Announce arrival only once the template's page-turn animation has finished.
      if (isShown(target)) { if (readNav()?.busy) { setTimeout(tick, 200); return; } return arrive(); }
      // Some templates animate one page at a time for a few seconds each.
      if (Date.now() - started > 45000) return report('unreachable');
      const nav = readNav();
      if (!nav?.go) {
        // An ordinary scrolling page: bring the section into view.
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setTimeout(() => { if (token === navToken) { if (isShown(target)) arrive(); else report('unreachable'); } }, 900);
        return;
      }
      if (nav.busy) { setTimeout(tick, 220); return; }
      const current = pageList.findIndex(isShown);
      if (current >= 0) report('moving', current + 1);
      const from = nav.page ?? 0;
      const step = mode === 'jump' && current >= 0 && jumps < 6 ? targetIndex - current : mode === 'back' ? -1 : 1;
      if (mode === 'jump' && current >= 0) jumps++;
      runGlobal(`${nav.go}(${from + step})`);
      setTimeout(() => {
        if (token !== navToken) return;
        const after = readNav();
        if (after && (after.page !== from || after.busy)) { stalls = 0; tick(); return; }
        // Nothing moved: the intro is still closed, or this is the first/last page.
        stalls++;
        // While no page is showing yet the intro needs opening, which can take a few seconds.
        if (current < 0) runGlobal(openers.map(name => `if (typeof ${name} === 'function') ${name}();`).join(''));
        if (stalls > (current < 0 ? 12 : 1)) {
          stalls = 0;
          // Sweep towards the target first, then the other way; give up after both ends.
          if (mode === 'jump') mode = current >= 0 && targetIndex < current ? 'back' : 'forward';
          else if (sweeps++ === 0) mode = mode === 'forward' ? 'back' : 'forward';
          else return report('unreachable');
        }
        setTimeout(tick, 250);
      }, 380);
    };
    tick();
  }

  const excluded = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG', 'CANVAS', 'IFRAME', 'INPUT', 'TEXTAREA', 'SELECT', 'NAV', 'OPTION', 'OUTPUT']);
  const originals = new WeakMap<Node, string>();
  const originalSections = new WeakMap<Element, string>();
  const sectionRank = new WeakMap<Element, number>();
  let nextRank = 0;
  const skipSelector = '.ctrl,.langw,.dots,.cue,.pageno,.countdown,.count,.flip,.cd,.timer,#weinviteu-text-editor,#invitation-audio,#dots,#langMenu,#langBtn,#replay,#snd,#song,#done,#pnow,#gc,#gCount,#gh,#ppl,#boyCount,#girlCount,#gm,#gp,button[data-d]';
  let observer: MutationObserver;
  function apply() {
    observer?.disconnect();
    style.textContent = `${state.primaryColor ? `h1,h2,h3,.xname,.ph1,.etitle{color:${state.primaryColor}!important}` : ''}${state.bgColor ? `body,.ibg,.bgblur,.scene{background-color:${state.bgColor}!important}` : ''}`;
    const fields: TextField[] = [];
    editableNodes = new Map();

    // Robust multi-tier section discovery for arbitrary templates
    let sections = Array.from(document.querySelectorAll('.pg, .pgu, section.sec, .invite-page, .page-section'));
    let activeSelector = '.pg, .pgu, section.sec, .invite-page, .page-section';
    if (sections.length === 0) {
      const semantic = Array.from(document.querySelectorAll('section, article, [data-section], [data-page]'));
      if (semantic.length > 0) {
        sections = semantic;
        activeSelector = 'section, article, [data-section], [data-page]';
      }
    }
    if (sections.length === 0) {
      const classBased = Array.from(document.querySelectorAll('.page, .slide, .card, .screen, .view, .panel-page'));
      const substantial = classBased.filter(el => (el.textContent || '').trim().length > 5);
      if (substantial.length > 0) {
        sections = substantial;
        activeSelector = '.page, .slide, .card, .screen, .view, .panel-page';
      }
    }

    // Some templates move their pages around the DOM while navigating; number each page by when it was
    // first seen so section numbers (and the editor's section dropdown) stay stable.
    // A page frame that holds another page is a container, not a page of its own.
    sections = sections.filter(el => !sections.some(other => other !== el && el.contains(other)));
    // Pages named like p1…p6 or pg3…pg10 are numbered by the template itself; otherwise use page order.
    const numbered = sections.map(el => /^([a-z_-]*?)(\d+)$/i.exec(el.id));
    const byNumber = numbered.every(m => m && m[1] === numbered[0]![1]);
    const unranked = sections.filter(el => !sectionRank.has(el));
    if (byNumber) unranked.sort((a, b) => Number(/\d+$/.exec(a.id)![0]) - Number(/\d+$/.exec(b.id)![0]));
    unranked.forEach(el => sectionRank.set(el, nextRank++));
    sections.sort((a, b) => sectionRank.get(a)! - sectionRank.get(b)!);
    pageList = sections;

    function sectionOf(el: Element) {
      const section = el.closest(activeSelector);
      if (section && sections.includes(section)) {
        if (!originalSections.has(section)) {
          const pageIndex = sections.indexOf(section);
          const navigationLabel = document.querySelectorAll('#dots button, nav a, .nav-dots button')[pageIndex]?.getAttribute('aria-label');
          const title = section.getAttribute('data-section-title') ||
            section.getAttribute('data-title') ||
            section.getAttribute('aria-label') ||
            navigationLabel ||
            section.querySelector('h1,h2,h3,h4,.ph1,.xname,.title,.heading,.section-title,.eyebrow,.lbl,.names,.big')?.textContent?.trim() ||
            `Page ${pageIndex + 1}`;
          originalSections.set(section, title.replace(/\s+/g, ' ').slice(0, 90));
        }
        return { section: originalSections.get(section)!, sectionOrder: sectionRank.get(section)! + 1 };
      }

      // Check if el is before or after detected sections
      if (sections.length > 0) {
        const first = sections[0];
        if (first.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_PRECEDING) {
          return { section: 'Opening / door', sectionOrder: 0 };
        }
        const last = sections[sections.length - 1];
        if (last.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING) {
          return { section: 'Closing / Footer', sectionOrder: CLOSING_ORDER };
        }
      }

      // For templates with no section elements at all (flat HTML structure): group by nearest preceding heading
      let cur: Element | null = el;
      let headingText = '';
      while (cur && cur !== document.body) {
        let p = cur.previousElementSibling;
        while (p) {
          if (/^H[1-4]$/i.test(p.tagName) || p.querySelector('h1,h2,h3,h4')) {
            const h = /^H[1-4]$/i.test(p.tagName) ? p : p.querySelector('h1,h2,h3,h4');
            headingText = (h?.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 90);
            break;
          }
          p = p.previousElementSibling;
        }
        if (headingText) break;
        cur = cur.parentElement;
      }
      if (headingText) {
        return { section: headingText, sectionOrder: 1 };
      }

      return { section: 'Opening / door', sectionOrder: 0 };
    }

    function walk(node: Node, path: string) {
      if (node.nodeType === 3) {
        const current = node.nodeValue ?? '';
        if (!originals.has(node)) originals.set(node, current);
        const original = originals.get(node)!;
        if (!original.trim() && state.texts[path] === undefined) return;
        const text = state.texts[path] ?? current;
        const el = node.parentElement!;

        if (document.activeElement !== el && node.nodeValue !== text) {
          node.nodeValue = text;
        }

        const heading = el.closest('h1,h2,h3,h4,.ph1,.xname,.etitle');
        const label = heading ? 'Heading' : el.closest('a') ? 'Link label' : el.closest('button') ? 'Button label' : el.closest('label') ? 'Form label' : 'Text';
        fields.push({ id: path, text, original, label, ...sectionOf(el) });

        if (channel) {
          const entries = editableNodes.get(el) || [];
          entries.push({ path, node }); editableNodes.set(el, entries);
          el.classList.add('weinviteu-editable');
        }
      } else if (node.nodeType === 1) {
        const el = node as Element;
        if (excluded.has(el.tagName) || el.matches(skipSelector) || el.hasAttribute('data-weinviteu-photo')) return;
        Array.from(node.childNodes).forEach((child, index) => walk(child, `${path}.${index}`));
      }
    }
    walk(document.body, 'body');
    if (selectedNode && !selectedNode.isConnected) closeEditor();
    if (channel) document.querySelectorAll('[data-weinviteu-photo]').forEach(el => el.classList.add('weinviteu-editable'));
    const matchedPhotos = new Map<string, number>();
    if (channel) document.querySelectorAll('img').forEach(img => {
      const src = img.getAttribute('src') || '';
      const matches = mediaSlots.filter(slot => slot.src && (slot.src === src || slot.src === img.src));
      const index = matchedPhotos.get(src) || 0;
      const match = matches[index] || matches[0];
      matchedPhotos.set(src, index + 1);
      if (match) { img.dataset.weinviteuPhoto = match.id; img.classList.add('weinviteu-editable'); }
    });

    const hasCanvas = document.querySelector('canvas') !== null;
    let hasCanvasText = false;
    try {
      const scripts = Array.from(document.querySelectorAll('script')).map(s => s.textContent || '').join(' ');
      hasCanvasText = /\.fillText\s*\(|\.strokeText\s*\(/i.test(scripts);
    } catch {}

    const serialized = JSON.stringify(fields);
    if (channel && serialized !== lastFields) {
      lastFields = serialized;
      parent.postMessage({ type: 'invitation-fields', channel, fields, hasCanvas, hasCanvasText }, '*');
    }
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  }
  function start() {
    observer = new MutationObserver(apply);
    apply();
    if (state.musicUrl) {
      // Mute the template's original effects so the uploaded track cannot overlap them.
      const sound = document.getElementById('snd');
      const muteOriginal = () => {
        if (sound?.classList.contains('on') || sound?.getAttribute('aria-pressed') === 'true') sound.click();
      };
      muteOriginal();
      if (sound) {
        sound.style.display = 'none';
        // Some uploaded templates start their original audio only after opening.
        new MutationObserver(muteOriginal).observe(sound, { attributes: true, attributeFilter: ['class', 'aria-pressed'] });
      }
      const audio = new Audio(state.musicUrl);
      audio.volume = 0.65;
      audio.loop = true;
      const button = document.createElement('button');
      button.id = 'invitation-audio';
      button.textContent = 'Play music';
      button.style.cssText = 'position:fixed;bottom:16px;right:16px;z-index:2147483647;padding:10px;border-radius:20px;background:#fff;color:#222';
      button.setAttribute('aria-pressed', 'false');
      const toggle = async () => {
        if (audio.paused) {
          try { await audio.play(); button.textContent = 'Pause music'; button.setAttribute('aria-pressed', 'true'); }
          catch { button.textContent = 'Try playing music again'; }
        } else { audio.pause(); button.textContent = 'Play music'; button.setAttribute('aria-pressed', 'false'); }
      };
      button.addEventListener('click', toggle);
      document.addEventListener('click', event => {
        if ((!channel || !visualMode) && (event.target as Element)?.closest?.('#song')) { event.preventDefault(); event.stopImmediatePropagation(); void toggle(); }
      }, true);
      audio.addEventListener('error', () => { button.textContent = 'Music unavailable'; button.setAttribute('aria-pressed', 'false'); });
      document.addEventListener('visibilitychange', () => { if (document.hidden) { audio.pause(); button.textContent = 'Play music'; button.setAttribute('aria-pressed', 'false'); } });
      document.body.appendChild(button);
    }
    if (channel) {
      document.addEventListener('click', e => {
        if (!visualMode || (e.target as Element)?.closest?.('#weinviteu-text-editor')) return;
        const target = e.target as Element;
        const photo = target.closest<HTMLElement>('[data-weinviteu-photo]');
        const music = target.closest('#snd,#song,#invitation-audio');
        const editable = target.closest('.weinviteu-editable');
        if (!photo && !music && !editable) return;
        e.preventDefault(); e.stopImmediatePropagation();
        if (photo || music) {
          closeEditor();
          parent.postMessage({ type: 'invitation-media-focus', channel, slot: photo?.dataset.weinviteuPhoto || '' }, '*');
        } else if (editable) editText(editable);
      }, true);

      window.addEventListener('message', event => {
        if (event.source !== parent || event.data?.channel !== channel) return;
        if (event.data?.type === 'invitation-update') {
          state = event.data.state;
          apply();
        }
        if (event.data?.type === 'invitation-toggle-visual-edit') {
          visualMode = Boolean(event.data.enabled);
          updateVisualStyles();
          if (!visualMode) closeEditor();
        }
        if (event.data?.type === 'invitation-goto-section' && typeof event.data.order === 'number') {
          gotoSection(event.data.order, String(event.data.label || ''));
        }
      });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
}

export function renderInvitation(source: string, state: EditorState, channel = '') {
  const values = { ...state.config };
  for (const field of portraitSlots(source)) {
    // Old drafts used short keys; keep their first matching slot working.
    const legacy = field.id.split('.').at(-1)!;
    const first = portraitSlots(source).find(slot => slot.id.endsWith(`.${legacy}`));
    const image = state.images[field.id] || (first?.id === field.id ? state.images[legacy] : undefined);
    if (image) values[field.id] = image;
  }
  let prepared = source;
  for (const slot of portraitSlots(source).filter(slot => slot.id.startsWith('HTMLPHOTO.')).sort((a, b) => b.start - a.start)) {
    let tag = source.slice(slot.start, slot.end);
    tag = tag.replace(/^<([a-z]+)/i, `<$1 data-weinviteu-photo="${slot.id}"`);
    const image = state.images[slot.id];
    if (image && /^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(image)) {
      tag = tag.replace(/\[(PHOTO|PORTRAIT|COMPANY LOGO)\]/i, `<img src="${image}" alt="${slot.label}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;display:block">`);
    }
    prepared = prepared.slice(0, slot.start) + tag + prepared.slice(slot.end);
  }
  let html = replaceTemplateFields(prepared, values);
  // Template browser titles often repeat the original names outside their config.
  const escapeTitle = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  html = html.replace(/(<title\b[^>]*>)([\s\S]*?)(<\/title>)/i, (_, start, title: string, end) => {
    for (const field of templateFields(source)) {
      const replacement = values[field.id];
      if (typeof field.value === 'string' && field.value.length > 1 && typeof replacement === 'string' && field.kind === 'text') {
        title = title.split(escapeTitle(field.value)).join(escapeTitle(replacement));
      }
    }
    return start + title + end;
  });
  const serialized = JSON.stringify(state).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  const polyfill = "var __name = (window.__name = window.__name || function(f) { return f; });";
  const mediaSlots = portraitSlots(source).map(field => ({ id: field.id, src: String(values[field.id] ?? field.value) }));
  const script = `<script data-weinviteu-runtime>${polyfill}(${invitationRuntime.toString()})(${serialized},${JSON.stringify(channel)},${JSON.stringify(mediaSlots).replace(/</g, '\\u003c')});</script>`;
  return /<\/body>/i.test(html) ? html.replace(/<\/body>/i, () => `${script}</body>`) : html + script;
}
