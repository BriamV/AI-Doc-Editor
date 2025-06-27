describe('Admin Settings Page', () => {
  it('redirects non-admin users', () => {
    cy.visit('/settings');
    cy.url().should('eq', Cypress.config().baseUrl + '/');
  });

  it('allows admin users', () => {
    // Primero, visita la página para que la app se cargue
    cy.visit('/');

    // Espera a que el objeto window de la app esté disponible
    cy.window().then((win) => {
      // Ahora es seguro interactuar con el store de la aplicación
      win.useStore.getState().setUser({
        id: '1',
        email: 'a@a.com',
        name: 'Admin',
        role: 'admin',
        provider: 'google',
      });
    });

    // Navega a la página de configuración después de establecer el estado
    cy.visit('/settings');

    // Verifica que el contenido de administrador sea visible
    cy.contains('Admin Settings').should('be.visible');
  });
});
