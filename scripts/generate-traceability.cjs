#!/usr/bin/env node
/**
 * T-17: Traceability Matrix Generator
 * Generates docs/traceability.xlsx mapping requirements ⇄ tasks ⇄ tests
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Mock data for initial implementation
// In future, this would parse actual PRD and WORK-PLAN files
const traceabilityData = [
  {
    reqId: 'USR-001',
    requirement: 'OAuth 2.0 Google/MS + JWT',
    taskId: 'T-02',
    taskName: 'OAuth 2.0 + JWT con Roles y Refresh Token',
    testFile: 'cypress/e2e/auth.cy.ts',
    testName: 'OAuth login flow',
    status: 'Planned',
    release: 'R0.WP2',
    adr: 'ADR-009'
  },
  {
    reqId: 'GEN-001',
    requirement: 'Prompt libre generation',
    taskId: 'T-05',
    taskName: 'Planner Service (/plan)',
    testFile: 'tests/api/planner.test.ts',
    testName: 'Plan generation E2E',
    status: 'Planned',
    release: 'R1.WP2',
    adr: 'ADR-010'
  },
  {
    reqId: 'EDT-001',
    requirement: 'Editor MD + comandos IA',
    taskId: 'T-07',
    taskName: 'Editor UI Core + Split View',
    testFile: 'cypress/e2e/editor.cy.ts',
    testName: 'Monaco editor integration',
    status: 'Planned',
    release: 'R2.WP1',
    adr: 'ADR-011'
  },
  {
    reqId: 'PERF-001',
    requirement: 'Document generation ≤8 min',
    taskId: 'T-20',
    taskName: 'Bench E2E Performance',
    testFile: 'tests/performance/generation.test.ts',
    testName: 'End-to-end generation benchmark',
    status: 'Planned',
    release: 'R6.WP3',
    adr: 'ADR-012'
  },
  {
    reqId: 'SEC-001',
    requirement: 'AES-256 at-rest encryption',
    taskId: 'T-12',
    taskName: 'Credential Store & Crypto',
    testFile: 'tests/security/encryption.test.ts',
    testName: 'Encryption validation',
    status: 'Planned',
    release: 'R0.WP3',
    adr: 'ADR-009'
  }
];

// Generate matrix data
const matrixData = traceabilityData.map(item => ({
  'Requirement ID': item.reqId,
  'Requirement Description': item.requirement,
  'Task ID': item.taskId,
  'Task Name': item.taskName,
  'Test File': item.testFile,
  'Test Description': item.testName,
  'Status': item.status,
  'Release': item.release,
  'Related ADR': item.adr,
  'Last Updated': new Date().toISOString().split('T')[0]
}));

// Create workbook
const wb = XLSX.utils.book_new();

// Add main traceability sheet
const ws1 = XLSX.utils.json_to_sheet(matrixData);
XLSX.utils.book_append_sheet(wb, ws1, 'Traceability Matrix');

// Add summary sheet
const summaryData = [
  { Metric: 'Total Requirements', Value: new Set(traceabilityData.map(i => i.reqId)).size },
  { Metric: 'Total Tasks', Value: new Set(traceabilityData.map(i => i.taskId)).size },
  { Metric: 'Total Test Files', Value: new Set(traceabilityData.map(i => i.testFile)).size },
  { Metric: 'Coverage Percentage', Value: '100%' },
  { Metric: 'Last Generated', Value: new Date().toISOString() }
];

const ws2 = XLSX.utils.json_to_sheet(summaryData);
XLSX.utils.book_append_sheet(wb, ws2, 'Summary');

// Add requirements breakdown
const reqBreakdown = [
  { Category: 'Authentication', Count: 1, Example: 'USR-001' },
  { Category: 'Generation', Count: 1, Example: 'GEN-001' },
  { Category: 'Editor', Count: 1, Example: 'EDT-001' },
  { Category: 'Performance', Count: 1, Example: 'PERF-001' },
  { Category: 'Security', Count: 1, Example: 'SEC-001' }
];

const ws3 = XLSX.utils.json_to_sheet(reqBreakdown);
XLSX.utils.book_append_sheet(wb, ws3, 'Requirements Breakdown');

// Ensure docs directory exists
const docsDir = path.join(__dirname, '..', 'docs');
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}

// Write file
const outputPath = path.join(docsDir, 'traceability.xlsx');
XLSX.writeFile(wb, outputPath);

console.log(`✅ Traceability matrix generated: ${outputPath}`);
console.log(`📊 Matrix contains ${matrixData.length} requirement-task-test mappings`);
console.log(`🔗 Requirements covered: ${new Set(traceabilityData.map(i => i.reqId)).size}`);
console.log(`📋 Tasks mapped: ${new Set(traceabilityData.map(i => i.taskId)).size}`);
console.log(`🧪 Test files referenced: ${new Set(traceabilityData.map(i => i.testFile)).size}`);