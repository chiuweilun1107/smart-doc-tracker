# System Performance & Optimization

## Backend (FastAPI)
1.  **Async/Await:** Maximize usage of async handlers for I/O bound operations (DB queries, external API calls).
2.  **Database Queries:**
    *   **Indexing:** Ensure FKs and frequently searched columns are indexed in Postgres.
    *   **N+1 Problem:** Use eager loading (`joinedload`/`selectinload` in SQLAlchemy) to fetch relationships efficiently.
3.  **Caching:** Implement Redis caching for expensive computations or frequently accessed, static-like data (e.g., configurations).
4.  **Connection Pooling:** Use connection pooling for database access (e.g., `asyncpg` pool).

## Infrastructure
1.  **CDN:** Serve static assets via CDN (Vercel automatic).
2.  **Load Balancing:** (Managed by deployment platform/Supabase).
