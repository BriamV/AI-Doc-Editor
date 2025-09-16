// cypress/support/e2e.ts

// Hace referencia a las definiciones de tipo globales de la aplicación para que Cypress las conozca.
/// <reference types="../../src/vite-env" />

// Import custom commands
import './audit-commands';

// Handle ResizeObserver errors globally
Cypress.on('uncaught:exception', (err, runnable) => {
  // ResizeObserver loop errors are safe to ignore in testing
  if (err.message.includes('ResizeObserver loop limit exceeded') ||
      err.message.includes('ResizeObserver loop completed with undelivered notifications')) {
    return false; // Prevent test failure
  }

  // Don't fail tests on non-critical errors during development
  if (err.message.includes('Network Error') ||
      err.message.includes('ChunkLoadError') ||
      err.message.includes('Loading chunk')) {
    return false;
  }

  return true; // Let other errors fail the test
});

// Add global wait helpers for better test stability
Cypress.Commands.add('waitForStableDOM', (selector?: string, timeout = 3000) => {
  const target = selector || 'body';

  // Wait for DOM to stop changing
  cy.get(target, { timeout }).should('be.visible');

  // Add small delay for React re-renders to complete
  cy.wait(100);

  // Ensure element is still there after re-renders
  cy.get(target).should('be.visible');
});

Cypress.Commands.add('safeClick', { prevSubject: 'element' }, (subject, options = {}) => {
  // Ensure element is visible and stable before clicking
  cy.wrap(subject)
    .should('be.visible')
    .should('not.be.disabled')
    .wait(50) // Brief wait for any animations
    .click({ force: false, ...options });
});

// Extend Cypress interface for new commands
declare global {
  namespace Cypress {
    interface Chainable {
      waitForStableDOM(selector?: string, timeout?: number): Chainable<void>;
      safeClick(options?: Partial<Cypress.ClickOptions>): Chainable<void>;
    }
  }
}

// Este archivo puede usarse para añadir comandos personalizados de Cypress en el futuro.
export {};
