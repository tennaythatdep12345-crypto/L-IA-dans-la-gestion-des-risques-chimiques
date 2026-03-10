"""
Global data cache manager for chemical risk analyzer.
Loads CSV data once at startup and provides fast indexed access.

This module maintains in-memory caches of:
- Substances (indexed by CAS and normalized name)
- Incompatibilities (indexed by substance pair combinations)
- Dangerous reactions (indexed for O(1) lookup)
"""

import logging
from utils.csv_loader import load_substances as _load_substances_raw, load_incompatibilities as _load_incompatibilities_raw

logger = logging.getLogger(__name__)

# Global cache objects
_SUBSTANCES_CACHE = None
_INCOMPATIBILITIES_CACHE = None
_DANGEROUS_REACTIONS_CACHE = None
_SUBSTANCE_NAME_INDEX = None  # Fast lookup by normalized name
_INCOMPATIBILITY_PAIRS_INDEX = None  # Fast lookup by substance pair


def initialize_cache():
    """
    Initialize all data caches at Flask startup.
    This should be called once when the app starts.
    
    Returns:
        dict: Status information about cache initialization
    """
    global _SUBSTANCES_CACHE, _INCOMPATIBILITIES_CACHE, _SUBSTANCE_NAME_INDEX, _INCOMPATIBILITY_PAIRS_INDEX
    
    import time
    start_time = time.time()
    
    try:
        logger.info("[CACHE] Initializing data caches...")
        
        # Load substances and create indexes
        logger.info("[CACHE] Loading substances data...")
        _SUBSTANCES_CACHE = _load_substances_raw()
        _build_substance_name_index()
        logger.info(f"[CACHE] Loaded {len(_SUBSTANCES_CACHE)} substances")
        
        # Load incompatibilities and create indexes
        logger.info("[CACHE] Loading incompatibilities data...")
        _INCOMPATIBILITIES_CACHE = _load_incompatibilities_raw()
        _build_incompatibility_pairs_index()
        logger.info(f"[CACHE] Loaded {len(_INCOMPATIBILITIES_CACHE)} incompatibility records")
        
        elapsed = time.time() - start_time
        logger.info(f"[CACHE] ✓ Cache initialization completed in {elapsed:.2f}s")
        
        return {
            'success': True,
            'substances_count': len(_SUBSTANCES_CACHE),
            'incompatibilities_count': len(_INCOMPATIBILITIES_CACHE),
            'initialization_time_ms': int(elapsed * 1000)
        }
    
    except Exception as e:
        logger.error(f"[CACHE] ✗ Failed to initialize cache: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            'success': False,
            'error': str(e)
        }


def _build_substance_name_index():
    """Build a reverse index: normalized_name -> CAS number for O(1) lookups"""
    global _SUBSTANCE_NAME_INDEX
    _SUBSTANCE_NAME_INDEX = {}
    
    if not _SUBSTANCES_CACHE:
        return
    
    for cas, data in _SUBSTANCES_CACHE.items():
        normalized_name = data.get('nom_normalise', '').lower().strip()
        if normalized_name:
            _SUBSTANCE_NAME_INDEX[normalized_name] = cas


def _build_incompatibility_pairs_index():
    """
    Build a fast lookup index for incompatibilities.
    Index structure: {frozenset([name1, name2]): [incompatibility_records]}
    """
    global _INCOMPATIBILITY_PAIRS_INDEX
    _INCOMPATIBILITY_PAIRS_INDEX = {}
    
    if not _INCOMPATIBILITIES_CACHE:
        return
    
    for incomp in _INCOMPATIBILITIES_CACHE:
        sub1 = incomp.get('substance1', '').lower().strip()
        sub2 = incomp.get('substance2', '').lower().strip()
        
        if sub1 and sub2:
            # Use frozenset for unordered pair matching (A+B == B+A)
            pair_key = frozenset([sub1, sub2])
            
            if pair_key not in _INCOMPATIBILITY_PAIRS_INDEX:
                _INCOMPATIBILITY_PAIRS_INDEX[pair_key] = []
            
            _INCOMPATIBILITY_PAIRS_INDEX[pair_key].append(incomp)


def get_substances():
    """Get all substances from cache. Returns dict indexed by CAS."""
    if _SUBSTANCES_CACHE is None:
        raise RuntimeError("Cache not initialized. Call initialize_cache() first.")
    return _SUBSTANCES_CACHE


def get_incompatibilities():
    """Get all incompatibilities from cache. Returns list."""
    if _INCOMPATIBILITIES_CACHE is None:
        raise RuntimeError("Cache not initialized. Call initialize_cache() first.")
    return _INCOMPATIBILITIES_CACHE


def find_substance_by_name(normalized_name):
    """
    Fast O(1) lookup of substance by normalized name.
    
    Args:
        normalized_name (str): Normalized chemical name (lowercase, trimmed)
    
    Returns:
        dict or None: Substance data if found, None otherwise
    """
    if _SUBSTANCE_NAME_INDEX is None:
        raise RuntimeError("Substance name index not initialized.")
    
    search_key = normalized_name.lower().strip()
    cas = _SUBSTANCE_NAME_INDEX.get(search_key)
    
    if cas and _SUBSTANCES_CACHE:
        return _SUBSTANCES_CACHE[cas]
    
    return None


def find_incompatibilities_for_pair(substance1_name, substance2_name):
    """
    Fast O(1) lookup of incompatibilities between two substances.
    
    Args:
        substance1_name (str): First substance normalized name
        substance2_name (str): Second substance normalized name
    
    Returns:
        list: List of incompatibility records for this pair (empty if none found)
    """
    if _INCOMPATIBILITY_PAIRS_INDEX is None:
        return []
    
    sub1 = substance1_name.lower().strip()
    sub2 = substance2_name.lower().strip()
    pair_key = frozenset([sub1, sub2])
    
    return _INCOMPATIBILITY_PAIRS_INDEX.get(pair_key, [])


def get_cache_stats():
    """Return statistics about the cache."""
    return {
        'substances_cached': len(_SUBSTANCES_CACHE) if _SUBSTANCES_CACHE else 0,
        'incompatibilities_cached': len(_INCOMPATIBILITIES_CACHE) if _INCOMPATIBILITIES_CACHE else 0,
        'substance_names_indexed': len(_SUBSTANCE_NAME_INDEX) if _SUBSTANCE_NAME_INDEX else 0,
        'incompatibility_pairs_indexed': len(_INCOMPATIBILITY_PAIRS_INDEX) if _INCOMPATIBILITY_PAIRS_INDEX else 0
    }
