import { useStats } from '../../hooks/useApi';
import { TrendingUp, AlertTriangle, CheckCircle, Package } from 'lucide-react';

export default function StatsPanel({ strain, strainConfig }) {
  const { data: stats, isLoading, error } = useStats(strain);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <p className="text-slate-600">Laster statistikk...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
        <p className="text-red-600">Kunne ikke laste statistikk</p>
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      label: 'Totalt batches',
      value: stats.total_batches,
      icon: Package,
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    {
      label: 'Aktive',
      value: stats.active_batches,
      icon: TrendingUp,
      color: 'text-green-600',
      bg: 'bg-green-50'
    },
    {
      label: 'Kontaminerte',
      value: `${stats.contaminated || 0} (${stats.contamination_rate || 0}%)`,
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-50'
    },
    {
      label: 'Høstet',
      value: `${stats.harvested || 0} (${stats.total_harvest_kg || 0}kg)`,
      icon: CheckCircle,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50'
    },
  ];

  return (
    <div className="mb-6">
      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {statCards.map((stat, idx) => (
          <div key={idx} className={`${stat.bg} rounded-lg p-4 border border-slate-200`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-slate-600">{stat.label}</p>
              <stat.icon className={stat.color} size={20} />
            </div>
            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Additional Stats */}
      <div className="bg-white rounded-lg shadow p-4 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-slate-600 mb-1">Gjennomsnittlig BE%</p>
          <p className="text-lg font-semibold text-slate-900">{stats.avg_be_percent}%</p>
        </div>
        <div>
          <p className="text-slate-600 mb-1">Snitt kolonisering (dager)</p>
          <p className="text-lg font-semibold text-slate-900">{stats.avg_colonization_days}</p>
        </div>
        <div>
          <p className="text-slate-600 mb-1">Snitt sykluslengde (dager)</p>
          <p className="text-lg font-semibold text-slate-900">{stats.avg_cycle_length}</p>
        </div>
      </div>
    </div>
  );
}
