/**
 * Batch prediction utilities
 * AI-based predictions for spawn and bag colonization
 */

import { formatDateShort } from './dateUtils';

// Strain baselines for spawn colonization (days)
const SPAWN_BASELINES = {
  'oyster': 14,
  'lions_mane': 21,
  'shiitake': 28,
  'reishi': 30
};

// Strain baselines for bag colonization (days)
const BAG_BASELINES = {
  'oyster': 14,
  'lions_mane': 18,
  'shiitake': 21,
  'reishi': 28
};

/**
 * Get spawn colonization prediction
 * @param {object} batch - Batch data
 * @param {object} historicalData - Historical averages from API
 * @returns {object} - { display, color, confidence }
 */
export const getSpawnPrediction = (batch, historicalData) => {
  // If no spawn data, return empty
  if (!batch.spawn_dato_inok || !batch.strain_name) {
    return { display: '-', color: '', confidence: 0 };
  }

  const today = new Date();
  const inokDate = new Date(batch.spawn_dato_inok);
  const daysElapsed = Math.floor((today - inokDate) / (1000 * 60 * 60 * 24));

  // Use historical data if available, otherwise fallback to baseline
  let baselineDays = SPAWN_BASELINES[batch.strain_name] || 21;
  let confidence = 0;

  if (historicalData?.spawn && !historicalData.spawn.baseline) {
    baselineDays = historicalData.spawn.avg_days;
    confidence = historicalData.spawn.confidence_percent;
  }

  // If spawn is already colonized (has spawn_forventet_ferdig and it's in the past)
  if (batch.spawn_forventet_ferdig && new Date(batch.spawn_forventet_ferdig) < today) {
    const actualDays = Math.floor((new Date(batch.spawn_forventet_ferdig) - inokDate) / (1000 * 60 * 60 * 24));

    // Color based on performance vs baseline
    let color = 'text-green-600';
    if (actualDays > baselineDays * 1.3) {
      color = 'text-red-600';
    } else if (actualDays > baselineDays * 1.1) {
      color = 'text-amber-600';
    }

    return {
      display: `${actualDays}d`,
      color,
      confidence
    };
  }

  const estimatedDate = new Date(inokDate);
  estimatedDate.setDate(estimatedDate.getDate() + baselineDays);

  const daysLeft = Math.ceil((estimatedDate - today) / (1000 * 60 * 60 * 24));

  let color = 'text-green-600';
  if (daysElapsed > baselineDays * 1.3) {
    color = 'text-red-600';
  } else if (daysElapsed > baselineDays * 1.1) {
    color = 'text-amber-600';
  }

  return {
    display: `${formatDateShort(estimatedDate.toISOString())} (${daysLeft}d)`,
    color,
    confidence
  };
};

export const getBagPrediction = (batch, historicalData) => {
  if (!batch.bag_dato_inok || !batch.strain_name) {
    return { display: '-', color: '', confidence: 0 };
  }

  const today = new Date();
  const inokDate = new Date(batch.bag_dato_inok);
  const daysElapsed = Math.floor((today - inokDate) / (1000 * 60 * 60 * 24));

  let baselineDays = BAG_BASELINES[batch.strain_name] || 18;
  let confidence = 0;

  if (historicalData?.bag && !historicalData.bag.baseline) {
    baselineDays = historicalData.bag.avg_days;
    confidence = historicalData.bag.confidence_percent;
  }

  if (batch.bag_frukting_start && new Date(batch.bag_frukting_start) < today) {
    const actualDays = Math.floor((new Date(batch.bag_frukting_start) - inokDate) / (1000 * 60 * 60 * 24));

    let color = 'text-green-600';
    if (actualDays > baselineDays * 1.3) {
      color = 'text-red-600';
    } else if (actualDays > baselineDays * 1.1) {
      color = 'text-amber-600';
    }

    return {
      display: `${actualDays}d`,
      color,
      confidence
    };
  }

  const estimatedDate = new Date(inokDate);
  estimatedDate.setDate(estimatedDate.getDate() + baselineDays);

  const daysLeft = Math.ceil((estimatedDate - today) / (1000 * 60 * 60 * 24));

  let color = 'text-green-600';
  if (daysElapsed > baselineDays * 1.3) {
    color = 'text-red-600';
  } else if (daysElapsed > baselineDays * 1.1) {
    color = 'text-amber-600';
  }

  return {
    display: `${formatDateShort(estimatedDate.toISOString())} (${daysLeft}d)`,
    color,
    confidence
  };
};
