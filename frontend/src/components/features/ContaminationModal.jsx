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
    <div className="modal-overlay">
      <div className="modal-panel max-w-3xl">
        <div className="modal-header">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">Kontaminasjon</h2>
            <p className="text-xs text-zinc-500">{batch.bag_batch || batch.batch_type}</p>
          </div>
          <button onClick={onClose} className="btn-ghost p-1">
            <X size={20} />
          </button>
        </div>

        <div className="p-5">
          {/* Column headers */}
          <div className="flex items-center gap-1 mb-2 px-1">
            <div className="w-24 shrink-0" />
            {NUMBERS.map(n => (
              <div key={n} className="w-9 text-center text-xs font-medium text-zinc-400">{n}</div>
            ))}
            <div className="w-4" />
            {CONTAM_TYPES.map(t => (
              <div key={t} className="flex-1 text-center text-xs font-medium text-zinc-400 truncate px-0.5">
                {TYPE_LABELS[t]}
              </div>
            ))}
            <div className="w-4" />
            <div className="w-20 text-center text-xs font-medium text-amber-600">Abortert</div>
          </div>

          {/* Phase rows */}
          <div className="space-y-1.5 mb-4">
            {PHASES.map(phase => (
              <div key={phase.key} className="flex items-center gap-1 px-1">
                <div className="w-24 shrink-0 text-xs font-medium text-zinc-600">{phase.label}</div>

                {NUMBERS.map(num => {
                  const isSelected = values[phase.key] === num;
                  return (
                    <button
                      key={num}
                      onClick={() => handleSelectNum(phase.key, num)}
                      className={`w-9 h-8 rounded text-xs font-medium transition shrink-0 ${
                        isSelected ? 'bg-zinc-900 text-white' : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-200'
                      }`}
                    >
                      {num}
                    </button>
                  );
                })}

                <div className="shrink-0 w-4 flex justify-center"><div className="w-px h-5 bg-zinc-200" /></div>

                {CONTAM_TYPES.map(type => {
                  const isSelected = typeValues[phase.typeKey] === type;
                  return (
                    <button
                      key={type}
                      onClick={() => handleSelectType(phase.typeKey, type)}
                      className={`flex-1 h-8 rounded text-xs font-medium transition px-1 truncate ${
                        isSelected ? 'bg-zinc-900 text-white' : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-200'
                      }`}
                      title={type}
                    >
                      {TYPE_LABELS[type]}
                    </button>
                  );
                })}

                <div className="shrink-0 w-4 flex justify-center"><div className="w-px h-5 bg-zinc-200" /></div>

                <button
                  onClick={() => handleToggleAbort(phase.abortKey)}
                  className={`w-20 h-8 rounded text-xs font-medium transition shrink-0 ${
                    abortValues[phase.abortKey]
                      ? 'bg-amber-500 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-200'
                  }`}
                >
                  {abortValues[phase.abortKey] ? 'Ja' : 'Nei'}
                </button>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="flex gap-3 mb-4">
            <div className={`flex-1 card p-3 flex justify-between items-center ${total > 0 ? 'border-red-200' : ''}`}>
              <span className="text-xs text-zinc-500">Totalt kontaminert</span>
              <span className={`font-mono font-semibold ${total > 0 ? 'text-red-600' : 'text-zinc-400'}`}>
                {total} {total === 1 ? 'enhet' : 'enheter'}
              </span>
            </div>
            {Object.values(abortValues).some(Boolean) && (
              <div className="flex-1 card p-3 flex justify-between items-center border-amber-200">
                <span className="text-xs text-zinc-500">Abortert</span>
                <span className="font-mono font-semibold text-amber-600">
                  {Object.values(abortValues).filter(Boolean).length} fase(r)
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <button onClick={onClose} className="btn">Avbryt</button>
            <button onClick={handleSave} className="btn-primary">Lagre</button>
          </div>
        </div>
      </div>
    </div>
  );
}
