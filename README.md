# 🎡 Trò Chơi Gọi Tên Ngẫu Nhiên & Điều Khiển Từ Xa (Wheel of Names & Remote Sync)

Ứng dụng web tương tác lớp học hiện đại, hỗ trợ Thầy/Cô tổ chức các hoạt động học tập sôi nổi, gọi tên học sinh ngẫu nhiên, thi trắc nghiệm, bốc thăm và quản lý lớp học dễ dàng. Đặc biệt hỗ trợ **điều khiển từ xa bằng điện thoại/máy tính bảng thông qua mạng Wi-Fi cục bộ (LAN)** mà không cần cài đặt thêm ứng dụng di động nào.

---

## 🌟 Các Tính Năng Nổi Bật

1. **Vòng quay may mắn & Chế độ chọn tên đa dạng:**
   - 🎯 Vòng quay tên trực quan kèm hiệu ứng âm thanh và pháo hoa ăn mừng (Confetti).
   - 🎁 **6 Hộp Quà Bí Ẩn (`mysteryBoxes.js`):** Mở hộp quà may mắn săn Ngôi Sao Hy Vọng x2, hỗ trợ kho phần thưởng tùy chỉnh và chế độ không mở trùng.
   - 🪑 Sơ đồ chỗ ngồi lớp học (Seating Chart): Chọn học sinh trực quan theo vị trí ngồi thực tế (cá nhân, theo bàn, PK 1vs1, đại chiến 4 tổ).

2. **🔐 Trò chơi lớn: Giải Mã Mật Thư 20/11 (`matThuCoordinator.js`, `matThuData.js`):**
   - Hành trình vượt 5 cửa ải tri thức với bộ đề riêng cho 4 khối (6, 7, 8, 9), hỗ trợ quét mã QR theo từng chi đội & áp phích trạm.
   - Bảng xếp hạng trực tiếp đồng bộ thời gian thực qua SSE và xuất giấy chứng nhận điện tử.

3. **🎨 Đấu trí 2 đội: Giải Mã Bí Mật (`giaiMaBiMat.js` & các mô-đun `giaiMa*.js`):**
   - 2 đội thi đấu 10 câu trắc nghiệm qua điện thoại để mở khóa tọa độ tô tranh giấy A1.
   - Tích hợp giám sát nhịp tim trực tiếp (Live Monitor), đồng hồ đếm ngược tô tranh đồng bộ SSE, quét ảnh bài thi (`giaiMaArtworkScanner.js`), in bộ đề/tranh (`giaiMaPrintBundle.js`) và đáp án máy chiếu (`giaiMaTeacherKey.js`).

4. **📱 Điều khiển từ xa qua Wi-Fi (Remote Sync):**
   - Thầy/Cô chỉ cần quét mã QR bằng điện thoại để mở giao diện điều khiển (`remote.html`).
   - Thầy/Cô có thể di chuyển tự do khắp lớp học và bấm nút quay, dừng, chuyển câu hỏi trên điện thoại.
   - Tự động đồng bộ màn hình máy chiếu lớp học tức thời qua kênh truyền dữ liệu thời gian thực (SSE - Server-Sent Events).

5. **❓ Ngân hàng câu hỏi & Quizz tương tác:**
   - Hỗ trợ câu hỏi trắc nghiệm nhanh, đếm ngược thời gian, trợ giúp 50:50 và gọi bạn.
   - Hỗ trợ hiển thị công thức Toán học / Lý / Hóa đẹp mắt chuẩn LaTeX bằng KaTeX.

6. **👥 Quản lý lớp học & danh sách học sinh (`classManager.js`, `students.js`):**
   - Tạo/sửa danh sách học sinh thật theo từng khối, từng lớp; dán văn bản nhanh hoặc nhập/xuất file Excel (`.xlsx`, `.csv`).
   - Lưu trữ an toàn trên trình duyệt của máy tính (LocalStorage).

