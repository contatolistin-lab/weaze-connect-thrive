import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { TopBar } from "./TopBar";

interface AppShellProps {
  children: ReactNode;
  title?: string;
  hideTopBar?: boolean;
  hideBottomNav?: boolean;
  fullBleed?: boolean;
}

export function AppShell({
  children,
  title,
  hideTopBar = false,
  hideBottomNav = false,
  fullBleed = false,
}: AppShellProps) {
  return (
    <div className="min-h-dvh bg-background md:bg-surface-muted">
      <div className="mx-auto max-w-md min-h-dvh bg-background relative flex flex-col md:shadow-soft md:border-x md:border-border">
        {!hideTopBar && <TopBar title={title} />}
        <main className={`flex-1 ${fullBleed ? "" : "pb-24 md:pb-8"}`}>{children}</main>
        {!hideBottomNav && <BottomNav />}
      </div>
    </div>
  );
}
