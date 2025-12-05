"""
Pydantic schemas for request/response validation v4.6 - FULL STRUCTURE
Defines the structure of data sent to and from the API
"""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# ===== BATCH SCHEMAS =====

class BatchBase(BaseModel):
    """Base schema for batch data with full structure"""
    batch_type: str
    strain_name: str
    
    # LC Section
    lc_batch: Optional[str] = None
    lc_vol: Optional[str] = None  # 3ml, 5ml, 10ml
    lc_dato_inok: Optional[datetime] = None
    
    # Spawn Section
    spawn_batch: Optional[str] = None
    spawn_type: Optional[str] = None  # Grain spawn glass, Grain spawn bag
    spawn_dato_inok: Optional[datetime] = None
    spawn_kg: Optional[float] = None
    spawn_dager_ink: Optional[int] = None  # Calculated
    spawn_forventet_ferdig: Optional[datetime] = None  # Expected spawn colonization complete

    # Bag Section - Basis
    bag_batch: Optional[str] = None
    bag_forventet_kolon: Optional[datetime] = None
    bag_substrat_type: Optional[str] = None  # Masters Mix, Masters Mix Shiitake, Halm, Sagflis+kli
    bag_kg_substrat: Optional[float] = None
    bag_dato_inok: Optional[datetime] = None
    bag_dager_ink: Optional[int] = None  # Calculated
    bag_status: Optional[str] = None  # Inokulert, Inkubering, Klar, I frukting, Høstet, Forkastet
    
    # Bag Section - Frukting
    bag_frukting_start: Optional[datetime] = None
    bag_temp_kammer: Optional[float] = None
    bag_lf_kammer: Optional[float] = None
    
    # Bag Section - Høst 1
    bag_host1_start: Optional[datetime] = None
    bag_host1_slutt: Optional[datetime] = None
    bag_host1_total_kg: Optional[float] = None
    bag_host1_dager: Optional[int] = None  # Calculated
    
    # Bag Section - Høst 2
    bag_host2_start: Optional[datetime] = None
    bag_host2_slutt: Optional[datetime] = None
    bag_host2_total_kg: Optional[float] = None
    bag_host2_dager: Optional[int] = None  # Calculated
    bag_syklus_lengde: Optional[int] = None  # Calculated
    
    # Bag Section - BE%
    bag_be_percent: Optional[float] = None  # Calculated

    # Workflow Status
    workflow_status: Optional[str] = "Spawn"  # Spawn, Kolonisering, Frukting, Flush

    # Refrigeration
    in_fridge: bool = False
    fridge_date: Optional[datetime] = None

    # Meta
    archived: bool = False
    notes: Optional[str] = None

class BatchCreate(BatchBase):
    """Schema for creating a new batch"""
    pass

class BatchUpdate(BaseModel):
    """Schema for updating a batch - all fields optional"""
    batch_type: Optional[str] = None
    strain_name: Optional[str] = None
    
    # LC Section
    lc_batch: Optional[str] = None
    lc_vol: Optional[str] = None
    lc_dato_inok: Optional[datetime] = None
    
    # Spawn Section
    spawn_batch: Optional[str] = None
    spawn_type: Optional[str] = None
    spawn_dato_inok: Optional[datetime] = None
    spawn_kg: Optional[float] = None
    spawn_dager_ink: Optional[int] = None
    
    # Bag Section - Basis
    bag_batch: Optional[str] = None
    bag_forventet_kolon: Optional[datetime] = None
    bag_substrat_type: Optional[str] = None
    bag_kg_substrat: Optional[float] = None
    bag_dato_inok: Optional[datetime] = None
    bag_dager_ink: Optional[int] = None
    bag_status: Optional[str] = None
    
    # Bag Section - Frukting
    bag_frukting_start: Optional[datetime] = None
    bag_temp_kammer: Optional[float] = None
    bag_lf_kammer: Optional[float] = None
    
    # Bag Section - Høst 1
    bag_host1_start: Optional[datetime] = None
    bag_host1_slutt: Optional[datetime] = None
    bag_host1_total_kg: Optional[float] = None
    bag_host1_dager: Optional[int] = None
    
    # Bag Section - Høst 2
    bag_host2_start: Optional[datetime] = None
    bag_host2_slutt: Optional[datetime] = None
    bag_host2_total_kg: Optional[float] = None
    bag_host2_dager: Optional[int] = None
    bag_syklus_lengde: Optional[int] = None
    
    # Bag Section - BE%
    bag_be_percent: Optional[float] = None

    # Workflow Status
    workflow_status: Optional[str] = None

    # Refrigeration
    in_fridge: Optional[bool] = None
    fridge_date: Optional[datetime] = None

    # Meta
    archived: Optional[bool] = None
    notes: Optional[str] = None

