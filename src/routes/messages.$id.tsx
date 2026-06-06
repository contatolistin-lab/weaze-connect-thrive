import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Send, Smile, Plus, Phone, Video } from "lucide-react";
import { Avatar } from "@/components/weaze/Avatar";
import { chats } from "@/lib/mock-data";
import { useState } from "react";

export const Route = createFileRoute("/messages/$id")({
  component: Chat,
});

interface Msg {
  id: string;
  me: boolean;
  text: string;
  time: string;
}
const initial: Msg[] = [
  { id: "1", me: false, text: "Oi! Bem-vinda à comunidade 💜", time: "10:02" },
  { id: "2", me: true, text: "Obrigada! Adorei o feed.", time: "10:03" },
  { id: "3", me: false, text: "Confira o desafio da semana 🏃‍♀️", time: "10:04" },
];

function Chat() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const c = chats.find((x) => x.id === id) ?? chats[0];
  const [msgs, setMsgs] = useState<Msg[]>(initial);
  const [txt, setTxt] = useState("");

  const send = () => {
    if (!txt.trim()) return;
    setMsgs((m) => [...m, { id: String(Date.now()), me: true, text: txt, time: "agora" }]);
    setTxt("");
  };

  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto max-w-md min-h-dvh bg-background relative flex flex-col">
        <header className="sticky top-0 z-40 bg-white border-b border-border safe-pt">
          <div className="flex items-center gap-3 px-3 h-14">
            <button
              onClick={() => nav({ to: "/messages" })}
              className="h-9 w-9 grid place-items-center rounded-full hover:bg-muted"
            >
              <ArrowLeft size={20} />
            </button>
            <Avatar name={c.name} size={36} brand={c.brand} />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm truncate">{c.name}</p>
              <p className="text-[11px] text-emerald-600 font-semibold">online</p>
            </div>
            <button className="h-9 w-9 grid place-items-center rounded-full hover:bg-muted">
              <Phone size={18} />
            </button>
            <button className="h-9 w-9 grid place-items-center rounded-full hover:bg-muted">
              <Video size={18} />
            </button>
          </div>
        </header>

        <div className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
          {msgs.map((m) => (
            <div key={m.id} className={`flex ${m.me ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[78%] px-4 py-2.5 text-sm leading-snug rounded-2xl ${
                  m.me
                    ? "bg-brand-gradient text-white rounded-br-md shadow-pink"
                    : "bg-muted text-foreground rounded-bl-md"
                }`}
              >
                {m.text}
                <span
                  className={`block text-[10px] mt-1 ${m.me ? "text-white/70" : "text-foreground/50"}`}
                >
                  {m.time}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-border bg-white px-3 py-2 safe-pb">
          <div className="flex items-center gap-2">
            <button className="h-10 w-10 rounded-full bg-muted grid place-items-center text-[#000000]">
              <Plus size={20} />
            </button>
            <div className="flex-1 flex items-center gap-2 rounded-full bg-muted px-4 h-10">
              <input
                value={txt}
                onChange={(e) => setTxt(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Mensagem"
                className="flex-1 bg-transparent outline-none text-sm"
              />
              <Smile size={18} className="text-foreground/40" />
            </div>
            <button
              onClick={send}
              className="h-10 w-10 rounded-full bg-white text-[#000000] grid place-items-center shadow-pink"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
