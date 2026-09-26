@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Chua co Node.js. Hay cai Node.js 20 tro len tai https://nodejs.org
  pause
  exit /b 1
)
if not exist node_modules npm install
npm run preview
pause
