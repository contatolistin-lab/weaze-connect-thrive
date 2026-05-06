export type AccessStatus = "none" | "pending" | "approved" | "rejected";

export type GlobalAccessRequest = {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string;
  brandId: string;
  slug: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
};

export type B2BNotification = {
  type: "request_access";
  userId: string;
  userName: string | null;
  userEmail: string;
  slug: string;
  tenantId: string;
  createdAt: string;
};

export type B2CNotification = {
  type: "approved" | "rejected";
  slug: string;
  tenantName: string;
  message: string;
  createdAt: string;
};

const GLOBAL_KEY = "global_access_requests";
const getAccessKey = (slug: string, userId: string) => `access_status_${slug}_${userId}`;

export const getAccessStatus = (slug: string, userId: string): AccessStatus => {
  if (typeof window === "undefined") return "none";
  const status = localStorage.getItem(getAccessKey(slug, userId));
  if (status === "pending" || status === "approved" || status === "rejected") {
    return status;
  }
  return "none";
};

export const setAccessStatus = (slug: string, userId: string, status: AccessStatus): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem(getAccessKey(slug, userId), status);
};

export const requestAccess = (slug: string, userId: string, userName: string | null, userEmail: string, tenantId: string): void => {
  if (typeof window === "undefined") return;
  
  setAccessStatus(slug, userId, "pending");
  
  let requests: GlobalAccessRequest[] = [];
  try {
    const stored = localStorage.getItem(GLOBAL_KEY);
    requests = stored ? JSON.parse(stored) : [];
  } catch (e) {
    requests = [];
  }
  
  const newRequest: GlobalAccessRequest = {
    id: Date.now().toString(),
    userId,
    userName,
    userEmail,
    brandId: tenantId,
    slug,
    status: "pending",
    createdAt: new Date().toISOString()
  };
  
  requests.unshift(newRequest);
  localStorage.setItem(GLOBAL_KEY, JSON.stringify(requests));
  
  console.log("Solicitação global adicionada:", newRequest);
  console.log("Total de solicitações:", requests.length);
};

export const approveAccess = (slug: string, userId: string, tenantId: string, tenantName: string = ""): void => {
  if (typeof window === "undefined") return;
  
  setAccessStatus(slug, userId, "approved");
  
  let requests: GlobalAccessRequest[] = [];
  try {
    const stored = localStorage.getItem(GLOBAL_KEY);
    requests = stored ? JSON.parse(stored) : [];
  } catch (e) {
    requests = [];
  }
  
  const updated = requests.map((item) => {
    if (item.slug === slug && item.userId === userId && item.brandId === tenantId) {
      return { ...item, status: "approved" as const };
    }
    return item;
  });
  
  localStorage.setItem(GLOBAL_KEY, JSON.stringify(updated));
  console.log("Acesso aprovado em global_access_requests");
};

export const rejectAccess = (slug: string, userId: string, tenantId: string, tenantName: string = ""): void => {
  if (typeof window === "undefined") return;
  
  setAccessStatus(slug, userId, "rejected");
  
  let requests: GlobalAccessRequest[] = [];
  try {
    const stored = localStorage.getItem(GLOBAL_KEY);
    requests = stored ? JSON.parse(stored) : [];
  } catch (e) {
    requests = [];
  }
  
  const updated = requests.map((item) => {
    if (item.slug === slug && item.userId === userId && item.brandId === tenantId) {
      return { ...item, status: "rejected" as const };
    }
    return item;
  });
  
  localStorage.setItem(GLOBAL_KEY, JSON.stringify(updated));
  console.log("Acesso recusado em global_access_requests");
};

export const getB2BNotifications = (tenantId: string): B2BNotification[] => {
  if (typeof window === "undefined") return [];
  
  console.log("=== getB2BNotifications DEBUG ===");
  console.log("Buscando para tenantId:", tenantId);
  
  try {
    const stored = localStorage.getItem(GLOBAL_KEY);
    const requests: GlobalAccessRequest[] = stored ? JSON.parse(stored) : [];
    
    console.log("Total global requests:", requests.length);
    
    const filtered = requests.filter(item => 
      item.brandId === tenantId && item.status === "pending"
    );
    
    console.log("Encontradas:", filtered.length);
    
    return filtered.map(item => ({
      type: "request_access" as const,
      userId: item.userId,
      userName: item.userName,
      userEmail: item.userEmail,
      slug: item.slug,
      tenantId: item.brandId,
      createdAt: item.createdAt
    }));
  } catch (error) {
    console.error("Erro ao buscar notificações B2B:", error);
    return [];
  }
};

