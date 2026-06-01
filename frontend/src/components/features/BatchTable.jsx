import React, { useState, useRef } from 'react';
import { Rows3, Table2 } from 'lucide-react';
import { useBatchTable } from '../../hooks/useBatchTable';
import { useTableKeyboard } from '../../hooks/useTableKeyboard';
import BatchModal from './BatchModal';
import NewBatchModal from './NewBatchModal';
import LCManager from './LCManager';
import SubstrateMixManager from './SubstrateMixManager';
import ContaminationModal from './ContaminationModal';
import BatchTableFilters from './BatchTableFilters';
import BatchSelectionToolbar from './BatchSelectionToolbar';
import BatchTableHeader from './BatchTableHeader';
import BatchTableRow from './BatchTableRow';
import BatchTableCompact from './BatchTableCompact';

const BatchTable = ({ activeTab, setActiveTab, showArchive, setShowArchive, strainConfig }) => {
  const [contaminationBatch, setContaminationBatch] = useState(null);
  const [compact, setCompact] = useState(() => localStorage.getItem('batch_table_compact') !== 'false');
  const tableRef = useRef(null);
  useTableKeyboard(tableRef);

  const toggleCompact = () => setCompact(prev => {
    const next = !prev;
    localStorage.setItem('batch_table_compact', String(next));
    return next;
  });

  const {
    batches, isLoading, historicalData, substrateMixes, strains,
    updateBatchMutation, deleteBatchMutation,
    selectedBatchId, setSelectedBatchId,
    isNewBatchModalOpen, setIsNewBatchModalOpen,
    isLCManagerOpen, setIsLCManagerOpen,
    isSubstrateMixManagerOpen, setIsSubstrateMixManagerOpen,
    selectedRows, sortColumn, sortDirection,
    showLC, setShowLC, showSpawn, setShowSpawn, showBag, setShowBag,
    strainFilter, setStrainFilter, archivedFilter, setArchivedFilter,
    handleSort, toggleRowSelection,
    handleBulkArchive, handleBulkDelete,
    handleCellClick, handleConvertToIncubation, handleUndoIncubation,
    handleConvertToBag, handleUndoFruiting,
  } = useBatchTable();

  if (isLoading) {
    return <div className="py-8 text-center text-sm text-zinc-400">Laster batches...</div>;
  }

  return (
    <div>
      <BatchSelectionToolbar
        selectedRows={selectedRows}
        handleBulkArchive={handleBulkArchive}
        handleBulkDelete={handleBulkDelete}
        setIsNewBatchModalOpen={setIsNewBatchModalOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        strainConfig={strainConfig}
      />

      {/* Filters + view toggle */}
      <div className="flex items-center justify-between">
        {compact
          ? <div className="py-2 text-xs text-zinc-500">Klikk en rad for detaljer og redigering</div>
          : <BatchTableFilters
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
              showArchive={showArchive}
              setShowArchive={setShowArchive}
              strains={strains}
            />
        }
        <button onClick={toggleCompact} className="btn text-xs flex items-center gap-1.5" title={compact ? 'Vis full redigeringstabell' : 'Vis kompakt oversikt'}>
          {compact ? <><Table2 size={14} /> Full</> : <><Rows3 size={14} /> Kompakt</>}
        </button>
      </div>

      {/* Table */}
      {compact ? (
        <BatchTableCompact batches={batches} />
      ) : (
        <div className="rounded-lg border border-zinc-800 overflow-x-auto bg-zinc-900">
          <table ref={tableRef} className="w-full border-collapse" role="grid" tabIndex={0}>
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
      )}

      <div className="mt-2 text-xs text-zinc-400">
        {batches.length} batches {archivedFilter ? '(arkiv)' : '(aktive)'}
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
      {selectedBatchId && <BatchModal batchId={selectedBatchId} onClose={() => setSelectedBatchId(null)} />}
      {isNewBatchModalOpen && <NewBatchModal onClose={() => setIsNewBatchModalOpen(false)} />}
      {isLCManagerOpen && <LCManager onClose={() => setIsLCManagerOpen(false)} />}
      {isSubstrateMixManagerOpen && <SubstrateMixManager onClose={() => setIsSubstrateMixManagerOpen(false)} />}
    </div>
  );
};

export default BatchTable;
