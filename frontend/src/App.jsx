import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import BatchTable from './components/features/BatchTable';
import Dashboard from './components/layout/Dashboard';
import StatsPanel from './components/features/StatsPanel';
import Header from './components/layout/Header';
import HelpModal from './components/layout/HelpModal';
import SubstrateMixManager from './components/features/SubstrateMixManager';
import LoginPage from './components/auth/LoginPage';
import { verifyToken } from './api/client';

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
  const [isAuthenticated, setIsAuthenticated] = useState(null); // null=checking, false=login, true=app
  const [currentView, setCurrentView] = useState('dashboard');
  const [activeTab, setActiveTab] = useState('oyster');
  const [showArchive, setShowArchive] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Check token validity on mount
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setIsAuthenticated(false);
      return;
    }
    verifyToken()
      .then(() => setIsAuthenticated(true))
      .catch(() => {
        localStorage.removeItem('auth_token');
        setIsAuthenticated(false);
      });
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '?') {
        e.preventDefault();
        setShowHelp(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setIsAuthenticated(false);
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-slate-400">Laster...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={setIsAuthenticated} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-slate-50">
        <Header
          onShowHelp={() => setShowHelp(true)}
          onLogout={handleLogout}
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
              📋 Batch oversikt
            </button>
            <button
              onClick={() => setCurrentView('substrate')}
              className={`px-6 py-3 rounded-lg font-semibold transition ${
                currentView === 'substrate'
                  ? 'bg-green-600 text-white ring-4 ring-green-200'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              🧪 Substrat
            </button>
          </div>

          {/* Show Dashboard, Table or Substrate */}
          {currentView === 'substrate' ? (
            <SubstrateMixManager />
          ) : currentView === 'dashboard' ? (
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
