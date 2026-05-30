"""
Main FastAPI application for MycoFlow
Entry point for the backend API - refactored for maintainability
"""
from pathlib import Path
from dotenv import load_dotenv

# Load .env from the app directory (works with Docker volume mount and local dev)
load_dotenv(Path(__file__).parent / '.env', override=False)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import engine, Base
from .routers import batches, batch_info, batch_units, stats, lc_cultures, templates, qr_labels, workflow, substrate_mixes, auth, strains, cultures, trace

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="MycoFlow API",
    description="Professional mushroom cultivation tracking system for Skogbunn Mikromusheri",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://sopp.skogbunn.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    max_age=0,  # Don't cache CORS preflight responses
)


@app.get("/")
def read_root():
    """Health check endpoint"""
    return {
        "status": "OK",
        "version": "1.0.0",
        "features": [
            "Full LC-Spawn-Bag structure",
            "Harvest tracking (H1 + H2)",
            "Biological Efficiency calculation",
            "Refrigeration tracking",
            "Unit-level contamination",
            "Auto field calculations",
            "Workflow status tracking",
            "AI colonization predictions",
            "QR code labels"
        ]
    }


# Include routers
app.include_router(auth.router, tags=["Auth"])
app.include_router(batches.router, tags=["Batches"])
app.include_router(batch_info.router, tags=["Batch Info"])
app.include_router(batch_units.router, tags=["Batch Units"])
app.include_router(stats.router, tags=["Statistics"])
app.include_router(lc_cultures.router, tags=["LC Cultures"])
app.include_router(templates.router, tags=["Templates"])
app.include_router(qr_labels.router, tags=["QR & Labels"])
app.include_router(workflow.router, tags=["Workflow"])
app.include_router(substrate_mixes.router, tags=["Substrate Mixes"])
app.include_router(strains.router, tags=["Strains"])
app.include_router(cultures.router, tags=["Cultures"])
app.include_router(trace.router, tags=["Traceability"])
