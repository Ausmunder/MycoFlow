import { useState, useMemo, useEffect } from 'react';
import {
  useBatches,
  useUpdateBatch,
  useDeleteBatch,
  useBulkArchive,
  useBulkDelete,
  usePredictColonization,
  usePredictSpawnColonization,
  useHistoricalAverages,
  useBatchPrediction,
  useSubstrateMixes
} from './useApi';

/**
 * Custom hook for BatchTable state management and operations
 * Extracts all state, API hooks, and handler functions from BatchTable component
 */
export const useBatchTable = () => {
  // API hooks
  const { data: batches, isLoading } = useBatches();
  const updateBatchMutation = useUpdateBatch();
  const deleteBatchMutation = useDeleteBatch();
  const bulkArchiveMutation = useBulkArchive();
  const bulkDeleteMutation = useBulkDelete();
  const predictColonizationMutation = usePredictColonization();
  const { data: historicalData } = useHistoricalAverages();
  const { data: substrateMixes = [] } = useSubstrateMixes({ active_only: true });

  // Modal states
  const [selectedBatchId, setSelectedBatchId] = useState(null);
  const [isNewBatchModalOpen, setIsNewBatchModalOpen] = useState(false);
  const [isLCManagerOpen, setIsLCManagerOpen] = useState(false);
  const [isSubstrateMixManagerOpen, setIsSubstrateMixManagerOpen] = useState(false);

  // Selection and sorting states
  const [selectedRows, setSelectedRows] = useState([]);
  const [sortColumn, setSortColumn] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');

  // Column visibility toggles (persisted in localStorage)
  const [showLC, setShowLC] = useState(() =>
    localStorage.getItem('col_lc') === 'true'
  );
  const [showSpawn, setShowSpawn] = useState(() =>
    localStorage.getItem('col_spawn') !== 'false'
  );
  const [showBag, setShowBag] = useState(() =>
    localStorage.getItem('col_bag') !== 'false'
  );

  // Persist column visibility
  useEffect(() => { localStorage.setItem('col_lc', showLC); }, [showLC]);
  useEffect(() => { localStorage.setItem('col_spawn', showSpawn); }, [showSpawn]);
  useEffect(() => { localStorage.setItem('col_bag', showBag); }, [showBag]);

  // Filter states
  const [strainFilter, setStrainFilter] = useState('all');
  const [archivedFilter, setArchivedFilter] = useState(false);

  // Get unique strains for filter
  const strains = useMemo(() => {
    if (!batches) return [];
    const uniqueStrains = [...new Set(batches.map(b => b.strain_name))];
    return uniqueStrains.sort();
  }, [batches]);

  // Filter and sort batches
  const filteredBatches = useMemo(() => {
    if (!batches) return [];

    let filtered = batches.filter(b => {
      if (strainFilter !== 'all' && b.strain_name !== strainFilter) return false;
      if (archivedFilter !== b.archived) return false;
      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      let aVal = a[sortColumn];
      let bVal = b[sortColumn];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  }, [batches, strainFilter, archivedFilter, sortColumn, sortDirection]);

  // Handler: Sort column
  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Handler: Toggle row selection
  const toggleRowSelection = (id) => {
    setSelectedRows(prev =>
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  // Handler: Bulk archive
  const handleBulkArchive = async () => {
    if (selectedRows.length === 0) return;
    if (!window.confirm(`Archive ${selectedRows.length} batches?`)) return;

    await bulkArchiveMutation.mutateAsync(selectedRows);
    setSelectedRows([]);
  };

  // Handler: Bulk delete
  const handleBulkDelete = async () => {
    if (selectedRows.length === 0) return;
    if (!window.confirm(`DELETE ${selectedRows.length} batches permanently?`)) return;

    await bulkDeleteMutation.mutateAsync(selectedRows);
    setSelectedRows([]);
  };

  // Handler: Cell click (for opening modals)
  const handleCellClick = (batch, cellType) => {
    // Only open modal for spawn_batch cells
    if (cellType === 'spawn_batch' && batch.spawn_batch) {
      setSelectedBatchId(batch.id);
    }
  };

  // Handler: Convert spawn to incubation (Spawn → Bag workflow)
  const handleConvertToIncubation = async (batch) => {
    try {
      const today = new Date().toISOString();

      await updateBatchMutation.mutateAsync({
        id: batch.id,
        data: {
          batch_type: 'Bag',
          bag_batch: batch.spawn_batch,
          bag_dato_inok: today,
          bag_status: 'Inokulert',
          workflow_status: 'colonizing',
        }
      });
    } catch (error) {
      console.error('Failed to convert to incubation:', error);
      alert('Kunne ikke konvertere til Inkubering. Se konsoll for detaljer.');
    }
  };

  // Handler: Undo incubation conversion
  const handleUndoIncubation = async (batch) => {
    if (!confirm('Angre konvertering til Inkubering? Dette vil nullstille bag_dato_inok.')) {
      return;
    }

    try {
      await updateBatchMutation.mutateAsync({
        id: batch.id,
        data: {
          batch_type: 'Spawn',
          bag_dato_inok: null,
          bag_status: null,
          workflow_status: 'spawning',
        }
      });
    } catch (error) {
      console.error('Failed to undo incubation:', error);
      alert('Kunne ikke angre Inkubering. Se konsoll for detaljer.');
    }
  };

  // Handler: Convert bag to fruiting
  const handleConvertToBag = async (batch) => {
    try {
      const today = new Date().toISOString();

      await updateBatchMutation.mutateAsync({
        id: batch.id,
        data: {
          bag_frukting_start: today,
          workflow_status: 'fruiting',
        }
      });
    } catch (error) {
      console.error('Failed to convert to fruiting:', error);
      alert('Kunne ikke konvertere til Frukt. Se konsoll for detaljer.');
    }
  };

  // Handler: Undo fruiting conversion
  const handleUndoFruiting = async (batch) => {
    if (!confirm('Angre konvertering til Frukt? Dette vil nullstille bag_frukting_start.')) {
      return;
    }

    try {
      await updateBatchMutation.mutateAsync({
        id: batch.id,
        data: {
          bag_frukting_start: null,
          workflow_status: 'colonizing',
        }
      });
    } catch (error) {
      console.error('Failed to undo fruiting:', error);
      alert('Kunne ikke angre Frukt. Se konsoll for detaljer.');
    }
  };

  // Return all state, data, and functions
  return {
    // Data
    batches: filteredBatches,
    isLoading,
    historicalData,
    substrateMixes,
    strains,

    // Mutations
    updateBatchMutation,
    deleteBatchMutation,

    // Modal states
    selectedBatchId,
    setSelectedBatchId,
    isNewBatchModalOpen,
    setIsNewBatchModalOpen,
    isLCManagerOpen,
    setIsLCManagerOpen,
    isSubstrateMixManagerOpen,
    setIsSubstrateMixManagerOpen,

    // Selection and sorting
    selectedRows,
    sortColumn,
    sortDirection,

    // Column visibility
    showLC,
    setShowLC,
    showSpawn,
    setShowSpawn,
    showBag,
    setShowBag,

    // Filters
    strainFilter,
    setStrainFilter,
    archivedFilter,
    setArchivedFilter,

    // Handlers
    handleSort,
    toggleRowSelection,
    handleBulkArchive,
    handleBulkDelete,
    handleCellClick,
    handleConvertToIncubation,
    handleUndoIncubation,
    handleConvertToBag,
    handleUndoFruiting,
  };
};
