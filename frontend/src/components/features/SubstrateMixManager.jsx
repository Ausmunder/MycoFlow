import React, { useState } from 'react';
import { X, Plus, Trash2, Edit, Minus } from 'lucide-react';
import { useSubstrateMixes, useCreateSubstrateMix, useUpdateSubstrateMix, useDeleteSubstrateMix } from '../../hooks/useApi';

const AVAILABLE_INGREDIENTS = [
  'Hardwood pellets', 'Softwood pellets', 'Sagflis', 'Luserne',
  'Soyamel', 'Kli', 'Gips', 'Vann'
];

const SubstrateMixManager = ({ onClose }) => {
  const { data: mixes = [], isLoading } = useSubstrateMixes({ active_only: false });
  const createMixMutation = useCreateSubstrateMix();
  const updateMixMutation = useUpdateSubstrateMix();
  const deleteMixMutation = useDeleteSubstrateMix();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMix, setEditingMix] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', moisture_content: '0.62', grams_per_bag: '' });
  const [ingredients, setIngredients] = useState([]);

  const calculateTotalGrams = () => ingredients.filter(ing => ing.name !== 'Vann').reduce((sum, ing) => sum + (parseInt(ing.grams) || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSend = {
        ...formData,
        moisture_content: formData.moisture_content ? parseFloat(formData.moisture_content) : null,
        grams_per_bag: calculateTotalGrams(),
        recipe_ingredients: JSON.stringify(ingredients),
        is_active: true
      };
      if (editingMix) { await updateMixMutation.mutateAsync({ mixId: editingMix.id, data: dataToSend }); }
      else { await createMixMutation.mutateAsync(dataToSend); }
      handleCloseModal();
    } catch (error) { alert('Feil: ' + (error.response?.data?.detail || error.message)); }
  };

  const handleToggleActive = async (mix) => {
    if (!window.confirm(`${!mix.is_active ? 'Aktivere' : 'Deaktivere'} substrat ${mix.name}?`)) return;
    try { await updateMixMutation.mutateAsync({ mixId: mix.id, data: { is_active: !mix.is_active } }); }
    catch (error) { alert('Feil: ' + (error.response?.data?.detail || error.message)); }
  };

  const handleDelete = async (mixId, mixName) => {
    if (!window.confirm(`Slett substrat mix "${mixName}"?`)) return;
    try { await deleteMixMutation.mutateAsync(mixId); }
    catch (error) { alert('Feil: ' + (error.response?.data?.detail || error.message)); }
  };

  const handleEdit = (mix) => {
    setEditingMix(mix);
    setFormData({ name: mix.name, description: mix.description || '', moisture_content: mix.moisture_content?.toString() || '0.62', grams_per_bag: mix.grams_per_bag?.toString() || '' });
    try { setIngredients(mix.recipe_ingredients ? JSON.parse(mix.recipe_ingredients) : []); }
    catch { setIngredients([]); }
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingMix(null);
    setFormData({ name: '', description: '', moisture_content: '0.62', grams_per_bag: '' });
    setIngredients([]);
  };

  if (isLoading) return <div className="p-4 text-sm text-zinc-400">Laster...</div>;

  const isModal = !!onClose;

  const content = (
    <div className={isModal ? "modal-panel max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" : "card w-full flex flex-col"}>
      <div className={isModal ? "modal-header" : "flex justify-between items-center p-4 border-b border-zinc-100"}>
        <h2 className="text-lg font-semibold">Substrat Mix</h2>
        {isModal && <button onClick={onClose} className="btn-ghost p-1"><X size={20} /></button>}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs text-zinc-500">
            Totalt: {mixes.length} | Aktive: {mixes.filter(m => m.is_active).length}
          </span>
          <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-1.5 text-xs">
            <Plus size={14} /> Ny Substrat Mix
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                <th className="th">Navn</th>
                <th className="th">Beskrivelse</th>
                <th className="th text-center">Gram/bag</th>
                <th className="th text-center">Fukt %</th>
                <th className="th text-center">Status</th>
                <th className="th text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mixes.map((mix) => (
                <tr key={mix.id} className={!mix.is_active ? 'opacity-50' : ''}>
                  <td className="td font-medium">{mix.name}</td>
                  <td className="td">{mix.description || '-'}</td>
                  <td className="td text-center font-mono">{mix.grams_per_bag ? `${mix.grams_per_bag}g` : '-'}</td>
                  <td className="td text-center font-mono">{mix.moisture_content ? (mix.moisture_content * 100).toFixed(1) : '-'}</td>
                  <td className="td text-center">
                    <button
                      onClick={() => handleToggleActive(mix)}
                      className={`px-2 py-0.5 rounded text-xs font-medium ${mix.is_active ? 'text-green-600 bg-green-50' : 'text-zinc-400 bg-zinc-50'}`}
                    >
                      {mix.is_active ? 'Aktiv' : 'Inaktiv'}
                    </button>
                  </td>
                  <td className="td">
                    <div className="flex gap-1 justify-center">
                      <button onClick={() => handleEdit(mix)} className="btn-ghost p-1 text-zinc-400 hover:text-zinc-700"><Edit size={14} /></button>
                      <button onClick={() => handleDelete(mix.id, mix.name)} className="btn-ghost p-1 text-zinc-400 hover:text-red-600"><Trash2 size={14} /></button>
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
          <div className="modal-panel max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="modal-header">
              <h3 className="text-lg font-semibold">{editingMix ? 'Rediger Substrat Mix' : 'Ny Substrat Mix'}</h3>
              <button onClick={handleCloseModal} className="btn-ghost p-1"><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Navn *</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input w-full" placeholder="f.eks. Masters Mix" required />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Beskrivelse</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="input w-full" rows="2" />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Fuktinnhold (0.00-1.00)</label>
                <input type="number" step="0.01" min="0" max="1" value={formData.moisture_content} onChange={(e) => setFormData({ ...formData, moisture_content: e.target.value })} className="input w-full" placeholder="0.62" />
                <p className="text-xs text-zinc-400 mt-0.5">0.62 = 62% fukt</p>
              </div>

              <div className="border-t border-zinc-100 pt-3">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-medium text-zinc-500">Oppskrift (per bag)</label>
                  <button type="button" onClick={() => setIngredients([...ingredients, { name: AVAILABLE_INGREDIENTS[0], grams: 0 }])} className="btn-primary flex items-center gap-1 text-xs">
                    <Plus size={12} /> Ingrediens
                  </button>
                </div>

                {ingredients.length > 0 && (
                  <div className="space-y-1.5 mb-2">
                    {ingredients.map((ingredient, index) => (
                      <div key={index} className="flex gap-1.5 items-center">
                        <select value={ingredient.name} onChange={(e) => { const u = [...ingredients]; u[index] = { ...u[index], name: e.target.value }; setIngredients(u); }} className="input flex-1 text-xs">
                          {AVAILABLE_INGREDIENTS.map(ing => <option key={ing} value={ing}>{ing}</option>)}
                        </select>
                        <input type="number" min="0" value={ingredient.grams} onChange={(e) => { const u = [...ingredients]; u[index] = { ...u[index], grams: e.target.value }; setIngredients(u); }} className="input w-24 text-xs" placeholder="Gram" />
                        <span className="text-xs text-zinc-400 w-4">g</span>
                        <button type="button" onClick={() => setIngredients(ingredients.filter((_, i) => i !== index))} className="btn-ghost p-1 text-zinc-400 hover:text-red-600">
                          <Minus size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="card p-2 text-xs">
                  <span className="text-zinc-500">Total tørrvekt per bag:</span>
                  <span className="font-mono font-medium text-zinc-900 ml-1">{calculateTotalGrams()}g</span>
                  <span className="text-zinc-400 ml-2">(Vann ikke inkludert)</span>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-zinc-100">
                <button type="button" onClick={handleCloseModal} className="btn">Avbryt</button>
                <button type="submit" className="btn-primary">{editingMix ? 'Oppdater' : 'Opprett'}</button>
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

export default SubstrateMixManager;
