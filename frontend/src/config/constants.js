export const STRAINS = {
  OYSTER: {
    id: 'oyster',
    name: 'Grå Øystersopp',
    displayName: 'Grå Øyster',
    spawnDays: 10,
    bagDays: 14,
  },
  LIONS_MANE: {
    id: 'lions_mane',
    name: 'Lions Mane',
    displayName: 'Lions Mane',
    spawnDays: 12,
    bagDays: 21,
  },
  SHIITAKE: {
    id: 'shiitake',
    name: 'Shiitake',
    displayName: 'Shiitake',
    spawnDays: 15,
    bagDays: 30,
  },
};

export const WORKFLOW_STATUS = {
  LC: 'lc',
  SPAWNING: 'spawning',
  COLONIZING: 'colonizing',
  FRUITING: 'fruiting',
  HARVESTING: 'harvesting',
  ARCHIVED: 'archived',
};

export const BAG_STATUS = {
  INOCULATED: 'Inokulert',
  COLONIZING: 'Inkubering',
  READY: 'Klar',
  FRUITING: 'I frukting',
  HARVESTED: 'Høstet',
  CONTAMINATED: 'Forkastet',
};

export const SPAWN_TYPES = {
  GRAIN_GLASS: 'Grain spawn glass',
  GRAIN_BAG: 'Grain spawn bag',
};

export const LC_VOLUMES = ['3ml', '5ml', '10ml'];

export const BAG_SUBSTRATES = {
  STRAW: 'Halm',
  SAWDUST: 'Sagflis',
  MASTERS_MIX: 'Masters Mix',
};

export const STATUS_COLORS = {
  [BAG_STATUS.INOCULATED]: 'text-zinc-600',
  [BAG_STATUS.COLONIZING]: 'text-amber-600',
  [BAG_STATUS.READY]: 'text-emerald-600',
  [BAG_STATUS.FRUITING]: 'text-blue-600',
  [BAG_STATUS.HARVESTED]: 'text-green-600',
  [BAG_STATUS.CONTAMINATED]: 'text-red-600',
};

export const getStrainByName = (name) => {
  if (!name) return null;
  const normalized = name.toLowerCase().replace(/\s+/g, '_');
  return Object.values(STRAINS).find(
    (strain) => strain.id === normalized || strain.name.toLowerCase() === name.toLowerCase()
  );
};

export const getStrainBaseline = (strainName, type = 'spawn') => {
  const strain = getStrainByName(strainName);
  if (!strain) return type === 'spawn' ? 10 : 14;
  return type === 'spawn' ? strain.spawnDays : strain.bagDays;
};
