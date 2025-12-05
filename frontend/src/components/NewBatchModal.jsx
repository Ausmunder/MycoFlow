import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { useCreateBatch, usePrintLabel, useLCCultures, useCreateLCCulture, useCreateBatchUnitsBulk } from '../hooks/useApi';
import PrintDialog from './PrintDialog';

const NewBatchModal = ({ onClose }) => {
  const createBatchMutation = useCreateBatch();
  const printLabelMutation = usePrintLabel();
  const { data: lcCultures = [], isLoading: lcLoading } = useLCCultures({ active_only: true });
  const createLCMutation = useCreateLCCulture();
  const createUnitsBulkMutation = useCreateBatchUnitsBulk();

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState({
    batch_type: 'Spawn',
    strain_name: '',

    // LC
    lc_batch: '',
    lc_vol: '',

    // Spawn
    spawn_type: 'Grain spawn glass',
    spawn_batch: '',
    spawn_dato_inok: getTodayDate()
  });

  const [unitConfig, setUnitConfig] = useState({
    count: 1,
    kg: 0.3,
    substrat: 'Rug'
  });

  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [createdBatch, setCreatedBatch] = useState(null);
  const [showAddLCModal, setShowAddLCModal] = useState(false);
  const [newLC, setNewLC] = useState({
    lc_code: '',
    strain_name: 'oyster',
    source: '',
    date_created: getTodayDate(),
    notes: ''
  });

  // Auto-detect strain from selected LC
  useEffect(() => {
    if (formData.lc_batch) {
      const selectedLC = lcCultures.find(lc => lc.lc_code === formData.lc_batch);
      if (selectedLC && selectedLC.strain_name !== formData.strain_name) {
        setFormData(prev => ({
          ...prev,
          strain_name: selectedLC.strain_name
        }));
      }
    }
  }, [formData.lc_batch]);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Convert empty strings to null and dates to ISO format
      const cleanedData = {};
      Object.entries(formData).forEach(([key, value]) => {
        if (value === '') {
          cleanedData[key] = null;
        } else if (key.includes('dato') || key.includes('forventet')) {
          cleanedData[key] = value ? new Date(value).toISOString() : null;
        } else {
          cleanedData[key] = value;
        }
      });

      console.log('Sending data:', cleanedData);
      const newBatch = await createBatchMutation.mutateAsync(cleanedData);

      // Create spawn units if spawn_batch is provided
      if (newBatch.spawn_batch && unitConfig.count > 0) {
        await createUnitsBulkMutation.mutateAsync({
          spawnBatch: newBatch.spawn_batch,
          data: {
            count: unitConfig.count,
            type: formData.spawn_type,
            substrat: unitConfig.substrat,
            kg: unitConfig.kg,
            dato_inok: new Date(formData.spawn_dato_inok).toISOString(),
            status: 'Inkubering'
          }
        });
      }

      // Show print dialog
      setCreatedBatch(newBatch);
      setShowPrintDialog(true);
    } catch (error) {
      console.error('Error creating batch:', error);
      alert('Error creating batch: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handlePrint = async (batchId, copies) => {
    try {
      const result = await printLabelMutation.mutateAsync({ batchId, copies });
      if (result.success) {
        alert(`✅ ${result.message}`);
        setShowPrintDialog(false);
        onClose();
      } else {
        alert(`❌ Print feilet: ${result.message}`);
      }
    } catch (error) {
      alert(`❌ Print feilet: ${error.message}`);
    }
  };

  const handleSkipPrint = () => {
    setShowPrintDialog(false);
    onClose();
  };

  const handleAddLC = async (e) => {
    e.preventDefault();
    try {
      const createdLC = await createLCMutation.mutateAsync(newLC);
      // Select the newly created LC
      setFormData(prev => ({
        ...prev,
        lc_batch: createdLC.lc_code,
        strain_name: createdLC.strain_name
      }));
      setShowAddLCModal(false);
      // Reset form
      setNewLC({
        lc_code: '',
        strain_name: 'oyster',
        source: '',
        date_created: getTodayDate(),
        notes: ''
      });
    } catch (error) {
      alert('Error creating LC: ' + (error.response?.data?.detail || error.message));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold">Ny Batch</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* ===== LC SECTION ===== */}
          <div className="border rounded-lg p-4 bg-purple-50">
            <h3 className="text-lg font-semibold mb-3 text-purple-800">LC Culture Selection</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">LC Culture *</label>
                <div className="flex gap-2">
                  <select
                    value={formData.lc_batch}
                    onChange={(e) => {
                      if (e.target.value === '__ADD_NEW__') {
                        setShowAddLCModal(true);
                      } else {
                        handleChange('lc_batch', e.target.value);
                      }
                    }}
                    className="flex-1 px-3 py-2 border rounded"
                    required
                  >
                    <option value="">Select LC Culture...</option>
                    {lcCultures.map(lc => (
                      <option key={lc.id} value={lc.lc_code}>
                        {lc.lc_code} ({lc.strain_name})
                      </option>
                    ))}
                    <option value="__ADD_NEW__">+ Add New LC...</option>
                  </select>
                </div>
                {formData.lc_batch && lcCultures.find(lc => lc.lc_code === formData.lc_batch) && (
                  <div className="mt-2 p-2 bg-purple-100 rounded text-xs">
                    <div><strong>Source:</strong> {lcCultures.find(lc => lc.lc_code === formData.lc_batch)?.source || 'N/A'}</div>
                    <div><strong>Created:</strong> {lcCultures.find(lc => lc.lc_code === formData.lc_batch)?.date_created?.split('T')[0] || 'N/A'}</div>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Volume</label>
                <select
                  value={formData.lc_vol}
                  onChange={(e) => handleChange('lc_vol', e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="">-</option>
                  <option value="3ml">3ml</option>
                  <option value="5ml">5ml</option>
                  <option value="10ml">10ml</option>
                </select>
              </div>
            </div>
            {formData.strain_name && (
              <div className="mt-3 p-2 bg-purple-100 rounded">
                <span className="text-sm font-medium">Detektert strain: </span>
                <span className="text-sm capitalize">{formData.strain_name}</span>
              </div>
            )}
          </div>

          {/* ===== SPAWN SECTION ===== */}
          <div className="border rounded-lg p-4 bg-green-50">
            <h3 className="text-lg font-semibold mb-3 text-green-800">Spawn Details</h3>

            {/* Basic Info */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={formData.spawn_type}
                  onChange={(e) => handleChange('spawn_type', e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="Grain spawn glass">Grain spawn glass</option>
                  <option value="Grain spawn bag">Grain spawn bag</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Spawn Batch *</label>
                <input
                  type="text"
                  value={formData.spawn_batch}
                  onChange={(e) => handleChange('spawn_batch', e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="SP001"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Dato Inokulert</label>
                <input
                  type="date"
                  value={formData.spawn_dato_inok}
                  onChange={(e) => handleChange('spawn_dato_inok', e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
            </div>

            {/* Units Configuration */}
            <div className="border-t pt-4 mt-2">
              <h4 className="text-sm font-semibold mb-3 text-green-700">Spawn Units</h4>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Antall enheter *</label>
                  <input
                    type="number"
                    min="1"
                    value={unitConfig.count}
                    onChange={(e) => setUnitConfig(prev => ({ ...prev, count: parseInt(e.target.value) || 1 }))}
                    className="w-full px-3 py-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Kg per enhet *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={unitConfig.kg}
                    onChange={(e) => setUnitConfig(prev => ({ ...prev, kg: parseFloat(e.target.value) || 0.3 }))}
                    className="w-full px-3 py-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Substrat</label>
                  <select
                    value={unitConfig.substrat}
                    onChange={(e) => setUnitConfig(prev => ({ ...prev, substrat: e.target.value }))}
                    className="w-full px-3 py-2 border rounded"
                  >
                    <option value="Rug">Rug</option>
                    <option value="Hvete">Hvete</option>
                    <option value="Havre">Havre</option>
                    <option value="Bygg">Bygg</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Total Kg</label>
                  <input
                    type="text"
                    value={(unitConfig.count * unitConfig.kg).toFixed(2)}
                    disabled
                    className="w-full px-3 py-2 border rounded bg-gray-100 font-semibold text-center"
                  />
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-600 italic">
                {unitConfig.count} × {unitConfig.kg}kg = {(unitConfig.count * unitConfig.kg).toFixed(2)}kg total
              </div>
            </div>
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
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              disabled={!formData.strain_name}
            >
              Create Batch
            </button>
          </div>
        </form>
      </div>

      {/* Print Dialog */}
      {showPrintDialog && createdBatch && (
        <PrintDialog
          batch={createdBatch}
          onClose={handleSkipPrint}
          onPrint={handlePrint}
        />
      )}

      {/* Add New LC Modal */}
      {showAddLCModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="border-b px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold">Add New LC Culture</h3>
              <button onClick={() => setShowAddLCModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddLC} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">LC Code *</label>
                <input
                  type="text"
                  value={newLC.lc_code}
                  onChange={(e) => setNewLC(prev => ({ ...prev, lc_code: e.target.value }))}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="GOH3, LOM2, etc."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Strain *</label>
                <select
                  value={newLC.strain_name}
                  onChange={(e) => setNewLC(prev => ({ ...prev, strain_name: e.target.value }))}
                  className="w-full px-3 py-2 border rounded"
                  required
                >
                  <option value="oyster">Oyster</option>
                  <option value="lions_mane">Lions Mane</option>
                  <option value="shiitake">Shiitake</option>
                  <option value="reishi">Reishi</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Source</label>
                <input
                  type="text"
                  value={newLC.source}
                  onChange={(e) => setNewLC(prev => ({ ...prev, source: e.target.value }))}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="Agar plate #3, Spore syringe, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date Created</label>
                <input
                  type="date"
                  value={newLC.date_created}
                  onChange={(e) => setNewLC(prev => ({ ...prev, date_created: e.target.value }))}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={newLC.notes}
                  onChange={(e) => setNewLC(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border rounded"
                  rows="3"
                  placeholder="Additional notes..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddLCModal(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                  disabled={!newLC.lc_code || !newLC.strain_name}
                >
                  <Plus size={16} className="inline mr-1" />
                  Add LC
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewBatchModal;
