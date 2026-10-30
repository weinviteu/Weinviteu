// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { JSDOM } from 'jsdom';
import { renderInvitation, imageSlots, type TextField } from '../src/lib/invitation';
import { emptyEditor } from '../src/lib/models';

function open(source: string, state = emptyEditor()) {
  return new JSDOM(renderInvitation(source, state), { runScripts: 'dangerously', url: 'https://invite.test' });
}
const ready = () => new Promise(resolve => setTimeout(resolve, 20));

describe('invitation persistence', () => {
  it('reapplies text after scripts rebuild content, including after reopening', async () => {
    const source = '<html><head></head><body><div id="content"></div><script>document.getElementById("content").innerHTML="<h1>Original</h1>";</script></body></html>';
    const state = { ...emptyEditor(), texts: { 'body.0.0.0': 'Our wedding <3 $& </script>' } };
    const dom = open(source, state); await ready();
    expect(dom.window.document.querySelector('h1')?.textContent).toBe('Our wedding <3 $& </script>');
    dom.window.document.querySelector('#content')!.innerHTML = '<h1>Original</h1>';
    await ready();
    expect(dom.window.document.querySelector('h1')?.textContent).toBe('Our wedding <3 $& </script>');
    const reopened = open(source, state); await ready();
    expect(reopened.window.document.querySelector('h1')?.textContent).toBe('Our wedding <3 $& </script>');
    dom.window.close(); reopened.window.close();
  });
  it('keeps text and styles when a photo rebuilds the preview', async () => {
    const source = '<html><head></head><body><h1>Name</h1><script>const CFG={couplePhoto:"old.jpg"};window.photo=CFG.couplePhoto;</script></body></html>';
    const state = { ...emptyEditor(), texts: { 'body.0.0': 'New name' }, primaryColor: '#112233', bgColor: '#445566', images: { couplePhoto: 'data:image/png;base64,YQ==' } };
    expect(imageSlots(source)).toEqual(['couplePhoto']);
    const dom = open(source, state); await ready();
    expect(dom.window.document.querySelector('h1')?.textContent).toBe('New name');
    expect(dom.window.document.getElementById('invitation-colors')?.textContent).toContain('#445566');
    expect((dom.window as unknown as { photo: string }).photo).toBe(state.images.couplePhoto);
    dom.window.close();
  });
  it('stores music and renders a guest-controlled playback button', async () => {
    const dom = open('<body><h1>Invite</h1></body>', { ...emptyEditor(), musicUrl: 'data:audio/mpeg;base64,YQ==' });
    await ready();
    expect(dom.window.document.getElementById('invitation-audio')?.textContent).toBe('Play music');
    dom.window.close();
  });
  it('never executes edited text as HTML', async () => {
    const dom = open('<body><h1>Name</h1></body>', { ...emptyEditor(), texts: { 'body.0.0': '<img src=x onerror="window.hacked=1">' } });
    await ready();
    expect(dom.window.document.querySelector('img')).toBeNull();
    expect(dom.window.document.querySelector('h1')?.textContent).toContain('<img');
    dom.window.close();
  });
});

it('groups text in page order and excludes decorative panels and live counters', async () => {
  const source = '<body><div class="panel"></div><button>Open</button><section class="pg"><div class="lbl">Welcome</div><output>2</output><div class="countdown">99</div><button id="gp">+</button></section><nav id="dots"><button aria-label="Celebrating">1</button></nav></body>';
  const dom = new JSDOM(renderInvitation(source, emptyEditor(), 'test'), { runScripts: 'dangerously', url: 'https://invite.test' });
  const messages: { fields: { text: string; section: string; sectionOrder: number }[] }[] = [];
  dom.window.addEventListener('message', e => messages.push(e.data));
  await ready();
  const fields = messages.at(-1)!.fields;
  expect(fields.map(f => f.text)).toEqual(['Open', 'Welcome']);
  expect(fields.map(f => [f.sectionOrder, f.section])).toEqual([[0, 'Opening / door'], [1, 'Celebrating']]);
  dom.window.close();
});

it('keeps intentionally blank wording blank after reopening', async () => {
  const dom = open('<body><h1>Original</h1></body>', { ...emptyEditor(), texts: { 'body.0.0': '' } });
  await ready();
  expect(dom.window.document.querySelector('h1')!.textContent).toBe('');
  dom.window.close();
});

