"""
Application constants for MycoFlow
Centralized constants for strains, statuses, and baseline data
"""

# Strain baseline data (days for spawn and bag colonization)
STRAIN_BASELINES = {
    'oyster': {
        'spawn_days': 10,
        'bag_days': 14,
        'display_name': 'Grå Øystersopp'
    },
    'lions_mane': {
        'spawn_days': 12,
        'bag_days': 21,
        'display_name': 'Lions Mane'
    },
    'shiitake': {
        'spawn_days': 15,
        'bag_days': 30,
        'display_name': 'Shiitake'
    }
}

# Workflow status values
WORKFLOW_STATUSES = ['lc', 'spawning', 'colonizing', 'fruiting', 'harvesting', 'archived']

# Bag status values
BAG_STATUSES = ['Inokulert', 'Inkubering', 'Klar', 'I frukting', 'Høstet', 'Forkastet']

# Spawn types
SPAWN_TYPES = ['Grain spawn glass', 'Grain spawn bag']

# LC volumes
LC_VOLUMES = ['3ml', '5ml', '10ml']

# Bag substrates
BAG_SUBSTRATES = ['Halm', 'Sagflis', 'Masters Mix']


def get_strain_baseline(strain_name: str, baseline_type: str = 'spawn') -> int:
    """
    Get baseline colonization days for a strain

    Args:
        strain_name: Name of the strain
        baseline_type: 'spawn' or 'bag'

    Returns:
        Number of baseline days, or default if strain not found
    """
    normalized = strain_name.lower().replace(' ', '_')

    if normalized in STRAIN_BASELINES:
        key = f'{baseline_type}_days'
        return STRAIN_BASELINES[normalized].get(key, 10 if baseline_type == 'spawn' else 14)

    # Default values if strain not found
    return 10 if baseline_type == 'spawn' else 14
