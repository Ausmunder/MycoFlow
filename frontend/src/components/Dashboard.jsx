import React, { useState, useMemo } from 'react';
import { useBatches, useStats, useNextColonization, useLCCultures } from '../hooks/useApi';
import { TrendingUp, AlertTriangle, Package, Clock, AlertCircle, Calendar, Beaker } from 'lucide-react';
import { formatDateShort } from '../utils/dateFormat';

const Dashboard = () => {
  const [selectedStrain, setSelectedStrain] = useState('oyster');

  const { data: batches = [], isLoading: batchesLoading } = useBatches();
  const { data: stats, isLoading: statsLoading } = useStats(selectedStrain);
  const { data: nextColonization, isLoading: nextLoading, error: nextError } = useNextColonization();
  const { data: lcCultures = [], isLoading: lcLoading } = useLCCultures({ active_only: true });

  const strainOptions = [
    { value: 'oyster', label: 'Grå østers' },
    { value: 'shiitake', label: 'Shiitake' },
    { value: 'lions_mane', label: 'Lions Mane' },
  ];

  // Calculate additional metrics
  const metrics = useMemo(() => {
    if (!batches.length) return null;

    const today = new Date();

    // Overdue batches (spawn_forventet_ferdig or bag_forventet_kolon in past)
    const overdueBatches = batches.filter(b => {
      if (b.archived) return false;
      const spawnOverdue = b.spawn_forventet_ferdig && new Date(b.spawn_forventet_ferdig) < today && !b.bag_dato_inok;
      const bagOverdue = b.bag_forventet_kolon && new Date(b.bag_forventet_kolon) < today && !b.bag_frukting_start;
      return spawnOverdue || bagOverdue;
    });

    // Upcoming harvest (next 7 days)
    const upcomingHarvest = batches.filter(b => {
      if (b.archived || !b.bag_forventet_kolon) return false;
      const expectedDate = new Date(b.bag_forventet_kolon);
      const daysUntil = Math.ceil((expectedDate - today) / (1000 * 60 * 60 * 24));
      return daysUntil >= 0 && daysUntil <= 7;
    });

    // In fridge
    const fridgeBatches = batches.filter(b => b.in_fridge && !b.archived);

    return {
      overdueBatches,
      upcomingHarvest,
      fridgeBatches
    };
  }, [batches]);

  if (statsLoading || batchesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Laster statistikk...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        
        {/* Strain Selector */}
        <select
          value={selectedStrain}
          onChange={(e) => setSelectedStrain(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md bg-white"
        >
          {strainOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Next Colonization Widget */}
      {!nextLoading && !nextError && nextColonization && (
        <div className="bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-300 rounded-lg p-6 shadow-md">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-500 rounded-full">
                <Clock className="text-white" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-900">
                  Neste Kolonisering
                </h3>
                <p className="text-sm text-green-700">
                  Batch klar for fruiting snart
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-green-900">
                {nextColonization.days_remaining}
              </div>
              <div className="text-sm text-green-700">
                dager igjen
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-green-600 uppercase">Batch</div>
              <div className="text-lg font-semibold text-green-900">
                {nextColonization.spawn_batch}
              </div>
            </div>
            <div>
              <div className="text-xs text-green-600 uppercase">Strain</div>
              <div className="text-lg font-semibold text-green-900">
                {nextColonization.strain_name}
              </div>
            </div>
            <div>
              <div className="text-xs text-green-600 uppercase">Enheter</div>
              <div className="text-lg font-semibold text-green-900">
                {nextColonization.unit_count}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-green-700 mb-1">
              <span>Progress</span>
              <span>{nextColonization.progress_percent}%</span>
            </div>
            <div className="w-full bg-green-200 rounded-full h-3">
              <div
                className="bg-green-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${nextColonization.progress_percent}%` }}
              />
            </div>
          </div>

          {/* Expected Date */}
          <div className="mt-3 text-sm text-green-700">
            Forventet ferdig: {new Date(nextColonization.expected_date).toLocaleDateString('nb-NO')}
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Batches */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Totale Batches</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">
                {stats?.total_batches || 0}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Package className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        {/* Active Batches */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Aktive Batches</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {stats?.active_batches || 0}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <TrendingUp className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        {/* Archived Batches */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Arkiverte Batches</p>
              <p className="text-3xl font-bold text-gray-600 mt-2">
                {stats?.archived_batches || 0}
              </p>
            </div>
            <div className="p-3 bg-gray-100 rounded-full">
              <Package className="text-gray-600" size={24} />
            </div>
          </div>
        </div>

        {/* Contamination Rate */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Kontaminering</p>
              <p className="text-3xl font-bold text-red-600 mt-2">
                {stats?.contamination_rate?.toFixed(1) || 0}%
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <AlertTriangle className="text-red-600" size={24} />
            </div>
          </div>
          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-red-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(stats?.contamination_rate || 0, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* New Row: Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Overdue Batches */}
        <div className="bg-white rounded-lg shadow p-6 border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Krever Oppmerksomhet</p>
              <p className="text-3xl font-bold text-red-600 mt-2">
                {metrics?.overdueBatches.length || 0}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <AlertCircle className="text-red-600" size={24} />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {metrics?.overdueBatches.length > 0 ? 'Forsinket' : 'Ingen forsinkelser'}
          </p>
        </div>

        {/* Upcoming Harvest */}
        <div className="bg-white rounded-lg shadow p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Klar til Høst Snart</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {metrics?.upcomingHarvest.length || 0}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Calendar className="text-green-600" size={24} />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Neste 7 dager</p>
        </div>

        {/* Active LCs */}
        <div className="bg-white rounded-lg shadow p-6 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Aktive LC Kulturer</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">
                {lcCultures.length}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Beaker className="text-purple-600" size={24} />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Tilgjengelige kulturer</p>
        </div>
      </div>

      {/* Alert Section: Overdue & Upcoming */}
      {((metrics?.overdueBatches.length > 0) || (metrics?.upcomingHarvest.length > 0)) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Overdue Batches Detail */}
          {metrics?.overdueBatches.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6 border-2 border-red-200">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="text-red-600" size={20} />
                <h3 className="text-lg font-semibold">Krever Oppmerksomhet</h3>
              </div>
              <div className="space-y-2">
                {metrics.overdueBatches.slice(0, 5).map(batch => (
                  <div key={batch.id} className="border rounded p-2 text-sm hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold">{batch.spawn_batch || batch.bag_batch}</div>
                        <div className="text-gray-600 capitalize">{batch.strain_name}</div>
                      </div>
                      <div className="text-xs text-red-600">Forsinket</div>
                    </div>
                  </div>
                ))}
                {metrics.overdueBatches.length > 5 && (
                  <p className="text-xs text-gray-500">+ {metrics.overdueBatches.length - 5} flere</p>
                )}
              </div>
            </div>
          )}

          {/* Upcoming Harvest Detail */}
          {metrics?.upcomingHarvest.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6 border-2 border-green-200">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="text-green-600" size={20} />
                <h3 className="text-lg font-semibold">Kommende Høst (7 dager)</h3>
              </div>
              <div className="space-y-2">
                {metrics.upcomingHarvest.slice(0, 5).map(batch => (
                  <div key={batch.id} className="border rounded p-2 text-sm hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold">{batch.spawn_batch || batch.bag_batch}</div>
                        <div className="text-gray-600 capitalize">{batch.strain_name}</div>
                      </div>
                      {batch.bag_forventet_kolon && (
                        <div className="text-xs text-gray-500">
                          {formatDateShort(batch.bag_forventet_kolon)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {metrics.upcomingHarvest.length > 5 && (
                  <p className="text-xs text-gray-500">+ {metrics.upcomingHarvest.length - 5} flere</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">
          Om statistikken
        </h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Neste Kolonisering:</strong> Viser batch som er nærmest 100% kolonisering</li>
          <li>• <strong>Kontaminering:</strong> Beregnes nå per enhet, ikke per batch</li>
          <li>• <strong>Kjøleskap:</strong> Batches i kjøleskap telles ikke i aktiv vekst</li>
        </ul>
      </div>
    </div>
  );
};

export default Dashboard;