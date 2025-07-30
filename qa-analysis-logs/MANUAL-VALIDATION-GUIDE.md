# Manual Validation Guide - RF-003 Cross-Environment Testing

## 🎯 **OBJETIVO**
Validar que nuestros fixes para Python tools detection y MegaLinter execution funcionan correctamente en CMD, PowerShell y WSL.

## 📊 **BASELINE ACTUAL (desde Git Bash)**
```
✅ black: 25.1.0 (venv)
✅ pylint: 3.3.7 (venv)  
✅ prettier: 1.22.22
✅ eslint: 1.22.22
✅ tsc: 1.22.22
✅ megalinter: 8.8.0 (detection)
❌ megalinter execution: failed but no spawn error
```

## 🚀 **STEPS DE VALIDACIÓN MANUAL**

### **PASO 1: CMD Validation**
1. Abrir **Command Prompt** (CMD) como usuario normal
2. Navegar a: `D:\DELL_\Documents\GitHub\AI-Doc-Editor`
3. Ejecutar: `scripts\qa\validation\manual-cmd-test.bat`
4. **Capturar output completo** en archivo: `qa-analysis-logs\manual-cmd-results.log`

**Expected Results:**
- ✅ Python tools (.venv\Scripts\black.exe, pylint.exe) work directly
- ✅ NPM tools (yarn prettier, yarn eslint) work
- ✅ Python tools detected as available in QA CLI
- ❓ MegaLinter execution result

### **PASO 2: PowerShell Validation**  
1. Abrir **PowerShell** (no as Administrator)
2. Navegar a: `D:\DELL_\Documents\GitHub\AI-Doc-Editor`
3. Si hay execution policy error, ejecutar: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`
4. Ejecutar: `.\scripts\qa\validation\manual-powershell-test.ps1`
5. **Capturar output completo** en archivo: `qa-analysis-logs\manual-powershell-results.log`

**Expected Results:**
- ✅ Python tools (.venv\Scripts\black.exe, pylint.exe) work directly
- ✅ NPM tools (yarn prettier, yarn eslint) work  
- ✅ Python tools detected as available in QA CLI
- ❓ MegaLinter execution result

### **PASO 3: WSL Validation**
1. Abrir **WSL** (Ubuntu)
2. Navegar a: `/mnt/d/DELL_/Documents/GitHub/AI-Doc-Editor`
3. Ejecutar: `yarn run cmd qa --fast 2>&1 | tee qa-analysis-logs/manual-wsl-results.log`

**Expected Results from your previous log:**
- ✅ Python tools: black (25.1.0 venv), pylint (3.3.7 venv)
- ✅ NPM tools work
- ❌ MegaLinter: timeout pero eventually completes

## 📋 **VALIDATION MATRIX**

| Tool | CMD | PowerShell | WSL | Status |
|------|-----|------------|-----|--------|
| black | ❓ | ❓ | ✅ | Testing |
| pylint | ❓ | ❓ | ✅ | Testing |
| prettier | ❓ | ❓ | ✅ | Testing |
| eslint | ❓ | ❓ | ✅ | Testing |
| tsc | ❓ | ❓ | ✅ | Testing |
| megalinter (detect) | ❓ | ❓ | ✅ | Testing |
| megalinter (exec) | ❓ | ❓ | ❌ | Testing |

## 🔍 **SPECIFIC CHECKS**

### **Windows Environments (CMD/PowerShell):**
1. **Python Tools Fix**: Verificar que aparezcan como `✅ black: 25.1.0 (venv)` en lugar de `🟡 black: not available`
2. **MegaLinter Fix**: Verificar que NO aparezca `spawn npx ENOENT` error
3. **SharedService**: Todo debe funcionar sin regresiones

### **Key Log Patterns to Look For:**

#### ✅ **SUCCESS Patterns:**
```
✅ black: 25.1.0 (venv)
✅ pylint: 3.3.7 (venv)
✅ megalinter: 8.8.0
MegaLinter execution completed for megalinter in XXXXms
```

#### ❌ **FAILURE Patterns to AVOID:**
```
🟡 black: not available
🟡 pylint: not available  
spawn npx ENOENT
```

## 📝 **DOCUMENTATION**

Para cada environment test, documentar:

1. **Environment Info:**
   - OS Version
   - Shell Version  
   - Working Directory
   - Date/Time

2. **Tool Detection Results:**
   - List all tools with their detection status
   - Note any "not available" tools
   - Record timing information

3. **QA CLI Execution:**
   - Overall success/failure
   - Duration
   - Any error messages
   - MegaLinter specific behavior

4. **Comparison vs Baseline:**
   - What improved vs Git Bash results
   - What still fails
   - New issues vs resolved issues

## 🎯 **SUCCESS CRITERIA**

### **RF-003.4 Performance (ACHIEVED):**
- ✅ SharedToolDetectionService eliminates double detection
- ✅ ~40% performance improvement maintained

### **RF-003.5 Testing Interpretation (TARGET):**
- ✅ Python tools detected consistently across environments  
- ✅ NPM tools maintain compatibility
- ✅ MegaLinter spawn errors resolved
- ❓ MegaLinter execution success (investigation needed)

## 📊 **NEXT STEPS POST-VALIDATION**

Based on results:
1. **If Python tools work in CMD/PowerShell**: ✅ Fix confirmed successful
2. **If MegaLinter execution improves**: ✅ Windows fix partially successful
3. **If there are still issues**: Need targeted debugging for specific environment
4. **Document final state**: Update evidence logs and prepare summary

---

**Ready for execution!** Ejecuta los tests manuales y comparte los logs para análisis final.