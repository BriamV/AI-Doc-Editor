# Cypress to Playwright Migration

## Migration Completed: September 15, 2025

This directory contains the legacy Cypress testing framework files that have been replaced by Playwright as the primary E2E testing solution.

## Current Scope
- Desktop web journeys on laptop/desktop browsers (Chromium project).
- Mobile and tablet device coverage is out of scope for this phase; Playwright mobile projects are disabled until needed.

## What Was Migrated

### Test Files
- `cypress/e2e/audit-logs.cy.ts` → `playwright/tests/audit-logs.spec.ts`
- `cypress/e2e/settings.cy.ts` → `playwright/tests/settings.spec.ts`
- `cypress/e2e/placeholder.cy.ts` → `playwright/tests/smoke.spec.ts`

### Support Files
- `cypress/support/e2e.ts` → Global error handling in Playwright config
- `cypress/support/audit-commands.ts` → `playwright/utils/audit-helpers.ts`

### Configuration
- `cypress.config.ts` → `playwright.config.ts` (enhanced)

## Migration Benefits

### Improved Performance
- **Faster execution**: Playwright's auto-waiting and parallel execution
- **Better stability**: Reduced flakiness with smart retry mechanisms
- **Modern architecture**: Native async/await vs Cypress's command queue

### Enhanced Features
- **Multi-browser support**: Chrome, Firefox, Safari, Edge
- **Mobile testing (future option)**: Built-in device emulation (available via Playwright but currently disabled in scope)
- **Better debugging**: Built-in trace viewer and inspector
- **CI integration**: Native GitHub Actions support

### Developer Experience
- **TypeScript-first**: Better type safety and IDE support
- **Modern API**: Intuitive locator strategies
- **Rich reporting**: HTML reports with videos, screenshots, traces
- **Auto-waiting**: Smart waiting for elements and network requests

## Key Differences

### Test Structure
```typescript
// Cypress (old)
describe('Test', () => {
  it('should do something', () => {
    cy.visit('/page');
    cy.get('[data-testid="button"]').click();
  });
});

// Playwright (new)
test.describe('Test', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/page');
    await page.getByTestId('button').click();
  });
});
```

### Custom Commands vs Helpers
```typescript
// Cypress (old)
Cypress.Commands.add('login', (user) => { /* ... */ });
cy.login(adminUser);

// Playwright (new)
const helpers = new AuditTestHelpers(page);
await helpers.login(adminUser);
```

## Updated Scripts

### Primary E2E Commands (Playwright)
```bash
yarn e2e:fe              # Run all E2E tests
yarn e2e:fe:headed       # Run with browser visible
yarn e2e:fe:debug        # Debug mode
yarn e2e:fe:ui           # Interactive UI mode
yarn e2e:fe:report       # Show HTML report
```

### Legacy Cypress Commands (Deprecated)
```bash
yarn test:cypress          # Legacy Cypress tests
yarn test:cypress:open     # Legacy Cypress UI
```

## CI/CD Updates

### GitHub Actions
- Updated `.github/workflows/ci.yml` to use Playwright
- Added browser installation step
- Enhanced artifact collection (reports, videos, traces)

### Package.json
- Primary `test:e2e` now runs Playwright
- Cypress commands moved to legacy namespace
- Removed Cypress dependency

## File Structure Changes

```
# New Playwright Structure
playwright/
├── tests/
│   ├── audit-logs.spec.ts
│   ├── settings.spec.ts
│   └── smoke.spec.ts
├── utils/
│   └── audit-helpers.ts
├── global-setup.ts
└── global-teardown.ts

# Legacy Cypress (moved here)
legacy/
├── cypress/
│   ├── e2e/
│   ├── support/
│   └── fixtures/
└── cypress.config.ts
```

## Test Coverage Maintained

All existing test coverage has been maintained or improved:

1. **Audit Log Viewer Tests**: Complete migration with enhanced helper utilities
2. **Settings Page Tests**: Access control and admin functionality
3. **Smoke Tests**: Basic application health checks
4. **Responsive Design**: Mobile and tablet viewport testing
5. **Error Handling**: API errors and network failures
6. **Security Testing**: Access control and WORM compliance

## Cleanup Actions Taken

1. ✅ Moved Cypress files to `legacy/` directory
2. ✅ Updated package.json scripts (Playwright primary, Cypress legacy)
3. ✅ Removed Cypress dependency from package.json
4. ✅ Updated .gitignore for Playwright artifacts
5. ✅ Updated CI/CD workflows
6. ✅ Updated CLAUDE.md documentation

## Future Actions

### Phase 1: Validation (Next 2 weeks)
- Run Playwright tests in production CI
- Monitor stability and performance
- Address any issues discovered

### Phase 2: Enhancement (Following month)
- Add more comprehensive test coverage
- Implement visual regression testing
- Add API testing capabilities

### Phase 3: Cleanup (After validation)
- Remove legacy Cypress files
- Clean up legacy scripts
- Archive this migration documentation

## Rollback Plan

If rollback is needed:
1. Move files back from `legacy/` to root
2. Restore Cypress dependency in package.json
3. Update CI workflows to use Cypress
4. Update primary test scripts

This migration documentation will be kept until the Playwright implementation is fully validated in production.