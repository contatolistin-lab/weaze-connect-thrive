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
  commentsEnabled?: boolean;
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

// ---- Groups (Private Messaging System) ----

export const currentUserId = "u_você";
export const currentUserName = "Você";
export const currentUserAvatar = "V";

export interface MockGroup {
  id: string;
  name: string;
  description: string;
  image: string;
  memberCount: number;
  createdAt: string;
  createdBy: string;
  createdByName: string;
  lastActivity?: string;
  inviteCode?: string;
}

export interface MockGroupMember {
  id: string;
  groupId: string;
  userId: string;
  name: string;
  avatar: string;
  role: "admin" | "member";
  joinedAt: string;
}

export interface MockGroupMessage {
  id: string;
  groupId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  text: string;
  createdAt: string;
  isPinned?: boolean;
}

export const groups: MockGroup[] = [
  {
    id: "g1",
    name: "VIP Corrida",
    description:
      "Grupo exclusivo para membros premium do Nike Run Club. Treinos, desafios e novidades em primeira mão.",
    image: "🏃",
    memberCount: 12,
    createdAt: "15 jan",
    createdBy: "u_nike",
    createdByName: "Nike Run Club",
    lastActivity: "2m",
    inviteCode: "CORRIDA2025",
  },
  {
    id: "g2",
    name: "Devs Indie",
    description:
      "Networking e mentoria para devs independentes. Side projects, freelas e colaborações.",
    image: "💻",
    memberCount: 8,
    createdAt: "20 jan",
    createdBy: "u_maria",
    createdByName: "Maria",
    lastActivity: "15m",
    inviteCode: "DEVS123",
  },
  {
    id: "g3",
    name: "Skincare Club",
    description:
      "Grupo VIP de skincare com dicas exclusivas, lançamentos e consultoria personalizada.",
    image: "✨",
    memberCount: 15,
    createdAt: "5 fev",
    createdBy: "u_stone",
    createdByName: "Stone Beauty",
    lastActivity: "1h",
    inviteCode: "SKINVIP",
  },
  {
    id: "g4",
    name: "Mentoria WEAZE",
    description:
      "Mentoria exclusiva para criadores de comunidade. Estratégias de crescimento e engajamento.",
    image: "🚀",
    memberCount: 5,
    createdAt: "1 mar",
    createdBy: "u_weaze",
    createdByName: "WEAZE",
    lastActivity: "3h",
    inviteCode: "MENTORIA",
  },
];

export const groupMembers: MockGroupMember[] = [
  {
    id: "gm1",
    groupId: "g1",
    userId: "u_nike",
    name: "Nike Run Club",
    avatar: "N",
    role: "admin",
    joinedAt: "15 jan",
  },
  {
    id: "gm2",
    groupId: "g1",
    userId: "u_você",
    name: "Você",
    avatar: "V",
    role: "member",
    joinedAt: "15 jan",
  },
  {
    id: "gm3",
    groupId: "g1",
    userId: "u_ana",
    name: "Ana Beatriz",
    avatar: "A",
    role: "member",
    joinedAt: "15 jan",
  },
  {
    id: "gm4",
    groupId: "g1",
    userId: "u_pedro",
    name: "Pedro Santos",
    avatar: "P",
    role: "member",
    joinedAt: "16 jan",
  },
  {
    id: "gm5",
    groupId: "g1",
    userId: "u_lucas",
    name: "Lucas Oliveira",
    avatar: "L",
    role: "member",
    joinedAt: "16 jan",
  },
  {
    id: "gm6",
    groupId: "g2",
    userId: "u_maria",
    name: "Maria",
    avatar: "M",
    role: "admin",
    joinedAt: "20 jan",
  },
  {
    id: "gm7",
    groupId: "g2",
    userId: "u_você",
    name: "Você",
    avatar: "V",
    role: "member",
    joinedAt: "20 jan",
  },
  {
    id: "gm8",
    groupId: "g2",
    userId: "u_tiago",
    name: "Tiago",
    avatar: "T",
    role: "member",
    joinedAt: "21 jan",
  },
  {
    id: "gm9",
    groupId: "g2",
    userId: "u_rafael",
    name: "Rafael Costa",
    avatar: "R",
    role: "member",
    joinedAt: "22 jan",
  },
  {
    id: "gm10",
    groupId: "g3",
    userId: "u_stone",
    name: "Stone Beauty",
    avatar: "S",
    role: "admin",
    joinedAt: "5 fev",
  },
  {
    id: "gm11",
    groupId: "g3",
    userId: "u_você",
    name: "Você",
    avatar: "V",
    role: "member",
    joinedAt: "5 fev",
  },
  {
    id: "gm12",
    groupId: "g3",
    userId: "u_julia",
    name: "Júlia Lima",
    avatar: "J",
    role: "member",
    joinedAt: "5 fev",
  },
  {
    id: "gm13",
    groupId: "g3",
    userId: "u_beatriz",
    name: "Beatriz Rocha",
    avatar: "B",
    role: "member",
    joinedAt: "6 fev",
  },
  {
    id: "gm14",
    groupId: "g4",
    userId: "u_weaze",
    name: "WEAZE",
    avatar: "W",
    role: "admin",
    joinedAt: "1 mar",
  },
  {
    id: "gm15",
    groupId: "g4",
    userId: "u_você",
    name: "Você",
    avatar: "V",
    role: "member",
    joinedAt: "1 mar",
  },
  {
    id: "gm16",
    groupId: "g4",
    userId: "u_ana",
    name: "Ana Beatriz",
    avatar: "A",
    role: "member",
    joinedAt: "1 mar",
  },
  {
    id: "gm17",
    groupId: "g4",
    userId: "u_pedro",
    name: "Pedro Santos",
    avatar: "P",
    role: "member",
    joinedAt: "2 mar",
  },
];

