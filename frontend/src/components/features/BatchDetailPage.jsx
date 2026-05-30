import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Pencil, Printer, GitBranch } from 'lucide-react';
import { useBatch, usePrintLabel, useTrace } from '../../hooks/useApi';
import BatchModal from './BatchModal';
import PrintDialog from './PrintDialog';

const STAGE_ORDER = ['spawning', 'colonizing', 'fruiting', 'harvesting', 'completed'];
const STAGE_LABEL = {
  spawning: 'Spawn', colonizing: 'Inkubering', fruiting: 'Frukting',
  harvesting: 'Høsting', completed: 'Fullført', contaminated: 'Kontaminert',
};

const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('no-NO', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const fmtKg = (kg) => (kg != null && kg !== '') ? `${Number(kg).toFixed(2)} kg` : '—';

function StageProgress({ status }) {
  const current = STAGE_ORDER.indexOf(status);
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1">
      {STAGE_ORDER.map((stage, i) => {
        const done = current >= 0 && i < current;
        const active = i === current;
        return (
          <div key={stage} className="flex items-center gap-1 flex-shrink-0">
            <div
              className={`h-2 w-2 rounded-full ${active ? 'bg-red-500' : done ? 'bg-green-700' : 'bg-zinc-700'}`}
              title={STAGE_LABEL[stage]}
            />
            {i < STAGE_ORDER.length - 1 && <div className={`h-px w-5 ${done ? 'bg-green-700' : 'bg-zinc-700'}`} />}
          </div>
        );
      })}
      <span className="ml-2 text-[11px] font-mono text-zinc-500">{STAGE_LABEL[status] || status}</span>
    </div>
  );
}

const Card = ({ title, children, action }) => (
  <div className="card p-4">
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-[10px] tracking-widest text-zinc-500 uppercase">{title}</h2>
      {action}
    </div>
    {children}
  </div>
);

