from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from backend.api.v1.api import api_router
from backend.core.config import settings
from backend.services.notification import NotificationService

# Initialize Scheduler
scheduler = AsyncIOScheduler()
notification_service = NotificationService()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    # Schedule deadline check daily at 09:00
    scheduler.add_job(notification_service.check_deadlines, 'cron', hour=9, minute=0)
    # For testing: run every minute? No.
    scheduler.start()
    print("Scheduler started!")
    yield
    # Shutdown
    scheduler.shutdown()
    print("Scheduler shut down!")

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
    root_path="/api"
)

# Set CORS enabled origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def read_root():
    return {"message": "Hello World from Smart Doc Tracker Backend!"}

@app.get("/health")
def health_check():
    return {"status": "ok"}
