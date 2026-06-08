import { BottomNav } from "@/components/nav/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell bg-white">
      <div className="min-h-dvh pb-28">{children}</div>
      <BottomNav />
    </div>
  );
}
