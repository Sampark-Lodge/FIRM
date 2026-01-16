@echo off
echo ========================================
echo  ShishuKotha Local Server
echo ========================================
echo.
echo Starting server at http://localhost:8000
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

cd /d "%~dp0"
start http://localhost:8000/index.html
py -m http.server 8000
