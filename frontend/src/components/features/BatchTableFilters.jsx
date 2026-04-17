import React from 'react';

const BatchTableFilters = ({
  showLC, setShowLC,
  showSpawn, setShowSpawn,
  showBag, setShowBag,
  strainFilter, setStrainFilter,
  archivedFilter, setArchivedFilter,
  showArchive, setShowArchive,
  strains = [],
}) => {
  const Toggle = ({ active, onClick, children }) => (
    <button
      onClick={onClick}
      className={`px-2 py-1 text-xs rounded-md font-medium transition-colors ${
        active
          ? 'bg-zinc-100 text-zinc-900'
          : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50'
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="flex items-center gap-3 py-2 text-sm">
      <div className="flex items-center gap-1">
        <span className="text-xs font-medium text-zinc-500 mr-1">Vis:</span>
        <Toggle active={showLC} onClick={() => setShowLC(!showLC)}>LC</Toggle>
        <Toggle active={showSpawn} onClick={() => setShowSpawn(!showSpawn)}>Spawn</Toggle>
        <Toggle active={showBag} onClick={() => setShowBag(!showBag)}>Bag</Toggle>
      </div>

      <div className="h-4 w-px bg-zinc-200" />

      <label className="flex items-center gap-1.5 text-xs text-zinc-600 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={showArchive || archivedFilter}
          onChange={(e) => {
            if (setShowArchive) setShowArchive(e.target.checked);
            if (setArchivedFilter) setArchivedFilter(e.target.checked);
          }}
          className="rounded border-zinc-300 text-zinc-900 h-3.5 w-3.5 focus:ring-zinc-400"
        />
        Arkiverte
      </label>
    </div>
  );
};

export default BatchTableFilters;
