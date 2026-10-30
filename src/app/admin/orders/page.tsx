"use client";

import { useState, useEffect } from "react";
import styles from "../admin.module.css";
import Link from "next/link";
import {
  Edit,
  History,
  ExternalLink,
  Search,
  CheckCircle,
  Copy,
  Check,
  Send,
  Wand2,
  Clock,
  Layers,
  ArrowRight,
  Mail,
  AlertCircle
} from "lucide-react";
import { api, errorMessage, jsonBody } from "@/lib/client-api";
import type { Order } from "@/lib/models";
import { inviteUrlPath } from "@/lib/slug";

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState<"all" | "drafts" | "delivered" | "completed">("all");
  const [orders, setOrders] = useState<Order[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    api<Order[]>('/api/admin/orders')
      .then((data) => {
        // Orders are actual customized invitation projects with a template or active customization state
        const savedOrders = data.filter(
          (o) => o.published_file || o.template_filename || (o.status !== "New Inquiry" && o.status !== "Contacted")
        );
        setOrders(savedOrders);
        setQuery(new URLSearchParams(window.location.search).get("q") || "");
      })
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  async function updateStatus(id: string, status: string) {
    setPending(true);
    try {
      await api('/api/admin/orders', { ...jsonBody({ id, status }), method: "PATCH" });
      setOrders((previous) => previous.map((o) => (o.id === id ? { ...o, status } : o)));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setPending(false);
    }
  }

  async function sendEmail(order: Order) {
    const resend = Boolean(order.email_sent_count);
    if (resend && !confirm(`Send the invitation to ${order.email} again?`)) return;
    setSendingId(order.id);
    setError("");
    setNotice("");
    try {
      const tracking = await api<Partial<Order>>("/api/send-email", jsonBody({ orderId: order.id }));
      setOrders((previous) => previous.map((o) => (o.id === order.id ? { ...o, ...tracking } : o)));
      setNotice(`Invitation ${resend ? "re-sent" : "sent"} to ${order.email}.`);
    } catch (e) {
      const reason = errorMessage(e);
      setOrders((previous) => previous.map((o) => (o.id === order.id ? { ...o, last_email_error: reason } : o)));
      setError(reason);
    } finally {
      setSendingId(null);
    }
  }

  const copyInviteLink = (order: Order) => {
    const url = `${window.location.origin}${inviteUrlPath(order)}`;
    navigator.clipboard.writeText(url);
    setCopiedId(order.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Customizing":
      case "Draft Saved":
        return {
          label: "Draft Saved · Not Sent",
          badgeClass: `${styles.statusBadge} ${styles.statusActive}`,
        };
      case "Link Delivered":
        return {
          label: "Link Sent / Delivered",
          badgeClass: `${styles.statusBadge} ${styles.statusSent}`,
        };
      case "Completed":
        return {
          label: "Completed",
          badgeClass: `${styles.statusBadge} ${styles.statusCompleted}`,
        };
      default:
        return {
          label: status,
          badgeClass: styles.statusBadge,
        };
    }
  };

  const draftOrders = orders.filter((o) => o.status === "Customizing" || o.status === "Draft Saved");
  const deliveredOrders = orders.filter((o) => o.status === "Link Delivered");
  const completedOrders = orders.filter((o) => o.status === "Completed");

  const filteredOrders = orders
    .filter((o) => {
      if (activeTab === "drafts") return o.status === "Customizing" || o.status === "Draft Saved";
      if (activeTab === "delivered") return o.status === "Link Delivered";
      if (activeTab === "completed") return o.status === "Completed";
      return true;
    })
    .filter((o) =>
      `${o.client_name} ${o.email} ${o.template_name} ${o.slug ?? ""} ${o.id}`.toLowerCase().includes(query.toLowerCase())
    );

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h2>Invitation Orders & Drafts</h2>
          <p>Track customized 3D invitations, saved client drafts, and delivery links sent to guests.</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <Link href="/admin/inquiries" className={styles.btnSecondary}>
            View Client Inquiries <ArrowRight size={13} />
          </Link>
          <Link href="/admin/customize" className={styles.btnPrimary}>
            <Wand2 size={14} /> New Customization
          </Link>
        </div>
      </div>

      {error && (
        <div role="alert" className={styles.editorMessage}>
          {error}
        </div>
      )}
      {notice && (
        <div role="status" className={styles.editorMessage}>
          {notice}
        </div>
      )}

      {/* Search and Filters Bar */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "24px", alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "1 1 300px" }}>
          <Search size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.35)", pointerEvents: "none" }} />
          <input
            aria-label="Search orders"
            placeholder="Search orders by client name, email, or template…"
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
      </div>

      <div className={styles.card} style={{ padding: 0, overflow: "hidden" }}>
        {/* Status Pipeline Tabs */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
            background: "rgba(0, 0, 0, 0.25)",
            padding: "8px 14px",
            gap: "8px",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() => setActiveTab("all")}
            style={{
              padding: "9px 16px",
              background: activeTab === "all" ? "rgba(212, 175, 55, 0.12)" : "transparent",
              border: activeTab === "all" ? "1px solid rgba(212, 175, 55, 0.3)" : "1px solid transparent",
              borderRadius: "8px",
              cursor: "pointer",
              color: activeTab === "all" ? "#fce7b2" : "var(--muted)",
              fontWeight: activeTab === "all" ? 600 : 500,
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "12.5px",
              transition: "all 0.2s ease",
            }}
          >
            <Layers size={14} color={activeTab === "all" ? "var(--gold)" : "currentColor"} />
            <span>All Projects</span>
            <span style={{ padding: "2px 7px", borderRadius: "999px", fontSize: "10px", background: activeTab === "all" ? "var(--gold)" : "rgba(255,255,255,0.08)", color: activeTab === "all" ? "#0b0903" : "#aaa", fontWeight: 700 }}>
              {orders.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("drafts")}
            style={{
              padding: "9px 16px",
              background: activeTab === "drafts" ? "rgba(212, 175, 55, 0.12)" : "transparent",
              border: activeTab === "drafts" ? "1px solid rgba(212, 175, 55, 0.3)" : "1px solid transparent",
              borderRadius: "8px",
              cursor: "pointer",
              color: activeTab === "drafts" ? "#fce7b2" : "var(--muted)",
              fontWeight: activeTab === "drafts" ? 600 : 500,
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "12.5px",
              transition: "all 0.2s ease",
            }}
          >
            <Clock size={14} color={activeTab === "drafts" ? "var(--gold)" : "currentColor"} />
            <span>Drafts (Saved, Not Sent)</span>
            <span style={{ padding: "2px 7px", borderRadius: "999px", fontSize: "10px", background: activeTab === "drafts" ? "var(--gold)" : "rgba(255,255,255,0.08)", color: activeTab === "drafts" ? "#0b0903" : "#aaa", fontWeight: 700 }}>
              {draftOrders.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("delivered")}
            style={{
              padding: "9px 16px",
              background: activeTab === "delivered" ? "rgba(212, 175, 55, 0.12)" : "transparent",
              border: activeTab === "delivered" ? "1px solid rgba(212, 175, 55, 0.3)" : "1px solid transparent",
              borderRadius: "8px",
              cursor: "pointer",
              color: activeTab === "delivered" ? "#fce7b2" : "var(--muted)",
              fontWeight: activeTab === "delivered" ? 600 : 500,
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "12.5px",
              transition: "all 0.2s ease",
            }}
          >
            <Send size={14} color={activeTab === "delivered" ? "var(--gold)" : "currentColor"} />
            <span>Link Delivered</span>
            <span style={{ padding: "2px 7px", borderRadius: "999px", fontSize: "10px", background: activeTab === "delivered" ? "var(--gold)" : "rgba(255,255,255,0.08)", color: activeTab === "delivered" ? "#0b0903" : "#aaa", fontWeight: 700 }}>
              {deliveredOrders.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("completed")}
            style={{
              padding: "9px 16px",
              background: activeTab === "completed" ? "rgba(212, 175, 55, 0.12)" : "transparent",
              border: activeTab === "completed" ? "1px solid rgba(212, 175, 55, 0.3)" : "1px solid transparent",
              borderRadius: "8px",
              cursor: "pointer",
              color: activeTab === "completed" ? "#fce7b2" : "var(--muted)",
              fontWeight: activeTab === "completed" ? 600 : 500,
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "12.5px",
              transition: "all 0.2s ease",
            }}
          >
            <History size={14} color={activeTab === "completed" ? "var(--gold)" : "currentColor"} />
            <span>Completed</span>
            <span style={{ padding: "2px 7px", borderRadius: "999px", fontSize: "10px", background: activeTab === "completed" ? "var(--gold)" : "rgba(255,255,255,0.08)", color: activeTab === "completed" ? "#0b0903" : "#aaa", fontWeight: 700 }}>
              {completedOrders.length}
            </span>
          </button>
        </div>

        {/* Desktop / Tablet Table View */}
        <div className={styles.tableResponsive}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Client</th>
                <th>Template Chosen</th>
                <th>Delivery Status</th>
                <th>Invitation Link</th>
                <th>Last Updated</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "50px 20px" }}>
                    <p style={{ color: "var(--muted)", margin: 0 }}>
                      {loading
                        ? "Loading orders from database…"
                        : "No saved invitation orders found in this category. Customize a template to create your first order."}
                    </p>
                  </td>
                </tr>
              )}
              {filteredOrders.map((o) => {
                const statusMeta = getStatusBadge(o.status);
                const isDelivered = o.status === "Link Delivered";
                const isCompleted = o.status === "Completed";

                return (
                  <tr key={o.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div
                          style={{
                            width: "34px",
                            height: "34px",
                            borderRadius: "50%",
                            background: "rgba(212, 175, 55, 0.12)",
                            border: "1px solid rgba(212, 175, 55, 0.25)",
                            color: "var(--gold)",
                            display: "grid",
                            placeItems: "center",
                            fontWeight: 600,
                            fontSize: "13px",
                            flexShrink: 0,
                          }}
                        >
                          {o.client_name ? o.client_name.charAt(0).toUpperCase() : "C"}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontWeight: 600, color: "#fff" }}>{o.client_name}</span>
                          <span style={{ fontSize: "11px", color: "var(--muted)" }}>{o.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ color: "#fce7b2", fontWeight: 500 }}>
                        {o.template_name || "Custom Template"}
                      </span>
                    </td>
                    <td>
                      <span className={statusMeta.badgeClass}>
                        {statusMeta.label}
                      </span>
                      {o.email_sent_at && (
                        <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "6px" }}>
                          <Mail size={11} style={{ verticalAlign: "-1px" }} /> Emailed {formatDateTime(o.email_sent_at)}
                          {(o.email_sent_count ?? 0) > 1 && ` · ${o.email_sent_count}×`}
                          {o.email_sent_to && o.email_sent_to !== o.email && ` to ${o.email_sent_to}`}
                        </div>
                      )}
                      {o.last_email_error && (
                        <div style={{ fontSize: "11px", color: "#f87171", marginTop: "6px" }} title={o.last_email_error}>
                          <AlertCircle size={11} style={{ verticalAlign: "-1px" }} /> Last send failed
                        </div>
                      )}
                    </td>
                    <td>
                      {o.published_file ? (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "6px" }}>
                          <code style={{ fontSize: "11px", color: "var(--muted)" }}>{inviteUrlPath(o)}</code>
                          <button
                            onClick={() => copyInviteLink(o)}
                            className={styles.btnSecondary}
                            style={{ padding: "5px 10px", fontSize: "11px" }}
                            title="Copy link to clipboard"
                          >
                            {copiedId === o.id ? (
                              <>
                                <Check size={12} color="#34d399" />
                                <span style={{ color: "#34d399" }}>Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy size={12} />
                                <span>Copy Link</span>
                              </>
                            )}
                          </button>
                        </div>
                      ) : (
                        <span style={{ color: "var(--muted)", fontSize: "12px", fontStyle: "italic" }}>
                          Draft not published yet
                        </span>
                      )}
                    </td>
                    <td>
                      <span style={{ color: "var(--muted)", fontSize: "12px" }}>
                        {new Date(o.updated_at || o.created_at).toLocaleDateString('en-IN', {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "8px", alignItems: "center" }}>
                        <Link
                          href={`/admin/customize?order=${o.id}`}
                          className={styles.btnSecondary}
                          style={{ padding: "6px 12px", fontSize: "11px" }}
                        >
                          <Edit size={12} /> Edit
                        </Link>

                        {o.published_file && (
                          <a
                            href={inviteUrlPath(o)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.btnPrimary}
                            style={{ padding: "6px 12px", fontSize: "11px" }}
                          >
                            <ExternalLink size={12} /> Live
                          </a>
                        )}

                        {o.published_file && (
                          <button
                            disabled={pending || sendingId !== null}
                            className={o.email_sent_count ? styles.btnSecondary : styles.btnPrimary}
                            onClick={() => sendEmail(o)}
                            style={{ padding: "6px 12px", fontSize: "11px" }}
                            title={`Email the invitation link to ${o.email}`}
                          >
                            <Mail size={12} />{" "}
                            {sendingId === o.id ? "Sending…" : o.email_sent_count ? "Resend" : "Send Email"}
                          </button>
                        )}

                        {!isDelivered && !isCompleted && o.published_file && (
                          <button
                            disabled={pending}
                            className={styles.btnSecondary}
                            onClick={() => updateStatus(o.id, "Link Delivered")}
                            style={{ padding: "6px 12px", fontSize: "11px" }}
                            title="Mark as sent if you shared the link yourself (e.g. WhatsApp)"
                          >
                            <Send size={12} /> Mark Sent
                          </button>
                        )}

                        {!isCompleted && (
                          <button
                            disabled={pending}
                            className={styles.btnSecondary}
                            onClick={() => updateStatus(o.id, "Completed")}
                            style={{ padding: "6px 12px", fontSize: "11px" }}
                            title="Mark order as completed"
                          >
                            <CheckCircle size={12} /> Finish
                          </button>
                        )}
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
          {filteredOrders.length === 0 && (
            <div style={{ textAlign: "center", padding: "30px 16px", color: "var(--muted)" }}>
              {loading
                ? "Loading orders from database…"
                : "No saved invitation orders found in this category. Customize a template to create your first order."}
            </div>
          )}
          {filteredOrders.map((o) => {
            const statusMeta = getStatusBadge(o.status);
            const isDelivered = o.status === "Link Delivered";
            const isCompleted = o.status === "Completed";

            return (
              <div key={o.id} className={styles.mobileCardItem}>
                <div className={styles.mobileCardTop}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div
                      style={{
                        width: "34px",
                        height: "34px",
                        borderRadius: "50%",
                        background: "rgba(212, 175, 55, 0.12)",
                        border: "1px solid rgba(212, 175, 55, 0.25)",
                        color: "var(--gold)",
                        display: "grid",
                        placeItems: "center",
                        fontWeight: 600,
                        fontSize: "13px",
                        flexShrink: 0,
                      }}
                    >
                      {o.client_name ? o.client_name.charAt(0).toUpperCase() : "C"}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontWeight: 600, color: "#fff", fontSize: "14px" }}>{o.client_name}</span>
                      <span style={{ fontSize: "11px", color: "var(--muted)" }}>{o.email}</span>
                    </div>
                  </div>
                  <span className={statusMeta.badgeClass} style={{ fontSize: "10px", padding: "3px 8px" }}>
                    {statusMeta.label}
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "8px 0" }}>
                  <div>
                    <span style={{ color: "var(--muted)", fontSize: "11px" }}>Template: </span>
                    <span style={{ color: "#fce7b2", fontWeight: 500 }}>{o.template_name || "Custom Template"}</span>
                  </div>
                  <span style={{ color: "var(--muted)", fontSize: "11px" }}>
                    {new Date(o.updated_at || o.created_at).toLocaleDateString('en-IN', {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>

                {o.published_file && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", background: "rgba(0,0,0,0.25)", padding: "8px 10px", borderRadius: "8px" }}>
                    <code style={{ fontSize: "11px", color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "180px" }}>{inviteUrlPath(o)}</code>
                    <button
                      onClick={() => copyInviteLink(o)}
                      className={styles.btnSecondary}
                      style={{ padding: "4px 8px", fontSize: "10.5px", flexShrink: 0 }}
                    >
                      {copiedId === o.id ? (
                        <>
                          <Check size={11} color="#34d399" />
                          <span style={{ color: "#34d399" }}>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={11} />
                          <span>Copy Link</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "4px" }}>
                  <Link
                    href={`/admin/customize?order=${o.id}`}
                    className={styles.btnSecondary}
                    style={{ padding: "6px 10px", fontSize: "11px", flex: "1 1 auto", justifyContent: "center" }}
                  >
                    <Edit size={12} /> Edit
                  </Link>

                  {o.published_file && (
                    <a
                      href={inviteUrlPath(o)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.btnPrimary}
                      style={{ padding: "6px 10px", fontSize: "11px", flex: "1 1 auto", justifyContent: "center" }}
                    >
                      <ExternalLink size={12} /> Live
                    </a>
                  )}

                  {o.published_file && (
                    <button
                      disabled={pending || sendingId !== null}
                      className={o.email_sent_count ? styles.btnSecondary : styles.btnPrimary}
                      onClick={() => sendEmail(o)}
                      style={{ padding: "6px 10px", fontSize: "11px", flex: "1 1 auto", justifyContent: "center" }}
                    >
                      <Mail size={12} />{" "}
                      {sendingId === o.id ? "Sending…" : o.email_sent_count ? "Resend" : "Send Email"}
                    </button>
                  )}

                  {!isDelivered && !isCompleted && o.published_file && (
                    <button
                      disabled={pending}
                      className={styles.btnSecondary}
                      onClick={() => updateStatus(o.id, "Link Delivered")}
                      style={{ padding: "6px 10px", fontSize: "11px", flex: "1 1 auto", justifyContent: "center" }}
                    >
                      <Send size={12} /> Mark Sent
                    </button>
                  )}

                  {!isCompleted && (
                    <button
                      disabled={pending}
                      className={styles.btnSecondary}
                      onClick={() => updateStatus(o.id, "Completed")}
                      style={{ padding: "6px 10px", fontSize: "11px", flex: "1 1 auto", justifyContent: "center" }}
                    >
                      <CheckCircle size={12} /> Finish
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
