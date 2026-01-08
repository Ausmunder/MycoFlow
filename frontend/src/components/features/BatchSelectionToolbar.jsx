import React from 'react';
import { Plus, Archive, Trash2, Refrigerator, Beaker, Layers } from 'lucide-react';

/**
 * BatchSelectionToolbar - Toolbar with action buttons and modal launchers
 * Shows bulk action buttons when rows are selected, and always shows modal launchers
 */
const BatchSelectionToolbar = ({
  selectedRows = [],
  handleBulkArchive,
  handleBulkDelete,
  setIsLCManagerOpen,
  setIsSubstrateMixManagerOpen,
  setIsNewBatchModalOpen,
}) => {
  const hasSelection = selectedRows.length > 0;

  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {/* Bulk action buttons - only show when rows are selected */}
      {hasSelection && (
        <>
          <button
            onClick={handleBulkArchive}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
          >
            <Archive size={16} />
            Arkiver ({selectedRows.length})
          </button>
          <button
            onClick={handleBulkDelete}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            <Trash2 size={16} />
            Slett ({selectedRows.length})
          </button>
        </>
      )}

      {/* Modal launcher buttons - always visible */}
      <button
        onClick={() => setIsLCManagerOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
      >
        <Refrigerator size={16} />
        LC Manager
      </button>
      <button
        onClick={() => setIsSubstrateMixManagerOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors"
      >
        <Layers size={16} />
        Substrat Mix
      </button>
      <button
        onClick={() => setIsNewBatchModalOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
      >
        <Plus size={16} />
        Ny Batch
      </button>
    </div>
  );
};

export default BatchSelectionToolbar;
