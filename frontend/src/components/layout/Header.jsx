import { useState } from 'react';
import { Download, Upload, BarChart2, HelpCircle, Printer } from 'lucide-react';
import { useBatches } from '../../hooks/useApi';
import { exportToJSON, importFromJSON } from '../../utils/helpers';
import * as api from '../../api/client';

export default function Header({ onToggleCharts, onShowHelp, showCharts }) {
  const { data: batches = [] } = useBatches({});
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Fetch all data from backend
      const allBatches = await api.getBatches();
      const allTemplates = await api.getTemplates();
      const allBatchInfos = await api.getBatchInfos();
      
      const backup = {
        version: 'v3.1',
        exportDate: new Date().toISOString(),
        batches: allBatches,
        templates: allTemplates,
        batchInfos: allBatchInfos
      };
      
      exportToJSON(backup);
      
      // Show success message
      setTimeout(() => {
        alert('✅ Backup lastet ned!');
      }, 100);
    } catch (error) {
      console.error('Export error:', error);
      alert('❌ Eksport feilet: ' + error.message);
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
      
      setIsImporting(true);
      try {
        const data = await importFromJSON(file);
        
        if (!data.batches || !Array.isArray(data.batches)) {
          throw new Error('Ugyldig backup-fil format');
        }
        
        const confirmed = window.confirm(
          `Importere ${data.batches.length} batches?\n\n` +
          `Dette vil OVERSKRIVE eksisterende data!\n\n` +
          `Sikker på at du vil fortsette?`
        );
        
        if (!confirmed) {
          setIsImporting(false);
          return;
        }
        
        // Import batches one by one
        let successCount = 0;
        let errorCount = 0;
        
        for (const batch of data.batches) {
          try {
            await api.createBatch(batch);
            successCount++;
          } catch (err) {
            console.error('Failed to import batch:', err);
            errorCount++;
          }
        }
        
        alert(
          `✅ Import ferdig!\n\n` +
          `Importert: ${successCount}\n` +
          `Feilet: ${errorCount}`
        );
        
        // Refresh page to load new data
        window.location.reload();
      } catch (error) {
        console.error('Import error:', error);
        alert('❌ Import feilet: ' + error.message);
      } finally {
        setIsImporting(false);
      }
    };
    
    input.click();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <header className="bg-slate-800 text-white shadow-lg no-print">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Vekstoversikt (v0.9.6)</h1>
            <h2 className="text-xl text-slate-300">Skogbunn Mikromusheri</h2>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
              title="Eksporter backup (Ctrl+S)"
            >
              <Download size={18} />
              <span>{isExporting ? 'Eksporterer...' : 'Backup'}</span>
            </button>
            
            <button
              onClick={handleImport}
              disabled={isImporting}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              title="Importer data"
            >
              <Upload size={18} />
              <span>{isImporting ? 'Importerer...' : 'Import'}</span>
            </button>
            
            <button
              onClick={onToggleCharts}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                showCharts 
                  ? 'bg-purple-600 hover:bg-purple-700' 
                  : 'bg-slate-600 hover:bg-slate-700'
              }`}
              title="Toggle grafer (Ctrl+G)"
            >
              <BarChart2 size={18} />
              <span>Grafer</span>
            </button>
            
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-slate-600 rounded-lg hover:bg-slate-700 transition"
              title="Print (Ctrl+P)"
            >
              <Printer size={18} />
              <span>Print</span>
            </button>
            
            <button
              onClick={onShowHelp}
              className="flex items-center gap-2 px-4 py-2 bg-slate-600 rounded-lg hover:bg-slate-700 transition"
              title="Hjelp (Ctrl+?)"
            >
              <HelpCircle size={18} />
              <span>Hjelp</span>
            </button>
          </div>
        </div>
        
        {/* Stats bar */}
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-300">
          <div>
            <span className="font-semibold">{batches.length}</span> totale batches
          </div>
          <div>
            Backend: <span className="font-mono">192.168.1.251:8000</span>
          </div>
          <div>
            Status: <span className="text-green-400">● Online</span>
          </div>
        </div>
      </div>
    </header>
  );
}
