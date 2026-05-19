"""Collects all route modules into one router for main.py."""

from fastapi import APIRouter

from app.routes import chat, health, upload, resume, interview, job, skill, roadmap

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(chat.router)
api_router.include_router(upload.router)
api_router.include_router(resume.router)
api_router.include_router(interview.router)
api_router.include_router(job.router)
api_router.include_router(skill.router)
api_router.include_router(roadmap.router)
