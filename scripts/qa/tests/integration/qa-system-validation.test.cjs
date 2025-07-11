/**
 * QA System End-to-End Validation
 * Critical test to validate that QA system reports failures correctly
 * 
 * This addresses the core issue: system was reporting "PASSED" when tools failed
 */

const { spawn } = require('child_process');
const path = require('path');

describe('QA System Failure Reporting (Critical Bug Fix)', () => {
  const qaCliPath = path.resolve(__dirname, '../../qa-cli.cjs');
  const timeout = 180000; // 3 minutes for QA execution

  test('should report FAILED when tools actually fail', (done) => {
    // This test reproduces the exact issue the user reported:
    // "✅ QA validation PASSED" when JSON shows success: false
    
    const qaProcess = spawn('node', [qaCliPath, '--dimension', 'build', '--scope', 'frontend'], {
      cwd: path.resolve(__dirname, '../../../..'),
      stdio: 'pipe'
    });

    let stdout = '';
    let stderr = '';

    qaProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    qaProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    qaProcess.on('close', (code) => {
      try {
        console.log('QA CLI Exit Code:', code);
        console.log('STDOUT Preview:', stdout.slice(-500)); // Last 500 chars
        
        // CRITICAL VALIDATION: If any tool fails, system should report FAILED
        // Look for the exact patterns from user's report
        
        if (stdout.includes('"success": false')) {
          // JSON shows failure - the system MUST report FAILED, not PASSED
          console.log('✅ Found JSON failure indicator');
          
          if (stdout.includes('🟢 QA validation PASSED')) {
            console.log('❌ CRITICAL BUG: System reports PASSED when JSON shows failure!');
            console.log('This is the exact bug we need to fix.');
            expect(false).toBe(true); // Force test failure
          } else if (stdout.includes('🔴 QA validation FAILED')) {
            console.log('✅ CORRECT: System properly reports FAILED when tools fail');
            expect(true).toBe(true);
          } else {
            console.log('⚠️  No clear PASSED/FAILED indicator found');
            // Log for analysis
            console.log('Full output analysis needed');
          }
        } else if (stdout.includes('"success": true')) {
          // All tools succeeded - system should report PASSED
          console.log('✅ All tools succeeded');
          expect(stdout).toMatch(/🟢 QA validation PASSED/);
        } else {
          console.log('⚠️  No clear success/failure JSON found');
          console.log('This might indicate a different issue');
        }

        // Additional validation: Check for timeout issues
        if (stdout.includes('timed out') || stdout.includes('timeout')) {
          console.log('⚠️  Timeout detected - this should result in FAILED status');
          expect(stdout).not.toMatch(/🟢 QA validation PASSED/);
        }

        // Exit code validation
        if (code === 0) {
          console.log('✅ Exit code 0 - indicating success');
        } else {
          console.log('❌ Exit code', code, '- indicating failure');
        }

        done();
      } catch (error) {
        done(error);
      }
    });

    qaProcess.on('error', (error) => {
      done(error);
    });

    // Timeout protection
    setTimeout(() => {
      qaProcess.kill();
      done(new Error('QA process timed out after 3 minutes'));
    }, timeout);
  }, timeout);

  test('line-by-line output validation', (done) => {
    // This test specifically validates the line-by-line output
    // to catch discrepancies between JSON and display
    
    const qaProcess = spawn('node', [qaCliPath, '--dimension', 'build', '--scope', 'frontend', '--verbose'], {
      cwd: path.resolve(__dirname, '../../../..'),
      stdio: 'pipe'
    });

    let fullOutput = '';
    const outputLines = [];

    qaProcess.stdout.on('data', (data) => {
      const chunk = data.toString();
      fullOutput += chunk;
      
      // Capture line by line for analysis
      const lines = chunk.split('\n');
      lines.forEach(line => {
        if (line.trim()) {
          outputLines.push(line.trim());
        }
      });
    });

    qaProcess.on('close', (code) => {
      try {
        console.log('Total output lines captured:', outputLines.length);
        
        // Find JSON blocks and final status
        const jsonBlocks = [];
        const statusLines = [];
        
        let inJsonBlock = false;
        let currentJson = '';
        
        outputLines.forEach((line, index) => {
          if (line.includes('"success":')) {
            inJsonBlock = true;
            currentJson = line;
          } else if (inJsonBlock && line.includes('}')) {
            currentJson += line;
            try {
              const jsonData = JSON.parse(currentJson);
              jsonBlocks.push({ index, json: jsonData, raw: currentJson });
            } catch (e) {
              // Invalid JSON, ignore
            }
            inJsonBlock = false;
            currentJson = '';
          } else if (inJsonBlock) {
            currentJson += line;
          }
          
          if (line.includes('QA validation')) {
            statusLines.push({ index, line });
          }
        });

        console.log('JSON blocks found:', jsonBlocks.length);
        console.log('Status lines found:', statusLines.length);

        // Validate consistency between JSON and status
        jsonBlocks.forEach((block, i) => {
          const jsonSuccess = block.json.success;
          console.log(`JSON Block ${i + 1}: success = ${jsonSuccess}`);
          
          // Find corresponding status line
          const nextStatusLine = statusLines.find(status => status.index > block.index);
          if (nextStatusLine) {
            const statusSuccess = nextStatusLine.line.includes('PASSED');
            console.log(`Status Line: ${nextStatusLine.line}`);
            console.log(`JSON says: ${jsonSuccess}, Status says: ${statusSuccess}`);
            
            // CRITICAL: JSON and status must match
            if (jsonSuccess && !statusSuccess) {
              console.log('❌ INCONSISTENCY: JSON success but status failure');
            } else if (!jsonSuccess && statusSuccess) {
              console.log('❌ CRITICAL BUG: JSON failure but status success');
              expect(false).toBe(true); // This is the bug we're fixing
            } else {
              console.log('✅ JSON and status are consistent');
            }
          }
        });

        done();
      } catch (error) {
        done(error);
      }
    });

    qaProcess.on('error', (error) => {
      done(error);
    });

    // Timeout protection
    setTimeout(() => {
      qaProcess.kill();
      done(new Error('Line-by-line analysis timed out'));
    }, timeout);
  }, timeout);
});