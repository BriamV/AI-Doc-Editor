/// <reference types="cypress" />

describe('Application Smoke Test', () => {
  it('should load the home page without errors', () => {
    cy.visit('/');
    cy.get('body').should('be.visible');
  });
});
