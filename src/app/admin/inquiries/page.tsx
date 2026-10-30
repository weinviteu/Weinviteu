"use client";

import { useState, useEffect } from "react";
import styles from "../admin.module.css";
import Link from "next/link";
import {
  MessageSquare,
  Mail,
  Search,
  CheckCircle,
  Wand2,
  Clock,
  Check,
  Trash2,
  Tag,
  Sparkles,
  Filter
} from "lucide-react";
import { api, errorMessage, jsonBody } from "@/lib/client-api";
import type { Inquiry, Category, Template } from "@/lib/models";

const getCategoryColor = (categoryName: string) => {
  const cat = categoryName.toLowerCase();
  if (cat.includes("wedding")) return { bg: "rgba(212, 175, 55, 0.15)", border: "rgba(212, 175, 55, 0.35)", text: "var(--gold)" };
  if (cat.includes("anniversary")) return { bg: "rgba(244, 114, 182, 0.15)", border: "rgba(244, 114, 182, 0.35)", text: "#f472b6" };
  if (cat.includes("birthday")) return { bg: "rgba(251, 146, 60, 0.15)", border: "rgba(251, 146, 60, 0.35)", text: "#fb923c" };
  if (cat.includes("baby")) return { bg: "rgba(56, 189, 248, 0.15)", border: "rgba(56, 189, 248, 0.35)", text: "#38bdf8" };
  if (cat.includes("corporate")) return { bg: "rgba(96, 165, 250, 0.15)", border: "rgba(96, 165, 250, 0.35)", text: "#60a5fa" };
  if (cat.includes("traditional")) return { bg: "rgba(52, 211, 153, 0.15)", border: "rgba(52, 211, 153, 0.35)", text: "#34d399" };
  return { bg: "rgba(167, 139, 250, 0.15)", border: "rgba(167, 139, 250, 0.35)", text: "#a78bfa" };
};

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filter, setFilter] = useState<"all" | "new" | "contacted" | "converted">("all");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loadFailed, setLoadFailed] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api<Inquiry[]>('/api/admin/inquiries'),
      api<Category[]>('/api/admin/categories'),
      api<Template[]>('/api/admin/templates')
    ])
      .then(([inqList, catList, tList]) => {
        setInquiries(Array.isArray(inqList) ? inqList : []);
        setCategories(Array.isArray(catList) ? catList : []);
        setTemplates(Array.isArray(tList) ? tList : []);
      })
      .catch((e) => { setError(errorMessage(e)); setLoadFailed(true); })
      .finally(() => setLoading(false));
  }, []);

  const markContacted = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'Contacted' ? 'New Inquiry' : 'Contacted';
    setUpdatingId(id);
    try {
      await api('/api/admin/inquiries', {
        ...jsonBody({ id, status: nextStatus }),
        method: 'PATCH'
      });
      setInquiries((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: nextStatus } : item))
      );
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setUpdatingId(null);
    }
  };

  const updateCategory = async (id: string, category: string) => {
    setUpdatingId(id);
    try {
      await api('/api/admin/inquiries', {
        ...jsonBody({ id, category }),
        method: 'PATCH'
      });
      setInquiries((prev) =>
        prev.map((item) => (item.id === id ? { ...item, category } : item))
      );
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setUpdatingId(null);
    }
  };

  const updateTemplate = async (id: string, template_name: string) => {
    setUpdatingId(id);
    try {
      await api('/api/admin/inquiries', {
        ...jsonBody({ id, template_name }),
        method: 'PATCH'
      });
      setInquiries((prev) =>
        prev.map((item) => (item.id === id ? { ...item, template_name } : item))
      );
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteInquiry = async (id: string) => {
    if (!confirm("Are you sure you want to delete this inquiry? This action cannot be undone.")) return;
    setUpdatingId(id);
    try {
      await api(`/api/admin/inquiries?id=${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
      setInquiries((prev) => prev.filter((item) => item.id !== id));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = inquiries.filter((inquiry) => {
    const matchesFilter =
      filter === "all"
        ? true
        : filter === "new"
        ? inquiry.status === "New Inquiry"
        : filter === "contacted"
        ? inquiry.status === "Contacted"
        : inquiry.status === "Converted";

    const matchesCategory =
      selectedCategoryFilter === "all"
        ? true
        : inquiry.category?.toLowerCase() === selectedCategoryFilter.toLowerCase();

    const searchText = `${inquiry.client_name} ${inquiry.email} ${inquiry.category || ""} ${inquiry.template_name || ""} ${inquiry.message || ""}`.toLowerCase();
    const matchesSearch = searchText.includes(query.toLowerCase());

    return matchesFilter && matchesCategory && matchesSearch;
  });

  const newCount = inquiries.filter((i) => i.status === "New Inquiry").length;
  const contactedCount = inquiries.filter((i) => i.status === "Contacted").length;
  const convertedCount = inquiries.filter((i) => i.status === "Converted").length;

  if (loadFailed) return <div>
    <h2>Client Inquiries & Leads</h2>
    <p role="alert">{error}</p>
    <button className={styles.btnSecondary} onClick={() => window.location.reload()}>Retry loading inquiries</button>
  </div>;

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h2>Client Inquiries & Leads</h2>
          <p>
            Prospective guest inquiries received from your website. Manage categories, choose templates, and convert inquiries into custom invitations.
          </p>
        </div>
      </div>

      {error && (
        <div role="alert" className={styles.editorMessage}>
          {error}
        </div>
      )}

      {/* Metrics Bar */}
      <div className={styles.statsGrid} style={{ marginBottom: "28px" }}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "rgba(212, 175, 55, 0.12)", color: "var(--gold)" }}>
            <MessageSquare size={22} />
          </div>
          <div className={styles.statInfo}>
            <p>Total Leads</p>
            <h4>{inquiries.length}</h4>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "rgba(245, 158, 11, 0.12)", color: "#fbbf24", borderColor: "rgba(245, 158, 11, 0.3)" }}>
            <Clock size={22} />
          </div>
          <div className={styles.statInfo}>
            <p>Needs Response</p>
            <h4>{newCount}</h4>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "rgba(59, 130, 246, 0.12)", color: "#60a5fa", borderColor: "rgba(59, 130, 246, 0.3)" }}>
            <CheckCircle size={22} />
          </div>
          <div className={styles.statInfo}>
            <p>Contacted</p>
            <h4>{contactedCount}</h4>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "rgba(16, 185, 129, 0.12)", color: "#34d399", borderColor: "rgba(16, 185, 129, 0.3)" }}>
            <Sparkles size={22} />
          </div>
          <div className={styles.statInfo}>
            <p>Converted to Orders</p>
            <h4>{convertedCount}</h4>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "24px", alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "1 1 260px" }}>
          <Search size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.35)", pointerEvents: "none" }} />
          <input
            aria-label="Search inquiries"
            placeholder="Search by client name, email, category or message…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 16px 12px 42px",
              background: "rgba(255, 255, 255, 0.035)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "10px",
              color: "#fff",
              fontSize: "13.5px",
              outline: "none",
            }}
          />
        </div>

        {/* Category Filter Dropdown */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Filter size={15} color="var(--gold)" />
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            aria-label="Filter by category"
            style={{
              padding: "10px 14px",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "8px",
              color: "#fff",
              fontSize: "12.5px",
              cursor: "pointer",
              outline: "none"
            }}
          >
            <option value="all" style={{ background: "#111" }}>All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name} style={{ background: "#111" }}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Tabs */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            onClick={() => setFilter("all")}
            className={filter === "all" ? styles.btnPrimary : styles.btnSecondary}
            style={{ padding: "8px 14px", fontSize: "11.5px" }}
          >
            All ({inquiries.length})
          </button>
          <button
            onClick={() => setFilter("new")}
            className={filter === "new" ? styles.btnPrimary : styles.btnSecondary}
            style={{ padding: "8px 14px", fontSize: "11.5px" }}
          >
            New ({newCount})
          </button>
          <button
            onClick={() => setFilter("contacted")}
            className={filter === "contacted" ? styles.btnPrimary : styles.btnSecondary}
            style={{ padding: "8px 14px", fontSize: "11.5px" }}
          >
            Contacted ({contactedCount})
          </button>
          <button
            onClick={() => setFilter("converted")}
            className={filter === "converted" ? styles.btnPrimary : styles.btnSecondary}
            style={{ padding: "8px 14px", fontSize: "11.5px" }}
          >
            Converted ({convertedCount})
          </button>
        </div>
      </div>

      {/* Inquiry Cards List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
        {loading && (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--muted)" }}>
            Loading client inquiries…
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 20px", background: "rgba(255, 255, 255, 0.02)", borderRadius: "12px", border: "1px dashed rgba(255, 255, 255, 0.08)" }}>
            <MessageSquare size={36} color="var(--gold)" style={{ opacity: 0.6, marginBottom: "12px" }} />
            <h3 style={{ fontSize: "17px", color: "#fff", margin: "0 0 6px" }}>No inquiries found</h3>
            <p style={{ fontSize: "13px", color: "var(--muted)", margin: 0 }}>
              {query || selectedCategoryFilter !== "all" || filter !== "all"
                ? "Try adjusting your search filters."
                : "When clients submit the contact form on your website, their requests will appear here."}
            </p>
          </div>
        )}

        {filtered.map((inquiry) => {
          const isNew = inquiry.status === "New Inquiry";
          const isConverted = inquiry.status === "Converted";
          const categoryStyle = getCategoryColor(inquiry.category || "Wedding");

          // Find matching template if inquiry has one selected
          const matchedTemplate = templates.find(
            t => t.title.toLowerCase() === inquiry.template_name?.toLowerCase() ||
                 t.filename === inquiry.template_name
          );
          const launchTemplateFilename = matchedTemplate?.filename || templates[0]?.filename || "";

          return (
            <div
              key={inquiry.id}
              className={styles.card}
              style={{
                borderLeft: isConverted
                  ? "4px solid #34d399"
                  : isNew
                  ? "4px solid var(--gold)"
                  : "4px solid rgba(59, 130, 246, 0.6)",
                transition: "all 0.2s ease"
              }}
            >
              {/* Header: Client Info & Action Buttons */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", flexWrap: "wrap", marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "50%",
                      background: isConverted
                        ? "rgba(16, 185, 129, 0.15)"
                        : isNew
                        ? "rgba(212, 175, 55, 0.15)"
                        : "rgba(59, 130, 246, 0.15)",
                      border: isConverted
                        ? "1px solid rgba(16, 185, 129, 0.35)"
                        : isNew
                        ? "1px solid rgba(212, 175, 55, 0.35)"
                        : "1px solid rgba(59, 130, 246, 0.35)",
                      color: isConverted ? "#34d399" : isNew ? "var(--gold)" : "#60a5fa",
                      display: "grid",
                      placeItems: "center",
                      fontWeight: 700,
                      fontSize: "16px",
                      flexShrink: 0,
                    }}
                  >
                    {inquiry.client_name ? inquiry.client_name.charAt(0).toUpperCase() : "C"}
                  </div>

                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                      <h3 style={{ margin: 0, fontSize: "17.5px", fontWeight: 600, color: "#fff" }}>
                        {inquiry.client_name}
                      </h3>
                      <span
                        className={styles.statusBadge}
                        style={
                          isConverted
                            ? { background: "rgba(16, 185, 129, 0.12)", color: "#34d399", border: "1px solid rgba(16, 185, 129, 0.3)" }
                            : isNew
                            ? { background: "rgba(245, 158, 11, 0.12)", color: "#fbbf24", border: "1px solid rgba(245, 158, 11, 0.3)" }
                            : { background: "rgba(59, 130, 246, 0.12)", color: "#60a5fa", border: "1px solid rgba(59, 130, 246, 0.3)" }
                        }
                      >
                        {inquiry.status}
                      </span>

                      {/* Category Pill Tag */}
                      <span
                        style={{
                          fontSize: "11px",
                          padding: "3px 10px",
                          borderRadius: "6px",
                          background: categoryStyle.bg,
                          color: categoryStyle.text,
                          border: `1px solid ${categoryStyle.border}`,
                          fontWeight: 600,
                          letterSpacing: "0.4px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px"
                        }}
                      >
                        <Tag size={11} />
                        {inquiry.category || "Wedding"}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "4px", fontSize: "12px", color: "var(--muted)", flexWrap: "wrap" }}>
                      <a href={`mailto:${inquiry.email}`} style={{ color: "var(--muted)", textDecoration: "underline" }}>
                        {inquiry.email}
                      </a>
                      {inquiry.phone && (
                        <>
                          <span>•</span>
                          <span>{inquiry.phone}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>
                        Received {new Date(inquiry.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Top Actions */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  <button
                    disabled={updatingId === inquiry.id}
                    onClick={() => markContacted(inquiry.id, inquiry.status)}
                    className={styles.btnSecondary}
                    style={{ padding: "8px 12px", fontSize: "11.5px" }}
                    title="Toggle contacted status"
                  >
                    <Check size={13} />
                    <span>{inquiry.status === "Contacted" ? "Mark as New" : "Mark as Contacted"}</span>
                  </button>

                  <a
                    href={`mailto:${inquiry.email}?subject=${encodeURIComponent(`Regarding your ${inquiry.category || 'invitation'} inquiry - WeInviteU Atelier`)}`}
                    className={styles.btnSecondary}
                    style={{ padding: "8px 12px", fontSize: "11.5px" }}
                  >
                    <Mail size={13} />
                    <span>Reply</span>
                  </a>

                  <Link
                    href={`/admin/customize?inquiry=${inquiry.id}${launchTemplateFilename ? `&template=${encodeURIComponent(launchTemplateFilename)}` : ''}`}
                    className={styles.btnPrimary}
                    style={{ padding: "8px 16px", fontSize: "11.5px", background: "linear-gradient(135deg, var(--gold), #b38f2a)" }}
                    title="Convert this lead into a custom 3D invitation"
                  >
                    <Wand2 size={13} />
                    <span>Start Customization</span>
                  </Link>

                  <button
                    onClick={() => deleteInquiry(inquiry.id)}
                    className={styles.btnSecondary}
                    style={{ padding: "8px 10px", color: "#f87171", borderColor: "rgba(239, 68, 68, 0.25)" }}
                    title="Delete inquiry"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Category & Template Selector Controls */}
              <div
                style={{
                  display: "flex",
                  gap: "14px",
                  alignItems: "center",
                  background: "rgba(255, 255, 255, 0.02)",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  marginBottom: "12px",
                  flexWrap: "wrap"
                }}
              >
                {/* Category Dropdown */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--muted)", fontWeight: 600 }}>
                    Category:
                  </span>
                  <select
                    value={inquiry.category || "Wedding"}
                    disabled={updatingId === inquiry.id}
                    onChange={(e) => updateCategory(inquiry.id, e.target.value)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "6px",
                      background: "rgba(0, 0, 0, 0.4)",
                      border: "1px solid rgba(212, 175, 55, 0.3)",
                      color: "var(--gold)",
                      fontSize: "12px",
                      fontWeight: 500,
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
                        <option value="Wedding" style={{ background: "#111", color: "#fff" }}>Wedding</option>
                        <option value="Birthday" style={{ background: "#111", color: "#fff" }}>Birthday</option>
                        <option value="Baby Shower" style={{ background: "#111", color: "#fff" }}>Baby Shower</option>
                        <option value="Traditional" style={{ background: "#111", color: "#fff" }}>Traditional</option>
                        <option value="Corporate" style={{ background: "#111", color: "#fff" }}>Corporate</option>
                        <option value="Anniversary" style={{ background: "#111", color: "#fff" }}>Anniversary</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Template / Invitation Type Dropdown */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--muted)", fontWeight: 600 }}>
                    Template Design:
                  </span>
                  <select
                    value={inquiry.template_name || ""}
                    disabled={updatingId === inquiry.id}
                    onChange={(e) => updateTemplate(inquiry.id, e.target.value)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "6px",
                      background: "rgba(0, 0, 0, 0.4)",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      color: "#fff",
                      fontSize: "12px",
                      cursor: "pointer",
                      outline: "none",
                      maxWidth: "240px"
                    }}
                  >
                    <option value="" style={{ background: "#111" }}>-- Choose Template --</option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.title} style={{ background: "#111" }}>
                        {t.title} ({t.category})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Message Box */}
              <div
                style={{
                  background: "rgba(0, 0, 0, 0.35)",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  borderRadius: "10px",
                  padding: "16px 20px",
                }}
              >
                <div style={{ fontSize: "10.5px", textTransform: "uppercase", letterSpacing: "1px", color: "var(--gold)", fontWeight: 600, marginBottom: "6px" }}>
                  Client Message & Requirements:
                </div>
                <p style={{ margin: 0, fontSize: "13.5px", color: "rgba(255, 255, 255, 0.88)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                  {inquiry.message ? inquiry.message : <em style={{ color: "var(--muted)" }}>No specific requirements message provided. Client requested details for {inquiry.category || 'an invitation'}.</em>}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
