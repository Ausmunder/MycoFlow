"""
Database models for MycoFlow v1.0
Defines the structure of our database tables using SQLAlchemy ORM
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Text, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

class Batch(Base):
    """
    Main batch tracking table with full LC-Spawn-Bag structure
    """
    __tablename__ = "batches"
    
    id = Column(Integer, primary_key=True, index=True)
    batch_type = Column(String, nullable=False)  # 'LC', 'Spawn', 'Bag'
    strain_name = Column(String, nullable=False, index=True)

    # ===== LC SECTION =====
    lc_id = Column(Integer, ForeignKey('lc_cultures.id'), nullable=True)  # FK to LC culture
    lc_batch = Column(String, index=True)  # LC Kode (kept for backwards compatibility)
    lc_vol = Column(String)  # Volume: 3ml, 5ml, 10ml
    lc_dato_inok = Column(DateTime)
    
    # ===== SPAWN SECTION =====
    spawn_batch = Column(String, index=True)
    spawn_type = Column(String)  # Grain spawn glass, Grain spawn bag
    spawn_dato_inok = Column(DateTime)
    spawn_kg = Column(Float)
    spawn_dager_ink = Column(Integer)  # Calculated field
    spawn_forventet_ferdig = Column(DateTime)  # Expected spawn colonization complete date

    # ===== BAG SECTION - BASIS =====
    bag_batch = Column(String, index=True)
    bag_forventet_kolon = Column(DateTime)  # Expected colonization date
    bag_substrat_type = Column(String)  # Masters Mix, Masters Mix Shiitake, Halm, Sagflis+kli
    bag_kg_substrat = Column(Float)
    bag_antall_bager = Column(Integer)  # Number of fruiting bags produced
    bag_dato_inok = Column(DateTime)
    bag_dager_ink = Column(Integer)  # Calculated field
    bag_status = Column(String)  # Inokulert, Inkubering, Klar, I frukting, Høstet, Forkastet
    bag_temp = Column(Float)  # Incubation temperature (°C)

    # ===== BAG SECTION - FRUKTING =====
    bag_frukting_start = Column(DateTime)
    bag_temp_kammer = Column(Float)  # Temperature in chamber (°C)
    bag_lf_kammer = Column(Float)  # Humidity in chamber (%)
    
    # ===== BAG SECTION - HØST 1 =====
    bag_host1_start = Column(DateTime)
    bag_host1_slutt = Column(DateTime)
    bag_host1_total_kg = Column(Float)
    bag_host1_dager = Column(Integer)  # Calculated: days from frukting to harvest
    
    # ===== BAG SECTION - HØST 2 =====
    bag_host2_start = Column(DateTime)
    bag_host2_slutt = Column(DateTime)
    contaminated_units = Column(Integer)  # Number of contaminated units (DEPRECATED - use spawn_contaminated_units and bag_contaminated_units)
    spawn_contaminated_units = Column(Integer)  # Contaminated units during spawn phase
    bag_contaminated_units = Column(Integer)  # Contaminated units during bag/fruiting phase (DEPRECATED)
    inkubering_contaminated_units = Column(Integer)  # Contaminated units during colonization phase
    frukt1_contaminated_units = Column(Integer)  # Contaminated units during fruiting phase 1
    frukt2_contaminated_units = Column(Integer)  # Contaminated units during fruiting phase 2
    spawn_contamination_type = Column(String)  # e.g. 'Grønn mugg', 'Sort mugg', 'Cobweb', 'Wet spot'
    inkubering_contamination_type = Column(String)
    frukt1_contamination_type = Column(String)
    frukt2_contamination_type = Column(String)
    spawn_abortert = Column(Boolean, default=False)
    inkubering_abortert = Column(Boolean, default=False)
    frukt1_abortert = Column(Boolean, default=False)
    frukt2_abortert = Column(Boolean, default=False)
    bag_host2_total_kg = Column(Float)
    bag_host2_dager = Column(Integer)  # Calculated: days from H1 to H2
    bag_syklus_lengde = Column(Integer)  # Calculated: total cycle length

    # ===== BAG SECTION - BE% =====
    bag_be_percent = Column(Float)  # Calculated: (H1+H2)/substrat_kg * 100

    # ===== WORKFLOW STATUS =====
    workflow_status = Column(String, default="spawning")
    # Values: 'spawning', 'spawn_ready', 'colonizing', 'fruiting',
    #         'flush1_active', 'flush1_complete', 'flush2_active',
    #         'flush2_complete', 'complete', 'contaminated'

    # Spawn stage predictions
    spawn_expected_ready_date = Column(DateTime)
    spawn_actual_ready_date = Column(DateTime)

    # Colonization stage predictions
    colonization_expected_date = Column(DateTime)
    colonization_actual_date = Column(DateTime)

    # Fruiting stage
    fruiting_start_date = Column(DateTime)
    flush1_expected_date = Column(DateTime)
    flush1_actual_start_date = Column(DateTime)
    flush1_harvest_date = Column(DateTime)
    flush1_expected_kg = Column(Float)

    # Flush 2
    flush2_expected_date = Column(DateTime)
    flush2_actual_start_date = Column(DateTime)
    flush2_harvest_date = Column(DateTime)
    flush2_expected_kg = Column(Float)

    # Flush 3 (optional)
    flush3_expected_date = Column(DateTime)
    flush3_actual_start_date = Column(DateTime)
    flush3_harvest_date = Column(DateTime)
    flush3_harvest_kg = Column(Float)

    # ===== REFRIGERATION =====
    in_fridge = Column(Boolean, default=False)
    fridge_date = Column(DateTime, nullable=True)

    # ===== QR CODE / LABEL TRACKING =====
    qr_code = Column(String(100), unique=True, index=True)  # SOPP-{id}
    qr_data = Column(Text)  # JSON data encoded in QR
    label_printed = Column(Boolean, default=False)
    label_printed_at = Column(DateTime, nullable=True)
    label_print_count = Column(Integer, default=0)

    # ===== TRACEABILITY (lineage) =====
    # Which culture this batch was inoculated from (LC/MC/PD/SL) — backward trace to strain
    source_culture_id = Column(Integer, ForeignKey('cultures.id'), nullable=True)
    # Denormalized strain link for fast lookup / filtering
    strain_id = Column(Integer, ForeignKey('strains.id'), nullable=True)

    # ===== META =====
    archived = Column(Boolean, default=False)
    notes = Column(Text)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class BatchInfo(Base):
    """
    Extended batch information for spawn batches
    Tracks detailed metrics and refrigeration status
    """
    __tablename__ = "batch_info"
    
    id = Column(Integer, primary_key=True, index=True)
    spawn_batch = Column(String, unique=True, nullable=False, index=True)
    strain_name = Column(String, nullable=False)
    
    # Refrigeration tracking
    in_fridge = Column(Boolean, default=False)
    fridge_start_date = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    units = relationship("BatchUnit", back_populates="batch_info", cascade="all, delete-orphan")


class BatchUnit(Base):
    """
    Individual units within a spawn batch
    Tracks grain spawn glasses/bags with contamination status
    """
    __tablename__ = "batch_units"
    
    id = Column(Integer, primary_key=True, index=True)
    batch_info_id = Column(Integer, ForeignKey('batch_info.id'), nullable=False)
    
    # Unit details
    type = Column(String, default="Grain spawn glass")
    substrat = Column(String, default="Rug")
    kg = Column(Float, nullable=False)
    dato_inok = Column(DateTime)
    status = Column(String, default="Inkubering")
    used_in_bag = Column(String)
    
    # Contamination tracking (unit-level, not batch-level)
    contaminated = Column(Boolean, default=False)
    contamination_date = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    batch_info = relationship("BatchInfo", back_populates="units")


class Template(Base):
    """
    Reusable batch templates
    Store common configurations for quick batch creation
    """
    __tablename__ = "templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    strain_name = Column(String, nullable=False)

    # Template data stored as JSON structure
    units_config = Column(Text, nullable=False)  # JSON string

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class LCCulture(Base):
    """
    LC (Liquid Culture) tracking
    Stores information about liquid culture batches
    """
    __tablename__ = "lc_cultures"

    id = Column(Integer, primary_key=True, index=True)
    lc_code = Column(String(50), unique=True, nullable=False, index=True)
    strain_name = Column(String(50), nullable=False, index=True)
    source = Column(String(100))
    date_created = Column(DateTime)
    notes = Column(Text)
    active = Column(Boolean, default=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class StrainStatistics(Base):
    """
    Strain performance statistics
    Tracks historical performance data for strains and LC cultures
    """
    __tablename__ = "strain_statistics"

    id = Column(Integer, primary_key=True, index=True)
    strain_name = Column(String(50), nullable=False, index=True)
    lc_code = Column(String(50), index=True)

    # Colonization stats
    avg_colonization_days = Column(Integer)
    min_colonization_days = Column(Integer)
    max_colonization_days = Column(Integer)

    # Workflow stage timing
    avg_spawn_days = Column(Integer)
    avg_fruiting_days = Column(Integer)
    avg_flush1_days = Column(Integer)
    avg_flush2_yield_kg = Column(Float)
    avg_flushes_per_batch = Column(Float)

    # Yield stats
    avg_yield_kg = Column(Float)
    total_batches = Column(Integer, default=0)
    successful_batches = Column(Integer, default=0)
    contamination_rate = Column(Float)

    # Efficiency
    avg_be_percent = Column(Float)

    # Timestamps
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class SubstrateMix(Base):
    """
    Substrate mix recipes and configurations
    Stores substrate types with moisture content for BE% calculations
    """
    __tablename__ = "substrate_mixes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text)
    moisture_content = Column(Numeric(4, 3))  # e.g., 0.62 for 62%
    is_active = Column(Boolean, default=True)

    # Recipe configuration
    recipe_ingredients = Column(Text)  # JSON: [{"name": "Hardwood pellets", "grams": 1200}, ...]
    grams_per_bag = Column(Integer)  # Total dry weight in grams per bag (excluding water)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class Strain(Base):
    """
    Genetic strain register — the immutable root of the traceability chain.

    A strain is identified by its prefix = species_code + strain_number (e.g. "HE9514").
    Cultures (MC/LC/PD/SL) and batches reference a strain; the prefix is reused in all
    derived codes ("HE9514-LC-2614A", "HE9514-B01").
    """
    __tablename__ = "strains"

    id = Column(Integer, primary_key=True, index=True)
    species_code = Column(String(4), nullable=False)        # "HE", "PO", "LE", "GL"
    strain_number = Column(String(20), nullable=False)      # "9514"
    prefix = Column(String(30), unique=True, nullable=False, index=True)  # "HE9514"
    species_latin = Column(String(100))                     # "Hericium erinaceus"
    common_name = Column(String(100))                       # "Lions Mane"
    # Maps to existing Batch.strain_name categories (oyster/lions_mane/shiitake/reishi)
    # for backwards compatibility with stats and colonization predictors.
    strain_category = Column(String(50), index=True)
    notes = Column(Text)
    active = Column(Boolean, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Culture(Base):
    """
    Physical culture vessel — Mother Culture (MC), Liquid Culture (LC),
    Petri Dish (PD) or Slant (SL). Generalizes the old LCCulture table.

    Code = {strain.prefix}-{media_type}-{year_week}{unit}  e.g. "HE9514-LC-2614A".
    parent_culture_id records derivation (an LC made from an MC), giving full
    backward/forward lineage within the mycoflow domain.
    """
    __tablename__ = "cultures"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False, index=True)  # "HE9514-LC-2614A"
    strain_id = Column(Integer, ForeignKey('strains.id'), nullable=False, index=True)
    media_type = Column(String(4), nullable=False, index=True)          # MC / LC / PD / SL
    year_week = Column(String(4))                                       # "2614" (YYWW)
    unit = Column(String(4))                                            # "A"
    # Derivation: e.g. an LC derived from an MC. NULL for a root MC.
    parent_culture_id = Column(Integer, ForeignKey('cultures.id'), nullable=True, index=True)
    source = Column(String(100))           # for MC origin: spore print, tissue, vendor…
    quantity = Column(Float, nullable=True)        # amount on hand
    quantity_unit = Column(String(20), nullable=True)  # "ml", "stk"
    date_created = Column(DateTime)
    notes = Column(Text)
    active = Column(Boolean, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Self-referential lineage (within the same module → FK relationship is allowed)
    strain = relationship("Strain")
    parent = relationship("Culture", remote_side=[id], backref="children")
