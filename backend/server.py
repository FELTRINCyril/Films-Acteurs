from fastapi import FastAPI, APIRouter, File, UploadFile, HTTPException, Query
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime
import shutil
import re


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Create uploads directory
uploads_dir = ROOT_DIR / "uploads"
uploads_dir.mkdir(exist_ok=True)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()

# Mount static files for image serving
app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Define Models
class Actor(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nom: str
    age: Optional[int] = None
    nationalite: Optional[str] = None
    biographie: Optional[str] = None
    photo_profil: Optional[str] = None
    filmographie: List[str] = Field(default_factory=list)  # List of movie IDs
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ActorCreate(BaseModel):
    nom: str
    age: Optional[int] = None
    nationalite: Optional[str] = None
    biographie: Optional[str] = None
    filmographie: List[str] = Field(default_factory=list)

class Movie(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nom: str
    annee: Optional[int] = None
    genre: Optional[str] = None
    description: Optional[str] = None
    photo_couverture: Optional[str] = None
    acteurs: List[str] = Field(default_factory=list)  # List of actor IDs
    lien_externe: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class MovieCreate(BaseModel):
    nom: str
    annee: Optional[int] = None
    genre: Optional[str] = None
    description: Optional[str] = None
    acteurs: List[str] = Field(default_factory=list)
    lien_externe: Optional[str] = None

# Helper function to save uploaded file
async def save_upload_file(upload_file: UploadFile, destination: Path) -> str:
    try:
        with destination.open("wb") as buffer:
            shutil.copyfileobj(upload_file.file, buffer)
        return str(destination.name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not save file: {str(e)}")

# Actor endpoints
@api_router.post("/actors", response_model=Actor)
async def create_actor(actor_data: ActorCreate):
    actor_dict = actor_data.dict()
    actor = Actor(**actor_dict)
    await db.actors.insert_one(actor.dict())
    return actor

@api_router.post("/actors/{actor_id}/photo")
async def upload_actor_photo(actor_id: str, file: UploadFile = File(...)):
    # Validate file type
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Create unique filename
    file_extension = file.filename.split('.')[-1]
    filename = f"actor_{actor_id}_{uuid.uuid4().hex[:8]}.{file_extension}"
    file_path = uploads_dir / filename
    
    # Save file
    filename_saved = await save_upload_file(file, file_path)
    
    # Update actor record
    photo_url = f"/uploads/{filename_saved}"
    await db.actors.update_one(
        {"id": actor_id}, 
        {"$set": {"photo_profil": photo_url}}
    )
    
    return {"photo_url": photo_url}

@api_router.get("/actors", response_model=List[Actor])
async def get_actors(
    search: Optional[str] = Query(None, description="Search by name, nationality, or biography"),
    nom: Optional[str] = Query(None, description="Filter by name"),
    nationalite: Optional[str] = Query(None, description="Filter by nationality"),
    age_min: Optional[int] = Query(None, description="Minimum age"),
    age_max: Optional[int] = Query(None, description="Maximum age"),
    limit: int = Query(50, le=100)
):
    query = {}
    
    # Search across multiple fields
    if search:
        search_regex = {"$regex": search, "$options": "i"}
        query["$or"] = [
            {"nom": search_regex},
            {"nationalite": search_regex},
            {"biographie": search_regex}
        ]
    
    # Specific filters
    if nom:
        query["nom"] = {"$regex": nom, "$options": "i"}
    if nationalite:
        query["nationalite"] = {"$regex": nationalite, "$options": "i"}
    if age_min is not None or age_max is not None:
        age_query = {}
        if age_min is not None:
            age_query["$gte"] = age_min
        if age_max is not None:
            age_query["$lte"] = age_max
        query["age"] = age_query
    
    actors = await db.actors.find(query).limit(limit).to_list(limit)
    return [Actor(**actor) for actor in actors]

@api_router.get("/actors/{actor_id}", response_model=Actor)
async def get_actor(actor_id: str):
    actor = await db.actors.find_one({"id": actor_id})
    if not actor:
        raise HTTPException(status_code=404, detail="Actor not found")
    return Actor(**actor)

@api_router.put("/actors/{actor_id}", response_model=Actor)
async def update_actor(actor_id: str, actor_update: ActorCreate):
    # Check if actor exists
    existing = await db.actors.find_one({"id": actor_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Actor not found")
    
    # Update actor
    update_data = {k: v for k, v in actor_update.dict().items() if v is not None}
    await db.actors.update_one({"id": actor_id}, {"$set": update_data})
    
    # Return updated actor
    updated = await db.actors.find_one({"id": actor_id})
    return Actor(**updated)

@api_router.delete("/actors/{actor_id}")
async def delete_actor(actor_id: str):
    result = await db.actors.delete_one({"id": actor_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Actor not found")
    return {"message": "Actor deleted successfully"}

# Movie endpoints
@api_router.post("/movies", response_model=Movie)
async def create_movie(movie_data: MovieCreate):
    movie_dict = movie_data.dict()
    movie = Movie(**movie_dict)
    await db.movies.insert_one(movie.dict())
    return movie

@api_router.post("/movies/{movie_id}/photo")
async def upload_movie_photo(movie_id: str, file: UploadFile = File(...)):
    # Validate file type
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Create unique filename
    file_extension = file.filename.split('.')[-1]
    filename = f"movie_{movie_id}_{uuid.uuid4().hex[:8]}.{file_extension}"
    file_path = uploads_dir / filename
    
    # Save file
    filename_saved = await save_upload_file(file, file_path)
    
    # Update movie record
    photo_url = f"/uploads/{filename_saved}"
    await db.movies.update_one(
        {"id": movie_id}, 
        {"$set": {"photo_couverture": photo_url}}
    )
    
    return {"photo_url": photo_url}

@api_router.get("/movies", response_model=List[Movie])
async def get_movies(
    search: Optional[str] = Query(None, description="Search by name, genre, or description"),
    nom: Optional[str] = Query(None, description="Filter by name"),
    genre: Optional[str] = Query(None, description="Filter by genre"),
    annee: Optional[int] = Query(None, description="Filter by year"),
    limit: int = Query(50, le=100)
):
    query = {}
    
    # Search across multiple fields
    if search:
        search_regex = {"$regex": search, "$options": "i"}
        query["$or"] = [
            {"nom": search_regex},
            {"genre": search_regex},
            {"description": search_regex}
        ]
    
    # Specific filters
    if nom:
        query["nom"] = {"$regex": nom, "$options": "i"}
    if genre:
        query["genre"] = {"$regex": genre, "$options": "i"}
    if annee:
        query["annee"] = annee
    
    movies = await db.movies.find(query).limit(limit).to_list(limit)
    return [Movie(**movie) for movie in movies]

@api_router.get("/movies/{movie_id}", response_model=Movie)
async def get_movie(movie_id: str):
    movie = await db.movies.find_one({"id": movie_id})
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    return Movie(**movie)

@api_router.put("/movies/{movie_id}", response_model=Movie)
async def update_movie(movie_id: str, movie_update: MovieCreate):
    # Check if movie exists
    existing = await db.movies.find_one({"id": movie_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Movie not found")
    
    # Update movie
    update_data = {k: v for k, v in movie_update.dict().items() if v is not None}
    await db.movies.update_one({"id": movie_id}, {"$set": update_data})
    
    # Return updated movie
    updated = await db.movies.find_one({"id": movie_id})
    return Movie(**updated)

@api_router.delete("/movies/{movie_id}")
async def delete_movie(movie_id: str):
    result = await db.movies.delete_one({"id": movie_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Movie not found")
    return {"message": "Movie deleted successfully"}

# Utility endpoints
@api_router.get("/genres")
async def get_all_genres():
    """Get all unique genres from movies"""
    genres = await db.movies.distinct("genre")
    return {"genres": [g for g in genres if g]}

@api_router.get("/nationalities")
async def get_all_nationalities():
    """Get all unique nationalities from actors"""
    nationalities = await db.actors.distinct("nationalite")
    return {"nationalities": [n for n in nationalities if n]}

# Global search endpoint
@api_router.get("/search")
async def global_search(q: str = Query(..., description="Search query")):
    search_regex = {"$regex": q, "$options": "i"}
    
    # Search actors
    actor_query = {
        "$or": [
            {"nom": search_regex},
            {"nationalite": search_regex},
            {"biographie": search_regex}
        ]
    }
    actors = await db.actors.find(actor_query).limit(10).to_list(10)
    
    # Search movies
    movie_query = {
        "$or": [
            {"nom": search_regex},
            {"genre": search_regex},
            {"description": search_regex}
        ]
    }
    movies = await db.movies.find(movie_query).limit(10).to_list(10)
    
    return {
        "actors": [Actor(**actor) for actor in actors],
        "movies": [Movie(**movie) for movie in movies]
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()