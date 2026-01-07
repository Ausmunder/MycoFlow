import React, { useState } from 'react';
import { X, Plus, Trash2, Edit } from 'lucide-react';
import { useLCCultures, useCreateLCCulture, useUpdateLCCulture, useDeleteLCCulture } from '../../hooks/useApi';

const LCManager = ({ onClose }) => {
  const { data: lcCultures = [], isLoading } = useLCCultures({ active_only: false });
  const createLCMutation = useCreateLCCulture();
  const updateLCMutation = useUpdateLCCulture();
  const deleteLCMutation = useDeleteLCCulture();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLC, setEditingLC] = useState(null);

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState({
    lc_code: '',
    strain_name: 'oyster',
    source: '',
    date_created: getTodayDate(),
    notes: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Convert date_created to ISO format
      const dataToSend = {
        ...formData,
        date_created: formData.date_created ? new Date(formData.date_created + 'T12:00:00').toISOString() : null
      };

      if (editingLC) {
        await updateLCMutation.mutateAsync({
          lcCode: editingLC.lc_code,
          data: dataToSend
        });
      } else {
        await createLCMutation.mutateAsync(dataToSend);
      }
      handleCloseModal();
    } catch (error) {
      console.error('Error saving LC:', error);

      // Better error extraction
      let errorMsg = 'Unknown error';
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMsg = error.response.data;
        } else if (error.response.data.detail) {
          if (typeof error.response.data.detail === 'string') {
            errorMsg = error.response.data.detail;
          } else if (Array.isArray(error.response.data.detail)) {
            errorMsg = error.response.data.detail.map(e => `${e.loc?.join('.')}: ${e.msg}`).join('\n');
          } else {
            errorMsg = JSON.stringify(error.response.data.detail);
          }
        } else {
          errorMsg = JSON.stringify(error.response.data);
        }
      } else if (error.message) {
        errorMsg = error.message;
      }

      alert('Error saving LC:\n' + errorMsg);
    }
  };

  const handleToggleActive = async (lc) => {
    const newStatus = !lc.active;
    const action = newStatus ? 'aktivere' : 'deaktivere';

    if (!window.confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} LC kultur ${lc.lc_code}?`)) return;

    try {
      await updateLCMutation.mutateAsync({
        lcCode: lc.lc_code,
        data: { active: newStatus }
      });
    } catch (error) {
      console.error('Error toggling LC status:', error);
      alert('Error updating LC status: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleDelete = async (lcCode) => {
    if (!window.confirm(`Slett LC kultur ${lcCode}?`)) return;

    try {
      await deleteLCMutation.mutateAsync(lcCode);
    } catch (error) {
      console.error('Error deleting LC:', error);
      alert('Error deleting LC: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleEdit = (lc) => {
    setEditingLC(lc);
    setFormData({
      lc_code: lc.lc_code,
      strain_name: lc.strain_name,
      source: lc.source || '',
      date_created: lc.date_created ? lc.date_created.split('T')[0] : getTodayDate(),
      notes: lc.notes || ''
    });
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingLC(null);
    setFormData({
      lc_code: '',
      strain_name: 'oyster',
      source: '',
      date_created: getTodayDate(),
      notes: ''
    });
  };

  if (isLoading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold">LC Culture Management</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">LC Cultures ({lcCultures.length})</h3>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              <Plus size={16} />
              Add New LC
            </button>
          </div>

          {/* LC Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-purple-100">
                  <th className="border p-2 text-left">LC Code</th>
                  <th className="border p-2 text-left">Strain</th>
                  <th className="border p-2 text-left">Source</th>
                  <th className="border p-2 text-left">Date Created</th>
                  <th className="border p-2 text-center">Batches</th>
                  <th className="border p-2 text-center">Status</th>
                  <th className="border p-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {lcCultures.map(lc => (
                  <tr key={lc.id} className={!lc.active ? 'bg-gray-100' : ''}>
                    <td className="border p-2 font-semibold text-purple-900">{lc.lc_code}</td>
                    <td className="border p-2 capitalize">{lc.strain_name}</td>
                    <td className="border p-2">{lc.source || '-'}</td>
                    <td className="border p-2">
                      {lc.date_created ? new Date(lc.date_created).toLocaleDateString('no-NO') : '-'}
                    </td>
                    <td className="border p-2 text-center">{lc.batch_count || 0}</td>
                    <td className="border p-2 text-center">
                      <button
                        onClick={() => handleToggleActive(lc)}
                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                          lc.active
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                      >
                        {lc.active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="border p-2">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => handleEdit(lc)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(lc.lc_code)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="border-b px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold">
                {editingLC ? 'Edit LC Culture' : 'Add New LC Culture'}
              </h3>
              <button onClick={handleCloseModal}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">LC Code *</label>
                <input
                  type="text"
                  value={formData.lc_code}
                  onChange={(e) => setFormData(prev => ({ ...prev, lc_code: e.target.value }))}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="GOH3, LOM2, etc."
                  required
                  disabled={!!editingLC}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Strain *</label>
                <select
                  value={formData.strain_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, strain_name: e.target.value }))}
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
                  value={formData.source}
                  onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="Agar plate #1, spore print, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Date Created</label>
                <input
                  type="date"
                  value={formData.date_created}
                  onChange={(e) => setFormData(prev => ({ ...prev, date_created: e.target.value }))}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border rounded"
                  rows="3"
                  placeholder="Additional notes..."
                />
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                  {editingLC ? 'Update' : 'Create'} LC
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LCManager;
