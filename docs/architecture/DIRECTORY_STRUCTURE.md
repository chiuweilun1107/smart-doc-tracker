# Directory Structure Specification

This project follows a `monorepo-like` structure with separate directories for Frontend (Next.js) and Backend (FastAPI).

## Root Directory
```
/
├── frontend/             # Next.js Application (App Router)
├── backend/              # Python FastAPI Application
├── docs/                 # Documentation (Single Source of Truth)
├── specs/                # JSON Schemas and Specifications
├── scripts/              # Helper scripts
├── project.config.yaml   # Project Configuration
├── PROJECT_REQUIREMENTS.md
└── PROJECT_BLUEPRINT.md
```

## Frontend Structure (`frontend/`)
```
frontend/
├── app/                  # App Router Pages & Layouts
│   ├── dashboard/        # Dashboard Routes
│   ├── projects/         # Project Management Routes
│   └── auth/             # Authentication Routes
├── components/           # Reusable UI Components
│   ├── ui/               # Shadcn/UI primitives
│   └── business/         # Business-specific components
├── lib/                  # Utility functions & API clients
├── types/                # TypeScript Interfaces/Types
├── public/               # Static assets
└── next.config.mjs
```

## Backend Structure (`backend/`)
```
backend/
├── app/
│   ├── api/              # API Endpoints (Routes)
│   │   ├── v1/
│   │   │   ├── projects.py
│   │   │   ├── documents.py
│   │   │   └── notifications.py
│   ├── core/             # Core Logic (Config, Security)
│   ├── models/           # Pydantic Schemas & DB Models
│   ├── services/         # Business Logic (OCR, AI, Notifications)
│   │   ├── ocr_service.py
│   │   ├── llm_service.py
│   │   └── notification_service.py
│   └── db/               # Database Connection & Migrations
├── tests/                # Pytest
├── requirements.txt      # Python Dependencies
└── main.py               # Application Entry Point
```
