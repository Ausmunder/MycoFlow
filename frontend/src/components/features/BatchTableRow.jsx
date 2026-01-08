import React from 'react';
import { ArrowRight } from 'lucide-react';
import EditableCell from '../ui/EditableCell';
import DateButtonCell from '../ui/DateButtonCell';
import { getSpawnPrediction, getBagPrediction } from '../../utils/batchPredictions';

/**
 * BatchTableRow - Single row in BatchTable
 * Renders all cells for a batch with editable fields, workflow buttons, and AI predictions
 */
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
}) => {
  // Helper to format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toISOString().split('T')[0];
  };

  // Get AI predictions
  const spawnPrediction = getSpawnPrediction(batch, historicalData);
  const bagPrediction = getBagPrediction(batch, historicalData);

  return (
    <tr className={batch.archived ? 'bg-gray-100' : ''}>
      {/* Checkbox */}
      <td className="border p-1 text-center">
        <input
          type="checkbox"
          checked={selectedRows.includes(batch.id)}
          onChange={() => toggleRowSelection(batch.id)}
          className="cursor-pointer"
        />
      </td>

      {/* Workflow Status */}
      <td className="border p-1 text-center text-xs">
        <span className={`px-2 py-1 rounded ${
          batch.workflow_status === 'spawning' ? 'bg-green-100 text-green-800' :
          batch.workflow_status === 'colonizing' ? 'bg-amber-100 text-amber-800' :
          batch.workflow_status === 'fruiting' ? 'bg-orange-100 text-orange-800' :
          batch.workflow_status === 'harvesting' ? 'bg-blue-100 text-blue-800' :
          batch.workflow_status === 'completed' ? 'bg-gray-100 text-gray-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {batch.workflow_status || 'spawning'}
        </span>
      </td>

      {/* LC Section */}
      {showLC && (
        <>
          <td className="border p-1">{batch.lc_batch || '-'}</td>
          <td className="border p-1">{batch.lc_vol || '-'}</td>
        </>
      )}

      {/* SPAWN Section */}
      {showSpawn && (
        <>
          <td className="border p-1">{batch.spawn_type || '-'}</td>
          <td
            className="border p-1 cursor-pointer hover:bg-blue-50"
            onClick={() => handleCellClick(batch, 'spawn_batch')}
          >
            {batch.spawn_batch || '-'}
          </td>
          <td
            className="border p-1 text-center cursor-pointer hover:bg-blue-50 text-xs"
            onClick={() => batch.spawn_batch && handleCellClick(batch, 'spawn_batch')}
            title="Klikk for å administrere enheter"
          >
            {batch.spawn_batch ? (
              <span className="font-medium">{batch.unit_count || '0'}</span>
            ) : (
              '-'
            )}
          </td>
          <td className="border p-0">
            <DateButtonCell
              value={batch.spawn_dato_inok}
              buttonLabel="Inok"
              onSave={(date) => {
                updateBatchMutation.mutate({
                  id: batch.id,
                  data: { spawn_dato_inok: date }
                });
              }}
              className="text-xs"
            />
          </td>
          <td className="border p-1 bg-slate-100">{batch.spawn_dager_ink || '-'}</td>

          {/* AI Prediction for Spawn */}
          <td
            className={`border p-1 text-xs ${spawnPrediction.color}`}
            title={`AI-predicted colonization based on ${spawnPrediction.confidence > 0 ? `historical data (${spawnPrediction.confidence}% confidence)` : 'strain baseline'}`}
          >
            {spawnPrediction.display}
            {spawnPrediction.confidence > 50 && (
              <span className="ml-1 text-yellow-600" title={`${spawnPrediction.confidence}% confidence from historical data`}>
                ⭐
              </span>
            )}
          </td>

          {/* Spawn Contamination */}
          <td className="border p-0">
            <EditableCell
              value={batch.spawn_contaminated_units !== null && batch.spawn_contaminated_units !== undefined ? String(batch.spawn_contaminated_units) : '-'}
              type="select"
              options={['-', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10']}
              onSave={(value) => {
                updateBatchMutation.mutate({
                  id: batch.id,
                  data: { spawn_contaminated_units: value === '-' ? null : parseInt(value) }
                });
              }}
              className="text-xs"
            />
          </td>

          {/* Fridge Date */}
          <td className="border p-0">
            <DateButtonCell
              value={batch.fridge_date}
              buttonLabel="❄️"
              onSave={(date) => {
                updateBatchMutation.mutate({
                  id: batch.id,
                  data: {
                    fridge_date: date,
                    in_fridge: date !== null
                  }
                });
              }}
              className="text-xs"
            />
          </td>

          {/* Convert to Incubation button */}
          <td className="border p-1">
            {!batch.archived && (
              <button
                onClick={() => batch.bag_dato_inok ? handleUndoIncubation(batch) : handleConvertToIncubation(batch)}
                className={`p-1 rounded text-xs ${
                  batch.bag_dato_inok
                    ? 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    : 'bg-amber-100 hover:bg-amber-200 text-amber-700'
                }`}
                title={batch.bag_dato_inok ? "Klikk for å angre Inkubering" : "Konverter til Inkubering"}
              >
                →Ink
              </button>
            )}
          </td>
        </>
      )}

      {/* BAG Section - Inkubering */}
      {showBag && (
        <>
          {/* Substrat */}
          <td className="border p-0">
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
              className="text-xs"
            />
          </td>

          {/* Antall bager */}
          <td className="border p-0">
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
              className="text-xs"
            />
          </td>

          {/* Kg substrat (auto-calculated) */}
          <td className="border p-1 text-center text-xs bg-slate-50" title="Auto-beregnet: Antall bager × gram per bag">
            {batch.bag_kg_substrat ? `${batch.bag_kg_substrat.toFixed(2)} kg` : '-'}
          </td>

          {/* Inkuberingsdato */}
          <td className="border p-0">
            <EditableCell
              value={formatDate(batch.bag_dato_inok)}
              type="date"
              onSave={(value) => {
                updateBatchMutation.mutate({
                  id: batch.id,
                  data: { bag_dato_inok: value ? new Date(value + 'T12:00:00').toISOString() : null }
                });
              }}
              className="text-xs"
            />
          </td>

          <td className="border p-1 bg-slate-100">{batch.bag_dager_ink || '-'}</td>

          {/* Incubation Temperature */}
          <td className="border p-0">
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
              className="text-xs"
            />
          </td>

          {/* Convert to Fruiting button */}
          <td className="border p-1">
            {batch.bag_dato_inok && !batch.archived && (
              <button
                onClick={() => batch.bag_frukting_start ? handleUndoFruiting(batch) : handleConvertToBag(batch)}
                className={`p-1 rounded text-xs ${
                  batch.bag_frukting_start
                    ? 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    : 'bg-orange-100 hover:bg-orange-200 text-orange-700'
                }`}
                title={batch.bag_frukting_start ? "Klikk for å angre Frukt" : "Konverter til Frukt"}
              >
                <ArrowRight size={14} />
              </button>
            )}
          </td>

          {/* Frukt Section */}
          {/* AI Prediction for Bag */}
          <td
            className={`border p-1 text-xs ${bagPrediction.color}`}
            title={`AI-predicted fruiting date based on ${bagPrediction.confidence > 0 ? `historical data (${bagPrediction.confidence}% confidence)` : 'strain baseline'}`}
          >
            {bagPrediction.display}
            {bagPrediction.confidence > 50 && (
              <span className="ml-1 text-yellow-600" title={`${bagPrediction.confidence}% confidence from historical data`}>
                ⭐
              </span>
            )}
          </td>

          {/* Fruiting Temperature */}
          <td className="border p-0">
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
              className="text-xs"
            />
          </td>

          {/* Humidity */}
          <td className="border p-0">
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
              className="text-xs"
            />
          </td>

          {/* Harvest 1 - Start */}
          <td className="border p-0">
            <DateButtonCell
              value={batch.bag_host1_start}
              buttonLabel="H1s"
              onSave={(date) => {
                updateBatchMutation.mutate({
                  id: batch.id,
                  data: { bag_host1_start: date }
                });
              }}
              className="text-xs"
            />
          </td>

          {/* Harvest 1 - End */}
          <td className="border p-0">
            <DateButtonCell
              value={batch.bag_host1_slutt}
              buttonLabel="H1e"
              onSave={(date) => {
                updateBatchMutation.mutate({
                  id: batch.id,
                  data: { bag_host1_slutt: date }
                });
              }}
              className="text-xs"
            />
          </td>

          {/* Harvest 1 - Total kg */}
          <td className="border p-0">
            <EditableCell
              value={batch.bag_host1_total_kg || ''}
              type="number"
              onSave={(value) => {
                updateBatchMutation.mutate({
                  id: batch.id,
                  data: { bag_host1_total_kg: value ? parseFloat(value) : null }
                });
              }}
              className="text-xs"
            />
          </td>

          {/* Harvest 2 - Start */}
          <td className="border p-0">
            <DateButtonCell
              value={batch.bag_host2_start}
              buttonLabel="H2s"
              onSave={(date) => {
                updateBatchMutation.mutate({
                  id: batch.id,
                  data: { bag_host2_start: date }
                });
              }}
              className="text-xs"
            />
          </td>

          {/* Harvest 2 - End */}
          <td className="border p-0">
            <DateButtonCell
              value={batch.bag_host2_slutt}
              buttonLabel="H2e"
              onSave={(date) => {
                updateBatchMutation.mutate({
                  id: batch.id,
                  data: { bag_host2_slutt: date }
                });
              }}
              className="text-xs"
            />
          </td>

          {/* Harvest 2 - Total kg */}
          <td className="border p-0">
            <EditableCell
              value={batch.bag_host2_total_kg || ''}
              type="number"
              onSave={(value) => {
                updateBatchMutation.mutate({
                  id: batch.id,
                  data: { bag_host2_total_kg: value ? parseFloat(value) : null }
                });
              }}
              className="text-xs"
            />
          </td>

          {/* BE% (Biological Efficiency) */}
          <td className="border p-1 font-bold">
            {batch.bag_be_percent ? `${batch.bag_be_percent}%` : '-'}
          </td>

          {/* Notes */}
          <td className="border p-0">
            <EditableCell
              value={batch.notes || ''}
              type="text"
              onSave={(value) => {
                updateBatchMutation.mutate({
                  id: batch.id,
                  data: { notes: value || null }
                });
              }}
              className="text-xs"
            />
          </td>

          {/* Contaminated units */}
          <td className="border p-0">
            <EditableCell
              value={batch.contaminated_units !== null && batch.contaminated_units !== undefined ? String(batch.contaminated_units) : '-'}
              type="select"
              options={['-', ...Array.from({length: (batch.unit_count || 0) + 1}, (_, i) => String(i))]}
              onSave={(value) => {
                updateBatchMutation.mutate({
                  id: batch.id,
                  data: { contaminated_units: value === '-' ? null : parseInt(value) }
                });
              }}
              className="text-xs"
            />
          </td>
        </>
      )}

      {/* Actions */}
      <td className="border p-1">
        <div className="flex gap-1">
          {!batch.archived && (
            <button
              onClick={() => updateBatchMutation.mutate({ id: batch.id, data: { archived: true } })}
              className="text-amber-600 text-xs"
              title="Archive"
            >
              📦
            </button>
          )}
          {batch.archived && (
            <button
              onClick={() => updateBatchMutation.mutate({ id: batch.id, data: { archived: false } })}
              className="text-green-600 text-xs"
              title="Unarchive"
            >
              ↩️
            </button>
          )}
          <button
            onClick={() => {
              if (window.confirm('Delete this batch?')) {
                deleteBatchMutation.mutate(batch.id);
              }
            }}
            className="text-red-600"
          >
            ✕
          </button>
        </div>
      </td>
    </tr>
  );
};

export default BatchTableRow;