export default function BatchDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: batch, isLoading, isError } = useBatch(id);
  const { data: trace } = useTrace(batch?.spawn_batch);
  const printLabel = usePrintLabel();

  const [showEdit, setShowEdit] = useState(false);
  const [showPrint, setShowPrint] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-3 max-w-2xl">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 bg-zinc-900 rounded-lg animate-pulse" />)}
      </div>
    );
  }
  if (isError || !batch) {
    return (
      <div className="text-sm text-red-400 font-mono">
        Batch ikke funnet. <button onClick={() => navigate('/table')} className="underline">Tilbake</button>
      </div>
    );
  }

  const totalKg = (batch.bag_host1_total_kg || 0) + (batch.bag_host2_total_kg || 0);
  const status = batch.workflow_status || 'spawning';

  const handlePrint = async (batchId, copies) => {
    try {
      const res = await printLabel.mutateAsync({ batchId, copies });
      if (res?.success === false) alert('Print feilet: ' + (res.message || ''));
      else setShowPrint(false);
    } catch (e) { alert('Print feilet: ' + (e.response?.data?.detail || e.message)); }
  };

  const timeline = [
    { label: 'LC inokulert', date: batch.lc_dato_inok },
    { label: 'Spawn inokulert', date: batch.spawn_dato_inok },
    { label: 'Pose inokulert (inkubering)', date: batch.bag_dato_inok },
    { label: 'Frukting startet', date: batch.bag_frukting_start },
    { label: 'Høst 1 — start', date: batch.bag_host1_start },
    { label: 'Høst 1 — slutt', date: batch.bag_host1_slutt },
    { label: 'Høst 2 — start', date: batch.bag_host2_start },
    { label: 'Høst 2 — slutt', date: batch.bag_host2_slutt },
  ].filter(e => e.date);

  const harvests = [
    { flush: 'Høst 1', kg: batch.bag_host1_total_kg, start: batch.bag_host1_start, end: batch.bag_host1_slutt },
    { flush: 'Høst 2', kg: batch.bag_host2_total_kg, start: batch.bag_host2_start, end: batch.bag_host2_slutt },
  ].filter(h => h.kg != null);

  return (
    <div className="space-y-4 max-w-2xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button onClick={() => navigate('/table')} className="flex items-center gap-1 text-[10px] tracking-widest text-zinc-600 uppercase font-mono hover:text-zinc-400 mb-1">
            <ArrowLeft size={12} /> Batches
          </button>
          <h1 className="text-base font-semibold font-mono text-zinc-100">{batch.spawn_batch || `Batch #${batch.id}`}</h1>
          <p className="text-xs text-zinc-500 capitalize mt-0.5">{batch.strain_name}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowPrint(true)} className="btn flex items-center gap-1.5 text-xs"><Printer size={14} /> Etikett</button>
          <button onClick={() => setShowEdit(true)} className="btn-primary flex items-center gap-1.5 text-xs"><Pencil size={14} /> Rediger</button>
        </div>
      </div>

      {/* Progress */}
      <Card title="Fremgang">
        <StageProgress status={status} />
      </Card>

      {/* Traceability */}
      <Card title="Sporbarhet">
        {trace ? (
          <div className="space-y-2 text-xs">
            <div className="flex flex-wrap items-center gap-1 font-mono">
              {trace.strain && <span className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-200">{trace.strain.prefix}</span>}
              {trace.ancestors?.map(a => (
                <React.Fragment key={a.id}>
                  <span className="text-zinc-600">→</span>
                  <span className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300">{a.code}</span>
                </React.Fragment>
              ))}
              <span className="text-zinc-600">→</span>
              <span className="px-1.5 py-0.5 rounded bg-red-950 border border-red-800 text-red-300">{batch.spawn_batch}</span>
            </div>
            {trace.strain?.common_name && <p className="text-zinc-500">{trace.strain.species_latin} · {trace.strain.common_name}</p>}
          </div>
        ) : (
          <p className="text-xs text-zinc-600 flex items-center gap-1.5"><GitBranch size={13} /> Ingen kilde-kultur koblet</p>
        )}
      </Card>

      {/* Metrics */}
      <Card title="Nøkkeltall">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Substrat', value: fmtKg(batch.bag_kg_substrat) },
            { label: 'Total høst', value: totalKg > 0 ? fmtKg(totalKg) : '—' },
            { label: 'BE%', value: batch.bag_be_percent != null ? `${batch.bag_be_percent}%` : '—' },
            { label: 'Bager', value: batch.bag_antall_bager ?? '—' },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <p className="text-[10px] tracking-widest text-zinc-600 uppercase">{label}</p>
              <p className="text-sm font-mono text-zinc-100 mt-0.5">{value}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Harvest */}
      {harvests.length > 0 && (
        <Card title="Høsting">
          <div className="space-y-2">
            {harvests.map(h => (
              <div key={h.flush} className="flex items-center justify-between text-xs font-mono border border-zinc-800 rounded px-3 py-2">
                <div>
                  <span className="text-zinc-300">{h.flush}</span>
                  {h.start && <span className="ml-2 text-zinc-600">{fmtDate(h.start)} — {fmtDate(h.end)}</span>}
                </div>
                <span className="text-zinc-100 font-semibold">{fmtKg(h.kg)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Timeline */}
      {timeline.length > 0 && (
        <Card title="Tidslinje">
          <div className="space-y-1.5">
            {timeline.map(e => (
              <div key={e.label} className="flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-500">{e.label}</span>
                <span className="text-zinc-300">{fmtDate(e.date)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Notes */}
      {batch.notes && (
        <Card title="Notater">
          <pre className="text-xs text-zinc-400 font-mono whitespace-pre-wrap">{batch.notes}</pre>
        </Card>
      )}

      {showEdit && <BatchModal batchId={batch.id} onClose={() => setShowEdit(false)} />}
      {showPrint && <PrintDialog batch={batch} onClose={() => setShowPrint(false)} onPrint={handlePrint} />}
    </div>
  );
}
