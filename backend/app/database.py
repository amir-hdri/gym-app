import os
from pathlib import Path

from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, sessionmaker

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


@event.listens_for(engine, "connect")
def _enforce_sqlite_foreign_keys(dbapi_connection, connection_record):
    """Enable FK enforcement per SQLite connection.

    SQLite ignores FOREIGN KEY clauses (including ondelete="CASCADE") unless
    PRAGMA foreign_keys=ON is set on every connection. Without this, deleting
    a user leaves orphaned memberships/check-ins/payments/etc.
    """
    if _resolved_url.startswith("sqlite"):
        cursor = dbapi_connection.cursor()
        try:
            cursor.execute("PRAGMA foreign_keys=ON")
        finally:
            cursor.close()


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
