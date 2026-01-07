"""
Pydantic schemas for API validation and serialization
These define the shape of data going in/out of API
"""
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional
from enum import Enum

# Enums matching database
class StrainType(str, Enum):
    OYSTER = "oyster"
    LIONSMANE = "lionsmane"
    SHIITAKE = "shiitake"

class BagStatus(str, Enum):
    INOKULERT = "Inokulert"
    INKUBERING = "Inkubering"
    KLAR = "Klar"
    I_FRUKTING = "I frukting"
    HOSTET = "Hostet"
    FORKASTET = "Forkastet"

class KontamType(str, Enum):
    INGEN = "Ingen"
    GRONN_MUGG = "Grønn mugg"
    BAKTERIE = "Bakterie"
    COBWEB = "Cobweb"
    ANNET = "Annet"


# Base schemas
class BatchBase(BaseModel):
    """Base schema for Batch with all fields"""
    strain: StrainType
    
    # LC
    lc_kode: Optional[str] = None
    lc_vol: Optional[str] = None
    
    # Spawn
    spawn_type: Optional[str] = None
    spawn_batch: Optional[str] = None
    spawn_dato_inok: Optional[datetime] = None
    spawn_kg: Optional[float] = None
    spawn_dager_ink: Optional[int] = None
    
    # Bag
    bag_forventet_kolon: Optional[datetime] = None
    bag_substrat_type: Optional[str] = None
    bag_kg_substrat: Optional[float] = None
    bag_dato_inok: Optional[datetime] = None
    bag_dager_ink: Optional[int] = None
    bag_status: BagStatus = BagStatus.INOKULERT
    bag_kontam: KontamType = KontamType.INGEN
    bag_frukting_start: Optional[datetime] = None
    bag_temp_kammer: Optional[float] = None
    bag_lf_kammer: Optional[float] = None
    
    # Harvest 1
    bag_host1_start: Optional[datetime] = None
    bag_host1_slutt: Optional[datetime] = None
    bag_host1_total_kg: Optional[float] = 0.0
    
    # Harvest 2
    bag_host2_start: Optional[datetime] = None
    bag_host2_slutt: Optional[datetime] = None
    bag_syklus_lengde: Optional[int] = None
    bag_host2_total_kg: Optional[float] = 0.0
    
    # Meta
    notater: Optional[str] = ""
    archived: bool = False


class BatchCreate(BatchBase):
    """Schema for creating a new batch"""
    pass


class BatchUpdate(BaseModel):
    """Schema for updating a batch - all fields optional"""
    lc_kode: Optional[str] = None
    lc_vol: Optional[str] = None
    spawn_type: Optional[str] = None
    spawn_batch: Optional[str] = None
    spawn_dato_inok: Optional[datetime] = None
    spawn_kg: Optional[float] = None
    spawn_dager_ink: Optional[int] = None
    bag_forventet_kolon: Optional[datetime] = None
    bag_substrat_type: Optional[str] = None
    bag_kg_substrat: Optional[float] = None
    bag_dato_inok: Optional[datetime] = None
    bag_dager_ink: Optional[int] = None
    bag_status: Optional[BagStatus] = None
    bag_kontam: Optional[KontamType] = None
    bag_frukting_start: Optional[datetime] = None
    bag_temp_kammer: Optional[float] = None
    bag_lf_kammer: Optional[float] = None
    bag_host1_start: Optional[datetime] = None
    bag_host1_slutt: Optional[datetime] = None
    bag_host1_total_kg: Optional[float] = None
    bag_host2_start: Optional[datetime] = None
    bag_host2_slutt: Optional[datetime] = None
    bag_syklus_lengde: Optional[int] = None
    bag_host2_total_kg: Optional[float] = None
    notater: Optional[str] = None
    archived: Optional[bool] = None


class BatchResponse(BatchBase):
    """Schema for batch response from API"""
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


# BatchInfo schemas
class BatchInfoBase(BaseModel):
    batch_code: str
    strain_name: str
    lc_source: Optional[str] = None
    generation: Optional[int] = None
    notes: Optional[str] = None


class BatchInfoCreate(BatchInfoBase):
    pass


class BatchInfoResponse(BatchInfoBase):
    id: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# Template schemas
class TemplateBase(BaseModel):
    name: str
    strain: StrainType
    bag_temp_kammer: Optional[float] = None
    bag_lf_kammer: Optional[float] = None
    bag_substrat_type: Optional[str] = None
    spawn_type: Optional[str] = None


class TemplateCreate(TemplateBase):
    pass


class TemplateResponse(TemplateBase):
    id: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# Sensor schemas
class SensorReadingCreate(BaseModel):
    sensor_type: str = Field(..., pattern="^(temperature|humidity)$")
    location: str
    value: float
    unit: Optional[str] = None


class SensorReadingResponse(SensorReadingCreate):
    id: int
    timestamp: datetime
    
    model_config = ConfigDict(from_attributes=True)


# Statistics schemas
class StatsResponse(BaseModel):
    """Overall statistics"""
    total_batches: int
    active_batches: int
    contaminated: int
    harvested: int
    total_harvest_kg: float
    avg_be_percent: float
    contamination_rate: float
    avg_colonization_days: float
    avg_cycle_length: float


class StrainStats(BaseModel):
    """Statistics per strain"""
    strain: StrainType
    count: int
    avg_be_percent: float
    total_harvest_kg: float
    contamination_rate: float
