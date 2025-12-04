import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useCreateBatch, usePrintLabel } from '../hooks/useApi';
import PrintDialog from './PrintDialog';

const NewBatchModal = ({ onClose }) => {
  const createBatchMutation = useCreateBatch();
  const printLabelMutation = usePrintLabel();

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

  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [createdBatch, setCreatedBatch] = useState(null);

  // Map LC codes to strains
  const lcToStrain = {
    'GOH1': 'oyster',
    'GOH2': 'oyster',
    'LOM1': 'lions_mane',
    'SHI1': 'shiitake',
    'SHI2': 'shiitake'
  };

  // Auto-detect strain from LC code
  useEffect(() => {
    if (formData.lc_batch) {
      const lcPrefix = formData.lc_batch.split('-')[0];
      const detectedStrain = lcToStrain[lcPrefix];
      if (detectedStrain && detectedStrain !== formData.strain_name) {
        setFormData(prev => ({
          ...prev,
          strain_name: detectedStrain
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
            <h3 className="text-lg font-semibold mb-3 text-purple-800">LC Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">LC Kode</label>
                <input
                  type="text"
                  value={formData.lc_batch}
                  onChange={(e) => handleChange('lc_batch', e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="GOH1-190925"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Auto-detekterer strain: GOH1/GOH2=Oyster, LOM1=Lions Mane, SHI1/SHI2=Shiitake
                </p>
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
            <div className="grid grid-cols-3 gap-4">
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
                <label className="block text-sm font-medium mb-1">Spawn Batch</label>
                <input
                  type="text"
                  value={formData.spawn_batch}
                  onChange={(e) => handleChange('spawn_batch', e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="SP001"
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
    </div>
  );
};

export default NewBatchModal;
