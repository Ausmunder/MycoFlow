import { format, differenceInDays } from 'date-fns';

// Calculate expected colonization date
export const calcExpectedDate = (strainDays, inoculationDate) => {
  if (!inoculationDate) return null;
  const date = new Date(inoculationDate);
  date.setDate(date.getDate() + strainDays);
  return date.toISOString().split('T')[0];
};

// Calculate days since date
export const calcDaysSince = (startDate) => {
  if (!startDate) return 0;
  const start = new Date(startDate);
  const now = new Date();
  const days = differenceInDays(now, start);
  return days >= 0 ? days : 0;
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

// Get total harvest from both harvests
export const getTotalHarvest = (batch) => {
  return (parseFloat(batch.bag_host1_total_kg) || 0) + (parseFloat(batch.bag_host2_total_kg) || 0);
};

// Get row color based on status
export const getRowColor = (batch) => {
  if (batch.bag_kontam !== 'Ingen') return 'bg-red-100 border-l-4 border-red-500';
  if (batch.bag_status === 'Hostet') return 'bg-green-50';
  if (batch.bag_status === 'Klar') return 'bg-emerald-50';
  if (batch.bag_status === 'I frukting') return 'bg-blue-50';
  if (batch.bag_forventet_kolon && isOverdue(batch.bag_forventet_kolon)) return 'bg-yellow-50';
  return '';
};

// Format date for display
export const formatDate = (date) => {
  if (!date) return '-';
  try {
    return format(new Date(date), 'dd.MM.yyyy');
  } catch {
    return '-';
  }
};

// Parse float safely
export const parseFloatSafe = (value) => {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
};

// Parse int safely
export const parseIntSafe = (value) => {
  const parsed = parseInt(value);
  return isNaN(parsed) ? 0 : parsed;
};

// Export data to JSON file
export const exportToJSON = (data) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sopp-tracker-backup-${format(new Date(), 'yyyy-MM-dd')}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Import data from JSON file
export const importFromJSON = (file) => {
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
