import React from 'react';

/**
 * BatchTableFilters - Filter controls for BatchTable
 * Shows column visibility toggles, strain filter, and archived/active toggle
 */
const BatchTableFilters = ({
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

  // Available strains
  strains = [],
}) => {
  return (
    <div className="mb-4 flex flex-wrap gap-4 items-center bg-gray-50 p-4 rounded-lg border border-gray-200">
      {/* Column visibility toggles */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">Vis kolonner:</span>
        <label className="flex items-center gap-1 cursor-pointer">
          <input
            type="checkbox"
            checked={showLC}
            onChange={(e) => setShowLC(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm">LC</span>
        </label>
        <label className="flex items-center gap-1 cursor-pointer">
          <input
            type="checkbox"
            checked={showSpawn}
            onChange={(e) => setShowSpawn(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm">SPAWN</span>
        </label>
        <label className="flex items-center gap-1 cursor-pointer">
          <input
            type="checkbox"
            checked={showBag}
            onChange={(e) => setShowBag(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm">BAG</span>
        </label>
      </div>

      {/* Strain filter */}
      <div className="flex items-center gap-2">
        <label htmlFor="strain-filter" className="text-sm font-medium text-gray-700">
          Stamme:
        </label>
        <select
          id="strain-filter"
          value={strainFilter}
          onChange={(e) => setStrainFilter(e.target.value)}
          className="rounded-md border-gray-300 text-sm focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">Alle stammar</option>
          {strains.map((strain) => (
            <option key={strain} value={strain}>
              {strain}
            </option>
          ))}
        </select>
      </div>

      {/* Archived toggle */}
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1 cursor-pointer">
          <input
            type="checkbox"
            checked={archivedFilter}
            onChange={(e) => setArchivedFilter(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">Vis arkiverte</span>
        </label>
      </div>
    </div>
  );
};

export default BatchTableFilters;
