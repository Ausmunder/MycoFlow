import React, { useState } from 'react';
import { X, Printer } from 'lucide-react';

const PrintDialog = ({ batch, onClose, onPrint }) => {
  const [copies, setCopies] = useState(1);
  const [printing, setPrinting] = useState(false);

  const handlePrint = async () => {
    setPrinting(true);
    try {
      await onPrint(batch.id, copies);
    } finally {
      setPrinting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="bg-slate-800 text-white px-6 py-4 flex justify-between items-center rounded-t-lg">
          <div className="flex items-center gap-2">
            <Printer size={24} />
            <h2 className="text-xl font-bold">Print Label</h2>
          </div>
          <button onClick={onClose} className="text-white hover:text-gray-300">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Batch Info */}
          <div className="bg-slate-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-2">
              {batch.spawn_batch || `Batch #${batch.id}`}
            </h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p><span className="font-medium">Strain:</span> {batch.strain_name}</p>
              {batch.lc_batch && (
                <p><span className="font-medium">LC:</span> {batch.lc_batch}</p>
              )}
              <p><span className="font-medium">QR Code:</span> {batch.qr_code || `SOPP-${batch.id}`}</p>
            </div>
          </div>

          {/* Copies Selector */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Antall kopier:
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={copies}
              onChange={(e) => setCopies(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-slate-500"
            />
          </div>

          {/* Info Note */}
          <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded">
            <p>📄 Label vil bli printet på 62mm Brother QL-820NWB printer</p>
            <p>🏷️ Inneholder: QR kode + Batch info</p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
            disabled={printing}
          >
            Hopp over
          </button>
          <button
            onClick={handlePrint}
            disabled={printing}
            className="px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-700 disabled:opacity-50 flex items-center gap-2"
          >
            {printing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Printer...
              </>
            ) : (
              <>
                <Printer size={18} />
                Print {copies > 1 ? `(${copies} stk)` : ''}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrintDialog;
