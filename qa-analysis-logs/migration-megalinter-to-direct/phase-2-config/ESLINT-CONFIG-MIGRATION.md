# ESLint Configuration Migration: MegaLinter → Native

## 📚 FUENTE DE VERDAD
**Source**: `.mega-linter.yml` lines 38-52  
**Target**: `eslint.config.js` enhancement  
**Objective**: Extract MegaLinter ESLint rules → Native ESLint flat config

## 🔍 REGLAS EXTRAÍDAS DEL MEGALINTER

### **JavaScript/TypeScript Rules** (from .mega-linter.yml:39-52)
```yaml
# MegaLinter Configuration
JAVASCRIPT_ES_ARGUMENTS:
  - --no-config-lookup
  - --max-warnings=0
  - --rule=complexity:[error,10]        # Complejidad ciclomática ≤10
  - --rule=max-lines:[error,212]        # LOC por archivo ≤212  
  - --rule=max-len:[error,{code:100}]   # Longitud línea ≤100

TYPESCRIPT_ES_ARGUMENTS:
  - --no-config-lookup
  - --max-warnings=0  
  - --rule=complexity:[error,10]        # Same rules for TS
  - --rule=max-lines:[error,212]
  - --rule=max-len:[error,{code:100}]
```

### **Current ESLint Config Gap Analysis**
**Missing in current `eslint.config.js`**:
- ❌ **Complexity rule**: `complexity: ['error', 10]`
- ❌ **Max lines rule**: `max-lines: ['error', 212]`  
- ❌ **Max length rule**: `max-len: ['error', { code: 100 }]`
- ❌ **Zero warnings**: `--max-warnings=0` enforcement
- ❌ **.cjs files support**: No configuration for CommonJS files

## 🛠️ ENHANCED ESLINT CONFIGURATION

### **New Configuration Structure**
```javascript
import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import react from 'eslint-plugin-react';
import prettier from 'eslint-plugin-prettier';

export default [
  {
    ignores: [
      'node_modules', 'dist', 'coverage', 'build', 'release',
      'cypress/downloads', 'cypress/screenshots', 'cypress/videos',
      '*.min.js', '*.min.css', 'electron/index.cjs',
      'vite.config.ts', 'jest.config.js', 'eslint.config.js', 
      'tailwind.config.cjs'
    ],
  },
  
  // NEW: CommonJS files configuration (.cjs)
  {
    files: ['**/*.cjs'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: { ...globals.node, ...globals.commonjs },
      sourceType: 'commonjs',
    },
    rules: {
      ...js.configs.recommended.rules,
      // MegaLinter extracted rules
      'complexity': ['error', 10],              // From mega-linter.yml:42
      'max-lines': ['error', 212],              // From mega-linter.yml:43  
      'max-len': ['error', { code: 100 }],      // From mega-linter.yml:44
      'prettier/prettier': 'error',
    },
    plugins: {
      prettier: prettier,
    },
  },
  
  // ENHANCED: TypeScript/TSX files with MegaLinter rules
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parser: tsparser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      react: react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      prettier: prettier,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      
      // Existing React rules
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'no-undef': ['off', { ignoreTypeValues: true }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      
      // NEW: MegaLinter extracted rules
      'complexity': ['error', 10],              // From mega-linter.yml:50
      'max-lines': ['error', 212],              // From mega-linter.yml:51
      'max-len': ['error', { code: 100 }],      // From mega-linter.yml:52
      'prettier/prettier': 'error',
    },
    settings: {
      react: { version: 'detect' },
    },
  },
];
```

## 📊 MIGRATION VALIDATION

### **Rules Coverage Verification**
```bash
# Test .cjs files processing (was failing before)
npx eslint scripts/qa/**/*.cjs --config eslint.config.js

# Verify complexity rule enforcement  
npx eslint --rule "complexity: [error, 10]" **/*.{ts,tsx,cjs}

# Verify max-lines rule enforcement
npx eslint --rule "max-lines: [error, 212]" **/*.{ts,tsx,cjs}

# Verify max-len rule enforcement  
npx eslint --rule "max-len: [error, {code: 100}]" **/*.{ts,tsx,cjs}
```

### **Zero Warnings Enforcement**
```bash
# Equivalent to --max-warnings=0 from MegaLinter
npx eslint . --max-warnings 0
```

## 🎯 SUCCESS CRITERIA

### **Functional Equivalence**
- ✅ **Complexity**: ≤10 cyclomatic complexity enforced
- ✅ **Max Lines**: ≤212 lines per file enforced  
- ✅ **Max Length**: ≤100 characters per line enforced
- ✅ **Zero Warnings**: All warnings treated as errors
- ✅ **.cjs Processing**: CommonJS files properly linted

### **Performance Improvement**
- ✅ **Direct Execution**: No Docker overhead
- ✅ **Native Speed**: ESLint flat config performance
- ✅ **Resource Usage**: <100MB vs 4GB MegaLinter Docker

### **Bug Resolution**
- ✅ **ESLint Flat Config**: MegaLinter bug #3570 resolved
- ✅ **.cjs Support**: Previously failing files now processed
- ✅ **No Config Lookup**: `--no-config-lookup` behavior preserved

## 🔄 IMPLEMENTATION STEPS

### **Step 1: Backup Current Config**
```bash
cp eslint.config.js eslint.config.js.backup
```

### **Step 2: Apply Enhanced Configuration**
- Add .cjs files configuration block
- Add MegaLinter extracted rules to existing blocks
- Preserve all existing React/TypeScript rules

### **Step 3: Validation Testing**
```bash
# Test enhanced configuration  
npx eslint . --max-warnings 0

# Specific .cjs testing (was failing before)
npx eslint scripts/qa/qa-cli.cjs
npx eslint scripts/qa/core/**/*.cjs
```

### **Step 4: Integration with QA CLI**
- Update DirectLintersOrchestrator to use enhanced config
- Remove MegaLinter ESLint wrapper dependency
- Preserve external `yarn qa` interface

---
**Evidence**: .mega-linter.yml:38-52 rules extraction  
**Next**: FASE 2.2 Python Stack Migration  
**Target**: Native ESLint with preserved quality thresholds + .cjs support