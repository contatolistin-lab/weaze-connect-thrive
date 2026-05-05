export type AccessStatus = "none" | "pending" | "approved" | "rejected";

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
  
  const key = `notifications_b2b_${tenantId}`;
  const notifications: B2BNotification[] = JSON.parse(localStorage.getItem(key) || "[]");
  
  notifications.push({
    type: "request_access",
    userId,
    userName,
    userEmail,
    slug,
    tenantId,
    createdAt: new Date().toISOString()
  });
  
  localStorage.setItem(key, JSON.stringify(notifications));
};

export const approveAccess = (slug: string, userId: string, tenantId: string, tenantName: string): void => {
  if (typeof window === "undefined") return;
  
  setAccessStatus(slug, userId, "approved");
  
  const key = `notifications_b2c_${userId}`;
  const notifications: B2CNotification[] = JSON.parse(localStorage.getItem(key) || "[]");
  
  notifications.push({
    type: "approved",
    slug,
    tenantName,
    message: "Seu acesso foi aprovado",
    createdAt: new Date().toISOString()
  });
  
  localStorage.setItem(key, JSON.stringify(notifications));
};

export const rejectAccess = (slug: string, userId: string, tenantId: string, tenantName: string): void => {
  if (typeof window === "undefined") return;
  
  setAccessStatus(slug, userId, "rejected");
  
  const key = `notifications_b2c_${userId}`;
  const notifications: B2CNotification[] = JSON.parse(localStorage.getItem(key) || "[]");
  
  notifications.push({
    type: "rejected",
    slug,
    tenantName,
    message: "Seu acesso foi recusado",
    createdAt: new Date().toISOString()
  });
  
  localStorage.setItem(key, JSON.stringify(notifications));
};

export const getB2BNotifications = (tenantId: string): B2BNotification[] => {
  if (typeof window === "undefined") return [];
  return JSON.parse(localStorage.getItem(`notifications_b2b_${tenantId}`) || "[]");
};

export const getB2CNotifications = (userId: string): B2CNotification[] => {
  if (typeof window === "undefined") return [];
  return JSON.parse(localStorage.getItem(`notifications_b2c_${userId}`) || "[]");
};

export const clearB2BNotifications = (tenantId: string): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(`notifications_b2b_${tenantId}`);
};

export const clearUserAccessStatus = (slug: string, userId: string): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(getAccessKey(slug, userId));
};