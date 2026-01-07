"""
SQLAlchemy models for Sopp Tracker
Maps to database tables
"""
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base
import enum

class StrainType(str, enum.Enum):
    """Enum for mushroom strains"""
    OYSTER = "oyster"
    LIONSMANE = "lionsmane"
    SHIITAKE = "shiitake"

class BagStatus(str, enum.Enum):
    """Enum for bag status"""
    INOKULERT = "Inokulert"
    INKUBERING = "Inkubering"
    KLAR = "Klar"
    I_FRUKTING = "I frukting"
    HOSTET = "Hostet"
    FORKASTET = "Forkastet"

class KontamType(str, enum.Enum):
    """Enum for contamination types"""
    INGEN = "Ingen"
    GRONN_MUGG = "Grønn mugg"
    BAKTERIE = "Bakterie"
    COBWEB = "Cobweb"
    ANNET = "Annet"


class Batch(Base):
    """
    Main table for LC/Spawn/Bag tracking
    One row = one production batch from LC to harvest
    """
    __tablename__ = "batches"

    id = Column(Integer, primary_key=True, index=True)
    strain = Column(Enum(StrainType), nullable=False, index=True)
    
    # LC Section
    lc_kode = Column(String, index=True)
    lc_vol = Column(String)
    
    # Spawn Section
    spawn_type = Column(String)
    spawn_batch = Column(String, index=True)
    spawn_dato_inok = Column(DateTime)
    spawn_kg = Column(Float)
    spawn_dager_ink = Column(Integer)
    
    # Bag Section
    bag_forventet_kolon = Column(DateTime)
    bag_substrat_type = Column(String)
    bag_kg_substrat = Column(Float)
    bag_dato_inok = Column(DateTime, index=True)
    bag_dager_ink = Column(Integer)
    bag_status = Column(Enum(BagStatus), default=BagStatus.INOKULERT, index=True)
    bag_kontam = Column(Enum(KontamType), default=KontamType.INGEN)
    bag_frukting_start = Column(DateTime)
    bag_temp_kammer = Column(Float)
    bag_lf_kammer = Column(Float)
    
    # Harvest 1
    bag_host1_start = Column(DateTime)
    bag_host1_slutt = Column(DateTime)
    bag_host1_total_kg = Column(Float, default=0.0)
    
    # Harvest 2
    bag_host2_start = Column(DateTime)
    bag_host2_slutt = Column(DateTime)
    bag_syklus_lengde = Column(Integer)
    bag_host2_total_kg = Column(Float, default=0.0)
    
    # Meta
    notater = Column(String)
    archived = Column(Boolean, default=False, index=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    batch_info_id = Column(Integer, ForeignKey('batch_info.id'), nullable=True)
    batch_info = relationship("BatchInfo", back_populates="batches")


class BatchInfo(Base):
    """
    Metadata about spawn batches
    Referenced by spawn_batch field in Batch table
    """
    __tablename__ = "batch_info"
    
    id = Column(Integer, primary_key=True, index=True)
    batch_code = Column(String, unique=True, index=True, nullable=False)
    strain_name = Column(String, nullable=False)
    lc_source = Column(String)
    generation = Column(Integer)
    notes = Column(String)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    batches = relationship("Batch", back_populates="batch_info")


class Template(Base):
    """
    Templates for quick batch creation
    Stores default values per strain
    """
    __tablename__ = "templates"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    strain = Column(Enum(StrainType), nullable=False)
    
    # Default values
    bag_temp_kammer = Column(Float)
    bag_lf_kammer = Column(Float)
    bag_substrat_type = Column(String)
    spawn_type = Column(String)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class SensorReading(Base):
    """
    Temperature and humidity readings from Home Assistant
    """
    __tablename__ = "sensor_readings"
    
    id = Column(Integer, primary_key=True, index=True)
    sensor_type = Column(String, nullable=False)  # 'temperature' or 'humidity'
    location = Column(String, nullable=False)  # 'fruktekammer', 'inkubasjonsrom', etc.
    value = Column(Float, nullable=False)
    unit = Column(String)  # '°C' or '%'
    
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)
