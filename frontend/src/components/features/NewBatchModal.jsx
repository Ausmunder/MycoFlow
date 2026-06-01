import React, { useState, useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
import {
  useCreateBatch, usePrintLabel, useCultures, useBatches, useCreateBatchUnitsBulk,
} from '../../hooks/useApi';
import PrintDialog from './PrintDialog';

const getTodayDate = () => new Date().toISOString().split('T')[0];

// Client-side mirror of backend next_batch_code: {prefix}-B{NN} (per lineage).
function suggestBatchCode(prefix, batches) {
  if (!prefix) return '';
  const marker = `${prefix}-B`;
  let max = 0;
  for (const b of batches) {
    const code = b.spawn_batch;
    if (!code || !code.startsWith(marker)) continue;
    const m = code.slice(marker.length).match(/^(\d+)/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  const n = max + 1;
  const width = n < 100 ? 2 : 3;
  return `${prefix}-B${String(n).padStart(width, '0')}`;
}

const NewBatchModal = ({ onClose }) => {
  const createBatchMutation = useCreateBatch();
  const printLabelMutation = usePrintLabel();
  const createUnitsBulkMutation = useCreateBatchUnitsBulk();
  const { data: cultures = [], isLoading: culturesLoading } = useCultures({ active_only: true });
  const { data: allBatches = [] } = useBatches();

  const [formData, setFormData] = useState({
    batch_type: 'Spawn',
    strain_name: '',
    source_culture_id: '',
    lc_batch: '',
    lc_vol: '',
    spawn_type: 'Grain spawn glass',
    spawn_batch: '',
    spawn_dato_inok: getTodayDate(),
  });

  const [autoName, setAutoName] = useState(true);
  const [unitConfig, setUnitConfig] = useState({ count: 1, kg: 0.3, substrat: 'Rug' });
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [createdBatch, setCreatedBatch] = useState(null);

  // Prefer LC cultures at the top of the selector (typical inoculation source)
  const sortedCultures = useMemo(
    () => [...cultures].sort(
      (a, b) => (a.media_type === 'LC' ? 0 : 1) - (b.media_type === 'LC' ? 0 : 1) || a.code.localeCompare(b.code)
    ),
    [cultures]
  );

  const selectedCulture = cultures.find(c => String(c.id) === String(formData.source_culture_id));

  // When source culture changes: derive lineage + suggest batch code
  useEffect(() => {
    if (!selectedCulture) return;
    const prefix = selectedCulture.strain_prefix || selectedCulture.code.split('-')[0] || '';
    setFormData(prev => ({
      ...prev,
      lc_batch: selectedCulture.code,
      spawn_batch: autoName ? suggestBatchCode(prefix, allBatches) : prev.spawn_batch,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.source_culture_id]);

  const handleChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const cleaned = {};
      Object.entries(formData).forEach(([key, value]) => {
        if (value === '') cleaned[key] = null;
        else if (key === 'source_culture_id') cleaned[key] = parseInt(value);
        else if (key.includes('dato') || key.includes('forventet')) cleaned[key] = value ? new Date(value).toISOString() : null;
        else cleaned[key] = value;
      });
      // strain_name is required by the backend; backend will also derive it from the culture's strain
      if (!cleaned.strain_name) cleaned.strain_name = formData.strain_name || 'oyster';

      const newBatch = await createBatchMutation.mutateAsync(cleaned);

      if (newBatch.spawn_batch && unitConfig.count > 0) {
        await createUnitsBulkMutation.mutateAsync({
          spawnBatch: newBatch.spawn_batch,
          data: {
            count: unitConfig.count, type: formData.spawn_type, substrat: unitConfig.substrat,
            kg: unitConfig.kg, dato_inok: new Date(formData.spawn_dato_inok).toISOString(), status: 'Inkubering',
          },
        });
      }

      setCreatedBatch(newBatch);
      setShowPrintDialog(true);
    } catch (error) {
      console.error('Error creating batch:', error);
      alert('Feil: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handlePrint = async (batchId, copies) => {
    try {
      const result = await printLabelMutation.mutateAsync({ batchId, copies });
      if (result.success) { setShowPrintDialog(false); onClose(); }
      else alert('Print feilet: ' + result.message);
    } catch (error) { alert('Print feilet: ' + error.message); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-panel max-w-3xl">
        <div className="modal-header">
          <h2 className="text-lg font-semibold">Ny Batch</h2>
          <button onClick={onClose} className="btn-ghost p-1"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Source culture */}
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-zinc-100 mb-3">Kilde-kultur</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Kultur *</label>
                <select value={formData.source_culture_id} onChange={(e) => handleChange('source_culture_id', e.target.value)} className="input w-full" required>
                  <option value="">{culturesLoading ? 'Laster…' : 'Velg kultur…'}</option>
                  {sortedCultures.map(c => (
                    <option key={c.id} value={c.id}>{c.code} · {c.media_type}</option>
                  ))}
                </select>
                {cultures.length === 0 && !culturesLoading && (
                  <p className="mt-1 text-[11px] text-amber-400">Ingen kulturer ennå — opprett en under «Kulturer».</p>
                )}
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">LC Volum</label>
                <select value={formData.lc_vol} onChange={(e) => handleChange('lc_vol', e.target.value)} className="input w-full">
                  <option value="">-</option>
                  <option value="3ml">3ml</option>
                  <option value="5ml">5ml</option>
                  <option value="10ml">10ml</option>
                </select>
              </div>
            </div>
            {selectedCulture && (
              <div className="mt-2 text-xs text-zinc-500">
                Lineage: <span className="font-mono text-zinc-300">{selectedCulture.strain_prefix || selectedCulture.code.split('-')[0]}</span>
              </div>
            )}
          </div>

          {/* Spawn */}
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-zinc-100 mb-3">Spawn</h3>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Type</label>
                <select value={formData.spawn_type} onChange={(e) => handleChange('spawn_type', e.target.value)} className="input w-full">
                  <option value="Grain spawn glass">Grain spawn glass</option>
                  <option value="Grain spawn bag">Grain spawn bag</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Batch-kode</label>
                <input
                  type="text"
                  value={formData.spawn_batch}
                  onChange={(e) => { setAutoName(false); handleChange('spawn_batch', e.target.value); }}
                  className="input w-full font-mono"
                  placeholder="auto (HE9514-B01)"
                />
                <p className="mt-1 text-[10px] text-zinc-600">{autoName ? 'Auto-foreslått fra kultur' : 'Manuell'} · tom = backend genererer</p>
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Dato Inokulert</label>
                <input type="date" value={formData.spawn_dato_inok} onChange={(e) => handleChange('spawn_dato_inok', e.target.value)} className="input w-full" />
              </div>
            </div>

            <div className="border-t border-zinc-800 pt-3">
              <h4 className="text-xs font-medium text-zinc-500 mb-2">Spawn Units</h4>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Antall *</label>
                  <input type="number" min="1" value={unitConfig.count} onChange={(e) => setUnitConfig(prev => ({ ...prev, count: parseInt(e.target.value) || 1 }))} className="input w-full" required />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Kg/enhet *</label>
                  <input type="number" step="0.1" min="0.1" value={unitConfig.kg} onChange={(e) => setUnitConfig(prev => ({ ...prev, kg: parseFloat(e.target.value) || 0.3 }))} className="input w-full" required />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Substrat</label>
                  <select value={unitConfig.substrat} onChange={(e) => setUnitConfig(prev => ({ ...prev, substrat: e.target.value }))} className="input w-full">
                    <option value="Rug">Rug</option>
                    <option value="Hvete">Hvete</option>
                    <option value="Havre">Havre</option>
                    <option value="Bygg">Bygg</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Total Kg</label>
                  <input type="text" value={(unitConfig.count * unitConfig.kg).toFixed(2)} disabled className="input w-full bg-zinc-800 font-mono font-medium text-center" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
            <button type="button" onClick={onClose} className="btn">Avbryt</button>
            <button type="submit" className="btn-primary" disabled={!formData.source_culture_id}>Opprett Batch</button>
          </div>
        </form>
      </div>

      {showPrintDialog && createdBatch && (
        <PrintDialog batch={createdBatch} onClose={() => { setShowPrintDialog(false); onClose(); }} onPrint={handlePrint} />
      )}
    </div>
  );
};

export default NewBatchModal;
