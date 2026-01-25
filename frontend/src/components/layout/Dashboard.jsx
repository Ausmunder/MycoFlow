import React, { useState, useMemo } from 'react';
import { useBatches, useStats, useWeeklyTrends } from '../../hooks/useApi';
import { TrendingUp, AlertTriangle, Package, ChevronUp, ChevronDown, BarChart3 } from 'lucide-react';
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

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Strain configuration with colors
const strainConfig = {
  all: {
    name: 'Alle',
    code: 'ALL',
    bgColor: 'bg-slate-100',
    borderColor: 'border-slate-300',
    textColor: 'text-slate-800',
    buttonActive: 'bg-slate-700 text-white ring-4 ring-slate-300',
    buttonInactive: 'bg-slate-200 text-slate-700 hover:bg-slate-300'
  },
  oyster: {
    name: 'Østers',
    code: 'OST',
    bgColor: 'bg-sky-100',
    borderColor: 'border-sky-300',
    textColor: 'text-sky-800',
    buttonActive: 'bg-sky-600 text-white ring-4 ring-sky-200',
    buttonInactive: 'bg-sky-100 text-sky-700 hover:bg-sky-200'
  },
  lions_mane: {
    name: 'Lions Mane',
    code: 'LM',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-800',
    buttonActive: 'bg-amber-600 text-white ring-4 ring-amber-200',
    buttonInactive: 'bg-amber-100 text-amber-700 hover:bg-amber-200'
  },
  shiitake: {
    name: 'Shiitake',
    code: 'SH',
    bgColor: 'bg-stone-200',
    borderColor: 'border-stone-400',
    textColor: 'text-stone-800',
    buttonActive: 'bg-stone-600 text-white ring-4 ring-stone-300',
    buttonInactive: 'bg-stone-200 text-stone-700 hover:bg-stone-300'
  }
};

// Helper to calculate days until completion
const getDaysToComplete = (batch) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (batch.workflow_status === 'spawning') {
    if (batch.spawn_forventet_ferdig) {
      const targetDate = new Date(batch.spawn_forventet_ferdig);
      targetDate.setHours(0, 0, 0, 0);
      const days = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));
      return { phase: 'Spawn', days: days };
    }
    return { phase: 'Spawn', days: '?' };
  }

  if (batch.workflow_status === 'colonizing') {
    if (batch.bag_forventet_kolon) {
      const targetDate = new Date(batch.bag_forventet_kolon);
      targetDate.setHours(0, 0, 0, 0);
      const days = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));
      return { phase: 'Ink', days: days };
    }
    return { phase: 'Ink', days: '?' };
  }

  if (batch.workflow_status === 'fruiting') {
    // Estimate based on fruiting start date + 14 days typical
    if (batch.bag_frukting_start) {
      const startDate = new Date(batch.bag_frukting_start);
      const expectedHarvest = new Date(startDate);
      expectedHarvest.setDate(expectedHarvest.getDate() + 14);
      const days = Math.ceil((expectedHarvest - today) / (1000 * 60 * 60 * 24));
      return { phase: 'Frukt', days: days > 0 ? days : '~' };
    }
    return { phase: 'Frukt', days: '~14' };
  }

  return null;
};

