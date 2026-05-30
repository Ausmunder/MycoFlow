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
      <div className="bg-zinc-900 rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="bg-zinc-800 text-zinc-100 px-6 py-4 flex justify-between items-center rounded-t-lg border-b border-zinc-700">
          <div className="flex items-center gap-2">
            <Printer size={22} />
            <h2 className="text-lg font-semibold">Skriv ut etikett</h2>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-100">
            <X size={22} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Batch Info */}
          <div className="bg-zinc-800 border border-zinc-700 p-4 rounded-lg">
            <h3 className="font-semibold font-mono text-base mb-2 text-zinc-100">
              {batch.spawn_batch || `Batch #${batch.id}`}
            </h3>
            <div className="text-sm text-zinc-400 space-y-1">
              <p><span className="font-medium text-zinc-300">Strain:</span> {batch.strain_name}</p>
              {batch.lc_batch && (
                <p><span className="font-medium text-zinc-300">Kultur:</span> {batch.lc_batch}</p>
              )}
              <p><span className="font-medium text-zinc-300">QR:</span> {batch.qr_code || `SOPP-${batch.id}`}</p>
            </div>
          </div>

          {/* Copies Selector */}
          <div>
            <label className="block text-sm font-medium mb-2 text-zinc-300">
              Antall kopier:
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={copies}
              onChange={(e) => setCopies(parseInt(e.target.value) || 1)}
              className="input w-full"
            />
          </div>

          {/* Info Note */}
          <div className="text-xs text-zinc-500 bg-zinc-800 border border-zinc-700 p-3 rounded">
            <p>📄 Etiketten skrives ut på 62mm Brother QL-820NWB</p>
            <p>🏷️ Inneholder: QR-kode + batch-info</p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-zinc-950 border-t border-zinc-800 px-6 py-4 flex justify-end gap-3 rounded-b-lg">
          <button
            onClick={onClose}
            className="btn"
            disabled={printing}
          >
            Hopp over
          </button>
          <button
            onClick={handlePrint}
            disabled={printing}
            className="btn-primary disabled:opacity-50 flex items-center gap-2"
          >
            {printing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-zinc-900"></div>
                Skriver ut…
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