export const groupMessages: MockGroupMessage[] = [
  {
    id: "msg1",
    groupId: "g1",
    authorId: "u_nike",
    authorName: "Nike Run Club",
    authorAvatar: "N",
    text: "Bem-vindos ao grupo VIP Corrida! 🏃 Aqui vocês terão acesso a treinos exclusivos, desafios semanais e lançamentos antes de todo mundo.",
    createdAt: "15 jan",
  },
  {
    id: "msg2",
    groupId: "g1",
    authorId: "u_você",
    authorName: "Você",
    authorAvatar: "V",
    text: "Que honra fazer parte! 🔥 Mal posso esperar pelos desafios.",
    createdAt: "15 jan",
  },
  {
    id: "msg3",
    groupId: "g1",
    authorId: "u_ana",
    authorName: "Ana Beatriz",
    authorAvatar: "A",
    text: "Oii pessoal! Também estou super animada 🙌",
    createdAt: "15 jan",
  },
  {
    id: "msg4",
    groupId: "g1",
    authorId: "u_nike",
    authorName: "Nike Run Club",
    authorAvatar: "N",
    text: "📌 Desafio da semana: 5km em pace 5:30. Quem topa?",
    createdAt: "16 jan",
    isPinned: true,
  },
  {
    id: "msg5",
    groupId: "g1",
    authorId: "u_pedro",
    authorName: "Pedro Santos",
    authorAvatar: "P",
    text: "Topo! Vou tentar amanhã cedo.",
    createdAt: "16 jan",
  },
  {
    id: "msg6",
    groupId: "g1",
    authorId: "u_lucas",
    authorName: "Lucas Oliveira",
    authorAvatar: "L",
    text: "Bora! Também vou.",
    createdAt: "16 jan",
  },
  {
    id: "msg7",
    groupId: "g1",
    authorId: "u_nike",
    authorName: "Nike Run Club",
    authorAvatar: "N",
    text: "E aí, como foi o desafio de hoje? 👟",
    createdAt: "2m",
  },
  {
    id: "msg8",
    groupId: "g2",
    authorId: "u_maria",
    authorName: "Maria",
    authorAvatar: "M",
    text: "Bem-vindos ao Devs Indie! Vamos trocar ideias sobre side projects e freelas 💻",
    createdAt: "20 jan",
  },
  {
    id: "msg9",
    groupId: "g2",
    authorId: "u_tiago",
    authorName: "Tiago",
    authorAvatar: "T",
    text: "Fala galera! To desenvolvendo um SAAS de agendamento. Alguém já usou Next.js com Supabase?",
    createdAt: "21 jan",
  },
  {
    id: "msg10",
    groupId: "g2",
    authorId: "u_rafael",
    authorName: "Rafael Costa",
    authorAvatar: "R",
    text: "Usei num projeto recente. Recomendo demais! A integração é muito suave.",
    createdAt: "22 jan",
  },
  {
    id: "msg11",
    groupId: "g2",
    authorId: "u_maria",
    authorName: "Maria",
    authorAvatar: "M",
    text: "Gente, quem tiver interesse em participar de uma hackathon mês que vem, dá um like aqui! 🚀",
    createdAt: "15m",
  },
  {
    id: "msg12",
    groupId: "g3",
    authorId: "u_stone",
    authorName: "Stone Beauty",
    authorAvatar: "S",
    text: "Bem-vindas ao Skincare Club! 💄 Aqui vocês terão dicas exclusivas, lançamentos e consultoria personalizada.",
    createdAt: "5 fev",
  },
  {
    id: "msg13",
    groupId: "g3",
    authorId: "u_julia",
    authorName: "Júlia Lima",
    authorAvatar: "J",
    text: "Amei! Sempre quis um grupo assim 😍",
    createdAt: "5 fev",
  },
  {
    id: "msg14",
    groupId: "g3",
    authorId: "u_beatriz",
    authorName: "Beatriz Rocha",
    authorAvatar: "B",
    text: "Alguém já testou o novo sérum de vitamina C?",
    createdAt: "6 fev",
  },
  {
    id: "msg15",
    groupId: "g3",
    authorId: "u_stone",
    authorName: "Stone Beauty",
    authorAvatar: "S",
    text: "Acabou de chegar no nosso estoque! Quem quiser testar, temos amostras para o grupo 🎁",
    createdAt: "1h",
  },
  {
    id: "msg16",
    groupId: "g4",
    authorId: "u_weaze",
    authorName: "WEAZE",
    authorAvatar: "W",
    text: "Bem-vindos à Mentoria WEAZE! 🚀 Aqui vamos trabalhar estratégias de crescimento e engajamento para suas comunidades.",
    createdAt: "1 mar",
  },
  {
    id: "msg17",
    groupId: "g4",
    authorId: "u_ana",
    authorName: "Ana Beatriz",
    authorAvatar: "A",
    text: "Estou pronta pra aprender! Minha comunidade tem 200 membros e quero escalar.",
    createdAt: "1 mar",
  },
  {
    id: "msg18",
    groupId: "g4",
    authorId: "u_pedro",
    authorName: "Pedro Santos",
    authorAvatar: "P",
    text: "Mesma aqui! To com 150 membros ativos.",
    createdAt: "2 mar",
  },
  {
    id: "msg19",
    groupId: "g4",
    authorId: "u_weaze",
    authorName: "WEAZE",
    authorAvatar: "W",
    text: "📌 PRÓXIMA LIVE: Segunda 20h — Como engajar membros nos primeiros 30 dias",
    createdAt: "3h",
    isPinned: true,
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
  replies: { author: string; text: string; createdAt: string; likes: number }[];
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
    replies: [
      { author: "Rafael", text: "Vou testar! Obrigado pela dica.", createdAt: "30m", likes: 3 },
    ],
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
      {
        author: "Rafael",
        text: "Hoka parece interessante, vou pesquisar!",
        createdAt: "10m",
        likes: 5,
      },
      { author: "Carlos", text: "Vale cada centavo!", createdAt: "5m", likes: 8 },
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
    replies: [{ author: "Ana", text: "Clássico!ótima descoberta.", createdAt: "1h", likes: 12 }],
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
      {
        author: "Lucas",
        text: "Pois é, mas o ecossistema muda tão rápido...",
        createdAt: "12h",
        likes: 4,
      },
      {
        author: "Daniel",
        text: "Por isso React é seguro, tem décadas de mercado.",
        createdAt: "10h",
        likes: 7,
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
    replies: [{ author: "Júlia", text: "Exato! Menos é mais.", createdAt: "20h", likes: 15 }],
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

import type { UserActivity } from "./engagement-engine";

export const mockUserActivity: UserActivity[] = [
  {
    id: "u1",
    name: "Ana Beatriz",
    avatar: "A",
    likesReceived: 1200,
    commentsMade: 250,
    sharesReceived: 120,
    postsCount: 85,
    weeklyGrowth: 15,
    engagementRate: 12.5,
  },
  {
    id: "u2",
    name: "Rafael Costa",
    avatar: "R",
    likesReceived: 850,
    commentsMade: 180,
    sharesReceived: 90,
    postsCount: 60,
    weeklyGrowth: 22,
    engagementRate: 9.8,
  },
  {
    id: "u3",
    name: "Júlia Lima",
    avatar: "J",
    likesReceived: 720,
    commentsMade: 160,
    sharesReceived: 75,
    postsCount: 55,
    weeklyGrowth: 18,
    engagementRate: 11.2,
  },
  {
    id: "u4",
    name: "Pedro Santos",
    avatar: "P",
    likesReceived: 600,
    commentsMade: 140,
    sharesReceived: 60,
    postsCount: 45,
    weeklyGrowth: 25,
    engagementRate: 8.5,
  },
  {
    id: "u5",
    name: "Carla Dias",
    avatar: "C",
    likesReceived: 500,
    commentsMade: 120,
    sharesReceived: 50,
    postsCount: 40,
    weeklyGrowth: 12,
    engagementRate: 10.3,
  },
  {
    id: "u6",
    name: "Lucas Oliveira",
    avatar: "L",
    likesReceived: 420,
    commentsMade: 100,
    sharesReceived: 45,
    postsCount: 35,
    weeklyGrowth: 30,
    engagementRate: 7.8,
  },
  {
    id: "u7",
    name: "Fernanda Souza",
    avatar: "F",
    likesReceived: 420,
    commentsMade: 100,
    sharesReceived: 40,
    postsCount: 30,
    weeklyGrowth: 10,
    engagementRate: 9.1,
  },
  {
    id: "u8",
    name: "Marcos Paulo",
    avatar: "M",
    likesReceived: 300,
    commentsMade: 70,
    sharesReceived: 30,
    postsCount: 25,
    weeklyGrowth: 8,
    engagementRate: 6.5,
  },
  {
    id: "u9",
    name: "Beatriz Rocha",
    avatar: "B",
    likesReceived: 250,
    commentsMade: 60,
    sharesReceived: 25,
    postsCount: 20,
    weeklyGrowth: 14,
    engagementRate: 7.2,
  },
  {
    id: "u10",
    name: "Gabriel Martins",
    avatar: "G",
    likesReceived: 200,
    commentsMade: 50,
    sharesReceived: 20,
    postsCount: 18,
    weeklyGrowth: 5,
    engagementRate: 8.0,
  },
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

export function addComment(postId: string, text: string, authorName = "Você", authorAvatar = "V") {
  if (!postComments[postId]) postComments[postId] = [];
  const comment: MockPostComment = {
    id: "pc_" + Date.now(),
    postId,
    author: authorName,
    authorAvatar,
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

let fallbackIdCounter = 0;

function toRecord(value: unknown): Partial<MockConversation> & { id?: string } {
  return value && typeof value === "object" ? (value as Partial<MockConversation> & { id?: string }) : {};
}

function toCount(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function normalizeTags(value: unknown): string[] {
  const items = Array.isArray(value) ? value : typeof value === "string" ? value.split(",") : [];
  return items
    .map((tag) => (typeof tag === "string" ? tag.trim() : ""))
    .filter(Boolean);
}

function ensureValidId(input: unknown): string {
  const conv = toRecord(input);
  if (typeof conv.id === "string" && conv.id.trim()) return conv.id.trim();
  fallbackIdCounter++;
  return "ucv_fallback_" + fallbackIdCounter;
}

function normalizeConversation(input: unknown): MockConversation {
  const conv = toRecord(input);
  const title = typeof conv.title === "string" && conv.title.trim() ? conv.title.trim() : "Nova conversa";
  const author = typeof conv.author === "string" && conv.author.trim() ? conv.author.trim() : "Você";

  return {
    id: ensureValidId(input),
    title,
    description: typeof conv.description === "string" ? conv.description : "",
    category: typeof conv.category === "string" && conv.category.trim() ? conv.category : "Geral",
    author,
    authorAvatar:
      typeof conv.authorAvatar === "string" && conv.authorAvatar.trim()
        ? conv.authorAvatar.trim().charAt(0).toUpperCase()
        : author.charAt(0).toUpperCase() || "V",
    replies: toCount(conv.replies),
    likes: toCount(conv.likes),
    views: toCount(conv.views),
    pinned: Boolean(conv.pinned),
    trending: Boolean(conv.trending),
    createdAt: typeof conv.createdAt === "string" && conv.createdAt.trim() ? conv.createdAt : "agora",
    lastActivity:
      typeof conv.lastActivity === "string" && conv.lastActivity.trim() ? conv.lastActivity : "agora",
    tags: normalizeTags(conv.tags),
  };
}

export function addUserConversation(conv: Partial<MockConversation>) {
  userConversations.unshift(normalizeConversation(conv));
}

export function getAllConversations(): MockConversation[] {
  return [...userConversations, ...conversations];
}

export function togglePinConversation(id: string) {
  const all = [...userConversations, ...conversations];
  const conv = all.find((c) => c.id === id);
  if (conv) {
    conv.pinned = !conv.pinned;
  }
}

export function deleteConversation(id: string) {
  const idx = userConversations.findIndex((c) => c.id === id);
  if (idx !== -1) {
    userConversations.splice(idx, 1);
    return;
  }
  const idx2 = conversations.findIndex((c) => c.id === id);
  if (idx2 !== -1) conversations.splice(idx2, 1);
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

export function getConversation(id: string): MockConversation | undefined {
  const conversation = [...userConversations, ...conversations].find((c) => c.id === id);
  return conversation ? normalizeConversation(conversation) : undefined;
}

export function likeConversation(id: string) {
  const c = [...userConversations, ...conversations].find((x) => x.id === id);
  if (c) c.likes += 1;
}

export function unlikeConversation(id: string) {
  const c = [...userConversations, ...conversations].find((x) => x.id === id);
  if (c) c.likes = Math.max(0, c.likes - 1);
}

const viewedConversations = new Set<string>();

export function viewConversation(id: string) {
  if (viewedConversations.has(id)) return;
  viewedConversations.add(id);
  const c = [...userConversations, ...conversations].find((x) => x.id === id);
  if (c) c.views += 1;
}

// ---- Groups ----

export const userGroupIds: string[] = [];
export const groupInviteCodes: Record<string, string> = {
  g1: "CORRIDA2025",
  g2: "DEVS123",
  g3: "SKINVIP",
  g4: "MENTORIA",
};

const STORAGE_KEY = "weaze_groups_persist";

function persistGroups() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        groups,
        groupMembers,
        groupMessages,
        userGroupIds,
        groupInviteCodes,
      }),
    );
  } catch {}
}

function restoreGroups() {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    groups.length = 0;
    groups.push(...saved.groups);
    groupMembers.length = 0;
    groupMembers.push(...saved.groupMembers);
    groupMessages.length = 0;
    groupMessages.push(...saved.groupMessages);
    userGroupIds.length = 0;
    userGroupIds.push(...saved.userGroupIds);
    Object.keys(groupInviteCodes).forEach((k) => delete groupInviteCodes[k]);
    Object.assign(groupInviteCodes, saved.groupInviteCodes);
  } catch {}
}

restoreGroups();

export function isGroupMember(groupId: string): boolean {
  return userGroupIds.includes(groupId);
}

export function joinGroup(groupId: string) {
  if (!userGroupIds.includes(groupId)) {
    userGroupIds.push(groupId);
    const g = groups.find((x) => x.id === groupId);
    if (g) g.memberCount += 1;
    if (!groupMembers.some((m) => m.groupId === groupId && m.userId === currentUserId)) {
      groupMembers.push({
        id: "gm_" + Date.now(),
        groupId,
        userId: currentUserId,
        name: currentUserName,
        avatar: currentUserAvatar,
        role: "member",
        joinedAt: "agora",
      });
    }
  }
  persistGroups();
}

export function joinGroupExclusive(groupId: string) {
  // Remove B2C user from all other groups
  const currentGroups = groups.filter((g) => userGroupIds.includes(g.id));
  for (const g of currentGroups) {
    g.memberCount = Math.max(1, g.memberCount - 1);
  }
  for (let i = groupMembers.length - 1; i >= 0; i--) {
    if (groupMembers[i].userId === currentUserId) {
      groupMembers.splice(i, 1);
    }
  }
  userGroupIds.length = 0;

  // Join only the invited group
  userGroupIds.push(groupId);
  const g = groups.find((x) => x.id === groupId);
  if (g) g.memberCount += 1;
  groupMembers.push({
    id: "gm_" + Date.now(),
    groupId,
    userId: currentUserId,
    name: currentUserName,
    avatar: currentUserAvatar,
    role: "member",
    joinedAt: "agora",
  });
  persistGroups();
}

export function leaveGroup(groupId: string) {
  const idx = userGroupIds.indexOf(groupId);
  if (idx !== -1) {
    userGroupIds.splice(idx, 1);
    const g = groups.find((x) => x.id === groupId);
    if (g) g.memberCount = Math.max(1, g.memberCount - 1);
    const mIdx = groupMembers.findIndex((m) => m.groupId === groupId && m.userId === currentUserId);
    if (mIdx !== -1) groupMembers.splice(mIdx, 1);
  }
  persistGroups();
}

export function createGroup(input: { name: string; description: string; image: string }) {
  const id = "g_" + Date.now();
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  const now = new Date().toLocaleDateString("pt-BR", { day: "numeric", month: "short" });

  groups.push({
    id,
    name: input.name,
    description: input.description,
    image: input.image || "👥",
    memberCount: 1,
    createdAt: "agora",
    createdBy: currentUserId,
    createdByName: currentUserName,
    inviteCode: code,
  });

  groupMembers.push({
    id: "gm_" + Date.now(),
    groupId: id,
    userId: currentUserId,
    name: currentUserName,
    avatar: currentUserAvatar,
    role: "admin",
    joinedAt: "agora",
  });

  userGroupIds.push(id);
  groupInviteCodes[id] = code;

  persistGroups();
  return { id, inviteCode: code };
}

export function getGroupByInviteCode(code: string): MockGroup | undefined {
  const entry = Object.entries(groupInviteCodes).find(([, v]) => v === code);
  if (!entry) return undefined;
  return groups.find((g) => g.id === entry[0]);
}

export function getMyGroups(): MockGroup[] {
  return groups.filter((g) => userGroupIds.includes(g.id));
}

export function getGroup(id: string): MockGroup | undefined {
  return groups.find((g) => g.id === id);
}

export function getGroupMembers(groupId: string): MockGroupMember[] {
  return groupMembers.filter((m) => m.groupId === groupId);
}

export function getGroupMessages(groupId: string): MockGroupMessage[] {
  return groupMessages.filter((m) => m.groupId === groupId);
}

export function getPinnedMessage(groupId: string): MockGroupMessage | undefined {
  return groupMessages.find((m) => m.groupId === groupId && m.isPinned);
}

export function sendMessage(groupId: string, text: string) {
  const msg: MockGroupMessage = {
    id: "msg_" + Date.now(),
    groupId,
    authorId: currentUserId,
    authorName: currentUserName,
    authorAvatar: currentUserAvatar,
    text,
    createdAt: "agora",
  };
  groupMessages.push(msg);
  const g = groups.find((x) => x.id === groupId);
  if (g) g.lastActivity = "agora";
  persistGroups();
  return msg;
}

export function pinMessage(groupId: string, messageId: string) {
  groupMessages.forEach((m) => {
    if (m.groupId === groupId) m.isPinned = false;
  });
  const msg = groupMessages.find((m) => m.id === messageId);
  if (msg) msg.isPinned = true;
  persistGroups();
}

export function unpinMessage(groupId: string) {
  groupMessages.forEach((m) => {
    if (m.groupId === groupId) m.isPinned = false;
  });
  persistGroups();
}

export function removeMember(groupId: string, userId: string) {
  const idx = groupMembers.findIndex((m) => m.groupId === groupId && m.userId === userId);
  if (idx !== -1) {
    groupMembers.splice(idx, 1);
    const g = groups.find((x) => x.id === groupId);
    if (g) g.memberCount = Math.max(1, g.memberCount - 1);
  }
  persistGroups();
}
