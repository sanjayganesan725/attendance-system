"""
Vercel Python serverless entry point for the FastAPI backend.

Vercel's Python runtime detects `app` in this file and serves it as an
ASGI application. All routes defined in app.main are available here.
"""
import sys
import os

# Ensure the backend root is on the Python path so `app.*` imports resolve
# correctly regardless of where Vercel runs this file from.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app  # noqa: F401 — Vercel uses `app` from this module
