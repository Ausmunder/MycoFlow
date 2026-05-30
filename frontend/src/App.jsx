import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import BatchTable from './components/features/BatchTable';
import Dashboard from './components/layout/Dashboard';
import StatsPanel from './components/features/StatsPanel';
import Sidebar from './components/layout/Sidebar';
import HelpModal from './components/layout/HelpModal';
import SubstrateMixManager from './components/features/SubstrateMixManager';
import StrainRegisterPage from './components/features/StrainRegisterPage';
import CultureManager from './components/features/CultureManager';
import LoginPage from './components/auth/LoginPage';
import { verifyToken } from './api/client';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
    },
  },
});

const strainConfig = {
  oyster: { name: 'Grå østers', code: 'GO' },
  lions_mane: { name: 'Lions Mane', code: 'LM' },
  shiitake: { name: 'Shiitake', code: 'SH' },
};

// Batch table view — owns its own strain-tab + archive state
function TablePage() {
  const [activeTab, setActiveTab] = useState('oyster');
  const [showArchive, setShowArchive] = useState(false);
  return (
    <>
      <StatsPanel
        strain={activeTab === 'all' ? null : activeTab}
        strainConfig={strainConfig}
      />
      <BatchTable
        strain={activeTab === 'all' ? null : activeTab}
        showArchive={showArchive}
        strainConfig={strainConfig}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        setShowArchive={setShowArchive}
      />
    </>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() =>
    localStorage.getItem('sidebar_collapsed') === 'true'
  );

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) { setIsAuthenticated(false); return; }
    verifyToken()
      .then(() => setIsAuthenticated(true))
      .catch(() => { localStorage.removeItem('auth_token'); setIsAuthenticated(false); });
  }, []);

  // Listen for auth-logout events from API interceptor
  useEffect(() => {
    const handleLogoutEvent = () => setIsAuthenticated(false);
    window.addEventListener('auth-logout', handleLogoutEvent);
    return () => window.removeEventListener('auth-logout', handleLogoutEvent);
  }, []);

  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', sidebarCollapsed);
  }, [sidebarCollapsed]);

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

  // Auto-collapse sidebar on small screens
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1024px)');
    const handler = (e) => { if (e.matches) setSidebarCollapsed(true); };
    handler(mq);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setIsAuthenticated(false);
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-zinc-500 text-sm">Laster...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={setIsAuthenticated} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen">
        <Sidebar
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          onShowHelp={() => setShowHelp(true)}
          onLogout={handleLogout}
        />

        <main
          className={`flex-1 transition-all duration-200 ${
            sidebarCollapsed ? 'ml-sidebar-collapsed' : 'ml-sidebar'
          }`}
        >
          <div className="px-6 py-4">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/table" element={<TablePage />} />
              <Route path="/substrate" element={<SubstrateMixManager />} />
              <Route path="/strains" element={<StrainRegisterPage />} />
              <Route path="/cultures" element={<CultureManager />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>

        {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
      </div>
    </QueryClientProvider>
  );
}

export default App;
