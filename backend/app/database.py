import os
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from app.config import settings

# Resolve DB path relative to backend/ dir, not CWD
def _resolve_db_url(url: str) -> str:
    if url.startswith("sqlite:///"):
        raw = url.replace("sqlite:///", "", 1)
        if not os.path.isabs(raw) and raw != ":memory:":
            # Resolve relative to backend/ directory
            backend_dir = Path(__file__).resolve().parent.parent
            abs_path = (backend_dir / raw).resolve()
            return f"sqlite:///{abs_path}"
    return url


_resolved_url = _resolve_db_url(settings.DATABASE_URL)

# SQLite needs check_same_thread=False only for that driver
connect_args = {"check_same_thread": False} if _resolved_url.startswith("sqlite") else {}

engine = create_engine(
    _resolved_url,
    connect_args=connect_args,
    # Pool pre-ping for resilience
    pool_pre_ping=True,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
