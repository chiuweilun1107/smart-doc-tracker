# Overall Test Strategy (Test Pyramid)

## 1. Unit Tests (60-70%)
*   **Scope:** Individual functions, components, hooks.
*   **Speed:** Fast (ms).
*   **Who Writes:** Developers.
*   **When:** During development (TDD preferred).

## 2. Integration Tests (20-30%)
*   **Scope:** API endpoints interaction with DB, Component interaction with Context/API.
*   **Speed:** Medium (s).
*   **Who Writes:** Developers.
*   **When:** Before merging code.

## 3. End-to-End (E2E) Tests (10%)
*   **Scope:** Critical user flows (Login -> Create Project -> Upload Doc -> Check Deadline).
*   **Speed:** Slow (mins).
*   **Who Writes:** QA / Developers.
*   **Tools:** Playwright or Cypress.
*   **When:** Nightly builds or manually before release.
