import React, { useState, useCallback, useMemo } from 'react';
import { X, Refrigerator, Plus, Trash2 } from 'lucide-react';
import {
  useBatch,
  useBatchInfo,
  useBatchUnits,
  useUpdateBatch,
  useCreateBatchUnitsBulk,
  useUpdateBatchUnit,
  useDeleteBatchUnit,
  useToggleContamination,
  useToggleFridge
} from '../hooks/useApi';

const BatchModal = ({ batchId, onClose }) => {
  const { data: batch, isLoading } = useBatch(batchId);
  const updateBatchMutation = useUpdateBatch();

  const hasSpawnBatch = !!batch?.spawn_batch;
  const { data: batchInfo } = useBatchInfo(batch?.spawn_batch, { enabled: hasSpawnBatch });
  const { data: units } = useBatchUnits(batch?.spawn_batch, { enabled: hasSpawnBatch });

  const toggleFridgeMutation = useToggleFridge();
  const createUnitsBulkMutation = useCreateBatchUnitsBulk();
  const updateUnitMutation = useUpdateBatchUnit();
  const deleteUnitMutation = useDeleteBatchUnit();
  const toggleContaminationMutation = useToggleContamination();

  const [localBatch, setLocalBatch] = useState(batch || {});
  const [unitEdits, setUnitEdits] = useState({});
  const [newUnitCount, setNewUnitCount] = useState(1);
  const [newUnitKg, setNewUnitKg] = useState(0.3);

  // Calculate total kg from units
  const totalSpawnKg = useMemo(() => {
    if (!units || units.length === 0) return 0;
    return units.reduce((sum, unit) => sum + (unit.kg || 0), 0).toFixed(2);
  }, [units]);

  React.useEffect(() => {
    if (batch) {
      setLocalBatch(batch);
    }
  }, [batch]);

  const handleChange = useCallback((field, value) => {
    setLocalBatch(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleSave = useCallback(async () => {
    await updateBatchMutation.mutateAsync({ id: batchId, data: localBatch });
    onClose();
  }, [localBatch, updateBatchMutation, batchId, onClose]);

  const handleUnitChange = useCallback((unitId, field, value) => {
    setUnitEdits(prev => ({
      ...prev,
      [unitId]: {
        ...(prev[unitId] || {}),
        [field]: value
      }
    }));
  }, []);

  const handleUnitSave = useCallback(async (unitId) => {
    const edits = unitEdits[unitId];
    if (edits && batch.spawn_batch) {
      await updateUnitMutation.mutateAsync({
        spawnBatch: batch.spawn_batch,
        unitId,
        data: edits
      });
      setUnitEdits(prev => {
        const newEdits = { ...prev };
        delete newEdits[unitId];
        return newEdits;
      });
    }
  }, [unitEdits, batch, updateUnitMutation]);

  const handleBulkCreate = useCallback(async () => {
    if (!batch.spawn_batch || newUnitCount < 1) return;

    await createUnitsBulkMutation.mutateAsync({
      spawnBatch: batch.spawn_batch,
      data: {
        count: newUnitCount,
        type: "Grain spawn glass",
        substrat: "Rug",
        kg: newUnitKg,
        dato_inok: new Date().toISOString(),
        status: "Inkubering"
      }
    });

    setNewUnitCount(1);
    setNewUnitKg(0.3);
  }, [batch, newUnitCount, newUnitKg, createUnitsBulkMutation]);

  if (isLoading || !batch) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
          <div>
            <h2 className="text-2xl font-bold">Edit Batch #{batch.id}</h2>
            <div className="flex gap-2 mt-1">
              {batch.lc_batch && (
                <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded">
                  LC Kultur: {batch.lc_batch}
                </span>
              )}
              {batch.spawn_batch && (
                <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">
                  Spawn: {batch.spawn_batch}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* ===== LC DETAILS (Read-only) ===== */}
          <div className="border rounded-lg p-4 bg-purple-50">
            <h3 className="text-lg font-semibold mb-3 text-purple-800">LC Details (Read-only)</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <label className="block font-medium text-gray-700 mb-1">LC Kode</label>
                <div className="px-3 py-2 bg-white border rounded text-purple-900 font-semibold">
                  {localBatch.lc_batch || '-'}
                </div>
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">Volume</label>
                <div className="px-3 py-2 bg-white border rounded">
                  {localBatch.lc_vol || '-'}
                </div>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-600 italic">
              Redigér LC info i hovedvinduet eller via "Ny Batch" modal
            </div>
          </div>

          {/* ===== SPAWN DETAILS ===== */}
          <div className="border rounded-lg p-4 bg-green-50">
            <h3 className="text-lg font-semibold mb-3 text-green-800">Spawn Details</h3>
            <div className="grid grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={localBatch.spawn_type || ''}
                  onChange={(e) => handleChange('spawn_type', e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="">-</option>
                  <option value="Grain spawn glass">Grain spawn glass</option>
                  <option value="Grain spawn bag">Grain spawn bag</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Spawn Batch</label>
                <input
                  type="text"
                  value={localBatch.spawn_batch || ''}
                  onChange={(e) => handleChange('spawn_batch', e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="SP001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Units (#)</label>
                <input
                  type="text"
                  value={units?.length || '0'}
                  disabled
                  className="w-full px-3 py-2 border rounded bg-gray-100 font-semibold text-center"
                  title="Antall spawn enheter"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Dato Inokulert</label>
                <input
                  type="date"
                  value={localBatch.spawn_dato_inok ? new Date(localBatch.spawn_dato_inok).toISOString().split('T')[0] : ''}
                  onChange={(e) => handleChange('spawn_dato_inok', e.target.value ? new Date(e.target.value).toISOString() : null)}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Total Kg</label>
                <input
                  type="text"
                  value={totalSpawnKg}
                  disabled
                  className="w-full px-3 py-2 border rounded bg-gray-100 font-semibold text-center"
                  title="Beregnet fra enheter nedenfor"
                />
              </div>
            </div>

            {/* Units Management */}
            {hasSpawnBatch && (
              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-semibold">Spawn Units ({units?.length || 0})</h4>
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      min="1"
                      value={newUnitCount}
                      onChange={(e) => setNewUnitCount(parseInt(e.target.value) || 1)}
                      className="w-16 px-2 py-1 border rounded text-sm"
                      placeholder="Ant"
                    />
                    <input
                      type="number"
                      step="0.1"
                      value={newUnitKg}
                      onChange={(e) => setNewUnitKg(parseFloat(e.target.value) || 0.3)}
                      className="w-20 px-2 py-1 border rounded text-sm"
                      placeholder="Kg"
                    />
                    <button
                      onClick={handleBulkCreate}
                      className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                    >
                      <Plus size={16} />
                      Add Units
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border p-2">Type</th>
                        <th className="border p-2">Substrat</th>
                        <th className="border p-2">Kg</th>
                        <th className="border p-2">Dato Inok</th>
                        <th className="border p-2">Status</th>
                        <th className="border p-2">Used In Bag</th>
                        <th className="border p-2">Kontam</th>
                        <th className="border p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {units?.map(unit => (
                        <tr key={unit.id} className={unit.contaminated ? 'bg-red-50' : ''}>
                          <td className="border p-1">
                            <select
                              value={unitEdits[unit.id]?.type ?? unit.type}
                              onChange={(e) => handleUnitChange(unit.id, 'type', e.target.value)}
                              className="w-full px-1 py-1 text-xs"
                            >
                              <option value="Grain spawn glass">Grain spawn glass</option>
                              <option value="Grain spawn bag">Grain spawn bag</option>
                            </select>
                          </td>
                          <td className="border p-1">
                            <select
                              value={unitEdits[unit.id]?.substrat ?? unit.substrat}
                              onChange={(e) => handleUnitChange(unit.id, 'substrat', e.target.value)}
                              className="w-full px-1 py-1 text-xs"
                            >
                              <option value="Rug">Rug</option>
                              <option value="Hvete">Hvete</option>
                              <option value="Havre">Havre</option>
                              <option value="Bygg">Bygg</option>
                            </select>
                          </td>
                          <td className="border p-1">
                            <input
                              type="number"
                              step="0.1"
                              value={unitEdits[unit.id]?.kg ?? unit.kg}
                              onChange={(e) => handleUnitChange(unit.id, 'kg', parseFloat(e.target.value))}
                              className="w-full px-1 py-1 text-xs"
                            />
                          </td>
                          <td className="border p-1">
                            <input
                              type="date"
                              value={
                                unitEdits[unit.id]?.dato_inok
                                  ? new Date(unitEdits[unit.id].dato_inok).toISOString().split('T')[0]
                                  : unit.dato_inok
                                  ? new Date(unit.dato_inok).toISOString().split('T')[0]
                                  : ''
                              }
                              onChange={(e) => handleUnitChange(unit.id, 'dato_inok', e.target.value ? new Date(e.target.value).toISOString() : null)}
                              className="w-full px-1 py-1 text-xs"
                            />
                          </td>
                          <td className="border p-1">
                            <select
                              value={unitEdits[unit.id]?.status ?? unit.status}
                              onChange={(e) => handleUnitChange(unit.id, 'status', e.target.value)}
                              className="w-full px-1 py-1 text-xs"
                            >
                              <option value="Inkubering">Inkubering</option>
                              <option value="Klar">Klar</option>
                              <option value="Brukt">Brukt</option>
                              <option value="Forkastet">Forkastet</option>
                            </select>
                          </td>
                          <td className="border p-1 text-center text-xs">
                            {unit.used_in_bag || '-'}
                          </td>
                          <td className="border p-1 text-center">
                            <button
                              onClick={() => toggleContaminationMutation.mutate({
                                spawnBatch: batch.spawn_batch,
                                unitId: unit.id,
                                contaminated: !unit.contaminated
                              })}
                              className={`px-2 py-1 text-xs rounded ${
                                unit.contaminated
                                  ? 'bg-red-200 text-red-800'
                                  : 'bg-green-200 text-green-800'
                              }`}
                            >
                              {unit.contaminated ? '⚠️ Kontam' : '✓ OK'}
                            </button>
                          </td>
                          <td className="border p-1">
                            <div className="flex gap-1 justify-center">
                              {unitEdits[unit.id] && (
                                <button
                                  onClick={() => handleUnitSave(unit.id)}
                                  className="px-2 py-1 bg-blue-500 text-white text-xs rounded"
                                >
                                  Save
                                </button>
                              )}
                              <button
                                onClick={() => deleteUnitMutation.mutate({
                                  spawnBatch: batch.spawn_batch,
                                  unitId: unit.id
                                })}
                                className="text-red-600"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* ===== ACTIONS ===== */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BatchModal;
