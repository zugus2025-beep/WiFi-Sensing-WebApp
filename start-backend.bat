@echo off
title WiFi Sensing — Backend (FastAPI :8000)
cd /d "%~dp0backend"
echo Starting FastAPI backend on http://localhost:8000 ...
echo API Docs: http://localhost:8000/docs
echo WebSocket: ws://localhost:8000/ws/csi
echo.
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
pause
