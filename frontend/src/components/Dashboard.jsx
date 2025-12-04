import React, { useState } from 'react';
import { useStats, useNextColonization } from '../hooks/useApi';
import { TrendingUp, AlertTriangle, Package, Clock } from 'lucide-react';

const Dashboard = () => {
  const [selectedStrain, setSelectedStrain] = useState('oyster');
  
  const { data: stats, isLoading: statsLoading } = useStats(selectedStrain);
  const { data: nextColonization, isLoading: nextLoading, error: nextError } = useNextColonization();

  const strainOptions = [
    { value: 'oyster', label: 'Grå østers' },
    { value: 'shiitake', label: 'Shiitake' },
    { value: 'lions_mane', label: 'Lions Mane' },
  ];

  if (statsLoading) {
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