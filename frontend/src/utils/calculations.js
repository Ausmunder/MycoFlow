/**
 * Utility functions for Sopp Tracker
 */

// Calculate expected colonization date based on strain
export const calcExpectedDate = (strainCode, inoculationDate, strainConfig) => {
  if (!inoculationDate || !strainCode) return null;
  
  const days = strainConfig[strainCode]?.days || 14;
  const date = new Date(inoculationDate);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

// Calculate days since start date
export const calcDaysSince = (startDate) => {
  if (!startDate) return 0;
  const diff = Math.floor((new Date() - new Date(startDate)) / 86400000);
  return diff >= 0 ? diff : 0;
};

// Check if date is overdue
export const isOverdue = (expectedDate) => {
  if (!expectedDate) return false;
  return new Date(expectedDate) < new Date();
};

// Calculate Biological Efficiency (BE%)
export const calcBE = (substrateKg, harvestKg) => {
  if (!substrateKg || !harvestKg || parseFloat(substrateKg) === 0) return 0;
  return ((parseFloat(harvestKg) / parseFloat(substrateKg)) * 100).toFixed(1);
};

// Get total harvest from all flushes
export const getTotalHarvest = (batch) => {
  return (parseFloat(batch.bag_host1_total_kg) || 0) + 
         (parseFloat(batch.bag_host2_total_kg) || 0);
};

// Get row color based on status and contamination
export const getRowColor = (batch) => {
  if (batch.bag_kontam && batch.bag_kontam !== 'Ingen') {
    return 'bg-red-100 border-l-4 border-red-500';
  }
  if (batch.bag_status === 'Hostet') return 'bg-green-50';
  if (batch.bag_status === 'Klar') return 'bg-emerald-50';
  if (batch.bag_status === 'I frukting') return 'bg-blue-50';
  if (isOverdue(batch.bag_forventet_kolon)) return 'bg-yellow-50';
  return '';
};

// Format date for display
export const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('no-NO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch {
    return '-';
  }
};

// Format date for input field (YYYY-MM-DD)
export const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  try {
    return new Date(dateString).toISOString().split('T')[0];
  } catch {
    return '';
  }
};

// Export data to JSON
export const exportToJSON = (data) => {
  const backup = {
    data,
    exportDate: new Date().toISOString(),
    version: '4.0'
  };
  
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const filename = `sopp-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Parse imported JSON
export const parseImportedJSON = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        resolve(data);
      } catch (error) {
        reject(new Error('Ugyldig JSON-fil'));
      }
    };
    reader.onerror = () => reject(new Error('Kunne ikke lese fil'));
    reader.readAsText(file);
  });
};