// Strain Card Component
const StrainCard = ({ strainKey, config, stats, batches }) => {
  const activeBatches = batches.filter(b => !b.archived);

  return (
    <div className={`${config.bgColor} ${config.borderColor} border-2 rounded-lg p-4 shadow-sm`}>
      {/* Header */}
      <h3 className={`text-lg font-bold ${config.textColor} mb-3`}>
        {config.name}
      </h3>

      {/* Stats */}
      <div className="space-y-1 text-sm mb-4">
        <div className="flex justify-between">
          <span className="text-gray-600">Aktive:</span>
          <span className={`font-semibold ${config.textColor}`}>{stats?.active_batches || 0}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Høstet:</span>
          <span className={`font-semibold ${config.textColor}`}>{stats?.total_harvest_kg?.toFixed(1) || 0} kg</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">BE%:</span>
          <span className={`font-semibold ${config.textColor}`}>{stats?.avg_be_percent || '-'}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Kontam:</span>
          <span className="font-semibold text-red-600">{stats?.contamination_rate?.toFixed(1) || 0}%</span>
        </div>
      </div>

      {/* Divider */}
      <div className={`border-t ${config.borderColor} my-3`}></div>

      {/* Active Batch List */}
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {activeBatches.length === 0 ? (
          <p className="text-xs text-gray-500 italic">Ingen aktive batches</p>
        ) : (
          activeBatches.slice(0, 8).map(batch => {
            const status = getDaysToComplete(batch);
            return (
              <div key={batch.id} className="flex justify-between items-center text-xs bg-white/50 rounded px-2 py-1">
                <span className="font-medium">{batch.spawn_batch || `B${batch.id}`}</span>
                {status && (
                  <span className={`${
                    status.days < 0 ? 'text-red-600 font-bold' :
                    status.days <= 3 ? 'text-orange-600' : 'text-gray-600'
                  }`}>
                    {status.phase}: {status.days}d
                  </span>
                )}
              </div>
            );
          })
        )}
        {activeBatches.length > 8 && (
          <p className="text-xs text-gray-500">+ {activeBatches.length - 8} flere</p>
        )}
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [selectedStrain, setSelectedStrain] = useState('all');
  const [showCharts, setShowCharts] = useState(false);

  // Fetch data
  const { data: allBatches = [], isLoading: batchesLoading } = useBatches();
  const { data: allStats } = useStats();
  const { data: oysterStats } = useStats('oyster');
  const { data: lionsManeStats } = useStats('lions_mane');
  const { data: shiitakeStats } = useStats('shiitake');
  const { data: weeklyTrends } = useWeeklyTrends({ weeks: 10, strain: selectedStrain === 'all' ? null : selectedStrain });

  // Filter batches by strain
  const batchesByStrain = useMemo(() => {
    return {
      all: allBatches,
      oyster: allBatches.filter(b => b.strain_name === 'oyster'),
      lions_mane: allBatches.filter(b => b.strain_name === 'lions_mane'),
      shiitake: allBatches.filter(b => b.strain_name === 'shiitake')
    };
  }, [allBatches]);

  // Stats by strain
  const statsByStrain = {
    all: allStats,
    oyster: oysterStats,
    lions_mane: lionsManeStats,
    shiitake: shiitakeStats
  };

  // Chart data for harvest
  const harvestChartData = useMemo(() => {
    if (!weeklyTrends) return null;

    return {
      labels: weeklyTrends.weeks,
      datasets: [
        {
          label: 'Høstevekt (kg)',
          data: weeklyTrends.harvest_kg,
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          tension: 0.3,
          fill: true,
        },
      ],
    };
  }, [weeklyTrends]);

  // Chart data for BE%
  const beChartData = useMemo(() => {
    if (!weeklyTrends) return null;

    return {
      labels: weeklyTrends.weeks,
      datasets: [
        {
          label: 'BE%',
          data: weeklyTrends.avg_be_percent,
          borderColor: 'rgb(147, 51, 234)',
          backgroundColor: 'rgba(147, 51, 234, 0.1)',
          tension: 0.3,
          fill: true,
        },
      ],
    };
  }, [weeklyTrends]);

  const harvestChartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'Høstevekt per uke (siste 10 uker)' },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: 'kg' },
      },
    },
  };

  const beChartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'BE% trend (siste 10 uker)' },
    },
    scales: {
      y: {
        min: 60,
        max: 150,
        title: { display: true, text: 'BE%' },
      },
    },
  };

  if (batchesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Laster dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Strain Buttons */}
      <div className="flex flex-wrap gap-3 items-center">
        <h1 className="text-2xl font-bold text-gray-800 mr-4">Dashboard</h1>
        {Object.entries(strainConfig).map(([key, config]) => (
          <button
            key={key}
            onClick={() => setSelectedStrain(key)}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              selectedStrain === key ? config.buttonActive : config.buttonInactive
            }`}
          >
            {config.name}
          </button>
        ))}
      </div>

      {/* 4 Main Strain Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(strainConfig).map(([key, config]) => (
          <StrainCard
            key={key}
            strainKey={key}
            config={config}
            stats={statsByStrain[key]}
            batches={batchesByStrain[key]}
          />
        ))}
      </div>

      {/* Charts Toggle Button */}
      <div className="flex justify-center">
        <button
          onClick={() => setShowCharts(!showCharts)}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition ${
            showCharts
              ? 'bg-purple-600 text-white ring-4 ring-purple-200'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <BarChart3 size={20} />
          {showCharts ? 'Skjul Grafer' : 'Vis Grafer'}
          {showCharts ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>

      {/* Charts Section */}
      {showCharts && weeklyTrends && (
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <BarChart3 className="text-purple-600" />
            Grafer - {strainConfig[selectedStrain].name}
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Harvest Chart */}
            <div className="bg-gray-50 rounded-lg p-4">
              {harvestChartData && <Line data={harvestChartData} options={harvestChartOptions} />}
            </div>

            {/* BE% Chart */}
            <div className="bg-gray-50 rounded-lg p-4">
              {beChartData && <Line data={beChartData} options={beChartOptions} />}
            </div>
          </div>

          {/* Summary stats below charts */}
          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            <div className="bg-green-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-green-700">
                {weeklyTrends.harvest_kg.reduce((a, b) => a + b, 0).toFixed(1)} kg
              </div>
              <div className="text-sm text-green-600">Total høst (10 uker)</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-purple-700">
                {weeklyTrends.avg_be_percent.filter(v => v !== null).length > 0
                  ? (weeklyTrends.avg_be_percent.filter(v => v !== null).reduce((a, b) => a + b, 0) /
                     weeklyTrends.avg_be_percent.filter(v => v !== null).length).toFixed(1)
                  : '-'}%
              </div>
              <div className="text-sm text-purple-600">Gjennomsnitt BE%</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-blue-700">
                {weeklyTrends.harvest_kg.filter(v => v > 0).length}
              </div>
              <div className="text-sm text-blue-600">Uker med høst</div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <Package className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-600">Totale Batches</p>
              <p className="text-xl font-bold text-gray-800">{allStats?.total_batches || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-full">
              <TrendingUp className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-600">Total Høst</p>
              <p className="text-xl font-bold text-green-600">{allStats?.total_harvest_kg?.toFixed(1) || 0} kg</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-full">
              <TrendingUp className="text-purple-600" size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-600">Snitt BE%</p>
              <p className="text-xl font-bold text-purple-600">{allStats?.avg_be_percent || '-'}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-full">
              <AlertTriangle className="text-red-600" size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-600">Kontaminering</p>
              <p className="text-xl font-bold text-red-600">
                {allStats?.contaminated || 0} ({allStats?.contamination_rate?.toFixed(1) || 0}%)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
