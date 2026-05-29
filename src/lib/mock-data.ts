// Mock data for the entire Weaze frontend (no backend yet).
export interface MockCommunity {
  id: string;
  name: string;
  handle: string;
  description: string;
  members: number;
  category: string;
  color: string;
  cover: string;
  verified?: boolean;
}

export interface MockPost {
  id: string;
  community: MockCommunity;
  caption: string;
  cta?: string;
  ctaLink?: string;
  likes: number;
  comments: number;
  shares: number;
  mediaColor: string;
  emoji: string;
  mediaType?: "image" | "video" | "external";
  mediaUrl?: string;
  mediaPreview?: string;
}

export const communities: MockCommunity[] = [
  {
    id: "c1",
    name: "Nike Run Club",
    handle: "@nikerun",
    description: "Comunidade oficial de corredores Nike.",
    members: 248920,
    category: "Esportes",
    color: "from-orange-500 to-pink-600",
    cover: "🏃",
    verified: true,
  },
  {
    id: "c2",
    name: "Spotify Wrapped",
    handle: "@spotify",
    description: "Bastidores e drops musicais.",
    members: 1289203,
    category: "Música",
    color: "from-green-500 to-emerald-700",
    cover: "🎧",
    verified: true,
  },
  {
    id: "c3",
    name: "Magalu Tech",
    handle: "@magalu",
    description: "Reviews, lançamentos e cupons.",
    members: 89220,
    category: "Tech",
    color: "from-sky-500 to-indigo-600",
    cover: "📱",
    verified: true,
  },
  {
    id: "c4",
    name: "Stone Beauty",
    handle: "@stonebeauty",
    description: "Skincare, tutoriais e drops.",
    members: 56210,
    category: "Beleza",
    color: "from-pink-500 to-rose-600",
    cover: "💄",
  },
  {
    id: "c5",
    name: "Heineken Live",
    handle: "@heineken",
    description: "Festivais, eventos e shows.",
    members: 320150,
    category: "Lifestyle",
    color: "from-emerald-500 to-lime-600",
    cover: "🍻",
    verified: true,
  },
  {
    id: "c6",
    name: "Natura Vibes",
    handle: "@natura",
    description: "Bem-estar e sustentabilidade.",
    members: 142000,
    category: "Beleza",
    color: "from-amber-500 to-orange-600",
    cover: "🌿",
  },
];

export const posts: MockPost[] = [
  {
    id: "p1",
    community: communities[0],
    caption: "Novo drop Pegasus 41 disponível! 🔥 Corra mais leve.",
    cta: "Comprar agora",
    ctaLink: "https://nike.com",
    likes: 12400,
    comments: 384,
    shares: 920,
    mediaColor: "from-orange-500 via-pink-500 to-purple-600",
    emoji: "👟",
  },
  {
    id: "p2",
    community: communities[1],
    caption: "Sua Wrapped 2025 está chegando 👀",
    cta: "Ver prévia",
    ctaLink: "https://spotify.com",
    likes: 89220,
    comments: 5120,
    shares: 12010,
    mediaColor: "from-green-500 via-emerald-600 to-teal-700",
    emoji: "🎶",
  },
  {
    id: "p3",
    community: communities[2],
    caption: "Bug Friday começou! Até 70% OFF em smartphones.",
    cta: "Ver ofertas",
    ctaLink: "https://magalu.com",
    likes: 23110,
    comments: 902,
    shares: 1820,
    mediaColor: "from-sky-500 via-indigo-600 to-purple-700",
    emoji: "📱",
  },
  {
    id: "p4",
    community: communities[3],
    caption: "Skincare de manhã em 3 passos ✨",
    cta: "Salvar rotina",
    ctaLink: "https://stonebeauty.com",
    likes: 7820,
    comments: 220,
    shares: 540,
    mediaColor: "from-pink-400 via-rose-500 to-fuchsia-600",
    emoji: "💄",
  },
  {
    id: "p5",
    community: communities[4],
    caption: "Heineken Fest SP esgotado em 12 minutos.",
    cta: "Lista de espera",
    ctaLink: "https://heineken.com",
    likes: 45120,
    comments: 1820,
    shares: 6210,
    mediaColor: "from-emerald-500 via-green-600 to-teal-700",
    emoji: "🎉",
  },
];

export interface MockChat {
  id: string;
  name: string;
  last: string;
  time: string;
  unread: number;
  brand?: boolean;
}

