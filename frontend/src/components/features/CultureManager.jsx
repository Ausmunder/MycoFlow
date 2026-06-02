import React, { useState, useMemo } from 'react';
import { X, Plus, Trash2, GitBranch, Archive } from 'lucide-react';
import {
  useCultures, useCreateCulture, useDeleteCulture, useStrains, useCreateStrain, useTrace,
} from '../../hooks/useApi';

const MEDIA = [
  { key: 'MC', label: 'Mother Culture' },
  { key: 'LC', label: 'Liquid Culture' },
  { key: 'PD', label: 'Petri Dish' },
  { key: 'SL', label: 'Slant' },
];
const MEDIA_LABEL = Object.fromEntries(MEDIA.map(m => [m.key, m.label]));

const STRAIN_CATEGORIES = [
  { key: 'oyster', label: 'Østerssopp' },
  { key: 'lions_mane', label: 'Lions Mane' },
  { key: 'shiitake', label: 'Shiitake' },
  { key: 'reishi', label: 'Reishi' },
];

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
  strain_id: '', media_type: 'MC', parent_culture_id: '', date_created: today(),
  source: '', quantity: '', quantity_unit: 'ml', notes: '',
  // inline strain fields
  species_code: '', strain_number: '', common_name: '', species_latin: '', strain_category: 'oyster',
});

const emptyBackupForm = () => ({
  date_created: today(), quantity: '', quantity_unit: 'ml', source: '', notes: '',
});

