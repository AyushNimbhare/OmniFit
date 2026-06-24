import os
from dotenv import load_dotenv
load_dotenv()  # Load environment variables from .env

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.db.database import init_db
from app.api import auth, workouts, nutrition, metrics, coach

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize the database and seed default exercises
    init_db()
    yield

app = FastAPI(
    title="OmniFit API",
    description="Backend API for the OmniFit AI-powered fitness tracking platform.",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS so the mobile and web clients can access the endpoints
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root check or frontend serving
@app.get("/")
def read_root():
    dist_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../gym-ai-mobile/dist"))
    index_path = os.path.join(dist_dir, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {
        "status": "online",
        "message": "OmniFit API is online. Frontend client not built.",
        "version": "1.0.0"
    }

# Register API Routers
app.include_router(auth.router)
app.include_router(workouts.router)
app.include_router(nutrition.router)
app.include_router(metrics.router)
app.include_router(coach.router)

# Mount static files to serve the frontend client directly
dist_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../gym-ai-mobile/dist"))
if os.path.exists(dist_dir):
    # Mount assets static directories
    app.mount("/_expo", StaticFiles(directory=os.path.join(dist_dir, "_expo")), name="expo_static")
    
    @app.get("/{rest_of_path:path}")
    def serve_frontend(rest_of_path: str):
        if rest_of_path.startswith("api/"):
            return None
        
        # Serve specific files if they exist (e.g. favicon.ico)
        file_path = os.path.join(dist_dir, rest_of_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
            
        # Default fallback for react single page app routing
        return FileResponse(os.path.join(dist_dir, "index.html"))
