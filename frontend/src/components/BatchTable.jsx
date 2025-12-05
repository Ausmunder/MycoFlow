import React, { useState, useMemo } from 'react';
import { useBatches, useUpdateBatch, useDeleteBatch, useBulkArchive, useBulkDelete, usePredictColonization } from '../hooks/useApi';
import BatchModal from './BatchModal';
import NewBatchModal from './NewBatchModal';
import LCManager from './LCManager';
import EditableCell from './EditableCell';
import DateButtonCell from './DateButtonCell';
import { formatDateShort } from '../utils/dateFormat';
import { ChevronDown, ChevronUp, Plus, Archive, Trash2, Refrigerator, ArrowRight, Beaker } from 'lucide-react';

const BatchTable = () => {
  const { data: batches, isLoading } = useBatches();
  const updateBatchMutation = useUpdateBatch();
  const deleteBatchMutation = useDeleteBatch();
  const bulkArchiveMutation = useBulkArchive();
  const bulkDeleteMutation = useBulkDelete();
  const predictColonizationMutation = usePredictColonization();
  const [selectedBatchId, setSelectedBatchId] = useState(null);
  const [isNewBatchModalOpen, setIsNewBatchModalOpen] = useState(false);
  const [isLCManagerOpen, setIsLCManagerOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [sortColumn, setSortColumn] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  
  // Column visibility toggles
  const [showLC, setShowLC] = useState(true);
  const [showSpawn, setShowSpawn] = useState(true);
  const [showBag, setShowBag] = useState(true);

  // Filter states
  const [strainFilter, setStrainFilter] = useState('all');
  const [archivedFilter, setArchivedFilter] = useState(false);

  // Get unique strains for filter
  const strains = useMemo(() => {
    if (!batches) return [];
    const uniqueStrains = [...new Set(batches.map(b => b.strain_name))];
    return uniqueStrains.sort();
  }, [batches]);

  // Filter and sort batches
  const filteredBatches = useMemo(() => {
    if (!batches) return [];
    
    let filtered = batches.filter(b => {
      if (strainFilter !== 'all' && b.strain_name !== strainFilter) return false;
      if (archivedFilter !== b.archived) return false;
      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      let aVal = a[sortColumn];
      let bVal = b[sortColumn];
      
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      
      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  }, [batches, strainFilter, archivedFilter, sortColumn, sortDirection]);

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const toggleRowSelection = (id) => {
    setSelectedRows(prev => 
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  const handleBulkArchive = async () => {
    if (selectedRows.length === 0) return;
    if (!window.confirm(`Archive ${selectedRows.length} batches?`)) return;
    
    await bulkArchiveMutation.mutateAsync(selectedRows);
    setSelectedRows([]);
  };

  const handleBulkDelete = async () => {
    if (selectedRows.length === 0) return;
    if (!window.confirm(`DELETE ${selectedRows.length} batches permanently?`)) return;
    
    await bulkDeleteMutation.mutateAsync(selectedRows);
    setSelectedRows([]);
  };

  const handleCellClick = (batch, cellType) => {
    // Only open modal for spawn_batch cells
    if (cellType === 'spawn_batch' && batch.spawn_batch) {
      setSelectedBatchId(batch.id);
    }
  };

  const handleConvertToBag = async (batch) => {
    if (!window.confirm(`Konverter ${batch.spawn_batch} til Bag-batch?`)) return;

    try {
      // Get prediction for expected colonization date
      const today = new Date().toISOString();
      const prediction = await predictColonizationMutation.mutateAsync({
        strain_name: batch.strain_name,
        bag_dato_inok: today,
        kg_substrat: null // Will be filled in later
      });

      // Update batch to Bag type with predicted colonization date
      await updateBatchMutation.mutateAsync({
        id: batch.id,
        data: {
          batch_type: 'Bag',
          bag_batch: batch.spawn_batch, // Keep same batch name
          bag_dato_inok: today,
          bag_forventet_kolon: prediction.expected_date,
          bag_status: 'Inokulert'
        }
      });
    } catch (error) {
      console.error('Failed to convert to bag:', error);
      alert('Kunne ikke konvertere til Bag. Se konsoll for detaljer.');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toISOString().split('T')[0];
  };

  const calculateDays = (startDate) => {
    if (!startDate) return '';
    const start = new Date(startDate);
    const now = new Date();
    const days = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    return days >= 0 ? days : '';
  };

  const isOverdue = (expectedDate) => {
    if (!expectedDate) return false;
    return new Date(expectedDate) < new Date();
  };

  if (isLoading) {
    return <div className="p-4">Loading batches...</div>;
  }

  return (
    <div className="p-4">
      {/* Header Controls */}
      <div className="mb-4 flex justify-between items-center">
        <div className="flex gap-4 items-center">
          <h1 className="text-2xl font-bold">Sopp Tracker v4.6.1</h1>
          
          {/* Column Toggles */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowLC(!showLC)}
              className={`px-3 py-1 text-sm rounded ${showLC ? 'bg-purple-200' : 'bg-gray-200'}`}
            >
              LC
            </button>
            <button
              onClick={() => setShowSpawn(!showSpawn)}
              className={`px-3 py-1 text-sm rounded ${showSpawn ? 'bg-green-200' : 'bg-gray-200'}`}
            >
              SPAWN
            </button>
            <button
              onClick={() => setShowBag(!showBag)}
              className={`px-3 py-1 text-sm rounded ${showBag ? 'bg-amber-200' : 'bg-gray-200'}`}
            >
              BAG
            </button>
          </div>

          {/* Filters */}
          <select
            value={strainFilter}
            onChange={(e) => setStrainFilter(e.target.value)}
            className="px-3 py-1 border rounded"
          >
            <option value="all">All Strains</option>
            {strains.map(strain => (
              <option key={strain} value={strain}>{strain}</option>
            ))}
          </select>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={archivedFilter}
              onChange={(e) => setArchivedFilter(e.target.checked)}
            />
            Show Archived
          </label>
        </div>

        <div className="flex gap-2">
          {selectedRows.length > 0 && (
            <>
              <button
                onClick={handleBulkArchive}
                className="flex items-center gap-1 px-3 py-2 bg-amber-600 text-white rounded hover:bg-amber-700"
              >
                <Archive size={16} />
                Archive ({selectedRows.length})
              </button>
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-1 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                <Trash2 size={16} />
                Delete ({selectedRows.length})
              </button>
            </>
          )}
          <button
            onClick={() => setIsLCManagerOpen(true)}
            className="flex items-center gap-1 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            <Beaker size={16} />
            LC Manager
          </button>
          <button
            onClick={() => setIsNewBatchModalOpen(true)}
            className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <Plus size={16} />
            Ny Batch
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="border-collapse w-full text-xs">
          <thead>
            {/* Row 1: Section Headers */}
            <tr className="bg-slate-200">
              <th rowSpan="2" className="border p-2">☑</th>
              <th colSpan="2" className={`border p-2 bg-purple-100 ${!showLC && 'hidden'}`}>LC</th>
              <th colSpan="7" className={`border p-2 bg-green-100 ${!showSpawn && 'hidden'}`}>SPAWN</th>
              <th colSpan="19" className={`border p-2 bg-amber-100 ${!showBag && 'hidden'}`}>BAG</th>
              <th rowSpan="2" className="border p-2">Action</th>
            </tr>

            {/* Row 2: Column Headers */}
            <tr className="bg-slate-100">
              {/* LC */}
              <th onClick={() => handleSort('lc_batch')} className={`border p-1 cursor-pointer hover:bg-slate-200 ${!showLC && 'hidden'}`}>
                Kode {sortColumn === 'lc_batch' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th className={`border p-1 ${!showLC && 'hidden'}`}>Vol</th>

              {/* SPAWN */}
              <th className={`border p-1 ${!showSpawn && 'hidden'}`}>Type</th>
              <th onClick={() => handleSort('spawn_batch')} className={`border p-1 cursor-pointer hover:bg-slate-200 ${!showSpawn && 'hidden'}`}>
                Batch {sortColumn === 'spawn_batch' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th className={`border p-1 ${!showSpawn && 'hidden'}`}>#</th>
              <th onClick={() => handleSort('spawn_dato_inok')} className={`border p-1 cursor-pointer hover:bg-slate-200 ${!showSpawn && 'hidden'}`}>
                Inok {sortColumn === 'spawn_dato_inok' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th className={`border p-1 ${!showSpawn && 'hidden'}`}>Dg</th>
              <th className={`border p-1 ${!showSpawn && 'hidden'}`}>Forv Bag</th>
              <th className={`border p-1 ${!showSpawn && 'hidden'}`}>❄️</th>

              {/* BAG */}
              <th className={`border p-1 ${!showBag && 'hidden'}`}>Subst</th>
              <th className={`border p-1 ${!showBag && 'hidden'}`}>Kg</th>
              <th className={`border p-1 ${!showBag && 'hidden'}`}>Inok</th>
              <th className={`border p-1 ${!showBag && 'hidden'}`}>Dg</th>
              <th className={`border p-1 ${!showBag && 'hidden'}`}>Status</th>
              <th className={`border p-1 ${!showBag && 'hidden'}`}>Forv Frukt</th>
              <th className={`border p-1 ${!showBag && 'hidden'}`}>Frukt</th>
              <th className={`border p-1 ${!showBag && 'hidden'}`}>T</th>
              <th className={`border p-1 ${!showBag && 'hidden'}`}>LF</th>
              <th className={`border p-1 ${!showBag && 'hidden'}`}>H1s</th>
              <th className={`border p-1 ${!showBag && 'hidden'}`}>H1e</th>
              <th className={`border p-1 ${!showBag && 'hidden'}`}>H1+</th>
              <th className={`border p-1 ${!showBag && 'hidden'}`}>H1t</th>
              <th className={`border p-1 ${!showBag && 'hidden'}`}>H2s</th>
              <th className={`border p-1 ${!showBag && 'hidden'}`}>H2e</th>
              <th className={`border p-1 ${!showBag && 'hidden'}`}>Syk</th>
              <th className={`border p-1 ${!showBag && 'hidden'}`}>H2+</th>
              <th className={`border p-1 ${!showBag && 'hidden'}`}>BE%</th>
              <th className={`border p-1 ${!showBag && 'hidden'}`}>Notater</th>
            </tr>
          </thead>

          <tbody>
            {filteredBatches.map(batch => (
              <tr key={batch.id} className={batch.archived ? 'bg-gray-100' : ''}>
                {/* Checkbox */}
                <td className="border p-1 text-center">
                  <input
                    type="checkbox"
                    checked={selectedRows.includes(batch.id)}
                    onChange={() => toggleRowSelection(batch.id)}
                    className="cursor-pointer"
                  />
                </td>

                {/* LC Section */}
                <td className={`border p-1 ${!showLC && 'hidden'}`}>
                  {batch.lc_batch || '-'}
                </td>
                <td className={`border p-1 ${!showLC && 'hidden'}`}>
                  {batch.lc_vol || '-'}
                </td>

                {/* SPAWN Section */}
                <td className={`border p-1 ${!showSpawn && 'hidden'}`}>
                  {batch.spawn_type || '-'}
                </td>
                <td
                  className={`border p-1 cursor-pointer hover:bg-blue-50 ${!showSpawn && 'hidden'}`}
                  onClick={() => handleCellClick(batch, 'spawn_batch')}
                >
                  {batch.spawn_batch || '-'}
                </td>
                <td
                  className={`border p-1 text-center cursor-pointer hover:bg-blue-50 text-xs ${!showSpawn && 'hidden'}`}
                  onClick={() => batch.spawn_batch && handleCellClick(batch, 'spawn_batch')}
                  title="Klikk for å se enheter"
                >
                  {batch.spawn_batch ? (batch.unit_count || '0') : '-'}
                </td>
                <td className={`border p-1 ${!showSpawn && 'hidden'}`}>
                  {formatDateShort(batch.spawn_dato_inok) || '-'}
                </td>
                <td className={`border p-1 bg-slate-100 ${!showSpawn && 'hidden'}`}>
                  {batch.spawn_dager_ink || '-'}
                </td>
                <td className={`border p-1 text-xs ${!showSpawn && 'hidden'} ${isOverdue(batch.spawn_forventet_ferdig) ? 'bg-yellow-200' : ''}`}>
                  {formatDateShort(batch.spawn_forventet_ferdig) || '-'}
                </td>
                <td className={`border p-0 ${!showSpawn && 'hidden'}`}>
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

                {/* BAG Section */}
                <td className={`border p-0 ${!showBag && 'hidden'}`}>
                  <EditableCell
                    value={batch.bag_substrat_type || ''}
                    type="select"
                    options={[
                      '-',
                      'Masters Mix',
                      'Masters Mix Shiitake',
                      'Halm',
                      'Sagflis+kli'
                    ]}
                    onSave={(value) => {
                      updateBatchMutation.mutate({
                        id: batch.id,
                        data: { bag_substrat_type: value === '-' ? null : value }
                      });
                    }}
                    className="text-xs"
                  />
                </td>
                <td className={`border p-1 ${!showBag && 'hidden'}`}>
                  {batch.bag_kg_substrat || '-'}
                </td>
                <td className={`border p-0 ${!showBag && 'hidden'}`}>
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
                <td className={`border p-1 bg-slate-100 ${!showBag && 'hidden'}`}>
                  {batch.bag_dager_ink || '-'}
                </td>
                <td className={`border p-1 ${!showBag && 'hidden'}`}>
                  {batch.bag_status || '-'}
                </td>
                <td className={`border p-0 ${!showBag && 'hidden'} ${isOverdue(batch.bag_forventet_kolon) ? 'bg-yellow-200' : ''}`}>
                  <EditableCell
                    value={formatDate(batch.bag_forventet_kolon)}
                    type="date"
                    onSave={(value) => {
                      updateBatchMutation.mutate({
                        id: batch.id,
                        data: { bag_forventet_kolon: value ? new Date(value).toISOString() : null }
                      });
                    }}
                    className="text-xs"
                  />
                </td>
                <td className={`border p-0 ${!showBag && 'hidden'}`}>
                  <DateButtonCell
                    value={batch.bag_frukting_start}
                    buttonLabel="Frukt"
                    onSave={(date) => {
                      updateBatchMutation.mutate({
                        id: batch.id,
                        data: { bag_frukting_start: date }
                      });
                    }}
                    className="text-xs"
                  />
                </td>
                <td className={`border p-0 ${!showBag && 'hidden'}`}>
                  <EditableCell
                    value={batch.bag_temp_kammer ? String(batch.bag_temp_kammer) : ''}
                    type="select"
                    options={['-', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28']}
                    onSave={(value) => {
                      updateBatchMutation.mutate({
                        id: batch.id,
                        data: { bag_temp_kammer: value === '-' ? null : parseFloat(value) }
                      });
                    }}
                    className="text-xs"
                  />
                </td>
                <td className={`border p-0 ${!showBag && 'hidden'}`}>
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
                <td className={`border p-0 ${!showBag && 'hidden'}`}>
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
                <td className={`border p-0 ${!showBag && 'hidden'}`}>
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
                <td className={`border p-0 ${!showBag && 'hidden'}`}>
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
                <td className={`border p-1 bg-slate-100 ${!showBag && 'hidden'}`}>
                  {batch.bag_host1_dager || '-'}
                </td>
                <td className={`border p-0 ${!showBag && 'hidden'}`}>
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
                <td className={`border p-0 ${!showBag && 'hidden'}`}>
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
                <td className={`border p-1 bg-slate-100 ${!showBag && 'hidden'}`}>
                  {batch.bag_syklus_lengde || '-'}
                </td>
                <td className={`border p-0 ${!showBag && 'hidden'}`}>
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
                <td className={`border p-1 font-bold ${!showBag && 'hidden'}`}>
                  {batch.bag_be_percent ? `${batch.bag_be_percent}%` : '-'}
                </td>
                <td className={`border p-0 ${!showBag && 'hidden'}`}>
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

                {/* Actions */}
                <td className="border p-1">
                  <div className="flex gap-1">
                    {/* Convert to Bag button - only for Spawn batches */}
                    {batch.batch_type === 'Spawn' && !batch.archived && (
                      <button
                        onClick={() => handleConvertToBag(batch)}
                        className="p-1 bg-green-100 hover:bg-green-200 rounded text-green-700"
                        title="Konverter til Bag"
                      >
                        <ArrowRight size={14} />
                      </button>
                    )}
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
            ))}
          </tbody>
        </table>
      </div>

      {/* Batch count */}
      <div className="mt-4 text-sm text-gray-600">
        Showing {filteredBatches.length} of {batches?.length || 0} batches
      </div>

      {/* Modals */}
      {selectedBatchId && (
        <BatchModal
          batchId={selectedBatchId}
          onClose={() => setSelectedBatchId(null)}
        />
      )}

      {isNewBatchModalOpen && (
        <NewBatchModal
          onClose={() => setIsNewBatchModalOpen(false)}
        />
      )}

      {isLCManagerOpen && (
        <LCManager
          onClose={() => setIsLCManagerOpen(false)}
        />
      )}
    </div>
  );
};

export default BatchTable;
