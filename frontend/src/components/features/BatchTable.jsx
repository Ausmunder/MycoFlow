import React, { useState } from 'react';
import { useBatchTable } from '../../hooks/useBatchTable';
import BatchModal from './BatchModal';
import NewBatchModal from './NewBatchModal';
import LCManager from './LCManager';
import SubstrateMixManager from './SubstrateMixManager';
import ContaminationModal from './ContaminationModal';
import BatchTableFilters from './BatchTableFilters';
import BatchSelectionToolbar from './BatchSelectionToolbar';
import BatchTableHeader from './BatchTableHeader';
import BatchTableRow from './BatchTableRow';

/**
 * BatchTable - Main batch tracking table
 * Refactored into smaller components with custom hook for state management
 */
const BatchTable = () => {
  const [contaminationBatch, setContaminationBatch] = useState(null);

  // Get all state and functions from custom hook
  const {
    // Data
    batches,
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
  } = useBatchTable();

  if (isLoading) {
    return <div className="p-4">Loading batches...</div>;
  }

  return (
    <div className="p-4">
      {/* Filters */}
      <BatchTableFilters
        showLC={showLC}
        setShowLC={setShowLC}
        showSpawn={showSpawn}
        setShowSpawn={setShowSpawn}
        showBag={showBag}
        setShowBag={setShowBag}
        strainFilter={strainFilter}
        setStrainFilter={setStrainFilter}
        archivedFilter={archivedFilter}
        setArchivedFilter={setArchivedFilter}
        strains={strains}
      />

      {/* Toolbar with action buttons */}
      <BatchSelectionToolbar
        selectedRows={selectedRows}
        handleBulkArchive={handleBulkArchive}
        handleBulkDelete={handleBulkDelete}
        setIsLCManagerOpen={setIsLCManagerOpen}
        setIsSubstrateMixManagerOpen={setIsSubstrateMixManagerOpen}
        setIsNewBatchModalOpen={setIsNewBatchModalOpen}
      />

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="border-collapse w-full text-xs">
          <BatchTableHeader
            showLC={showLC}
            showSpawn={showSpawn}
            showBag={showBag}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            handleSort={handleSort}
          />

          <tbody>
            {batches.map(batch => (
              <BatchTableRow
                key={batch.id}
                batch={batch}
                showLC={showLC}
                showSpawn={showSpawn}
                showBag={showBag}
                selectedRows={selectedRows}
                toggleRowSelection={toggleRowSelection}
                updateBatchMutation={updateBatchMutation}
                deleteBatchMutation={deleteBatchMutation}
                handleCellClick={handleCellClick}
                handleConvertToIncubation={handleConvertToIncubation}
                handleUndoIncubation={handleUndoIncubation}
                handleConvertToBag={handleConvertToBag}
                handleUndoFruiting={handleUndoFruiting}
                historicalData={historicalData}
                substrateMixes={substrateMixes}
                onOpenContaminationModal={setContaminationBatch}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Batch count */}
      <div className="mt-4 text-sm text-gray-600">
        Showing {batches.length} batches
        {archivedFilter ? ' (archived)' : ' (active)'}
      </div>

      {/* Modals */}
      {contaminationBatch && (
        <ContaminationModal
          batch={contaminationBatch}
          onClose={() => setContaminationBatch(null)}
          onSave={(values) => {
            updateBatchMutation.mutate({ id: contaminationBatch.id, data: values });
          }}
        />
      )}

      {selectedBatchId && (
        <BatchModal
          batchId={selectedBatchId}
          onClose={() => setSelectedBatchId(null)}
        />
      )}

      {isNewBatchModalOpen && (
        <NewBatchModal
          onClose={() => setIsNewBatchModalOpen(false)}
        />
      )}

      {isLCManagerOpen && (
        <LCManager
          onClose={() => setIsLCManagerOpen(false)}
        />
      )}

      {isSubstrateMixManagerOpen && (
        <SubstrateMixManager
          onClose={() => setIsSubstrateMixManagerOpen(false)}
        />
      )}
    </div>
  );
};

export default BatchTable;
