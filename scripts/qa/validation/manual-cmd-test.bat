@echo off
echo ==========================================
echo   MANUAL CMD ENVIRONMENT VALIDATION
echo ==========================================
echo Date: %DATE% %TIME%
echo Working Directory: %CD%
echo.

echo === STEP 1: PHYSICAL FILE VERIFICATION ===
echo Checking Python tools in .venv\Scripts\:
if exist ".venv\Scripts\black.exe" (
    echo   ✅ black.exe found
) else (
    echo   ❌ black.exe NOT FOUND
)

if exist ".venv\Scripts\pylint.exe" (
    echo   ✅ pylint.exe found
) else (
    echo   ❌ pylint.exe NOT FOUND
)
echo.

echo === STEP 2: DIRECT COMMAND TESTS ===
echo Testing direct Python tool execution:

echo Testing: .venv\Scripts\black.exe --version
.venv\Scripts\black.exe --version
if %ERRORLEVEL% == 0 (
    echo   ✅ black.exe direct execution: SUCCESS
) else (
    echo   ❌ black.exe direct execution: FAILED
)
echo.

echo Testing: .venv\Scripts\pylint.exe --version
.venv\Scripts\pylint.exe --version
if %ERRORLEVEL% == 0 (
    echo   ✅ pylint.exe direct execution: SUCCESS
) else (
    echo   ❌ pylint.exe direct execution: FAILED
)
echo.

echo === STEP 3: NPM TOOLS TEST ===
echo Testing NPM tools via yarn:

echo Testing: yarn prettier --version
yarn prettier --version
if %ERRORLEVEL% == 0 (
    echo   ✅ yarn prettier: SUCCESS
) else (
    echo   ❌ yarn prettier: FAILED
)
echo.

echo Testing: yarn eslint --version
yarn eslint --version
if %ERRORLEVEL% == 0 (
    echo   ✅ yarn eslint: SUCCESS
) else (
    echo   ❌ yarn eslint: FAILED
)
echo.

echo === STEP 4: MEGALINTER COMMAND TEST ===
echo Testing MegaLinter command variations:

echo Testing: npx mega-linter-runner --version
npx mega-linter-runner --version
if %ERRORLEVEL% == 0 (
    echo   ✅ npx direct: SUCCESS
) else (
    echo   ❌ npx direct: FAILED
)
echo.

echo Testing: cmd /c npx mega-linter-runner --version
cmd /c npx mega-linter-runner --version
if %ERRORLEVEL% == 0 (
    echo   ✅ cmd /c npx: SUCCESS
) else (
    echo   ❌ cmd /c npx: FAILED
)
echo.

echo === STEP 5: QA CLI EXECUTION ===
echo Running full QA CLI test (this may take 1-2 minutes):
echo Command: yarn run cmd qa --fast
echo.

yarn run cmd qa --fast

echo.
echo === VALIDATION COMPLETE ===
echo Check the output above for:
echo 1. Python tools detection (should show black/pylint as available)
echo 2. NPM tools detection (should show prettier/eslint as available) 
echo 3. MegaLinter execution result
echo.
echo Press any key to continue...
pause > nul