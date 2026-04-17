import { X } from 'lucide-react';

export default function HelpModal({ onClose }) {
  return (
    <div className="modal-overlay">
      <div className="modal-panel max-w-2xl">
        <div className="modal-header">
          <h2 className="text-lg font-semibold">MycoFlow - Hjelp</h2>
          <button onClick={onClose} className="btn-ghost p-1">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-5 text-sm">
          <section>
            <h3 className="font-semibold text-zinc-900 mb-2">Tastatursnarveier</h3>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                ['Ctrl + N', 'Ny batch'],
                ['Ctrl + S', 'Lagre'],
                ['Ctrl + Z', 'Angre'],
                ['Ctrl + Y', 'Gjør om'],
                ['Ctrl + P', 'Print'],
                ['Ctrl + ?', 'Vis hjelp'],
              ].map(([key, label]) => (
                <div key={key} className="flex justify-between p-1.5 bg-zinc-50 rounded text-xs">
                  <span className="font-mono text-zinc-600">{key}</span>
                  <span className="text-zinc-500">{label}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="font-semibold text-zinc-900 mb-2">Arbeidsflyt</h3>
            <ol className="list-decimal list-inside space-y-1 text-zinc-600 text-xs">
              <li>Velg soppart (Grå østers, Lions Mane, Shiitake)</li>
              <li>Klikk "Ny batch" for å legge til</li>
              <li>Fyll inn LC kode og spawn batch</li>
              <li>Oppdater status etter hvert</li>
              <li>Registrer høst data</li>
              <li>Se statistikk oppdateres automatisk</li>
            </ol>
          </section>

          <section>
            <h3 className="font-semibold text-zinc-900 mb-2">Status</h3>
            <div className="space-y-1 text-xs">
              {[
                ['bg-green-500', 'Spawning', 'Grain inokulert med LC'],
                ['bg-amber-500', 'Colonizing', 'Mycel vokser gjennom substrat'],
                ['bg-orange-500', 'Fruiting', 'I fruktekammer'],
                ['bg-blue-500', 'Harvesting', 'Høsting pågår'],
                ['bg-zinc-400', 'Completed', 'Batch ferdig'],
              ].map(([dot, label, desc]) => (
                <div key={label} className="flex items-center gap-2">
                  <span className={`status-dot ${dot}`} />
                  <span className="font-medium text-zinc-700 w-20">{label}</span>
                  <span className="text-zinc-500">{desc}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="p-4 border-t border-zinc-100 text-center">
          <p className="text-xs text-zinc-400">Skogbunn Mikromusheri - MycoFlow</p>
        </div>
      </div>
    </div>
  );
}
