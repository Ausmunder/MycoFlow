import { useState } from 'react';
import { X } from 'lucide-react';

const PHASES = [
  { key: 'spawn_contaminated_units',      typeKey: 'spawn_contamination_type',      abortKey: 'spawn_abortert',      label: 'Spawn' },
  { key: 'inkubering_contaminated_units', typeKey: 'inkubering_contamination_type', abortKey: 'inkubering_abortert', label: 'Inkubering' },
  { key: 'frukt1_contaminated_units',     typeKey: 'frukt1_contamination_type',     abortKey: 'frukt1_abortert',     label: 'Frukt 1' },
  { key: 'frukt2_contaminated_units',     typeKey: 'frukt2_contamination_type',     abortKey: 'frukt2_abortert',     label: 'Frukt 2' },
];

const NUMBERS = [1, 2, 3, 4, 5];
const CONTAM_TYPES = ['Grønn mugg', 'Sort mugg', 'Cobweb', 'Wet spot'];
const TYPE_LABELS = { 'Grønn mugg': 'Grønn', 'Sort mugg': 'Sort', 'Cobweb': 'Cobweb', 'Wet spot': 'Wet sp.' };

const Divider = () => (
  <div className="shrink-0 flex items-center justify-center w-4">
    <div className="w-px h-6 bg-gray-300" />
  </div>
);

export default function ContaminationModal({ batch, onClose, onSave }) {
  const [values, setValues] = useState({
    spawn_contaminated_units:      batch.spawn_contaminated_units || 0,
    inkubering_contaminated_units: batch.inkubering_contaminated_units || 0,
    frukt1_contaminated_units:     batch.frukt1_contaminated_units || 0,
    frukt2_contaminated_units:     batch.frukt2_contaminated_units || 0,
  });

  const [typeValues, setTypeValues] = useState({
    spawn_contamination_type:      batch.spawn_contamination_type || null,
    inkubering_contamination_type: batch.inkubering_contamination_type || null,
    frukt1_contamination_type:     batch.frukt1_contamination_type || null,
    frukt2_contamination_type:     batch.frukt2_contamination_type || null,
  });

  const [abortValues, setAbortValues] = useState({
    spawn_abortert:      batch.spawn_abortert || false,
    inkubering_abortert: batch.inkubering_abortert || false,
    frukt1_abortert:     batch.frukt1_abortert || false,
    frukt2_abortert:     batch.frukt2_abortert || false,
  });

  const total = Object.values(values).reduce((sum, v) => sum + (v || 0), 0);

  const handleSelectNum = (phaseKey, num) =>
    setValues(prev => ({ ...prev, [phaseKey]: prev[phaseKey] === num ? 0 : num }));

  const handleSelectType = (typeKey, type) =>
    setTypeValues(prev => ({ ...prev, [typeKey]: prev[typeKey] === type ? null : type }));

  const handleToggleAbort = (abortKey) =>
    setAbortValues(prev => ({ ...prev, [abortKey]: !prev[abortKey] }));

  const handleSave = () => {
    onSave({ ...values, ...typeValues, ...abortValues });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Kontaminasjon</h2>
            <p className="text-sm text-gray-500">{batch.bag_batch || batch.batch_type}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={22} />
          </button>
        </div>

        {/* Column headers */}
        <div className="flex items-center gap-1 mb-2 px-1">
          <div className="w-24 shrink-0" />
          {NUMBERS.map(n => (
            <div key={n} className="w-9 text-center text-xs font-medium text-gray-500">{n}</div>
          ))}
          <div className="w-4" />
          {CONTAM_TYPES.map(t => (
            <div key={t} className="flex-1 text-center text-xs font-medium text-gray-500 truncate px-0.5">
              {TYPE_LABELS[t]}
            </div>
          ))}
          <div className="w-4" />
          <div className="w-20 text-center text-xs font-medium text-amber-600">Abortert</div>
        </div>

        {/* Phase rows */}
        <div className="space-y-2 mb-5">
          {PHASES.map(phase => (
            <div key={phase.key} className="flex items-center gap-1 px-1">
              {/* Label */}
              <div className="w-24 shrink-0 text-sm font-medium text-gray-700 truncate">{phase.label}</div>

              {/* Number buttons */}
              {NUMBERS.map(num => {
                const isSelected = values[phase.key] === num;
                return (
                  <button
                    key={num}
                    onClick={() => handleSelectNum(phase.key, num)}
                    className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all shrink-0 ${
                      isSelected ? 'bg-red-500 text-white shadow-md scale-105' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {num}
                  </button>
                );
              })}

              <Divider />

              {/* Type buttons */}
              {CONTAM_TYPES.map(type => {
                const isSelected = typeValues[phase.typeKey] === type;
                return (
                  <button
                    key={type}
                    onClick={() => handleSelectType(phase.typeKey, type)}
                    className={`flex-1 h-9 rounded-lg text-xs font-medium transition-all px-1 truncate ${
                      isSelected ? 'bg-orange-500 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    title={type}
                  >
                    {TYPE_LABELS[type]}
                  </button>
                );
              })}

              <Divider />

              {/* Abortert toggle */}
              <button
                onClick={() => handleToggleAbort(phase.abortKey)}
                className={`w-20 h-9 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                  abortValues[phase.abortKey]
                    ? 'bg-amber-400 text-white shadow-md'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {abortValues[phase.abortKey] ? '✓ Ja' : 'Nei'}
              </button>
            </div>
          ))}
        </div>

        {/* Summary row */}
        <div className="flex gap-3 mb-5">
          <div className={`flex-1 rounded-lg px-4 py-3 flex justify-between items-center ${
            total > 0 ? 'bg-red-50 border border-red-200' : 'bg-gray-50 border border-gray-200'
          }`}>
            <span className="text-sm font-medium text-gray-700">Totalt kontaminert</span>
            <span className={`text-lg font-bold ${total > 0 ? 'text-red-600' : 'text-gray-400'}`}>
              {total} {total === 1 ? 'enhet' : 'enheter'}
            </span>
          </div>
          {Object.values(abortValues).some(Boolean) && (
            <div className="flex-1 rounded-lg px-4 py-3 flex justify-between items-center bg-amber-50 border border-amber-200">
              <span className="text-sm font-medium text-gray-700">Abortert</span>
              <span className="text-lg font-bold text-amber-600">
                {Object.values(abortValues).filter(Boolean).length} fase(r)
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition">
            Avbryt
          </button>
          <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">
            Lagre
          </button>
        </div>
      </div>
    </div>
  );
}