export const chats: MockChat[] = [
  {
    id: "m1",
    name: "Nike Run Club",
    last: "Bem-vinda! Confira o desafio da semana.",
    time: "agora",
    unread: 2,
    brand: true,
  },
  { id: "m2", name: "Ana Beatriz", last: "Vamos na live de amanhã?", time: "2m", unread: 1 },
  {
    id: "m3",
    name: "Spotify Wrapped",
    last: "Sua prévia foi liberada 🎧",
    time: "1h",
    unread: 0,
    brand: true,
  },
  { id: "m4", name: "Grupo • Corrida SP", last: "Pedro: bora 6h na USP?", time: "3h", unread: 5 },
  {
    id: "m5",
    name: "Magalu Tech",
    last: "Cupom exclusivo dentro 📦",
    time: "1d",
    unread: 0,
    brand: true,
  },
];

export interface MockNotification {
  id: string;
  kind: "like" | "comment" | "follow" | "brand" | "live";
  text: string;
  time: string;
}

export const notifications: MockNotification[] = [
  { id: "n1", kind: "brand", text: "Nike Run Club te convidou para um grupo VIP.", time: "agora" },
  { id: "n2", kind: "like", text: "Ana e mais 42 pessoas curtiram seu post.", time: "5m" },
  { id: "n3", kind: "comment", text: "Pedro comentou: 'Massa demais!'", time: "12m" },
  { id: "n4", kind: "live", text: "Spotify Wrapped está ao vivo agora.", time: "1h" },
  { id: "n5", kind: "follow", text: "Você ganhou 12 novos seguidores hoje.", time: "3h" },
];

export interface MockGroup {
  id: string;
  name: string;
  members: number;
  topic: string;
  privacy: "public" | "private";
  emoji: string;
}

export const groups: MockGroup[] = [
  {
    id: "g1",
    name: "Corrida SP",
    members: 1280,
    topic: "Treinos e pace",
    privacy: "public",
    emoji: "🏃",
  },
  {
    id: "g2",
    name: "Vinil Brasil",
    members: 540,
    topic: "Trocas e achados",
    privacy: "public",
    emoji: "🎵",
  },
  {
    id: "g3",
    name: "Devs Indie",
    members: 320,
    topic: "Side projects",
    privacy: "private",
    emoji: "💻",
  },
  {
    id: "g4",
    name: "Skincare Lovers",
    members: 980,
    topic: "Rotinas e reviews",
    privacy: "public",
    emoji: "✨",
  },
];

export interface MockGroupTopic {
  id: string;
  groupId: string;
  title: string;
  author: string;
  replies: number;
  likes: number;
  createdAt: string;
}

export const groupTopics: MockGroupTopic[] = [
  {
    id: "gt1",
    groupId: "g1",
    title: "Dica de tênis para asfalto?",
    author: "Ana",
    replies: 12,
    likes: 34,
    createdAt: "2h",
  },
  {
    id: "gt2",
    groupId: "g1",
    title: "Treino longo de domingo — quem vai?",
    author: "Pedro",
    replies: 8,
    likes: 21,
    createdAt: "5h",
  },
  {
    id: "gt3",
    groupId: "g1",
    title: "Meu pace melhorou 10s depois do treino intervalado",
    author: "Lucas",
    replies: 5,
    likes: 45,
    createdAt: "1d",
  },
  {
    id: "gt4",
    groupId: "g2",
    title: "Raridade: Pink Floyd vinil original",
    author: "Carla",
    replies: 23,
    likes: 67,
    createdAt: "3h",
  },
  {
    id: "gt5",
    groupId: "g2",
    title: "Indicações de lojas em SP",
    author: "Rafael",
    replies: 15,
    likes: 29,
    createdAt: "1d",
  },
  {
    id: "gt6",
    groupId: "g3",
    title: "Side project que mais te orgulha?",
    author: "Tiago",
    replies: 31,
    likes: 89,
    createdAt: "6h",
  },
  {
    id: "gt7",
    groupId: "g3",
    title: "Dica: Next.js vs TanStack Start",
    author: "Maria",
    replies: 18,
    likes: 56,
    createdAt: "1d",
  },
  {
    id: "gt8",
    groupId: "g4",
    title: "Rotina skincare noturna completa",
    author: "Júlia",
    replies: 9,
    likes: 72,
    createdAt: "4h",
  },
];

export interface MockConversation {
  id: string;
  title: string;
  description: string;
  category: string;
  author: string;
  authorAvatar: string;
  replies: number;
  likes: number;
  views: number;
  pinned: boolean;
  trending: boolean;
  createdAt: string;
  lastActivity: string;
  tags: string[];
}

