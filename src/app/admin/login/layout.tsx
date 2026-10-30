export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Login page uses its own layout — no sidebar
  return <>{children}</>;
}
