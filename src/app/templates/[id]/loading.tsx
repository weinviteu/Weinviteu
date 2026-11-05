import styles from "./template-detail.module.css";

export default function TemplateDetailLoading() {
  return (
    <main className={styles.detailPage} style={{ minHeight: "100vh" }} aria-busy="true">
      <div className={styles.container}>
        <div style={{ padding: "40px 20px", display: "flex", flexDirection: "column", gap: "24px", maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ width: "160px", height: "16px", background: "rgba(255,255,255,0.06)", borderRadius: "6px" }} />
          <div style={{ width: "320px", height: "36px", background: "rgba(212,175,55,0.12)", borderRadius: "8px" }} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "32px", marginTop: "20px" }}>
            <div style={{ height: "600px", background: "rgba(255,255,255,0.03)", borderRadius: "24px", border: "1px solid rgba(212,175,55,0.1)" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ height: "40px", width: "70%", background: "rgba(255,255,255,0.06)", borderRadius: "8px" }} />
              <div style={{ height: "80px", width: "100%", background: "rgba(255,255,255,0.04)", borderRadius: "12px" }} />
              <div style={{ height: "180px", width: "100%", background: "rgba(212,175,55,0.05)", borderRadius: "16px" }} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

