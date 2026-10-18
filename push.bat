@echo off
chcp 65001 >nul
title Day Ma Nguon Len GitHub - lop-hoc-vui-nhon
echo ===============================================================
echo   DANG DAY MA NGUON LEN GITHUB: bopvcontact2848/lop-hoc-vui-nhon
echo ===============================================================
echo.
git push -u origin main
echo.
if %errorlevel% equ 0 (
    echo ===============================================================
    echo [THANH CONG] Toan bo ma nguon da duoc day len GitHub thanh cong!
    echo Thay hay mo trinh duyet va tai lai trang repo de kiem tra nhe.
    echo ===============================================================
) else (
    echo ===============================================================
    echo [LUU Y] Neu co cua so trinh duyet hien len, thay vui long bam
    echo "Sign in with your browser" va dang nhap bang bopvcontact2848 nhe!
    echo ===============================================================
)
echo.
pause
