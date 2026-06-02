import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBatches, useStats, useWeeklyTrends, useCultures } from '../../hooks/useApi';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const getDaysToComplete = (batch) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (batch.workflow_status === 'spawning' && batch.spawn_forventet_ferdig) {
    const d = new Date(batch.spawn_forventet_ferdig);
    d.setHours(0, 0, 0, 0);
    return { phase: 'Spawn', days: Math.ceil((d - today) / 86400000) };
  }
  if (batch.workflow_status === 'colonizing' && batch.bag_forventet_kolon) {
    const d = new Date(batch.bag_forventet_kolon);
    d.setHours(0, 0, 0, 0);
    return { phase: 'Ink', days: Math.ceil((d - today) / 86400000) };
  }
  if (batch.workflow_status === 'fruiting' && batch.bag_frukting_start) {
    const start = new Date(batch.bag_frukting_start);
    const exp = new Date(start);
    exp.setDate(exp.getDate() + 14);
    const days = Math.ceil((exp - today) / 86400000);
    return { phase: 'Frukt', days: days > 0 ? days : '~' };
  }
  return null;
};

const StatRow = ({ label, value, red }) => (
  <div className="flex justify-between items-baseline gap-2 min-w-0">
    <span className="text-[11px] text-zinc-500 shrink-0">{label}</span>
    <span className={`text-[11px] font-mono tabular-nums ${red ? 'text-red-600' : 'text-zinc-100'}`}>{value}</span>
  </div>
);

const StrainPanel = ({ label, stats, batches }) => {
  const navigate = useNavigate();
  const activeBatches = (batches || []).filter(b => !b.archived);
  return (
    <div className="card px-2.5 py-2">
      <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">{label}</p>
      <div className="grid grid-cols-3 gap-x-3 gap-y-0 mb-1.5">
        <StatRow label="Aktive" value={stats?.active_batches || 0} />
        <StatRow label="Totalt" value={stats?.total_batches || 0} />
        <StatRow label="BE%" value={`${stats?.avg_be_percent || '-'}%`} />
        <StatRow label="Høst" value={`${stats?.total_harvest_kg?.toFixed(1) || 0} kg`} />
        <StatRow label="Kontam" value={`${stats?.contaminated || 0} (${stats?.contamination_rate?.toFixed(1) || 0}%)`} red />
      </div>
      {activeBatches.length > 0 && (
        <div className="border-t border-zinc-800 pt-1.5 space-y-0.5">
          {activeBatches.slice(0, 8).map(batch => {
            const status = getDaysToComplete(batch);
            return (
              <button
                key={batch.id}
                onClick={() => navigate(`/batch/${batch.id}`)}
                className="flex justify-between items-center w-full text-left rounded px-1 -mx-1 hover:bg-zinc-800/60 transition-colors"
              >
                <span className="text-[11px] font-mono text-zinc-300">{batch.spawn_batch || `B${batch.id}`}</span>
                {status && (
                  <span className={`text-[10px] font-mono ${
                    status.days < 0 ? 'text-red-500 font-semibold' :
                    status.days <= 3 ? 'text-amber-400' : 'text-zinc-500'
                  }`}>{status.phase}: {status.days}d</span>
                )}
              </button>
            );
          })}
          {activeBatches.length > 8 && <p className="text-[10px] text-zinc-500">+{activeBatches.length - 8} flere</p>}
        </div>
      )}
    </div>
  );
};

const PHASE_META = [
  { key: 'spawning', label: 'Spawn', color: 'bg-green-500' },
  { key: 'colonizing', label: 'Inkubering', color: 'bg-amber-500' },
  { key: 'fruiting', label: 'Frukting', color: 'bg-orange-500' },
  { key: 'harvesting', label: 'Høsting', color: 'bg-blue-500' },
];