export default function CultureManager() {
  const [activeTab, setActiveTab] = useState('cultures');
  const [mediaFilter, setMediaFilter] = useState('all');
  const { data: cultures = [], isLoading } = useCultures();
  const { data: strains = [] } = useStrains();
  const createCulture = useCreateCulture();
  const deleteCulture = useDeleteCulture();
  const createStrain = useCreateStrain();

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [traceCode, setTraceCode] = useState(null);
  const [backupSource, setBackupSource] = useState(null); // culture object to back up

  const filtered = useMemo(() => {
    if (activeTab === 'cultures') {
      return cultures.filter(c => c.active && (mediaFilter === 'all' || c.media_type === mediaFilter));
    }
    if (activeTab === 'backup') {
      return cultures.filter(c => c.active && c.media_type === 'SL');
    }
    return cultures.filter(c => !c.active);
  }, [cultures, activeTab, mediaFilter]);

  // MC + SL candidates for the chosen strain (as valid parents)
  const parentOptions = useMemo(() =>
    cultures.filter(c =>
      (c.media_type === 'MC' || c.media_type === 'SL') &&
      String(c.strain_id) === String(form.strain_id) &&
      c.active
    ),
    [cultures, form.strain_id]
  );

  const isNewStrain = form.strain_id === 'new';
  const needsParent = form.media_type !== 'MC';

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let strainId = form.strain_id;

      if (isNewStrain) {
        const newStrain = await createStrain.mutateAsync({
          species_code: form.species_code.toUpperCase(),
          strain_number: form.strain_number,
          common_name: form.common_name,
          species_latin: form.species_latin || null,
          strain_category: form.strain_category,
        });
        strainId = newStrain.id;
      }

      const payload = {
        strain_id: parseInt(strainId),
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

  const handleBackupSubmit = async (backupForm) => {
    try {
      await createCulture.mutateAsync({
        strain_id: backupSource.strain_id,
        media_type: 'SL',
        parent_culture_id: backupSource.id,
        date_created: backupForm.date_created ? new Date(backupForm.date_created + 'T12:00:00').toISOString() : null,
        source: backupForm.source || null,
        quantity: backupForm.quantity !== '' ? parseFloat(backupForm.quantity) : null,
        quantity_unit: backupForm.quantity_unit || null,
        notes: backupForm.notes || null,
      });
      setBackupSource(null);
    } catch (error) {
      alert('Feil:\n' + errMsg(error));
    }
  };

  if (isLoading) return <div className="p-4 text-sm text-zinc-500">Laster...</div>;

  const tabs = [
    { key: 'cultures', label: 'Kulturer' },
    { key: 'backup', label: 'Backup' },
    { key: 'inactive', label: 'Inaktive' },
  ];

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-sm font-semibold text-zinc-100">Kulturer</h1>
          <p className="text-xs text-zinc-500">{cultures.filter(c => c.active).length} aktive · MC → LC / PD / SL → batch</p>
        </div>
        <button
          onClick={() => { setForm(emptyForm()); setShowModal(true); }}
          className="btn-primary flex items-center gap-1.5 text-xs"
        >
          <Plus size={14} /> Ny kultur
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-zinc-800">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors -mb-px ${
              activeTab === t.key
                ? 'border-zinc-100 text-zinc-100'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {t.label}
            {t.key === 'backup' && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono text-[10px]">
                {cultures.filter(c => c.active && c.media_type === 'SL').length}
              </span>
            )}
            {t.key === 'inactive' && cultures.filter(c => !c.active).length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 font-mono text-[10px]">
                {cultures.filter(c => !c.active).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Media filter pills — only on Kulturer tab */}
      {activeTab === 'cultures' && (
        <div className="flex gap-2 flex-wrap">
          {['all', ...MEDIA.map(m => m.key)].map(k => (
            <button
              key={k}
              onClick={() => setMediaFilter(k)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                mediaFilter === k
                  ? 'bg-zinc-100 border-zinc-100 text-zinc-900'
                  : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {k === 'all' ? 'Alle' : `${k} · ${MEDIA_LABEL[k]}`}
            </button>
          ))}
        </div>
      )}

      {activeTab === 'backup' && (
        <p className="text-xs text-zinc-500">Slant-arkiv · langtidslagring av aktive stammer</p>
      )}

      <CultureTable
        cultures={filtered}
        allCultures={cultures}
        showBackupBtn={activeTab === 'cultures'}
        onTrace={setTraceCode}
        onDelete={handleDelete}
        onBackup={setBackupSource}
      />

      {/* Create modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-panel max-w-md">
            <div className="modal-header">
              <h3 className="text-lg font-semibold">Ny kultur</h3>
              <button onClick={() => setShowModal(false)} className="btn-ghost p-1"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-3">
              {/* Strain selector */}
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Strain *</label>
                <select
                  value={form.strain_id}
                  onChange={(e) => setForm(p => ({ ...p, strain_id: e.target.value, parent_culture_id: '' }))}
                  className="input w-full"
                  required
                >
                  <option value="">Velg strain…</option>
                  {strains.map(s => <option key={s.id} value={s.id}>{s.prefix} · {s.common_name}</option>)}
                  <option value="new">＋ Opprett ny strain...</option>
                </select>
              </div>

              {/* Inline new strain fields */}
              {isNewStrain && (
                <div className="rounded-md border border-zinc-700 bg-zinc-900 p-3 space-y-2">
                  <p className="text-[10px] uppercase tracking-wider text-zinc-500">Ny strain</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">Artskode *</label>
                      <input
                        type="text"
                        value={form.species_code}
                        onChange={e => setForm(p => ({ ...p, species_code: e.target.value.toUpperCase() }))}
                        className="input w-full"
                        placeholder="HE"
                        maxLength={4}
                        required={isNewStrain}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">Stammenr. *</label>
                      <input
                        type="text"
                        value={form.strain_number}
                        onChange={e => setForm(p => ({ ...p, strain_number: e.target.value }))}
                        className="input w-full"
                        placeholder="9514"
                        required={isNewStrain}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Fellesnavn *</label>
                    <input
                      type="text"
                      value={form.common_name}
                      onChange={e => setForm(p => ({ ...p, common_name: e.target.value }))}
                      className="input w-full"
                      placeholder="Lions Mane"
                      required={isNewStrain}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">Latinsk navn</label>
                      <input
                        type="text"
                        value={form.species_latin}
                        onChange={e => setForm(p => ({ ...p, species_latin: e.target.value }))}
                        className="input w-full"
                        placeholder="Hericium erinaceus"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">Kategori</label>
                      <select
                        value={form.strain_category}
                        onChange={e => setForm(p => ({ ...p, strain_category: e.target.value }))}
                        className="input w-full"
                      >
                        {STRAIN_CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Media *</label>
                  <select
                    value={form.media_type}
                    onChange={(e) => setForm(p => ({ ...p, media_type: e.target.value, parent_culture_id: '' }))}
                    className="input w-full"
                  >
                    {MEDIA.map(m => <option key={m.key} value={m.key}>{m.key} · {m.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Dato</label>
                  <input
                    type="date"
                    value={form.date_created}
                    onChange={(e) => setForm(p => ({ ...p, date_created: e.target.value }))}
                    className="input w-full"
                  />
                </div>
              </div>

              {needsParent && (
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Opphav (MC eller SL)</label>
                  <select
                    value={form.parent_culture_id}
                    onChange={(e) => setForm(p => ({ ...p, parent_culture_id: e.target.value }))}
                    className="input w-full"
                    disabled={!form.strain_id || isNewStrain}
                  >
                    <option value="">
                      {!form.strain_id || isNewStrain ? 'Velg strain først' : '— ingen —'}
                    </option>
                    {parentOptions.map(c => (
                      <option key={c.id} value={c.id}>{c.code} ({c.media_type})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Mengde</label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.quantity}
                    onChange={(e) => setForm(p => ({ ...p, quantity: e.target.value }))}
                    className="input w-full"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Enhet</label>
                  <select
                    value={form.quantity_unit}
                    onChange={(e) => setForm(p => ({ ...p, quantity_unit: e.target.value }))}
                    className="input w-full"
                  >
                    <option value="ml">ml</option>
                    <option value="stk">stk</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Kilde</label>
                  <input
                    type="text"
                    value={form.source}
                    onChange={(e) => setForm(p => ({ ...p, source: e.target.value }))}
                    className="input w-full"
                    placeholder="vev…"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-zinc-500 mb-1">Notat</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))}
                  className="input w-full"
                  rows="2"
                />
              </div>

              <p className="text-[11px] text-zinc-500">
                Koden genereres automatisk:{' '}
                <span className="font-mono text-zinc-400">
                  {isNewStrain
                    ? `${form.species_code || '{kode}'}${form.strain_number || '{nr}'}`
                    : strains.find(s => String(s.id) === String(form.strain_id))?.prefix || '{prefiks}'}
                  -{form.media_type}-{'{ÅRUKE}{enhet}'}
                </span>
              </p>

              <div className="flex gap-2 justify-end pt-2 border-t border-zinc-800">
                <button type="button" onClick={() => setShowModal(false)} className="btn">Avbryt</button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={!form.strain_id || createCulture.isPending || createStrain.isPending}
                >
                  {createStrain.isPending ? 'Oppretter strain…' : createCulture.isPending ? 'Oppretter…' : 'Opprett'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {backupSource && (
        <BackupModal
          source={backupSource}
          onClose={() => setBackupSource(null)}
          onSubmit={handleBackupSubmit}
          isPending={createCulture.isPending}
        />
      )}

      {traceCode && <TraceModal code={traceCode} onClose={() => setTraceCode(null)} />}
    </div>
  );
}

// ── Culture table ──────────────────────────────────────────────────────────────
function CultureTable({ cultures, allCultures, showBackupBtn, onTrace, onDelete, onBackup }) {
  return (
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
          {cultures.map(c => {
            const parent = allCultures.find(p => p.id === c.parent_culture_id);
            return (
              <tr key={c.id} className={!c.active ? 'opacity-50' : ''}>
                <td className="td font-mono font-medium text-zinc-100">{c.code}</td>
                <td className="td">{c.media_type}</td>
                <td className="td font-mono text-zinc-400">{c.strain_prefix || '-'}</td>
                <td className="td font-mono text-zinc-500">{parent ? parent.code : '-'}</td>
                <td className="td text-center font-mono">
                  {c.quantity != null ? (
                    <span className={(() => {
                      const pct = c.initial_quantity > 0 ? c.quantity / c.initial_quantity : null;
                      return pct == null ? 'text-zinc-400' :
                        pct <= 0.25 ? 'text-red-400' :
                        pct <= 0.5  ? 'text-amber-400' :
                                      'text-green-400';
                    })()}>
                      {c.quantity} {c.quantity_unit || ''}
                    </span>
                  ) : '-'}
                </td>
                <td className="td font-mono">
                  {c.date_created ? new Date(c.date_created).toLocaleDateString('no-NO') : '-'}
                </td>
                <td className="td text-center font-mono">{c.batch_count || 0}</td>
                <td className="td text-center">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    c.active ? 'text-green-400 bg-green-950' : 'text-zinc-500 bg-zinc-800'
                  }`}>
                    {c.active ? 'Aktiv' : 'Inaktiv'}
                  </span>
                </td>
                <td className="td">
                  <div className="flex gap-1 justify-center">
                    <button
                      onClick={() => onTrace(c.code)}
                      className="btn-ghost p-1"
                      title="Spor lineage"
                    >
                      <GitBranch size={14} />
                    </button>
                    {showBackupBtn && c.active && (
                      <button
                        onClick={() => onBackup(c)}
                        className="btn-ghost p-1 hover:text-amber-400"
                        title="Send til backup (opprett SL)"
                      >
                        <Archive size={14} />
                      </button>
                    )}
                    <button
                      onClick={() => onDelete(c)}
                      className="btn-ghost p-1 hover:text-red-400"
                      title="Deaktiver"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
          {cultures.length === 0 && (
            <tr>
              <td colSpan={9} className="td text-center text-zinc-600 py-6 italic">Ingen kulturer</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ── Backup modal ───────────────────────────────────────────────────────────────
function BackupModal({ source, onClose, onSubmit, isPending }) {
  const [form, setForm] = useState(emptyBackupForm());

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-panel max-w-sm">
        <div className="modal-header">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Archive size={16} /> Send til backup
          </h3>
          <button onClick={onClose} className="btn-ghost p-1"><X size={18} /></button>
        </div>
        <div className="px-5 pt-2 pb-1">
          <p className="text-xs text-zinc-500">
            Oppretter slant (SL) avledet fra{' '}
            <span className="font-mono text-zinc-300">{source.code}</span>
          </p>
        </div>
        <form onSubmit={handleSubmit} className="p-5 pt-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Dato</label>
              <input
                type="date"
                value={form.date_created}
                onChange={e => setForm(p => ({ ...p, date_created: e.target.value }))}
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Mengde (ml)</label>
              <input
                type="number"
                step="0.1"
                value={form.quantity}
                onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))}
                className="input w-full"
                placeholder="0"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Kilde / medium</label>
            <input
              type="text"
              value={form.source}
              onChange={e => setForm(p => ({ ...p, source: e.target.value }))}
              className="input w-full"
              placeholder="agar, vev…"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Notat</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              className="input w-full"
              rows="2"
            />
          </div>
          <div className="flex gap-2 justify-end pt-2 border-t border-zinc-800">
            <button type="button" onClick={onClose} className="btn">Avbryt</button>
            <button type="submit" className="btn-primary" disabled={isPending}>
              {isPending ? 'Lagrer…' : 'Lagre som SL'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Lineage trace modal ────────────────────────────────────────────────────────
export function TraceModal({ code, onClose }) {
  const { data: trace, isLoading, isError } = useTrace(code);
  return (
    <div className="modal-overlay">
      <div className="modal-panel max-w-lg">
        <div className="modal-header">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <GitBranch size={18} /> Sporbarhet · <span className="font-mono">{code}</span>
          </h3>
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
                  <p className="font-mono text-zinc-100">
                    {trace.strain.prefix}{' '}
                    <span className="text-zinc-500">· {trace.strain.common_name}</span>
                  </p>
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
                    {trace.cultures?.map(c => (
                      <li key={c.id}>{c.code} <span className="text-zinc-600">({c.media_type})</span></li>
                    ))}
                    {(!trace.cultures || trace.cultures.length === 0) && <li className="text-zinc-600">—</li>}
                  </ul>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Batcher i lineage</p>
                  <ul className="space-y-0.5 font-mono text-zinc-400">
                    {trace.batches?.map(b => (
                      <li key={b.id}>{b.spawn_batch} <span className="text-zinc-600">({b.workflow_status})</span></li>
                    ))}
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
