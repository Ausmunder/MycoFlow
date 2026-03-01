import React, { useState } from 'react';
import { X, Plus, Trash2, Edit, Minus } from 'lucide-react';
import { useSubstrateMixes, useCreateSubstrateMix, useUpdateSubstrateMix, useDeleteSubstrateMix } from '../../hooks/useApi';

const AVAILABLE_INGREDIENTS = [
  'Hardwood pellets',
  'Softwood pellets',
  'Sagflis',
  'Luserne',
  'Soyamel',
  'Kli',
  'Gips',
  'Vann'
];

const SubstrateMixManager = ({ onClose }) => {
  const { data: mixes = [], isLoading } = useSubstrateMixes({ active_only: false });
  const createMixMutation = useCreateSubstrateMix();
  const updateMixMutation = useUpdateSubstrateMix();
  const deleteMixMutation = useDeleteSubstrateMix();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMix, setEditingMix] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    moisture_content: '0.62',
    grams_per_bag: ''
  });

  const [ingredients, setIngredients] = useState([]);

  const calculateTotalGrams = () => {
    return ingredients
      .filter(ing => ing.name !== 'Vann') // Exclude water from dry weight
      .reduce((sum, ing) => sum + (parseInt(ing.grams) || 0), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const totalGrams = calculateTotalGrams();

      const dataToSend = {
        ...formData,
        moisture_content: formData.moisture_content ? parseFloat(formData.moisture_content) : null,
        grams_per_bag: totalGrams,
        recipe_ingredients: JSON.stringify(ingredients),
        is_active: true
      };

      if (editingMix) {
        await updateMixMutation.mutateAsync({
          mixId: editingMix.id,
          data: dataToSend
        });
      } else {
        await createMixMutation.mutateAsync(dataToSend);
      }
      handleCloseModal();
    } catch (error) {
      console.error('Error saving substrate mix:', error);
      alert('Error saving substrate mix: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleToggleActive = async (mix) => {
    const newStatus = !mix.is_active;
    const action = newStatus ? 'aktivere' : 'deaktivere';

    if (!window.confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} substrat ${mix.name}?`)) return;

    try {
      await updateMixMutation.mutateAsync({
        mixId: mix.id,
        data: { is_active: newStatus }
      });
    } catch (error) {
      console.error('Error toggling mix status:', error);
      alert('Error updating mix status: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleDelete = async (mixId, mixName) => {
    if (!window.confirm(`Slett substrat mix "${mixName}"?`)) return;

    try {
      await deleteMixMutation.mutateAsync(mixId);
    } catch (error) {
      console.error('Error deleting substrate mix:', error);
      alert('Error deleting substrate mix: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleEdit = (mix) => {
    setEditingMix(mix);
    setFormData({
      name: mix.name,
      description: mix.description || '',
      moisture_content: mix.moisture_content?.toString() || '0.62',
      grams_per_bag: mix.grams_per_bag?.toString() || ''
    });

    // Parse ingredients if available
    if (mix.recipe_ingredients) {
      try {
        setIngredients(JSON.parse(mix.recipe_ingredients));
      } catch (e) {
        setIngredients([]);
      }
    } else {
      setIngredients([]);
    }

    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingMix(null);
    setFormData({
      name: '',
      description: '',
      moisture_content: '0.62',
      grams_per_bag: ''
    });
    setIngredients([]);
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { name: AVAILABLE_INGREDIENTS[0], grams: 0 }]);
  };

  const removeIngredient = (index) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (index, field, value) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
  };

  if (isLoading) {
    return <div className="p-4">Loading...</div>;
  }

  const isModal = !!onClose;

  const content = (
    <div className={isModal ? "bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col" : "bg-white rounded-lg shadow w-full flex flex-col"}>
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold">Substrat Mix Manager</h2>
          {isModal && (
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X size={24} />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-4 flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">
                Totalt: {mixes.length} | Aktive: {mixes.filter(m => m.is_active).length}
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              <Plus size={16} />
              Ny Substrat Mix
            </button>
          </div>

          {/* Substrate Mixes Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border p-2 text-left">Navn</th>
                  <th className="border p-2 text-left">Beskrivelse</th>
                  <th className="border p-2 text-center">Gram/bag</th>
                  <th className="border p-2 text-center">Fukt %</th>
                  <th className="border p-2 text-center">Status</th>
                  <th className="border p-2 text-center">Handlinger</th>
                </tr>
              </thead>
              <tbody>
                {mixes.map((mix) => (
                  <tr key={mix.id} className={!mix.is_active ? 'bg-gray-50 text-gray-400' : ''}>
                    <td className="border p-2 font-medium">{mix.name}</td>
                    <td className="border p-2">{mix.description || '-'}</td>
                    <td className="border p-2 text-center">
                      {mix.grams_per_bag ? `${mix.grams_per_bag}g` : '-'}
                    </td>
                    <td className="border p-2 text-center">
                      {mix.moisture_content ? (mix.moisture_content * 100).toFixed(1) : '-'}
                    </td>
                    <td className="border p-2 text-center">
                      <button
                        onClick={() => handleToggleActive(mix)}
                        className={`px-3 py-1 rounded text-sm ${
                          mix.is_active
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                      >
                        {mix.is_active ? 'Aktiv' : 'Inaktiv'}
                      </button>
                    </td>
                    <td className="border p-2">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => handleEdit(mix)}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="Rediger"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(mix.id, mix.name)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Slett"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add/Edit Modal (always fixed overlay regardless of page mode) */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">
                  {editingMix ? 'Rediger Substrat Mix' : 'Ny Substrat Mix'}
                </h3>
                <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Navn *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    placeholder="f.eks. Masters Mix"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Beskrivelse</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    rows="2"
                    placeholder="Kort beskrivelse av substratet..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Fuktinnhold (desimal: 0.00-1.00)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={formData.moisture_content}
                    onChange={(e) => setFormData({ ...formData, moisture_content: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    placeholder="0.62"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Eksempel: 0.62 = 62% fukt
                  </p>
                </div>

                {/* Ingredients Section */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-sm font-medium">Oppskrift (per bag)</label>
                    <button
                      type="button"
                      onClick={addIngredient}
                      className="flex items-center gap-1 text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                    >
                      <Plus size={14} />
                      Legg til ingrediens
                    </button>
                  </div>

                  {ingredients.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {ingredients.map((ingredient, index) => (
                        <div key={index} className="flex gap-2 items-center">
                          <select
                            value={ingredient.name}
                            onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                            className="flex-1 border rounded px-3 py-2"
                          >
                            {AVAILABLE_INGREDIENTS.map(ing => (
                              <option key={ing} value={ing}>{ing}</option>
                            ))}
                          </select>
                          <input
                            type="number"
                            min="0"
                            value={ingredient.grams}
                            onChange={(e) => updateIngredient(index, 'grams', e.target.value)}
                            className="w-32 border rounded px-3 py-2"
                            placeholder="Gram"
                          />
                          <span className="text-sm text-gray-600 w-8">g</span>
                          <button
                            type="button"
                            onClick={() => removeIngredient(index)}
                            className="text-red-600 hover:text-red-800 p-1"
                          >
                            <Minus size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="bg-blue-50 p-3 rounded mt-3">
                    <p className="text-sm font-medium">
                      Total tørrvekt per bag: <span className="text-blue-700">{calculateTotalGrams()}g</span>
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      (Vann telles ikke med i tørrvekt for BE% beregning)
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 border rounded hover:bg-gray-100"
                  >
                    Avbryt
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    {editingMix ? 'Oppdater' : 'Opprett'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        {content}
      </div>
    );
  }

  return content;
};

export default SubstrateMixManager;
