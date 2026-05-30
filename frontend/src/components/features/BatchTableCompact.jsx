import React from 'react';
import { useNavigate } from 'react-router-dom';

const STATUS_DOT = {
  spawning: 'bg-green-500', colonizing: 'bg-amber-500', fruiting: 'bg-orange-500',
  harvesting: 'bg-blue-500', completed: 'bg-zinc-500', contaminated: 'bg-red-500',
};
const STATUS_TEXT = {
  spawning: 'text-green-400', colonizing: 'text-amber-400', fruiting: 'text-orange-400',
  harvesting: 'text-blue-400', completed: 'text-zinc-400', contaminated: 'text-red-400',
};

const beColor = (be) => be == null ? 'text-zinc-600'
  : be >= 60 ? 'text-green-400' : be >= 40 ? 'text-yellow-400' : 'text-red-400';

/**
 * Slim, read-only batch table that fits the screen without horizontal scroll.
 * Row click navigates to the batch detail page; detailed editing lives there.
 */
export default function BatchTableCompact({ batches }) {
  const navigate = useNavigate();

  return (
    <div className="rounded-lg border border-zinc-800 overflow-hidden bg-zinc-900">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr>
            <th className="th">Status</th>
            <th className="th">Batch</th>
            <th className="th">Strain</th>
            <th className="th">Substrat</th>
            <th className="th text-center">Bager</th>
            <th className="th text-right">Substrat kg</th>
            <th className="th text-right">Høst kg</th>
            <th className="th text-right">BE%</th>
          </tr>
        </thead>
        <tbody>
          {batches.map(batch => {
            const status = batch.workflow_status || 'spawning';
            const totalKg = (batch.bag_host1_total_kg || 0) + (batch.bag_host2_total_kg || 0);
            return (
              <tr
                key={batch.id}
                onClick={() => navigate(`/batch/${batch.id}`)}
                className={`cursor-pointer hover:bg-zinc-800/40 transition-colors ${batch.archived ? 'opacity-50' : ''}`}
              >
                <td className="td">
                  <span className="inline-flex items-center gap-1.5">
                    <span className={`status-dot ${STATUS_DOT[status] || 'bg-zinc-500'}`} />
                    <span className={STATUS_TEXT[status] || 'text-zinc-400'}>{status}</span>
                  </span>
                </td>
                <td className="td font-mono font-medium text-zinc-100">{batch.spawn_batch || `#${batch.id}`}</td>
                <td className="td capitalize text-zinc-400">{batch.strain_name}</td>
                <td className="td text-zinc-400">{batch.bag_substrat_type || '-'}</td>
                <td className="td text-center font-mono">{batch.bag_antall_bager ?? '-'}</td>
                <td className="td text-right font-mono">{batch.bag_kg_substrat != null ? batch.bag_kg_substrat.toFixed(1) : '-'}</td>
                <td className="td text-right font-mono text-zinc-200">{totalKg > 0 ? totalKg.toFixed(1) : '-'}</td>
                <td className={`td text-right font-mono font-medium ${beColor(batch.bag_be_percent)}`}>
                  {batch.bag_be_percent != null ? `${batch.bag_be_percent}%` : '-'}
                </td>
              </tr>
            );
          })}
          {batches.length === 0 && (
            <tr><td colSpan={8} className="td text-center text-zinc-600 py-6 italic">Ingen batches</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
