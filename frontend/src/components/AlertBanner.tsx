type AlertBannerProps = {
  variant?: "error" | "success" | "info";
  children: React.ReactNode;
};

export default function AlertBanner({
  variant = "info",
  children,
}: AlertBannerProps) {
  const styles =
    variant === "error"
      ? "border-red-400/20 bg-red-500/10 text-red-300"
      : variant === "success"
      ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
      : "border-blue-400/20 bg-blue-500/10 text-blue-200";

  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm ${styles}`}>
      {children}
    </div>
  );
}