import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import BatchTable from './components/BatchTable';
import StatsPanel from './components/StatsPanel';
import Charts from './components/Charts';
import Header from './components/Header';
import HelpModal from './components/HelpModal';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000, // 30 seconds
    },
  },
});

const strainConfig = {
  oyster: { name: 'Grå østers', code: 'GO', color: 'bg-blue-600' },
  lionsmane: { name: 'Lions Mane', code: 'LM', color: 'bg-yellow-600' },
  shiitake: { name: 'Shiitake', code: 'SH', color: 'bg-amber-700' }
};

function App() {
  const [activeTab, setActiveTab] = useState('oyster');
  const [showArchive, setShowArchive] = useState(false);
  const [showCharts, setShowCharts] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Keyboard shortcuts
  useState(() => {
    const handleKeyDown = (e) => {
      // Ctrl+G - Toggle charts
      if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
        e.preventDefault();
        setShowCharts(prev => !prev);
      }
      // Ctrl+? - Toggle help
      if ((e.ctrlKey || e.metaKey) && e.key === '?') {
        e.preventDefault();
        setShowHelp(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-slate-50">
        <Header 
          onToggleCharts={() => setShowCharts(prev => !prev)}
          onShowHelp={() => setShowHelp(true)}
          showCharts={showCharts}
        />
        
        <main className="container mx-auto px-4 py-6">
          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-6 py-3 rounded-lg font-semibold text-white transition ${
                activeTab === 'all' 
                  ? 'bg-slate-700 ring-4 ring-offset-2' 
                  : 'bg-slate-700 opacity-60'
              }`}
            >
              Alle
            </button>
            {Object.entries(strainConfig).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-6 py-3 rounded-lg font-semibold text-white transition ${cfg.color} ${
                  activeTab === key ? 'ring-4 ring-offset-2' : 'opacity-60'
                }`}
              >
                {cfg.name}
              </button>
            ))}
          </div>

          {/* Stats Panel */}
          <StatsPanel 
            strain={activeTab === 'all' ? null : activeTab} 
            strainConfig={strainConfig}
          />

          {/* Charts Section - Toggle */}
          {showCharts && (
            <div className="mb-6 bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">📊 Grafer</h2>
                <button
                  onClick={() => setShowCharts(false)}
                  className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 text-sm font-medium"
                >
                  ✕ Skjul grafer
                </button>
              </div>
              <Charts strain={activeTab === 'all' ? null : activeTab} />
            </div>
          )}

          {/* Archive Toggle */}
          <div className="mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showArchive}
                onChange={(e) => setShowArchive(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">Vis arkiv</span>
            </label>
          </div>

          {/* Batch Table */}
          <BatchTable 
            strain={activeTab === 'all' ? null : activeTab}
            showArchive={showArchive}
            strainConfig={strainConfig}
          />
        </main>

        {/* Help Modal */}
        {showHelp && (
          <HelpModal onClose={() => setShowHelp(false)} />
        )}
      </div>
    </QueryClientProvider>
  );
}

export default App;
