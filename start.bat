@echo off
chcp 65001 >nul
title Tro Choi Goi Ten Ngau Nhien - Local Server
echo ===============================================================
echo   VONG QUAY MAY MAN - TRO CHOI GOI TEN NGAU NHIEN
echo   He thong dang khoi dong may chu cuc bo (Local Server)...
echo ===============================================================

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [LOI] May tinh cua thay/co chua cai dat Node.js!
    echo Vui long truy cap https://nodejs.org de tai va cai dat Node.js, sau do thu lai.
    pause
    exit /b
)

start "" http://localhost:3000
node server.js
pause
