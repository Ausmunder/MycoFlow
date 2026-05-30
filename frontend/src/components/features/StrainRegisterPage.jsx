import React, { useState } from 'react';
import { X, Plus, Trash2, Edit } from 'lucide-react';
import { useStrains, useCreateStrain, useUpdateStrain, useDeleteStrain } from '../../hooks/useApi';

// Preset species — picking one fills code + latin + category. "Annen" = free input.
const SPECIES_PRESETS = [
  { code: 'PO', latin: 'Pleurotus ostreatus', category: 'oyster',     label: 'Grå østers (PO)' },
  { code: 'HE', latin: 'Hericium erinaceus',  category: 'lions_mane', label: 'Lions Mane (HE)' },
  { code: 'LE', latin: 'Lentinula edodes',    category: 'shiitake',   label: 'Shiitake (LE)' },
  { code: 'GL', latin: 'Ganoderma lucidum',   category: 'reishi',     label: 'Reishi (GL)' },
];

const emptyForm = {
  species_code: 'HE', strain_number: '', species_latin: 'Hericium erinaceus',
  common_name: 'Lions Mane', strain_category: 'lions_mane', notes: '',
};

const errMsg = (error) => {
  const d = error.response?.data;
  if (!d) return error.message || 'Ukjent feil';
  if (typeof d === 'string') return d;
  if (typeof d.detail === 'string') return d.detail;
  if (Array.isArray(d.detail)) return d.detail.map(e => `${e.loc?.join('.')}: ${e.msg}`).join('\n');
  return JSON.stringify(d);
};

export default function StrainRegisterPage() {
  const { data: strains = [], isLoading } = useStrains();
  const createStrain = useCreateStrain();
  const updateStrain = useUpdateStrain();
  const deleteStrain = useDeleteStrain();

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const previewPrefix = `${(form.species_code || '').toUpperCase()}${form.strain_number || ''}`;

  const applyPreset = (code) => {
    const p = SPECIES_PRESETS.find(s => s.code === code);
    if (p) {
      setForm(prev => ({ ...prev, species_code: p.code, species_latin: p.latin, strain_category: p.category, common_name: prev.common_name || p.label }));
    } else {
      setForm(prev => ({ ...prev, species_code: code }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateStrain.mutateAsync({ strainId: editing.id, data: form });
      } else {
        await createStrain.mutateAsync(form);
      }
      handleClose();
    } catch (error) {
      alert('Feil:\n' + errMsg(error));
    }
  };

  const handleEdit = (s) => {
    setEditing(s);
    setForm({
      species_code: s.species_code, strain_number: s.strain_number,
      species_latin: s.species_latin || '', common_name: s.common_name || '',
      strain_category: s.strain_category || '', notes: s.notes || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (s) => {
    if (!window.confirm(`Deaktivere strain ${s.prefix}?`)) return;
    try { await deleteStrain.mutateAsync(s.id); }
    catch (error) { alert('Feil: ' + errMsg(error)); }
  };

  const handleClose = () => { setShowModal(false); setEditing(null); setForm(emptyForm); };

  if (isLoading) return <div className="p-4 text-sm text-zinc-500">Laster...</div>;

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-sm font-semibold text-zinc-100">Strain-register</h1>
          <p className="text-xs text-zinc-500">{strains.length} strains · genetisk rot for all sporbarhet</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-1.5 text-xs">
          <Plus size={14} /> Ny strain
        </button>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className="th">Prefiks</th>
              <th className="th">Art (latin)</th>
              <th className="th">Navn</th>
              <th className="th">Kategori</th>
              <th className="th text-center">Kulturer</th>
              <th className="th text-center">Batcher</th>
              <th className="th text-center">Status</th>
              <th className="th text-center">Handlinger</th>
            </tr>
          </thead>
          <tbody>
            {strains.map(s => (
              <tr key={s.id} className={!s.active ? 'opacity-50' : ''}>
                <td className="td font-mono font-medium text-zinc-100">{s.prefix}</td>
                <td className="td italic text-zinc-400">{s.species_latin || '-'}</td>
                <td className="td">{s.common_name || '-'}</td>
                <td className="td capitalize text-zinc-400">{s.strain_category || '-'}</td>
                <td className="td text-center font-mono">{s.culture_count || 0}</td>
                <td className="td text-center font-mono">{s.batch_count || 0}</td>
                <td className="td text-center">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${s.active ? 'text-green-400 bg-green-950' : 'text-zinc-500 bg-zinc-800'}`}>
                    {s.active ? 'Aktiv' : 'Inaktiv'}
                  </span>
                </td>
                <td className="td">
                  <div className="flex gap-1 justify-center">
                    <button onClick={() => handleEdit(s)} className="btn-ghost p-1"><Edit size={14} /></button>
                    <button onClick={() => handleDelete(s)} className="btn-ghost p-1 hover:text-red-400"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {strains.length === 0 && (
              <tr><td colSpan={8} className="td text-center text-zinc-600 py-6 italic">Ingen strains ennå</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-panel max-w-md">
            <div className="modal-header">
              <h3 className="text-lg font-semibold">{editing ? `Rediger ${editing.prefix}` : 'Ny strain'}</h3>
              <button onClick={handleClose} className="btn-ghost p-1"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-3">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Art</label>
                <select
                  value={SPECIES_PRESETS.some(p => p.code === form.species_code) ? form.species_code : '__custom__'}
                  onChange={(e) => applyPreset(e.target.value === '__custom__' ? '' : e.target.value)}
                  className="input w-full"
                >
                  {SPECIES_PRESETS.map(p => <option key={p.code} value={p.code}>{p.label}</option>)}
                  <option value="__custom__">Annen…</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Artkode *</label>
                  <input type="text" value={form.species_code} onChange={(e) => setForm(p => ({ ...p, species_code: e.target.value.toUpperCase() }))} className="input w-full font-mono" placeholder="HE" maxLength={4} required />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Strain-nr *</label>
                  <input type="text" value={form.strain_number} onChange={(e) => setForm(p => ({ ...p, strain_number: e.target.value }))} className="input w-full font-mono" placeholder="9514" required />
                </div>
              </div>
              <div className="text-xs text-zinc-500">
                Prefiks: <span className="font-mono text-zinc-200">{previewPrefix || '—'}</span>
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Latinsk navn</label>
                <input type="text" value={form.species_latin} onChange={(e) => setForm(p => ({ ...p, species_latin: e.target.value }))} className="input w-full" placeholder="Hericium erinaceus" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Vanlig navn</label>
                  <input type="text" value={form.common_name} onChange={(e) => setForm(p => ({ ...p, common_name: e.target.value }))} className="input w-full" placeholder="Lions Mane" />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Kategori</label>
                  <select value={form.strain_category} onChange={(e) => setForm(p => ({ ...p, strain_category: e.target.value }))} className="input w-full">
                    <option value="oyster">oyster</option>
                    <option value="lions_mane">lions_mane</option>
                    <option value="shiitake">shiitake</option>
                    <option value="reishi">reishi</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Notat</label>
                <textarea value={form.notes} onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))} className="input w-full" rows="2" />
              </div>
              <div className="flex gap-2 justify-end pt-2 border-t border-zinc-800">
                <button type="button" onClick={handleClose} className="btn">Avbryt</button>
                <button type="submit" className="btn-primary" disabled={!form.species_code || !form.strain_number}>{editing ? 'Oppdater' : 'Opprett'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
