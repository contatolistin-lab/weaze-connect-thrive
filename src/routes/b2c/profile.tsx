import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LogOut, User, Mail, Camera } from "lucide-react";
import { useCommunity } from "@/lib/community-store";
import { AppShell } from "@/components/weaze/AppShell";
import { Avatar } from "@/components/weaze/Avatar";
import { WButton } from "@/components/weaze/WButton";
import { useState, useEffect, useRef } from "react";

export const Route = createFileRoute("/b2c/profile")({
  head: () => ({ meta: [{ title: "Meu Perfil — WEAZE" }] }),
  component: B2CProfile,
});

function B2CProfile() {
  const nav = useNavigate();
  const { auth, userType, community, profileAvatar, setProfileAvatar } = useCommunity();
  const fileRef = useRef<HTMLInputElement>(null);

  const [avatar, setAvatar] = useState<string | undefined>(profileAvatar);

  useEffect(() => {
    setAvatar(profileAvatar);
  }, [profileAvatar]);

  function compressImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement("canvas");
        const maxSize = 64;
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          const ratio = Math.min(maxSize / width, maxSize / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        c.width = width;
        c.height = height;
        const ctx = c.getContext("2d")!;
        ctx.drawImage(img, 0, 0, width, height);
        resolve(c.toDataURL("image/jpeg", 0.4));
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await compressImage(file);
    setAvatar(dataUrl);
    setProfileAvatar(dataUrl);
  };

  const headerSection = (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="relative shrink-0 group"
      >
        <Avatar name={auth.user?.name || "U"} size={64} src={avatar} />
        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
          <Camera size={20} className="text-white" />
        </span>
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarChange}
      />
      <div className="flex-1 min-w-0">
        <h1 className="text-lg font-extrabold tracking-tight truncate">
          {auth.user?.name || "Usuário"}
        </h1>
        <p className="text-sm text-foreground/60 truncate">{auth.user?.email || ""}</p>
      </div>
    </div>
  );

  const accountDataSection = (
    <div className="rounded-2xl bg-white border border-border p-5 shadow-soft space-y-4">
      <h2 className="text-sm font-extrabold tracking-tight">Dados da conta</h2>
      <div className="flex items-center gap-3">
        <User size={18} className="text-foreground/40 shrink-0" />
        <span className="text-sm">{auth.user?.name || "—"}</span>
      </div>
      <div className="flex items-center gap-3">
        <Mail size={18} className="text-foreground/40 shrink-0" />
        <span className="text-sm">{auth.user?.email || "—"}</span>
      </div>
    </div>
  );

  const accountSection = (
    <section className="rounded-2xl bg-white border border-border p-5 shadow-soft">
      <h2 className="text-sm font-extrabold tracking-tight mb-4">Conta</h2>
      <button
        onClick={() => {
          auth.logout();
          userType.setB2B(false);
          nav({ to: "/" });
        }}
        className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-2xl bg-[#8800aa] text-white border border-border font-bold hover:bg-muted transition-colors"
      >
        <LogOut size={18} /> Sair
      </button>
    </section>
  );

  return (
    <>
      {/* Mobile layout */}
      <div className="md:hidden">
        <AppShell title="Meu Perfil">
          <div className="px-4 pt-4 pb-24 space-y-6">
            {headerSection}
            {accountDataSection}
            {accountSection}
          </div>
        </AppShell>
      </div>

      {/* Tablet / Desktop layout */}
      <div className="hidden md:block min-h-dvh bg-surface-muted">
        <div className="mx-auto max-w-7xl flex gap-5 p-4 lg:p-6 min-h-dvh">
          <div className="flex-1 space-y-6 overflow-y-auto scrollbar-brand pb-6">
            {headerSection}
            <div className="max-w-3xl">{accountDataSection}</div>
          </div>
          <div className="w-80 xl:w-96 shrink-0 overflow-y-auto scrollbar-brand pb-6">
            {accountSection}
          </div>
        </div>
      </div>
    </>
  );
}
