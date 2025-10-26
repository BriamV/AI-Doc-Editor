# E2E Tests for AI Document Editor

## Overview

This directory contains end-to-end tests for the AI Document Editor using Playwright. Tests verify critical user flows, consent management, and application behavior.

## Test Files

### consent-management.spec.ts (T-24)

Complete E2E tests for the consent management feature, ensuring users must provide explicit consent before uploading documents for AI processing.

**Test Coverage:**
- Consent checkbox behavior (appears after file selection, enables/disables upload button)
- Upload prevention without consent (button disabled, no requests sent)
- Successful upload with consent (request includes consent_given=true)
- Consent text visibility and clarity (GDPR compliance)
- Consent persistence (resets after upload, independent per file)
- Accessibility (keyboard navigation, label clickability)

**Total Tests:** 13 test cases covering all aspects of consent flow

### Other Test Files

- `smoke.spec.ts` - Basic application loading and navigation
- `critical-flows.spec.ts` - Authentication and critical user journeys
- `settings.spec.ts` - Settings page functionality
- `audit-logs.spec.ts` - Audit log viewer and admin features

## Running Tests

### Run All Tests

```bash
yarn e2e:fe              # Run all frontend E2E tests
```

### Run Specific Test File

```bash
# Consent management tests only
npx playwright test consent-management.spec.ts

# With UI mode (interactive)
yarn e2e:fe:ui

# Headed mode (see browser)
yarn e2e:fe:headed
```

### Debug Tests

```bash
# Debug mode with inspector
yarn e2e:fe:debug

# Debug specific test
npx playwright test consent-management.spec.ts --debug
```

### View Test Reports

```bash
# Generate and open HTML report
yarn e2e:report
```

## Test Structure

### Setup

All tests use `setupTestEnvironment(page)` from `../test-setup.ts` to:
- Enable test mode flags
- Make test login buttons available
- Set up proper environment variables

### Authentication

Tests use test login buttons for authentication:
```typescript
await page.getByTestId('test-login-admin').click();
await page.getByTestId('test-login-editor').click();
```

### File Upload Testing

Tests create mock files using Buffer:
```typescript
const fileBuffer = Buffer.from('Test PDF content');
await fileInput.setInputFiles({
  name: 'test-document.pdf',
  mimeType: 'application/pdf',
  buffer: fileBuffer,
});
```

### API Mocking

Tests can mock backend responses:
```typescript
await page.route('**/api/upload', async route => {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ document_id: 'test-123', ... }),
  });
});
```

## Test Best Practices

### 1. Independent Tests
- Each test should be independent
- Use `test.beforeEach` for setup
- Clean up state after tests if needed

### 2. Explicit Waits
```typescript
await page.waitForLoadState('networkidle');
await expect(element).toBeVisible();
```

### 3. Test Data
- Create test data inline (no external files needed)
- Use descriptive file names (`test-consent.pdf`)

### 4. Assertions
- Use Playwright's `expect` with async matchers
- Verify both UI state and behavior
- Check network requests when relevant

### 5. Error Handling
- Test both happy paths and error cases
- Verify error messages are shown
- Ensure application doesn't crash

## Consent Management Tests Details

### Test Group 1: Consent Checkbox Behavior

**Test 1.1:** Upload button disabled until consent checked
- Verifies button state changes based on consent
- Tests toggle behavior (check/uncheck)

**Test 1.2:** Consent checkbox only appears after file selection
- Ensures consent flow is file-specific
- Checkbox not visible on empty form

### Test Group 2: Upload Prevention without Consent

**Test 2.1:** Cannot upload without consent checkbox checked
- Verifies upload button is disabled
- Confirms no API requests are sent
- Tests HTML-level enforcement

**Test 2.2:** Shows error if consent validation fails
- Backend validation test (if frontend bypassed)
- Error handling for missing consent

### Test Group 3: Successful Upload with Consent

**Test 3.1:** Successful upload when consent is given
- Complete happy path test
- Verifies upload request is made
- Checks for success indicators

**Test 3.2:** Upload includes consent_given=true in request
- Intercepts API request
- Validates FormData includes consent field
- Mocks successful backend response

### Test Group 4: Consent Text Visibility

**Test 4.1:** Consent agreement text is visible and clear
- Verifies required keywords present (consent, AI, processing)
- Checks text is not truncated
- Validates proximity to checkbox (UX)

**Test 4.2:** Consent text is properly formatted
- Checks text styling (readable color)
- Verifies cursor pointer on label
- WCAG compliance considerations

### Test Group 5: Consent Persistence

**Test 5.1:** Consent checkbox resets after successful upload
- Ensures consent is per-upload, not persistent
- Verifies new file starts with unchecked consent

**Test 5.2:** Consent state is independent per file upload
- Tests clearing and re-selecting files
- Each file requires new consent

### Test Group 6: Accessibility

**Test 6.1:** Consent checkbox is keyboard accessible
- Focus management
- Space key toggles checkbox
- Tab navigation to upload button

**Test 6.2:** Consent label is clickable
- Clicking label toggles checkbox
- Improved usability for users

## Configuration

Tests are configured in `playwright.config.ts`:
- Test directory: `./playwright/tests`
- Base URL: `http://localhost:5173`
- Retries: 3 in CI, 1 locally
- Timeout: 10s action, 15s navigation
- Screenshots: On failure
- Video: Retained on failure

## CI/CD Integration

Tests run automatically in GitHub Actions:
- On pull requests to `main` and `develop`
- On pushes to protected branches
- Nightly regression runs

See `.github/workflows/pr-validation.yml` for CI configuration.

## Troubleshooting

### Tests fail with "element not found"
- Increase timeout: `await expect(element).toBeVisible({ timeout: 10000 })`
- Check if element selector is correct
- Verify page has loaded: `await page.waitForLoadState('networkidle')`

### Tests timeout
- Backend might not be running
- Check webServer configuration in `playwright.config.ts`
- Increase global timeout for slow environments

### Tests pass locally but fail in CI
- CI uses headless mode, check browser differences
- Verify test mode flags are set correctly
- Check for race conditions (add explicit waits)

### Upload tests fail
- Verify backend API is available
- Check authentication token is valid
- Mock API responses if backend is unavailable

## Contributing

When adding new E2E tests:

1. Follow existing test structure
2. Use `setupTestEnvironment(page)` in `beforeEach`
3. Use test IDs (`data-testid`) for reliable selectors
4. Add descriptive test names
5. Document test purpose in comments
6. Update this README with new test coverage

## Related Documentation

- **Task Documentation:** `docs/tasks/T-24-STATUS.md`
- **Playwright Config:** `playwright.config.ts`
- **Test Setup Utils:** `playwright/test-setup.ts`
- **Backend Tests:** `backend/tests/test_consent_validation.py`

---

**Last Updated:** 2025-10-26
**Test Count:** 13 consent tests + smoke/critical flows
**Coverage:** Consent Management (T-24), Authentication, Navigation
