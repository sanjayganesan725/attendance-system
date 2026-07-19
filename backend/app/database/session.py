from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Render provides DATABASE_URL with 'postgres://' but SQLAlchemy 2.x requires 'postgresql://'
database_url = settings.DATABASE_URL
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)

# Determine database engine settings based on type
if database_url.startswith("sqlite"):
    # SQLite requires check_same_thread=False for multi-threaded access in FastAPI
    engine = create_engine(
        database_url, 
        connect_args={"check_same_thread": False}
    )
    
    # Enable foreign keys enforcement for SQLite
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()
else:
    engine = create_engine(
        database_url,
        pool_pre_ping=True,  # Checks connection liveness
        pool_size=10,
        max_overflow=20
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

