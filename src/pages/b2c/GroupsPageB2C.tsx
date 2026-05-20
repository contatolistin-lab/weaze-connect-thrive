import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import TopBar from "@/components/layout/TopBar";
import { Loader2, Folder, ChevronRight, Users, MessageSquare } from "lucide-react";
import { useB2CGroups } from "@/hooks/groups/useB2CGroups";

export default function GroupsPageB2C() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { groups, loading, loadGroups } = useB2CGroups(user?.id || null);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5", display: "flex", flexDirection: "column", paddingBottom: 80 }}>
      <TopBar />
      <div style={{ padding: "16px 16px 0" }}>
        <h1 style={{ fontSize: 22, fontWeight: "bold", color: "#333" }}>Meus grupos</h1>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : groups.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "#888" }}>
          <Folder size={40} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
          <p>Você ainda não foi adicionado a nenhum grupo</p>
        </div>
      ) : (
        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          {groups.map((group) => (
            <button
              key={group.id}
              onClick={() => navigate(`/groups/member/${group.id}`)}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                padding: 16,
                background: "#fff",
                borderRadius: 12,
                border: "none",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
                position: "relative",
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                    background: group.type === "internal" ? "#e8f4f8" : "#f0e6ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Users size={22} color={group.type === "internal" ? "#0891b2" : "#7c3aed"} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                  <p style={{ fontWeight: 600, color: "#333", fontSize: 15 }}>{group.name}</p>
                  <span
                    style={{
                      fontSize: 10,
                      padding: "1px 6px",
                      borderRadius: 8,
                      background: group.type === "internal" ? "#e8f4f8" : "#f0e6ff",
                      color: group.type === "internal" ? "#0891b2" : "#7c3aed",
                      fontWeight: 500,
                    }}
                  >
                    {group.type === "internal" ? "Interno" : "Privado"}
                  </span>
                </div>
                {group.last_preview ? (
                  <p style={{ fontSize: 13, color: "#666", lineHeight: 1.3, marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {group.last_author_name ? (
                      <><strong style={{ fontWeight: 500 }}>{group.last_author_name}</strong>: {group.last_preview}</>
                    ) : (
                      group.last_preview
                    )}
                  </p>
                ) : (
                  <p style={{ fontSize: 13, color: "#aaa", marginTop: 4 }}>Nenhuma atividade ainda</p>
                )}
                {group.last_activity && (
                  <span style={{ fontSize: 11, color: "#999", marginTop: 2, display: "block" }}>
                    {formatGroupTime(group.last_activity)}
                  </span>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                <ChevronRight size={16} color="#ccc" />
                {group.unread_count > 0 && (
                  <span style={{ background: "#d81e62", color: "#fff", fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: 10, minWidth: 18, textAlign: "center", lineHeight: "14px" }}>
                    {group.unread_count > 9 ? "9+" : group.unread_count}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function formatGroupTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "ontem";
  if (days < 7) return `há ${days} dias`;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}