export const conversations: MockConversation[] = [
  {
    id: "cv1",
    title: "Qual tênis você recomenda para meia-maratona?",
    description:
      "Estou treinando para minha primeira meia-maratona e queria saber qual tênis vocês recomendam. Tenho pisada neutra e peso 70kg.",
    category: "Esportes",
    author: "Rafael",
    authorAvatar: "R",
    replies: 42,
    likes: 128,
    views: 2340,
    pinned: true,
    trending: true,
    createdAt: "2h",
    lastActivity: "5m",
    tags: ["corrida", "tênis", "treino"],
  },
  {
    id: "cv2",
    title: "O que vocês estão ouvindo essa semana?",
    description:
      "Compartilhem suas playlists e descobertas musicais da semana! Quero encontrar sons novos.",
    category: "Música",
    author: "Ana",
    authorAvatar: "A",
    replies: 87,
    likes: 234,
    views: 4560,
    pinned: false,
    trending: true,
    createdAt: "5h",
    lastActivity: "2m",
    tags: ["música", "playlist"],
  },
  {
    id: "cv3",
    title: "Dúvida: qual framework frontend usar em 2026?",
    description:
      "React continua sendo a melhor escolha ou já era? Estou pensando em migrar para algo novo.",
    category: "Tech",
    author: "Lucas",
    authorAvatar: "L",
    replies: 56,
    likes: 167,
    views: 3890,
    pinned: false,
    trending: true,
    createdAt: "1d",
    lastActivity: "10m",
    tags: ["frontend", "react", "frameworks"],
  },
  {
    id: "cv4",
    title: "Skincare coreano: mitos e verdades",
    description:
      "Muita gente fala sobre skincare coreano mas nem tudo é verdade. Vou listar alguns mitos.",
    category: "Beleza",
    author: "Júlia",
    authorAvatar: "J",
    replies: 34,
    likes: 198,
    views: 2900,
    pinned: true,
    trending: false,
    createdAt: "1d",
    lastActivity: "30m",
    tags: ["skincare", "beleza"],
  },
  {
    id: "cv5",
    title: "Dicas de restaurantes em SP para jantar a dois",
    description: "Queremos um lugar romântico mas sem ser tão caro. Sugestões?",
    category: "Lifestyle",
    author: "Carla",
    authorAvatar: "C",
    replies: 28,
    likes: 95,
    views: 1800,
    pinned: false,
    trending: false,
    createdAt: "2d",
    lastActivity: "1h",
    tags: ["sp", "restaurantes", "gastronomia"],
  },
  {
    id: "cv6",
    title: "Vale a pena investir em cripto em 2026?",
    description: "Com a volatilidade do mercado, será que ainda vale a pena? Quero opiniões.",
    category: "Finanças",
    author: "Pedro",
    authorAvatar: "P",
    replies: 45,
    likes: 112,
    views: 3200,
    pinned: false,
    trending: false,
    createdAt: "3d",
    lastActivity: "2h",
    tags: ["cripto", "investimentos"],
  },
  {
    id: "cv7",
    title: "Indicação de livros de ficção científica",
    description: "Acabei de ler Duna e estou procurando algo no mesmo nível.",
    category: "Cultura",
    author: "Tiago",
    authorAvatar: "T",
    replies: 39,
    likes: 87,
    views: 1500,
    pinned: false,
    trending: false,
    createdAt: "4d",
    lastActivity: "3h",
    tags: ["livros", "ficção"],
  },
  {
    id: "cv8",
    title: "[FIXO] Regras da comunidade — leia antes de postar",
    description: "Bem-vindo às Conversas WEAZE! Leia as regras para manter o fórum organizado.",
    category: "Geral",
    author: "Admin",
    authorAvatar: "W",
    replies: 0,
    likes: 1024,
    views: 12000,
    pinned: true,
    trending: false,
    createdAt: "30d",
    lastActivity: "1d",
    tags: ["regras", "comunidade"],
  },
];

export interface MockConversationComment {
  id: string;
  conversationId: string;
  author: string;
  authorAvatar: string;
  text: string;
  likes: number;
  createdAt: string;
  editedAt?: string;
  replies: { author: string; text: string; createdAt: string }[];
}

