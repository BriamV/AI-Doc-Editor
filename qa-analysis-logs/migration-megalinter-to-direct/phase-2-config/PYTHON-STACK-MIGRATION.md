# Python Stack Migration: MegaLinter → Ruff + Black Direct

## 📚 FUENTE DE VERDAD
**Source**: `BASELINE-EVIDENCE-CAPTURE.json` + ADR-009:29  
**Evidence**: RF-003 failures (Pylint❌, Black❌) + Ruff 10-100x faster than Pylint  
**Target**: Setup Ruff in `pyproject.toml` + resolve current tool issues

## 🔍 CURRENT PYTHON STACK STATUS

### **Existing Configuration Analysis**
```toml
# pyproject.toml - Current Black configuration
[tool.black]
line-length = 100  # ✅ Aligned with PRD RF-003
target-version = ['py38', 'py39', 'py310', 'py311']
include = '\.pyi?$'
```

```ini  
# .pylintrc - Current Pylint configuration
[FORMAT]
max-line-length=100  # ✅ Aligned with PRD RF-003
[DESIGN]
max-complexity=10    # ✅ Aligned with PRD RF-003
```

### **Baseline Issues** (from BASELINE-EVIDENCE-CAPTURE.json:17-23)
- ❌ **error_detection**: "FAILED - MegaLinter dependency missing"
- ❌ **testing_coverage**: "FAILED - Jest execution failed"  
- ❌ **build_dependencies**: "FAILED - template resolution bug"
- ❌ **security_audit**: "FAILED - Snyk execution failed"
- ❌ **design_metrics**: "FAILED - MegaLinter missing"

## 🚀 RUFF INTEGRATION STRATEGY

### **Ruff Configuration Addition**
```toml
# Add to pyproject.toml
[tool.ruff]
# Core settings aligned with existing quality standards
line-length = 100  # Match Black and PRD RF-003
target-version = "py38"

# Select rules equivalent to Pylint (comprehensive coverage)
select = [
    "E",   # pycodestyle errors
    "W",   # pycodestyle warnings  
    "F",   # pyflakes
    "C90", # mccabe complexity
    "I",   # isort
    "N",   # pep8-naming
    "D",   # pydocstyle
    "UP",  # pyupgrade
    "YTT", # flake8-2020
    "ANN", # flake8-annotations
    "S",   # flake8-bandit (security)
    "BLE", # flake8-blind-except
    "FBT", # flake8-boolean-trap
    "B",   # flake8-bugbear
    "A",   # flake8-builtins
    "COM", # flake8-commas
    "C4",  # flake8-comprehensions
    "DTZ", # flake8-datetimez
    "T10", # flake8-debugger
    "DJ",  # flake8-django
    "EM",  # flake8-errmsg
    "EXE", # flake8-executable
    "FA",  # flake8-future-annotations
    "ISC", # flake8-implicit-str-concat
    "ICN", # flake8-import-conventions
    "G",   # flake8-logging-format
    "INP", # flake8-no-pep420
    "PIE", # flake8-pie
    "T20", # flake8-print
    "PYI", # flake8-pyi
    "PT",  # flake8-pytest-style
    "Q",   # flake8-quotes
    "RSE", # flake8-raise
    "RET", # flake8-return
    "SLF", # flake8-self
    "SLOT", # flake8-slots
    "SIM", # flake8-simplify
    "TID", # flake8-tidy-imports
    "TCH", # flake8-type-checking
    "INT", # flake8-gettext
    "ARG", # flake8-unused-arguments
    "PTH", # flake8-use-pathlib
    "TD",  # flake8-todos
    "FIX", # flake8-fixme
    "ERA", # eradicate
    "PD",  # pandas-vet
    "PGH", # pygrep-hooks
    "PL",  # pylint
    "TRY", # tryceratops
    "FLY", # flynt
    "NPY", # numpy
    "AIR", # airflow
    "PERF", # perflint
    "FURB", # refurb
    "LOG", # flake8-logging
    "RUF", # ruff-specific rules
]

# Ignore specific rules that conflict with existing codebase style
ignore = [
    "D100", # Missing docstring in public module
    "D101", # Missing docstring in public class  
    "D102", # Missing docstring in public method
    "D103", # Missing docstring in public function
    "D104", # Missing docstring in public package
    "ANN101", # Missing type annotation for self
    "ANN102", # Missing type annotation for cls
    "COM812", # Trailing comma missing (conflicts with Black)
    "ISC001", # Implicit string concatenation (conflicts with Black)
]

# Complexity settings (match .pylintrc)
[tool.ruff.mccabe]
max-complexity = 10  # Match Pylint configuration

# Import sorting (replace isort)
[tool.ruff.isort]
known-first-party = ["backend", "app"]
force-single-line = true

# Per-file ignores for specific cases
[tool.ruff.per-file-ignores]
"tests/*" = ["S101", "D"]  # Allow assert statements and missing docstrings in tests
"*/migrations/*" = ["D"]   # Allow missing docstrings in migrations
"__init__.py" = ["F401"]   # Allow unused imports in __init__.py files
```

