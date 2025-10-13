#!/usr/bin/env node
/**
 * Cross-Platform Server Stopper
 *
 * Gracefully stops development servers running on specific ports:
 * - Frontend (Vite): Port 5173
 * - Backend (FastAPI/uvicorn): Port 8000
 *
 * Usage:
 *   node scripts/stop-servers.cjs
 *   yarn all:stop
 *
 * Features:
 * - Cross-platform detection (Windows/macOS/Linux)
 * - Graceful process termination
 * - Clear console output with success/error messages
 * - Proper exit codes for automation
 */

const { spawnSync } = require('child_process');
const { platform } = require('os');

class ServerStopper {
  constructor() {
    this.isWin = process.platform === 'win32';
    this.isMac = process.platform === 'darwin';
    this.isLinux = process.platform === 'linux';

    // Ports to check and kill
    this.ports = [
      { port: 5173, name: 'Frontend (Vite)' },
      { port: 8000, name: 'Backend (FastAPI)' },
    ];

    // Logging
    this.verbose = process.env.VERBOSE === '1' || process.argv.includes('--verbose');
  }

  /**
   * Enhanced logging with timestamps
   */
  log(level, message) {
    const timestamp = new Date().toISOString().substr(11, 8);
    const prefix = `[${timestamp}]`;

    switch (level) {
      case 'error':
        console.error(`${prefix} ❌ ERROR: ${message}`);
        break;
      case 'warn':
        console.warn(`${prefix} ⚠️  WARNING: ${message}`);
        break;
      case 'success':
        console.log(`${prefix} ✅ SUCCESS: ${message}`);
        break;
      case 'info':
        console.log(`${prefix} ℹ️  INFO: ${message}`);
        break;
      case 'debug':
        if (this.verbose) {
          console.log(`${prefix} 🔍 DEBUG: ${message}`);
        }
        break;
      default:
        console.log(`${prefix} ${message}`);
    }
  }

  /**
   * Find processes using a specific port on Windows
   */
  findWindowsProcesses(port) {
    try {
      // Use netstat to find processes listening on the port
      const netstatResult = spawnSync('netstat', ['-ano'], {
        encoding: 'utf8',
        stdio: 'pipe',
      });

      if (netstatResult.status !== 0) {
        this.log('debug', `netstat command failed with status ${netstatResult.status}`);
        return [];
      }

      const output = netstatResult.stdout;
      const lines = output.split('\n');
      const pids = new Set();

      // Parse netstat output to find PIDs (support both IPv4 and IPv6)
      for (const line of lines) {
        // Check for IPv4 (0.0.0.0:port, 127.0.0.1:port) and IPv6 ([::]:port, [::1]:port)
        if (
          line.includes(`0.0.0.0:${port}`) ||
          line.includes(`127.0.0.1:${port}`) ||
          line.includes(`[::]:${port}`) ||
          line.includes(`[::1]:${port}`)
        ) {
          const parts = line.trim().split(/\s+/);
          const pid = parts[parts.length - 1];
          if (pid && /^\d+$/.test(pid)) {
            pids.add(pid);
          }
        }
      }

      this.log('debug', `Found ${pids.size} process(es) on port ${port}: ${[...pids].join(', ')}`);
      return [...pids];
    } catch (error) {
      this.log('error', `Failed to find processes on Windows: ${error.message}`);
      return [];
    }
  }

  /**
   * Find processes using a specific port on Unix (Linux/Mac)
   */
  findUnixProcesses(port) {
    try {
      // Use lsof to find processes listening on the port
      const lsofResult = spawnSync('lsof', ['-ti', `:${port}`], {
        encoding: 'utf8',
        stdio: 'pipe',
      });

      if (lsofResult.status !== 0) {
        this.log('debug', `lsof command returned status ${lsofResult.status} (may mean no processes)`);
        return [];
      }

      const output = lsofResult.stdout.trim();
      if (!output) {
        return [];
      }

      const pids = output.split('\n').filter(pid => pid && /^\d+$/.test(pid));
      this.log('debug', `Found ${pids.length} process(es) on port ${port}: ${pids.join(', ')}`);
      return pids;
    } catch (error) {
      this.log('error', `Failed to find processes on Unix: ${error.message}`);
      return [];
    }
  }

