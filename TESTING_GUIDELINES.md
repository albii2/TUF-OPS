# Testing Guidelines

## UI Contract

- All new interactive UI elements must include a `data-testid` attribute.
- The `data-testid` should follow the naming convention: `input-{entity}-{field}`, `submit-{entity}`, `select-{field}`, `page-{entity}`, `table-row-{entity}`.

## E2E Tests

- All E2E tests must use the flows and engine in the `e2e/tests` directory.
- Specs should describe business intent only.
- Do not use raw selectors.
- Do not use `waitForTimeout`.
- Do not use speculative “smart” selector guessing.
