import React, { useState, useMemo } from 'react';
import { X, Plus, Trash2, GitBranch } from 'lucide-react';
import {
  useCultures, useCreateCulture, useDeleteCulture, useStrains, useTrace,
} from '../../hooks/useApi';

const MEDIA = [
  { key: 'MC', label: 'Mother Culture' },
  { key: 'LC', label: 'Liquid Culture' },
  { key: 'PD', label: 'Petri Dish' },
  { key: 'SL', label: 'Slant' },
];
const MEDIA_LABEL = Object.fromEntries(MEDIA.map(m => [m.key, m.label]));

const errMsg = (error) => {
  const d = error.response?.data;
  if (!d) return error.message || 'Ukjent feil';
  if (typeof d === 'string') return d;
  if (typeof d.detail === 'string') return d.detail;
  if (Array.isArray(d.detail)) return d.detail.map(e => `${e.loc?.join('.')}: ${e.msg}`).join('\n');
  return JSON.stringify(d);
};

const today = () => new Date().toISOString().split('T')[0];

const emptyForm = () => ({
  strain_id: '', media_type: 'LC', parent_culture_id: '', date_created: today(),
  source: '', quantity: '', quantity_unit: 'ml', notes: '',
});

export default function CultureManager() {
  const [filter, setFilter] = useState('all');
  const { data: cultures = [], isLoading } = useCultures();
  const { data: strains = [] } = useStrains();
  const createCulture = useCreateCulture();
  const deleteCulture = useDeleteCulture();

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [traceCode, setTraceCode] = useState(null);

  const filtered = filter === 'all' ? cultures : cultures.filter(c => c.media_type === filter);

  // MC candidates for the chosen strain (for derivation)
  const parentOptions = useMemo(() =>
    cultures.filter(c => c.media_type === 'MC' && String(c.strain_id) === String(form.strain_id)),
    [cultures, form.strain_id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        strain_id: parseInt(form.strain_id),
        media_type: form.media_type,
        parent_culture_id: form.parent_culture_id ? parseInt(form.parent_culture_id) : null,
        date_created: form.date_created ? new Date(form.date_created + 'T12:00:00').toISOString() : null,
        source: form.source || null,
        quantity: form.quantity !== '' ? parseFloat(form.quantity) : null,
        quantity_unit: form.quantity_unit || null,
        notes: form.notes || null,
      };
      await createCulture.mutateAsync(payload);
      setShowModal(false);
      setForm(emptyForm());
    } catch (error) {
      alert('Feil:\n' + errMsg(error));
    }
  };

  const handleDelete = async (c) => {
    if (!window.confirm(`Deaktivere kultur ${c.code}?`)) return;
    try { await deleteCulture.mutateAsync(c.code); }
    catch (error) { alert('Feil: ' + errMsg(error)); }
  };

  if (isLoading) return <div className="p-4 text-sm text-zinc-500">Laster...</div>;

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-sm font-semibold text-zinc-100">Kulturer</h1>
          <p className="text-xs text-zinc-500">{cultures.length} kulturer · MC → LC / PD / SL → batch</p>
        </div>
        <button
          onClick={() => { setForm(emptyForm()); setShowModal(true); }}
          className="btn-primary flex items-center gap-1.5 text-xs"
          disabled={strains.length === 0}
          title={strains.length === 0 ? 'Opprett en strain først' : undefined}
        >
          <Plus size={14} /> Ny kultur
        </button>
      </div>

      {/* Media filter pills */}
      <div className="flex gap-2 flex-wrap">
        {['all', ...MEDIA.map(m => m.key)].map(k => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              filter === k
                ? 'bg-zinc-100 border-zinc-100 text-zinc-900'
                : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {k === 'all' ? 'Alle' : `${k} · ${MEDIA_LABEL[k]}`}
          </button>
        ))}
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className="th">Kode</th>
              <th className="th">Type</th>
              <th className="th">Strain</th>
              <th className="th">Opphav</th>
              <th className="th text-center">Mengde</th>
              <th className="th">Opprettet</th>
              <th className="th text-center">Batcher</th>
              <th className="th text-center">Status</th>
              <th className="th text-center">Handlinger</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => {
              const parent = cultures.find(p => p.id === c.parent_culture_id);
              return (
                <tr key={c.id} className={!c.active ? 'opacity-50' : ''}>
                  <td className="td font-mono font-medium text-zinc-100">{c.code}</td>
                  <td className="td">{c.media_type}</td>
                  <td className="td font-mono text-zinc-400">{c.strain_prefix || '-'}</td>
                  <td className="td font-mono text-zinc-500">{parent ? parent.code : '-'}</td>
                  <td className="td text-center font-mono">{c.quantity != null ? `${c.quantity} ${c.quantity_unit || ''}` : '-'}</td>
                  <td className="td font-mono">{c.date_created ? new Date(c.date_created).toLocaleDateString('no-NO') : '-'}</td>
                  <td className="td text-center font-mono">{c.batch_count || 0}</td>
                  <td className="td text-center">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${c.active ? 'text-green-400 bg-green-950' : 'text-zinc-500 bg-zinc-800'}`}>
                      {c.active ? 'Aktiv' : 'Inaktiv'}
                    </span>
                  </td>
                  <td className="td">
                    <div className="flex gap-1 justify-center">
                      <button onClick={() => setTraceCode(c.code)} className="btn-ghost p-1" title="Spor lineage"><GitBranch size={14} /></button>
                      <button onClick={() => handleDelete(c)} className="btn-ghost p-1 hover:text-red-400"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={9} className="td text-center text-zinc-600 py-6 italic">Ingen kulturer</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-panel max-w-md">
            <div className="modal-header">
              <h3 className="text-lg font-semibold">Ny kultur</h3>
              <button onClick={() => setShowModal(false)} className="btn-ghost p-1"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-3">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Strain *</label>
                <select value={form.strain_id} onChange={(e) => setForm(p => ({ ...p, strain_id: e.target.value, parent_culture_id: '' }))} className="input w-full" required>
                  <option value="">Velg strain…</option>
                  {strains.map(s => <option key={s.id} value={s.id}>{s.prefix} · {s.common_name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Media *</label>
                  <select value={form.media_type} onChange={(e) => setForm(p => ({ ...p, media_type: e.target.value, parent_culture_id: '' }))} className="input w-full">
                    {MEDIA.map(m => <option key={m.key} value={m.key}>{m.key} · {m.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Dato</label>
                  <input type="date" value={form.date_created} onChange={(e) => setForm(p => ({ ...p, date_created: e.target.value }))} className="input w-full" />
                </div>
              </div>

              {form.media_type !== 'MC' && (
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Opphav (MC)</label>
                  <select value={form.parent_culture_id} onChange={(e) => setForm(p => ({ ...p, parent_culture_id: e.target.value }))} className="input w-full" disabled={!form.strain_id}>
                    <option value="">{form.strain_id ? '— ingen —' : 'Velg strain først'}</option>
                    {parentOptions.map(mc => <option key={mc.id} value={mc.id}>{mc.code}</option>)}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs text-zinc-500 mb-1">Mengde</label>
                  <input type="number" step="0.1" value={form.quantity} onChange={(e) => setForm(p => ({ ...p, quantity: e.target.value }))} className="input w-full" placeholder="0" />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs text-zinc-500 mb-1">Enhet</label>
                  <select value={form.quantity_unit} onChange={(e) => setForm(p => ({ ...p, quantity_unit: e.target.value }))} className="input w-full">
                    <option value="ml">ml</option>
                    <option value="stk">stk</option>
                  </select>
                </div>
                <div className="col-span-1">
                  <label className="block text-xs text-zinc-500 mb-1">Kilde</label>
                  <input type="text" value={form.source} onChange={(e) => setForm(p => ({ ...p, source: e.target.value }))} className="input w-full" placeholder="vev…" />
                </div>
              </div>

              <div>
                <label className="block text-xs text-zinc-500 mb-1">Notat</label>
                <textarea value={form.notes} onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))} className="input w-full" rows="2" />
              </div>

              <p className="text-[11px] text-zinc-500">Koden genereres automatisk: <span className="font-mono text-zinc-400">{'{prefiks}'}-{form.media_type}-{'{ÅRUKE}{enhet}'}</span></p>

              <div className="flex gap-2 justify-end pt-2 border-t border-zinc-800">
                <button type="button" onClick={() => setShowModal(false)} className="btn">Avbryt</button>
                <button type="submit" className="btn-primary" disabled={!form.strain_id}>Opprett</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {traceCode && <TraceModal code={traceCode} onClose={() => setTraceCode(null)} />}
    </div>
  );
}

// ── Lineage trace modal (reused for cultures and batches) ──────────────────────
export function TraceModal({ code, onClose }) {
  const { data: trace, isLoading, isError } = useTrace(code);
  return (
    <div className="modal-overlay">
      <div className="modal-panel max-w-lg">
        <div className="modal-header">
          <h3 className="text-lg font-semibold flex items-center gap-2"><GitBranch size={18} /> Sporbarhet · <span className="font-mono">{code}</span></h3>
          <button onClick={onClose} className="btn-ghost p-1"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4 text-xs">
          {isLoading && <p className="text-zinc-500">Laster…</p>}
          {isError && <p className="text-red-400">Kunne ikke spore «{code}»</p>}
          {trace && (
            <>
              {trace.strain && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Strain</p>
                  <p className="font-mono text-zinc-100">{trace.strain.prefix} <span className="text-zinc-500">· {trace.strain.common_name}</span></p>
                </div>
              )}
              {trace.ancestors?.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Opphavskjede (rot → kilde)</p>
                  <div className="flex flex-wrap items-center gap-1 font-mono text-zinc-300">
                    {trace.ancestors.map((a, i) => (
                      <React.Fragment key={a.id}>
                        {i > 0 && <span className="text-zinc-600">→</span>}
                        <span className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700">{a.code}</span>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Kulturer i lineage</p>
                  <ul className="space-y-0.5 font-mono text-zinc-400">
                    {trace.cultures?.map(c => <li key={c.id}>{c.code} <span className="text-zinc-600">({c.media_type})</span></li>)}
                    {(!trace.cultures || trace.cultures.length === 0) && <li className="text-zinc-600">—</li>}
                  </ul>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Batcher i lineage</p>
                  <ul className="space-y-0.5 font-mono text-zinc-400">
                    {trace.batches?.map(b => <li key={b.id}>{b.spawn_batch} <span className="text-zinc-600">({b.workflow_status})</span></li>)}
                    {(!trace.batches || trace.batches.length === 0) && <li className="text-zinc-600">—</li>}
                  </ul>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
