"""
Main FastAPI application for Sopp Tracker v4.6
Entry point for the backend API - refactored for maintainability
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import engine, Base
from .routers import batches, batch_info, batch_units, stats, lc_cultures, templates, qr_labels

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="Sopp Tracker API",
    description="API for Skogbunn Mikromusheri LC-Spawn-Bag tracking system",
    version="4.6.1"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://192.168.1.251:3001",
        "http://192.168.1.251:8123"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    """Health check endpoint"""
    return {
        "status": "OK",
        "version": "4.6.1",
        "features": [
            "Full LC-Spawn-Bag structure",
            "Harvest tracking (H1 + H2)",
            "Biological Efficiency calculation",
            "Refrigeration tracking",
            "Unit-level contamination",
            "Auto field calculations"
        ]
    }


# Include routers
app.include_router(batches.router, tags=["Batches"])
app.include_router(batch_info.router, tags=["Batch Info"])
app.include_router(batch_units.router, tags=["Batch Units"])
app.include_router(stats.router, tags=["Statistics"])
app.include_router(lc_cultures.router, tags=["LC Cultures"])
app.include_router(templates.router, tags=["Templates"])
app.include_router(qr_labels.router, tags=["QR & Labels"])
