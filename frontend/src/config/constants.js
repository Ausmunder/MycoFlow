/**
 * Application constants
 * Centralized constants for strains, statuses, and configuration
 */

// Strain definitions with baseline data
export const STRAINS = {
  OYSTER: {
    id: 'oyster',
    name: 'Grå Øystersopp',
    displayName: 'Grå Øyster',
    color: '#FFA500',
    spawnDays: 10,
    bagDays: 14,
  },
  LIONS_MANE: {
    id: 'lions_mane',
    name: 'Lions Mane',
    displayName: 'Lions Mane',
    color: '#FFD700',
    spawnDays: 12,
    bagDays: 21,
  },
  SHIITAKE: {
    id: 'shiitake',
    name: 'Shiitake',
    displayName: 'Shiitake',
    color: '#8B4513',
    spawnDays: 15,
    bagDays: 30,
  },
};

// Workflow status values
export const WORKFLOW_STATUS = {
  LC: 'lc',
  SPAWNING: 'spawning',
  COLONIZING: 'colonizing',
  FRUITING: 'fruiting',
  HARVESTING: 'harvesting',
  ARCHIVED: 'archived',
};

// Bag status values
export const BAG_STATUS = {
  INOCULATED: 'Inokulert',
  COLONIZING: 'Inkubering',
  READY: 'Klar',
  FRUITING: 'I frukting',
  HARVESTED: 'Høstet',
  CONTAMINATED: 'Forkastet',
};

// Spawn types
export const SPAWN_TYPES = {
  GRAIN_GLASS: 'Grain spawn glass',
  GRAIN_BAG: 'Grain spawn bag',
};

// LC volumes
export const LC_VOLUMES = ['3ml', '5ml', '10ml'];

// Bag substrates
export const BAG_SUBSTRATES = {
  STRAW: 'Halm',
  SAWDUST: 'Sagflis',
  MASTERS_MIX: 'Masters Mix',
};

// Status colors for UI
export const STATUS_COLORS = {
  [BAG_STATUS.INOCULATED]: 'bg-slate-100',
  [BAG_STATUS.COLONIZING]: 'bg-yellow-100',
  [BAG_STATUS.READY]: 'bg-emerald-100',
  [BAG_STATUS.FRUITING]: 'bg-blue-100',
  [BAG_STATUS.HARVESTED]: 'bg-green-100',
  [BAG_STATUS.CONTAMINATED]: 'bg-red-100',
};

// Get strain by name (case-insensitive)
export const getStrainByName = (name) => {
  if (!name) return null;
  const normalized = name.toLowerCase().replace(/\s+/g, '_');
  return Object.values(STRAINS).find(
    (strain) => strain.id === normalized || strain.name.toLowerCase() === name.toLowerCase()
  );
};

// Get strain baseline days
export const getStrainBaseline = (strainName, type = 'spawn') => {
  const strain = getStrainByName(strainName);
  if (!strain) return type === 'spawn' ? 10 : 14; // Default values
  return type === 'spawn' ? strain.spawnDays : strain.bagDays;
};
