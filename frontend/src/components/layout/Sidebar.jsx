import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Table2, Beaker, FlaskConical, Dna,
  Download, Upload, HelpCircle, LogOut, PanelLeftClose, PanelLeft,
} from 'lucide-react';
import { exportToJSON, importFromJSON } from '../../utils/helpers';
import * as api from '../../api/client';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/table', label: 'Batches', icon: Table2 },
  { to: '/strains', label: 'Strains', icon: Dna },
  { to: '/cultures', label: 'Kulturer', icon: FlaskConical },
  { to: '/substrate', label: 'Substrat', icon: Beaker },
];

export default function Sidebar({ collapsed, setCollapsed, onShowHelp, onLogout }) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const allBatches = await api.getBatches();
      const allTemplates = await api.getTemplates();
      const allBatchInfos = await api.getBatchInfos();
      exportToJSON({
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        batches: allBatches,
        templates: allTemplates,
        batchInfos: allBatchInfos,
      });
      setTimeout(() => alert('Backup lastet ned!'), 100);
    } catch (error) {
      console.error('Export error:', error);
      alert('Eksport feilet: ' + error.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const data = await importFromJSON(file);
        if (!data.batches || !Array.isArray(data.batches)) {
          throw new Error('Ugyldig backup-fil format');
        }
        if (!window.confirm(`Importere ${data.batches.length} batches?\nDette vil OVERSKRIVE eksisterende data!`)) return;
        let ok = 0, fail = 0;
        for (const batch of data.batches) {
          try { await api.createBatch(batch); ok++; } catch { fail++; }
        }
        alert(`Import ferdig!\nImportert: ${ok}\nFeilet: ${fail}`);
        window.location.reload();
      } catch (error) {
        console.error('Import error:', error);
        alert('Import feilet: ' + error.message);
      }
    };
    input.click();
  };

  const NavButton = ({ item }) => {
    const Icon = item.icon;
    return (
      <NavLink
        to={item.to}
        end={item.end}
        className={({ isActive }) =>
          `flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            isActive
              ? 'bg-zinc-800 text-white'
              : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
          }`
        }
        title={collapsed ? item.label : undefined}
      >
        <Icon size={18} className="flex-shrink-0" />
        {!collapsed && <span>{item.label}</span>}
      </NavLink>
    );
  };

  const UtilButton = ({ icon: Icon, label, onClick, disabled }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm font-medium text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors disabled:opacity-50"
      title={collapsed ? label : undefined}
    >
      <Icon size={16} className="flex-shrink-0" />
      {!collapsed && <span>{label}</span>}
    </button>
  );

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-zinc-900 flex flex-col transition-all duration-200 z-40 no-print ${
        collapsed ? 'w-sidebar-collapsed' : 'w-sidebar'
      }`}
    >
      {/* Logo */}
      <div className="px-3 py-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="text-lg font-mono font-semibold text-white">
            {collapsed ? 'MF' : 'MycoFlow'}
          </span>
        </div>
        {!collapsed && (
          <span className="text-[11px] text-zinc-500 mt-0.5 block">Skogbunn Mikromusheri</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-1">
        {NAV_ITEMS.map(item => (
          <NavButton key={item.to} item={item} />
        ))}
      </nav>

      {/* Utility buttons */}
      <div className="px-2 py-2 border-t border-zinc-800 space-y-0.5">
        <UtilButton icon={Download} label={isExporting ? 'Eksporterer...' : 'Backup'} onClick={handleExport} disabled={isExporting} />
        <UtilButton icon={Upload} label="Import" onClick={handleImport} />
        <UtilButton icon={HelpCircle} label="Hjelp" onClick={onShowHelp} />
        <UtilButton icon={LogOut} label="Logg ut" onClick={onLogout} />
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="px-3 py-3 border-t border-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-2"
        title={collapsed ? 'Utvid sidebar' : 'Skjul sidebar'}
      >
        {collapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
        {!collapsed && <span className="text-xs">Skjul</span>}
      </button>
    </aside>
  );
}
