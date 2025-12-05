import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/client';

// ===== BATCHES =====

export const useBatches = (params = {}) => {
  return useQuery({
    queryKey: ['batches', params],
    queryFn: () => api.getBatches(params),
  });
};

export const useBatch = (id) => {
  return useQuery({
    queryKey: ['batch', id],
    queryFn: () => api.getBatch(id),
    enabled: !!id,
  });
};

export const useCreateBatch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createBatch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
};

export const useUpdateBatch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => api.updateBatch(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      queryClient.invalidateQueries({ queryKey: ['batch', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
};

export const useDeleteBatch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteBatch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
};

export const useBulkArchiveBatches = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.bulkArchiveBatches,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
};

export const useBulkDeleteBatches = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.bulkDeleteBatches,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
};

// ===== STATISTICS =====

export const useStats = (strain) => {
  return useQuery({
    queryKey: ['stats', strain],
    queryFn: () => api.getStats(strain),
  });
};

export const useNextColonization = () => {
  return useQuery({
    queryKey: ['next-colonization'],
    queryFn: api.getNextColonization,
    retry: false, // Don't retry if no batches found
  });
};

export const usePredictColonization = () => {
  return useMutation({
    mutationFn: api.predictColonization,
  });
};

// ===== LC CULTURES =====

export const useLCCultures = (params = {}) => {
  return useQuery({
    queryKey: ['lc-cultures', params],
    queryFn: () => api.getLCCultures(params),
  });
};

export const useCreateLCCulture = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createLCCulture,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lc-cultures'] });
    },
  });
};

export const useUpdateLCCulture = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ lcCode, data }) => api.updateLCCulture(lcCode, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lc-cultures'] });
    },
  });
};

export const useDeleteLCCulture = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteLCCulture,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lc-cultures'] });
    },
  });
};

// ===== TEMPLATES =====

export const useTemplates = (strain) => {
  return useQuery({
    queryKey: ['templates', strain],
    queryFn: () => api.getTemplates(strain),
  });
};

export const useCreateTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });
};

export const useDeleteTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });
};

// ===== BATCH INFO =====

export const useBatchInfos = () => {
  return useQuery({
    queryKey: ['batchInfos'],
    queryFn: api.getBatchInfos,
  });
};

export const useBatchInfo = (spawnBatch, options = {}) => {
  return useQuery({
    queryKey: ['batchInfo', spawnBatch],
    queryFn: () => api.getBatchInfo(spawnBatch),
    enabled: !!spawnBatch && (options.enabled !== false),
  });
};

export const useCreateBatchInfo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createBatchInfo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batchInfos'] });
    },
  });
};

export const useToggleFridge = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ spawnBatch, inFridge }) => api.toggleFridge(spawnBatch, inFridge),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['batchInfo', variables.spawnBatch] });
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      queryClient.invalidateQueries({ queryKey: ['next-colonization'] });
    },
  });
};

// ===== BATCH UNITS =====

export const useBatchUnits = (spawnBatch, options = {}) => {
  return useQuery({
    queryKey: ['batchUnits', spawnBatch],
    queryFn: () => api.getBatchUnits(spawnBatch),
    enabled: !!spawnBatch && (options.enabled !== false),
  });
};

export const useCreateBatchUnit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ spawnBatch, data }) => api.createBatchUnit(spawnBatch, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['batchUnits', variables.spawnBatch] });
      queryClient.invalidateQueries({ queryKey: ['batchInfo', variables.spawnBatch] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
};

export const useCreateBatchUnitsBulk = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ spawnBatch, data }) => api.createBatchUnitsBulk(spawnBatch, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['batchUnits', variables.spawnBatch] });
      queryClient.invalidateQueries({ queryKey: ['batchInfo', variables.spawnBatch] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['next-colonization'] });
    },
  });
};

export const useUpdateBatchUnit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ spawnBatch, unitId, data }) => api.updateBatchUnit(spawnBatch, unitId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['batchUnits', variables.spawnBatch] });
      queryClient.invalidateQueries({ queryKey: ['batchInfo', variables.spawnBatch] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
};

export const useToggleContamination = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ spawnBatch, unitId, contaminated }) => 
      api.toggleContamination(spawnBatch, unitId, contaminated),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['batchUnits', variables.spawnBatch] });
      queryClient.invalidateQueries({ queryKey: ['batchInfo', variables.spawnBatch] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
};

export const useDeleteBatchUnit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ spawnBatch, unitId }) => api.deleteBatchUnit(spawnBatch, unitId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['batchUnits', variables.spawnBatch] });
      queryClient.invalidateQueries({ queryKey: ['batchInfo', variables.spawnBatch] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['next-colonization'] });
    },
  });
};

export const useBulkArchive = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.bulkArchiveBatches,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
};

export const useBulkDelete = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.bulkDeleteBatches,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
};

// QR Code & Printing Hooks
export const usePrintLabel = () => {
  return useMutation({
    mutationFn: async ({ batchId, copies = 1 }) => {
      const response = await fetch(`/api/batches/${batchId}/print?copies=${copies}`, {
        method: 'POST'
      });
      if (!response.ok) {
        throw new Error('Print failed');
      }
      return response.json();
    },
  });
};

export const useQRCode = (batchId) => {
  return useQuery({
    queryKey: ['qr', batchId],
    queryFn: async () => {
      const response = await fetch(`/api/batches/${batchId}/qr`);
      return response.json();
    },
    enabled: !!batchId
  });
};

export const useTestPrinter = () => {
  return useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/printer/test', {
        method: 'POST'
      });
      return response.json();
    },
  });
};