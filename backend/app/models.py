"""
Database models for Sopp Tracker v4.6 - FULL STRUCTURE
Defines the structure of our database tables using SQLAlchemy ORM
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Text
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
    bag_dato_inok = Column(DateTime)
    bag_dager_ink = Column(Integer)  # Calculated field
    bag_status = Column(String)  # Inokulert, Inkubering, Klar, I frukting, Høstet, Forkastet
    
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
    bag_host2_total_kg = Column(Float)
    bag_host2_dager = Column(Integer)  # Calculated: days from H1 to H2
    bag_syklus_lengde = Column(Integer)  # Calculated: total cycle length
    
    # ===== BAG SECTION - BE% =====
    bag_be_percent = Column(Float)  # Calculated: (H1+H2)/substrat_kg * 100

    # ===== WORKFLOW STATUS =====
    workflow_status = Column(String, default="Spawn")  # Spawn, Kolonisering, Frukting, Flush

    # ===== REFRIGERATION =====
    in_fridge = Column(Boolean, default=False)
    fridge_date = Column(DateTime, nullable=True)

    # ===== QR CODE / LABEL TRACKING =====
    qr_code = Column(String(100), unique=True, index=True)  # SOPP-{id}
    qr_data = Column(Text)  # JSON data encoded in QR
    label_printed = Column(Boolean, default=False)
    label_printed_at = Column(DateTime, nullable=True)
    label_print_count = Column(Integer, default=0)

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

    # Yield stats
    avg_yield_kg = Column(Float)
    total_batches = Column(Integer, default=0)
    successful_batches = Column(Integer, default=0)
    contamination_rate = Column(Float)

    # Efficiency
    avg_be_percent = Column(Float)

    # Timestamps
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
