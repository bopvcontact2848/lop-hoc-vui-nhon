# 🎡 Trò Chơi Gọi Tên Ngẫu Nhiên & Điều Khiển Từ Xa (Wheel of Names & Remote Sync)

Ứng dụng web tương tác lớp học hiện đại, hỗ trợ Thầy/Cô tổ chức các hoạt động học tập sôi nổi, gọi tên học sinh ngẫu nhiên, thi trắc nghiệm, bốc thăm và quản lý lớp học dễ dàng. Đặc biệt hỗ trợ **điều khiển từ xa bằng điện thoại/máy tính bảng thông qua mạng Wi-Fi cục bộ (LAN)** mà không cần cài đặt thêm ứng dụng di động nào.

---

## 🌟 Các Tính Năng Nổi Bật

1. **Vòng quay may mắn & Chế độ chọn tên đa dạng:**
   - 🎯 Vòng quay tên trực quan kèm hiệu ứng âm thanh và pháo hoa ăn mừng (Confetti).
   - 🎁 Mở hộp quà bí mật, lật thẻ bài may mắn.
   - 🪑 Sơ đồ chỗ ngồi lớp học (Seating Chart): Chọn học sinh trực quan theo vị trí ngồi thực tế.

2. **📱 Điều khiển từ xa qua Wi-Fi (Remote Sync):**
   - Thầy/Cô chỉ cần quét mã QR bằng điện thoại để mở giao diện điều khiển.
   - Thầy/Cô có thể di chuyển tự do khắp lớp học và bấm nút quay, dừng, chuyển câu hỏi trên điện thoại.
   - Tự động đồng bộ màn hình máy chiếu lớp học tức thời qua kênh truyền dữ liệu thời gian thực (SSE - Server-Sent Events).

3. **❓ Ngân hàng câu hỏi & Quizz tương tác:**
   - Hỗ trợ câu hỏi trắc nghiệm nhanh, đếm ngược thời gian.
   - Hỗ trợ hiển thị công thức Toán học / Lý / Hóa đẹp mắt chuẩn LaTeX bằng KaTeX.

4. **👥 Quản lý danh sách học sinh thông minh:**
   - Hỗ trợ lưu trữ theo từng khối, từng lớp.
   - Nhập/Xuất danh sách học sinh từ file Excel (`.xlsx`, `.csv`) nhanh chóng.
   - Lưu trữ an toàn trên trình duyệt của máy tính (LocalStorage).

5. **🚀 Máy chủ siêu nhẹ & Tự phục hồi cổng (Port Fallback):**
   - Server Node.js thuần, không cần cài đặt `node_modules` rườm rà.
   - Cơ chế tự động chuyển cổng thông minh (`3000` ➔ `3001`...) nếu cổng mặc định bị phần mềm khác chiếm dụng.

---

## 🚀 Hướng Dẫn Cài Đặt & Sử Dụng

### Yêu Cầu Hệ Thống:
- Máy tính (Windows / macOS / Linux) đã cài đặt **[Node.js](https://nodejs.org/)** (khuyến nghị phiên bản LTS).

### Cách 1: Khởi động nhanh bằng 1 cú nhấp chuột (Dành cho Windows):
- Nhấp đúp chuột vào file `start.bat`. Hệ thống sẽ tự động khởi động server và mở trình duyệt web.

### Cách 2: Khởi động bằng dòng lệnh (Terminal / PowerShell):
1. Mở cửa sổ dòng lệnh tại thư mục dự án.
2. Khởi động máy chủ:
   ```bash
   npm start
   # hoặc:
   node server.js
   ```
3. Mở trình duyệt web và truy cập:
   - **Màn hình chính trên máy tính/máy chiếu:** [http://localhost:3000](http://localhost:3000)
   - **Điều khiển trên điện thoại:** Mở màn hình chính, bấm nút kết nối để quét mã QR bằng camera điện thoại (yêu cầu máy tính và điện thoại kết nối chung 1 mạng Wi-Fi).

---

## 📂 Cấu Trúc Thư Mục Dự Án

```
├── assets/                 # Hình ảnh, âm thanh, biểu tượng
├── scripts/
│   ├── app.js              # Khởi tạo và điều hướng logic chính của ứng dụng
│   ├── audio.js            # Hiệu ứng âm thanh trò chơi (quay, vỗ tay, nhạc nền)
│   ├── landing.js          # Giao diện trang chủ và giới thiệu
│   ├── quiz.js             # Logic ngân hàng câu hỏi trắc nghiệm & giải toán LaTeX
│   ├── remoteSync.js       # Đồng bộ hóa điều khiển từ xa (SSE Client)
│   ├── seatingChart.js     # Sơ đồ chỗ ngồi lớp học
│   ├── students.js         # Quản lý danh sách học sinh, nhập/xuất Excel
│   └── wheel.js            # Thuật toán quay và vẽ vòng quay Canvas
├── styles/                 # Toàn bộ mã định dạng CSS giao diện
├── index.html              # Trang giao diện chính (Hiển thị lớp học / Máy chiếu)
├── remote.html             # Trang giao diện dành riêng cho điện thoại điều khiển
├── server.js               # Máy chủ Node.js phục vụ file tĩnh & kênh đồng bộ SSE
├── start.bat               # File chạy nhanh cho giáo viên trên Windows
├── package.json            # Cấu hình dự án Node.js
└── README.md               # Tài liệu hướng dẫn sử dụng
```

---

## 🛡️ Giấy Phép & Đóng Góp

Dự án được phát hành dưới giấy phép [MIT License](LICENSE). Thầy/Cô và cộng đồng giáo dục hoàn toàn tự do sử dụng, chỉnh sửa và đóng góp phát triển thêm nhiều tính năng hữu ích cho lớp học.
