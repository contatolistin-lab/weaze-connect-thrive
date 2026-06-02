import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Bell, Share2, Users, Calendar } from "lucide-react";
import { BottomNav } from "@/components/weaze/BottomNav";
import { WButton } from "@/components/weaze/WButton";
import { communities, posts } from "@/lib/mock-data";
import { useState } from "react";

export const Route = createFileRoute("/communities/$id")({
  head: () => ({ meta: [{ title: "Comunidade — WEAZE" }] }),
  component: CommunityDetail,
});

function CommunityDetail() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const c = communities.find((x) => x.id === id);
  if (!c) {
    return (
      <div className="min-h-dvh bg-background grid place-items-center px-6 text-center">
        <div className="max-w-sm space-y-3">
          <h1 className="text-xl font-extrabold">Comunidade não encontrada</h1>
          <p className="text-sm text-foreground/60">Essa comunidade não existe ou foi removida.</p>
          <button
            onClick={() => nav({ to: "/communities" })}
            className="h-10 px-4 rounded-xl bg-brand-gradient text-white text-sm font-bold shadow-brand"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }
  const [joined, setJoined] = useState(false);
  const cPosts = posts.filter((p) => p.community.id === c.id);

  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto max-w-md min-h-dvh bg-background relative pb-24">
        <div className={`relative h-44 bg-gradient-to-br ${c.color}`}>
          <button
            onClick={() => nav({ to: "/communities" })}
            className="absolute top-3 left-3 h-9 w-9 grid place-items-center rounded-full bg-black/30 backdrop-blur text-white"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="absolute top-3 right-3 flex gap-2">
            <button className="h-9 w-9 grid place-items-center rounded-full bg-black/30 backdrop-blur text-white">
              <Bell size={16} />
            </button>
            <button className="h-9 w-9 grid place-items-center rounded-full bg-black/30 backdrop-blur text-white">
              <Share2 size={16} />
            </button>
          </div>
          <div className="absolute -bottom-10 left-4 h-20 w-20 rounded-3xl bg-white shadow-soft grid place-items-center text-4xl border-4 border-white">
            {c.cover}
          </div>
        </div>

        <div className="pt-12 px-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-extrabold tracking-tight flex items-center gap-1">
                {c.name}
                {c.verified && (
                  <span className="h-4 w-4 rounded-full bg-[#d81e62] grid place-items-center text-[10px] text-white">
                    ✓
                  </span>
                )}
              </h1>
              <p className="text-sm text-foreground/60">{c.handle}</p>
            </div>
            <WButton
              variant={joined ? "outline" : "gradient"}
              size="sm"
              onClick={() => setJoined((v) => !v)}
            >
              {joined ? "Membro" : "Entrar"}
            </WButton>
          </div>
          <p className="mt-3 text-sm text-foreground/80">{c.description}</p>
          <div className="mt-3 flex items-center gap-4 text-xs text-foreground/60">
            <span className="inline-flex items-center gap-1">
              <Users size={14} /> {(c.members / 1000).toFixed(0)}k membros
            </span>
            <span className="inline-flex items-center gap-1">
              <Calendar size={14} /> desde 2024
            </span>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs">
            {["Posts", "Grupos", "Lives"].map((t, i) => (
              <button
                key={t}
                className={`py-2.5 rounded-2xl font-semibold ${i === 0 ? "bg-brand-gradient text-white" : "bg-muted text-foreground/70"}`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-3 gap-1">
            {[...cPosts, ...posts].slice(0, 9).map((p, i) => (
              <Link
                key={p.id + i}
                to="/feed"
                className={`aspect-[9/14] rounded-xl bg-gradient-to-br ${p.mediaColor} grid place-items-center text-4xl shadow-soft`}
              >
                {p.emoji}
              </Link>
            ))}
          </div>
        </div>

        <BottomNav />
      </div>
    </div>
  );
}
