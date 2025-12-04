import { Download, X } from 'lucide-react';

export default function InstallPrompt({ onInstall, onDismiss }) {
  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-xl border border-slate-200 p-4 max-w-sm z-50 animate-slide-up">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Download className="text-blue-600" size={20} />
          </div>
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold text-slate-900 mb-1">
            Installér Sopp Tracker
          </h3>
          <p className="text-sm text-slate-600 mb-3">
            Installér appen for rask tilgang og offline-støtte
          </p>
          
          <div className="flex gap-2">
            <button
              onClick={onInstall}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
            >
              Installér
            </button>
            <button
              onClick={onDismiss}
              className="px-4 py-2 bg-slate-100 text-slate-700 text-sm rounded-lg hover:bg-slate-200 transition"
            >
              Senere
            </button>
          </div>
        </div>
        
        <button
          onClick={onDismiss}
          className="flex-shrink-0 p-1 hover:bg-slate-100 rounded"
        >
          <X size={18} className="text-slate-400" />
        </button>
      </div>
    </div>
  );
}