  /**
   * Kill a process by PID on Windows
   */
  killWindowsProcess(pid) {
    try {
      const result = spawnSync('taskkill', ['/PID', pid, '/F'], {
        encoding: 'utf8',
        stdio: 'pipe',
      });

      if (result.status === 0) {
        this.log('debug', `Successfully killed process ${pid}`);
        return true;
      } else {
        // Check if error is due to process not existing (already terminated)
        const stderr = result.stderr || '';
        if (stderr.includes('not found') || stderr.includes('no se encontr')) {
          this.log('debug', `Process ${pid} already terminated`);
          return true; // Consider it a success if already gone
        }
        this.log('warn', `Failed to kill process ${pid}: ${stderr || 'Unknown error'}`);
        return false;
      }
    } catch (error) {
      this.log('error', `Error killing process ${pid}: ${error.message}`);
      return false;
    }
  }

  /**
   * Kill a process by PID on Unix (Linux/Mac)
   */
  killUnixProcess(pid) {
    try {
      // Try SIGTERM first (graceful)
      const termResult = spawnSync('kill', ['-TERM', pid], {
        encoding: 'utf8',
        stdio: 'pipe',
      });

      if (termResult.status === 0) {
        this.log('debug', `Sent SIGTERM to process ${pid}`);

        // Wait a moment and verify if process is still running
        const checkResult = spawnSync('kill', ['-0', pid], {
          encoding: 'utf8',
          stdio: 'pipe',
        });

        if (checkResult.status !== 0) {
          this.log('debug', `Process ${pid} terminated gracefully`);
          return true;
        }

        // If still running, use SIGKILL (force)
        this.log('debug', `Process ${pid} still running, sending SIGKILL...`);
        const killResult = spawnSync('kill', ['-9', pid], {
          encoding: 'utf8',
          stdio: 'pipe',
        });

        if (killResult.status === 0) {
          this.log('debug', `Successfully killed process ${pid} with SIGKILL`);
          return true;
        }
      }

      this.log('warn', `Failed to kill process ${pid}`);
      return false;
    } catch (error) {
      this.log('error', `Error killing process ${pid}: ${error.message}`);
      return false;
    }
  }

  /**
   * Stop servers on a specific port
   */
  stopServerOnPort(port, serverName) {
    this.log('info', `Checking for ${serverName} on port ${port}...`);

    // Find processes
    const pids = this.isWin ? this.findWindowsProcesses(port) : this.findUnixProcesses(port);

    if (pids.length === 0) {
      this.log('info', `No processes found on port ${port} (${serverName})`);
      return { success: true, killed: 0 };
    }

    this.log('info', `Found ${pids.length} process(es) for ${serverName}`);

    // Kill processes
    let killed = 0;
    for (const pid of pids) {
      const success = this.isWin ? this.killWindowsProcess(pid) : this.killUnixProcess(pid);
      if (success) {
        killed++;
      }
    }

    if (killed === pids.length) {
      this.log('success', `Stopped ${killed} process(es) for ${serverName}`);
      return { success: true, killed };
    } else {
      this.log('warn', `Stopped ${killed}/${pids.length} process(es) for ${serverName}`);
      return { success: false, killed };
    }
  }

  /**
   * Main execution
   */
  execute() {
    console.log('========================================');
    console.log('🛑 Stopping Development Servers');
    console.log(`Platform: ${this.isWin ? 'Windows' : this.isMac ? 'macOS' : 'Linux'}`);
    console.log('========================================\n');

    const results = [];

    // Stop servers on all configured ports
    for (const { port, name } of this.ports) {
      const result = this.stopServerOnPort(port, name);
      results.push(result);
      console.log(''); // Add spacing between port checks
    }

    // Calculate totals
    const totalKilled = results.reduce((sum, r) => sum + r.killed, 0);
    const hadErrors = results.some(r => !r.success);

    // Final summary
    console.log('========================================');
    if (totalKilled === 0) {
      this.log('info', 'No development servers were running');
      console.log('========================================');
      return 0;
    } else if (!hadErrors) {
      this.log('success', `Successfully stopped ${totalKilled} process(es)`);
      console.log('========================================');
      return 0;
    } else {
      this.log('warn', `Stopped ${totalKilled} process(es) with some errors`);
      console.log('========================================');
      return 1;
    }
  }
}

// Execute if called directly
if (require.main === module) {
  const stopper = new ServerStopper();
  const exitCode = stopper.execute();
  process.exit(exitCode);
}

module.exports = ServerStopper;
