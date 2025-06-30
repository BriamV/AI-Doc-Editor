const { execSync } = require('child_process');

try {
    console.log('    -> Running yarn audit...');
    // Ejecutamos yarn audit. Si encuentra vulnerabilidades críticas, lanzará un error y detendrá el script.
    execSync('yarn audit --level critical', { stdio: 'inherit' });
    console.log('    -> ✅ yarn audit passed.');
} catch (error) {
    console.error('\n    -> ❌ yarn audit found critical vulnerabilities. Halting security scan.');
    process.exit(1); // Salimos con un código de error para detener el qa-gate
}

console.log('\n    -> Generating license report (this may take a minute)...');
try {
    // Ejecutamos license-checker, redirigiendo su salida (que es un JSON enorme) al archivo.
    // Usamos stdio: 'ignore' para no ensuciar la consola, ya que solo nos interesa el archivo de salida.
    execSync('npx license-checker --production --json > yarn-licenses.json', { stdio: 'ignore' });
    console.log('    -> ✅ License report generated successfully: yarn-licenses.json');
} catch (error) {
    console.error('\n    -> ❌ Failed to generate license report.');
    console.error(error);
    process.exit(1);
}