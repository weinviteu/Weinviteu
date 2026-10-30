import type { CSSProperties } from "react";

interface WhatsAppIconProps {
  size?: number;
  className?: string;
  color?: string;
  style?: CSSProperties;
}

/** WhatsApp mark: green disc, white chat outline and telephone handset. */
export default function WhatsAppIcon({ size = 20, className = "", color, style = {} }: WhatsAppIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      className={className}
      style={{ flexShrink: 0, display: "inline-block", verticalAlign: "middle", ...style }}
    >
      <circle cx="12" cy="12" r="12" fill={color && color !== "currentColor" ? color : "#25D366"} />
      <path
        d="M12 3.5a8.5 8.5 0 0 0-7.36 12.75L3.5 20.5l4.35-1.14A8.5 8.5 0 1 0 12 3.5Z"
        fill="none"
        stroke="#fff"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path fill="#fff" d="M17.52 14.37c-.29-.15-1.72-.85-1.99-.95-.27-.1-.46-.15-.65.15-.19.3-.75.95-.92 1.14-.17.19-.34.22-.63.07-.29-.15-1.23-.45-2.34-1.44-.86-.77-1.45-1.72-1.62-2.01-.17-.29-.02-.45.13-.59.13-.13.29-.34.43-.51.14-.17.19-.29.29-.48.1-.19.05-.36-.02-.51-.07-.15-.65-1.57-.89-2.15-.24-.56-.48-.49-.65-.5-.17-.01-.36-.01-.56-.01-.19 0-.51.07-.77.36-.26.29-1.01.99-1.01 2.42 0 1.43 1.04 2.81 1.18 3 .15.19 2.05 3.13 4.96 4.39.69.3 1.23.48 1.65.61.7.22 1.33.19 1.83.11.56-.08 1.72-.7 1.96-1.38.24-.68.24-1.26.17-1.38-.07-.12-.27-.19-.56-.34z" />
    </svg>
  );
}
