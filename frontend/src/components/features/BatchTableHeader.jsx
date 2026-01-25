import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

/**
 * BatchTableHeader - Two-row table header with section headers and sortable columns
 * Row 1: Section headers (LC, SPAWN, Inkubering, Frukt)
 * Row 2: Individual column headers with sort functionality
 */
const BatchTableHeader = ({
  showLC,
  showSpawn,
  showBag,
  sortColumn,
  sortDirection,
  handleSort,
}) => {
  // Helper to render sort indicator
  const SortIcon = ({ column }) => {
    if (sortColumn !== column) return null;
    return sortDirection === 'asc' ? ' ↑' : ' ↓';
  };

  return (
    <thead>
      {/* Row 1: Section Headers */}
      <tr className="bg-slate-200">
        <th rowSpan="2" className="border p-2">☑</th>
        <th rowSpan="2" className="border p-2 bg-blue-100">Workflow</th>
        {showLC && <th colSpan="2" className="border p-2 bg-purple-100">LC</th>}
        {showSpawn && <th colSpan="9" className="border p-2 bg-green-100">SPAWN</th>}
        {showBag && <th colSpan="7" className="border p-2 bg-amber-100">Inkubering</th>}
        {showBag && <th colSpan="13" className="border p-2 bg-orange-100">Frukt</th>}
        <th rowSpan="2" className="border p-2">Action</th>
      </tr>

      {/* Row 2: Column Headers */}
      <tr className="bg-slate-100">
        {/* LC Columns */}
        {showLC && (
          <>
            <th
              onClick={() => handleSort('lc_batch')}
              className="border p-1 cursor-pointer hover:bg-slate-200 text-xs"
            >
              Kode<SortIcon column="lc_batch" />
            </th>
            <th className="border p-1 text-xs">Vol</th>
          </>
        )}

        {/* SPAWN Columns */}
        {showSpawn && (
          <>
            <th className="border p-1 text-xs">Type</th>
            <th
              onClick={() => handleSort('spawn_batch')}
              className="border p-1 cursor-pointer hover:bg-slate-200 text-xs"
            >
              Batch<SortIcon column="spawn_batch" />
            </th>
            <th className="border p-1 text-xs">Antall enheter</th>
            <th
              onClick={() => handleSort('spawn_dato_inok')}
              className="border p-1 cursor-pointer hover:bg-slate-200 text-xs"
            >
              Inok<SortIcon column="spawn_dato_inok" />
            </th>
            <th className="border p-1 text-xs">Dg</th>
            <th className="border p-1 text-xs" title="AI-predicted colonization date">
              Forv (AI)
            </th>
            <th className="border p-1 text-xs" title="Spawn contamination">
              Spawn Kontam
            </th>
            <th className="border p-1 text-xs">❄️</th>
            <th className="border p-1 text-xs">→Ink</th>
          </>
        )}

        {/* Inkubering (BAG colonization) Columns */}
        {showBag && (
          <>
            <th className="border p-1 text-xs">Substrat</th>
            <th className="border p-1 text-xs">Antall bager</th>
            <th className="border p-1 text-xs">Kg substrat</th>
            <th className="border p-1 text-xs">Inkuberingsdato</th>
            <th className="border p-1 text-xs">Antall dager</th>
            <th className="border p-1 text-xs">Temp. Inkubasjon</th>
            <th className="border p-1 text-xs">→Frukt</th>
          </>
        )}

        {/* Frukt (Fruiting phase) Columns */}
        {showBag && (
          <>
            <th className="border p-1 text-xs">Fruktdato</th>
            <th className="border p-1 text-xs" title="AI-predicted fruiting date">
              Forv Frukt (AI)
            </th>
            <th className="border p-1 text-xs">T</th>
            <th className="border p-1 text-xs">LF</th>
            <th className="border p-1 text-xs">Høst 1 start</th>
            <th className="border p-1 text-xs">Høst 1 slutt</th>
            <th className="border p-1 text-xs">Høst 1 kg</th>
            <th className="border p-1 text-xs">Høst 2 start</th>
            <th className="border p-1 text-xs">Høst 2 slutt</th>
            <th className="border p-1 text-xs">Høst 2 kg</th>
            <th className="border p-1 text-xs">BE%</th>
            <th className="border p-1 text-xs">Notater</th>
            <th className="border p-1 text-xs">Enheter kontaminert</th>
          </>
        )}
      </tr>
    </thead>
  );
};

export default BatchTableHeader;
