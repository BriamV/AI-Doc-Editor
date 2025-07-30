@echo off
echo === CMD ENVIRONMENT TEST ===
echo Working Directory: %CD%
echo OS: %OS%
echo.

echo === PYTHON TOOLS PHYSICAL CHECK ===
if exist ".venv\Scripts\black.exe" (
    echo black.exe: EXISTS
) else (
    echo black.exe: NOT FOUND
)

if exist ".venv\Scripts\pylint.exe" (
    echo pylint.exe: EXISTS  
) else (
    echo pylint.exe: NOT FOUND
)
echo.

echo === COMMAND EXECUTION TEST ===
echo Testing black --version:
black --version 2>NUL
if %ERRORLEVEL% == 0 (
    echo   SUCCESS: black command available
) else (
    echo   FAILED: black command not in PATH
)

echo Testing .venv\Scripts\black.exe --version:
.venv\Scripts\black.exe --version 2>NUL
if %ERRORLEVEL% == 0 (
    echo   SUCCESS: Direct black.exe works
) else (
    echo   FAILED: Direct black.exe failed
)

echo Testing pylint --version:
pylint --version 2>NUL  
if %ERRORLEVEL% == 0 (
    echo   SUCCESS: pylint command available
) else (
    echo   FAILED: pylint command not in PATH
)

echo Testing .venv\Scripts\pylint.exe --version:
.venv\Scripts\pylint.exe --version 2>NUL
if %ERRORLEVEL% == 0 (
    echo   SUCCESS: Direct pylint.exe works
) else (
    echo   FAILED: Direct pylint.exe failed  
)
echo.

echo === NODE.JS TOOLCHECKER SIMULATION ===
node scripts\qa\validation\diagnosis-toolchecker.cjs
echo.

echo === QA CLI EXECUTION ===
echo Running: yarn run cmd qa --fast
yarn run cmd qa --fast