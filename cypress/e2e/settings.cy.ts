describe('Admin Settings Page', () => {
  it('redirects non-admin users', () => {
    cy.visit('/settings');
    cy.url().should('eq', Cypress.config().baseUrl + '/');
  });

  it('allows admin users', () => {
    cy.visit('/', {
      onBeforeLoad(win) {
        win.useStore.getState().setUser({
          id: '1',
          email: 'a@a.com',
          name: 'Admin',
          role: 'admin',
          provider: 'google',
        });
      },
    });
    cy.visit('/settings');
    cy.contains('Admin Settings').should('be.visible');
  });
});
