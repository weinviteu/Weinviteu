import styles from "./templates.module.css";

export default function TemplatesCatalogueSkeleton() {
  return (
    <div className={styles.skeletonContainer} aria-busy="true" aria-label="Loading invitation templates">
      {/* Category pills row skeleton */}
      <div className={styles.categoryBar}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={`${styles.categoryPill} ${styles.skeletonPill}`} />
        ))}
      </div>

      {/* Tier panel skeleton */}
      <div className={styles.tierPanel}>
        <div className={styles.tierPanelHead}>
          <span className={styles.tierPanelLabel}>Choose your collection</span>
        </div>
        <div className={styles.tierCards}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={`${styles.tierCard} ${styles.skeletonTierCard}`} />
          ))}
        </div>
      </div>

      <p className={styles.templatesCount}>LOADING COLLECTION…</p>

      {/* Templates grid skeleton: 6 phone mockup cards */}
      <div className={styles.templatesGrid}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={styles.skeletonCard}>
            <div className={styles.skeletonPhone} />
            <div className={styles.skeletonTextRow}>
              <div className={styles.skeletonTextTitle} />
              <div className={styles.skeletonTextPrice} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

