/**
 * Generic CRUD operations hook for consistent data management patterns
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "./use-toast";
import { TOAST_MESSAGES } from "@/lib/constants";

interface CrudOptions<T> {
  entityName: string;
  baseEndpoint: string;
  queryKey: string | string[];
  onSuccess?: (data: T, operation: 'create' | 'update' | 'delete') => void;
  onError?: (error: any, operation: 'create' | 'update' | 'delete') => void;
}

export function useCrudOperations<T = any, CreateData = any, UpdateData = any>(
  options: CrudOptions<T>
) {
  const { entityName, baseEndpoint, queryKey, onSuccess, onError } = options;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ 
      queryKey: Array.isArray(queryKey) ? queryKey : [queryKey] 
    });
  };

  const createMutation = useMutation({
    mutationFn: async (data: CreateData): Promise<T> => {
      const res = await apiRequest(baseEndpoint, "POST", data);
      return res.json();
    },
    onSuccess: (data) => {
      invalidateQueries();
      toast({ 
        title: TOAST_MESSAGES.SUCCESS.CREATE, 
        description: `${entityName} đã được thêm thành công` 
      });
      onSuccess?.(data, 'create');
    },
    onError: (error: any) => {
      toast({
        title: TOAST_MESSAGES.ERROR.CREATE,
        description: error.message || `Có lỗi xảy ra khi thêm ${entityName}`,
        variant: "destructive",
      });
      onError?.(error, 'create');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateData }): Promise<T> => {
      const res = await apiRequest(`${baseEndpoint}/${id}`, "PUT", data);
      return res.json();
    },
    onSuccess: (data) => {
      invalidateQueries();
      toast({ 
        title: TOAST_MESSAGES.SUCCESS.UPDATE, 
        description: `${entityName} đã được cập nhật thành công` 
      });
      onSuccess?.(data, 'update');
    },
    onError: (error: any) => {
      toast({
        title: TOAST_MESSAGES.ERROR.UPDATE,
        description: error.message || `Có lỗi xảy ra khi cập nhật ${entityName}`,
        variant: "destructive",
      });
      onError?.(error, 'update');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await apiRequest(`${baseEndpoint}/${id}`, "DELETE");
    },
    onSuccess: (_, id) => {
      invalidateQueries();
      toast({ 
        title: TOAST_MESSAGES.SUCCESS.DELETE, 
        description: `${entityName} đã được xóa thành công` 
      });
      onSuccess?.(id as any, 'delete');
    },
    onError: (error: any) => {
      toast({
        title: TOAST_MESSAGES.ERROR.DELETE,
        description: error.message || `Có lỗi xảy ra khi xóa ${entityName}`,
        variant: "destructive",
      });
      onError?.(error, 'delete');
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]): Promise<void> => {
      await Promise.all(ids.map(id => apiRequest(`${baseEndpoint}/${id}`, "DELETE")));
    },
    onSuccess: (_, ids) => {
      invalidateQueries();
      toast({ 
        title: TOAST_MESSAGES.SUCCESS.DELETE, 
        description: `Đã xóa ${ids.length} ${entityName} thành công` 
      });
    },
    onError: (error: any) => {
      toast({
        title: TOAST_MESSAGES.ERROR.DELETE,
        description: error.message || `Có lỗi xảy ra khi xóa ${entityName}`,
        variant: "destructive",
      });
    },
  });

  return {
    create: createMutation,
    update: updateMutation,
    delete: deleteMutation,
    bulkDelete: bulkDeleteMutation,
    isLoading: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
  };
}