class BatchResponse(BatchBase):
    """Schema for batch responses"""
    id: int
    qr_code: Optional[str] = None
    qr_data: Optional[str] = None
    label_printed: Optional[bool] = None
    label_printed_at: Optional[datetime] = None
    label_print_count: Optional[int] = None
    unit_count: Optional[int] = 0
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# ===== BATCH INFO SCHEMAS =====

class BatchInfoBase(BaseModel):
    """Base schema for batch info"""
    spawn_batch: str
    strain_name: str
    in_fridge: bool = False
    fridge_start_date: Optional[datetime] = None

class BatchInfoCreate(BatchInfoBase):
    """Schema for creating batch info"""
    pass

class BatchInfoUpdate(BaseModel):
    """Schema for updating batch info"""
    strain_name: Optional[str] = None
    in_fridge: Optional[bool] = None
    fridge_start_date: Optional[datetime] = None

class BatchInfoResponse(BatchInfoBase):
    """Schema for batch info responses with calculated fields"""
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    fridge_days: Optional[int] = None  # Calculated: days in fridge
    active_days: Optional[int] = None  # Calculated: days minus fridge time
    
    class Config:
        from_attributes = True

# ===== BATCH UNIT SCHEMAS =====

class BatchUnitBase(BaseModel):
    """Base schema for batch units"""
    type: str = "Grain spawn glass"
    substrat: str = "Rug"
    kg: float
    dato_inok: Optional[datetime] = None
    status: str = "Inkubering"
    used_in_bag: Optional[str] = None
    contaminated: bool = False
    contamination_date: Optional[datetime] = None

class BatchUnitCreate(BatchUnitBase):
    """Schema for creating a single batch unit"""
    pass

class BatchUnitBulkCreate(BaseModel):
    """Schema for creating multiple identical batch units"""
    count: int  # Number of units to create
    type: str = "Grain spawn glass"
    substrat: str = "Rug"
    kg: float
    dato_inok: Optional[datetime] = None
    status: str = "Inkubering"

class BatchUnitUpdate(BaseModel):
    """Schema for updating a batch unit - all fields optional"""
    type: Optional[str] = None
    substrat: Optional[str] = None
    kg: Optional[float] = None
    dato_inok: Optional[datetime] = None
    status: Optional[str] = None
    used_in_bag: Optional[str] = None
    contaminated: Optional[bool] = None
    contamination_date: Optional[datetime] = None

class BatchUnitResponse(BatchUnitBase):
    """Schema for batch unit responses"""
    id: int
    batch_info_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# ===== TEMPLATE SCHEMAS =====

class TemplateBase(BaseModel):
    """Base schema for templates"""
    name: str
    strain_name: str
    units_config: str  # JSON string

class TemplateCreate(TemplateBase):
    """Schema for creating a template"""
    pass

class TemplateResponse(TemplateBase):
    """Schema for template responses"""
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# ===== LC CULTURE SCHEMAS =====

class LCCultureBase(BaseModel):
    """Base schema for LC Culture"""
    lc_code: str
    strain_name: str
    source: Optional[str] = None
    date_created: Optional[datetime] = None
    notes: Optional[str] = None
    active: bool = True

class LCCultureCreate(LCCultureBase):
    """Schema for creating LC Culture"""
    pass

class LCCultureUpdate(BaseModel):
    """Schema for updating LC Culture - all fields optional"""
    lc_code: Optional[str] = None
    strain_name: Optional[str] = None
    source: Optional[str] = None
    date_created: Optional[datetime] = None
    notes: Optional[str] = None
    active: Optional[bool] = None

class LCCultureResponse(LCCultureBase):
    """Schema for LC Culture responses"""
    id: int
    created_at: datetime
    batch_count: Optional[int] = 0  # Number of batches using this LC

    class Config:
        from_attributes = True

# ===== STRAIN STATISTICS SCHEMAS =====

class StrainStatisticsResponse(BaseModel):
    """Schema for strain statistics responses"""
    strain_name: str
    lc_code: Optional[str] = None
    avg_colonization_days: Optional[int] = None
    min_colonization_days: Optional[int] = None
    max_colonization_days: Optional[int] = None
    avg_yield_kg: Optional[float] = None
    total_batches: int = 0
    successful_batches: int = 0
    contamination_rate: Optional[float] = None
    avg_be_percent: Optional[float] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# ===== STATISTICS SCHEMAS =====

class StatsResponse(BaseModel):
    """Schema for statistics responses"""
    total_batches: int
    active_batches: int
    archived_batches: int
    contamination_rate: float
    avg_be_percent: Optional[float] = None
    total_harvest_kg: Optional[float] = None  # New: total harvest across all batches
    strains: List[str]

class NextColonizationResponse(BaseModel):
    """Schema for next colonization prediction"""
    spawn_batch: str
    strain_name: str
    days_remaining: int
    expected_date: datetime
    unit_count: int
    progress_percent: float
