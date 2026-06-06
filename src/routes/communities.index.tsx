import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageSquare } from "lucide-react";
import { AppShell } from "@/components/weaze/AppShell";

export const Route = createFileRoute("/communities/")({
  head: () => ({ meta: [{ title: "Comunidades — WEAZE" }] }),
  component: CommunitiesRedirect,
});

function CommunitiesRedirect() {
  return (
    <AppShell title="Comunidades">
      <div className="px-4 pt-20 text-center">
        <div className="rounded-3xl bg-brand-gradient text-white p-8 shadow-brand">
          <span className="inline-grid h-16 w-16 place-items-center rounded-2xl bg-white/20 text-white">
            <MessageSquare size={32} />
          </span>
          <h2 className="mt-4 text-2xl font-extrabold">Conversas da comunidade</h2>
          <p className="mt-2 text-sm opacity-90">
            As comunidades agora estão organizadas como conversas no fórum.
          </p>
          <div className="mt-6">
            <Link
              to="/conversas"
              className="inline-flex items-center justify-center h-12 px-8 rounded-2xl bg-white text-[#000000] font-bold shadow-soft"
            >
              Ir para Conversas
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
