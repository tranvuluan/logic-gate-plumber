@echo off
chcp 65001 > nul
title LOGIC GATE PLUMBER - LOCAL PLAYTEST SERVER
echo ============================================================
echo   ⚡ LOGIC GATE PLUMBER - CRAZYGAMES EDITION ⚡
echo ============================================================
echo.
echo Đang khởi động Web Server cục bộ tại http://localhost:8080...
echo.

cd /d "%~dp0"
if exist "logic-gate-plumber\dist" (
    cd "logic-gate-plumber\dist"
) else if exist "dist" (
    cd "dist"
)

start "" http://localhost:8080/index.html

python -m http.server 8080
if %errorlevel% neq 0 (
    echo.
    echo Khởi động Python server không thành công, đang thử mở trực tiếp file HTML...
    start "" "%~dp0CHOI_THU_TRUC_TIEP.html"
)
pause
