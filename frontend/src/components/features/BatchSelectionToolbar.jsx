import React from 'react';
import { Plus, Archive, Trash2 } from 'lucide-react';

const BatchSelectionToolbar = ({
  selectedRows = [],
  handleBulkArchive,
  handleBulkDelete,
  setIsNewBatchModalOpen,
  activeTab,
  setActiveTab,
  strainConfig = {},
}) => {
  const hasSelection = selectedRows.length > 0;

  const tabs = [
    { key: 'all', label: 'Alle' },
    ...Object.entries(strainConfig).map(([key, cfg]) => ({
      key,
      label: cfg.name,
    })),
  ];

  return (
    <div className="flex items-center justify-between gap-3 py-2">
      {/* Strain segmented control */}
      <div className="inline-flex rounded-md border border-zinc-200 overflow-hidden">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-zinc-900 text-white'
                : 'bg-white text-zinc-600 hover:bg-zinc-50'
            } ${tab.key !== tabs[0].key ? 'border-l border-zinc-200' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {hasSelection && (
          <>
            <button
              onClick={handleBulkArchive}
              className="btn flex items-center gap-1.5 text-amber-600 hover:text-amber-700"
            >
              <Archive size={14} />
              Arkiver ({selectedRows.length})
            </button>
            <button
              onClick={handleBulkDelete}
              className="btn-destructive flex items-center gap-1.5"
            >
              <Trash2 size={14} />
              Slett ({selectedRows.length})
            </button>
          </>
        )}
        <button
          onClick={() => setIsNewBatchModalOpen(true)}
          className="btn-primary flex items-center gap-1.5"
        >
          <Plus size={14} />
          Ny Batch
        </button>
      </div>
    </div>
  );
};

export default BatchSelectionToolbar;
