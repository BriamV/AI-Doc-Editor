try {
  // Usar la configuración disponible
  const config = {
    get: (key, defaultValue) => {
      const qaConfig = require('./scripts/qa/qa-config.json');
      const keys = key.split('.');
      let value = qaConfig;
      for (const k of keys) {
        value = value && value[k];
      }
      return value !== undefined ? value : defaultValue;
    }
  };
  
  const logger = {
    info: (msg) => console.log('[INFO]', msg),
    warn: (msg) => console.log('[WARN]', msg),
    error: (msg) => console.log('[ERROR]', msg)
  };
  
  // Probar BuildWrapper
  const BuildWrapper = require('./scripts/qa/core/wrappers/BuildWrapper.cjs');
  const buildWrapper = new BuildWrapper(config, logger);
  console.log('✅ BuildWrapper instanciado correctamente');
  console.log('Build capabilities:', buildWrapper.getCapabilities().supportedTools);
  
  // Probar DataWrapper
  const DataWrapper = require('./scripts/qa/core/wrappers/DataWrapper.cjs');
  const dataWrapper = new DataWrapper(config, logger);
  console.log('✅ DataWrapper instanciado correctamente');
  console.log('Data capabilities:', dataWrapper.getCapabilities().supportedTools);
  
  console.log('\n🎉 Pruebas de integración exitosas');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}