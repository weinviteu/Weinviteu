"use client";

import { useState, useEffect } from "react";
import styles from "../admin.module.css";
import {
  Tag,
  Plus,
  Edit2,
  Trash2,
  X,
  Layers,
  Sparkles,
  Eye,
  EyeOff
} from "lucide-react";
import { api, errorMessage, jsonBody } from "@/lib/client-api";
import type { Category, Template } from "@/lib/models";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [form, setForm] = useState({
    name: "",
    badge: "",
    display_order: 1,
    is_active: true
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [catList, tList] = await Promise.all([
        api<Category[]>('/api/admin/categories'),
        api<Template[]>('/api/admin/templates').catch(() => [])
      ]);
      setCategories(catList);
      setTemplates(tList);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    Promise.all([api<Category[]>('/api/admin/categories'), api<Template[]>('/api/admin/templates')])
      .then(([catList, tList]) => { if (!cancelled) { setCategories(catList); setTemplates(tList); } })
      .catch(e => { if (!cancelled) setError(errorMessage(e)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const openAddModal = () => {
    setEditingCategory(null);
    setForm({
      name: "",
      badge: "",
      display_order: categories.length + 1,
      is_active: true
    });
    setShowAddModal(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setForm({
      name: cat.name,
      badge: cat.badge || cat.name.toUpperCase(),
      display_order: cat.display_order ?? 0,
      is_active: cat.is_active ?? true
    });
    setShowAddModal(true);
  };

  const handleNameChange = (val: string) => {
    setForm(prev => ({
      ...prev,
      name: val,
      badge: editingCategory ? prev.badge : val.toUpperCase()
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    setSubmitting(true);
    setError("");
    try {
      if (editingCategory) {
        await api('/api/admin/categories', {
          ...jsonBody({
            id: editingCategory.id,
            name: form.name.trim(),
            badge: form.badge.trim() || form.name.trim().toUpperCase(),
            display_order: Number(form.display_order),
            is_active: form.is_active
          }),
          method: 'PATCH'
        });
        setSuccessMessage(`Updated category "${form.name}"`);
      } else {
        await api('/api/admin/categories', jsonBody({
          name: form.name.trim(),
          badge: form.badge.trim() || form.name.trim().toUpperCase(),
          display_order: Number(form.display_order)
        }));
        setSuccessMessage(`Created category "${form.name}"`);
      }
      setShowAddModal(false);
      await fetchData();
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (cat: Category) => {
    try {
      const nextActive = !cat.is_active;
      await api('/api/admin/categories', {
        ...jsonBody({
          id: cat.id,
          is_active: nextActive
        }),
        method: 'PATCH'
      });
      setCategories(prev =>
        prev.map(c => c.id === cat.id ? { ...c, is_active: nextActive } : c)
      );
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  const handleDelete = async (cat: Category) => {
    const templateCount = templates.filter(
      t => t.category?.toLowerCase() === cat.name.toLowerCase()
    ).length;

    let confirmMsg = `Delete category "${cat.name}"?`;
    if (templateCount > 0) {
      confirmMsg += ` Warning: ${templateCount} template(s) currently use this category!`;
    }

    if (!confirm(confirmMsg)) return;

    try {
      await api(`/api/admin/categories?id=${cat.id}`, { method: 'DELETE' });
      setCategories(prev => prev.filter(c => c.id !== cat.id));
      setSuccessMessage(`Category "${cat.name}" deleted.`);
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h2>Event Categories</h2>
          <p>
            Standardized categories for classifying 3D invitation templates, inquiry leads, and customer projects.
          </p>
        </div>
        <button onClick={openAddModal} className={styles.btnPrimary} style={{ display: "inline-flex", gap: "8px", alignItems: "center" }}>
          <Plus size={16} /> Add Category
        </button>
      </div>

      {error && (
        <div role="alert" className={styles.editorMessage} style={{ borderColor: "rgba(239, 68, 68, 0.4)", color: "#fca5a5" }}>
          {error}
        </div>
      )}

      {successMessage && (
        <div role="status" className={styles.editorMessage} style={{ borderColor: "rgba(16, 185, 129, 0.4)", color: "#6ee7b7" }}>
          {successMessage}
        </div>
      )}

      {/* Metrics Bar */}
      <div className={styles.statsGrid} style={{ marginBottom: "28px" }}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "rgba(212, 175, 55, 0.12)", color: "var(--gold)" }}>
            <Tag size={22} />
          </div>
          <div className={styles.statInfo}>
            <p>Total Categories</p>
            <h4>{categories.length}</h4>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "rgba(16, 185, 129, 0.12)", color: "#34d399", borderColor: "rgba(16, 185, 129, 0.3)" }}>
            <Sparkles size={22} />
          </div>
          <div className={styles.statInfo}>
            <p>Active Showcase</p>
            <h4>{categories.filter(c => c.is_active !== false).length}</h4>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "rgba(59, 130, 246, 0.12)", color: "#60a5fa", borderColor: "rgba(59, 130, 246, 0.3)" }}>
            <Layers size={22} />
          </div>
          <div className={styles.statInfo}>
            <p>Total Library Templates</p>
            <h4>{templates.length}</h4>
          </div>
        </div>
      </div>

      {/* Categories Table */}
      <div className={styles.card} style={{ padding: 0, overflow: "hidden" }}>
        <div className={styles.cardHeader} style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>
          <h3 style={{ margin: 0, fontSize: "16px", color: "#fff" }}>Configured Categories</h3>
          <span style={{ fontSize: "12px", color: "var(--muted)" }}>
            Categories appear in templates, inquiry forms, and customizer dropdowns.
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--muted)" }}>
            Loading categories…
          </div>
        ) : (
          <>
            {/* Desktop / Tablet Table View */}
            <div className={styles.tableResponsive}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th style={{ width: "80px" }}>Order</th>
                    <th>Category Name</th>
                    <th>Badge Label</th>
                    <th>Slug Key</th>
                    <th>Templates Using</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat) => {
                    const linkedCount = templates.filter(
                      t => t.category?.toLowerCase() === cat.name.toLowerCase()
                    ).length;

                    return (
                      <tr key={cat.id}>
                        <td style={{ color: "var(--muted)", fontWeight: 600 }}>
                          #{cat.display_order ?? 0}
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, color: "#fff", fontSize: "14px" }}>
                            {cat.name}
                          </span>
                        </td>
                        <td>
                          <span
                            style={{
                              padding: "3px 10px",
                              borderRadius: "4px",
                              fontSize: "11px",
                              fontWeight: 700,
                              letterSpacing: "1px",
                              background: "rgba(212, 175, 55, 0.12)",
                              color: "var(--gold)",
                              border: "1px solid rgba(212, 175, 55, 0.25)"
                            }}
                          >
                            {cat.badge || cat.name.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <code style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.6)" }}>
                            {cat.slug}
                          </code>
                        </td>
                        <td>
                          <span
                            style={{
                              padding: "2px 8px",
                              borderRadius: "12px",
                              fontSize: "11.5px",
                              background: linkedCount > 0 ? "rgba(59, 130, 246, 0.15)" : "rgba(255, 255, 255, 0.05)",
                              color: linkedCount > 0 ? "#60a5fa" : "var(--muted)",
                              border: `1px solid ${linkedCount > 0 ? "rgba(59, 130, 246, 0.3)" : "rgba(255, 255, 255, 0.08)"}`
                            }}
                          >
                            {linkedCount} {linkedCount === 1 ? 'template' : 'templates'}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => toggleActive(cat)}
                            className={styles.btnSecondary}
                            style={{
                              padding: "4px 10px",
                              fontSize: "11px",
                              borderRadius: "20px",
                              color: cat.is_active !== false ? "#34d399" : "var(--muted)",
                              borderColor: cat.is_active !== false ? "rgba(16, 185, 129, 0.3)" : "rgba(255, 255, 255, 0.1)",
                              background: cat.is_active !== false ? "rgba(16, 185, 129, 0.08)" : "transparent"
                            }}
                          >
                            {cat.is_active !== false ? (
                              <>
                                <Eye size={12} /> Active
                              </>
                            ) : (
                              <>
                                <EyeOff size={12} /> Hidden
                              </>
                            )}
                          </button>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <div style={{ display: "inline-flex", gap: "8px" }}>
                            <button
                              onClick={() => openEditModal(cat)}
                              className={styles.btnSecondary}
                              style={{ padding: "6px 10px", fontSize: "11px" }}
                              title="Edit Category"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => handleDelete(cat)}
                              className={styles.btnSecondary}
                              style={{ padding: "6px 10px", fontSize: "11px", color: "#f87171", borderColor: "rgba(239, 68, 68, 0.25)" }}
                              title="Delete Category"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View (< 640px) */}
            <div className={styles.mobileCardList}>
              {categories.map((cat) => {
                const linkedCount = templates.filter(
                  t => t.category?.toLowerCase() === cat.name.toLowerCase()
                ).length;

                return (
                  <div key={cat.id} className={styles.mobileCardItem}>
                    <div className={styles.mobileCardTop}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ color: "var(--muted)", fontWeight: 700, fontSize: "12px" }}>
                          #{cat.display_order ?? 0}
                        </span>
                        <span style={{ fontWeight: 600, color: "#fff", fontSize: "14.5px" }}>
                          {cat.name}
                        </span>
                      </div>

                      <button
                        onClick={() => toggleActive(cat)}
                        className={styles.btnSecondary}
                        style={{
                          padding: "4px 10px",
                          fontSize: "10.5px",
                          borderRadius: "20px",
                          color: cat.is_active !== false ? "#34d399" : "var(--muted)",
                          borderColor: cat.is_active !== false ? "rgba(16, 185, 129, 0.3)" : "rgba(255, 255, 255, 0.1)",
                          background: cat.is_active !== false ? "rgba(16, 185, 129, 0.08)" : "transparent"
                        }}
                      >
                        {cat.is_active !== false ? (
                          <>
                            <Eye size={11} /> Active
                          </>
                        ) : (
                          <>
                            <EyeOff size={11} /> Hidden
                          </>
                        )}
                      </button>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "8px 0" }}>
                      <span
                        style={{
                          padding: "3px 8px",
                          borderRadius: "4px",
                          fontSize: "10.5px",
                          fontWeight: 700,
                          letterSpacing: "1px",
                          background: "rgba(212, 175, 55, 0.12)",
                          color: "var(--gold)",
                          border: "1px solid rgba(212, 175, 55, 0.25)"
                        }}
                      >
                        {cat.badge || cat.name.toUpperCase()}
                      </span>
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: "12px",
                          fontSize: "11px",
                          background: linkedCount > 0 ? "rgba(59, 130, 246, 0.15)" : "rgba(255, 255, 255, 0.05)",
                          color: linkedCount > 0 ? "#60a5fa" : "var(--muted)",
                          border: `1px solid ${linkedCount > 0 ? "rgba(59, 130, 246, 0.3)" : "rgba(255, 255, 255, 0.08)"}`
                        }}
                      >
                        {linkedCount} {linkedCount === 1 ? 'template' : 'templates'}
                      </span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <code style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.5)" }}>
                        slug: {cat.slug}
                      </code>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          onClick={() => openEditModal(cat)}
                          className={styles.btnSecondary}
                          style={{ padding: "6px 10px", fontSize: "11px" }}
                          title="Edit Category"
                        >
                          <Edit2 size={13} /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(cat)}
                          className={styles.btnSecondary}
                          style={{ padding: "6px 10px", fontSize: "11px", color: "#f87171", borderColor: "rgba(239, 68, 68, 0.25)" }}
                          title="Delete Category"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Add / Edit Category Modal */}
      {showAddModal && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.8)",
            backdropFilter: "blur(6px)",
            display: "grid",
            placeItems: "center",
            zIndex: 1000,
            padding: "20px"
          }}
        >
          <div
            className={styles.card}
            style={{
              width: "100%",
              maxWidth: "460px",
              padding: "28px",
              background: "#0e0e12",
              border: "1px solid rgba(212, 175, 55, 0.3)",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.8)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", color: "#fff" }}>
                {editingCategory ? "Edit Category" : "Add New Category"}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", color: "var(--muted)", fontWeight: 600, marginBottom: "6px" }}>
                  Category Name
                </label>
                <input
                  required
                  placeholder="e.g. Traditional, Wedding, Birthday"
                  value={form.name}
                  onChange={e => handleNameChange(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "14px",
                    outline: "none"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", color: "var(--muted)", fontWeight: 600, marginBottom: "6px" }}>
                  Badge Text (Shown on template cards)
                </label>
                <input
                  placeholder="e.g. TRADITIONAL, WEDDING"
                  value={form.badge}
                  onChange={e => setForm({ ...form, badge: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: "8px",
                    color: "var(--gold)",
                    fontSize: "14px",
                    fontWeight: 600,
                    letterSpacing: "0.8px",
                    outline: "none"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", color: "var(--muted)", fontWeight: 600, marginBottom: "6px" }}>
                  Display Order
                </label>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={form.display_order}
                  onChange={e => setForm({ ...form, display_order: Number(e.target.value) })}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "14px",
                    outline: "none"
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className={styles.btnSecondary}
                  style={{ padding: "10px 18px", fontSize: "12px" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={styles.btnPrimary}
                  style={{ padding: "10px 22px", fontSize: "12px" }}
                >
                  {submitting ? "Saving…" : editingCategory ? "Update Category" : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