### **Performance Comparison** (from ADR-009:29)
- **Ruff**: 10-100x faster than Pylint
- **Resource Usage**: Native binary vs Python interpreter overhead
- **Coverage**: Comprehensive rule set (replaces Pylint + additional tools)

## 🔧 MIGRATION IMPLEMENTATION

### **Step 1: Add Ruff Configuration**
```bash
# Add [tool.ruff] section to pyproject.toml
# Preserve existing [tool.black] and [tool.pytest.ini_options]
```

### **Step 2: Validate Ruff Installation**
```bash
# Check if Ruff is available in venv
.venv/bin/ruff --version

# If not installed, add to requirements or install
pip install ruff
```

### **Step 3: Test Ruff Configuration**
```bash
# Test Ruff on Python files
ruff check backend/
ruff check backend/app/

# Compare with existing Pylint results
pylint backend/app/ --rcfile=.pylintrc
```

### **Step 4: Integration with DirectLintersOrchestra**
```javascript
// Update wrapper to use Ruff instead of Pylint for Python linting
class RuffWrapper implements IBaseLinterWrapper, ILinterExecutor {
  async execute(files: string[]): Promise<LinterResult> {
    // Direct Ruff execution - 10-100x faster than Pylint
    return this.processService.execute('ruff', ['check', ...files]);
  }
}
```

## 📊 EXPECTED IMPROVEMENTS

### **Performance Gains**
- **Speed**: 10-100x faster linting (Ruff vs Pylint)
- **Startup**: Native binary vs Python interpreter startup
- **Resource**: Lower memory footprint

### **Rule Coverage Enhancement**
- **Current Pylint**: ~200 rules
- **Ruff**: 800+ rules (comprehensive ecosystem coverage)
- **Security**: Built-in security checks (flake8-bandit equivalent)
- **Modern Python**: pyupgrade, future-annotations, etc.

### **RF-003 Compliance Resolution**
- **Before**: design_metrics "FAILED - MegaLinter missing"
- **After**: design_metrics ✅ via Ruff direct execution
- **Quality Thresholds**: Preserved (complexity≤10, line-length≤100)

## 🛡️ BACKWARD COMPATIBILITY

### **Preserve Existing Tools**
- ✅ **Black**: Keep existing formatter (complementary to Ruff)
- ✅ **Pytest**: Keep existing test configuration
- ✅ **Quality Standards**: Maintain PRD RF-003 thresholds

### **Gradual Migration**
1. **Phase 1**: Add Ruff alongside Pylint
2. **Phase 2**: Validate Ruff coverage matches Pylint
3. **Phase 3**: Replace Pylint with Ruff in wrappers
4. **Phase 4**: Remove Pylint dependency

## 🔄 VALIDATION CRITERIA

### **Functional Equivalence**
- ✅ **Complexity**: ≤10 cyclomatic complexity enforced
- ✅ **Line Length**: ≤100 characters per line
- ✅ **Code Quality**: Same or better issue detection
- ✅ **Security**: Enhanced security rule coverage

### **Performance Validation**
- ✅ **Speed Test**: Ruff vs Pylint execution time comparison
- ✅ **Resource Test**: Memory usage comparison
- ✅ **Coverage Test**: Issue detection parity verification

### **Integration Success**
- ✅ **DirectLintersOrchestrator**: Ruff wrapper integration
- ✅ **QA CLI**: `yarn qa` continues working
- ✅ **CI/CD**: Pipeline performance improvement

---
**Evidence**: ADR-009 Ruff 10-100x performance + RF-003 failure resolution  
**Next**: FASE 2.3 Additional Stack Configs  
**Target**: High-performance Python linting with preserved quality standards