it('mutes the original sound control when custom music is present', async () => {
  const dom = open('<body><button id="snd" class="on" aria-pressed="true" onclick="this.classList.remove(\'on\');this.setAttribute(\'aria-pressed\',\'false\')">Sound</button></body>', { ...emptyEditor(), musicUrl: 'data:audio/wav;base64,YQ==' });
  await ready();
  const button = dom.window.document.getElementById('snd')!;
  expect(button.getAttribute('aria-pressed')).toBe('false');
  expect(button.style.display).toBe('none');
  dom.window.close();
});

it('automatically detects sections in arbitrary templates with semantic section tags and headings', async () => {
  const source = '<body><header><h1>Save the Date</h1></header><section><h2>Our Story</h2><p>How we met</p></section><section><h2>Wedding Details</h2><p>At the Grand Hall</p></section></body>';
  const dom = new JSDOM(renderInvitation(source, emptyEditor(), 'test-arbitrary'), { runScripts: 'dangerously', url: 'https://invite.test' });
  const messages: { fields: TextField[]; hasCanvas?: boolean; hasCanvasText?: boolean }[] = [];
  dom.window.addEventListener('message', e => messages.push(e.data));
  await ready();
  const lastMsg = messages.at(-1)!;
  expect(lastMsg.fields.length).toBeGreaterThan(0);
  const sections = Array.from(new Set(lastMsg.fields.map((f: TextField) => f.section)));
  expect(sections).toContain('Our Story');
  expect(sections).toContain('Wedding Details');
  dom.window.close();
});

it('detects canvas elements and canvas text rendering in runtime bridge', async () => {
  const source = '<body><canvas id="art"></canvas><script>// Canvas drawing with text\nfunction draw(ctx) { ctx.fillText("Hello", 10, 10); }\n</script></body>';
  const dom = new JSDOM(renderInvitation(source, emptyEditor(), 'test-canvas'), { runScripts: 'dangerously', url: 'https://invite.test' });
  const messages: { fields: TextField[]; hasCanvas?: boolean; hasCanvasText?: boolean }[] = [];
  dom.window.addEventListener('message', e => messages.push(e.data));
  await ready();
  const lastMsg = messages.at(-1)!;
  expect(lastMsg.hasCanvas).toBe(true);
  expect(lastMsg.hasCanvasText).toBe(true);
  dom.window.close();
});

it('prevents door opening click handlers from firing when clicking editable text on door in visual mode', async () => {
  const source = `<body>
    <div id="door">
      <button id="seal" onclick="window.doorOpened = true">
        <span class="txt">Touch to open door</span>
      </button>
    </div>
  </body>`;
  const dom = new JSDOM(renderInvitation(source, emptyEditor(), 'test-door'), {
    runScripts: 'dangerously',
    url: 'https://invite.test',
    beforeParse(window) {
      (window as unknown as { doorOpened: boolean }).doorOpened = false;
    }
  });
  await ready();
  const editableSpan = dom.window.document.querySelector('.weinviteu-editable') as HTMLElement;
  expect(editableSpan).not.toBeNull();
  expect(editableSpan.textContent).toBe('Touch to open door');

  dom.window.dispatchEvent(new dom.window.MessageEvent('message', { source: dom.window as unknown as Window, data: { type: 'invitation-toggle-visual-edit', channel: 'test-door', enabled: true } }));

  // Simulate user clicking on the editable text on the door
  editableSpan.click();
  await ready();

  // The door opening trigger should NOT have executed
  expect((dom.window as unknown as { doorOpened: boolean }).doorOpened).toBe(false);
  dom.window.close();
});

it('renders invitation script that executes without ReferenceError even if window.__name is undefined', async () => {
  const source = '<body><h1>Wedding</h1><p>Welcome</p></body>';
  const rendered = renderInvitation(source, emptyEditor(), 'test-name');
  // Verify __name polyfill is present in script
  expect(rendered).toContain('var __name');
  
  const dom = new JSDOM(rendered, {
    runScripts: 'dangerously',
    url: 'https://invite.test',
    beforeParse(window) {
      delete (window as unknown as { __name?: unknown }).__name;
    }
  });
  const messages: { fields: TextField[]; hasCanvas?: boolean; hasCanvasText?: boolean }[] = [];
  dom.window.addEventListener('message', e => messages.push(e.data));
  await ready();
  expect(messages.length).toBeGreaterThan(0);
  expect(messages.at(-1)?.fields?.length).toBe(2);
  dom.window.close();
});



