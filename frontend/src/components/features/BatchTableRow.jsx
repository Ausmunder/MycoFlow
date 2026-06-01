import React from 'react';
import { ArrowRight, Archive, ArchiveRestore, Trash2 } from 'lucide-react';
import EditableCell from '../ui/EditableCell';
import DateButtonCell from '../ui/DateButtonCell';
import { getSpawnPrediction, getBagPrediction } from '../../utils/batchPredictions';
import { calculateDays, formatDateShort } from '../../utils/dateUtils';

const BatchTableRow = ({
  batch,
  showLC,
  showSpawn,
  showBag,
  selectedRows,
  toggleRowSelection,
  updateBatchMutation,
  deleteBatchMutation,
  handleCellClick,
  handleConvertToIncubation,
  handleUndoIncubation,
  handleConvertToBag,
  handleUndoFruiting,
  historicalData,
  substrateMixes = [],
  onOpenContaminationModal,
}) => {
  const totalContaminated =
    (batch.spawn_contaminated_units || 0) +
    (batch.inkubering_contaminated_units || 0) +
    (batch.frukt1_contaminated_units || 0) +
    (batch.frukt2_contaminated_units || 0);

  const formatDateInput = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toISOString().split('T')[0];
  };

  const spawnDays = calculateDays(batch.spawn_dato_inok);
  const bagDays = calculateDays(batch.bag_dato_inok);

  const spawnPrediction = getSpawnPrediction(batch, historicalData);
  const bagPrediction = getBagPrediction(batch, historicalData);

  return (
    <tr className={`hover:bg-zinc-800 transition-colors ${batch.archived ? 'opacity-50' : ''}`}>
      {/* Checkbox */}
      <td className="td text-center">
        <input
          type="checkbox"
          checked={selectedRows.includes(batch.id)}
          onChange={() => toggleRowSelection(batch.id)}
          className="rounded border-zinc-700 h-3.5 w-3.5 cursor-pointer"
        />
      </td>

      {/* Workflow Status */}
      <td className="td text-center">
        <span className="inline-flex items-center gap-1.5">
          <span className={`status-dot ${
            batch.workflow_status === 'spawning' ? 'bg-green-500' :
            batch.workflow_status === 'colonizing' ? 'bg-amber-500' :
            batch.workflow_status === 'fruiting' ? 'bg-orange-500' :
            batch.workflow_status === 'harvesting' ? 'bg-blue-500' :
            'bg-zinc-400'
          }`} />
          <span className={`text-xs ${
            batch.workflow_status === 'spawning' ? 'text-green-700' :
            batch.workflow_status === 'colonizing' ? 'text-amber-700' :
            batch.workflow_status === 'fruiting' ? 'text-orange-700' :
            batch.workflow_status === 'harvesting' ? 'text-blue-700' :
            'text-zinc-500'
          }`}>
            {batch.workflow_status || 'spawning'}
          </span>
        </span>
      </td>

      {/* LC Section */}
      {showLC && (
        <>
          <td className="td col-divider font-mono">{batch.lc_batch || '-'}</td>
          <td className="td">{batch.lc_vol || '-'}</td>
        </>
      )}

      {/* SPAWN Section */}
      {showSpawn && (
        <>
          <td className={`td ${!showLC ? 'col-divider' : ''}`}>{batch.spawn_type || '-'}</td>
          <td
            className="td font-mono cursor-pointer hover:bg-zinc-800"
            onClick={() => handleCellClick(batch, 'spawn_batch')}
          >
            {batch.spawn_batch || '-'}
          </td>
          <td
            className="td text-center font-mono cursor-pointer hover:bg-zinc-800"
            onClick={() => batch.spawn_batch && handleCellClick(batch, 'spawn_batch')}
            title="Klikk for å administrere enheter"
          >
            {batch.spawn_batch ? (
              <span className="font-medium">{batch.unit_count || '0'}</span>
            ) : '-'}
          </td>
          <td className="td p-0">
            <DateButtonCell
              value={batch.spawn_dato_inok}
              buttonLabel="Inok"
              onSave={(date) => {
                updateBatchMutation.mutate({
                  id: batch.id,
                  data: { spawn_dato_inok: date }
                });
              }}
            />
          </td>
          <td className="td text-center font-mono text-zinc-400">
            {batch.spawn_dato_inok ? spawnDays : '-'}
          </td>

          {/* AI Prediction for Spawn */}
          <td
            className={`td ${spawnPrediction.color}`}
            title={`AI-prediksjon basert på ${spawnPrediction.confidence > 0 ? `historiske data (${spawnPrediction.confidence}%)` : 'stammens baseline'}`}
          >
            {spawnPrediction.display}
            {spawnPrediction.confidence > 50 && (
              <span className="ml-0.5 text-amber-500 font-mono" title={`${spawnPrediction.confidence}% confidence`}>*</span>
            )}
          </td>

          {/* Fridge Date */}
          <td className="td p-0">
            <DateButtonCell
              value={batch.fridge_date}
              buttonLabel="Kjøl"
              onSave={(date) => {
                updateBatchMutation.mutate({
                  id: batch.id,
                  data: {
                    fridge_date: date,
                    in_fridge: date !== null
                  }
                });
              }}
            />
          </td>

          {/* Convert to Incubation */}
          <td className="td">
            {!batch.archived && (
              <button
                onClick={() => batch.bag_dato_inok ? handleUndoIncubation(batch) : handleConvertToIncubation(batch)}
                className={`btn-ghost px-1.5 py-0.5 text-xs ${
                  batch.bag_dato_inok
                    ? 'text-zinc-400 hover:text-zinc-600'
                    : 'text-amber-600 hover:text-amber-700'
                }`}
                title={batch.bag_dato_inok ? 'Angre Inkubering' : 'Konverter til Inkubering'}
              >
                <ArrowRight size={14} />
              </button>
            )}
          </td>
        </>
      )}

      {/* BAG Section - Inkubering */}
      {showBag && (
        <>
          <td className="td col-divider p-0">
            <EditableCell
              value={batch.bag_substrat_type || ''}
              type="select"
              options={['-', ...substrateMixes.map(mix => mix.name)]}
              onSave={(value) => {
                updateBatchMutation.mutate({
                  id: batch.id,
                  data: { bag_substrat_type: value === '-' ? null : value }
                });
              }}
            />
          </td>

          <td className="td p-0">
            <EditableCell
              value={batch.bag_antall_bager !== null && batch.bag_antall_bager !== undefined ? String(batch.bag_antall_bager) : '-'}
              type="select"
              options={['-', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20']}
              onSave={(value) => {
                updateBatchMutation.mutate({
                  id: batch.id,
                  data: { bag_antall_bager: value === '-' ? null : parseInt(value) }
                });
              }}
            />
          </td>

          <td className="td text-center font-mono" title="Auto-beregnet: bager x gram per bag">
            {batch.bag_kg_substrat ? `${batch.bag_kg_substrat.toFixed(2)}` : '-'}
          </td>

          <td className="td p-0">
            <EditableCell
              value={formatDateInput(batch.bag_dato_inok)}
              type="date"
              onSave={(value) => {
                updateBatchMutation.mutate({
                  id: batch.id,
                  data: { bag_dato_inok: value ? new Date(value + 'T12:00:00').toISOString() : null }
                });
              }}
            />
          </td>

          <td className="td text-center font-mono text-zinc-400">
            {batch.bag_dato_inok ? bagDays : '-'}
          </td>

          <td className="td p-0">
            <EditableCell
              value={batch.bag_temp ? String(Math.round(batch.bag_temp)) : '-'}
              type="select"
              options={['-', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28']}
              onSave={(value) => {
                updateBatchMutation.mutate({
                  id: batch.id,
                  data: { bag_temp: value === '-' ? null : parseFloat(value) }
                });
              }}
            />
          </td>

          {/* Convert to Fruiting */}
          <td className="td">
            {batch.bag_dato_inok && !batch.archived && (
              <button
                onClick={() => batch.bag_frukting_start ? handleUndoFruiting(batch) : handleConvertToBag(batch)}
                className={`btn-ghost px-1.5 py-0.5 text-xs ${
                  batch.bag_frukting_start
                    ? 'text-zinc-400 hover:text-zinc-600'
                    : 'text-orange-600 hover:text-orange-700'
                }`}
                title={batch.bag_frukting_start ? 'Angre Frukt' : 'Konverter til Frukt'}
              >
                <ArrowRight size={14} />
              </button>
            )}
          </td>

          {/* Frukt Section */}
          <td className="td col-divider p-0">
            <DateButtonCell
              value={batch.bag_frukting_start}
              buttonLabel="Frukt"
              onSave={(date) => {
                updateBatchMutation.mutate({
                  id: batch.id,
                  data: { bag_frukting_start: date }
                });
              }}
            />
          </td>

          {/* AI Prediction for Bag */}
          <td
            className={`td ${bagPrediction.color}`}
            title={`AI-prediksjon basert på ${bagPrediction.confidence > 0 ? `historiske data (${bagPrediction.confidence}%)` : 'stammens baseline'}`}
          >
            {bagPrediction.display}
            {bagPrediction.confidence > 50 && (
              <span className="ml-0.5 text-amber-500 font-mono" title={`${bagPrediction.confidence}% confidence`}>*</span>
            )}
          </td>

          {/* Fruiting Temperature */}
          <td className="td p-0">
            <EditableCell
              value={batch.bag_temp_kammer ? String(batch.bag_temp_kammer) : ''}
              type="select"
              options={['-', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28']}
              onSave={(value) => {
                updateBatchMutation.mutate({
                  id: batch.id,
                  data: { bag_temp_kammer: value === '-' ? null : parseFloat(value) }
                });
              }}
            />
          </td>

          {/* Humidity */}
          <td className="td p-0">
            <EditableCell
              value={batch.bag_lf_kammer ? String(batch.bag_lf_kammer) : ''}
              type="select"
              options={['-', '70', '75', '80', '85', '90', '95']}
              onSave={(value) => {
                updateBatchMutation.mutate({
                  id: batch.id,
                  data: { bag_lf_kammer: value === '-' ? null : parseFloat(value) }
                });
              }}
            />
          </td>

          {/* Harvest 1 */}
          <td className="td p-0">
            <DateButtonCell
              value={batch.bag_host1_start}
              buttonLabel="H1s"
              onSave={(date) => {
                updateBatchMutation.mutate({ id: batch.id, data: { bag_host1_start: date } });
              }}
            />
          </td>
          <td className="td p-0">
            <DateButtonCell
              value={batch.bag_host1_slutt}
              buttonLabel="H1e"
              onSave={(date) => {
                updateBatchMutation.mutate({ id: batch.id, data: { bag_host1_slutt: date } });
              }}
            />
          </td>
          <td className="td p-0">
            <EditableCell
              value={batch.bag_host1_total_kg || ''}
              type="number"
              onSave={(value) => {
                updateBatchMutation.mutate({
                  id: batch.id,
                  data: { bag_host1_total_kg: value ? parseFloat(value) : null }
                });
              }}
            />
          </td>

          {/* Harvest 2 */}
          <td className="td p-0">
            <DateButtonCell
              value={batch.bag_host2_start}
              buttonLabel="H2s"
              onSave={(date) => {
                updateBatchMutation.mutate({ id: batch.id, data: { bag_host2_start: date } });
              }}
            />
          </td>
          <td className="td p-0">
            <DateButtonCell
              value={batch.bag_host2_slutt}
              buttonLabel="H2e"
              onSave={(date) => {
                updateBatchMutation.mutate({ id: batch.id, data: { bag_host2_slutt: date } });
              }}
            />
          </td>
          <td className="td p-0">
            <EditableCell
              value={batch.bag_host2_total_kg || ''}
              type="number"
              onSave={(value) => {
                updateBatchMutation.mutate({
                  id: batch.id,
                  data: { bag_host2_total_kg: value ? parseFloat(value) : null }
                });
              }}
            />
          </td>

          {/* BE% */}
          <td className="td font-mono font-medium">
            {batch.bag_be_percent ? `${batch.bag_be_percent}%` : '-'}
          </td>

          {/* Notes */}
          <td className="td p-0">
            <EditableCell
              value={batch.notes || ''}
              type="text"
              onSave={(value) => {
                updateBatchMutation.mutate({
                  id: batch.id,
                  data: { notes: value || null }
                });
              }}
            />
          </td>

          {/* Contamination */}
          <td className="td text-center">
            <button
              onClick={() => onOpenContaminationModal && onOpenContaminationModal(batch)}
              className={`w-full px-1 py-0.5 rounded text-xs transition ${
                totalContaminated > 0
                  ? 'text-red-600 font-mono font-medium hover:bg-red-50'
                  : 'text-zinc-300 hover:text-zinc-500 hover:bg-zinc-800'
              }`}
              title="Registrer kontaminasjon per fase"
            >
              {totalContaminated > 0 ? totalContaminated : '-'}
            </button>
          </td>
        </>
      )}

      {/* Actions */}
      <td className="td">
        <div className="flex items-center gap-1">
          {!batch.archived ? (
            <button
              onClick={() => updateBatchMutation.mutate({ id: batch.id, data: { archived: true } })}
              className="btn-ghost p-1 text-zinc-400 hover:text-amber-600"
              title="Arkiver"
            >
              <Archive size={14} />
            </button>
          ) : (
            <button
              onClick={() => updateBatchMutation.mutate({ id: batch.id, data: { archived: false } })}
              className="btn-ghost p-1 text-zinc-400 hover:text-green-600"
              title="Gjenopprett"
            >
              <ArchiveRestore size={14} />
            </button>
          )}
          <button
            onClick={() => {
              if (window.confirm('Slette denne batchen?')) {
                deleteBatchMutation.mutate(batch.id);
              }
            }}
            className="btn-ghost p-1 text-zinc-400 hover:text-red-600"
            title="Slett"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default BatchTableRow;
