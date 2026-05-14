import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import TopBar from "@/components/layout/TopBar";
import BottomNav from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Users, Trash2, Lock, Building2, UserPlus, X, ArrowLeft, Send, Pin, PinOff, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Group = {
  id: string;
  tenant_id: string;
  name: string;
  type: "private" | "internal";
  created_by: string;
  created_at: string;
  updated_at: string;
};

type GroupPost = {
  id: string;
  group_id: string;
  author_id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
  profiles?: { name: string; avatar_url: string | null };
  replies_count?: number;
};

type GroupReply = {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  profiles?: { name: string; avatar_url: string | null };
};

type MemberSearch = {
  user_id: string;
  name: string;
  avatar_url: string | null;
  city: string | null;
};

export default function Groups() {
  const { user, isB2B } = useAuth();
  const { tenant } = useTenant();
  const navigate = useNavigate();
  const { groupId } = useParams();
  
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupType, setNewGroupType] = useState<"private" | "internal">("private");
  const [saving, setSaving] = useState(false);

  // Add members modal
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [allMembers, setAllMembers] = useState<MemberSearch[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<MemberSearch[]>([]);
  const [savingMembers, setSavingMembers] = useState(false);

  // Group posts (forum)
  const [showGroupDetail, setShowGroupDetail] = useState(false);
  const [currentGroup, setCurrentGroup] = useState<Group | null>(null);
  const [posts, setPosts] = useState<GroupPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [savingPost, setSavingPost] = useState(false);

  // Post replies
  const [showRepliesModal, setShowRepliesModal] = useState(false);
  const [currentPost, setCurrentPost] = useState<GroupPost | null>(null);
  const [replies, setReplies] = useState<GroupReply[]>([]);
  const [repliesLoading, setRepliesLoading] = useState(false);
  const [newReply, setNewReply] = useState("");
  const [savingReply, setSavingReply] = useState(false);

  useEffect(() => {
    if (!user || !isB2B || !tenant) {
      navigate("/");
      return;
    }
    loadGroups();
  }, [user, isB2B, tenant]);

  const loadGroups = async () => {
    if (!user || !tenant) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("groups")
      .select("*")
      .eq("tenant_id", tenant.id)
      .order("created_at", { ascending: false });
    setLoading(false);
    if (error) {
      toast.error("Erro ao carregar grupos");
      setGroups([]);
    } else {
      setGroups(data || []);
    }
  };

  const createGroup = async () => {
    if (!user || !tenant || !newGroupName.trim()) return;
    setSaving(true);
    
    // Create group
    const { data: groupData, error: groupError } = await supabase
      .from("groups")
      .insert({
        tenant_id: tenant.id,
        name: newGroupName.trim(),
        type: newGroupType,
        created_by: user.id,
      })
      .select()
      .single();
    
    // If group created, add creator as member
    if (groupData) {
      await supabase.from("group_members").insert({
        group_id: groupData.id,
        user_id: user.id,
        added_by: user.id,
      });
    }
    
    setSaving(false);
    
    if (groupError) {
      toast.error(groupError.message);
      return;
    }
    
    if (groupData) {
      setGroups([groupData, ...groups]);
      setShowModal(false);
      setNewGroupName("");
      setNewGroupType("private");
      toast.success("Grupo criado!");
    }
  };

  const deleteGroup = async (groupId: string) => {
    const { error } = await supabase.from("groups").delete().eq("id", groupId);
    if (error) {
      toast.error(error.message);
      return;
    }
    setGroups(groups.filter(g => g.id !== groupId));
    toast.success("Grupo excluído");
  };

  // Load all members when opening modal
  const openAddMembers = async (group: Group) => {
    setSelectedGroup(group);
    setShowMembersModal(true);
    setSearchTerm("");
    setSelectedMembers([]);
    setMembersLoading(true);
    
    const { data, error } = await supabase
      .from("memberships")
      .select("user_id, role, profiles(name, avatar_url, city)")
      .eq("tenant_id", group.tenant_id)
      .neq("role", "owner")
      .eq("is_active", true);
    
    setMembersLoading(false);
    
    if (error) {
      setAllMembers([]);
      return;
    }
    
    const members = (data || []).map((m: any) => ({
      user_id: m.user_id,
      name: m.profiles?.name || "Usuário",
      avatar_url: m.profiles?.avatar_url || null,
      city: m.profiles?.city || null,
    }));
    
    setAllMembers(members);
  };

  // Filter members locally based on search term
  const filteredMembers = searchTerm.length < 2 
    ? allMembers 
    : allMembers.filter(m => 
        m.name.toLowerCase().includes(searchTerm.toLowerCase())
      );

  const toggleMember = (member: MemberSearch) => {
    const exists = selectedMembers.find(m => m.user_id === member.user_id);
    if (exists) {
      setSelectedMembers(selectedMembers.filter(m => m.user_id !== member.user_id));
    } else {
      setSelectedMembers([...selectedMembers, member]);
    }
  };

  const addMembersToGroup = async () => {
    if (!selectedGroup || selectedMembers.length === 0) return;
    setSavingMembers(true);
    const membersToInsert = selectedMembers.map(member => ({
      group_id: selectedGroup.id,
      user_id: member.user_id,
      added_by: user!.id,
    }));
    for (const member of membersToInsert) {
      await supabase.from("group_members").insert(member).select();
    }
    setSavingMembers(false);
    setShowMembersModal(false);
    setSelectedGroup(null);
    setSearchTerm("");
    setSearchResults([]);
    setSelectedMembers([]);
    toast.success(`${membersToInsert.length} membro(s) adicionado(s)!`);
  };

  // Group detail / forum
  const openGroup = (group: Group) => {
    setCurrentGroup(group);
    setShowGroupDetail(true);
    loadPosts(group.id);
  };

  const loadPosts = async (gId: string) => {
    setPostsLoading(true);
    const { data, error } = await supabase
      .from("group_posts")
      .select("*, profiles(name, avatar_url)")
      .eq("group_id", gId)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false });
    setPostsLoading(false);
    if (error) {
      toast.error("Erro ao carregar discussões");
      setPosts([]);
    } else {
      setPosts(data || []);
    }
  };

  const createPost = async () => {
    if (!user || !currentGroup || !newPostTitle.trim()) return;
    setSavingPost(true);
    const { data, error } = await supabase
      .from("group_posts")
      .insert({
        group_id: currentGroup.id,
        author_id: user.id,
        title: newPostTitle.trim(),
        content: newPostContent.trim() || null,
      })
      .select("*, profiles(name, avatar_url)")
      .single();
    setSavingPost(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data) {
      setPosts([data, ...posts]);
      setShowPostModal(false);
      setNewPostTitle("");
      setNewPostContent("");
      toast.success("Discussão criada!");
    }
  };

  const deletePost = async (postId: string) => {
    const { error } = await supabase.from("group_posts").delete().eq("id", postId);
    if (error) {
      toast.error(error.message);
      return;
    }
    setPosts(posts.filter(p => p.id !== postId));
    toast.success("Discussão excluída");
  };

  const togglePinPost = async (post: GroupPost) => {
    const { error } = await supabase
      .from("group_posts")
      .update({ is_pinned: !post.is_pinned })
      .eq("id", post.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setPosts(posts.map(p => p.id === post.id ? { ...p, is_pinned: !p.is_pinned } : p));
    toast.success(post.is_pinned ? "Discussão desafixada" : "Discussão fixada");
  };

  // Replies
  const openReplies = async (post: GroupPost) => {
    setCurrentPost(post);
    setShowRepliesModal(true);
    setRepliesLoading(true);
    const { data, error } = await supabase
      .from("group_replies")
      .select("*, profiles(name, avatar_url)")
      .eq("post_id", post.id)
      .order("created_at", { ascending: true });
    setRepliesLoading(false);
    if (error) {
      setReplies([]);
    } else {
      setReplies(data || []);
    }
  };

  const createReply = async () => {
    if (!user || !currentPost || !newReply.trim()) return;
    setSavingReply(true);
    const { data, error } = await supabase
      .from("group_replies")
      .insert({
        post_id: currentPost.id,
        author_id: user.id,
        content: newReply.trim(),
      })
      .select("*, profiles(name, avatar_url)")
      .single();
    setSavingReply(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data) {
      setReplies([...replies, data]);
      setNewReply("");
      toast.success("Resposta enviada!");
    }
  };

  const deleteReply = async (replyId: string) => {
    const { error } = await supabase.from("group_replies").delete().eq("id", replyId);
    if (error) {
      toast.error(error.message);
      return;
    }
    setReplies(replies.filter(r => r.id !== replyId));
    toast.success("Resposta excluída");
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col bg-gray-50">
        <TopBar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#630091]" />
        </div>
        <BottomNav />
      </div>
    );
  }

  // Group detail view (forum)
  if (showGroupDetail && currentGroup) {
    return (
      <div className="h-screen flex flex-col bg-gradient-to-b from-gray-50 to-gray-100">
        <TopBar />
        <div className="flex-1 overflow-y-auto px-4 py-4 pb-20">
          <div className="flex items-center gap-3 mb-4">
            <Button variant="ghost" size="sm" onClick={() => { setShowGroupDetail(false); setCurrentGroup(null); }}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">{currentGroup.name}</h1>
              <p className="text-xs text-gray-500">{currentGroup.type === 'private' ? 'Privado' : 'Interno'}</p>
            </div>
            <Button onClick={() => setShowPostModal(true)} className="bg-[#630091] text-white rounded-full">
              <Plus className="h-4 w-4 mr-1" /> Nova discussão
            </Button>
          </div>

          {postsLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">Nenhuma discussão criada</p>
              <p className="text-gray-400 text-sm">Seja o primeiro a iniciar uma conversa</p>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map(post => (
                <div key={post.id} className={`bg-white rounded-2xl p-4 border shadow-sm ${post.is_pinned ? 'border-purple-300 bg-purple-50' : ''}`}>
                  {post.is_pinned && <div className="text-xs text-purple-600 font-medium mb-1">📌 Fixado</div>}
                  <div className="flex items-start justify-between">
                    <div className="flex-1" onClick={() => openReplies(post)}>
                      <h3 className="font-semibold text-gray-900">{post.title}</h3>
                      {post.content && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{post.content}</p>}
                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                        <span>{post.profiles?.name || 'Usuário'}</span>
                        <span>•</span>
                        <span>{new Date(post.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => togglePinPost(post)} className={post.is_pinned ? "text-purple-600" : "text-gray-400"}>
                        {post.is_pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                      </Button>
                      {user?.id === post.author_id && (
                        <Button variant="ghost" size="sm" onClick={() => deletePost(post.id)} className="text-red-500">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <BottomNav />

        {/* New Post Modal */}
        <Dialog open={showPostModal} onOpenChange={setShowPostModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova discussão</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Título</Label>
                <Input value={newPostTitle} onChange={e => setNewPostTitle(e.target.value)} placeholder="Qual é o tema?" maxLength={120} />
              </div>
              <div>
                <Label>Conteúdo (opcional)</Label>
                <Textarea value={newPostContent} onChange={e => setNewPostContent(e.target.value)} placeholder="Descreva mais..." rows={4} />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowPostModal(false)} className="flex-1">Cancelar</Button>
                <Button onClick={createPost} disabled={savingPost || !newPostTitle.trim()} className="flex-1 bg-[#630091] text-white">
                  {savingPost ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Replies Modal */}
        <Dialog open={showRepliesModal} onOpenChange={setShowRepliesModal}>
          <DialogContent className="max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>{currentPost?.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-64 overflow-y-auto">
              {repliesLoading ? (
                <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin" /></div>
              ) : replies.length === 0 ? (
                <p className="text-center text-gray-500 py-4">Nenhuma resposta ainda</p>
              ) : (
                replies.map(reply => (
                  <div key={reply.id} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{reply.profiles?.name || 'Usuário'}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{new Date(reply.created_at).toLocaleDateString()}</span>
                        {user?.id === reply.author_id && (
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500" onClick={() => deleteReply(reply.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">{reply.content}</p>
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-2 pt-2">
              <Input value={newReply} onChange={e => setNewReply(e.target.value)} placeholder="Escreva uma resposta..." onKeyDown={e => e.key === 'Enter' && createReply()} />
              <Button onClick={createReply} disabled={savingReply || !newReply.trim()} className="bg-[#630091] text-white">
                {savingReply ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Groups list view
  return (
    <div className="h-screen flex flex-col bg-gradient-to-b from-gray-50 to-gray-100">
      <TopBar />
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-20">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#630091] flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Grupos</h1>
              <p className="text-xs text-gray-500">{groups.length} grupo{groups.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <Button onClick={() => setShowModal(true)} className="bg-[#630091] text-white hover:bg-[#52007a] rounded-full">
            <Plus className="h-4 w-4 mr-1" /> Criar grupo
          </Button>
        </div>
        
        {groups.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-200 flex items-center justify-center">
              <Users className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">Nenhum grupo criado</p>
            <p className="text-gray-400 text-sm mt-1">Crie grupos para organizar sua comunidade</p>
          </div>
        ) : (
          <div className="space-y-3">
            {groups.map(group => (
              <div key={group.id} className="bg-white rounded-2xl p-4 border shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => openGroup(group)}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${group.type === 'private' ? 'bg-purple-100' : 'bg-blue-100'}`}>
                      {group.type === 'private' ? <Lock className="h-5 w-5 text-purple-600" /> : <Building2 className="h-5 w-5 text-blue-600" />}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{group.name}</p>
                      <p className="text-xs text-gray-500">{group.type === 'private' ? 'Privado' : 'Interno'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openAddMembers(group)} className="text-[#630091] hover:text-[#52007a] hover:bg-purple-50">
                      <UserPlus className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteGroup(group.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <BottomNav />
      
      {/* Create Group Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar novo grupo</DialogTitle>
            <DialogDescription>Crie um grupo para organizar membros da sua comunidade.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome do grupo</Label>
              <Input value={newGroupName} onChange={e => setNewGroupName(e.target.value)} placeholder="Ex: Equipe Premium" maxLength={80} />
            </div>
            <div>
              <Label>Tipo do grupo</Label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="group-type" value="private" checked={newGroupType === "private"} onChange={() => setNewGroupType("private")} className="w-4 h-4 text-purple-600" />
                  <span className="text-sm">Privado</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="group-type" value="internal" checked={newGroupType === "internal"} onChange={() => setNewGroupType("internal")} className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">Interno</span>
                </label>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">Cancelar</Button>
              <Button onClick={createGroup} disabled={saving || !newGroupName.trim()} className="flex-1 bg-[#630091] text-white">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Members Modal */}
      <Dialog open={showMembersModal} onOpenChange={setShowMembersModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar membros</DialogTitle>
            <DialogDescription>Procure e adicione membros ao grupo "{selectedGroup?.name}"</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Buscar membros..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#630091]"
            />
            {membersLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              </div>
            ) : filteredMembers.length > 0 ? (
              <div className="max-h-64 overflow-y-auto border rounded-lg">
                {filteredMembers.map(member => {
                  const isSelected = selectedMembers.some(m => m.user_id === member.user_id);
                  return (
                    <div key={member.user_id} onClick={() => toggleMember(member)} className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 ${isSelected ? "bg-purple-50" : ""}`}>
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${isSelected ? "border-[#630091] bg-[#630091]" : "border-gray-300"}`}>
                        {isSelected && <span className="text-white text-xs">✓</span>}
                      </div>
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                        {member.avatar_url ? <img src={member.avatar_url} alt={member.name} className="w-8 h-8 rounded-full object-cover" /> : <span className="text-xs font-medium">{member.name[0]?.toUpperCase()}</span>}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{member.name}</p>
                        {member.city && <p className="text-xs text-gray-500">{member.city}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-gray-500 text-sm py-2">Nenhum membro disponível</p>
            )}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowMembersModal(false)} className="flex-1">Cancelar</Button>
              <Button onClick={addMembersToGroup} disabled={savingMembers || selectedMembers.length === 0} className="flex-1 bg-[#630091] text-white">
                {savingMembers ? <Loader2 className="h-4 w-4 animate-spin" /> : `Adicionar ${selectedMembers.length > 0 ? `(${selectedMembers.length})` : ''}`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}