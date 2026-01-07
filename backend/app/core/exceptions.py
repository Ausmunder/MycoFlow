"""
Custom exceptions for MycoFlow
Provides consistent error handling across the application
"""

from fastapi import HTTPException


class BatchNotFoundException(HTTPException):
    """Raised when a batch is not found"""

    def __init__(self, batch_id: int):
        super().__init__(
            status_code=404,
            detail=f"Batch with id {batch_id} not found"
        )


class LCCultureNotFoundException(HTTPException):
    """Raised when an LC culture is not found"""

    def __init__(self, lc_id: int):
        super().__init__(
            status_code=404,
            detail=f"LC Culture with id {lc_id} not found"
        )


class ValidationException(HTTPException):
    """Raised when validation fails"""

    def __init__(self, message: str):
        super().__init__(
            status_code=400,
            detail=message
        )


class DatabaseException(HTTPException):
    """Raised when database operations fail"""

    def __init__(self, message: str = "Database operation failed"):
        super().__init__(
            status_code=500,
            detail=message
        )
