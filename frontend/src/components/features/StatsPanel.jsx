import { useStats } from '../../hooks/useApi';

export default function StatsPanel({ strain, strainConfig }) {
  const { data: stats, isLoading, error } = useStats(strain);

  if (isLoading) {
    return (
      <div className="card p-4 mb-4">
        <p className="text-sm text-zinc-400">Laster statistikk...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-4 mb-4 border-red-200">
        <p className="text-sm text-red-600">Kunne ikke laste statistikk</p>
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    { label: 'Totalt', value: stats.total_batches },
    { label: 'Aktive', value: stats.active_batches },
    { label: 'Kontaminerte', value: `${stats.contaminated || 0} (${stats.contamination_rate || 0}%)` },
    { label: 'Høstet', value: `${stats.harvested || 0} (${stats.total_harvest_kg || 0}kg)` },
    { label: 'Abortert', value: stats.abortert_batches || 0 },
  ];

  return (
    <div className="mb-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
        {statCards.map((stat, idx) => (
          <div key={idx} className="card p-3">
            <p className="text-xs text-zinc-500 mb-1">{stat.label}</p>
            <p className="text-lg font-mono font-semibold text-zinc-100">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="card p-3 grid grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-xs text-zinc-500 mb-0.5">Snitt BE%</p>
          <p className="font-mono font-semibold text-zinc-100">{stats.avg_be_percent}%</p>
        </div>
        <div>
          <p className="text-xs text-zinc-500 mb-0.5">Snitt kolonisering</p>
          <p className="font-mono font-semibold text-zinc-100">{stats.avg_colonization_days}d</p>
        </div>
        <div>
          <p className="text-xs text-zinc-500 mb-0.5">Snitt sykluslengde</p>
          <p className="font-mono font-semibold text-zinc-100">{stats.avg_cycle_length}d</p>
        </div>
      </div>
    </div>
  );
}
