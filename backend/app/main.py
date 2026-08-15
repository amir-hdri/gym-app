from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.database import Base, engine
from app.responses import error_response
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

app = FastAPI(
    title="Gym Management API",
    description="Backend API for gym management application",
    version="1.0.0",
    docs_url="/docs",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
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
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": "Internal server error", "statusCode": 500},
    )


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    seed_database()


@app.get("/")
def root():
    return {"message": "Gym Management API", "version": "1.0.0", "docs": "/docs"}