it('edits individual text parts without flattening nested markup and survives reopening', async () => {
  const source = '<body><p>Hello <strong>couple</strong> — welcome</p></body>';
  const dom = new JSDOM(renderInvitation(source, emptyEditor(), 'visual'), { runScripts: 'dangerously', url: 'https://invite.test' });
  const edits: { path: string; text: string }[] = [];
  dom.window.addEventListener('message', e => { if (e.data.type === 'invitation-inline-edit') edits.push(e.data); });
  await ready();
  dom.window.dispatchEvent(new dom.window.MessageEvent('message', { source: dom.window as unknown as Window, data: { type: 'invitation-toggle-visual-edit', channel: 'visual', enabled: true } }));
  const doc = dom.window.document;
  doc.querySelector('p')!.click();
  const parts = doc.querySelector('select')!;
  parts.value = '1'; parts.dispatchEvent(new dom.window.Event('change'));
  const input = doc.querySelector('textarea')!;
  input.value = ' — see you soon'; input.dispatchEvent(new dom.window.Event('input'));
  await ready();
  expect(doc.querySelector('p')!.innerHTML).toContain('<strong');
  expect(doc.querySelector('p')!.textContent).toBe('Hello couple — see you soon');
  expect(doc.querySelector('strong')!.textContent).toBe('couple');
  const reopened = open(source, { ...emptyEditor(), texts: Object.fromEntries(edits.map(e => [e.path, e.text])) });
  await ready();
  expect(reopened.window.document.querySelector('p')!.textContent).toBe('Hello couple — see you soon');
  expect(reopened.window.document.querySelector('#weinviteu-text-editor')).toBeNull();
  dom.window.close(); reopened.window.close();
});

it('keeps preview clicks normal by default and selects the exact portrait in edit mode', async () => {
  const source = '<body><button onclick="this.textContent=\'Opened\'">Open</button><img src="one.jpg"><img src="two.jpg"><script>const CFG={speakers:[{photo:"one.jpg"},{photo:"two.jpg"}]};</script></body>';
  const dom = new JSDOM(renderInvitation(source, emptyEditor(), 'media'), { runScripts: 'dangerously', url: 'https://invite.test' });
  const selected: string[] = [];
  dom.window.addEventListener('message', e => { if (e.data.type === 'invitation-media-focus') selected.push(e.data.slot); });
  await ready();
  dom.window.document.querySelector('button')!.click();
  expect(dom.window.document.querySelector('button')!.textContent).toBe('Opened');
  dom.window.dispatchEvent(new dom.window.MessageEvent('message', { source: dom.window as unknown as Window, data: { type: 'invitation-toggle-visual-edit', channel: 'media', enabled: true } }));
  dom.window.document.querySelectorAll('img')[1].click();
  await ready();
  expect(selected).toEqual(['CFG.speakers.1.photo']);
  dom.window.close();
});

it('supports uploaded HTML portrait placeholders without changing surrounding text paths', async () => {
  const source = '<body><section><div class="portrait">[PHOTO]</div><h2>Speaker</h2></section></body>';
  const state = { ...emptyEditor(), images: { 'HTMLPHOTO.0': 'data:image/png;base64,YQ==' }, texts: { 'body.0.1.0': 'Our speaker' } };
  const dom = open(source, state); await ready();
  expect(dom.window.document.querySelector('img')?.getAttribute('src')).toBe(state.images['HTMLPHOTO.0']);
  expect(dom.window.document.querySelector('h2')?.textContent).toBe('Our speaker');
  dom.window.close();
});

it('mutes original audio that starts after the invitation opens', async () => {
  const source = '<body><button id="snd" onclick="this.style.opacity=\'0.5\'">Sound</button><button id="open" onclick="document.getElementById(\'snd\').classList.add(\'on\')">Open</button></body>';
  const dom = open(source, { ...emptyEditor(), musicUrl: 'data:audio/wav;base64,YQ==' });
  await ready();
  dom.window.document.getElementById('open')!.click(); await ready();
  expect(dom.window.document.getElementById('snd')!.style.opacity).toBe('0.5');
  dom.window.close();
});
