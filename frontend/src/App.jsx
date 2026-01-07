import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import BatchTable from './components/features/BatchTable';
import Dashboard from './components/layout/Dashboard';
import StatsPanel from './components/features/StatsPanel';
import Charts from './components/features/Charts';
import Header from './components/layout/Header';
import HelpModal from './components/layout/HelpModal';

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
  lions_mane: { name: 'Lions Mane', code: 'LM', color: 'bg-yellow-600' },
  shiitake: { name: 'Shiitake', code: 'SH', color: 'bg-amber-700' }
};

function App() {
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' or 'table'
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
          {/* View Toggle */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`px-6 py-3 rounded-lg font-semibold transition ${
                currentView === 'dashboard'
                  ? 'bg-blue-600 text-white ring-4 ring-blue-200'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              📊 Dashboard
            </button>
            <button
              onClick={() => setCurrentView('table')}
              className={`px-6 py-3 rounded-lg font-semibold transition ${
                currentView === 'table'
                  ? 'bg-blue-600 text-white ring-4 ring-blue-200'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              📋 Batch Table
            </button>
          </div>

          {/* Show Dashboard or Table */}
          {currentView === 'dashboard' ? (
            <Dashboard />
          ) : (
            <>
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
            </>
          )}
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
