@echo off
chcp 65001 >nul
title Mở Tường Lửa Windows (Firewall) Cho Ứng Dụng Học Tập

:: Kiểm tra quyền Quản trị viên (Administrator)
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [THÔNG BÁO] Đang yêu cầu quyền Administrator để mở cổng kết nối cho điện thoại...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

cls
echo ==============================================================================
echo       CẤU HÌNH TƯỜNG LỬA WINDOWS (FIREWALL) CHO ỨNG DỤNG LỚP HỌC
echo ==============================================================================
echo.
echo [1/2] Đang xóa các quy tắc cũ xung đột...
netsh advfirewall firewall delete rule name="LopHocVuiNhon_NodeJS_Port3000" >nul 2>&1
netsh advfirewall firewall delete rule name="NodeJS WebApp Port 3000" >nul 2>&1

echo [2/2] Đang tạo quy tắc cho phép kết nối cổng 3000 (Mạng Riêng tư & Công cộng)...
netsh advfirewall firewall add rule name="LopHocVuiNhon_NodeJS_Port3000" dir=in action=allow protocol=TCP localport=3000 profile=any >nul

if %errorlevel% equ 0 (
    echo.
    echo ==============================================================================
    echo  ✅ THÀNH CÔNG! ĐÃ MỞ CỔNG 3000 CHO MỌI ĐIỆN THOẠI KẾT NỐI!
    echo.
    echo  👉 Giờ đây học sinh / giáo viên quét mã QR trên điện thoại sẽ vào được ngay,
    echo     không còn bị chặn bởi Tường lửa Windows (Firewall) nữa.
    echo ==============================================================================
) else (
    echo.
    echo ❌ Có lỗi xảy ra trong quá trình cấu hình tường lửa.
)

echo.
pause
