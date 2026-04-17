import React, { useMemo } from 'react';
import { useBatches, useStats, useWeeklyTrends } from '../../hooks/useApi';
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
    <span className={`text-[11px] font-mono tabular-nums ${red ? 'text-red-600' : 'text-zinc-900'}`}>{value}</span>
  </div>
);

const StrainPanel = ({ label, stats, batches }) => {
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
        <div className="border-t border-zinc-100 pt-1.5 space-y-0.5">
          {activeBatches.slice(0, 8).map(batch => {
            const status = getDaysToComplete(batch);
            return (
              <div key={batch.id} className="flex justify-between items-center">
                <span className="text-[11px] font-mono text-zinc-700">{batch.spawn_batch || `B${batch.id}`}</span>
                {status && (
                  <span className={`text-[10px] font-mono ${
                    status.days < 0 ? 'text-red-600 font-semibold' :
                    status.days <= 3 ? 'text-amber-600' : 'text-zinc-400'
                  }`}>{status.phase}: {status.days}d</span>
                )}
              </div>
            );
          })}
          {activeBatches.length > 8 && <p className="text-[10px] text-zinc-400">+{activeBatches.length - 8} flere</p>}
        </div>
      )}
    </div>
  );
};

const EmptyChart = () => (
  <div className="card p-2.5 flex items-center justify-center" style={{ height: 120 }}>
    <span className="text-xs text-zinc-200">—</span>
  </div>
);

const Dashboard = () => {
  const { data: allBatches = [], isLoading: batchesLoading } = useBatches();
  const { data: allStats } = useStats();
  const { data: oysterStats } = useStats('oyster');
  const { data: lionsManeStats } = useStats('lions_mane');
  const { data: weeklyTrends } = useWeeklyTrends({ weeks: 10 });

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
      y: { grid: { color: '#f4f4f5' }, ticks: { color: '#a1a1aa', font: { size: 10 }, maxTicksLimit: 4 } },
      x: { grid: { display: false }, ticks: { color: '#a1a1aa', font: { size: 10 }, maxTicksLimit: 6 } },
    },
  });

  const harvestChartData = useMemo(() => {
    if (!weeklyTrends) return null;
    return {
      labels: weeklyTrends.weeks,
      datasets: [{ label: 'kg', data: weeklyTrends.harvest_kg, borderColor: 'rgb(24,24,27)', backgroundColor: 'rgba(24,24,27,0.05)', tension: 0.3, fill: true, pointRadius: 2 }],
    };
  }, [weeklyTrends]);

  const beChartData = useMemo(() => {
    if (!weeklyTrends) return null;
    return {
      labels: weeklyTrends.weeks,
      datasets: [{ label: 'BE%', data: weeklyTrends.avg_be_percent, borderColor: 'rgb(113,113,122)', backgroundColor: 'rgba(113,113,122,0.05)', tension: 0.3, fill: true, pointRadius: 2 }],
    };
  }, [weeklyTrends]);

  if (batchesLoading) {
    return <div className="flex items-center justify-center h-32"><div className="text-zinc-400 text-sm">Laster...</div></div>;
  }

  return (
    <div className="space-y-2">
      <h1 className="text-sm font-semibold text-zinc-900">Dashboard</h1>

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
        <EmptyChart />
        <EmptyChart />
      </div>
    </div>
  );
};

export default Dashboard;
