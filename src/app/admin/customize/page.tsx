"use client";
import { finishInquiryConversion } from "@/lib/inquiry-conversion";
import { useEffect, useMemo, useRef, useState } from 'react';
import { api, jsonBody, errorMessage } from '@/lib/client-api';
import { emptyEditor, type EditorState, type Order, type Template } from '@/lib/models';
import { portraitSlots, renderInvitation, type TextField } from '@/lib/invitation';
import styles from '../admin.module.css';

import { templateFields, templateFieldError } from '@/lib/template-fields';
import { readMediaFile } from '@/lib/editor-media';
import { analyzeTemplate } from '@/lib/template-analyzer';
import { inviteUrlPath } from '@/lib/slug';

export default function CustomizeTemplate() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [template, setTemplate] = useState('');
  const [source, setSource] = useState('');
  const [state, setState] = useState<EditorState>(emptyEditor);
  const [fields, setFields] = useState<TextField[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [tab, setTab] = useState('details');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [unsaved, setUnsaved] = useState(false);
  const [mediaBusy, setMediaBusy] = useState(false);
  const [previewReady, setPreviewReady] = useState(false);
  const [search, setSearch] = useState('');
  const [section, setSection] = useState('all');
  const [pageNav, setPageNav] = useState<{ label: string; status: 'moving' | 'arrived' | 'unreachable'; step?: number; total?: number } | null>(null);
  const pageNavTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [lastSaved, setLastSaved] = useState('');
  const [previewRevision, setPreviewRevision] = useState(0);
  const [canvasTextDetected, setCanvasTextDetected] = useState(false);
  const [activePath, setActivePath] = useState('');
  const [visualEdit, setVisualEdit] = useState(false);
  const visualEditRef = useRef(false);
  const [activePhoto, setActivePhoto] = useState<string | null>(null);
  const [templateSaveBusy, setTemplateSaveBusy] = useState(false);
  const saveInFlight = useRef(false);
  const [link, setLink] = useState('');
  const iframe = useRef<HTMLIFrameElement>(null);
  const orderId = useRef('');
  const channel = useRef('');
  const latest = useRef(state);
  const dirty = useRef(false);
  const requestId = useRef(0);
  const contentFields = useMemo(() => templateFields(source).filter(f => f.kind !== 'image'), [source]);
  const photos = useMemo(() => portraitSlots(source), [source]);
  const compatibility = useMemo(() => source ? analyzeTemplate(source) : null, [source]);
  const canvasIssue = Boolean(compatibility?.items.find(i => i.key === 'canvas' && i.status === 'fail') || canvasTextDetected);
  const imageTextIssue = Boolean(compatibility?.items.find(i => i.key === 'embeddedText' && i.status === 'warn'));
  const sectionOptions = Array.from(new Map(fields.map(f => [f.sectionOrder, f.section])).entries()).sort((a, b) => a[0] - b[0]);
  // Section numbers from the preview are stable IDs and can have gaps; show them as 1, 2, 3…
  const sectionName = (order: number) => order === 0 ? 'Opening' : `Section ${sectionOptions.filter(([o]) => o !== 0 && o <= order).length}`;
  const visibleFields = fields.filter(f => (section === 'all' || String(f.sectionOrder) === section) && `${f.text} ${f.label} ${f.original}`.toLowerCase().includes(search.toLowerCase()));
  function markDirty() { dirty.current = true; setUnsaved(true); }
  useEffect(() => { latest.current = state; }, [state]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const list = await api<Template[]>('/api/admin/templates?include_bundled=1');
        const params = new URLSearchParams(window.location.search);
        const orderIdParam = params.get('order');
        const inquiryIdParam = params.get('inquiry');
        const templateParam = params.get('template');

        const order = orderIdParam ? await api<Order>(`/api/admin/orders?id=${encodeURIComponent(orderIdParam)}`) : undefined;
        let inquiry: { client_name?: string; email?: string; template_name?: string; category?: string } | undefined = undefined;

        if (inquiryIdParam && !order) {
          try {
            inquiry = await api<{ client_name?: string; email?: string; template_name?: string; category?: string }>(`/api/admin/inquiries?id=${encodeURIComponent(inquiryIdParam)}`);
          } catch {
            // ignore if inquiry cannot be loaded
          }
        }

        // Determine initial template filename
        let filename = order?.template_filename;
        if (!filename && templateParam && list.some(t => t.filename === templateParam)) {
          filename = templateParam;
        }
        if (!filename && inquiry?.template_name) {
          const matched = list.find(t => t.title.toLowerCase() === inquiry?.template_name?.toLowerCase() || t.filename === inquiry?.template_name);
          if (matched) filename = matched.filename;
        }
        if (!filename && inquiry?.category) {
          const matched = list.find(t => t.category.toLowerCase() === inquiry?.category?.toLowerCase());
          if (matched) filename = matched.filename;
        }
        if (!filename) filename = list[0]?.filename;

        if (!filename) throw new Error('Add a template before creating an invitation.');
        const html = order?.source_html || (await api<{ html: string }>(`/api/admin/template-source?filename=${encodeURIComponent(filename)}`)).html;
        if (cancelled) return;
        orderId.current = order?.id || crypto.randomUUID();
        setTemplates(order?.template_filename && !list.some(t => t.filename === order.template_filename) ? [...list, { id: -1, filename: order.template_filename, title: order.template_name + ' (archived template)', category: '', badge: '', enabled: false }] : list);
        setTemplate(filename);
        setName(order?.client_name || inquiry?.client_name || '');
        setEmail(order?.email || inquiry?.email || '');
        setState(order?.editor_state || emptyEditor());
        setSource(html);
        if (order?.published_file) { setLastSaved('Previously saved'); }
        if (order?.published_file) setLink(`${window.location.origin}${inviteUrlPath(order)}`);
        if (inquiry) setMessage(`Loaded inquiry details for ${inquiry.client_name || 'client'}. Save when ready to create order.`);
        if (order && !order.source_html && order.status !== 'New Inquiry') setMessage('This older order has no editable source. Choose a template and save a new version to enable future editing.');
      } catch (error) { if (!cancelled) setMessage(errorMessage(error)); }
      finally { if (!cancelled) setLoading(false); }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const enabled = visualEdit && !busy && !loading && !mediaBusy && !templateSaveBusy;
    visualEditRef.current = enabled;
    iframe.current?.contentWindow?.postMessage({ type: 'invitation-toggle-visual-edit', channel: channel.current, enabled }, '*');
  }, [visualEdit, busy, loading, mediaBusy, templateSaveBusy]);

  // Rebuild only when source/media changes. Text and color edits use the message bridge.
  useEffect(() => {
    if (!source) return;
    const timer = setTimeout(() => {
      channel.current = crypto.randomUUID();
      setPreviewReady(false);
      if (iframe.current) iframe.current.srcdoc = renderInvitation(source, latest.current, channel.current);
    }, 250);
    return () => clearTimeout(timer);
  }, [source, state.images, state.musicUrl, state.config, previewRevision]);

  useEffect(() => {
    iframe.current?.contentWindow?.postMessage({ type: 'invitation-update', channel: channel.current, state }, '*');
  }, [state]);
  useEffect(() => {
    function receive(event: MessageEvent) {
      if (event.source !== iframe.current?.contentWindow || event.data?.channel !== channel.current) return;
      if (event.data.type === 'invitation-fields') {
        if (Array.isArray(event.data.fields)) {
          setFields(event.data.fields.filter((f: TextField) => typeof f.id === 'string' && typeof f.text === 'string' && typeof f.section === 'string' && typeof f.sectionOrder === 'number'));
          setPreviewReady(true);
          iframe.current?.contentWindow?.postMessage({ type: 'invitation-toggle-visual-edit', channel: channel.current, enabled: visualEditRef.current }, '*');
        }
        if (event.data?.hasCanvasText) setCanvasTextDetected(true);
      }
      if (event.data.type === 'invitation-inline-edit') {
        const { path, text } = event.data;
        if (typeof path === 'string' && typeof text === 'string') {
          const nextTexts = { ...latest.current.texts, [path]: text };
          latest.current = { ...latest.current, texts: nextTexts };
          setState(latest.current);
          dirty.current = true;
          setUnsaved(true);
        }
      }
      if (event.data.type === 'invitation-section-status' && ['moving', 'arrived', 'unreachable'].includes(event.data.status)) {
        const status = event.data.status as 'moving' | 'arrived' | 'unreachable';
        const progress = typeof event.data.step === 'number' && typeof event.data.total === 'number' ? { step: event.data.step as number, total: event.data.total as number } : {};
        setPageNav(current => current && { ...current, status, ...progress });
        clearTimeout(pageNavTimer.current);
        if (status !== 'moving') pageNavTimer.current = setTimeout(() => setPageNav(null), status === 'arrived' ? 2200 : 5000);
      }
      if (event.data.type === 'invitation-media-focus' && typeof event.data.slot === 'string') {
        setActivePhoto(event.data.slot); setTab('media');
      }
      if (event.data.type === 'invitation-field-focus') {
        if (typeof event.data.path === 'string') {
          setActivePath(event.data.path);
        }
      }
    }
    function beforeUnload(event: BeforeUnloadEvent) { if (dirty.current) event.preventDefault(); }
    function leave(event: MouseEvent) {
      const anchor = (event.target as Element)?.closest?.('a');
      if (!dirty.current || !anchor || anchor.target === '_blank' || anchor.getAttribute('href')?.startsWith('#')) return;
      if (!confirm('You have unsaved changes. Leave without saving?')) { event.preventDefault(); event.stopPropagation(); }
    }
    document.addEventListener('click', leave, true);
    window.addEventListener('message', receive);
    window.addEventListener('beforeunload', beforeUnload);
    return () => { document.removeEventListener('click', leave, true); window.removeEventListener('message', receive); window.removeEventListener('beforeunload', beforeUnload); };
  }, []);

  useEffect(() => {
    if (tab === 'media' && activePhoto !== null) document.getElementById(activePhoto ? `photo-${activePhoto}` : 'custom-music')?.focus();
  }, [tab, activePhoto]);

  function chooseSection(value: string) {
    setSection(value);
    if (value === 'all') return;
    const order = Number(value);
    const label = sectionOptions.find(([o]) => o === order)?.[1] || 'Page';
    clearTimeout(pageNavTimer.current);
    if (order === 0) {
      // The opening is the template's intro; restarting the preview shows it again.
      setPageNav({ label, status: 'arrived' });
      setPreviewRevision(v => v + 1);
      pageNavTimer.current = setTimeout(() => setPageNav(null), 2200);
      return;
    }
    setPageNav({ label, status: 'moving' });
    iframe.current?.contentWindow?.postMessage({ type: 'invitation-goto-section', channel: channel.current, order, label }, '*');
  }

  function update(patch: Partial<EditorState>) { markDirty(); const next = { ...latest.current, ...patch }; latest.current = next; setState(next); }
  async function selectTemplate(filename: string) {
    if (dirty.current && !confirm('Switch templates and discard unsaved customization?')) return;
    const current = ++requestId.current;
    setLoading(true); setMessage('');
    try {
      const { html } = await api<{ html: string }>(`/api/admin/template-source?filename=${encodeURIComponent(filename)}`);
      if (requestId.current !== current) return;
      setActivePath(''); setActivePhoto(null); setFields([]); setSection('all'); setSearch(''); setPreviewReady(false); setCanvasTextDetected(false); setTemplate(filename); setState(emptyEditor()); setSource(html); markDirty();
    } catch (error) { setMessage(errorMessage(error)); }
    finally { if (current === requestId.current) setLoading(false); }
  }
  async function upload(file: File | undefined, slot?: string) {
    if (!file || mediaBusy) return;
    setMediaBusy(true); setMessage('');
    const templateRequest = requestId.current;
    try {
      const value = await readMediaFile(file, slot ? 'image' : 'audio');
      if (templateRequest !== requestId.current) return;
      if (slot) update({ images: { ...latest.current.images, [slot]: value } });
      else update({ musicUrl: value, musicName: file.name });
      setMessage(`${file.name} is ready in the preview. Save your changes to update the invitation link.`);
    } catch (error) { setMessage(errorMessage(error)); }
    finally { setMediaBusy(false); }
  }
  async function save() {
    if (saveInFlight.current || mediaBusy || loading) return;
    if (!name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setMessage('Enter a client name and valid email before saving.'); return; }
    const invalid = templateFieldError(source, state.config);
    if (invalid) { setMessage(invalid); setTab('details'); return; }
    saveInFlight.current = true; setBusy(true); setMessage('');
    try {
      const result = await api<{ id: string; inviteUrl: string }>('/api/admin/orders', jsonBody({ id: orderId.current, client_name: name, email, template_filename: template, editor_state: state }));
      setLink(`${window.location.origin}${result.inviteUrl}`);
      dirty.current = false; setUnsaved(false); setLastSaved(`Saved at ${new Date().toLocaleTimeString()}`);
      const inquiryParam = new URLSearchParams(window.location.search).get('inquiry');
      const conversion = await finishInquiryConversion(result.id, inquiryParam);
      window.history.replaceState(null, '', conversion.editorUrl);
      setMessage(conversion.message);
    } catch (error) { setMessage(errorMessage(error)); }
    finally { saveInFlight.current = false; setBusy(false); }
  }

  function toggleVisualEdit(enabled: boolean) {
    visualEditRef.current = enabled;
    setVisualEdit(enabled);
    iframe.current?.contentWindow?.postMessage({
      type: 'invitation-toggle-visual-edit',
      channel: channel.current,
      enabled
    }, '*');
  }

  async function saveAsBaseTemplate() {
    if (!template || !source || templateSaveBusy) return;
    const tTitle = templates.find(t => t.filename === template)?.title || 'this template';
    if (!confirm(`Save all customizations directly as the new default for "${tTitle}" in your template library? All future invitations using this template will start with these changes.`)) return;
    setTemplateSaveBusy(true);
    setMessage('');
    try {
      const finalHtml = renderInvitation(source, latest.current);
      await api('/api/admin/template-source', {
        method: 'PUT',
        ...jsonBody({ filename: template, html: finalHtml })
      });
      setSource(finalHtml);
      dirty.current = false;
      setUnsaved(false);
      setMessage(`"${tTitle}" base template has been successfully updated in your library!`);
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setTemplateSaveBusy(false);
    }
  }

  const disabled = busy || loading || mediaBusy;
  const groups = Array.from(new Set(contentFields.map(f => f.group)));
  const plain = (value: string | number) => String(value).replace(/<br\s*\/?\s*>/gi, '\n').replace(/<[^>]+>/g, '');
  return <div>
    <div className={styles.pageHeader}><div><h2>Invitation Customizer</h2><p>1. Event details → 2. Page text → 3. Template Edit (Click-to-Edit) → 4. Photos & music → 5. Save</p>
      <span className={styles.saveStatus} role="status">{busy ? 'Saving…' : mediaBusy ? 'Reading your file…' : unsaved ? '● Unsaved changes' : lastSaved || 'New invitation — not saved yet'}</span>
    </div>
      <div className={styles.editorActions}>
        <button className={styles.btnPrimary} disabled={disabled || !source || !previewReady} onClick={() => save()}>{busy ? 'Saving…' : 'Save'}</button>
      </div>
    </div>
    {message && <div role="status" className={styles.editorMessage}>{message}{/sign in/i.test(message) && <p><a href="/admin/login" target="_blank" rel="noopener noreferrer">Sign in in a new tab ↗</a>, then return here and save again. Your unsaved edits stay on this page.</p>}</div>}
    {link && <div className={styles.editorMessage}><a href={link} target="_blank" rel="noopener noreferrer">Open saved invitation ↗</a> <button className={styles.btnSecondary} onClick={() => navigator.clipboard.writeText(link).then(() => setMessage('Link copied.')).catch(() => setMessage(`Copy this link: ${link}`))}>Copy link</button>{unsaved && <p>The saved link still shows the previous version. Save changes to update it.</p>}</div>}
    <div className={styles.editorGrid}>
      <aside className={styles.previewPanel}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h3 style={{ margin: 0 }}>Live preview</h3>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => toggleVisualEdit(!visualEdit)}
              className={styles.btnSecondary}
              style={{
                padding: '4px 10px',
                fontSize: '11px',
                borderColor: visualEdit ? 'var(--gold)' : 'rgba(255, 255, 255, 0.15)',
                color: visualEdit ? 'var(--gold)' : 'var(--muted)'
              }}
              title="Toggle click-to-edit directly on template preview"
            >
              {visualEdit ? 'Edit mode — switch to preview' : 'Preview mode — switch to edit'}
            </button>
            <button disabled={disabled} className={styles.btnSecondary} onClick={() => setPreviewRevision(v => v + 1)} style={{ padding: '4px 10px', fontSize: '11px' }}>Restart</button>
          </div>
        </div>
        <p className={styles.editorHelp} style={{ margin: '0 0 10px 0' }}>
          {visualEdit ? 'Click outlined text to edit, or a portrait to replace it. Switch to Preview mode to navigate.' : 'Open the door and navigate to a page, then turn editing on.'}
        </p>
        <div className={styles.previewFrame}>
          <iframe ref={iframe} title="Invitation preview" sandbox="allow-scripts allow-forms allow-popups allow-modals" className={styles.editorPreview} onLoad={() => iframe.current?.contentWindow?.postMessage({ type: 'invitation-update', channel: channel.current, state: latest.current }, '*')} />
          {pageNav && <div role="status" className={`${styles.pageNavChip} ${pageNav.status === 'moving' ? styles.pageNavMoving : pageNav.status === 'arrived' ? styles.pageNavArrived : styles.pageNavFailed}`}>
            {pageNav.status === 'moving' ? <><span className={styles.pageNavDot} />Going to {pageNav.label}…{pageNav.step && pageNav.total ? <small className={styles.pageNavStep}>{pageNav.step}/{pageNav.total}</small> : null}</>
              : pageNav.status === 'arrived' ? <>✓ {pageNav.label}</>
              : <>Couldn’t open “{pageNav.label}” automatically. Use the template’s own arrows in the preview.</>}
          </div>}
        </div>
      </aside>

      <fieldset disabled={disabled} className={`${styles.card} ${styles.editorForm}`}>
        <div className={styles.clientFields}>
          <label>Client name<input autoComplete="name" value={name} onChange={e => { setName(e.target.value); markDirty(); }} /></label>
          <label>Client email<input type="email" autoComplete="email" value={email} onChange={e => { setEmail(e.target.value); markDirty(); }} /></label>
        </div>
        <label>Invitation template<select value={template} onChange={e => selectTemplate(e.target.value)}>{templates.map(t => <option key={t.id} value={t.filename}>{t.title}</option>)}</select></label>
        <div className={styles.editorTabs} role="tablist" aria-label="Customization steps">{[['details', 'Event details'], ['text', 'Page text'], ['template-edit', '✏️ Template Edit'], ['media', 'Photos & music'], ['colors', 'Colors']].map(([id, label]) => <button key={id} role="tab" aria-selected={tab === id} aria-controls={`editor-${id}`} id={`tab-${id}`} className={tab === id ? styles.btnPrimary : styles.btnSecondary} onClick={() => { setTab(id); toggleVisualEdit(id === 'template-edit'); }}>{label}</button>)}</div>
        <div id={`editor-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`} className={styles.editorFields}>
        {loading ? <p>Loading invitation…</p> : tab === 'details' ? <>
          <p className={styles.editorHelp}>Start here. These values update the template’s names, dates, countdowns and contact links together. The preview restarts when a detail changes.</p>
          {Object.keys(state.texts).length > 0 && <p className={styles.editorHelp}>You also have page-specific text edits. Those take priority over shared details. Review Page text after changing names or dates.</p>}
          {!contentFields.length && <p>This uploaded template has no supported shared details. Use Page text to edit its visible content.</p>}
          {groups.map(group => <details key={group} className={styles.editorSection} open={group === 'Opening & event details'}><summary>{group}</summary>
            {contentFields.filter(f => f.group === group).map(f => <label key={f.id}>{f.label}
              <input type={f.kind === 'number' ? 'number' : f.kind === 'url' ? 'url' : 'text'} value={state.config?.[f.id] ?? plain(f.value)} onChange={e => update({ config: { ...latest.current.config, [f.id]: f.kind === 'number' ? Number(e.target.value) : e.target.value } })} />
              {f.kind === 'date' && <small>Use YYYY-MM-DDTHH:mm:ss+05:30, including the timezone.</small>}
              {f.kind === 'url' && <small>Changing this updates the destination, not just the button label.</small>}
            </label>)}
          </details>)}
        </> : tab === 'text' ? <>
          {canvasIssue && (
            <div style={{
              margin: "0 0 16px 0",
              padding: "12px 14px",
              borderRadius: "10px",
              background: "rgba(234, 179, 8, 0.08)",
              border: "1px solid rgba(234, 179, 8, 0.25)",
              color: "#fde047",
              fontSize: "12px",
              lineHeight: "1.45"
            }}>
              <strong style={{ display: "block", color: "#fef08a", marginBottom: "2px" }}>
                ⚠️ Artwork / Canvas Text Detected
              </strong>
              Some text in this template is rendered directly inside canvas artwork. That text cannot be edited in these DOM text fields — it remains fixed artwork. To change event names and dates, update the <em>Event details</em> tab.
            </div>
          )}
          {imageTextIssue && (
            <div style={{
              margin: "0 0 16px 0",
              padding: "12px 14px",
              borderRadius: "10px",
              background: "rgba(59, 130, 246, 0.08)",
              border: "1px solid rgba(59, 130, 246, 0.25)",
              color: "#93c5fd",
              fontSize: "12px",
              lineHeight: "1.45"
            }}>
              <strong style={{ display: "block", color: "#bfdbfe", marginBottom: "2px" }}>
                ℹ️ Graphic Artwork Notice
              </strong>
              This template includes embedded artwork graphics. Words baked into graphic images cannot be edited via text fields.
            </div>
          )}
          <p className={styles.editorHelp}>Sections follow the invitation from the opening door to the closing message. These edits change the wording on one page; edit dates, names and link destinations in Event details first.</p>
          <label>Find text<input type="search" placeholder="Search names, headings or a sentence…" value={search} onChange={e => setSearch(e.target.value)} /></label>
          <label>Invitation section<select value={section} onChange={e => chooseSection(e.target.value)}><option value="all">All sections, in page order</option>{sectionOptions.map(([order, title]) => <option key={order} value={order}>{sectionName(order)} · {title}</option>)}</select></label>
          {!previewReady && <p role="status">Preparing the preview and its text fields…</p>}
          {previewReady && !visibleFields.length && <p>No matching editable text. Try another section or clear your search.</p>}
          {sectionOptions.map(([order, title]) => {
            const items = visibleFields.filter(f => f.sectionOrder === order);
            if (!items.length) return null;
            return <details key={order} className={styles.editorSection} open={order === 0 || section !== 'all' || items.some(f => f.id === activePath)}><summary>{sectionName(order)} · {title} <small>({items.length} fields)</small></summary>
              {items.map((f, index) => <label key={f.id}>{f.label} {index + 1}<small className={styles.originalText}>Original: {f.original.trim().slice(0, 180)}</small><textarea value={state.texts[f.id] ?? f.text} onChange={e => update({ texts: { ...latest.current.texts, [f.id]: e.target.value } })} /></label>)}
            </details>;
          })}
          {Object.keys(state.texts).length > 0 && <button className={styles.btnSecondary} onClick={() => { if (confirm('Remove all page-specific text edits? Event details and media will stay.')) { update({ texts: {} }); setPreviewRevision(v => v + 1); } }}>Restore page text from event details</button>}
        </> : tab === 'template-edit' ? <>
          <div style={{
            background: 'rgba(212, 175, 55, 0.08)',
            border: '1px solid rgba(212, 175, 55, 0.3)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <strong style={{ color: 'var(--gold)', fontSize: '14px' }}>
                ✏️ On-template editing
              </strong>
              <span style={{
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                background: visualEdit ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255, 255, 255, 0.1)',
                color: visualEdit ? '#22c55e' : 'var(--muted)',
                border: `1px solid ${visualEdit ? 'rgba(34, 197, 94, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`
              }}>
                {visualEdit ? '● Click-to-Edit ON' : '○ View Only'}
              </span>
            </div>
            <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: 'var(--muted)', lineHeight: 1.45 }}>
              Open the invitation in Preview mode, then enable editing. Click outlined text to open its text editor. Click a portrait to select its upload control. Changes use the same fields as normal editing.
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className={visualEdit ? styles.btnPrimary : styles.btnSecondary}
                onClick={() => toggleVisualEdit(true)}
                style={{ fontSize: '11px', padding: '6px 12px' }}
              >
                ✏️ Enable Click-to-Edit
              </button>
              <button
                type="button"
                className={!visualEdit ? styles.btnPrimary : styles.btnSecondary}
                onClick={() => toggleVisualEdit(false)}
                style={{ fontSize: '11px', padding: '6px 12px' }}
              >
                👆 Test Doors & Animations
              </button>
            </div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '16px'
          }}>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#fff' }}>
              Save as Master Template
            </h4>
            <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: 'var(--muted)', lineHeight: 1.4 }}>
              Save your changes directly into the template library so future invitations will use this version.
            </p>
            <button
              type="button"
              disabled={templateSaveBusy || !source}
              onClick={saveAsBaseTemplate}
              className={styles.btnSecondary}
              style={{ width: '100%', justifyContent: 'center', borderColor: 'var(--gold)', color: 'var(--gold)', padding: '8px' }}
            >
              {templateSaveBusy ? 'Updating Master Template…' : '💾 Save as Master Template'}
            </button>
          </div>

          <div className={styles.editorActions}>
            <button type="button" className={styles.btnSecondary} onClick={() => setTab('details')}>Event details</button>
            <button type="button" className={styles.btnSecondary} onClick={() => { setTab('media'); setActivePhoto(null); }}>Photos & portraits</button>
            <button type="button" className={styles.btnSecondary} onClick={() => { setTab('media'); setActivePhoto(''); }}>Music</button>
            <button type="button" className={styles.btnSecondary} onClick={() => setTab('colors')}>Colors</button>
          </div>
          <p className={styles.editorHelp}>Artwork text inside images or canvas cannot be selected here. Use Event details for shared names, dates, and link destinations.</p>
          <p className={styles.editorHelp}>
            {activePath ? `Selected field: ${fields.find(f => f.id === activePath)?.label || 'Text'} on template.` : 'Click any text on the template preview, or edit below:'}
          </p>
          <label>Find template text<input type="search" placeholder="Search text on template…" value={search} onChange={e => setSearch(e.target.value)} /></label>
          {sectionOptions.map(([order, title]) => {
            const items = visibleFields.filter(f => f.sectionOrder === order);
            if (!items.length) return null;
            return <details key={order} className={styles.editorSection} open={order === 0 || section !== 'all' || items.some(f => f.id === activePath)}><summary>{sectionName(order)} · {title} <small>({items.length} fields)</small></summary>
              {items.map((f, index) => <label key={f.id} style={activePath === f.id ? { outline: '2px solid var(--gold)', borderRadius: '6px', padding: '6px', background: 'rgba(212,175,55,0.06)' } : {}}>{f.label} {index + 1}{activePath === f.id && <span style={{ color: 'var(--gold)', fontSize: '11px', marginLeft: '6px' }}>● Selected on template</span>}<small className={styles.originalText}>Original: {f.original.trim().slice(0, 180)}</small><textarea value={state.texts[f.id] ?? f.text} onChange={e => update({ texts: { ...latest.current.texts, [f.id]: e.target.value } })} /></label>)}
            </details>;
          })}
        </> : tab === 'colors' ? <>
          <p className={styles.editorHelp}>Colors apply to HTML headings and backgrounds. Artwork drawn inside a canvas keeps its original colors.</p>
          <label>Accent color<input type="color" value={state.primaryColor || '#c49a4c'} onChange={e => update({ primaryColor: e.target.value })} /></label>
          <label>Background color<input type="color" value={state.bgColor || '#f6f3ea'} onChange={e => update({ bgColor: e.target.value })} /></label>
          <button className={styles.btnSecondary} onClick={() => update({ primaryColor: '', bgColor: '' })}>Restore template colors</button>
        </> : <>
          <h3>Portraits & photos</h3><p className={styles.editorHelp}>Choose the person or gallery position below. Use a clear portrait with the face near the centre. PNG, JPEG, WebP or GIF, up to 5 MB each.</p>
          {!photos.length && <p>This template has no portrait slots. Choose a portrait-enabled template to add people’s photos.</p>}
          {photos.map(slot => {
            const legacy = slot.id.split('.').at(-1)!;
            const value = state.images[slot.id] || (photos.find(p => p.id.endsWith(`.${legacy}`))?.id === slot.id ? state.images[legacy] : '') || String(slot.value);
            return <div key={slot.id} className={styles.mediaSlot}><label>{slot.label}<input id={`photo-${slot.id}`} type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={e => { void upload(e.target.files?.[0], slot.id); e.target.value = ''; }} /></label>
              {value && <img src={value} alt={`${slot.label} preview`} className={styles.portraitPreview} />}
              {(state.images[slot.id] || state.images[legacy]) && <button className={styles.btnSecondary} onClick={() => { const images = { ...latest.current.images }; delete images[slot.id]; delete images[legacy]; update({ images }); }}>Restore original photo</button>}
            </div>;
          })}
          <h3>Background music</h3><p className={styles.editorHelp}>Upload an MP3, WAV or another browser-supported audio file, up to 10 MB. Your track replaces the template’s original sound. Guests press Play music to begin.</p>
          <label>Choose music<input id="custom-music" type="file" accept="audio/*" onChange={e => { void upload(e.target.files?.[0]); e.target.value = ''; }} /></label>
          {state.musicUrl && <div className={styles.mediaSlot}><p>{state.musicName || 'Custom music uploaded'}</p><audio controls preload="metadata" src={state.musicUrl} /><button className={styles.btnSecondary} onClick={() => update({ musicUrl: '', musicName: '' })}>Remove custom music</button></div>}
        </>}
        </div>
      </fieldset>
    </div>
  </div>;
}
