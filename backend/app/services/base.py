"""
Base service with common database operations
Provides reusable patterns for CRUD operations
"""

from typing import TypeVar, Generic, Type, Optional, List
from sqlalchemy.orm import Session
from fastapi import HTTPException

from ..database import Base

ModelType = TypeVar("ModelType", bound=Base)


class BaseService(Generic[ModelType]):
    """
    Base service for common database operations

    Usage:
        class BatchService(BaseService[Batch]):
            pass
    """

    def __init__(self, model: Type[ModelType]):
        self.model = model

    def get_or_404(
        self,
        db: Session,
        id: int,
        error_msg: Optional[str] = None
    ) -> ModelType:
        """
        Get an object by ID or raise 404

        Args:
            db: Database session
            id: Object ID
            error_msg: Custom error message

        Returns:
            The found object

        Raises:
            HTTPException: If object not found
        """
        obj = db.query(self.model).filter(self.model.id == id).first()
        if not obj:
            msg = error_msg or f"{self.model.__name__} with id {id} not found"
            raise HTTPException(status_code=404, detail=msg)
        return obj

    def get_all(
        self,
        db: Session,
        skip: int = 0,
        limit: int = 100,
        **filters
    ) -> List[ModelType]:
        """
        Get all objects with optional filtering

        Args:
            db: Database session
            skip: Number of records to skip
            limit: Maximum number of records to return
            **filters: Field filters (e.g., strain_name="oyster")

        Returns:
            List of objects
        """
        query = db.query(self.model)

        # Apply filters
        for key, value in filters.items():
            if hasattr(self.model, key) and value is not None:
                query = query.filter(getattr(self.model, key) == value)

        return query.offset(skip).limit(limit).all()

    def create(self, db: Session, obj_data: dict) -> ModelType:
        """
        Create a new object

        Args:
            db: Database session
            obj_data: Object data as dictionary

        Returns:
            Created object
        """
        db_obj = self.model(**obj_data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(
        self,
        db: Session,
        id: int,
        obj_data: dict
    ) -> ModelType:
        """
        Update an existing object

        Args:
            db: Database session
            id: Object ID
            obj_data: Updated data as dictionary

        Returns:
            Updated object
        """
        db_obj = self.get_or_404(db, id)

        for key, value in obj_data.items():
            if hasattr(db_obj, key):
                setattr(db_obj, key, value)

        db.commit()
        db.refresh(db_obj)
        return db_obj

    def delete(self, db: Session, id: int) -> bool:
        """
        Delete an object

        Args:
            db: Database session
            id: Object ID

        Returns:
            True if deleted successfully
        """
        db_obj = self.get_or_404(db, id)
        db.delete(db_obj)
        db.commit()
        return True
