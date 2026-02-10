# Backend Testing Strategy (Pytest)

## Testing Levels
1.  **Unit Tests:** Test individual functions and classes in isolation (mock external dependencies).
    *   *Tools:* `pytest`, `pytest-mock`.
    *   *Coverage:* Business logic services, utility functions.
2.  **Integration Tests:** Test interactions between components (API -> Service -> DB).
    *   *Tools:* `pytest-asyncio`, `httpx` (for API client).
    *   *Database:* Use a separate test database or transaction rollback strategy.
3.  **E2E Tests:** (Optional for MVP, managed by QA/Frontend).

## Best Practices
*   **Fixtures:** Use `conftest.py` for shared fixtures (e.g., DB session, authenticated user).
*   **Assertions:** Write clear assertions tailored to the expected outcome.
*   **Continuous Integration:** Run tests automatically on Pull Requests.
