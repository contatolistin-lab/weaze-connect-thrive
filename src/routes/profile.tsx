import { createFileRoute, Link } from "@tanstack/react-router";
import { Settings, Grid3x3, Heart, Users } from "lucide-react";
import { AppShell } from "@/components/weaze/AppShell";
import { WButton } from "@/components/weaze/WButton";
import { Avatar } from "@/components/weaze/Avatar";
import { communities, posts } from "@/lib/mock-data";
import { useState } from "react";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Perfil — WEAZE" }] }),
  component: Profile,
});

function Profile() {
  const [tab, setTab] = useState<"posts" | "likes" | "communities">("posts");
  return (
    <AppShell title="Perfil">
      <div className="px-4 pt-4">
        <div className="flex items-center gap-4">
          <Avatar name="Você" size={72} ring />
          <div className="flex-1">
            <h1 className="text-lg font-extrabold tracking-tight">Você</h1>
            <p className="text-sm text-foreground/60">@voce</p>
          </div>
          <Link to="/settings" className="h-10 w-10 grid place-items-center rounded-full bg-muted">
            <Settings size={18} />
          </Link>
        </div>

        <p className="mt-3 text-sm text-foreground/80">
          Apaixonado por corrida, vinil e tecnologia. ✨
        </p>

        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          {[
            { n: "128", l: "Seguindo" },
            { n: "1.2k", l: "Seguidores" },
            { n: "24", l: "Comunidades" },
          ].map((s) => (
            <div key={s.l} className="rounded-2xl bg-white border border-border p-3">
              <p className="font-extrabold text-base">{s.n}</p>
              <p className="text-[11px] text-foreground/60">{s.l}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          <WButton variant="gradient" size="md" fullWidth>
            Editar perfil
          </WButton>
          <WButton variant="outline" size="md">
            Compartilhar
          </WButton>
        </div>

        <div className="mt-5 flex justify-around border-b border-border">
          {[
            { k: "posts", icon: Grid3x3 },
            { k: "likes", icon: Heart },
            { k: "communities", icon: Users },
          ].map(({ k, icon: I }) => (
            <button
              key={k}
              onClick={() => setTab(k as any)}
              className={`flex-1 py-3 grid place-items-center border-b-2 ${
                tab === k
                  ? "border-[#d81e62] text-[#d81e62]"
                  : "border-transparent text-foreground/40"
              }`}
            >
              <I size={20} />
            </button>
          ))}
        </div>

        {tab === "posts" && (
          <div className="grid grid-cols-3 gap-1 mt-2">
            {[...posts, ...posts].slice(0, 9).map((p, i) => (
              <div
                key={i}
                className={`aspect-[9/14] rounded-lg bg-gradient-to-br ${p.mediaColor} grid place-items-center text-3xl`}
              >
                {p.emoji}
              </div>
            ))}
          </div>
        )}
        {tab === "likes" && (
          <div className="grid grid-cols-3 gap-1 mt-2">
            {posts.slice(0, 6).map((p, i) => (
              <div
                key={i}
                className={`aspect-[9/14] rounded-lg bg-gradient-to-br ${p.mediaColor} grid place-items-center text-3xl`}
              >
                {p.emoji}
              </div>
            ))}
          </div>
        )}
        {tab === "communities" && (
          <div className="mt-3 space-y-2">
            {communities.slice(0, 5).map((c) => (
              <Link
                key={c.id}
                to="/communities/$id"
                params={{ id: c.id }}
                className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-border"
              >
                <span
                  className={`h-11 w-11 rounded-xl bg-gradient-to-br ${c.color} grid place-items-center text-xl`}
                >
                  {c.cover}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{c.name}</p>
                  <p className="text-[11px] text-foreground/60">
                    {(c.members / 1000).toFixed(0)}k membros
                  </p>
                </div>
                <WButton variant="outline" size="sm">
                  Membro
                </WButton>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
