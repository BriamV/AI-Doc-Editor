describe('Admin Settings Page', () => {
  it('redirects non-admin users', () => {
    cy.visit('/settings');
    cy.url().should('eq', Cypress.config().baseUrl + '/');
  });

  it('allows admin users', () => {
    const adminUser = {
      id: '1',
      email: 'a@a.com',
      name: 'Admin',
      role: 'admin' as const, // Use 'as const' for stricter typing
      provider: 'google',
    };

    // Visita la página de inicio
    cy.visit('/');

    // Espera activamente a que la interfaz de prueba 'app' esté disponible
    // y luego invoca la acción de login de forma segura.
    cy.window()
      .should('have.property', 'app') // Espera a que window.app exista
      .its('app') // Obtiene la propiedad app
      .invoke('login', adminUser); // Invoca la función login

    // Con el estado de administrador ya establecido, navega a la página de configuración.
    cy.visit('/settings');

    // Verifica que el contenido de administrador sea visible.
    cy.contains('Admin Settings').should('be.visible');
  });
});
