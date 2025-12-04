// Calculate days between two dates
export const calculateDays = (startDate) => {
  if (!startDate) return 0;
  
  const start = new Date(startDate);
  const now = new Date();
  
  // Reset time to midnight for accurate day calculation
  start.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  
  const diffTime = now - start;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays >= 0 ? diffDays : 0;
};

// Calculate expected colonization date (spawn_dato_inok + 12 days average)
export const calculateExpectedColonization = (spawnDatoInok) => {
  if (!spawnDatoInok) return null;
  
  const spawnDate = new Date(spawnDatoInok);
  const expectedDate = new Date(spawnDate);
  expectedDate.setDate(expectedDate.getDate() + 12); // 12 days average (10-15 range)
  
  return expectedDate.toISOString().split('T')[0]; // Return YYYY-MM-DD
};

// Calculate auto-updated batch with current days
export const calculateBatchDays = (batch) => {
  const updates = {
    ...batch,
    spawn_dager_ink: calculateDays(batch.spawn_dato_inok),
    bag_dager_ink: calculateDays(batch.bag_dato_inok)
  };
  
  // Auto-calculate forventet_kolon if spawn_dato_inok exists but forventet_kolon doesn't
  if (batch.spawn_dato_inok && !batch.bag_forventet_kolon) {
    updates.bag_forventet_kolon = calculateExpectedColonization(batch.spawn_dato_inok);
  }
  
  return updates;
};

// Calculate days for all batches
export const calculateAllBatchDays = (batches) => {
  return batches.map(calculateBatchDays);
};
