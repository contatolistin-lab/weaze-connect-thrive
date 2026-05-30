import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { TopBar } from "./TopBar";
import { WhatsAppButton } from "./WhatsAppButton";

interface AppShellProps {
  children: ReactNode;
  title?: string;
  hideTopBar?: boolean;
  hideBottomNav?: boolean;
  fullBleed?: boolean;
  hideWhatsApp?: boolean;
}

export function AppShell({
  children,
  title,
  hideTopBar = false,
  hideBottomNav = false,
  fullBleed = false,
  hideWhatsApp = false,
}: AppShellProps) {
  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto max-w-md min-h-dvh bg-background relative flex flex-col">
        {!hideTopBar && <TopBar title={title} />}
        <main className={`flex-1 ${fullBleed ? "" : "pb-24"}`}>{children}</main>
        {!hideBottomNav && <BottomNav />}
        {!hideWhatsApp && <WhatsAppButton />}
      </div>
    </div>
  );
}
