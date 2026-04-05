import { Outlet } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";

export function Layout() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col font-body pb-[calc(7rem+env(safe-area-inset-bottom,0px))]">
      <Outlet />
      <BottomNav />
    </div>
  );
}