// Horizontal bars: active batch count per workflow phase
const PhaseBars = ({ batches }) => {
  const active = batches.filter(b => !b.archived);
  const counts = PHASE_META.map(p => ({ ...p, n: active.filter(b => (b.workflow_status || 'spawning') === p.key).length }));
  const max = Math.max(1, ...counts.map(c => c.n));
  return (
    <div className="card p-2.5" style={{ height: 120 }}>
      <p className="text-[11px] font-medium text-zinc-400 mb-2">Aktive batcher per fase</p>
      <div className="space-y-1.5">
        {counts.map(c => (
          <div key={c.key} className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-500 w-16 shrink-0">{c.label}</span>
            <div className="flex-1 h-3 bg-zinc-800 rounded-sm overflow-hidden">
              <div className={`h-full ${c.color} rounded-sm`} style={{ width: `${(c.n / max) * 100}%` }} />
            </div>
            <span className="text-[10px] font-mono text-zinc-400 w-4 text-right">{c.n}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Upcoming harvests: fruiting batches sorted by days-to-harvest
const NextHarvest = ({ batches }) => {
  const navigate = useNavigate();
  const upcoming = batches
    .filter(b => !b.archived && b.workflow_status === 'fruiting')
    .map(b => ({ b, status: getDaysToComplete(b) }))
    .filter(x => x.status)
    .sort((a, c) => (Number(a.status.days) || 99) - (Number(c.status.days) || 99))
    .slice(0, 6);
  return (
    <div className="card p-2.5 overflow-y-auto" style={{ height: 120 }}>
      <p className="text-[11px] font-medium text-zinc-400 mb-2">Neste høst</p>
      {upcoming.length === 0 ? (
        <p className="text-[10px] text-zinc-600">Ingen i frukting</p>
      ) : (
        <div className="space-y-0.5">
          {upcoming.map(({ b, status }) => (
            <button key={b.id} onClick={() => navigate(`/batch/${b.id}`)} className="flex justify-between items-center w-full text-left rounded px-1 -mx-1 hover:bg-zinc-800/60">
              <span className="text-[11px] font-mono text-zinc-300">{b.spawn_batch || `B${b.id}`}</span>
              <span className={`text-[10px] font-mono ${Number(status.days) < 0 ? 'text-red-500 font-semibold' : Number(status.days) <= 3 ? 'text-amber-400' : 'text-zinc-500'}`}>
                {status.days}d
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const Dashboard = () => {
  const { data: allBatches = [], isLoading: batchesLoading } = useBatches();
  const { data: allStats } = useStats();
  const { data: oysterStats } = useStats('oyster');
  const { data: lionsManeStats } = useStats('lions_mane');
  const { data: weeklyTrends } = useWeeklyTrends({ weeks: 10 });
  const { data: cultures = [] } = useCultures();

  const lowStockCultures = cultures.filter(c =>
    c.active &&
    c.quantity != null &&
    c.initial_quantity != null &&
    c.initial_quantity > 0 &&
    c.quantity <= c.initial_quantity * 0.25
  );

  const batchesByStrain = useMemo(() => ({
    all: allBatches,
    oyster: allBatches.filter(b => b.strain_name === 'oyster'),
    lions_mane: allBatches.filter(b => b.strain_name === 'lions_mane'),
  }), [allBatches]);

  const chartOptions = (title) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: true, text: title, color: '#a1a1aa', font: { size: 11, weight: '500' } },
      tooltip: { bodyFont: { size: 11 }, titleFont: { size: 11 } },
    },
    scales: {
      y: { grid: { color: '#27272a' }, ticks: { color: '#71717a', font: { size: 10 }, maxTicksLimit: 4 } },
      x: { grid: { display: false }, ticks: { color: '#71717a', font: { size: 10 }, maxTicksLimit: 6 } },
    },
  });

  const harvestChartData = useMemo(() => {
    if (!weeklyTrends) return null;
    return {
      labels: weeklyTrends.weeks,
      datasets: [{ label: 'kg', data: weeklyTrends.harvest_kg, borderColor: 'rgb(239,68,68)', backgroundColor: 'rgba(239,68,68,0.10)', tension: 0.3, fill: true, pointRadius: 2 }],
    };
  }, [weeklyTrends]);

  const beChartData = useMemo(() => {
    if (!weeklyTrends) return null;
    return {
      labels: weeklyTrends.weeks,
      datasets: [{ label: 'BE%', data: weeklyTrends.avg_be_percent, borderColor: 'rgb(34,197,94)', backgroundColor: 'rgba(34,197,94,0.10)', tension: 0.3, fill: true, pointRadius: 2 }],
    };
  }, [weeklyTrends]);

  if (batchesLoading) {
    return <div className="flex items-center justify-center h-32"><div className="text-zinc-400 text-sm">Laster...</div></div>;
  }

  return (
    <div className="space-y-2">
      <h1 className="text-sm font-semibold text-zinc-100">Dashboard</h1>

      {/* Low stock cultures warning */}
      {lowStockCultures.length > 0 && (
        <div className="card border border-amber-800 bg-amber-950/30 p-3 space-y-1">
          <p className="text-xs font-medium text-amber-400">
            Lav kulturbeholdning ({lowStockCultures.length})
          </p>
          {lowStockCultures.map(c => (
            <div key={c.id} className="flex justify-between items-center text-xs font-mono">
              <span className="text-zinc-300">{c.code}</span>
              <span className="text-amber-400">
                {c.quantity} / {c.initial_quantity} {c.quantity_unit || 'ml'}
                {' '}({Math.round(c.quantity / c.initial_quantity * 100)}%)
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Stats: Alle (left) + Østers/Lions Mane stacked (right) */}
      <div className="grid grid-cols-2 gap-2">
        <StrainPanel label="Alle" stats={allStats} batches={batchesByStrain.all} />
        <div className="flex flex-col gap-2">
          <StrainPanel label="Østers" stats={oysterStats} batches={batchesByStrain.oyster} />
          <StrainPanel label="Lions Mane" stats={lionsManeStats} batches={batchesByStrain.lions_mane} />
        </div>
      </div>

      {/* Charts — 4 in a row */}
      <div className="grid grid-cols-4 gap-2">
        <div className="card p-2.5" style={{ height: 120 }}>
          {harvestChartData
            ? <Line data={harvestChartData} options={chartOptions('Høstevekt / uke (kg)')} />
            : <div className="flex items-center justify-center h-full text-xs text-zinc-300">Ingen data</div>
          }
        </div>
        <div className="card p-2.5" style={{ height: 120 }}>
          {beChartData
            ? <Line data={beChartData} options={chartOptions('BE% trend')} />
            : <div className="flex items-center justify-center h-full text-xs text-zinc-300">Ingen data</div>
          }
        </div>
        <PhaseBars batches={allBatches} />
        <NextHarvest batches={allBatches} />
      </div>
    </div>
  );
};

export default Dashboard;