export const getB2CNotifications = (userId: string): B2CNotification[] => {
  if (typeof window === "undefined") return [];
  
  console.log("=== getB2CNotifications DEBUG ===");
  console.log("Buscando para userId:", userId);
  
  try {
    const stored = localStorage.getItem(GLOBAL_KEY);
    const requests: GlobalAccessRequest[] = stored ? JSON.parse(stored) : [];
    
    console.log("Total global requests:", requests.length);
    
    const filtered = requests.filter(item => 
      item.userId === userId && item.status !== "pending"
    );
    
    console.log("Encontradas:", filtered.length);
    
    return filtered.map(item => ({
      type: item.status === "approved" ? "approved" as const : "rejected" as const,
      slug: item.slug,
      tenantName: item.brandId,
      message: item.status === "approved" 
        ? "Seu acesso foi aprovado" 
        : "Seu acesso foi recusado",
      createdAt: item.createdAt
    }));
  } catch (error) {
    console.error("Erro ao buscar notificações B2C:", error);
    return [];
  }
};

export const clearB2BNotifications = (tenantId: string): void => {
  if (typeof window === "undefined") return;
  // Não precisa limpar nada, usa a estrutura global
};

export const clearUserAccessStatus = (slug: string, userId: string): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(getAccessKey(slug, userId));
};

export const addGlobalRequest = (userId: string, userName: string | null, userEmail: string, brandId: string, slug: string): void => {
  if (typeof window === "undefined") return;
  
  let requests: GlobalAccessRequest[] = [];
  try {
    const stored = localStorage.getItem(GLOBAL_KEY);
    requests = stored ? JSON.parse(stored) : [];
  } catch (e) {
    requests = [];
  }
  
  const newRequest: GlobalAccessRequest = {
    id: Date.now().toString(),
    userId,
    userName,
    userEmail,
    brandId,
    slug,
    status: "pending",
    createdAt: new Date().toISOString()
  };
  
  requests.unshift(newRequest);
  localStorage.setItem(GLOBAL_KEY, JSON.stringify(requests));
  console.log("Solicitação global adicionada (addGlobalRequest):", newRequest);
};

export const getRequestsByBrandId = (brandId: string): GlobalAccessRequest[] => {
  if (typeof window === "undefined") return [];
  
  try {
    const stored = localStorage.getItem(GLOBAL_KEY);
    const requests: GlobalAccessRequest[] = stored ? JSON.parse(stored) : [];
    return requests.filter(r => r.brandId === brandId);
  } catch (e) {
    return [];
  }
};

export const getAllRequestsByBrandIds = (brandIds: string[]): GlobalAccessRequest[] => {
  if (typeof window === "undefined") return [];
  
  try {
    const stored = localStorage.getItem(GLOBAL_KEY);
    const requests: GlobalAccessRequest[] = stored ? JSON.parse(stored) : [];
    return requests.filter(r => brandIds.includes(r.brandId));
  } catch (e) {
    return [];
  }
};

export const updateRequestStatus = (requestId: string, newStatus: "approved" | "rejected"): void => {
  if (typeof window === "undefined") return;
  
  let requests: GlobalAccessRequest[] = [];
  try {
    const stored = localStorage.getItem(GLOBAL_KEY);
    requests = stored ? JSON.parse(stored) : [];
  } catch (e) {
    return;
  }
  
  const updated = requests.map(r => {
    if (r.id === requestId) {
      return { ...r, status: newStatus };
    }
    return r;
  });
  
  localStorage.setItem(GLOBAL_KEY, JSON.stringify(updated));
  console.log("Status atualizado para:", newStatus);
};

export const getUserRequests = (userId: string): GlobalAccessRequest[] => {
  if (typeof window === "undefined") return [];
  
  try {
    const stored = localStorage.getItem(GLOBAL_KEY);
    const requests: GlobalAccessRequest[] = stored ? JSON.parse(stored) : [];
    return requests.filter(r => r.userId === userId);
  } catch (e) {
    return [];
  }
};