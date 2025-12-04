import { X } from 'lucide-react';

export default function HelpModal({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-2xl font-bold">🍄 Sopp Tracker - Hjelp</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Keyboard Shortcuts */}
          <section>
            <h3 className="text-xl font-semibold mb-3">⌨️ Tastatursnarveier</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between p-2 bg-slate-50 rounded">
                <span className="font-mono">Ctrl + N</span>
                <span>Ny batch</span>
              </div>
              <div className="flex justify-between p-2 bg-slate-50 rounded">
                <span className="font-mono">Ctrl + S</span>
                <span>Lagre</span>
              </div>
              <div className="flex justify-between p-2 bg-slate-50 rounded">
                <span className="font-mono">Ctrl + Z</span>
                <span>Angre</span>
              </div>
              <div className="flex justify-between p-2 bg-slate-50 rounded">
                <span className="font-mono">Ctrl + Y</span>
                <span>Gjør om</span>
              </div>
              <div className="flex justify-between p-2 bg-slate-50 rounded">
                <span className="font-mono">Ctrl + P</span>
                <span>Print</span>
              </div>
              <div className="flex justify-between p-2 bg-slate-50 rounded">
                <span className="font-mono">Ctrl + G</span>
                <span>Toggle grafer</span>
              </div>
              <div className="flex justify-between p-2 bg-slate-50 rounded">
                <span className="font-mono">Ctrl + ?</span>
                <span>Vis hjelp</span>
              </div>
            </div>
          </section>

          {/* Features */}
          <section>
            <h3 className="text-xl font-semibold mb-3">✨ Funksjoner</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span><strong>Batch tracking:</strong> Følg LC → Spawn → Bag → Høst</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span><strong>Statistikk:</strong> BE%, kontaminering, høst totaler</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span><strong>Grafer:</strong> Visualiser høst over tid, status fordeling, BE% trend</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span><strong>Filter & søk:</strong> Finn batches raskt</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span><strong>Bulk operasjoner:</strong> Arkiver eller slett flere samtidig</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span><strong>Export/Import:</strong> Sikkerhetskopier data</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span><strong>Auto-beregninger:</strong> Dager, BE%, forventet dato</span>
              </li>
            </ul>
          </section>

          {/* Workflow */}
          <section>
            <h3 className="text-xl font-semibold mb-3">🔄 Arbeidsflyt</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Velg soppart (Grå østers, Lions Mane, Shiitake)</li>
              <li>Klikk "Ny batch" for å legge til</li>
              <li>Fyll inn LC kode og spawn batch</li>
              <li>Oppdater status etter hvert (Inkubering → Klar → I frukting → Høstet)</li>
              <li>Registrer høst data når du høster</li>
              <li>Se statistikk og grafer oppdateres automatisk</li>
            </ol>
          </section>

          {/* Status meanings */}
          <section>
            <h3 className="text-xl font-semibold mb-3">📊 Status forklaring</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-slate-100 rounded text-xs">Inokulert</span>
                <span>Substrat nettopp inokulert med spawn</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-yellow-100 rounded text-xs">Inkubering</span>
                <span>Mycel vokser gjennom substrat</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-emerald-100 rounded text-xs">Klar</span>
                <span>Fullstendig kolonisert, klar for frukting</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-blue-100 rounded text-xs">I frukting</span>
                <span>Flyttet til fruktekammer</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-green-100 rounded text-xs">Høstet</span>
                <span>Sopp høstet, batch ferdig</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-red-100 rounded text-xs">Forkastet</span>
                <span>Kontaminert eller mislykket</span>
              </div>
            </div>
          </section>

          {/* Tips */}
          <section>
            <h3 className="text-xl font-semibold mb-3">💡 Tips</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>• Bruk templates for å lagre vanlige innstillinger</li>
              <li>• Marker røde rader (kontaminering) for rask identifikasjon</li>
              <li>• Eksporter data regelmessig som backup</li>
              <li>• Bruk grafer for å se trender over tid</li>
              <li>• Filtrer på "Klar" status for å se batches klare for frukting</li>
            </ul>
          </section>
        </div>

        <div className="p-6 border-t border-slate-200 bg-slate-50">
          <div className="text-center text-sm text-slate-600">
            <p className="font-semibold mb-1">Skogbunn Mikromusheri</p>
            <p>LC-Spawn-Bag-tracker v3.1</p>
            <p className="mt-2">Backend: http://192.168.1.251:8000</p>
          </div>
        </div>
      </div>
    </div>
  );
}
