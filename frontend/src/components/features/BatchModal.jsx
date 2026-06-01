import React, { useState, useCallback, useMemo } from 'react';
import { X, Plus, Trash2, TrendingUp, CheckCircle, Clock } from 'lucide-react';
import {
  useBatch,
  useBatchInfo,
  useBatchUnits,
  useUpdateBatch,
  useCreateBatchUnitsBulk,
  useUpdateBatchUnit,
  useDeleteBatchUnit,
  useToggleContamination,
  useToggleFridge,
  useWorkflowStatus,
  useWorkflowTransition
} from '../../hooks/useApi';

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

  const { data: workflowStatus } = useWorkflowStatus(batchId);
  const transitionWorkflowMutation = useWorkflowTransition();

  const [localBatch, setLocalBatch] = useState(batch || {});
  const [unitEdits, setUnitEdits] = useState({});
  const [newUnitCount, setNewUnitCount] = useState(1);
  const [newUnitKg, setNewUnitKg] = useState(0.3);

  const totalSpawnKg = useMemo(() => {
    if (!units || units.length === 0) return 0;
    return units.reduce((sum, unit) => sum + (unit.kg || 0), 0).toFixed(2);
  }, [units]);

  React.useEffect(() => {
    if (batch) setLocalBatch(batch);
  }, [batch]);

  const handleChange = useCallback((field, value) => {
    setLocalBatch(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    await updateBatchMutation.mutateAsync({ id: batchId, data: localBatch });
    onClose();
  }, [localBatch, updateBatchMutation, batchId, onClose]);

  const handleUnitChange = useCallback((unitId, field, value) => {
    setUnitEdits(prev => ({
      ...prev,
      [unitId]: { ...(prev[unitId] || {}), [field]: value }
    }));
  }, []);

  const handleUnitSave = useCallback(async (unitId) => {
    const edits = unitEdits[unitId];
    if (edits && batch.spawn_batch) {
      await updateUnitMutation.mutateAsync({ spawnBatch: batch.spawn_batch, unitId, data: edits });
      setUnitEdits(prev => { const n = { ...prev }; delete n[unitId]; return n; });
    }
  }, [unitEdits, batch, updateUnitMutation]);

  const handleBulkCreate = useCallback(async () => {
    if (!batch.spawn_batch || newUnitCount < 1) return;
    await createUnitsBulkMutation.mutateAsync({
      spawnBatch: batch.spawn_batch,
      data: { count: newUnitCount, type: "Grain spawn glass", substrat: "Rug", kg: newUnitKg, dato_inok: new Date().toISOString(), status: "Inkubering" }
    });
    setNewUnitCount(1);
    setNewUnitKg(0.3);
  }, [batch, newUnitCount, newUnitKg, createUnitsBulkMutation]);

  if (isLoading || !batch) {
    return (
      <div className="modal-overlay">
        <div className="modal-panel p-8">
          <p className="text-sm text-zinc-400">Laster...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-panel max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="modal-header sticky top-0 bg-zinc-900 z-10">
          <div>
            <h2 className="text-lg font-semibold">Rediger Batch #{batch.id}</h2>
            <div className="flex gap-1.5 mt-1">
              {batch.lc_batch && (
                <span className="text-xs px-2 py-0.5 bg-zinc-800 text-zinc-600 rounded font-mono">
                  LC: {batch.lc_batch}
                </span>
              )}
              {batch.spawn_batch && (
                <span className="text-xs px-2 py-0.5 bg-zinc-800 text-zinc-600 rounded font-mono">
                  Spawn: {batch.spawn_batch}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost p-1">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* LC Details */}
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-zinc-100 mb-3">LC Culture</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">LC Kode</label>
                <div className="input bg-zinc-800 font-mono">{localBatch.lc_batch || '-'}</div>
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Volume</label>
                <div className="input bg-zinc-800">{localBatch.lc_vol || '-'}</div>
              </div>
            </div>
          </div>

          {/* Workflow Status */}
          {workflowStatus && (
            <div className="card p-4">
              <h3 className="text-sm font-semibold text-zinc-100 mb-3 flex items-center gap-1.5">
                <TrendingUp size={14} />
                Workflow Status
              </h3>

              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Current Stage</label>
                    <div className="input bg-zinc-800 font-medium capitalize">{workflowStatus.current_stage}</div>
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Day {workflowStatus.current_stage_day}</label>
                    <div className={`input text-center font-medium ${
                      workflowStatus.status === 'on_track' ? 'text-green-600' :
                      workflowStatus.status === 'slow' ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      {workflowStatus.status === 'on_track' ? 'On Track' :
                       workflowStatus.status === 'slow' ? 'Slow' : 'Very Slow'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Next Stage</label>
                    <div className="input bg-zinc-800 capitalize">{workflowStatus.next_stage || 'Complete'}</div>
                  </div>
                </div>

                {workflowStatus.predictions && Object.keys(workflowStatus.predictions).length > 0 && (
                  <div className="card p-3">
                    <h4 className="text-xs font-medium text-zinc-500 mb-2 flex items-center gap-1">
                      <Clock size={12} /> AI Predictions
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {workflowStatus.predictions.spawn_ready_date && (
                        <div>
                          <span className="text-zinc-500">Spawn Ready:</span>
                          <span className="ml-1 font-mono font-medium">
                            {new Date(workflowStatus.predictions.spawn_ready_date).toLocaleDateString()}
                            {workflowStatus.predictions.spawn_days_remaining !== undefined && (
                              <span className="text-zinc-400 ml-1">({workflowStatus.predictions.spawn_days_remaining}d)</span>
                            )}
                          </span>
                        </div>
                      )}
                      {workflowStatus.predictions.colonization_ready_date && (
                        <div>
                          <span className="text-zinc-500">Colonization:</span>
                          <span className="ml-1 font-mono font-medium">{new Date(workflowStatus.predictions.colonization_ready_date).toLocaleDateString()}</span>
                        </div>
                      )}
                      {workflowStatus.predictions.fruiting_ready_date && (
                        <div>
                          <span className="text-zinc-500">Fruiting:</span>
                          <span className="ml-1 font-mono font-medium">{new Date(workflowStatus.predictions.fruiting_ready_date).toLocaleDateString()}</span>
                        </div>
                      )}
                      {workflowStatus.predictions.flush1_harvest_date && (
                        <div>
                          <span className="text-zinc-500">Flush 1:</span>
                          <span className="ml-1 font-mono font-medium">{new Date(workflowStatus.predictions.flush1_harvest_date).toLocaleDateString()}</span>
                        </div>
                      )}
                      {workflowStatus.predictions.flush1_expected_kg && (
                        <div>
                          <span className="text-zinc-500">Forventet:</span>
                          <span className="ml-1 font-mono font-medium">{workflowStatus.predictions.flush1_expected_kg} kg</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {workflowStatus.available_actions && workflowStatus.available_actions.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {workflowStatus.available_actions.map(action => (
                      <button
                        key={action}
                        onClick={() => transitionWorkflowMutation.mutate({ batchId, action })}
                        disabled={transitionWorkflowMutation.isLoading}
                        className="btn-primary flex items-center gap-1.5 text-xs"
                      >
                        <CheckCircle size={14} />
                        {action.replace('start_', '').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Spawn Units */}
          {hasSpawnBatch && (
            <div className="card p-4">
              <h3 className="text-sm font-semibold text-zinc-100 mb-3">Spawn Units - {batch.spawn_batch}</h3>

              <div className="grid grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Total Units</label>
                  <div className="input bg-zinc-800 text-center font-mono font-medium">{units?.length || '0'}</div>
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Total Kg</label>
                  <div className="input bg-zinc-800 text-center font-mono font-medium">{totalSpawnKg} kg</div>
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Type</label>
                  <div className="input bg-zinc-800">{batch.spawn_type || '-'}</div>
                </div>
              </div>

              <div className="border-t border-zinc-800 pt-3">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-xs font-medium text-zinc-500">Spawn Units ({units?.length || 0})</h4>
                  <div className="flex gap-1.5 items-center">
                    <input type="number" min="1" value={newUnitCount} onChange={(e) => setNewUnitCount(parseInt(e.target.value) || 1)} className="input w-14 text-xs" placeholder="Ant" />
                    <input type="number" step="0.1" value={newUnitKg} onChange={(e) => setNewUnitKg(parseFloat(e.target.value) || 0.3)} className="input w-16 text-xs" placeholder="Kg" />
                    <button onClick={handleBulkCreate} className="btn-primary flex items-center gap-1 text-xs">
                      <Plus size={14} /> Add
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr>
                        <th className="th">Type</th>
                        <th className="th">Substrat</th>
                        <th className="th">Kg</th>
                        <th className="th">Dato Inok</th>
                        <th className="th">Status</th>
                        <th className="th">Used In Bag</th>
                        <th className="th">Kontam</th>
                        <th className="th">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {units?.map(unit => (
                        <tr key={unit.id} className={unit.contaminated ? 'bg-red-50' : ''}>
                          <td className="td p-1">
                            <select value={unitEdits[unit.id]?.type ?? unit.type} onChange={(e) => handleUnitChange(unit.id, 'type', e.target.value)} className="input text-xs w-full">
                              <option value="Grain spawn glass">Glass</option>
                              <option value="Grain spawn bag">Bag</option>
                            </select>
                          </td>
                          <td className="td p-1">
                            <select value={unitEdits[unit.id]?.substrat ?? unit.substrat} onChange={(e) => handleUnitChange(unit.id, 'substrat', e.target.value)} className="input text-xs w-full">
                              <option value="Rug">Rug</option>
                              <option value="Hvete">Hvete</option>
                              <option value="Havre">Havre</option>
                              <option value="Bygg">Bygg</option>
                            </select>
                          </td>
                          <td className="td p-1">
                            <input type="number" step="0.1" value={unitEdits[unit.id]?.kg ?? unit.kg} onChange={(e) => handleUnitChange(unit.id, 'kg', parseFloat(e.target.value))} className="input text-xs w-16" />
                          </td>
                          <td className="td p-1">
                            <input
                              type="date"
                              value={unitEdits[unit.id]?.dato_inok ? new Date(unitEdits[unit.id].dato_inok).toISOString().split('T')[0] : unit.dato_inok ? new Date(unit.dato_inok).toISOString().split('T')[0] : ''}
                              onChange={(e) => handleUnitChange(unit.id, 'dato_inok', e.target.value ? new Date(e.target.value).toISOString() : null)}
                              className="input text-xs"
                            />
                          </td>
                          <td className="td p-1">
                            <select value={unitEdits[unit.id]?.status ?? unit.status} onChange={(e) => handleUnitChange(unit.id, 'status', e.target.value)} className="input text-xs w-full">
                              <option value="Inkubering">Inkubering</option>
                              <option value="Klar">Klar</option>
                              <option value="Brukt">Brukt</option>
                              <option value="Forkastet">Forkastet</option>
                            </select>
                          </td>
                          <td className="td text-center font-mono">{unit.used_in_bag || '-'}</td>
                          <td className="td text-center">
                            <button
                              onClick={() => toggleContaminationMutation.mutate({ spawnBatch: batch.spawn_batch, unitId: unit.id, contaminated: !unit.contaminated })}
                              className={`px-2 py-0.5 rounded text-xs font-medium ${unit.contaminated ? 'text-red-600 bg-red-50' : 'text-green-600 bg-green-50'}`}
                            >
                              {unit.contaminated ? 'Kontam' : 'OK'}
                            </button>
                          </td>
                          <td className="td">
                            <div className="flex gap-1 justify-center">
                              {unitEdits[unit.id] && (
                                <button onClick={() => handleUnitSave(unit.id)} className="btn-primary text-xs px-2 py-0.5">Save</button>
                              )}
                              <button onClick={() => deleteUnitMutation.mutate({ spawnBatch: batch.spawn_batch, unitId: unit.id })} className="btn-ghost p-1 text-zinc-400 hover:text-red-600">
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
            <button onClick={onClose} className="btn">Avbryt</button>
            <button onClick={handleSave} className="btn-primary">Lagre</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BatchModal;
