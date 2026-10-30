import { Zap, Smartphone, Infinity as InfinityIcon } from "lucide-react";
import styles from "./QuickSpecs.module.css";

const SPECS = [
  { icon: Zap, label: "Turnaround Time", value: "24 to 48 Hours" },
  { icon: Smartphone, label: "Compatibility", value: "100% Mobile & WhatsApp" },
  { icon: InfinityIcon, label: "Guest Limit", value: "Unlimited Sharing" },
];

export default function QuickSpecs({ className = "" }: { className?: string }) {
  return (
    <div className={`${styles.specsRow} ${className}`}>
      {SPECS.map(({ icon: Icon, label, value }) => (
        <div key={label} className={styles.specCard}>
          <span className={styles.specIcon} aria-hidden="true">
            <Icon size={18} strokeWidth={1.75} />
          </span>
          <div className={styles.specLabel}>{label}</div>
          <div className={styles.specValue}>{value}</div>
        </div>
      ))}
    </div>
  );
}
