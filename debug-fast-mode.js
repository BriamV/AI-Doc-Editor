#!/usr/bin/env node

// Debug script para Fast Mode
const { spawn } = require('child_process');

// Ejecutar con más detalle el stack trace
process.env.NODE_OPTIONS = '--trace-uncaught';

// Ejecutar el comando qa --fast --dry-run
const child = spawn('yarn', ['run', 'cmd', 'qa', '--fast', '--dry-run'], {
  stdio: 'inherit',
  env: { ...process.env, NODE_OPTIONS: '--trace-uncaught' }
});

child.on('exit', (code) => {
  console.log(`\n\nProcess exited with code: ${code}`);
});