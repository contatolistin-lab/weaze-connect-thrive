import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, UserPlus, Crown, Shield, User, Search, ChevronRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import type { ConversationMember, ConversationRole } from "@/lib/conversations";

type Props = {
  open: boolean;
  onClose: () => void;
  members: ConversationMember[];
  conversationId: string | null;
  onAddMember: (userId: string, role: ConversationRole) => void;
  onRemoveMember: (memberId: string) => void;
  onUpdateRole: (memberId: string, role: ConversationRole) => void;
  searchResults: Array<{ user_id: string; name: string; avatar_url?: string }>;
  onSearch: (q: string) => void;
  searchQuery: string;
  isSearching: boolean;
  canModerate: boolean;
};

const roleConfig = {
  owner: { label: "Responsável", color: "bg-gradient-to-r from-[#630091] to-[#d81e62] text-white", icon: Crown },
  moderator: { label: "Moderador", color: "bg-purple-100 text-purple-700", icon: Shield },
  member: { label: "Membro", color: "bg-gray-100 text-gray-600", icon: User },
};

export default function MembersSheet({
  open,
  onClose,
  members,
  onAddMember,
  onRemoveMember,
  onUpdateRole,
  searchResults,
  onSearch,
  searchQuery,
  isSearching,
  canModerate,
}: Props) {
  const [showAdd, setShowAdd] = useState(false);

  const handleAdd = (userId: string) => {
    onAddMember(userId, "member");
    setShowAdd(false);
    toast.success("Membro adicionado");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base">Membros da conversa</DialogTitle>
            <div className="flex items-center gap-2">
              {canModerate && (
                <Button size="sm" onClick={() => setShowAdd(true)} className="h-8 text-xs gap-1 bg-[#630091] hover:bg-[#630091]/90">
                  <UserPlus className="h-3 w-3" />
                  Adicionar
                </Button>
              )}
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {showAdd ? (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { onSearch(e.target.value); setSearchQuery(e.target.value); }}
                placeholder="Buscar usuário..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#630091]/30"
                autoFocus
              />
            </div>
            {isSearching ? (
              <div className="text-center py-4 text-sm text-gray-400">Buscando...</div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-4 text-sm text-gray-400">
                {searchQuery ? "Nenhum usuário encontrado" : "Digite para buscar"}
              </div>
            ) : (
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {searchResults.map((u) => {
                  const alreadyMember = members.some((m) => m.user_id === u.user_id);
                  return (
                    <div key={u.user_id} className="flex items-center gap-2 p-2 rounded-xl hover:bg-gray-50">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={u.avatar_url || ""} />
                        <AvatarFallback className="text-xs bg-gray-100">{u.name?.[0]?.toUpperCase() || "?"}</AvatarFallback>
                      </Avatar>
                      <span className="flex-1 text-sm font-medium text-gray-700 truncate">{u.name}</span>
                      {alreadyMember ? (
                        <Badge variant="outline" className="text-[10px] text-gray-400">já é membro</Badge>
                      ) : (
                        <Button size="sm" onClick={() => handleAdd(u.user_id)} className="h-7 text-[11px] bg-[#630091] hover:bg-[#630091]/90">
                          Adicionar
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            <Button variant="ghost" size="sm" onClick={() => setShowAdd(false)} className="w-full h-8 text-xs">
              Cancelar
            </Button>
          </div>
        ) : (
          <div className="space-y-1 max-h-80 overflow-y-auto -mx-6 px-6">
            {members.map((m) => {
              const rc = roleConfig[m.role] || roleConfig.member;
              const RoleIcon = rc.icon;
              return (
                <div key={m.id} className="flex items-center gap-2 p-2 rounded-xl hover:bg-gray-50 group">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={m.profiles?.avatar_url || ""} />
                    <AvatarFallback className="text-xs bg-gray-100">{m.profiles?.name?.[0]?.toUpperCase() || "?"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{m.profiles?.name || "Usuário"}</p>
                    <div className="flex items-center gap-1">
                      <RoleIcon className="h-3 w-3 text-gray-400" />
                      <span className="text-[11px] text-gray-400">{rc.label}</span>
                    </div>
                  </div>
                  {canModerate && m.role !== "owner" && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {m.role === "member" && (
                          <DropdownMenuItem onClick={() => onUpdateRole(m.id, "moderator")} className="text-xs gap-2">
                            <Shield className="h-3 w-3" />
                            Tornar moderador
                          </DropdownMenuItem>
                        )}
                        {m.role === "moderator" && (
                          <DropdownMenuItem onClick={() => onUpdateRole(m.id, "member")} className="text-xs gap-2">
                            <User className="h-3 w-3" />
                            Remover moderação
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => { onRemoveMember(m.id); }} className="text-xs gap-2 text-red-500 focus:text-red-500">
                          <Trash2 className="h-3 w-3" />
                          Remover da conversa
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