export const conversationComments: MockConversationComment[] = [
  {
    id: "cc1",
    conversationId: "cv1",
    author: "Marcos",
    authorAvatar: "M",
    text: "Recomendo o Nike Vomero 17. Muito amortecimento e conforto para longas distâncias!",
    likes: 23,
    createdAt: "1h",
    replies: [{ author: "Rafael", text: "Vou testar! Obrigado pela dica.", createdAt: "30m" }],
  },
  {
    id: "cc2",
    conversationId: "cv1",
    author: "Fernanda",
    authorAvatar: "F",
    text: "Adidas Adizero SL é ótimo custo-benefício. Uso nos meus treinos de 15km.",
    likes: 15,
    createdAt: "45m",
    replies: [],
  },
  {
    id: "cc3",
    conversationId: "cv1",
    author: "Carlos",
    authorAvatar: "C",
    text: "Hoka Clifton 9 é o mais confortável que já usei. Parece que você está correndo em nuvens.",
    likes: 31,
    createdAt: "20m",
    replies: [
      { author: "Rafael", text: "Hoka parece interessante, vou pesquisar!", createdAt: "10m" },
      { author: "Carlos", text: "Vale cada centavo!", createdAt: "5m" },
    ],
  },
  {
    id: "cc4",
    conversationId: "cv2",
    author: "Beatriz",
    authorAvatar: "B",
    text: "Tô viciada no novo álbum da Anitta. Muito bom!",
    likes: 45,
    createdAt: "3h",
    replies: [],
  },
  {
    id: "cc5",
    conversationId: "cv2",
    author: "Gabriel",
    authorAvatar: "G",
    text: "Descobri uma banda chamada 'Novos Baianos'. Música brasileira de qualidade!",
    likes: 28,
    createdAt: "2h",
    replies: [{ author: "Ana", text: "Clássico!ótima descoberta.", createdAt: "1h" }],
  },
  {
    id: "cc6",
    conversationId: "cv3",
    author: "Daniel",
    authorAvatar: "D",
    text: "React ainda é a melhor escolha para a maioria dos casos. A comunidade é gigante.",
    likes: 67,
    createdAt: "1d",
    replies: [
      { author: "Lucas", text: "Pois é, mas o ecossistema muda tão rápido...", createdAt: "12h" },
      {
        author: "Daniel",
        text: "Por isso React é seguro, tem décadas de mercado.",
        createdAt: "10h",
      },
    ],
  },
  {
    id: "cc7",
    conversationId: "cv4",
    author: "Marina",
    authorAvatar: "M",
    text: "A rotina de 10 passos não é para todo mundo! Adaptem à sua pele.",
    likes: 52,
    createdAt: "1d",
    replies: [{ author: "Júlia", text: "Exato! Menos é mais.", createdAt: "20h" }],
  },
];

export interface MockMetric {
  id: string;
  label: string;
  value: number;
  trend: string;
  icon: string;
}

export const metricsOverview: MockMetric[] = [
  { id: "m1", label: "Curtidas do mês", value: 84720, trend: "+12%", icon: "❤️" },
  { id: "m2", label: "Comentários do mês", value: 12340, trend: "+8%", icon: "💬" },
  { id: "m3", label: "Posts do mês", value: 456, trend: "+5%", icon: "📷" },
  { id: "m4", label: "Engajamento médio", value: 8.4, trend: "+2.1%", icon: "📊" },
];

export interface MockRankingUser {
  id: string;
  name: string;
  avatar: string;
  score: number;
  badge: string;
}

export const topActive: MockRankingUser[] = [
  { id: "u1", name: "Ana Beatriz", avatar: "A", score: 2840, badge: "🔥 Fogo" },
  { id: "u2", name: "Rafael Costa", avatar: "R", score: 2120, badge: "💜 Top" },
  { id: "u3", name: "Júlia Lima", avatar: "J", score: 1890, badge: "⭐ Destaque" },
  { id: "u4", name: "Pedro Santos", avatar: "P", score: 1560, badge: "💬 Conversador" },
  { id: "u5", name: "Carla Dias", avatar: "C", score: 1320, badge: "👑 Rainha" },
  { id: "u6", name: "Lucas Oliveira", avatar: "L", score: 1100, badge: "🔥 Fogo" },
  { id: "u7", name: "Fernanda Souza", avatar: "F", score: 980, badge: "⭐ Destaque" },
  { id: "u8", name: "Marcos Paulo", avatar: "M", score: 850, badge: "💜 Top" },
  { id: "u9", name: "Beatriz Rocha", avatar: "B", score: 720, badge: "👑 Rainha" },
  { id: "u10", name: "Gabriel Martins", avatar: "G", score: 650, badge: "🏆 Campeão" },
];

