import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const BatchTableHeader = ({ showLC, showSpawn, showBag, sortColumn, sortDirection, handleSort }) => {
  const SortIcon = ({ column }) => {
    if (sortColumn !== column) return null;
    return sortDirection === 'asc'
      ? <ChevronUp size={12} className="inline ml-0.5" />
      : <ChevronDown size={12} className="inline ml-0.5" />;
  };

  const Sortable = ({ column, children, className = '' }) => (
    <th
      onClick={() => handleSort(column)}
      className={`th cursor-pointer hover:text-zinc-300 select-none ${className}`}
    >
      {children}<SortIcon column={column} />
    </th>
  );

  const SectionLabel = ({ label }) => (
    <span className="block text-[9px] text-zinc-400 font-normal normal-case tracking-normal leading-none mb-0.5">
      {label}
    </span>
  );

  return (
    <thead className="sticky top-0 z-20">
      <tr>
        <th className="th w-8 text-center">
          <input type="checkbox" className="rounded border-zinc-700 h-3.5 w-3.5" disabled />
        </th>
        <th className="th w-16">Status</th>

        {/* LC */}
        {showLC && (
          <>
            <Sortable column="lc_batch" className="col-divider">
              <SectionLabel label="LC" />Kode
            </Sortable>
            <th className="th">Vol</th>
          </>
        )}

        {/* Spawn */}
        {showSpawn && (
          <>
            <th className={`th ${!showLC ? 'col-divider' : ''}`}>
              {!showLC && <SectionLabel label="Spawn" />}
              {showLC && <SectionLabel label="Spawn" />}
              Type
            </th>
            <Sortable column="spawn_batch">Batch</Sortable>
            <th className="th">#</th>
            <Sortable column="spawn_dato_inok">Inok</Sortable>
            <th className="th">Dg</th>
            <th className="th" title="AI-prediksjon">Forv</th>
            <th className="th">Kjøl</th>
            <th className="th">Ink</th>
          </>
        )}

        {/* Inkubering */}
        {showBag && (
          <>
            <th className="th col-divider">
              <SectionLabel label="Inkubering" />Substrat
            </th>
            <th className="th">Bager</th>
            <th className="th">Kg</th>
            <th className="th">Dato</th>
            <th className="th">Dg</th>
            <th className="th">Temp</th>
            <th className="th">Frukt</th>
          </>
        )}

        {/* Frukt */}
        {showBag && (
          <>
            <th className="th col-divider">
              <SectionLabel label="Frukt" />Dato
            </th>
            <th className="th" title="AI-prediksjon">Forv</th>
            <th className="th">T</th>
            <th className="th">LF</th>
            <th className="th">H1s</th>
            <th className="th">H1e</th>
            <th className="th">H1 kg</th>
            <th className="th">H2s</th>
            <th className="th">H2e</th>
            <th className="th">H2 kg</th>
            <th className="th">BE%</th>
            <th className="th">Notat</th>
            <th className="th">Kont</th>
          </>
        )}

        <th className="th w-16">
          <span className="sr-only">Handlinger</span>
        </th>
      </tr>
    </thead>
  );
};

export default BatchTableHeader;
