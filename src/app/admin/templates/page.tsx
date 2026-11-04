"use client";

import { DEFAULT_TEMPLATE_ORIGINAL_PRICE } from '@/lib/template-pricing';

import { useState, useEffect } from "react";
import styles from "../admin.module.css";
import { Plus, Edit2, Trash2, Eye, Upload, X, Check, Activity, AlertTriangle, CheckCircle2, XCircle, ShieldCheck, ChevronDown, ChevronUp } from "lucide-react";
import { api, jsonBody, errorMessage } from "@/lib/client-api";
import { templateUrl, type Template, type Category } from "@/lib/models";
import { analyzeTemplate, type CompatibilityReport } from "@/lib/template-analyzer";
import { getTemplatePricing, GST_NOTE, TIER_PRICES, rupees } from "@/lib/template-pricing";
import { DEFAULT_TEMPLATE_TIER, getTemplateTier, TEMPLATE_TIERS, TIER_DETAILS, type TemplateTier } from "@/lib/template-tiers";

const tierChipStyle = (tier: TemplateTier): React.CSSProperties => ({
  padding: "3px 9px",
  borderRadius: "999px",
  fontSize: "10px",
  fontWeight: 700,
  letterSpacing: "0.8px",
  textTransform: "uppercase",
  whiteSpace: "nowrap",
  ...(tier === "luxury" ? { background: "#2a1d10", color: "#f4d49d", border: "1px solid #d9a967" }
    : tier === "premium" ? { background: "rgba(212, 175, 55, 0.18)", color: "#fae29c", border: "1px solid rgba(212, 175, 55, 0.45)" }
    : { background: "rgba(255, 255, 255, 0.06)", color: "rgba(255, 255, 255, 0.85)", border: "1px solid rgba(255, 255, 255, 0.15)" }),
});

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ title: "", category: "Wedding", badge: "", filename: "", original_price: DEFAULT_TEMPLATE_ORIGINAL_PRICE, tier: DEFAULT_TEMPLATE_TIER as TemplateTier });
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [report, setReport] = useState<CompatibilityReport | null>(null);
  const [showReportDetails, setShowReportDetails] = useState(false);
  const [forceConfirm, setForceConfirm] = useState(false);
  const [auditTemplate, setAuditTemplate] = useState<{ title: string; report: CompatibilityReport } | null>(null);
  const [loadingAuditId, setLoadingAuditId] = useState<number | null>(null);

  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    api<Template[]>('/api/admin/templates')
      .then(setTemplates)
      .catch(e => setError(errorMessage(e)));

    fetch('/api/categories')
      .then(r => r.json())
      .then(cats => {
        if (Array.isArray(cats) && cats.length > 0) setCategories(cats);
      })
      .catch(console.error);
  }, []);

  const fetchTemplates = async () => setTemplates(await api<Template[]>('/api/admin/templates'));

  useEffect(() => {
    if (!uploadFile) return;
    let cancelled = false;
    uploadFile.text().then(html => {
      const rep = analyzeTemplate(html);
      if (!cancelled) setReport(rep);
    }).catch(() => { if (!cancelled) setReport(null); });
    return () => { cancelled = true; };
  }, [uploadFile]);

  const handleAuditClick = async (t: Template) => {
    setLoadingAuditId(t.id);
    try {
      const res = await api<{ html: string }>(`/api/admin/template-source?filename=${encodeURIComponent(t.filename)}`);
      const rep = analyzeTemplate(res.html);
      setAuditTemplate({ title: t.title, report: rep });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoadingAuditId(null);
    }
  };

  const run = async (work: () => Promise<void>) => {
    setPending(true);
    setError('');
    try {
      await work();
      await fetchTemplates();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setPending(false);
    }
  };

  const handleEditClick = (t: Template) => {
    setEditingId(t.id);
    setEditForm({
      title: t.title,
      category: t.category,
      badge: t.badge,
      filename: t.filename,
      original_price: t.original_price || "",
      tier: getTemplateTier(t),
    });
  };

  const handleSave = () => run(async () => {
    await api('/api/admin/templates', { ...jsonBody({ id: editingId, ...editForm }), method: 'PATCH' });
    setEditingId(null);
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      setError('Select an HTML file.');
      return;
    }
    const critical = report?.items.filter(i => i.status === 'fail' && i.key !== 'text') || [];
    if (critical.length > 0 && !forceConfirm) {
      setError('This template has critical issues (e.g. canvas artwork text) that prevent dynamic text editing. Please acknowledge the warning to publish anyway.');
      return;
    }
    setIsUploading(true);
    await run(async () => {
      const form = new FormData();
      form.set('file', uploadFile);
      if (coverFile) form.set('poster', coverFile);
      if (forceConfirm) form.set('force', 'true');
      for (const key of ['title', 'category', 'badge', 'original_price', 'tier'] as const) {
        if (editForm[key]) form.set(key, editForm[key]);
      }
      await api('/api/admin/templates', { method: 'POST', body: form });
      setShowUploadModal(false);
      setUploadFile(null);
      setCoverFile(null);
      setReport(null);
      setForceConfirm(false);
    });
    setIsUploading(false);
  };

  const handleDelete = (id: number) => {
    if (confirm('Delete this template from the library? Saved invitations will remain available.')) {
      void run(async () => {
        await api('/api/admin/templates', { ...jsonBody({ id }), method: 'DELETE' });
      });
    }
  };

  const handleToggleEnabled = (id: number, currentEnabled: boolean) => run(async () => {
    await api('/api/admin/templates', { ...jsonBody({ id, enabled: !currentEnabled }), method: 'PATCH' });
  });

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h2>Template Library</h2>
          <p>Curate, upload and manage 3D interactive invitation templates for the live showcase.</p>
        </div>
        <button
          className={styles.btnPrimary}
          onClick={() => {
            setEditForm({ title: "", category: "Wedding", badge: "EXCLUSIVE", filename: "", original_price: DEFAULT_TEMPLATE_ORIGINAL_PRICE, tier: DEFAULT_TEMPLATE_TIER });
            setShowUploadModal(true);
          }}
        >
          <Plus size={16} /> Upload New Template
        </button>
      </div>

      {error && (
        <div role="alert" className={styles.editorMessage}>
          {error}
        </div>
      )}

      <fieldset disabled={pending} style={{ border: 0, padding: 0, minWidth: 0, margin: 0 }}>
        <div className={styles.card} style={{ padding: 0, overflow: "hidden" }}>
          <div
            className={styles.cardHeader}
            style={{
              padding: "24px 28px",
              borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
              margin: 0,
            }}
          >
            <div>
              <h3>Active Collection ({templates.length} templates)</h3>
              <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--muted)" }}>
                Toggle visibility to hide templates from guest showcase or click edit to update metadata
              </p>
            </div>
          </div>

          {/* Desktop / Tablet Table View */}
          <div className={styles.tableResponsive}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: "60px" }}>Preview</th>
                  <th>Template Name</th>
                  <th>Category</th>
                  <th>Tier</th>
                  <th>Badge Label</th>
                  <th>Price</th>
                  <th>Showcase Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <a
                        href={templateUrl(t.filename)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.btnSecondary}
                        style={{ padding: "7px 10px", borderRadius: "8px" }}
                        title={`Preview ${t.title}`}
                      >
                        <Eye size={14} color="var(--gold)" />
                      </a>
                    </td>
                    <td>
                      {editingId === t.id ? (
                        <input
                          value={editForm.title}
                          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                          style={{
                            padding: "8px 12px",
                            background: "rgba(0, 0, 0, 0.4)",
                            border: "1px solid var(--gold)",
                            borderRadius: "6px",
                            color: "#fff",
                            fontSize: "13px",
                            width: "200px",
                          }}
                        />
                      ) : (
                        <span style={{ fontWeight: 600, color: "#fff" }}>{t.title}</span>
                      )}
                    </td>
                    <td>
                      {editingId === t.id ? (
                        <select
                          value={editForm.category}
                          onChange={(e) => {
                            const newCat = e.target.value;
                            const matchedCat = categories.find(c => c.name === newCat);
                            setEditForm({
                              ...editForm,
                              category: newCat,
                              badge: editForm.badge || matchedCat?.badge || newCat.toUpperCase()
                            });
                          }}
                          style={{
                            padding: "8px 12px",
                            background: "rgba(0, 0, 0, 0.6)",
                            border: "1px solid var(--gold)",
                            borderRadius: "6px",
                            color: "#fff",
                            fontSize: "13px",
                            width: "150px",
                            cursor: "pointer",
                            outline: "none"
                          }}
                        >
                          {categories.map((c) => (
                            <option key={c.id} value={c.name} style={{ background: "#111", color: "#fff" }}>
                              {c.name}
                            </option>
                          ))}
                          {categories.length === 0 && (
                            <>
                              <option value="Wedding" style={{ background: "#111" }}>Wedding</option>
                              <option value="Birthday" style={{ background: "#111" }}>Birthday</option>
                              <option value="Baby Shower" style={{ background: "#111" }}>Baby Shower</option>
                              <option value="Traditional" style={{ background: "#111" }}>Traditional</option>
                              <option value="Corporate" style={{ background: "#111" }}>Corporate</option>
                              <option value="Anniversary" style={{ background: "#111" }}>Anniversary</option>
                            </>
                          )}
                        </select>
                      ) : (
                        <span style={{
                          padding: "4px 10px",
                          borderRadius: "6px",
                          fontSize: "11px",
                          background: "rgba(255, 255, 255, 0.05)",
                          color: "rgba(255, 255, 255, 0.8)",
                          border: "1px solid rgba(255, 255, 255, 0.08)"
                        }}>
                          {t.category}
                        </span>
                      )}
                    </td>
                    <td>
                      {editingId === t.id ? (
                        <select
                          value={editForm.tier}
                          onChange={(e) => setEditForm({ ...editForm, tier: e.target.value as TemplateTier })}
                          style={{
                            padding: "8px 12px",
                            background: "rgba(0, 0, 0, 0.6)",
                            border: "1px solid var(--gold)",
                            borderRadius: "6px",
                            color: "#fff",
                            fontSize: "13px",
                          }}
                        >
                          {TEMPLATE_TIERS.map(tier => (
                            <option key={tier} value={tier} style={{ background: "#111", color: "#fff" }}>{TIER_DETAILS[tier].label}</option>
                          ))}
                        </select>
                      ) : (
                        <span style={tierChipStyle(getTemplateTier(t))}>{TIER_DETAILS[getTemplateTier(t)].label}</span>
                      )}
                    </td>
                    <td>
                      {editingId === t.id ? (
                        <input
                          value={editForm.badge}
                          onChange={(e) => setEditForm({ ...editForm, badge: e.target.value })}
                          style={{
                            padding: "8px 12px",
                            background: "rgba(0, 0, 0, 0.4)",
                            border: "1px solid var(--gold)",
                            borderRadius: "6px",
                            color: "#fff",
                            fontSize: "13px",
                            width: "120px",
                          }}
                        />
                      ) : (
                        <span
                          className={styles.statusBadge}
                          style={{
                            background: "rgba(212, 175, 55, 0.1)",
                            color: "var(--gold)",
                            border: "1px solid rgba(212, 175, 55, 0.25)",
                            fontSize: "10px",
                          }}
                        >
                          {t.badge || "FEATURED"}
                        </span>
                      )}
                    </td>
                    <td>
                      {editingId === t.id ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          <span style={{ fontWeight: 700, color: "#fae29c", fontSize: "12.5px" }} title="Set by the collection tier">
                            {rupees(TIER_PRICES[editForm.tier])} <small style={{ fontWeight: 400, color: "var(--muted)" }}>{GST_NOTE}</small>
                          </span>
                          <input
                            value={editForm.original_price}
                            placeholder="MRP e.g. ₹3,999"
                            onChange={(e) => setEditForm({ ...editForm, original_price: e.target.value })}
                            style={{
                              padding: "5px 10px",
                              background: "rgba(0, 0, 0, 0.3)",
                              border: "1px solid rgba(255, 255, 255, 0.15)",
                              borderRadius: "6px",
                              color: "rgba(255, 255, 255, 0.7)",
                              fontSize: "11px",
                              width: "125px",
                            }}
                            title="Original Slashed Price (MRP)"
                          />
                        </div>
                      ) : (
                        (() => {
                          const p = getTemplatePricing(t);
                          return (
                            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                              <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                                <span style={{ fontWeight: 700, color: "#fae29c", fontSize: "13.5px" }}>
                                  {p.price}
                                </span>
                                {p.originalPrice && (
                                  <span style={{ textDecoration: "line-through", color: "rgba(255, 255, 255, 0.4)", fontSize: "11px" }}>
                                    {p.originalPrice}
                                  </span>
                                )}
                              </div>
                              {p.discount && (
                                <span style={{
                                  alignSelf: "flex-start",
                                  fontSize: "8.5px",
                                  fontWeight: 700,
                                  textTransform: "uppercase",
                                  padding: "2px 5px",
                                  borderRadius: "4px",
                                  background: "rgba(212, 175, 55, 0.15)",
                                  color: "var(--gold)",
                                  border: "1px solid rgba(212, 175, 55, 0.3)"
                                }}>
                                  {p.discount}
                                </span>
                              )}
                            </div>
                          );
                        })()
                      )}
                    </td>
                    <td>
                      <button
                        onClick={() => handleToggleEnabled(t.id, t.enabled !== false)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: "4px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <div
                          style={{
                            width: "40px",
                            height: "22px",
                            borderRadius: "999px",
                            background: t.enabled !== false
                              ? "linear-gradient(135deg, #f7df9e 0%, #d4af37 100%)"
                              : "rgba(255, 255, 255, 0.15)",
                            position: "relative",
                            transition: "all 0.25s ease",
                            boxShadow: t.enabled !== false ? "0 0 10px rgba(212, 175, 55, 0.3)" : "none",
                          }}
                        >
                          <div
                            style={{
                              width: "16px",
                              height: "16px",
                              borderRadius: "50%",
                              background: t.enabled !== false ? "#0a0a0d" : "#fff",
                              position: "absolute",
                              top: "3px",
                              left: t.enabled !== false ? "21px" : "3px",
                              transition: "left 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                            }}
                          />
                        </div>
                        <span
                          style={{
                            fontSize: "11px",
                            color: t.enabled !== false ? "var(--gold)" : "var(--muted)",
                            fontWeight: 600,
                            letterSpacing: "0.5px",
                          }}
                        >
                          {t.enabled !== false ? "Published" : "Hidden"}
                        </span>
                      </button>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "8px" }}>
                        {editingId === t.id ? (
                          <>
                            <button
                              className={styles.btnPrimary}
                              onClick={handleSave}
                              style={{ padding: "6px 14px", fontSize: "11px" }}
                            >
                              <Check size={12} /> Save
                            </button>
                            <button
                              className={styles.btnSecondary}
                              onClick={() => setEditingId(null)}
                              style={{ padding: "6px 12px", fontSize: "11px" }}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className={styles.btnSecondary}
                              onClick={() => handleAuditClick(t)}
                              disabled={loadingAuditId === t.id}
                              style={{ padding: "6px 12px", fontSize: "11px", color: "var(--gold)" }}
                              title="Audit customization compatibility"
                            >
                              <Activity size={12} /> {loadingAuditId === t.id ? "Analyzing…" : "Audit"}
                            </button>
                            <button
                              className={styles.btnSecondary}
                              onClick={() => handleEditClick(t)}
                              style={{ padding: "6px 12px", fontSize: "11px" }}
                              title="Edit metadata"
                            >
                              <Edit2 size={12} /> Edit
                            </button>
                            <button
                              className={styles.btnSecondary}
                              onClick={() => handleDelete(t.id)}
                              style={{ padding: "6px 12px", fontSize: "11px", color: "#f87171" }}
                              title="Delete template"
                            >
                              <Trash2 size={12} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View (< 640px) */}
          <div className={styles.mobileCardList}>
            {templates.map((t) => {
              const p = getTemplatePricing(t);
              return (
                <div key={t.id} className={styles.mobileCardItem}>
                  <div className={styles.mobileCardTop}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <a
                        href={templateUrl(t.filename)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.btnSecondary}
                        style={{ padding: "7px 10px", borderRadius: "8px", flexShrink: 0 }}
                        title={`Preview ${t.title}`}
                      >
                        <Eye size={14} color="var(--gold)" />
                      </a>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontWeight: 600, color: "#fff", fontSize: "14px" }}>{t.title}</span>
                        <div style={{ display: "flex", gap: "6px", marginTop: "2px", alignItems: "center" }}>
                          <span style={{
                            padding: "2px 6px",
                            borderRadius: "4px",
                            fontSize: "10px",
                            background: "rgba(255, 255, 255, 0.05)",
                            color: "rgba(255, 255, 255, 0.8)",
                            border: "1px solid rgba(255, 255, 255, 0.08)"
                          }}>
                            {t.category}
                          </span>
                          <span style={tierChipStyle(getTemplateTier(t))}>{TIER_DETAILS[getTemplateTier(t)].label}</span>
                          <span
                            className={styles.statusBadge}
                            style={{
                              background: "rgba(212, 175, 55, 0.1)",
                              color: "var(--gold)",
                              border: "1px solid rgba(212, 175, 55, 0.25)",
                              fontSize: "9px",
                              padding: "1px 6px",
                            }}
                          >
                            {t.badge || "FEATURED"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleEnabled(t.id, t.enabled !== false)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: "4px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <div
                        style={{
                          width: "34px",
                          height: "18px",
                          borderRadius: "999px",
                          background: t.enabled !== false
                            ? "linear-gradient(135deg, #f7df9e 0%, #d4af37 100%)"
                            : "rgba(255, 255, 255, 0.15)",
                          position: "relative",
                          transition: "all 0.25s ease",
                        }}
                      >
                        <div
                          style={{
                            width: "14px",
                            height: "14px",
                            borderRadius: "50%",
                            background: t.enabled !== false ? "#0a0a0d" : "#fff",
                            position: "absolute",
                            top: "2px",
                            left: t.enabled !== false ? "18px" : "2px",
                            transition: "left 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                          }}
                        />
                      </div>
                      <span
                        style={{
                          fontSize: "10.5px",
                          color: t.enabled !== false ? "var(--gold)" : "var(--muted)",
                          fontWeight: 600,
                        }}
                      >
                        {t.enabled !== false ? "Published" : "Hidden"}
                      </span>
                    </button>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "8px 0" }}>
                    <span style={{ fontSize: "12px", color: "var(--muted)" }}>Price:</span>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                      <span style={{ fontWeight: 700, color: "#fae29c", fontSize: "13.5px" }}>
                        {p.price}
                      </span>
                      {p.originalPrice && (
                        <span style={{ textDecoration: "line-through", color: "rgba(255, 255, 255, 0.4)", fontSize: "11px" }}>
                          {p.originalPrice}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    <button
                      className={styles.btnSecondary}
                      onClick={() => handleAuditClick(t)}
                      disabled={loadingAuditId === t.id}
                      style={{ padding: "6px 10px", fontSize: "11px", color: "var(--gold)", flex: "1 1 auto", justifyContent: "center" }}
                      title="Audit customization compatibility"
                    >
                      <Activity size={12} /> {loadingAuditId === t.id ? "Analyzing…" : "Audit"}
                    </button>
                    <button
                      className={styles.btnSecondary}
                      onClick={() => handleEditClick(t)}
                      style={{ padding: "6px 10px", fontSize: "11px", flex: "1 1 auto", justifyContent: "center" }}
                      title="Edit metadata"
                    >
                      <Edit2 size={12} /> Edit
                    </button>
                    <button
                      className={styles.btnSecondary}
                      onClick={() => handleDelete(t.id)}
                      style={{ padding: "6px 10px", fontSize: "11px", color: "#f87171", flex: "0 0 auto" }}
                      title="Delete template"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upload Modal with Luxury Dark Styling */}
        {showUploadModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0, 0, 0, 0.75)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              display: "grid",
              placeItems: "center",
              zIndex: 100,
              padding: "20px",
            }}
          >
            <div
              style={{
                background: "rgba(14, 14, 19, 0.95)",
                border: "1px solid rgba(212, 175, 55, 0.25)",
                borderRadius: "20px",
                padding: "36px",
                width: "100%",
                maxWidth: "460px",
                maxHeight: "calc(100vh - 40px)",
                overflowY: "auto",
                boxShadow: "0 25px 80px rgba(0, 0, 0, 0.8), 0 0 40px rgba(212, 175, 55, 0.1)",
                color: "#fff",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "22px" }}>
                <div>
                  <h3 style={{ margin: 0, fontFamily: "var(--serif)", fontSize: "22px", color: "#fff" }}>
                    Add New Template
                  </h3>
                  <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--muted)" }}>
                    Upload an interactive HTML wedding or event template
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { setShowUploadModal(false); setUploadFile(null); setCoverFile(null); }}
                  style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", padding: "4px" }}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600, color: "var(--muted)", marginBottom: "6px" }}>
                    Template Title
                  </label>
                  <input
                    required
                    placeholder="e.g. Royal Golden Heritage"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      background: "rgba(255, 255, 255, 0.04)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "8px",
                      color: "#fff",
                      fontSize: "13.5px",
                      outline: "none",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600, color: "var(--muted)", marginBottom: "6px" }}>
                    HTML Template File
                  </label>
                  <label style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    padding: "24px",
                    borderRadius: "10px",
                    border: "1px dashed rgba(212, 175, 55, 0.35)",
                    background: "rgba(212, 175, 55, 0.03)",
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}>
                    <Upload size={24} color="var(--gold)" />
                    <span style={{ fontSize: "12.5px", color: uploadFile ? "#fff" : "var(--muted)", fontWeight: uploadFile ? 600 : 400 }}>
                      {uploadFile ? uploadFile.name : "Choose .html file or drag & drop (up to 100 MB)"}
                    </span>
                    <input
                      required
                      type="file"
                      accept=".html"
                      onChange={(e) => {
                        setReport(null);
                        setForceConfirm(false);
                        const file = e.target.files?.[0] || null;
                        if (file && file.size > 100 * 1024 * 1024) {
                          setError('Choose an HTML file up to 100 MB.');
                          setUploadFile(null);
                          e.target.value = '';
                          return;
                        }
                        setError('');
                        setUploadFile(file);
                      }}
                      style={{ display: "none" }}
                    />
                  </label>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600, color: "var(--muted)", marginBottom: "6px" }}>
                    Cover Image (optional)
                  </label>
                  <label style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    padding: "18px",
                    borderRadius: "10px",
                    border: "1px dashed rgba(212, 175, 55, 0.35)",
                    background: "rgba(212, 175, 55, 0.03)",
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}>
                    <Upload size={20} color="var(--gold)" />
                    <span style={{ fontSize: "12.5px", color: coverFile ? "#fff" : "var(--muted)", fontWeight: coverFile ? 600 : 400 }}>
                      {coverFile ? coverFile.name : "Choose a portrait screenshot (WebP, PNG or JPG, under 3 MB)"}
                    </span>
                    <span style={{ fontSize: "11px", color: "var(--muted)", textAlign: "center" }}>
                      A front image is generated automatically from your invitation. Choose an image here only to use your own cover.
                    </span>
                    <input
                      type="file"
                      accept="image/webp,image/png,image/jpeg"
                      onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                      style={{ display: "none" }}
                    />
                  </label>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600, color: "var(--muted)", marginBottom: "6px" }}>
                      Category
                    </label>
                    <select
                      required
                      value={editForm.category}
                      onChange={(e) => {
                        const newCat = e.target.value;
                        const matchedCat = categories.find(c => c.name === newCat);
                        setEditForm({
                          ...editForm,
                          category: newCat,
                          badge: matchedCat?.badge || newCat.toUpperCase()
                        });
                      }}
                      style={{
                        width: "100%",
                        padding: "12px 14px",
                        background: "rgba(255, 255, 255, 0.04)",
                        border: "1px solid rgba(255, 255, 255, 0.12)",
                        borderRadius: "8px",
                        color: "#fff",
                        fontSize: "13.5px",
                        outline: "none",
                        cursor: "pointer"
                      }}
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.name} style={{ background: "#111", color: "#fff" }}>
                          {c.name}
                        </option>
                      ))}
                      {categories.length === 0 && (
                        <>
                          <option value="Wedding" style={{ background: "#111" }}>Wedding</option>
                          <option value="Birthday" style={{ background: "#111" }}>Birthday</option>
                          <option value="Baby Shower" style={{ background: "#111" }}>Baby Shower</option>
                          <option value="Traditional" style={{ background: "#111" }}>Traditional</option>
                          <option value="Corporate" style={{ background: "#111" }}>Corporate</option>
                          <option value="Anniversary" style={{ background: "#111" }}>Anniversary</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600, color: "var(--muted)", marginBottom: "6px" }}>
                      Badge Text
                    </label>
                    <input
                      required
                      placeholder="e.g. 3D DOOR"
                      value={editForm.badge}
                      onChange={(e) => setEditForm({ ...editForm, badge: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "12px 14px",
                        background: "rgba(255, 255, 255, 0.04)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: "8px",
                        color: "#fff",
                        fontSize: "13.5px",
                        outline: "none",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600, color: "var(--muted)", marginBottom: "6px" }}>
                    Collection Tier
                  </label>
                  <div role="radiogroup" aria-label="Collection tier" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
                    {TEMPLATE_TIERS.map(tier => {
                      const selected = editForm.tier === tier;
                      return (
                        <button
                          key={tier}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => setEditForm({ ...editForm, tier })}
                          style={{
                            padding: "10px 12px",
                            borderRadius: "8px",
                            textAlign: "left",
                            cursor: "pointer",
                            background: selected ? "rgba(212, 175, 55, 0.16)" : "rgba(255, 255, 255, 0.04)",
                            border: `1px solid ${selected ? "var(--gold)" : "rgba(255, 255, 255, 0.1)"}`,
                            color: "#fff",
                          }}
                        >
                          <span style={{ display: "block", fontWeight: 700, fontSize: "13px", color: selected ? "#fae29c" : "#fff" }}>{TIER_DETAILS[tier].label}</span>
                          <span style={{ display: "block", fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>{TIER_DETAILS[tier].tagline}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600, color: "var(--muted)", marginBottom: "6px" }}>
                      Selling Price (Set by Tier)
                    </label>
                    <div
                      style={{
                        width: "100%",
                        padding: "12px 14px",
                        background: "rgba(255, 255, 255, 0.04)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: "8px",
                        color: "#fae29c",
                        fontSize: "13.5px",
                        fontWeight: 700,
                      }}
                    >
                      {rupees(TIER_PRICES[editForm.tier])} <small style={{ fontWeight: 400, color: "var(--muted)" }}>{GST_NOTE}</small>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600, color: "var(--muted)", marginBottom: "6px" }}>
                      Slashed MRP (Optional)
                    </label>
                    <input
                      placeholder="e.g. ₹3,999"
                      value={editForm.original_price}
                      onChange={(e) => setEditForm({ ...editForm, original_price: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "12px 14px",
                        background: "rgba(255, 255, 255, 0.04)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: "8px",
                        color: "rgba(255, 255, 255, 0.75)",
                        fontSize: "13.5px",
                        outline: "none",
                      }}
                    />
                  </div>
                </div>

                {report && (
                  <div style={{
                    background: "rgba(255, 255, 255, 0.03)",
                    border: `1px solid ${report.score >= 80 ? 'rgba(34, 197, 94, 0.35)' : report.score >= 50 ? 'rgba(234, 179, 8, 0.35)' : 'rgba(239, 68, 68, 0.35)'}`,
                    borderRadius: "12px",
                    padding: "16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <ShieldCheck size={18} color={report.score >= 80 ? "#22c55e" : report.score >= 50 ? "#eab308" : "#ef4444"} />
                        <span style={{ fontWeight: 600, fontSize: "13px", color: "#fff" }}>Customization Compatibility</span>
                      </div>
                      <span style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        padding: "3px 10px",
                        borderRadius: "999px",
                        background: report.score >= 80 ? "rgba(34, 197, 94, 0.15)" : report.score >= 50 ? "rgba(234, 179, 8, 0.15)" : "rgba(239, 68, 68, 0.15)",
                        color: report.score >= 80 ? "#22c55e" : report.score >= 50 ? "#eab308" : "#ef4444",
                        border: `1px solid ${report.score >= 80 ? 'rgba(34, 197, 94, 0.3)' : report.score >= 50 ? 'rgba(234, 179, 8, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                      }}>
                        {report.score}% Score
                      </span>
                    </div>

                    <div style={{ width: "100%", height: "6px", background: "rgba(255, 255, 255, 0.1)", borderRadius: "999px", overflow: "hidden" }}>
                      <div style={{
                        width: `${report.score}%`,
                        height: "100%",
                        background: report.score >= 80
                          ? "linear-gradient(90deg, #22c55e, #4ade80)"
                          : report.score >= 50
                          ? "linear-gradient(90deg, #eab308, #fde047)"
                          : "linear-gradient(90deg, #ef4444, #f87171)",
                        transition: "width 0.4s ease"
                      }} />
                    </div>

                    <p style={{ margin: 0, fontSize: "12px", color: "var(--muted)", lineHeight: 1.4 }}>
                      {report.summary}
                    </p>

                    <button
                      type="button"
                      onClick={() => setShowReportDetails(!showReportDetails)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--gold)",
                        fontSize: "11.5px",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: 0,
                        fontWeight: 600
                      }}
                    >
                      {showReportDetails ? <><ChevronUp size={14} /> Hide Audit Breakdown</> : <><ChevronDown size={14} /> View 8 Customization Checks</>}
                    </button>

                    {showReportDetails && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "4px" }}>
                        {report.items.map((item) => (
                          <div key={item.key} style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "8px",
                            padding: "8px 10px",
                            borderRadius: "6px",
                            background: "rgba(0, 0, 0, 0.25)",
                            border: "1px solid rgba(255, 255, 255, 0.05)"
                          }}>
                            {item.status === 'pass' ? (
                              <CheckCircle2 size={14} color="#22c55e" style={{ marginTop: "2px", flexShrink: 0 }} />
                            ) : item.status === 'warn' ? (
                              <AlertTriangle size={14} color="#eab308" style={{ marginTop: "2px", flexShrink: 0 }} />
                            ) : (
                              <XCircle size={14} color="#ef4444" style={{ marginTop: "2px", flexShrink: 0 }} />
                            )}
                            <div style={{ flex: 1 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontSize: "11.5px", fontWeight: 600, color: "#fff" }}>{item.label}</span>
                                <span style={{
                                  fontSize: "10px",
                                  textTransform: "uppercase",
                                  fontWeight: 700,
                                  color: item.status === 'pass' ? '#22c55e' : item.status === 'warn' ? '#eab308' : '#ef4444'
                                }}>
                                  {item.status}
                                </span>
                              </div>
                              <p style={{ margin: "2px 0 0", fontSize: "11px", color: "var(--muted)", lineHeight: 1.35 }}>
                                {item.message}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {report.items.some(i => i.status === 'fail' && i.key === 'canvas') && (
                      <div style={{
                        padding: "10px 12px",
                        borderRadius: "8px",
                        background: "rgba(239, 68, 68, 0.1)",
                        border: "1px solid rgba(239, 68, 68, 0.25)",
                        color: "#fca5a5",
                        fontSize: "11.5px",
                        lineHeight: 1.4
                      }}>
                        <strong>⚠️ Canvas Artwork Text Detected:</strong> This template uses canvas text drawing (e.g. fillText). That text cannot be edited in the browser customizer.
                      </div>
                    )}

                    {report.items.some(i => i.status === 'fail') && (
                      <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "12px", color: "#fef08a" }}>
                        <input
                          type="checkbox"
                          checked={forceConfirm}
                          onChange={(e) => setForceConfirm(e.target.checked)}
                        />
                        I acknowledge the customization limitations and want to publish anyway.
                      </label>
                    )}
                  </div>
                )}

                <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
                  <button
                    type="submit"
                    disabled={isUploading}
                    className={styles.btnPrimary}
                    style={{ flex: 1, justifyContent: "center" }}
                  >
                    {isUploading ? "Uploading to Library…" : "Publish Template"}
                  </button>
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={() => { setShowUploadModal(false); setUploadFile(null); setCoverFile(null); setReport(null); }}
                    className={styles.btnSecondary}
                    style={{ flex: 1, justifyContent: "center" }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Dedicated Audit Modal */}
        {auditTemplate && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0, 0, 0, 0.8)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              display: "grid",
              placeItems: "center",
              zIndex: 100,
              padding: "20px"
            }}
          >
            <div
              style={{
                background: "rgba(14, 14, 19, 0.96)",
                border: "1px solid rgba(212, 175, 55, 0.3)",
                borderRadius: "20px",
                padding: "32px",
                width: "100%",
                maxWidth: "560px",
                maxHeight: "85vh",
                overflowY: "auto",
                boxShadow: "0 25px 80px rgba(0, 0, 0, 0.8), 0 0 40px rgba(212, 175, 55, 0.15)",
                color: "#fff"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div>
                  <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", color: "var(--gold)", fontWeight: 600 }}>
                    Compatibility & Health Audit
                  </span>
                  <h3 style={{ margin: "4px 0 0", fontFamily: "var(--serif)", fontSize: "22px", color: "#fff" }}>
                    {auditTemplate.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setAuditTemplate(null)}
                  style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", padding: "4px" }}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "12px",
                padding: "16px",
                marginBottom: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}>
                <div>
                  <div style={{ fontSize: "28px", fontWeight: 800, color: auditTemplate.report.score >= 80 ? "#22c55e" : auditTemplate.report.score >= 50 ? "#eab308" : "#ef4444" }}>
                    {auditTemplate.report.score}%
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--muted)" }}>Overall Customizer Health</div>
                </div>
                <p style={{ margin: 0, maxWidth: "300px", fontSize: "12px", color: "rgba(255, 255, 255, 0.8)", lineHeight: 1.4 }}>
                  {auditTemplate.report.summary}
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
                {auditTemplate.report.items.map((item) => (
                  <div key={item.key} style={{
                    padding: "12px 14px",
                    borderRadius: "8px",
                    background: "rgba(0, 0, 0, 0.3)",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px"
                  }}>
                    {item.status === 'pass' ? (
                      <CheckCircle2 size={16} color="#22c55e" style={{ marginTop: "2px", flexShrink: 0 }} />
                    ) : item.status === 'warn' ? (
                      <AlertTriangle size={16} color="#eab308" style={{ marginTop: "2px", flexShrink: 0 }} />
                    ) : (
                      <XCircle size={16} color="#ef4444" style={{ marginTop: "2px", flexShrink: 0 }} />
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "12.5px", fontWeight: 600, color: "#fff" }}>{item.label}</span>
                        <span style={{
                          fontSize: "10.5px",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          background: item.status === 'pass' ? 'rgba(34, 197, 94, 0.15)' : item.status === 'warn' ? 'rgba(234, 179, 8, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: item.status === 'pass' ? '#22c55e' : item.status === 'warn' ? '#eab308' : '#ef4444'
                        }}>
                          {item.status}
                        </span>
                      </div>
                      <p style={{ margin: "4px 0 0", fontSize: "11.5px", color: "var(--muted)", lineHeight: 1.4 }}>
                        {item.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  className={styles.btnSecondary}
                  onClick={() => setAuditTemplate(null)}
                  style={{ padding: "8px 20px" }}
                >
                  Close Report
                </button>
              </div>
            </div>
          </div>
        )}
      </fieldset>
    </div>
  );
}