export interface MockPostComment {
  id: string;
  postId: string;
  author: string;
  authorAvatar: string;
  text: string;
  createdAt: string;
  editedAt?: string;
}

export const postComments: Record<string, MockPostComment[]> = {
  p1: [
    {
      id: "pc1",
      postId: "p1",
      author: "Ana Beatriz",
      authorAvatar: "A",
      text: "Sensacional! Vou comprar o meu hoje.",
      createdAt: "15 min atrás",
    },
    {
      id: "pc2",
      postId: "p1",
      author: "Rafael Costa",
      authorAvatar: "R",
      text: "Já tenho o meu e é incrível 🔥",
      createdAt: "8 min atrás",
    },
  ],
  p2: [
    {
      id: "pc3",
      postId: "p2",
      author: "Júlia Lima",
      authorAvatar: "J",
      text: "Ansiosa pra ver o meu!",
      createdAt: "1 hora atrás",
    },
  ],
};

export function addComment(postId: string, text: string) {
  if (!postComments[postId]) postComments[postId] = [];
  const comment: MockPostComment = {
    id: "pc_" + Date.now(),
    postId,
    author: "Você",
    authorAvatar: "V",
    text,
    createdAt: "agora",
  };
  postComments[postId].unshift(comment);
  const all = [...userPosts, ...posts];
  const found = all.find((p) => p.id === postId);
  if (found) found.comments = (found.comments || 0) + 1;
}

export function updateComment(commentId: string, text: string) {
  for (const arr of Object.values(postComments)) {
    const c = arr.find((cm) => cm.id === commentId);
    if (c) {
      c.text = text;
      c.editedAt = "agora";
      return;
    }
  }
}

export function deleteComment(commentId: string, postId: string) {
  const arr = postComments[postId];
  if (!arr) return;
  const idx = arr.findIndex((c) => c.id === commentId);
  if (idx !== -1) {
    arr.splice(idx, 1);
    const all = [...userPosts, ...posts];
    const found = all.find((p) => p.id === postId);
    if (found) found.comments = Math.max(0, (found.comments || 0) - 1);
  }
}

export function getPostComments(postId: string): MockPostComment[] {
  return postComments[postId] || [];
}

export const userPosts: MockPost[] = [];

export function addUserPost(post: MockPost) {
  userPosts.unshift(post);
}

export function updatePost(id: string, data: { title?: string; caption?: string }) {
  const all = [...userPosts, ...posts];
  const found = all.find((p) => p.id === id);
  if (!found) return;
  if (data.caption !== undefined) found.caption = data.caption;
  if (data.title !== undefined) {
    found.community = { ...found.community, name: data.title };
  }
}

export function deletePost(id: string) {
  const ui = userPosts.findIndex((p) => p.id === id);
  if (ui !== -1) userPosts.splice(ui, 1);
  const pi = posts.findIndex((p) => p.id === id);
  if (pi !== -1) posts.splice(pi, 1);
}

export function getAllPosts(): MockPost[] {
  return [...userPosts, ...posts];
}

export const userConversations: MockConversation[] = [];

export function addUserConversation(conv: MockConversation) {
  userConversations.unshift(conv);
}

export function getAllConversations(): MockConversation[] {
  return [...userConversations, ...conversations];
}

export function addConversationComment(conversationId: string, text: string) {
  const comment: MockConversationComment = {
    id: "cc_" + Date.now(),
    conversationId,
    author: "Você",
    authorAvatar: "V",
    text,
    likes: 0,
    createdAt: "agora",
    replies: [],
  };
  conversationComments.unshift(comment);
  const all = [...userConversations, ...conversations];
  const found = all.find((c) => c.id === conversationId);
  if (found) found.replies = (found.replies || 0) + 1;
}

export function updateConversationComment(commentId: string, text: string) {
  const c = conversationComments.find((cm) => cm.id === commentId);
  if (c) {
    c.text = text;
  }
}

export function deleteConversationComment(commentId: string, conversationId: string) {
  const idx = conversationComments.findIndex((c) => c.id === commentId);
  if (idx !== -1) {
    conversationComments.splice(idx, 1);
    const all = [...userConversations, ...conversations];
    const found = all.find((c) => c.id === conversationId);
    if (found) found.replies = Math.max(0, (found.replies || 0) - 1);
  }
}

export function getConversationComments(conversationId: string): MockConversationComment[] {
  return conversationComments.filter((c) => c.conversationId === conversationId);
}
