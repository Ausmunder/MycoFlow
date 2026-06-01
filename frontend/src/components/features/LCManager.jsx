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

  const getTodayDate = () => new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    lc_code: '', strain_name: 'oyster', source: '', date_created: getTodayDate(), notes: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSend = { ...formData, date_created: formData.date_created ? new Date(formData.date_created + 'T12:00:00').toISOString() : null };
      if (editingLC) {
        await updateLCMutation.mutateAsync({ lcCode: editingLC.lc_code, data: dataToSend });
      } else {
        await createLCMutation.mutateAsync(dataToSend);
      }
      handleCloseModal();
    } catch (error) {
      let errorMsg = 'Unknown error';
      if (error.response?.data) {
        if (typeof error.response.data === 'string') errorMsg = error.response.data;
        else if (error.response.data.detail) {
          if (typeof error.response.data.detail === 'string') errorMsg = error.response.data.detail;
          else if (Array.isArray(error.response.data.detail)) errorMsg = error.response.data.detail.map(e => `${e.loc?.join('.')}: ${e.msg}`).join('\n');
          else errorMsg = JSON.stringify(error.response.data.detail);
        } else errorMsg = JSON.stringify(error.response.data);
      } else if (error.message) errorMsg = error.message;
      alert('Feil:\n' + errorMsg);
    }
  };

  const handleToggleActive = async (lc) => {
    const newStatus = !lc.active;
    if (!window.confirm(`${newStatus ? 'Aktivere' : 'Deaktivere'} LC kultur ${lc.lc_code}?`)) return;
    try {
      await updateLCMutation.mutateAsync({ lcCode: lc.lc_code, data: { active: newStatus } });
    } catch (error) {
      alert('Feil: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleDelete = async (lcCode) => {
    if (!window.confirm(`Slett LC kultur ${lcCode}?`)) return;
    try { await deleteLCMutation.mutateAsync(lcCode); }
    catch (error) { alert('Feil: ' + (error.response?.data?.detail || error.message)); }
  };

  const handleEdit = (lc) => {
    setEditingLC(lc);
    setFormData({ lc_code: lc.lc_code, strain_name: lc.strain_name, source: lc.source || '', date_created: lc.date_created ? lc.date_created.split('T')[0] : getTodayDate(), notes: lc.notes || '' });
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingLC(null);
    setFormData({ lc_code: '', strain_name: 'oyster', source: '', date_created: getTodayDate(), notes: '' });
  };

  if (isLoading) return <div className="p-4 text-sm text-zinc-400">Laster...</div>;

  const isModal = !!onClose;

  const content = (
    <div className={isModal ? "modal-panel max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" : "card w-full flex flex-col"}>
      <div className={isModal ? "modal-header" : "flex justify-between items-center p-4 border-b border-zinc-800"}>
        <h2 className="text-lg font-semibold">LC Kulturer</h2>
        {isModal && <button onClick={onClose} className="btn-ghost p-1"><X size={20} /></button>}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs text-zinc-500">{lcCultures.length} kulturer</span>
          <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-1.5 text-xs">
            <Plus size={14} /> Ny LC
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                <th className="th">LC Code</th>
                <th className="th">Strain</th>
                <th className="th">Source</th>
                <th className="th">Opprettet</th>
                <th className="th text-center">Batches</th>
                <th className="th text-center">Status</th>
                <th className="th text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {lcCultures.map(lc => (
                <tr key={lc.id} className={!lc.active ? 'opacity-50' : ''}>
                  <td className="td font-mono font-medium">{lc.lc_code}</td>
                  <td className="td capitalize">{lc.strain_name}</td>
                  <td className="td">{lc.source || '-'}</td>
                  <td className="td font-mono">{lc.date_created ? new Date(lc.date_created).toLocaleDateString('no-NO') : '-'}</td>
                  <td className="td text-center font-mono">{lc.batch_count || 0}</td>
                  <td className="td text-center">
                    <button
                      onClick={() => handleToggleActive(lc)}
                      className={`px-2 py-0.5 rounded text-xs font-medium ${lc.active ? 'text-green-600 bg-green-50' : 'text-zinc-400 bg-zinc-800'}`}
                    >
                      {lc.active ? 'Aktiv' : 'Inaktiv'}
                    </button>
                  </td>
                  <td className="td">
                    <div className="flex gap-1 justify-center">
                      <button onClick={() => handleEdit(lc)} className="btn-ghost p-1 text-zinc-400 hover:text-zinc-300"><Edit size={14} /></button>
                      <button onClick={() => handleDelete(lc.lc_code)} className="btn-ghost p-1 text-zinc-400 hover:text-red-600"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="modal-overlay" style={{ zIndex: 60 }}>
          <div className="modal-panel max-w-md">
            <div className="modal-header">
              <h3 className="text-lg font-semibold">{editingLC ? 'Rediger LC' : 'Ny LC Culture'}</h3>
              <button onClick={handleCloseModal} className="btn-ghost p-1"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-3">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">LC Code *</label>
                <input type="text" value={formData.lc_code} onChange={(e) => setFormData(prev => ({ ...prev, lc_code: e.target.value }))} className="input w-full font-mono" placeholder="GOH3, LOM2..." required disabled={!!editingLC} />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Strain *</label>
                <select value={formData.strain_name} onChange={(e) => setFormData(prev => ({ ...prev, strain_name: e.target.value }))} className="input w-full" required>
                  <option value="oyster">Oyster</option>
                  <option value="lions_mane">Lions Mane</option>
                  <option value="shiitake">Shiitake</option>
                  <option value="reishi">Reishi</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Source</label>
                <input type="text" value={formData.source} onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))} className="input w-full" placeholder="Agar plate, spore print..." />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Dato</label>
                <input type="date" value={formData.date_created} onChange={(e) => setFormData(prev => ({ ...prev, date_created: e.target.value }))} className="input w-full" />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Notat</label>
                <textarea value={formData.notes} onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))} className="input w-full" rows="2" />
              </div>
              <div className="flex gap-2 justify-end pt-2 border-t border-zinc-800">
                <button type="button" onClick={handleCloseModal} className="btn">Avbryt</button>
                <button type="submit" className="btn-primary">{editingLC ? 'Oppdater' : 'Opprett'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  if (isModal) return <div className="modal-overlay">{content}</div>;
  return content;
};

export default LCManager;