7. **🚀 Máy chủ siêu nhẹ & Tự phục hồi cổng (Port Fallback):**
   - Server Node.js thuần, không cần cài đặt `node_modules` rườm rà để chạy ứng dụng.
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
├── assets/
│   ├── images/                   # Logo trường THCS Tân Hải & ảnh minh họa giao diện
│   ├── audio/                    # Nhạc nền trình chiếu (thuong-lam-thay-co-oi.mp3)
│   └── vendor/
│       ├── katex/                # Thư viện KaTeX & font chữ toán học chạy offline 100%
│       └── sheetjs/              # Thư viện SheetJS (xlsx.full.min.js) đọc/xuất Excel offline
├── partials/
│   ├── mat-thu-modal.html        # Mẫu HTML modal trò chơi lớn Giải Mã Mật Thư 20/11
│   └── giai-ma-bi-mat-modal.html # Mẫu HTML modal trò chơi Giải Mã Bí Mật & Đấu trường Mobile
├── server/
│   ├── routes/                   # Các bộ định tuyến API riêng biệt (matThu, gmm, gmmQuestionSets, gmmCustomPuzzles, remote)
│   ├── state/                    # Quản lý trạng thái phòng thi (gmmState.js) & hub SSE (sseHub.js)
│   └── utils/                    # Tiện ích HTTP, dò IP LAN, ghép template HTML & lưu trữ JSON đồng bộ 2 chiều (jsonSyncStore.js)
├── scripts/
│   ├── app.js                    # Khởi tạo và điều hướng logic chính của ứng dụng
│   ├── audio.js                  # Hiệu ứng âm thanh trò chơi, nhạc nền & giọng đọc AI
│   ├── classManager.js           # Quản lý lớp học, nhập/chỉnh sửa danh sách học sinh thật
│   ├── confetti.browser.min.js   # Thư viện hiệu ứng pháo hoa (chạy offline)
│   ├── giaiMaArtworkScanner.js   # Chụp/quét và tối ưu ảnh tranh giấy A1 từ điện thoại
│   ├── giaiMaBiMat.js            # Điều phối lõi & liên kết mô-đun Giải Mã Bí Mật
│   ├── giaiMaLiveMonitor.js      # Giám sát kết nối nhịp tim & mở khóa từng đội (SSE)
│   ├── giaiMaPrintBundle.js      # Xuất & in bộ đề, phiếu tô màu và đáp án
│   ├── giaiMaPuzzleColorEditor.js # Chỉnh sửa, khóa màu bút dạ & thanh chọn màu nhanh trên tranh
│   ├── giaiMaPuzzleData.js       # Dữ liệu ma trận tọa độ tranh Giải Mã Bí Mật
│   ├── giaiMaPuzzleDecorators.js # Trang trí và hiển thị chi tiết ma trận tranh
│   ├── giaiMaPuzzleGenerator.js  # Điều phối bộ công cụ sinh ma trận tranh & bộ sưu tập
│   ├── giaiMaPuzzleGeneratorModalDom.js # Giao diện modal thiết kế ma trận tranh tự động
│   ├── giaiMaPuzzleMeshEngine.js # Thuật toán sinh mảnh ghép Đa giác / Pixel / Lục giác tổ ong
│   ├── giaiMaPuzzlePresetStore.js # Lưu trữ bộ sưu tập tranh, khóa màu & cấu hình in ấn
│   ├── giaiMaPuzzleRasterizer.js # Bộ font Pixel-Block Tiếng Việt & chia dòng thông minh
│   ├── giaiMaPuzzleVectorExport.js # Xuất file SVG vector gốc & bản in PDF khổ A1/A0/A4
│   ├── giaiMaTeacherKey.js       # Màn hình đáp án chuẩn & nhạc nền cho giáo viên
│   ├── gmmArtworkHost.js         # Bộ lọc Canvas AI, thu phóng tranh & nhận ảnh giấy trên Máy chiếu
│   ├── gmmBuiltinSetsData.js     # Kho bộ đề mẫu tích hợp sẵn theo chủ đề
│   ├── gmmCoordinator.js         # Điều phối mở/đóng modal chính, chọn vai trò & đặt lại ván mới
│   ├── gmmDecryptJudge.js        # Giai đoạn giải mã tô tranh trên máy chiếu & BGK chấm điểm
│   ├── gmmDocxVariantsExport.js  # Xuất bộ đề thi trắc nghiệm nhiều mã đề ra file Word (.docx)
│   ├── gmmExamVariantsPrint.js   # In đề thi giấy nhiều mã đề (101–104) kèm đáp án
│   ├── gmmExport.js              # Xuất phiếu PDF/Word/PNG/SVG & ảnh kỷ niệm lớp 2K
│   ├── gmmExportTemplates.js     # Tạo mẫu HTML/CSS khổ A4 nằm ngang phục vụ xuất PDF & Microsoft Word
│   ├── gmmHostArena.js           # Giao diện đấu trường 2 đội, đồng hồ đếm ngược & bảng kết quả trên máy chiếu
│   ├── gmmHostSse.js             # Kênh phát SSE phía Máy chiếu, đồng hồ 3-2-1 & quản lý khóa màn hình WakeLock
│   ├── gmmLobbyQr.js             # Phòng chờ mã QR 2 đội & tự động dò địa chỉ IP Wi-Fi LAN
│   ├── gmmMathFormat.js          # Chuẩn hóa ký hiệu & hiển thị công thức Toán/Lý/Hóa bằng KaTeX
│   ├── gmmMobileArtwork.js       # Giao diện tô màu SVG, xem lại câu sai & chụp ảnh giấy trên điện thoại
│   ├── gmmMobileOffline.js       # Lưu LocalStorage & hàng đợi đồng bộ bù đáp án khi mạng Wi-Fi chập chờn
│   ├── gmmMobileQuizUi.js        # Giao diện trả lời 10 câu hỏi, vuốt chạm & nộp bài trên điện thoại
│   ├── gmmMobileSync.js          # Kết nối SSE phía điện thoại học sinh, tự bù độ trễ & khôi phục phiên mới
│   ├── gmmPoolInspector.js       # Xem trước, tìm kiếm & chỉnh sửa nhanh câu hỏi trong kho đề lớn
│   ├── gmmQuestionBank.js        # Bộ 10 câu hỏi chuẩn, trình soạn thảo & nhập/xuất Excel (XLSX)
│   ├── gmmQuestionDocParser.js   # Phân tích văn bản đề thi dán nhanh (Word/PDF/Text)
│   ├── gmmQuestionSetHelpers.js  # Thuật toán bốc câu không trùng, phát hiện câu tương đồng & trộn mã đề
│   ├── gmmQuestionSets.js        # Quản lý ngân hàng bộ đề theo chủ đề & kho câu hỏi lớn
│   ├── gmmServerPuzzlesSync.js   # Đồng bộ 2 chiều bộ sưu tập tranh tự tạo với Server JSON
│   ├── gmmServerSetsSync.js      # Đồng bộ 2 chiều kho bộ đề giáo viên với Server JSON
│   ├── gmmStageTeamUi.js         # Chế độ Sân khấu máy chiếu, đổi tên đội, ẩn/hiện đáp án & nhạc nền
│   ├── gmmTeacherPresets.js      # Lưu/nạp/khôi phục cấu hình mặc định của giáo viên cho tiết sau
│   ├── landing.js                # Giao diện trang chủ và danh mục trò chơi
│   ├── matThuCoordinator.js      # Điều phối trò chơi lớn Giải Mã Mật Thư 20/11 & BXH SSE
│   ├── matThuData.js             # Dữ liệu các trạm, chi đội và bộ đề Giải Mã Mật Thư
│   ├── mysteryBoxes.js           # Trò chơi 6 Hộp Quà Bí Ẩn & kho phần thưởng mở rộng
│   ├── qrcode.min.js             # Thư viện tạo mã QR (chạy offline)
│   ├── quiz.js                   # Logic ngân hàng câu hỏi trắc nghiệm & toán LaTeX
│   ├── remoteSync.js             # Đồng bộ hóa điều khiển từ xa (SSE Client)
│   ├── seatingChart.js           # Sơ đồ chỗ ngồi lớp học (4 tổ thi đua)
│   ├── students.js               # Quản lý danh sách học sinh, nhập/xuất Excel & sao lưu
│   └── wheel.js                  # Thuật toán quay và vẽ vòng quay Canvas
├── styles/                       # Toàn bộ mã định dạng CSS giao diện từng phân hệ
├── tests/                        # Bộ kiểm thử tự động API & SSE bằng node:test
├── tools/                        # Công cụ kiểm tra cú pháp & pre-commit hook
├── index.html                    # Trang giao diện chính (tự ghép partials/ khi phục vụ qua server.js)
├── remote.html                   # Trang giao diện dành riêng cho điện thoại điều khiển
├── server.js                     # Điểm khởi chạy máy chủ Node.js gọn nhẹ điều phối server/routes/
├── start.bat                     # File chạy nhanh cho giáo viên trên Windows
├── mo-tuong-lua-firewall.bat     # Script mở cổng tường lửa Windows cho mạng Wi-Fi LAN
├── eslint.config.mjs             # Cấu hình chuẩn kiểm tra mã nguồn ESLint
├── package.json                  # Cấu hình dự án Node.js & kịch bản test/validate
├── LICENSE                       # Giấy phép mã nguồn mở MIT
└── README.md                     # Tài liệu hướng dẫn sử dụng
```

---

## 🛡️ Giấy Phép & Đóng Góp

Dự án được phát hành dưới giấy phép [MIT License](LICENSE). Thầy/Cô và cộng đồng giáo dục hoàn toàn tự do sử dụng, chỉnh sửa và đóng góp phát triển thêm nhiều tính năng hữu ích cho lớp học.
