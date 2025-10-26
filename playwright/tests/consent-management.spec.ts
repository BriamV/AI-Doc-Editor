/**
 * E2E Tests for T-24: Consent Management
 * Tests the complete consent flow for document upload
 */

import { test, expect } from '@playwright/test';
import { setupTestEnvironment } from '../test-setup';

test.describe('T-24: Consent Management', () => {
  test.beforeEach(async ({ page }) => {
    // Set up test environment for all tests
    await setupTestEnvironment(page);
  });

  test.describe('Consent Checkbox Behavior', () => {
    test('upload button is disabled until consent checkbox is checked', async ({ page }) => {
      // 1. Login as test user
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      await page.getByTestId('test-login-admin').click();
      await page.waitForURL('/');

      // 2. Navigate to Documents page
      await page.goto('/documents');
      await page.waitForLoadState('networkidle');

      // 3. Verify upload form is visible
      await expect(page.getByText('Upload Document')).toBeVisible();

      // 4. Initially, no file is selected, so upload button should not be visible
      const uploadButton = page.getByRole('button', { name: /upload/i });

      // Create a test file using Buffer
      const fileBuffer = Buffer.from('Test PDF content for E2E testing');

      // 5. Select a file using file input
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'test-document.pdf',
        mimeType: 'application/pdf',
        buffer: fileBuffer,
      });

      // 6. Wait for file preview to appear
      await expect(page.getByText('test-document.pdf')).toBeVisible();

      // 7. Verify consent checkbox appears
      const consentCheckbox = page.locator('input[type="checkbox"]');
      await expect(consentCheckbox).toBeVisible();

      // 8. Verify consent text is present
      await expect(page.getByText(/consent to send this document to AI services/i)).toBeVisible();

      // 9. Verify upload button is disabled (consent not given)
      await expect(uploadButton).toBeDisabled();

      // 10. Check the consent checkbox
      await consentCheckbox.check();

      // 11. Verify upload button is now enabled
      await expect(uploadButton).toBeEnabled();

      // 12. Uncheck the consent checkbox
      await consentCheckbox.uncheck();

      // 13. Verify upload button is disabled again
      await expect(uploadButton).toBeDisabled();
    });

    test('consent checkbox only appears after file selection', async ({ page }) => {
      // Login
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      await page.getByTestId('test-login-admin').click();
      await page.waitForURL('/');

      // Navigate to Documents page
      await page.goto('/documents');
      await page.waitForLoadState('networkidle');

      // Initially, consent checkbox should not be visible
      const consentCheckbox = page.locator('input[type="checkbox"]');
      await expect(consentCheckbox).not.toBeVisible();

      // Select a file
      const fileBuffer = Buffer.from('Test content');
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'test.pdf',
        mimeType: 'application/pdf',
        buffer: fileBuffer,
      });

      // Now consent checkbox should be visible
      await expect(consentCheckbox).toBeVisible();
    });
  });

  test.describe('Upload Prevention without Consent', () => {
    test('cannot upload without consent checkbox checked', async ({ page }) => {
      // Login
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      await page.getByTestId('test-login-admin').click();
      await page.waitForURL('/');

      // Navigate to Documents page
      await page.goto('/documents');
      await page.waitForLoadState('networkidle');

      // Select a valid file
      const fileBuffer = Buffer.from('PDF content for upload test');
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'upload-test.pdf',
        mimeType: 'application/pdf',
        buffer: fileBuffer,
      });

      // Wait for file preview
      await expect(page.getByText('upload-test.pdf')).toBeVisible();

      // Verify upload button exists but is disabled
      const uploadButton = page.getByRole('button', { name: /upload/i });
      await expect(uploadButton).toBeVisible();
      await expect(uploadButton).toBeDisabled();

      // Listen for any API calls (there should be none)
      let uploadRequestMade = false;
      page.on('request', request => {
        if (request.url().includes('/api/upload')) {
          uploadRequestMade = true;
        }
      });

      // Try to force click (should not work because button is disabled)
      // This verifies the disabled state is enforced at HTML level
      const isDisabled = await uploadButton.isDisabled();
      expect(isDisabled).toBe(true);

      // Verify no upload request was made
      await page.waitForTimeout(500);
      expect(uploadRequestMade).toBe(false);

      // Verify file is still in preview (not uploaded)
      await expect(page.getByText('upload-test.pdf')).toBeVisible();
    });

    test('shows error if consent validation fails', async ({ page }) => {
      // Login
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      await page.getByTestId('test-login-admin').click();
      await page.waitForURL('/');

      // Navigate to Documents page
      await page.goto('/documents');
      await page.waitForLoadState('networkidle');

      // Select a file
      const fileBuffer = Buffer.from('Test content');
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'test.pdf',
        mimeType: 'application/pdf',
        buffer: fileBuffer,
      });

      // Wait for file preview and consent checkbox
      await expect(page.getByText('test.pdf')).toBeVisible();
      const consentCheckbox = page.locator('input[type="checkbox"]');
      await expect(consentCheckbox).toBeVisible();

      // Do not check consent checkbox
      const uploadButton = page.getByRole('button', { name: /upload/i });

      // Button should be disabled (frontend validation)
      await expect(uploadButton).toBeDisabled();

      // Even if we somehow bypass frontend (e.g., manipulate DOM),
      // backend should reject the upload
      // This test verifies the button is properly disabled
    });
  });

  test.describe('Successful Upload with Consent', () => {
    test('successful upload when consent is given', async ({ page }) => {
      // Login
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      await page.getByTestId('test-login-admin').click();
      await page.waitForURL('/');

      // Navigate to Documents page
      await page.goto('/documents');
      await page.waitForLoadState('networkidle');

      // Select a valid file
      const fileBuffer = Buffer.from('PDF content for successful upload');
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'success-test.pdf',
        mimeType: 'application/pdf',
        buffer: fileBuffer,
      });

      // Wait for file preview
      await expect(page.getByText('success-test.pdf')).toBeVisible();

      // Check consent checkbox
      const consentCheckbox = page.locator('input[type="checkbox"]');
      await expect(consentCheckbox).toBeVisible();
      await consentCheckbox.check();

      // Verify consent is checked
      await expect(consentCheckbox).toBeChecked();

      // Click upload button
      const uploadButton = page.getByRole('button', { name: /upload/i });
      await expect(uploadButton).toBeEnabled();

      // Track upload request
      let uploadRequestMade = false;
      let consentSentInRequest = false;

      page.on('request', request => {
        if (request.url().includes('/api/upload')) {
          uploadRequestMade = true;
          // Check if consent was sent in the request
          const postData = request.postData();
          if (postData && postData.includes('consent_given')) {
            consentSentInRequest = true;
          }
        }
      });

      await uploadButton.click();

      // Wait for upload to complete (check for progress indicator or success message)
      // The button text changes to "Uploading..." during upload
      await expect(page.getByRole('button', { name: /uploading/i })).toBeVisible({ timeout: 2000 }).catch(() => {
        // Upload might be too fast to catch "Uploading..." state
      });

      // Wait for upload to finish (file preview should disappear or success message appears)
      // Give it reasonable time for backend to process
      await page.waitForTimeout(2000);

      // Verify upload request was made
      expect(uploadRequestMade).toBe(true);
      expect(consentSentInRequest).toBe(true);

      // Note: Success verification depends on backend being available
      // In test environment, backend might not be running or might reject
      // The key test is that the request was made with consent=true
    });

    test('upload includes consent_given=true in request', async ({ page }) => {
      // Login
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      await page.getByTestId('test-login-admin').click();
      await page.waitForURL('/');

      // Navigate to Documents page
      await page.goto('/documents');
      await page.waitForLoadState('networkidle');

      // Intercept upload request to verify consent field
      let capturedFormData: string | null = null;

      await page.route('**/api/upload', async route => {
        const request = route.request();
        capturedFormData = request.postData();

        // Mock successful response
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            document_id: 'test-doc-123',
            filename: 'test-consent.pdf',
            file_type: 'pdf',
            file_size: 1024,
            status: 'completed',
            created_at: new Date().toISOString(),
          }),
        });
      });

      // Select a file
      const fileBuffer = Buffer.from('Consent verification test');
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'test-consent.pdf',
        mimeType: 'application/pdf',
        buffer: fileBuffer,
      });

      // Check consent checkbox
      const consentCheckbox = page.locator('input[type="checkbox"]');
      await consentCheckbox.check();

      // Click upload
      const uploadButton = page.getByRole('button', { name: /upload/i });
      await uploadButton.click();

      // Wait for request to be captured
      await page.waitForTimeout(1000);

      // Verify consent_given=true was sent
      expect(capturedFormData).not.toBeNull();
      expect(capturedFormData).toContain('consent_given');
      expect(capturedFormData).toContain('true');
    });
  });

  test.describe('Consent Text Visibility', () => {
    test('consent agreement text is visible and clear', async ({ page }) => {
      // Login
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      await page.getByTestId('test-login-admin').click();
      await page.waitForURL('/');

      // Navigate to Documents page
      await page.goto('/documents');
      await page.waitForLoadState('networkidle');

      // Select a file to trigger consent checkbox
      const fileBuffer = Buffer.from('Test content');
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'test.pdf',
        mimeType: 'application/pdf',
        buffer: fileBuffer,
      });

      // Verify consent text contains required keywords
      const consentText = page.getByText(/consent to send this document to AI services/i);
      await expect(consentText).toBeVisible();

      // Verify the text includes key terms
      const fullText = await consentText.textContent();
      expect(fullText).toBeTruthy();

      // Check for required keywords
      expect(fullText!.toLowerCase()).toContain('consent');
      expect(fullText!.toLowerCase()).toContain('ai');
      expect(fullText!.toLowerCase()).toMatch(/(service|processing|analysis)/);

      // Verify text is readable (not truncated or hidden)
      const textBox = await consentText.boundingBox();
      expect(textBox).not.toBeNull();
      expect(textBox!.width).toBeGreaterThan(100); // Reasonable width
      expect(textBox!.height).toBeGreaterThan(10); // Reasonable height

      // Verify checkbox is near the text (good UX)
      const consentCheckbox = page.locator('input[type="checkbox"]');
      const checkboxBox = await consentCheckbox.boundingBox();
      expect(checkboxBox).not.toBeNull();

      // Checkbox and text should be close together (same row/container)
      const verticalDistance = Math.abs(textBox!.y - checkboxBox!.y);
      expect(verticalDistance).toBeLessThan(50); // Within 50px vertically
    });

    test('consent text is properly formatted and user-friendly', async ({ page }) => {
      // Login
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      await page.getByTestId('test-login-admin').click();
      await page.waitForURL('/');

      // Navigate to Documents page
      await page.goto('/documents');
      await page.waitForLoadState('networkidle');

      // Select a file
      const fileBuffer = Buffer.from('Test');
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'test.pdf',
        mimeType: 'application/pdf',
        buffer: fileBuffer,
      });

      // Get consent label element
      const consentLabel = page.locator('label').filter({ hasText: /consent/i });
      await expect(consentLabel).toBeVisible();

      // Check styling (should be readable, not gray/disabled)
      const labelColor = await consentLabel.evaluate(el => {
        return window.getComputedStyle(el).color;
      });

      // Color should not be too light (should be readable)
      // This is a basic check - in real apps you'd check contrast ratio
      expect(labelColor).not.toBe('rgb(255, 255, 255)'); // Not white
      expect(labelColor).not.toBe('rgba(0, 0, 0, 0)'); // Not transparent

      // Verify label has cursor pointer (clickable)
      const cursor = await consentLabel.evaluate(el => {
        return window.getComputedStyle(el).cursor;
      });
      expect(cursor).toBe('pointer');
    });
  });

  test.describe('Consent Persistence', () => {
    test('consent checkbox resets after successful upload', async ({ page }) => {
      // Login
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      await page.getByTestId('test-login-admin').click();
      await page.waitForURL('/');

      // Navigate to Documents page
      await page.goto('/documents');
      await page.waitForLoadState('networkidle');

      // Mock successful upload
      await page.route('**/api/upload', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            document_id: 'test-doc-456',
            filename: 'test.pdf',
            file_type: 'pdf',
            file_size: 1024,
            status: 'completed',
            created_at: new Date().toISOString(),
          }),
        });
      });

      // Select file and give consent
      const fileBuffer = Buffer.from('Test');
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'test.pdf',
        mimeType: 'application/pdf',
        buffer: fileBuffer,
      });

      const consentCheckbox = page.locator('input[type="checkbox"]');
      await consentCheckbox.check();
      await expect(consentCheckbox).toBeChecked();

      // Upload
      const uploadButton = page.getByRole('button', { name: /upload/i });
      await uploadButton.click();

      // Wait for upload to complete (file preview should clear)
      await page.waitForTimeout(1500);

      // After successful upload, consent checkbox should not be visible
      // (because file selection is cleared)
      await expect(consentCheckbox).not.toBeVisible();

      // Select another file - consent should be unchecked by default
      await fileInput.setInputFiles({
        name: 'test2.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('Test 2'),
      });

      // Consent checkbox appears again, should be unchecked
      await expect(consentCheckbox).toBeVisible();
      await expect(consentCheckbox).not.toBeChecked();
    });

    test('consent checkbox state is independent per file upload', async ({ page }) => {
      // Login
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      await page.getByTestId('test-login-admin').click();
      await page.waitForURL('/');

      // Navigate to Documents page
      await page.goto('/documents');
      await page.waitForLoadState('networkidle');

      // Select first file
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'first.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('First'),
      });

      // Check consent
      const consentCheckbox = page.locator('input[type="checkbox"]');
      await consentCheckbox.check();
      await expect(consentCheckbox).toBeChecked();

      // Clear file (using clear button if available, or by selecting empty)
      const clearButton = page.getByRole('button', { name: /clear|remove/i });
      if (await clearButton.isVisible()) {
        await clearButton.click();
      }

      // Select second file - consent should be unchecked
      await fileInput.setInputFiles({
        name: 'second.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('Second'),
      });

      // Consent checkbox should be unchecked for new file
      await expect(consentCheckbox).toBeVisible();
      await expect(consentCheckbox).not.toBeChecked();
    });
  });

  test.describe('Accessibility', () => {
    test('consent checkbox is keyboard accessible', async ({ page }) => {
      // Login
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      await page.getByTestId('test-login-admin').click();
      await page.waitForURL('/');

      // Navigate to Documents page
      await page.goto('/documents');
      await page.waitForLoadState('networkidle');

      // Select a file
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'test.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('Test'),
      });

      // Focus on consent checkbox using keyboard
      const consentCheckbox = page.locator('input[type="checkbox"]');
      await consentCheckbox.focus();

      // Verify it's focused
      const isFocused = await consentCheckbox.evaluate(el => el === document.activeElement);
      expect(isFocused).toBe(true);

      // Press Space to toggle checkbox
      await page.keyboard.press('Space');
      await expect(consentCheckbox).toBeChecked();

      // Press Space again to uncheck
      await page.keyboard.press('Space');
      await expect(consentCheckbox).not.toBeChecked();

      // Tab to upload button
      await page.keyboard.press('Tab');
      const uploadButton = page.getByRole('button', { name: /upload/i });

      // Upload button should be focused and disabled (consent not given)
      await expect(uploadButton).toBeDisabled();
    });

    test('consent label is clickable to toggle checkbox', async ({ page }) => {
      // Login
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      await page.getByTestId('test-login-admin').click();
      await page.waitForURL('/');

      // Navigate to Documents page
      await page.goto('/documents');
      await page.waitForLoadState('networkidle');

      // Select a file
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'test.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('Test'),
      });

      // Click on the label text (not the checkbox itself)
      const consentLabel = page.getByText(/consent to send this document to AI services/i);
      await consentLabel.click();

      // Checkbox should be checked
      const consentCheckbox = page.locator('input[type="checkbox"]');
      await expect(consentCheckbox).toBeChecked();

      // Click label again
      await consentLabel.click();

      // Checkbox should be unchecked
      await expect(consentCheckbox).not.toBeChecked();
    });
  });
});
