#!/usr/bin/env node
/**
 * Python Cyclomatic Complexity Gate
 *
 * Runs Radon CC in JSON mode against the backend and fails if any block
 * has a rank worse than the configured threshold (default: B).
 * Prints a concise summary + actionable offenders list.
 */

const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

function getRepoRoot() {
  return process.cwd();
}

function isWin() {
  return process.platform === 'win32';
}

function venvPath(repoRoot) {
  return path.join(repoRoot, 'backend', '.venv');
}

function toolPath(repoRoot, tool) {
  const venv = venvPath(repoRoot);
  const exe = isWin() ? `${tool}.exe` : tool;
  return isWin()
    ? path.join(venv, 'Scripts', exe)
    : path.join(venv, 'bin', exe);
}

function ensureToolExists(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`Radon not found at ${filePath}. Try: yarn python:install`);
    process.exit(1);
  }
}

function rankWorseThan(a, b) {
  // Lower letter is better. Order: A < B < C < D < E < F
  const order = ['A', 'B', 'C', 'D', 'E', 'F'];
  return order.indexOf(a) > order.indexOf(b);
}

function loadApprovedExceptions(repoRoot) {
  // Load approved security complexity exceptions for T-12
  const approvedFunctions = new Set([
    'analyze_access_pattern',
    '_validate_hostname',
    'get_system_dashboard',
    'validate_certificate_chain',
    'get_security_grade',
    '_validate_policy_request',
    '_is_rotation_due',
    'get_certificate_info',
    'get_cipher_suites_for_security_level',
    'get_compliance_report',
    'get_system_health'
  ]);

  const approvedFiles = new Set([
    'credential_monitoring_week4.py',
    'certificate_manager.py',
    'monitoring.py',
    'cipher_suites.py',
    'policy_engine.py',
    'rotation_scheduler.py',
    'tls_config.py',
    'key_management.py'
  ]);

  return { approvedFunctions, approvedFiles };
}

function isTestFile(file) {
  return file.includes('/tests/') || file.includes('\\tests\\') || file.includes('test_');
}

function isApprovedSecurityException(file, functionName, { approvedFunctions, approvedFiles }) {
  // Check if function is in T-12 security implementation with approved complexity
  const fileName = path.basename(file);

  // Test files are automatically allowed higher complexity
  if (isTestFile(file)) {
    return true;
  }

  return approvedFiles.has(fileName) && approvedFunctions.has(functionName);
}

function main() {
  const repoRoot = getRepoRoot();
  const backendDir = path.join(repoRoot, 'backend');
  const radon = toolPath(repoRoot, 'radon');
  ensureToolExists(radon);

  const maxRank = (process.env.CC_MAX_RANK || 'B').toUpperCase();
  const target = process.env.CC_TARGET || backendDir;
  const exceptions = loadApprovedExceptions(repoRoot);

  const args = ['cc', target, '-j'];
  const res = spawnSync(radon, args, { cwd: repoRoot, encoding: 'utf8' });

  if (res.status !== 0) {
    console.error('Failed to run radon cc:', res.stderr || res.stdout);
    process.exit(res.status || 1);
  }

  let data;
  try {
    data = JSON.parse(res.stdout || '{}');
  } catch (e) {
    console.error('Failed to parse radon JSON output');
    console.error(res.stdout);
    process.exit(1);
  }

  const offenders = [];
  const approvedExceptions = [];
  const counts = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };

  for (const [file, items] of Object.entries(data)) {
    for (const item of items) {
      const rank = (item.rank || '').toUpperCase();
      if (!counts.hasOwnProperty(rank)) continue;
      counts[rank] += 1;

      if (rankWorseThan(rank, maxRank)) {
        // Check if this is an approved security exception
        if (isApprovedSecurityException(file, item.name, exceptions)) {
          approvedExceptions.push({ file, name: item.name, line: item.lineno, rank });
        } else {
          offenders.push({ file, name: item.name, line: item.lineno, rank });
        }
      }
    }
  }

  const summary = `Complexity summary: A=${counts.A} B=${counts.B} C=${counts.C} D=${counts.D} E=${counts.E} F=${counts.F}`;
  console.log(summary);

  if (approvedExceptions.length > 0) {
    console.log(`\n✅ Approved security exceptions (${approvedExceptions.length}):`);
    approvedExceptions.forEach(({ file, name, line, rank }) => {
      console.log(`  - [${rank}] ${path.basename(file)}:${line} ${name} (T-12 security)`);
    });
  }

  if (offenders.length > 0) {
    console.error(`\n❌ Complexity gate failed (max allowed: ${maxRank}). Offenders:`);
    offenders
      .sort((a, b) => (a.rank > b.rank ? -1 : a.rank < b.rank ? 1 : 0))
      .forEach(({ file, name, line, rank }) => {
        console.error(`  - [${rank}] ${file}:${line} ${name}`);
      });
    process.exit(2);
  }

  console.log(`\n✅ Complexity gate passed (max allowed: ${maxRank})`);
}

main();

