// assets/js/modules/auth.js
(function () {
  'use strict';

  /**
   * Stub AuthModule
   * - Non blocca l'app se l'autenticazione non è configurata.
   * - Espone init/mount no-op, con log chiari.
   * - In futuro puoi sostituirlo con la tua integrazione Google/Firebase Auth.
   */
  const AuthModule = {
    async init() {
      console.log('🔐 [Auth] init (stub)');
      return true;
    },
    mount(container) {
      // opzionale: piccola UI, ma per ora non mostra nulla
      // Lasciamo il modulo silente per non sporcare la UI.
    }
  };

  window.AuthModule = AuthModule;
})();
