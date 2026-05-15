@echo off
title WiFi Sensing — Frontend (Next.js :3000)
cd /d "%~dp0frontend"
echo Starting Next.js frontend on http://localhost:3000 ...
echo.
pnpm dev
pause
