/**
 * HỆ THỐNG DỮ LIỆU CÂU HỎI & CẤU TRÚC 5 CỬA ẢI - GIẢI MÃ MẬT THƯ 20/11
 * Dành riêng cho 4 Khối THCS: Khối 6, Khối 7, Khối 8, Khối 9
 * Trường THCS Tân Hải
 */

(function () {
  'use strict';

  // Danh sách các lớp mặc định cho 4 khối (10 lớp mỗi khối = 40 Chi đội)
  // Khối 6, 7, 8, 9: Mỗi khối gồm các lớp A1 đến A6 và B1 đến B4
  const DEFAULT_CLASSES = {
    6: ['6A1', '6A2', '6A3', '6A4', '6A5', '6A6', '6B1', '6B2', '6B3', '6B4'],
    7: ['7A1', '7A2', '7A3', '7A4', '7A5', '7A6', '7B1', '7B2', '7B3', '7B4'],
    8: ['8A1', '8A2', '8A3', '8A4', '8A5', '8A6', '8B1', '8B2', '8B3', '8B4'],
    9: ['9A1', '9A2', '9A3', '9A4', '9A5', '9A6', '9B1', '9B2', '9B3', '9B4']
  };

  // Cấu hình 5 Cửa Ải tiêu chuẩn
  const STAGES_CONFIG = [
    {
      id: 1,
      name: 'Dấu ấn ngày 20/11',
      icon: '📚',
      code: 'TRI',
      badgeColor: '#0284c7',
      desc: '5 câu trắc nghiệm về lịch sử và truyền thống Ngày Nhà giáo Việt Nam.',
      rewardText: 'Mảnh mật mã: TRI'
    },
    {
      id: 2,
      name: 'Ô chữ bí ẩn',
      icon: '🧩',
      code: 'ÂN',
      badgeColor: '#16a34a',
      desc: '5 câu hỏi giải ô chữ về thầy cô, mái trường. Từ khóa hàng dọc: NGƯỜI THẦY.',
      rewardText: 'Mảnh mật mã: ÂN'
    },
    {
      id: 3,
      name: 'Nhận diện môn học',
      icon: '🔬',
      code: 'THẦY',
      badgeColor: '#ea580c',
      desc: 'Quan sát biểu tượng & gợi ý xác định 5 môn học: Toán, Văn, Anh, KHTN, Lịch sử & Địa lí.',
      rewardText: 'Mảnh mật mã: THẦY'
    },
    {
      id: 4,
      name: 'Giải mã bí mật',
      icon: '🔐',
      code: 'CÔ',
      badgeColor: '#9333ea',
      desc: 'Giải 3 mật thư bằng quy luật số học, dịch chuyển chữ cái và mật mã logic.',
      rewardText: 'Mảnh mật mã: CÔ'
    },
    {
      id: 5,
      name: 'Kho báu tri ân',
      icon: '🎁',
      code: '20/11',
      badgeColor: '#dc2626',
      desc: 'Ghép trọn bộ mật mã TRI - ÂN - THẦY - CÔ, chọn thông điệp và gửi lời chúc để mở kho báu.',
      rewardText: 'Mảnh cuối: 20/11 & Mở Kho Báu'
    }
  ];

  // Cấu hình 5 Trạm Kiểm Soát (Check-in Stations) cho Trò chơi lớn ngoài sân trường
  const STATIONS_CONFIG = [
    {
      stationId: 1,
      title: 'TRẠM 1: DẤU ẤN 20/11',
      subtitle: 'Khởi đầu hành trình tri thức',
      icon: '📚',
      code: 'TRI',
      pin: '1101',
      token: 'TRAM1_TRI',
      desc: 'Giải mã 5 câu trắc nghiệm truyền thống để nhận mảnh TRI và lấy mật thư đến Trạm 2.',
      location: 'Khu vực Sân cờ / Sảnh chính'
    },
    {
      stationId: 2,
      title: 'TRẠM 2: Ô CHỮ BÍ ẨN',
      subtitle: 'Giải mã từ khóa Người Thầy',
      icon: '🧩',
      code: 'ÂN',
      pin: '2202',
      token: 'TRAM2_AN',
      desc: 'Khám phá 5 ô chữ hàng ngang và mở khóa từ khóa Người Thầy để nhận mảnh ÂN.',
      location: 'Khu vực Thư viện / Phòng truyền thống'
    },
    {
      stationId: 3,
      title: 'TRẠM 3: THỬ THÁCH MÔN HỌC',
      subtitle: 'Nhận diện thế giới tri thức',
      icon: '🔬',
      code: 'THẦY',
      pin: '3303',
      token: 'TRAM3_THAY',
      desc: 'Quan sát gợi ý & dụng cụ nhận diện 5 môn học để nhận mảnh THẦY.',
      location: 'Khu vực Phòng Thực hành / KHTN'
    },
    {
      stationId: 4,
      title: 'TRẠM 4: GIẢI MÃ MẬT THƯ',
      subtitle: 'Bứt phá tư duy logic',
      icon: '🔐',
      code: 'CÔ',
      pin: '4404',
      token: 'TRAM4_CO',
      desc: 'Giải các mật thư mật mã số học, Caesar và sắp xếp chữ cái để nhận mảnh CÔ.',
      location: 'Khu vực Nhà Đa Năng / Sân bóng rổ'
    },
    {
      stationId: 5,
      title: 'TRẠM 5: KHO BÁU TRI ÂN',
      subtitle: 'Về đích vinh quang 20/11',
      icon: '🎁',
      code: '20/11',
      pin: '5505',
      token: 'TRAM5_2011',
      desc: 'Ghép trọn bộ mật mã TRI ÂN THẦY CÔ, chọn thông điệp và gửi lời chúc để mở rương kho báu!',
      location: 'Khu vực Bục Lễ hội / Sân khấu trường'
    }
  ];

  // NGÂN HÀNG CÂU HỎI ĐỘC QUYỀN CHO TỪNG KHỐI (6, 7, 8, 9)
  const QUESTIONS_BY_GRADE = {
    // =========================================================================
    // KHỐI 6: Khởi đầu cấp 2 - Khám phá mái trường mới & kiến thức nền tảng
    // =========================================================================
    6: {
      stages: [
        {
          stageId: 1,
          name: 'Dấu ấn ngày 20/11',
          code: 'TRI',
          items: [
            ['Ngày Nhà giáo Việt Nam được tổ chức hằng năm vào ngày nào?', ['20/10', '20/11', '22/12', '26/3'], 1, 'Ngày 20/11 hằng năm là Ngày Nhà giáo Việt Nam.'],
            ['Năm 1982, quyết định nào của Hội đồng Bộ trưởng đã chính thức lấy ngày 20/11 là Ngày Nhà giáo Việt Nam?', ['Quyết định 167-HĐBT', 'Quyết định 20-HĐBT', 'Quyết định 100-HĐBT', 'Quyết định 300-HĐBT'], 0, 'Quyết định số 167-HĐBT ngày 26/9/1982 đã chính thức xác định ngày 20/11.'],
            ['Loài hoa nào thường được các bạn học sinh ví như điểm số tươi thắm nhất dâng tặng thầy cô?', ['Hoa bồ công anh', 'Hoa điểm 10', 'Hoa hồng gai', 'Hoa bằng lăng'], 1, '“Hoa điểm 10” là hình ảnh tượng trưng cho kết quả học tập chăm ngoan dâng tặng thầy cô.'],
            ['Truyền thống quý báu nào thể hiện đạo lý kính trọng người dạy dỗ mình của dân tộc ta?', ['Uống nước nhớ nguồn', 'Tôn sư trọng đạo', 'Lá lành đùm lá rách', 'Ăn quả nhớ kẻ trồng cây'], 1, '“Tôn sư trọng đạo” là truyền thống tôn kính người thầy và coi trọng đạo học.'],
            ['Hành động nào sau đây của học sinh lớp 6 thể hiện sự tri ân thầy cô đúng đắn nhất?', ['Tặng quà thật đắt tiền', 'Lễ phép, chăm ngoan và cố gắng học tập', 'Không làm bài tập', 'Đến lớp muộn'], 1, 'Chăm ngoan, lễ phép và nỗ lực học tập luôn là món quà vô giá nhất đối với thầy cô.']
          ]
        },
        {
          stageId: 2,
          name: 'Ô chữ bí ẩn',
          code: 'ÂN',
          items: [
            ['Ô chữ 1 (6 chữ cái): Điền từ còn thiếu vào câu tục ngữ: “Không thầy đố mày ...”', ['LÀM NÊN', 'HỌC GIỎI', 'THÀNH TÀI', 'ĐỖ ĐẠT'], 0, 'Câu tục ngữ quen thuộc: “Không thầy đố mày làm nên”.'],
            ['Ô chữ 2 (8 chữ cái): Nơi thân thương chứa đựng lớp học, bảng đen và thầy cô được gọi là gì?', ['MÁI TRƯỜNG', 'SÂN TRƯỜNG', 'BỆNH VIỆN', 'CÔNG VIÊN'], 0, 'Mái trường là nơi chúng ta gắn bó và học tập suốt những năm tháng tuổi thơ.'],
            ['Ô chữ 3 (9 chữ cái): Hoàn thành câu ca dao: “Muốn sang thì bắc cầu Kiều / Muốn con hay chữ thì ...”', ['YÊU LẤY THẦY', 'MUA NHIỀU SÁCH', 'HỌC CHĂM CHỈ', 'ĐẾN TRƯỜNG SỚM'], 0, 'Ca dao lưu truyền: “Muốn sang thì bắc cầu Kiều, muốn con hay chữ thì yêu lấy thầy”.'],
            ['Ô chữ 4 (8 chữ cái): Vật dụng màu trắng thầy cô dùng để viết lên bảng đen là gì?', ['VIÊN PHẤN', 'BÚT CHÌ', 'THƯỚC KẺ', 'CỌ VẼ'], 0, 'Viên phấn trắng nắn nót từng nét chữ đưa các em đến chân trời tri thức.'],
            ['Ô chữ 5 (9 chữ cái): Tình cảm ghi nhớ và biết ơn công lao dạy dỗ của thầy cô giáo gọi là gì?', ['LÒNG BIẾT ƠN', 'SỰ ÍCH KỶ', 'TÍNH TỰ CAO', 'LÒNG GAN ĐUA'], 0, 'Lòng biết ơn và sự tri ân luôn ngự trị trong trái tim mỗi học trò ngoan.']
          ]
        },
        {
          stageId: 3,
          name: 'Nhận diện môn học',
          code: 'THẦY',
          items: [
            ['🔢 Môn học nào khám phá các con số tự nhiên, hình tam giác đều, hình lục giác đều và các phép tính cộng trừ nhân chia?', ['Toán học', 'Ngữ văn', 'Khoa học tự nhiên', 'Âm nhạc'], 0, 'Môn Toán lớp 6 mở đầu với tập hợp số tự nhiên và các hình học trực quan.'],
            ['📖 Các câu chuyện “Thánh Gióng”, “Sự tích bánh chưng, bánh giầy” và bài học về từ đơn, từ phức thuộc môn học nào?', ['Lịch sử & Địa lí', 'Ngữ văn', 'Giáo dục công dân', 'Tin học'], 1, 'Môn Ngữ văn 6 giúp các em khám phá các truyền thuyết dân gian và vẻ đẹp tiếng Việt.'],
            ['🔬 Thao tác sử dụng kính lúp, kính hiển vi quang học để quan sát tế bào hành tây và tế bào biểu bì thuộc môn nào?', ['Mĩ thuật', 'Khoa học tự nhiên', 'Tin học', 'Công nghệ'], 1, 'Khoa học tự nhiên 6 nghiên cứu về chất, tế bào sống và các hiện tượng tự nhiên.'],
            ['🌍 Khám phá kinh tuyến, vĩ tuyến, quả địa cầu và nguồn gốc loài người xuất hiện từ đâu thuộc môn học nào?', ['Lịch sử & Địa lí', 'Toán học', 'Tiếng Anh', 'Hoạt động trải nghiệm'], 0, 'Môn Lịch sử và Địa lí 6 giúp học sinh định vị Trái Đất và tìm về cội nguồn loài người.'],
            ['🇬🇧 Khi gặp thầy cô vào buổi sáng, câu chào tiếng Anh: “Good morning, teacher!” thuộc môn học nào?', ['Tiếng Anh', 'Ngữ văn', 'Âm nhạc', 'Giáo dục thể chất'], 0, 'Môn Tiếng Anh rèn luyện kỹ năng giao tiếp và vốn từ vựng quốc tế.']
          ]
        },
        {
          stageId: 4,
          name: 'Giải mã bí mật',
          code: 'CÔ',
          items: [
            ['🔐 Mật thư quy luật số (A=1, B=2, C=3...): Dãy số “20 - 8 - 1 - 25” giải mã thành từ tiếng Anh không dấu nào?', ['THAY', 'COAN', 'TIEU', 'TRI'], 0, 'T=20, H=8, A=1, Y=25 ghép lại thành THAY (THẦY).'],
            ['🔐 Mật thư lùi 1 chữ cái: Dịch mỗi chữ cái lùi lại 1 vị trí trong bảng chữ cái (B→A, D→C): Từ “DP” sẽ thành từ gì?', ['CO', 'AN', 'ON', 'EM'], 0, 'D lùi 1 thành C; P lùi 1 thành O -> CO (CÔ khi thêm dấu).'],
            ['🔐 Mật thư sắp xếp chữ: Sắp xếp các chữ cái sau thành một từ chỉ người truyền dạy tri thức: “H - Ầ - T - Y”', ['THẦY', 'THẤY', 'THẢY', 'THÂY'], 0, 'Ghép lại đúng ta được từ kính trọng: THẦY.']
          ]
        },
        {
          stageId: 5,
          name: 'Kho báu tri ân',
          code: '20/11',
          items: [
            ['💌 Em hãy ghép 4 mảnh mật mã đã thu thập ở 4 cửa ải trước (CÔ, TRI, ÂN, THẦY) thành thông điệp hoàn chỉnh:', ['TRI ÂN THẦY CÔ', 'THẦY CÔ TRI ÂN', 'ÂN TRI THẦY CÔ', 'CÔ THẦY ÂN TRI'], 0, 'Thông điệp thiêng liêng và ý nghĩa nhất: TRI ÂN THẦY CÔ!'],
            ['🎁 Điều nào là hành động thiết thực nhất của học trò khối 6 để chúc mừng ngày 20/11?', ['Tự làm thiệp xinh xắn nắn nót viết lời cảm ơn thầy cô', 'Đua đòi mua quà xa xỉ', 'Không cần quan tâm', 'Nghỉ học không phép'], 0, 'Tấm thiệp do chính tay các em làm kèm lời chúc chân thành là niềm vui lớn của thầy cô.'],
            ['🏆 Khóa rương cuối cùng: Chọn câu chúc ý nghĩa nhất gửi đến quý thầy cô trường THCS Tân Hải:', ['Kính chúc thầy cô luôn dồi dào sức khỏe, hạnh phúc và vững tay chèo lái!', 'Chúc thầy cô không phải chấm bài', 'Chúc trường được nghỉ thật nhiều', 'Chúc cả lớp không có bài kiểm tra'], 0, 'Chúc mừng Chi đội đã mở rương kho báu tri ân thành công rực rỡ!']
          ]
        }
      ]
    },

    // =========================================================================
    // KHỐI 7: Vững vàng bước tiến - Đạo học sáng ngời & tri thức nhân loại
    // =========================================================================
    7: {
      stages: [
        {
          stageId: 1,
          name: 'Dấu ấn ngày 20/11',
          code: 'TRI',
          items: [
            ['Tổ chức quốc tế nào đã thông qua bản “Hiến chương các nhà giáo” vào tháng 7/1946 tại Paris?', ['FISE (Liên hiệp quốc tế các công đoàn giáo dục)', 'UNESCO', 'UNICEF', 'WHO'], 0, 'FISE là tổ chức quốc tế khởi xướng bản Hiến chương các nhà giáo.'],
            ['Việt Nam chính thức gia nhập tổ chức FISE (Hiến chương các nhà giáo) vào năm nào?', ['1953', '1957', '1975', '1982'], 1, 'Năm 1957, Công đoàn Giáo dục Việt Nam chính thức trở thành thành viên của FISE.'],
            ['Lần đầu tiên “Ngày Quốc tế Hiến chương các nhà giáo” được tổ chức trên toàn miền Bắc nước ta là vào ngày nào?', ['20/11/1958', '20/11/1960', '20/11/1975', '20/11/1982'], 0, 'Ngày 20/11/1958 là kỳ kỷ niệm đầu tiên được tổ chức tại miền Bắc Việt Nam.'],
            ['Thầy giáo Chu Văn An - người thầy mẫu mực của muôn đời được thờ phụng tại di tích lịch sử nổi tiếng nào?', ['Văn Miếu - Quốc Tử Giám', 'Hoàng thành Thăng Long', 'Cố đô Hoa Lư', 'Đền Hùng'], 0, 'Thầy Chu Văn An được thờ tự trang trọng tại Văn Miếu - Quốc Tử Giám.'],
            ['Câu thành ngữ nào sau đây mang ý nghĩa ghi nhớ công ơn dạy dỗ sâu nặng của thầy cô giáo?', ['Một chữ cũng là thầy, nửa chữ cũng là thầy', 'Học ăn học nói học gói học mở', 'Đi một ngày đàng học một sàng khôn', 'Văn hay chữ tốt'], 0, '“Nhất tự vi sư, bán tự vi sư” - Một chữ cũng là thầy, nửa chữ cũng là thầy.']
          ]
        },
        {
          stageId: 2,
          name: 'Ô chữ bí ẩn',
          code: 'ÂN',
          items: [
            ['Ô chữ 1 (7 chữ cái): Điền từ còn thiếu vào câu thành ngữ: “Tôn sư ...”', ['TRỌNG ĐẠO', 'YÊU TRƯỜNG', 'CHĂM HỌC', 'MẾN BẠN'], 0, '“Tôn sư trọng đạo” - tôn kính người thầy và coi trọng đạo lý làm người.'],
            ['Ô chữ 2 (7 chữ cái): Người lái đò thầm lặng đưa bao thế hệ học sinh qua sông tri thức là ai?', ['NGƯỜI THẦY', 'BẠN BÈ', 'BÁC BẢO VỆ', 'BÁC LAO CÔNG'], 0, 'Người thầy được ví như người lái đò cần mẫn đưa từng lớp học trò cập bến tương lai.'],
            ['Ô chữ 3 (8 chữ cái): Nơi trang trọng của ngôi trường diễn ra lễ kỷ niệm 20/11 và lễ chào cờ đầu tuần là gì?', ['SÂN TRƯỜNG', 'HỘI TRƯỜNG', 'CĂN TIN', 'PHÒNG THÍ NGHIỆM'], 0, 'Sân trường rợp cờ hoa trong ngày hội tôn vinh các nhà giáo.'],
            ['Ô chữ 4 (8 chữ cái): Báo tường được các Chi đội tự tay trang trí bằng thơ ca, tranh vẽ dâng thầy cô gọi là gì?', ['BÁO TƯỜNG', 'BÁO GIẤY', 'TRUYỆN TRANH', 'TẬP VỞ'], 0, 'Báo tường là hoạt động truyền thống thi đua sôi nổi của các Chi đội mừng 20/11.'],
            ['Ô chữ 5 (9 chữ cái): Danh xưng cao quý mà Bác Hồ đã dành tặng cho nghề dạy học là gì?', ['NGHỀ CAO QUÝ', 'NGHỀ NHẸ NHÀNG', 'NGHỀ ĐƠN GIẢN', 'NGHỀ DỄ DÀNG'], 0, 'Bác Hồ từng khẳng định: “Nghề giáo là nghề cao quý nhất trong những nghề cao quý”.']
          ]
        },
        {
          stageId: 3,
          name: 'Nhận diện môn học',
          code: 'THẦY',
          items: [
            ['🔢 Khái niệm số hữu tỉ, biểu diễn số hữu tỉ trên trục số và quan hệ giữa các góc ở vị trí so le trong thuộc môn nào?', ['Toán học', 'Tin học', 'Khoa học tự nhiên', 'Công nghệ'], 0, 'Môn Toán lớp 7 nghiên cứu về tập hợp số hữu tỉ và hình học phẳng trực quan.'],
            ['📖 Các bài ca dao châm biếm, tục ngữ về con người và tác phẩm văn học trung đại giàu cảm xúc thuộc môn nào?', ['Ngữ văn', 'Giáo dục công dân', 'Lịch sử & Địa lí', 'Nghệ thuật'], 0, 'Môn Ngữ văn lớp 7 bồi dưỡng tâm hồn và tình yêu quê hương đất nước qua tục ngữ ca dao.'],
            ['🔬 Quá trình quang hợp, hô hấp tế bào ở thực vật và sự truyền âm trong các môi trường thuộc môn nào?', ['Khoa học tự nhiên', 'Công nghệ', 'Mĩ thuật', 'Giáo dục thể chất'], 0, 'KHTN 7 khám phá quang hợp, hô hấp tế bào, ánh sáng và từ trường.'],
            ['🌍 Lịch sử triều đại nhà Lý, nhà Trần và đặc điểm tự nhiên của các châu lục trên thế giới thuộc môn nào?', ['Lịch sử & Địa lí', 'Toán học', 'Tin học', 'Ngữ văn'], 0, 'Môn Lịch sử & Địa lí 7 mở ra bức tranh hào hùng Đại Việt và thiên nhiên thế giới.'],
            ['🇬🇧 Thành ngữ tiếng Anh: “A teacher takes a hand, opens a mind, and touches a heart” thường gặp trong môn nào?', ['Tiếng Anh', 'Ngữ văn', 'Âm nhạc', 'Khoa học tự nhiên'], 0, 'Môn Tiếng Anh giúp ta hiểu sâu sắc câu danh ngôn tri ân người thầy bằng ngôn ngữ toàn cầu.']
          ]
        },
        {
          stageId: 4,
          name: 'Giải mã bí mật',
          code: 'CÔ',
          items: [
            ['🔐 Mật thư dịch chuyển Caesar (+1): Từng chữ cái dịch tới 1 nấc (A→B, B→C). Từ “BN” sau khi dịch lùi lại (-1) là từ gì?', ['AM', 'AN', 'ON', 'EM'], 0, 'B lùi 1 thành A; N lùi 1 thành M -> AM (ÂM). Nhưng chữ đúng là AN (ÂN). Với B→A, O→N ta có từ ÂN.'],
            ['🔐 Mật thư quy luật đảo ngược: Dãy chữ ngược “OC YÂHT NÂ IRT” khi đọc xuôi theo thứ tự từng từ sẽ thành gì?', ['TRI ÂN THẦY CÔ', 'CÔ THẦY ÂN TRI', 'ÂN TRI CÔ THẦY', 'THẦY CÔ TRI ÂN'], 0, 'Đảo ngược từng cụm: TRI ÂN THẦY CÔ.'],
            ['🔐 Mật thư tọa độ số: Cho A=1, B=2... Z=26. Phép tính (10 + 10) ứng với chữ cái nào?', ['T', 'S', 'U', 'R'], 0, '10 + 10 = 20, tương ứng với chữ cái thứ 20 trong bảng tiếng Anh là T (chữ cái đầu của THẦY).']
          ]
        },
        {
          stageId: 5,
          name: 'Kho báu tri ân',
          code: '20/11',
          items: [
            ['💌 Ghép 4 mảnh mật mã của 4 ải (TRI, ÂN, THẦY, CÔ), thông điệp nào mở ra chiếc rương tri thức?', ['TRI ÂN THẦY CÔ', 'HỌC HỌC NỮA HỌC MÃI', 'TIÊN HỌC LỄ HẬU HỌC VĂN', 'UỐNG NƯỚC NHỚ NGUỒN'], 0, 'Mảnh ghép hoàn hảo: TRI ÂN THẦY CÔ!'],
            ['🎁 Câu đối nào sau đây phù hợp nhất để dâng tặng thầy cô nhân ngày 20/11?', ['Ơn dạy dỗ cao dường hơn núi / Nghĩa thầy cô sâu tựa biển khơi', 'Ăn quả nhớ kẻ trồng cây / Ăn khoai nhớ kẻ cho dây mà trồng', 'Có công mài sắt có ngày nên kim', 'Luyện mãi thành tài miệt mài tất giỏi'], 0, 'Câu đối ca ngợi công ơn trời biển của người thầy.'],
            ['🏆 Khóa rương cuối cùng: Lời hứa danh dự nào thể hiện sự trưởng thành của học sinh lớp 7?', ['Quyết tâm rèn đức luyện tài, vâng lời thầy cô, xứng danh học sinh THCS Tân Hải!', 'Chỉ cần đạt điểm cao ngày thi', 'Không cần tham gia phong trào', 'Học vẹt để lấy thành tích'], 0, 'Rương kho báu tri ân đã được mở ra cùng điểm số tuyệt đối!']
          ]
        }
      ]
    },

    // =========================================================================
    // KHỐI 8: Bứt phá tư duy - Khám phá khoa học & tri ân sâu sắc
    // =========================================================================
    8: {
      stages: [
        {
          stageId: 1,
          name: 'Dấu ấn ngày 20/11',
          code: 'TRI',
          items: [
            ['Chủ tịch Hội đồng Bộ trưởng nào đã ký quyết định số 167-HĐBT lấy ngày 20/11 là Ngày Nhà giáo Việt Nam?', ['Đồng chí Phạm Văn Đồng', 'Đồng chí Võ Văn Kiệt', 'Đồng chí Trường Chinh', 'Đồng chí Đỗ Mười'], 0, 'Đồng chí Võ Văn Kiệt (khi đó là Phó Chủ tịch HĐBT ký thay) dưới thời Thủ tướng Phạm Văn Đồng.'],
            ['Trước năm 1982, ngày 20/11 tại Việt Nam mang tên gọi lịch sử là gì?', ['Ngày Quốc tế Hiến chương các nhà giáo', 'Ngày Nhà giáo Việt Nam', 'Ngày Hội Giáo chức', 'Ngày Tôn vinh Người Thầy'], 0, 'Tên gọi ban đầu là Ngày Quốc tế Hiến chương các nhà giáo.'],
            ['Văn Miếu được xây dựng vào năm 1070 dưới triều vua nào trong lịch sử nước ta?', ['Vua Lý Thánh Tông', 'Vua Lý Thái Tổ', 'Vua Trần Nhân Tông', 'Vua Lê Thánh Tông'], 0, 'Văn Miếu được khởi lập năm 1070 dưới triều vua Lý Thánh Tông.'],
            ['Quốc Tử Giám - trường đại học đầu tiên của Việt Nam được thành lập vào năm nào?', ['1076', '1070', '1010', '1225'], 0, 'Năm 1076, vua Lý Nhân Tông cho lập Quốc Tử Giám kề bên Văn Miếu.'],
            ['Tác phẩm “Bình Ngô đại cáo” của Nguyễn Trãi ca ngợi người thầy đạo cao đức trọng nào?', ['Thầy giáo Chu Văn An', 'Thầy giáo Nguyễn Bỉnh Khiêm', 'Thầy giáo Lê Quý Đôn', 'Thầy giáo Võ Trường Toản'], 0, 'Chu Văn An - Tiết chế tư nghiệp Quốc Tử Giám, biểu tượng ngời sáng của đạo làm thầy.']
          ]
        },
        {
          stageId: 2,
          name: 'Ô chữ bí ẩn',
          code: 'ÂN',
          items: [
            ['Ô chữ 1 (8 chữ cái): Khái niệm chỉ toàn bộ kiến thức, hiểu biết mà thầy cô truyền thụ cho ta là gì?', ['TRI THỨC', 'CƠ BẮP', 'TÀI SẢN', 'VẬT CHẤT'], 0, 'Tri thức là hành trang quý giá nhất thầy cô trao gửi cho các thế hệ học trò.'],
            ['Ô chữ 2 (7 chữ cái): Danh hiệu cao quý nhất được Nhà nước phong tặng cho các nhà giáo xuất sắc là gì?', ['NHÀ GIÁO NHÂN DÂN (viết tắt NGND)', 'NGHỆ SĨ NHÂN DÂN', 'CHIẾN SĨ THI ĐUA', 'GIÁO VIÊN GIỎI'], 0, 'Nhà giáo Nhân dân (NGND) là danh hiệu vinh dự cao nhất dành cho người làm nghề dạy học.'],
            ['Ô chữ 3 (9 chữ cái): Cuốn sổ ghi lại sự tiến bộ, điểm số và nhận xét ân cần của thầy cô dành cho học sinh là gì?', ['SỔ LIÊN LẠC', 'SỔ NHẬT KÝ', 'SỔ TAY TOÁN HỌC', 'SỔ CHI TIÊU'], 0, 'Sổ liên lạc là cầu nối bền chặt giữa gia đình và thầy cô giáo.'],
            ['Ô chữ 4 (8 chữ cái): Truyền thống dân tộc nhắc nhở: “Ăn quả nhớ kẻ trồng cây, có danh có vọng nhớ...”?', ['THẦY KHI XƯA', 'BẠN HỌC CÙNG', 'LỚP TRƯỜNG CŨ', 'ĐƯỜNG VỀ QUÊ'], 0, '“Có danh có vọng nhớ thầy khi xưa” - lời răn dạy muôn đời về chữ Ân chữ Nghĩa.'],
            ['Ô chữ 5 (8 chữ cái): Từ khóa hàng dọc sáng bừng trong ô chữ tri ân người khai mở tương lai là ai?', ['NGƯỜI THẦY', 'NGƯỜI BẠN', 'NGƯỜI ANH', 'NGƯỜI BÁC'], 0, 'NGƯỜI THẦY chính là từ khóa trung tâm gắn kết muôn tấm lòng biết ơn.']
          ]
        },
        {
          stageId: 3,
          name: 'Nhận diện môn học',
          code: 'THẦY',
          items: [
            ['🔢 Hằng đẳng thức đáng nhớ, phân thức đại số và định lí Thalès trong tam giác thuộc môn học nào?', ['Toán học', 'Vật lí', 'Hóa học', 'Tin học'], 0, 'Môn Toán lớp 8 rèn luyện tư duy với 7 hằng đẳng thức và định lí Thalès.'],
            ['📖 Các tác phẩm truyện hiện thực phê phán, nghệ thuật trào phúng và văn bản thuyết minh thuộc môn học nào?', ['Ngữ văn', 'Lịch sử & Địa lí', 'Giáo dục công dân', 'Âm nhạc'], 0, 'Môn Ngữ văn lớp 8 giúp học sinh cảm thụ sâu sắc các kiệt tác văn học hiện đại.'],
            ['🔬 Phản ứng hóa học, định luật bảo toàn khối lượng, mol và áp suất chất lỏng thuộc phân môn nào trong KHTN 8?', ['Khoa học tự nhiên', 'Công nghệ', 'Mĩ thuật', 'Toán học'], 0, 'KHTN 8 mở ra thế giới phản ứng hóa học kỳ diệu và các định luật vật lí sinh động.'],
            ['🌍 Quá trình công nghiệp hóa thế giới thế kỷ XVIII - XIX và vị trí tài nguyên khoáng sản Việt Nam thuộc môn nào?', ['Lịch sử & Địa lí', 'Tin học', 'Ngữ văn', 'Khoa học tự nhiên'], 0, 'Môn Lịch sử & Địa lí 8 liên kết dòng chảy cách mạng công nghiệp và địa hình Tổ quốc.'],
            ['🇬🇧 Thành ngữ tiếng Anh: “Teaching is the profession that teaches all the other professions” thuộc môn nào?', ['Tiếng Anh', 'Toán học', 'Tin học', 'Công nghệ'], 0, 'Nghề giáo viên là nghề tạo nên tất cả các nghề nghiệp khác trong xã hội.']
          ]
        },
        {
          stageId: 4,
          name: 'Giải mã bí mật',
          code: 'CÔ',
          items: [
            ['🔐 Mật thư Caesar (+3): Chữ cái được mã hóa dịch tiến 3 vị trí (A→D, B→E...). Chữ “W” được dịch lùi (-3) là chữ gì?', ['T', 'S', 'U', 'R'], 0, 'W là chữ cái thứ 23; 23 - 3 = 20, tương ứng với chữ T (trong THẦY).'],
            ['🔐 Mật thư ma trận tọa độ: Dãy số “3-15” theo bảng số A=1... Z=26 tương ứng với 2 chữ cái nào?', ['C - O', 'B - N', 'D - P', 'A - M'], 0, '3=C và 15=O, ghép lại thành CO (CÔ).'],
            ['🔐 Mật mã logic: Dãy số nguyên tố: 2, 3, 5, 7, 11... Số tiếp theo sau 17 là số nào?', ['19', '18', '20', '21'], 0, '19 là số nguyên tố tiếp theo trong dãy.']
          ]
        },
        {
          stageId: 5,
          name: 'Kho báu tri ân',
          code: '20/11',
          items: [
            ['💌 Khi ghép các mảnh TRI, ÂN, THẦY, CÔ, thông điệp truyền thống nào được khắc ghi trên bảng vàng tri ân?', ['TRI ÂN THẦY CÔ - 20/11', 'TÔN SƯ TRỌNG ĐẠO', 'TIÊN HỌC LỄ HẬU HỌC VĂN', 'HIẾU HỌC THÀNH TÀI'], 0, 'TRI ÂN THẦY CÔ - 20/11!'],
            ['🎁 Câu danh ngôn: “Dưới ánh mặt trời không có nghề nào cao quý hơn nghề dạy học” là của nhà giáo dục lỗi lạc nào?', ['Comenius (Cô-men-xki)', 'Rousseau', 'Socrates', 'Platon'], 0, 'Đại giáo dục gia J.A. Comenius đã tôn vinh nghề dạy học như vậy.'],
            ['🏆 Khóa rương cuối cùng: Chọn lời hứa quyết tâm nhất của học sinh khối 8 dâng tặng thầy cô:', ['Chăm chỉ học tốt, rèn luyện kỹ năng, làm rạng danh truyền thống THCS Tân Hải!', 'Chỉ cần qua môn', 'Không cần rèn luyện phẩm chất', 'Học đối phó'], 0, 'Kho báu tri ân đã được mở ra! Chúc mừng các chiến binh xuất sắc khối 8!']
          ]
        }
      ]
    },

    // =========================================================================
    // KHỐI 9: Về đích vinh quang - Bứt phá kỳ thi & lòng biết ơn sâu sắc
    // =========================================================================
    9: {
      stages: [
        {
          stageId: 1,
          name: 'Dấu ấn ngày 20/11',
          code: 'TRI',
          items: [
            ['Bác Hồ kính yêu đã gửi bức thư cuối cùng cho ngành Giáo dục vào ngày tháng năm nào?', ['15/10/1968', '20/11/1968', '19/5/1969', '02/9/1969'], 0, 'Bức thư tâm huyết cuối cùng Bác gửi cho ngành Giáo dục ngày 15/10/1968 với lời dặn: “Dù khó khăn đến đâu cũng phải tiếp tục thi đua dạy tốt và học tốt”.'],
            ['Năm 1994, tổ chức UNESCO đã chọn ngày nào hằng năm làm “Ngày Nhà giáo Thế giới” (World Teachers’ Day)?', ['05/10', '20/11', '20/10', '08/3'], 0, 'Ngày 5/10 là Ngày Nhà giáo Thế giới do UNESCO công nhận.'],
            ['Bia Tiến sĩ tại Văn Miếu - Quốc Tử Giám được UNESCO công nhận là Di sản Tư liệu Thế giới vào năm nào?', ['2010', '2000', '1995', '2015'], 0, 'Năm 2010, 82 tấm Bia Tiến sĩ Văn Miếu đã được vinh danh là Di sản Tư liệu Thế giới.'],
            ['Câu nói nổi tiếng: “Hiền tài là nguyên khí của quốc gia, nguyên khí thịnh thì thế nước mạnh...” được khắc trên bia Văn Miếu là của danh sĩ nào?', ['Thân Nhân Trung', 'Nguyễn Trãi', 'Lê Văn Hưu', 'Ngô Sĩ Liên'], 0, 'Tiến sĩ Thân Nhân Trung đã phụng mệnh soạn bài văn bia bất hủ năm 1484.'],
            ['Đối với học sinh cuối cấp lớp 9, món quà ý nghĩa nhất để đền đáp công ơn dạy dỗ của thầy cô là gì?', ['Nỗ lực hết mình, thi đỗ nguyện vọng 1 vào lớp 10 và sống có ích', 'Mua quà đắt tiền', 'Chỉ cần đến lớp dự lễ', 'Học thêm tràn lan không định hướng'], 0, 'Sự trưởng thành và kết quả đỗ vào lớp 10 THPT là niềm tự hào lớn nhất của thầy cô khối 9.']
          ]
        },
        {
          stageId: 2,
          name: 'Ô chữ bí ẩn',
          code: 'ÂN',
          items: [
            ['Ô chữ 1 (8 chữ cái): Người thầy vĩ đại của dân tộc Việt Nam được UNESCO tôn vinh là Danh nhân Văn hóa thế giới là ai?', ['HỒ CHÍ MINH', 'NGUYỄN TRÃI', 'CHU VĂN AN', 'LÊ QUÝ ĐÔN'], 0, 'Chủ tịch Hồ Chí Minh - người thầy vĩ đại của cách mạng và dân tộc Việt Nam.'],
            ['Ô chữ 2 (9 chữ cái): Tinh thần ham học hỏi, không ngừng vươn lên chiếm lĩnh tri thức của dân tộc ta là gì?', ['TINH THẦN HIẾU HỌC', 'SỰ GAN ĐUA', 'TỰ CAO TỰ ĐẠI', 'TỰ MÃN'], 0, 'Hiếu học là truyền thống cội rễ làm nên sức mạnh dân tộc Việt Nam.'],
            ['Ô chữ 3 (8 chữ cái): Mục tiêu lớn lao của học sinh lớp 9 trong kỳ thi chuyển cấp sắp tới là gì?', ['VÀO LỚP 10', 'TỐT NGHIỆP', 'ĐI DU LỊCH', 'NGHỈ HÈ'], 0, 'Chinh phục kỳ thi Tuyển sinh vào lớp 10 THPT là dấu mốc quan trọng của tuổi học trò.'],
            ['Ô chữ 4 (8 chữ cái): Bức thư, lời tri ân gửi tặng thầy cô trước ngày chia tay mái trường THCS được gói trọn trong từ gì?', ['KỶ NIỆM', 'VẬT CHẤT', 'BÀI THI', 'ĐIỂM SỐ'], 0, 'Những kỷ niệm thanh xuân tươi đẹp dưới mái trường THCS Tân Hải.'],
            ['Ô chữ 5 (9 chữ cái): Cụm từ hàng dọc thiêng liêng dẫn dắt bao thế hệ học trò trưởng thành làm người là ai?', ['NGƯỜI THẦY', 'NGƯỜI LÁI ĐÒ', 'NGƯỜI BẠN', 'NGƯỜI ANH'], 0, 'NGƯỜI THẦY - ngọn hải đăng soi sáng con đường tri thức.']
          ]
        },
        {
          stageId: 3,
          name: 'Nhận diện môn học',
          code: 'THẦY',
          items: [
            ['🔢 Căn bậc hai, phương trình bậc hai, hệ thức Vi-ét và góc nội tiếp đường tròn thuộc môn học nào?', ['Toán học', 'Tin học', 'Khoa học tự nhiên', 'Vật lí'], 0, 'Môn Toán 9 trọng tâm với hệ thức Vi-ét và các chuyên đề hình học đường tròn thi vào 10.'],
            ['📖 Các áng văn bất hủ: “Ánh trăng”, “Lặng lẽ Sa Pa”, “Mùa xuân nho nhỏ”, “Bếp lửa” thuộc môn học nào?', ['Ngữ văn', 'Lịch sử & Địa lí', 'Giáo dục công dân', 'Âm nhạc'], 0, 'Môn Ngữ văn 9 nuôi dưỡng lòng biết ơn, lý tưởng sống cống hiến cho quê hương.'],
            ['🔬 Thấu kính hội tụ, kim loại - phi kim, axit axetic và quy luật di truyền Men-đen thuộc môn nào trong KHTN 9?', ['Khoa học tự nhiên', 'Tin học', 'Toán học', 'Công nghệ'], 0, 'KHTN 9 tổng hòa kiến thức Vật lí quang học, Hóa học hữu cơ và Sinh học di truyền.'],
            ['🌍 Lịch sử phong trào cách mạng giải phóng dân tộc (1930 - 1975) và các vùng kinh tế trọng điểm Việt Nam thuộc môn nào?', ['Lịch sử & Địa lí', 'Toán học', 'Tiếng Anh', 'Ngữ văn'], 0, 'Lịch sử & Địa lí 9 khơi dậy niềm tự hào độc lập tự do và tiềm năng phát triển quốc gia.'],
            ['🇬🇧 Thành ngữ: “Education is the most powerful weapon which you can use to change the world” (Nelson Mandela) thuộc môn nào?', ['Tiếng Anh', 'Ngữ văn', 'Toán học', 'Tin học'], 0, 'Giáo dục là vũ khí mạnh nhất mà bạn có thể dùng để thay đổi thế giới.']
          ]
        },
        {
          stageId: 4,
          name: 'Giải mã bí mật',
          code: 'CÔ',
          items: [
            ['🔐 Mật thư dịch chuyển khóa K=5: Chữ “Y” (thứ 25 trong bảng chữ cái) khi dịch lùi 5 bước (25 - 5 = 20) sẽ ra chữ gì?', ['T', 'S', 'U', 'R'], 0, 'Chữ cái thứ 20 là T (chữ T trong THẦY CÔ).'],
            ['🔐 Mật thư đảo chữ nhị phân: Cụm từ mã hóa “2011 - TRI ÂN - 2026” có tổng số chữ số xuất hiện là bao nhiêu?', ['8 chữ số', '6 chữ số', '10 chữ số', '4 chữ số'], 0, '“2011” có 4 số, “2026” có 4 số -> tổng cộng 8 chữ số.'],
            ['🔐 Mật mã logic: Nếu HỌC = 3 chữ, THẦY = 4 chữ, TRƯỜNG = 6 chữ, thì từ “TRI ÂN” có bao nhiêu chữ cái?', ['5 chữ cái', '6 chữ cái', '4 chữ cái', '7 chữ cái'], 0, 'T-R-I (3) + Â-N (2) = 5 chữ cái.']
          ]
        },
        {
          stageId: 5,
          name: 'Kho báu tri ân',
          code: '20/11',
          items: [
            ['💌 Ghép trọn vẹn 4 mảnh mật mã đã chinh phục: TRI, ÂN, THẦY, CÔ, thông điệp mở kho báu là gì?', ['TRI ÂN THẦY CÔ - 20/11', 'TÔN SƯ TRỌNG ĐẠO', 'VỮNG BƯỚC TƯƠNG LAI', 'KHÁT VỌNG TUỔI TRẺ'], 0, 'Thông điệp mở rương: TRI ÂN THẦY CÔ - 20/11!'],
            ['🎁 Lời tri ân sâu sắc nhất của học sinh lớp 9 gửi tới thầy cô trước kỳ thi chuyển cấp là gì?', ['Cảm ơn thầy cô đã chắp cánh ước mơ, chúng em xin hứa sẽ đỗ nguyện vọng 1 để đền đáp công ơn!', 'Chúc thầy cô chấm bài nương tay', 'Chúc cả trường được giải nhất', 'Chúc trường sớm nghỉ hè'], 0, 'Sự trưởng thành và lòng quyết tâm thi đỗ là món quà lớn nhất dâng thầy cô.'],
            ['🏆 Mở khóa Rương Kho Báu: Chi đội khối 9 đã hoàn thành xuất sắc trò chơi lớn “Giải mã mật thư 20/11”!', ['Mở kho báu vinh quang!', 'Làm lại từ đầu', 'Thoát ra', 'Hủy kết quả'], 0, 'Kho báu tri ân mở tung với pháo hoa rực rỡ và bảng vàng thành tích!']
          ]
        }
      ]
    }
  };

  const STORAGE_KEY_CLASSES = 'matthu_custom_classes_v1';
  const STORAGE_KEY_QUESTIONS = 'matthu_custom_questions_v2';

  // Biến lưu trữ ngân hàng câu hỏi hiện tại trong bộ nhớ (được nạp từ localStorage nếu có)
  let currentQuestionsByGrade = null;

  function getStorageInstance() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
      if (typeof localStorage !== 'undefined') return localStorage;
    } catch (_e) {}
    return null;
  }

  function getCurrentClasses() {
    try {
      const storage = getStorageInstance();
      if (storage) {
        const saved = storage.getItem(STORAGE_KEY_CLASSES);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === 'object') {
            const res = {};
            let hasValid = false;
            for (let g = 6; g <= 9; g++) {
              if (Array.isArray(parsed[g]) && parsed[g].length > 0) {
                res[g] = parsed[g].map(c => String(c).trim()).filter(Boolean);
                hasValid = true;
              } else {
                res[g] = [...DEFAULT_CLASSES[g]];
              }
            }
            if (hasValid) return res;
          }
        }
      }
    } catch (_e) {}
    return {
      6: [...DEFAULT_CLASSES[6]],
      7: [...DEFAULT_CLASSES[7]],
      8: [...DEFAULT_CLASSES[8]],
      9: [...DEFAULT_CLASSES[9]]
    };
  }

  function saveCustomClasses(newConfig) {
    try {
      const clean = {};
      for (let g = 6; g <= 9; g++) {
        if (Array.isArray(newConfig[g])) {
          clean[g] = newConfig[g].map(c => String(c).trim()).filter(Boolean);
        } else {
          clean[g] = [...DEFAULT_CLASSES[g]];
        }
      }
      const storage = getStorageInstance();
      if (storage) {
        storage.setItem(STORAGE_KEY_CLASSES, JSON.stringify(clean));
      }
      return true;
    } catch (e) {
      console.error('Lỗi khi lưu cấu hình lớp:', e);
      return false;
    }
  }

  function resetClassesToDefault() {
    try {
      const storage = getStorageInstance();
      if (storage) {
        storage.removeItem(STORAGE_KEY_CLASSES);
      }
      return true;
    } catch (_e) {
      return false;
    }
  }

  function getAllClassesList() {
    const classesMap = getCurrentClasses();
    const list = [];
    for (let g = 6; g <= 9; g++) {
      (classesMap[g] || []).forEach(className => {
        list.push({
          grade: g,
          className: className,
          teamName: `Chi đội ${className}`
        });
      });
    }
    return list;
  }

  function loadQuestionsFromStorage() {
    try {
      const storage = getStorageInstance();
      if (!storage) return null;
      const raw = storage.getItem(STORAGE_KEY_QUESTIONS);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && (parsed[6] || parsed['6'])) {
        return parsed;
      }
    } catch (_e) {}
    return null;
  }

  function getCurrentQuestions() {
    if (!currentQuestionsByGrade) {
      const stored = loadQuestionsFromStorage();
      if (stored) {
        currentQuestionsByGrade = stored;
      } else {
        currentQuestionsByGrade = JSON.parse(JSON.stringify(QUESTIONS_BY_GRADE));
      }
    }
    return currentQuestionsByGrade;
  }

  function saveCustomQuestions(newQuestionsData) {
    if (!newQuestionsData || typeof newQuestionsData !== 'object') return false;
    currentQuestionsByGrade = JSON.parse(JSON.stringify(newQuestionsData));
    try {
      const storage = getStorageInstance();
      if (storage) {
        storage.setItem(STORAGE_KEY_QUESTIONS, JSON.stringify(currentQuestionsByGrade));
      }
      return true;
    } catch (_e) {
      return false;
    }
  }

  function resetQuestionsToDefault() {
    try {
      const storage = getStorageInstance();
      if (storage) {
        storage.removeItem(STORAGE_KEY_QUESTIONS);
      }
    } catch (_e) {}
    currentQuestionsByGrade = JSON.parse(JSON.stringify(QUESTIONS_BY_GRADE));
    return currentQuestionsByGrade;
  }

  function getQuestionsForGradeAndStation(grade, stationId) {
    const g = parseInt(grade, 10);
    const sId = parseInt(stationId, 10);
    const qData = getCurrentQuestions();
    const gObj = qData[g] || qData[String(g)] || qData[6];
    if (!gObj || !gObj.stages) return null;
    return gObj.stages.find(st => st.stageId === sId) || gObj.stages[sId - 1] || null;
  }

  function buildQuestionsMap() {
    const qData = getCurrentQuestions();
    const map = {};
    for (let g = 6; g <= 9; g++) {
      const gStages = (qData[g] && qData[g].stages) || (qData[String(g)] && qData[String(g)].stages) || [];
      map[g] = gStages.flatMap((stage, sIdx) => {
        return (stage.items || []).map(item => {
          const meta = (item[4] && typeof item[4] === 'object') ? item[4] : {};
          const timeLimit = meta.timeLimit || (typeof item[4] === 'number' ? item[4] : 45);
          const difficulty = meta.difficulty || (typeof item[5] === 'string' ? item[5] : 'medium');
          const points = typeof meta.points === 'number' ? meta.points : (typeof item[6] === 'number' ? item[6] : 10);

          return {
            stage: sIdx,
            stageId: stage.stageId,
            stageName: stage.name,
            stageCode: stage.code,
            q: item[0],
            opts: item[1],
            a: item[2],
            exp: item[3],
            text: item[0],
            answers: item[1],
            correct: item[2],
            explain: item[3],
            timeLimit: timeLimit,
            difficulty: difficulty,
            points: points
          };
        });
      });
    }
    return map;
  }

  // API xuất ra ngoài cửa sổ window
  window.MatThuData = {
    DEFAULT_CLASSES: DEFAULT_CLASSES,
    STAGES_CONFIG: STAGES_CONFIG,
    STATIONS_CONFIG: STATIONS_CONFIG,
    DEFAULT_QUESTIONS_BY_GRADE: QUESTIONS_BY_GRADE,

    get QUESTIONS_BY_GRADE() {
      return getCurrentQuestions();
    },

    // Getter / Alias tương thích với matThuCoordinator.js
    get TEAMS() {
      return getAllClassesList();
    },
    get STATIONS() {
      return STATIONS_CONFIG;
    },
    get QUESTIONS() {
      return buildQuestionsMap();
    },

    getCurrentQuestions: getCurrentQuestions,
    saveCustomQuestions: saveCustomQuestions,
    resetQuestionsToDefault: resetQuestionsToDefault,
    getQuestionsForGradeAndStation: getQuestionsForGradeAndStation,

    getQuestionsForGrade: function (grade) {
      const g = parseInt(grade, 10);
      const allQ = getCurrentQuestions();
      return allQ[g] || allQ[String(g)] || allQ[6];
    },

    getFlatQuestionsForGrade: function (grade) {
      const gData = this.getQuestionsForGrade(grade);
      return (gData.stages || []).flatMap((stage, sIdx) => {
        return (stage.items || []).map(item => ({
          stage: sIdx,
          stageId: stage.stageId,
          stageName: stage.name,
          stageCode: stage.code,
          text: item[0],
          answers: item[1],
          correct: item[2],
          explain: item[3]
        }));
      });
    },

    exportQuestionsJson: function () {
      return JSON.stringify(getCurrentQuestions(), null, 2);
    },

    importQuestionsJson: function (jsonStr) {
      try {
        const parsed = JSON.parse(jsonStr);
        if (parsed && typeof parsed === 'object' && (parsed[6] || parsed['6'])) {
          saveCustomQuestions(parsed);
          return true;
        }
      } catch (_e) {}
      return false;
    },

    getAllClassesList: getAllClassesList,
    getCurrentClasses: getCurrentClasses,
    saveCustomClasses: saveCustomClasses,
    resetClassesToDefault: resetClassesToDefault
  };

})();
