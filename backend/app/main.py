import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import Base, engine
from app.responses import success_response
from app.routers import (
    auth,
    branches,
    checkins,
    dashboard,
    exercises,
    goals,
    membership_plans,
    memberships,
    notifications,
    payments,
    training_programs,
    users,
)
from app.seed import seed_database


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    Base.metadata.create_all(bind=engine)
    # Seed demo data in local dev (ENVIRONMENT=development) or when explicitly
    # opted in via SEED_DEMO_DATA. Staging (non-dev, non-production) no longer
    # gets default credentials unless the operator sets SEED_DEMO_DATA=true.
    if (not settings.is_production) and (settings.ENVIRONMENT == "development" or settings.SEED_DEMO_DATA):
        try:
            seed_database()
        except Exception:
            logging.getLogger("gym-app").exception("Database seed failed")
    yield
    # Shutdown — nothing to clean up for SQLite


app = FastAPI(
    title="Gym Management API",
    description="Backend API for gym management application",
    version="1.0.0",
    docs_url=None if settings.is_production else "/docs",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(branches.router)
app.include_router(membership_plans.router)
app.include_router(memberships.router)
app.include_router(exercises.router)
app.include_router(training_programs.router)
app.include_router(goals.router)
app.include_router(checkins.router)
app.include_router(payments.router)
app.include_router(dashboard.router)
app.include_router(notifications.router)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Don't mask HTTPException — let FastAPI handle it
    from fastapi import HTTPException as FastHTTPException

    if isinstance(exc, FastHTTPException):
        raise exc
    import logging

    logging.getLogger("gym-app").exception("Unhandled exception on %s: %s", request.url.path, exc)
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": "Internal server error", "statusCode": 500},
    )


@app.get("/health")
def health():
    return success_response(data={"status": "ok", "version": "1.0.0"}, message="healthy")


@app.get("/")
def root():
    return {"message": "Gym Management API", "version": "1.0.0", "docs": "/docs"}
