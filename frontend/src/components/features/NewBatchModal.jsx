import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { useCreateBatch, usePrintLabel, useLCCultures, useCreateLCCulture, useCreateBatchUnitsBulk } from '../../hooks/useApi';
import PrintDialog from './PrintDialog';

const NewBatchModal = ({ onClose }) => {
  const createBatchMutation = useCreateBatch();
  const printLabelMutation = usePrintLabel();
  const { data: lcCultures = [], isLoading: lcLoading } = useLCCultures({ active_only: true });
  const createLCMutation = useCreateLCCulture();
  const createUnitsBulkMutation = useCreateBatchUnitsBulk();

  const getTodayDate = () => new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    batch_type: 'Spawn',
    strain_name: '',
    lc_batch: '',
    lc_vol: '',
    spawn_type: 'Grain spawn glass',
    spawn_batch: '',
    spawn_dato_inok: getTodayDate()
  });

  const [unitConfig, setUnitConfig] = useState({ count: 1, kg: 0.3, substrat: 'Rug' });
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [createdBatch, setCreatedBatch] = useState(null);
  const [showAddLCModal, setShowAddLCModal] = useState(false);
  const [newLC, setNewLC] = useState({ lc_code: '', strain_name: 'oyster', source: '', date_created: getTodayDate(), notes: '' });

  useEffect(() => {
    if (formData.lc_batch) {
      const selectedLC = lcCultures.find(lc => lc.lc_code === formData.lc_batch);
      if (selectedLC && selectedLC.strain_name !== formData.strain_name) {
        setFormData(prev => ({ ...prev, strain_name: selectedLC.strain_name }));
      }
    }
  }, [formData.lc_batch]);

  const handleChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const cleanedData = {};
      Object.entries(formData).forEach(([key, value]) => {
        if (value === '') { cleanedData[key] = null; }
        else if (key.includes('dato') || key.includes('forventet')) { cleanedData[key] = value ? new Date(value).toISOString() : null; }
        else { cleanedData[key] = value; }
      });

      const newBatch = await createBatchMutation.mutateAsync(cleanedData);

      if (newBatch.spawn_batch && unitConfig.count > 0) {
        await createUnitsBulkMutation.mutateAsync({
          spawnBatch: newBatch.spawn_batch,
          data: { count: unitConfig.count, type: formData.spawn_type, substrat: unitConfig.substrat, kg: unitConfig.kg, dato_inok: new Date(formData.spawn_dato_inok).toISOString(), status: 'Inkubering' }
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
      if (result.success) { alert(result.message); setShowPrintDialog(false); onClose(); }
      else { alert('Print feilet: ' + result.message); }
    } catch (error) { alert('Print feilet: ' + error.message); }
  };

  const handleAddLC = async (e) => {
    e.preventDefault();
    try {
      const createdLC = await createLCMutation.mutateAsync(newLC);
      setFormData(prev => ({ ...prev, lc_batch: createdLC.lc_code, strain_name: createdLC.strain_name }));
      setShowAddLCModal(false);
      setNewLC({ lc_code: '', strain_name: 'oyster', source: '', date_created: getTodayDate(), notes: '' });
    } catch (error) {
      const errorMsg = error.response?.data?.detail || (typeof error.response?.data === 'string' ? error.response.data : null) || error.message || 'Unknown error';
      alert('Feil: ' + errorMsg);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-panel max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="modal-header sticky top-0 bg-zinc-900 z-10">
          <h2 className="text-lg font-semibold">Ny Batch</h2>
          <button onClick={onClose} className="btn-ghost p-1"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* LC Section */}
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-zinc-100 mb-3">LC Culture</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">LC Culture *</label>
                <select
                  value={formData.lc_batch}
                  onChange={(e) => e.target.value === '__ADD_NEW__' ? setShowAddLCModal(true) : handleChange('lc_batch', e.target.value)}
                  className="input w-full" required
                >
                  <option value="">Velg LC Culture...</option>
                  {lcCultures.map(lc => <option key={lc.id} value={lc.lc_code}>{lc.lc_code} ({lc.strain_name})</option>)}
                  <option value="__ADD_NEW__">+ Ny LC...</option>
                </select>
                {formData.lc_batch && lcCultures.find(lc => lc.lc_code === formData.lc_batch) && (
                  <div className="mt-1.5 p-2 bg-zinc-800 rounded text-xs text-zinc-500">
                    <div>Source: {lcCultures.find(lc => lc.lc_code === formData.lc_batch)?.source || 'N/A'}</div>
                    <div>Opprettet: {lcCultures.find(lc => lc.lc_code === formData.lc_batch)?.date_created?.split('T')[0] || 'N/A'}</div>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Volume</label>
                <select value={formData.lc_vol} onChange={(e) => handleChange('lc_vol', e.target.value)} className="input w-full">
                  <option value="">-</option>
                  <option value="3ml">3ml</option>
                  <option value="5ml">5ml</option>
                  <option value="10ml">10ml</option>
                </select>
              </div>
            </div>
            {formData.strain_name && (
              <div className="mt-2 text-xs text-zinc-500">
                Detektert strain: <span className="font-medium text-zinc-300 capitalize">{formData.strain_name}</span>
              </div>
            )}
          </div>

          {/* Spawn Section */}
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
                <label className="block text-xs text-zinc-500 mb-1">Spawn Batch *</label>
                <input type="text" value={formData.spawn_batch} onChange={(e) => handleChange('spawn_batch', e.target.value)} className="input w-full font-mono" placeholder="SP001" required />
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
              <div className="mt-1.5 text-xs text-zinc-400">
                {unitConfig.count} x {unitConfig.kg}kg = {(unitConfig.count * unitConfig.kg).toFixed(2)}kg total
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
            <button type="button" onClick={onClose} className="btn">Avbryt</button>
            <button type="submit" className="btn-primary" disabled={!formData.strain_name}>Opprett Batch</button>
          </div>
        </form>
      </div>

      {showPrintDialog && createdBatch && (
        <PrintDialog batch={createdBatch} onClose={() => { setShowPrintDialog(false); onClose(); }} onPrint={handlePrint} />
      )}

      {showAddLCModal && (
        <div className="modal-overlay" style={{ zIndex: 60 }}>
          <div className="modal-panel max-w-md">
            <div className="modal-header">
              <h3 className="text-lg font-semibold">Ny LC Culture</h3>
              <button onClick={() => setShowAddLCModal(false)} className="btn-ghost p-1"><X size={18} /></button>
            </div>
            <form onSubmit={handleAddLC} className="p-5 space-y-3">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">LC Code *</label>
                <input type="text" value={newLC.lc_code} onChange={(e) => setNewLC(prev => ({ ...prev, lc_code: e.target.value }))} className="input w-full font-mono" placeholder="GOH3, LOM2..." required />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Strain *</label>
                <select value={newLC.strain_name} onChange={(e) => setNewLC(prev => ({ ...prev, strain_name: e.target.value }))} className="input w-full" required>
                  <option value="oyster">Oyster</option>
                  <option value="lions_mane">Lions Mane</option>
                  <option value="shiitake">Shiitake</option>
                  <option value="reishi">Reishi</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Source</label>
                <input type="text" value={newLC.source} onChange={(e) => setNewLC(prev => ({ ...prev, source: e.target.value }))} className="input w-full" placeholder="Agar plate, spore syringe..." />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Dato</label>
                <input type="date" value={newLC.date_created} onChange={(e) => setNewLC(prev => ({ ...prev, date_created: e.target.value }))} className="input w-full" />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Notat</label>
                <textarea value={newLC.notes} onChange={(e) => setNewLC(prev => ({ ...prev, notes: e.target.value }))} className="input w-full" rows="2" />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                <button type="button" onClick={() => setShowAddLCModal(false)} className="btn">Avbryt</button>
                <button type="submit" className="btn-primary" disabled={!newLC.lc_code || !newLC.strain_name}>Opprett LC</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewBatchModal;
