import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LogOut, Share2, Camera } from "lucide-react";
import { AppShell } from "@/components/weaze/AppShell";
import { WButton } from "@/components/weaze/WButton";
import { Avatar } from "@/components/weaze/Avatar";
import { useState, useEffect, useRef } from "react";
import { useCommunity, communityEmail } from "@/lib/community-store";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Painel da Comunidade — WEAZE" }] }),
  component: Profile,
});

function Profile() {
  const { community, updateCommunity, userType } = useCommunity();
  const nav = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!userType.isB2B) {
      nav({ to: "/b2c/profile" });
    }
  }, [userType.isB2B]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      updateCommunity({ avatar: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const [form, setForm] = useState({
    name: community.name,
    description: community.description,
    phone: community.phone,
    city: community.city,
    state: community.state,
    country: community.country,
  });

  const [whatsapp, setWhatsapp] = useState(community.whatsapp);

  const handleSaveCommunity = () => {
    updateCommunity(form);
  };

  const handleSaveWhatsapp = () => {
    updateCommunity({ whatsapp });
  };

  const communitySlug = community.name.trim().toLowerCase().replace(/\s+/g, "-") || "minha-comunidade";
  const [origin, setOrigin] = useState("");
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);
  const communityLink = `${origin}/c/${communitySlug}?name=${encodeURIComponent(community.name.trim())}&desc=${encodeURIComponent(community.description)}`;

  useEffect(() => {
    try {
      const raw = localStorage.getItem("weaze_community_invites");
      const map = raw ? JSON.parse(raw) : {};
      map[communitySlug] = { name: community.name, description: community.description };
      localStorage.setItem("weaze_community_invites", JSON.stringify(map));
    } catch {
      /* silent */
    }
  }, [community.name, community.description, communitySlug]);

  return (
    <AppShell title="Painel da Comunidade">
      <div className="px-4 pt-4 pb-24 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="relative shrink-0 group"
          >
            <Avatar name={community.name || "C"} size={72} ring src={community.avatar} />
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera size={22} className="text-white" />
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
              {community.name || "Minha Comunidade"}
            </h1>
            <p className="text-sm text-foreground/60 truncate">{communityEmail}</p>
          </div>
        </div>

        {/* Dados da Comunidade */}
        <section className="rounded-2xl bg-white border border-border p-5 shadow-soft">
          <h2 className="text-sm font-extrabold tracking-tight mb-4">Dados da Comunidade</h2>
          <div className="space-y-3">
            <InputField
              label="Nome da Comunidade"
              value={form.name}
              onChange={(v) => setForm((f) => ({ ...f, name: v }))}
            />
            <TextareaField
              label="Descrição da Comunidade"
              value={form.description}
              onChange={(v) => setForm((f) => ({ ...f, description: v }))}
            />
            <InputField
              label="Telefone"
              value={form.phone}
              onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
            />
            <div className="grid grid-cols-3 gap-2">
              <InputField
                label="Cidade"
                value={form.city}
                onChange={(v) => setForm((f) => ({ ...f, city: v }))}
              />
              <InputField
                label="Estado"
                value={form.state}
                onChange={(v) => setForm((f) => ({ ...f, state: v }))}
              />
              <InputField
                label="País"
                value={form.country}
                onChange={(v) => setForm((f) => ({ ...f, country: v }))}
              />
            </div>
            <WButton variant="gradient" size="md" fullWidth onClick={handleSaveCommunity}>
              Salvar
            </WButton>
          </div>
        </section>

        {/* Contato da Comunidade */}
        <section className="rounded-2xl bg-white border border-border p-5 shadow-soft">
          <h2 className="text-sm font-extrabold tracking-tight mb-4">Contato da Comunidade</h2>
          <p className="text-xs text-foreground/60 mb-3">
            Informe o WhatsApp que será usado no botão de contato da sua comunidade.
          </p>
          <div className="space-y-2">
            <InputField
              label="WhatsApp da Comunidade"
              placeholder="5511999999999 ou https://wa.me/5511999999999"
              value={whatsapp}
              onChange={setWhatsapp}
            />
            <WButton variant="gradient" size="md" fullWidth onClick={handleSaveWhatsapp}>
              Salvar
            </WButton>
          </div>
        </section>

        {/* Compartilhar Comunidade */}
        <section className="rounded-2xl bg-white border border-border p-5 shadow-soft">
          <h2 className="text-sm font-extrabold tracking-tight mb-1">Compartilhar Comunidade</h2>
          <p className="text-xs text-foreground/60 mb-4">
            Envie este link para que pessoas entrem diretamente na sua comunidade.
          </p>
          <input
            readOnly
            value={communityLink}
            onClick={(e) => (e.target as HTMLInputElement).select()}
            className="w-full rounded-xl bg-surface-muted px-4 py-3 text-sm font-mono text-foreground/80 border border-border mb-4 outline-none cursor-text"
          />
          <WButton
            variant="gradient"
            size="md"
            fullWidth
            onClick={() =>
              window.open(`https://wa.me/?text=${encodeURIComponent(communityLink)}`, "_blank")
            }
          >
            <Share2 size={16} />
            Compartilhar no WhatsApp
          </WButton>
        </section>

        {/* Conta */}
        <section className="rounded-2xl bg-white border border-border p-5 shadow-soft">
          <h2 className="text-sm font-extrabold tracking-tight mb-4">Conta</h2>
          <button
            onClick={() => nav({ to: "/" })}
            className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-2xl bg-white border border-border text-[#d81e62] font-bold hover:bg-muted transition-colors"
          >
            <LogOut size={18} /> Sair
          </button>
        </section>
      </div>
    </AppShell>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-[11px] font-bold text-foreground/50 uppercase tracking-wider mb-1 block">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-10 rounded-xl border border-border px-3 text-sm outline-none focus:ring-2 focus:ring-[#d81e62] bg-white"
      />
    </div>
  );
}

function TextareaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-[11px] font-bold text-foreground/50 uppercase tracking-wider mb-1 block">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full rounded-xl border border-border p-3 text-sm outline-none focus:ring-2 focus:ring-[#d81e62] resize-none bg-white"
      />
    </div>
  );
}
