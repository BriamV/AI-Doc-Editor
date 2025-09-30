#!/usr/bin/env node
/**
 * Python Cyclomatic Complexity Gate
 *
 * Runs Radon CC in JSON mode against the backend and fails if any block
 * has a rank worse than the configured threshold (default: B).
 * Prints a concise summary + actionable offenders list.
 *
 * Supports single-file analysis:
 *   --file <path>  Analyze single file instead of entire backend/
 *   --json         Output structured JSON: {"max_cc": N, "file": "path", "violations": [...]}
 *
 * Examples:
 *   node scripts/python-cc-gate.cjs                          # Full backend scan
 *   node scripts/python-cc-gate.cjs --file backend/app/main.py --json
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
  return isWin() ? path.join(venv, 'Scripts', exe) : path.join(venv, 'bin', exe);
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
    'get_system_health',
  ]);

  const approvedFiles = new Set([
    'credential_monitoring_week4.py',
    'certificate_manager.py',
    'monitoring.py',
    'cipher_suites.py',
    'policy_engine.py',
    'rotation_scheduler.py',
    'tls_config.py',
    'key_management.py',
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

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    file: null,
    json: false,
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--file' && i + 1 < args.length) {
      options.file = args[i + 1];
      i++;
    } else if (args[i] === '--json') {
      options.json = true;
    }
  }

  return options;
}

function rankToNumber(rank) {
  const order = ['A', 'B', 'C', 'D', 'E', 'F'];
  return order.indexOf(rank.toUpperCase());
}

function getMaxComplexity(data) {
  let maxCC = 0;
  for (const items of Object.values(data)) {
    for (const item of items) {
      maxCC = Math.max(maxCC, item.complexity || 0);
    }
  }
  return maxCC;
}

function main() {
  const options = parseArgs();
  const repoRoot = getRepoRoot();
  const backendDir = path.join(repoRoot, 'backend');
  const radon = toolPath(repoRoot, 'radon');
  ensureToolExists(radon);

  const maxRank = (process.env.CC_MAX_RANK || 'B').toUpperCase();
  const target = options.file
    ? path.resolve(repoRoot, options.file)
    : process.env.CC_TARGET || backendDir;
  const exceptions = loadApprovedExceptions(repoRoot);

  // Validate file exists if --file specified
  if (options.file && !fs.existsSync(target)) {
    if (options.json) {
      console.log(JSON.stringify({ error: 'File not found', file: target, max_cc: 0 }));
    } else {
      console.error(`File not found: ${target}`);
    }
    process.exit(1);
  }

  const args = ['cc', target, '-j'];
  const res = spawnSync(radon, args, { cwd: repoRoot, encoding: 'utf8' });

  if (res.status !== 0) {
    if (options.json) {
      console.log(JSON.stringify({ error: 'Radon execution failed', max_cc: 0 }));
    } else {
      console.error('Failed to run radon cc:', res.stderr || res.stdout);
    }
    process.exit(res.status || 1);
  }

  let data;
  try {
    data = JSON.parse(res.stdout || '{}');
  } catch (e) {
    if (options.json) {
      console.log(JSON.stringify({ error: 'Failed to parse radon output', max_cc: 0 }));
    } else {
      console.error('Failed to parse radon JSON output');
      console.error(res.stdout);
    }
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
          approvedExceptions.push({
            file,
            name: item.name,
            line: item.lineno,
            rank,
            complexity: item.complexity,
          });
        } else {
          offenders.push({
            file,
            name: item.name,
            line: item.lineno,
            rank,
            complexity: item.complexity,
          });
        }
      }
    }
  }

  // JSON output mode (for single-file analysis)
  if (options.json) {
    const maxCC = getMaxComplexity(data);
    const violations = offenders.map(({ file, name, line, rank, complexity }) => ({
      file,
      function: name,
      line,
      rank,
      complexity,
    }));

    console.log(
      JSON.stringify({
        max_cc: maxCC,
        file: options.file || target,
        violations,
        approved_exceptions: approvedExceptions.length,
      })
    );
    process.exit(offenders.length > 0 ? 2 : 0);
  }

  // Standard output mode
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
