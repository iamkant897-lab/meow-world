@echo off
chcp 65001 >nul
echo.
echo  [Meow World] Starting...
echo.

echo [1/2] Starting Backend...
cd /d "C:\Users\Public\meow-world\backend"
if not exist "node_modules" (
  echo Installing backend packages...
  call npm install
)
start "Meow Backend" cmd /k "node server.js"
timeout /t 2 /nobreak >nul

echo [2/2] Starting Frontend...
cd /d "C:\Users\Public\meow-world\frontend"
if not exist "node_modules" (
  echo Installing frontend packages...
  call npm install
)
start "Meow Frontend" cmd /k "npm run dev"
timeout /t 3 /nobreak >nul

echo.
echo  Done! Opening http://localhost:5173
echo.
start http://localhost:5173
