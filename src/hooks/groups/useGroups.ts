import { useState, useCallback } from "react";
import { groupsService, Group } from "@/services/groupsService";

export function useGroups(tenantId: string | null) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadGroups = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);

    try {
      const result = await groupsService.list(tenantId);

      if (result.error) {
        setError(result.error);
        setGroups([]);
      } else {
        setGroups(result.data);
      }
    } catch (err) {
      console.error("[useGroups] Error loading groups:", err);
      setError("Erro inesperado ao carregar grupos");
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  const createGroup = useCallback(
    async (
      userId: string,
      name: string,
      type: "private" | "internal"
    ): Promise<{ success: boolean; groupId?: string; error?: string }> => {
      if (!tenantId) return { success: false, error: "Tenant não definido" };

      const result = await groupsService.create(tenantId, userId, name, type);

      if (result.error) {
        return { success: false, error: result.error };
      }

      if (result.data) {
        setGroups((prev) => [result.data!, ...prev]);
      }

      return { success: true, groupId: result.data?.id };
    },
    [tenantId]
  );

  const deleteGroup = useCallback(
    async (groupId: string): Promise<{ success: boolean; error?: string }> => {
      const result = await groupsService.delete(groupId);

      if (result.error) {
        return { success: false, error: result.error };
      }

      setGroups((prev) => prev.filter((g) => g.id !== groupId));
      return { success: true };
    },
    []
  );

  return {
    groups,
    loading,
    error,
    loadGroups,
    createGroup,
    deleteGroup,
  };
}