/**
 * GMM Built-in Topic Question Sets Data
 * Chứa các bộ đề mẫu 10 câu và Kho 30 câu ôn tập tổng hợp (để trộn & bốc ngẫu nhiên 10 câu/lượt).
 */
(function initGmmBuiltinSetsData() {
  'use strict';

  const BUILTIN_TOPIC_SETS = [
    {
      id: 'builtin_atgt',
      title: 'An Toàn Giao Thông Học Đường',
      topic: 'An toàn giao thông',
      isBuiltin: true,
      questions: [
        {
          question: 'Khi đi xe đạp điện hoặc xe máy điện đến ngã tư có đèn tín hiệu chuyển sang màu vàng (khi chưa vượt qua vạch dừng), em cần làm gì?',
          options: [
            'Tăng tốc nhanh để vượt qua trước khi đèn đỏ bật.',
            'Giảm tốc độ và dừng lại trước vạch dừng an toàn.',
            'Lấn sang làn đường ngược chiều để rẽ phải.',
            'Bấm còi liên tục để các xe phía trước nhường đường.'
          ],
          correct: 1,
          time: 30
        },
        {
          question: 'Người ngồi trên xe mô tô, xe gắn máy, xe máy điện bắt buộc phải đội mũ bảo hiểm như thế nào mới đúng quy định?',
          options: [
            'Chỉ cần đội mũ trên đầu, không cần cài quai.',
            'Chỉ đội mũ khi đi qua khu vực có cảnh sát giao thông.',
            'Đội mũ bảo hiểm đạt chuẩn và cài quai đúng quy cách.',
            'Treo mũ bảo hiểm ở tay lái cho thoáng mát.'
          ],
          correct: 2,
          time: 30
        },
        {
          question: 'Học sinh đi xe đạp tới trường cần đi như thế nào trên đoạn đường không có đường dành riêng cho xe đạp?',
          options: [
            'Đi dàn hàng ngang 3–4 xe để vừa đi vừa nói chuyện.',
            'Đi sát mép đường bên phải theo chiều đi của mình, không dàn hàng ngang.',
            'Buông hai tay khi xuống dốc để thử cảm giác mạnh.',
            'Bám vào đuôi xe buýt hoặc xe tải cho đỡ tốn sức.'
          ],
          correct: 1,
          time: 30
        },
        {
          question: 'Khi muốn chuyển hướng (rẽ trái hoặc rẽ phải) bằng xe đạp hoặc xe đạp điện, việc cần làm trước tiên là gì?',
          options: [
            'Giảm tốc độ, quan sát kỹ hai phía và có tín hiệu báo hướng rẽ.',
            'Rẽ đột ngột ngay lập tức để tiết kiệm thời gian.',
            'Chỉ nhìn về phía trước, không cần quan sát phía sau.',
            'Dùng tay đẩy các phương tiện đi bên cạnh ra xa.'
          ],
          correct: 0,
          time: 30
        },
        {
          question: 'Độ tuổi tối thiểu theo quy định pháp luật để điều khiển xe gắn máy có dung tích xi-lanh dưới $50\\text{ cm}^3$ là bao nhiêu?',
          options: [
            'Đủ 12 tuổi trở lên.',
            'Đủ 14 tuổi trở lên.',
            'Đủ 16 tuổi trở lên.',
            'Đủ 18 tuổi trở lên.'
          ],
          correct: 2,
          time: 30
        },
        {
          question: 'Khi đi bộ qua đường tại nơi không có cầu vượt hay hầm đi bộ, em nên đi qua ở vị trí nào?',
          options: [
            'Chạy cắt ngang giữa dòng xe đang lưu thông ở bất kỳ đoạn đường nào.',
            'Trèo qua dải phân cách cứng giữa đường để đi tắt.',
            'Đi đúng phần đường có vạch kẻ sơn trắng dành cho người đi bộ và quan sát an toàn.',
            'Vừa đi qua đường vừa cúi mặt xem điện thoại.'
          ],
          correct: 2,
          time: 30
        },
        {
          question: 'Biển báo giao thông hình tròn, nền trắng, viền đỏ, bên trong có hình vẽ màu đen là nhóm biển báo nào?',
          options: [
            'Biển báo hiệu lệnh.',
            'Biển báo nguy hiểm.',
            'Biển báo cấm.',
            'Biển chỉ dẫn.'
          ],
          correct: 2,
          time: 30
        },
        {
          question: 'Trong lúc điều khiển xe tham gia giao thông, hành vi nào sau đây bị nghiêm cấm vì gây mất an toàn?',
          options: [
            'Đi đúng làn đường và tuân thủ tốc độ quy định.',
            'Sử dụng điện thoại di động, đeo tai nghe hoặc ô (dù) khi đang lái xe.',
            'Bật đèn chiếu sáng vào buổi tối theo quy định.',
            'Nhường đường cho người đi bộ qua vạch kẻ đường.'
          ],
          correct: 1,
          time: 30
        },
        {
          question: 'Khi đi qua đường sắt không có rào chắn nhưng nghe thấy tiếng còi tàu hoặc thấy đèn đỏ nhấp nháy, em phải làm gì?',
          options: [
            'Cố gắng chạy thật nhanh qua đường ray trước khi tàu đến.',
            'Dừng lại ngay cách ray gần nhất tối thiểu 5 mét để nhường đường cho tàu hỏa.',
            'Đứng sát thanh ray quay video tàu chạy qua.',
            'Đẩy xe qua nửa đường rồi đứng chờ trên đường ray.'
          ],
          correct: 1,
          time: 30
        },
        {
          question: 'Văn hóa giao thông học đường đẹp nhất khi tan trường trước cổng trường là gì?',
          options: [
            'Xếp hàng đi theo trật tự, nhường đường, không tụ tập lòng đường gây ùn tắc.',
            'Lao xe nhanh ra khỏi cổng trường để giành đường trước.',
            'Đỗ xe thành 4–5 hàng dưới lòng đường chờ bạn.',
            'Bóp còi inh ỏi thúc giục phụ huynh và học sinh khác.'
          ],
          correct: 0,
          time: 30
        }
      ]
    },
    {
      id: 'builtin_skss',
      title: 'Kỹ Năng Sống & Sức Khỏe Sinh Sản Vị Thành Niên',
      topic: 'Sức khỏe sinh sản',
      isBuiltin: true,
      questions: [
        {
          question: 'Biểu hiện thay đổi về tâm sinh lý ở tuổi vị thành niên nào dưới đây là hoàn toàn tự nhiên và bình thường?',
          options: [
            'Cơ thể phát triển nhanh, giọng nói thay đổi, xuất hiện cảm xúc rung động hoặc nhạy cảm hơn.',
            'Bắt buộc phải giống hệt tốc độ phát triển của tất cả bạn cùng lớp.',
            'Luôn phải thu mình lại và không chia sẻ với bất kỳ ai.',
            'Chỉ xảy ra ở một giới tính nhất định.'
          ],
          correct: 0,
          time: 30
        },
        {
          question: 'Khái niệm "Quyền bất khả xâm phạm về thân thể" giúp học sinh hiểu điều gì?',
          options: [
            'Chỉ người lạ mới cần xin phép khi chạm vào người mình.',
            'Không ai có quyền chạm vào vùng nhạy cảm hoặc làm tổn thương cơ thể em khi chưa được đồng ý và không vì mục đích y tế chính đáng.',
            'Bạn thân có thể trêu chọc, đụng chạm cơ thể nhau tùy thích.',
            'Phải giữ im lặng nếu bị người quen có hành vi xâm hại.'
          ],
          correct: 1,
          time: 30
        },
        {
          question: 'Khi gặp tình huống có người cố tình nhắn tin, gửi hình ảnh nhạy cảm hoặc đe dọa trên mạng xã hội, bước xử lý an toàn nhất là gì?',
          options: [
            'Làm theo yêu cầu của họ vì sợ bị phát tán thông tin.',
            'Chặn tài khoản, chụp lại bằng chứng và báo ngay cho cha mẹ, thầy cô hoặc tổng đài 111.',
            'Xóa hết lịch sử trò chuyện và giữ bí mật một mình.',
            'Hẹn gặp riêng người đó để thương lượng.'
          ],
          correct: 1,
          time: 30
        },
        {
          question: 'Cách giữ vệ sinh cá nhân đúng đắn trong giai đoạn tuổi dậy thì là gì?',
          options: [
            'Tắm rửa sạch sẽ hằng ngày, thay đồ lót thoáng mát và dùng sản phẩm phù hợp an toàn.',
            'Hạn chế tắm gội vào những ngày cơ thể thay đổi nhiều mồ hôi.',
            'Sử dụng chung khăn tắm và bàn chải cá nhân với bạn bè.',
            'Dùng mỹ phẩm không rõ nguồn gốc để xử lý mụn tuổi dậy thì.'
          ],
          correct: 0,
          time: 30
        },
        {
          question: 'Tình bạn đẹp khác giới ở lứa tuổi học trò nên được xây dựng dựa trên nguyên tắc nào?',
          options: [
            'Tôn trọng, chân thành, giữ ranh giới phù hợp lứa tuổi và cùng nhau tiến bộ trong học tập.',
            'Kiểm soát điện thoại, mật khẩu và mọi mối quan hệ của bạn.',
            'Ép buộc bạn phải chứng minh tình cảm bằng những hành động vượt giới hạn.',
            'Bỏ bê học hành và xa lánh các bạn khác trong lớp.'
          ],
          correct: 0,
          time: 30
        },
        {
          question: 'Tổng đài Quốc gia Bảo vệ Trẻ em miễn phí 24/7 tại Việt Nam có đầu số là bao nhiêu?',
          options: [
            '113',
            '114',
            '111',
            '115'
          ],
          correct: 2,
          time: 30
        },
        {
          question: 'Quan niệm nào thể hiện nhận thức đúng đắn về bình đẳng giới trong học đường?',
          options: [
            'Con trai không được khóc và con gái không nên học tốt môn Tự nhiên.',
            'Cả bạn nam và bạn nữ đều được tôn trọng cơ hội học tập, phát triển năng lực và chia sẻ công việc như nhau.',
            'Chỉ bạn nam mới phù hợp làm lớp trưởng hoặc đội trưởng.',
            'Việc dọn dẹp lớp học chỉ là trách nhiệm của các bạn nữ.'
          ],
          correct: 1,
          time: 30
        },
        {
          question: 'Khi tìm hiểu kiến thức về giới tính và sức khỏe sinh sản, em nên ưu tiên nguồn thông tin nào?',
          options: [
            'Các trang web trôi nổi, thiếu kiểm chứng trên mạng xã hội.',
            'Sách giáo khoa, chuyên gia y tế, bác sĩ, giáo viên hoặc cha mẹ đáng tin cậy.',
            'Tin đồn truyền miệng chưa xác thực từ bạn bè.',
            'Tự suy đoán dựa trên phim ảnh giải trí.'
          ],
          correct: 1,
          time: 30
        },
        {
          question: 'Kỹ năng từ chối quyết đoán ("Nói KHÔNG an toàn") cần được áp dụng trong tình huống nào?',
          options: [
            'Khi được rủ rê sử dụng thuốc lá điện tử, chất kích thích hoặc vào nơi vắng vẻ đáng ngờ.',
            'Khi thầy cô giao bài tập nhóm.',
            'Khi bạn bè góp ý chân thành giúp em sửa lỗi.',
            'Khi gia đình nhắc nhở giờ giấc sinh hoạt khoa học.'
          ],
          correct: 0,
          time: 30
        },
        {
          question: 'Điều gì giúp tuổi vị thành niên phát triển cân bằng cả về thể chất lẫn tinh thần?',
          options: [
            'Thức khuya chơi game và ăn uống thiếu điều độ.',
            'Ngủ đủ giấc, ăn uống đủ chất, rèn luyện thể thao và cởi mở chia sẻ khó khăn với người thân.',
            'Nhịn ăn để giảm cân cấp tốc theo trào lưu mạng.',
            'Tránh xa mọi hoạt động ngoại khóa cùng tập thể.'
          ],
          correct: 1,
          time: 30
        }
      ]
    },
    {
      id: 'builtin_math_stem',
      title: 'Ôn Tập Toán & KHTN (Mẫu Công Thức KaTeX)',
      topic: 'Ôn thi Tuyển sinh 10',
      isBuiltin: true,
      questions: [
        {
          question: 'Nghiệm của phương trình bậc hai $x^{2} - 5x + 6 = 0$ là cặp giá trị nào?',
          options: [
            '$x = 2$ và $x = 3$',
            '$x = -2$ và $x = -3$',
            '$x = 1$ và $x = 6$',
            '$x = -1$ và $x = 6$'
          ],
          correct: 0,
          time: 45
        },
        {
          question: 'Giá trị rút gọn của biểu thức $\\sqrt{144} + \\sqrt{25}$ bằng bao nhiêu?',
          options: [
            '$13$',
            '$17$',
            '$19$',
            '$169$'
          ],
          correct: 1,
          time: 30
        },
        {
          question: 'Công thức hóa học của axit sunfuric loãng thường dùng trong phòng thí nghiệm là gì?',
          options: [
            '$HCl$',
            '$HNO_{3}$',
            '$H_{2}SO_{4}$',
            '$Ca(OH)_{2}$'
          ],
          correct: 2,
          time: 30
        },
        {
          question: 'Cho tam giác vuông có hai cạnh góc vuông là $a = 6\\text{ cm}$ và $b = 8\\text{ cm}$. Theo định lý Pythagore $c^{2} = a^{2} + b^{2}$, cạnh huyền $c$ bằng:',
          options: [
            '$10\\text{ cm}$',
            '$12\\text{ cm}$',
            '$14\\text{ cm}$',
            '$100\\text{ cm}$'
          ],
          correct: 0,
          time: 45
        },
        {
          question: 'Công thức định luật Ôm trong mạch điện là $I = \\frac{U}{R}$. Nếu hiệu điện thế $U = 12\\text{ V}$ và điện trở $R = 4\\text{ }\\Omega$, cường độ dòng điện $I$ bằng:',
          options: [
            '$48\\text{ A}$',
            '$3\\text{ A}$',
            '$0{,}33\\text{ A}$',
            '$8\\text{ A}$'
          ],
          correct: 1,
          time: 30
        },
        {
          question: 'Khai triển hằng đẳng thức đáng nhớ $(a + b)^{2}$ ta được kết quả đúng là:',
          options: [
            '$a^{2} + b^{2}$',
            '$a^{2} - 2ab + b^{2}$',
            '$a^{2} + 2ab + b^{2}$',
            '$a^{2} + ab + b^{2}$'
          ],
          correct: 2,
          time: 30
        },
        {
          question: 'Khi đốt cháy hoàn toàn khí mêtan ($CH_{4}$) trong khí oxi ($O_{2}$), sản phẩm thu được là cặp chất nào?',
          options: [
            '$CO_{2}$ và $H_{2}O$',
            '$SO_{2}$ và $H_{2}O$',
            '$NaCl$ và $H_{2}$',
            '$CaCO_{3}$ và $O_{2}$'
          ],
          correct: 0,
          time: 30
        },
        {
          question: 'Một xe chuyển động đều với vận tốc $v = 36\\text{ km/h}$ ($= 10\\text{ m/s}$). Trong thời gian $t = 20\\text{ s}$, quãng đường $s = v \\cdot t$ xe đi được là:',
          options: [
            '$720\\text{ m}$',
            '$200\\text{ m}$',
            '$180\\text{ m}$',
            '$360\\text{ m}$'
          ],
          correct: 1,
          time: 30
        },
        {
          question: 'Với $x \\ge 0$, giá trị nào của $x$ thỏa mãn bất đẳng thức $\\sqrt{x} < 3$?',
          options: [
            '$0 \\le x < 9$',
            '$x > 9$',
            '$x \\ge 3$',
            '$0 \\le x < 3$'
          ],
          correct: 0,
          time: 45
        },
        {
          question: 'Diện tích hình tròn bán kính $R = 5\\text{ cm}$ tính theo công thức $S = \\pi R^{2}$ bằng:',
          options: [
            '$10\\pi\\text{ cm}^{2}$',
            '$25\\pi\\text{ cm}^{2}$',
            '$5\\pi\\text{ cm}^{2}$',
            '$50\\pi\\text{ cm}^{2}$'
          ],
          correct: 1,
          time: 30
        }
      ]
    },
    {
      id: 'builtin_pool_30_thcs',
      title: 'Kho 30 Câu Ôn Tập Tổng Hợp THCS (Bốc 10 Câu/Lượt)',
      topic: 'Kho trộn cuối kỳ',
      isBuiltin: true,
      questions: [
        {
          question: 'Giải phương trình bậc nhất $3x - 9 = 0$, ta thu được nghiệm $x$ bằng:',
          options: ['$x = 3$', '$x = -3$', '$x = 6$', '$x = \\frac{1}{3}$'],
          correct: 0,
          time: 30
        },
        {
          question: 'Tổng số đo ba góc trong một tam giác phẳng bất kỳ luôn bằng bao nhiêu độ?',
          options: ['$90^{\\circ}$', '$180^{\\circ}$', '$270^{\\circ}$', '$360^{\\circ}$'],
          correct: 1,
          time: 30
        },
        {
          question: 'Giá trị của biểu thức $\\frac{3}{4} + \\frac{1}{2}$ là phân số nào?',
          options: ['$\\frac{4}{6}$', '$\\frac{5}{4}$', '$\\frac{3}{8}$', '$1$'],
          correct: 1,
          time: 30
        },
        {
          question: 'Với $a > 0$, rút gọn biểu thức $\\sqrt{16a^{2}}$ ta được kết quả là:',
          options: ['$4a$', '$8a$', '$16a$', '$4a^{2}$'],
          correct: 0,
          time: 30
        },
        {
          question: 'Hàm số bậc nhất $y = 2x - 3$ có hệ số góc là bao nhiêu?',
          options: ['$-3$', '$2$', '$\\frac{3}{2}$', '$-2$'],
          correct: 1,
          time: 30
        },
        {
          question: 'Trong không khí sạch, thành phần khí chiếm tỉ lệ thể tích lớn nhất (khoảng $78\\%$) là khí nào?',
          options: ['Khí oxi ($O_{2}$)', 'Khí nitơ ($N_{2}$)', 'Khí cacbon đioxit ($CO_{2}$)', 'Khí hiđro ($H_{2}$)'],
          correct: 1,
          time: 30
        },
        {
          question: 'Dung dịch làm quỳ tím chuyển sang màu xanh thuộc loại hợp chất nào?',
          options: ['Axit', 'Bazơ (Kiềm)', 'Muối trung hòa', 'Nước cất'],
          correct: 1,
          time: 30
        },
        {
          question: 'Khối lượng riêng của nước tinh khiết ở $4^{\\circ}\\text{C}$ xấp xỉ bằng bao nhiêu?',
          options: ['$100\\text{ kg/m}^{3}$', '$1000\\text{ kg/m}^{3}$', '$500\\text{ kg/m}^{3}$', '$10\\text{ kg/m}^{3}$'],
          correct: 1,
          time: 30
        },
        {
          question: 'Đơn vị đo công suất cơ học và công suất điện trong hệ SI là gì?',
          options: ['Jun ($\\text{J}$)', 'Niu-tơn ($\\text{N}$)', 'Oát ($\\text{W}$)', 'Vôn ($\\text{V}$)'],
          correct: 2,
          time: 30
        },
        {
          question: 'Khi đun nóng một thanh kim loại đồng chất, đại lượng vật lý nào của thanh sẽ TĂNG lên?',
          options: ['Khối lượng', 'Thể tích và chiều dài', 'Trọng lượng', 'Bản chất kim loại'],
          correct: 1,
          time: 30
        },
        {
          question: 'Bào quan nào trong tế bào thực vật chứa sắc tố diệp lục giúp thực hiện quá trình quang hợp?',
          options: ['Ti thể', 'Lục lạp', 'Không bào', 'Bộ máy Gôngi'],
          correct: 1,
          time: 30
        },
        {
          question: 'Trong cơ thể người, cơ quan nào đóng vai trò chủ yếu trong việc bơm máu đi khắp hệ tuần hoàn?',
          options: ['Phổi', 'Gan', 'Tim', 'Thận'],
          correct: 2,
          time: 30
        },
        {
          question: 'Chiến thắng Bạch Đằng năm $938$ gắn liền với tên tuổi vị anh hùng dân tộc nào?',
          options: ['Lý Thường Kiệt', 'Ngô Quyền', 'Trần Hưng Đạo', 'Quang Trung'],
          correct: 1,
          time: 30
        },
        {
          question: 'Quốc hiệu đầu tiên "Văn Lang" gắn liền với thời đại nào trong lịch sử Việt Nam?',
          options: ['Thời đại các Vua Hùng', 'Nhà Lý', 'Nhà Trần', 'Nhà Hậu Lê'],
          correct: 0,
          time: 30
        },
        {
          question: 'Đỉnh núi Phan-xi-păng được mệnh danh là "Nóc nhà Đông Dương" nằm ở dãy núi nào?',
          options: ['Trường Sơn Bắc', 'Hoàng Liên Sơn', 'Tam Điệp', 'Bạch Mã'],
          correct: 1,
          time: 30
        },
        {
          question: 'Con sông nào chảy qua Thủ đô Hà Nội và gắn với nhiều dấu ấn văn hóa lịch sử?',
          options: ['Sông Hồng', 'Sông Hương', 'Sông Tiền', 'Sông Đồng Nai'],
          correct: 0,
          time: 30
        },
        {
          question: 'Biện pháp tu từ nào gán đặc điểm, hành động của con người cho vật vô tri hoặc loài vật?',
          options: ['So sánh', 'Nhân hóa', 'Điệp ngữ', 'Nói quá'],
          correct: 1,
          time: 30
        },
        {
          question: 'Tác giả của kiệt tác "Truyện Kiều" (Đoạn trường tân thanh) trong văn học Việt Nam là ai?',
          options: ['Nguyễn Trãi', 'Nguyễn Du', 'Hồ Xuân Hương', 'Nguyễn Khuyến'],
          correct: 1,
          time: 30
        },
        {
          question: 'Khi đặt mật khẩu an toàn cho tài khoản học tập trực tuyến, nguyên tắc nào tốt nhất?',
          options: [
            'Dùng ngày sinh hoặc số điện thoại cho dễ nhớ.',
            'Kết hợp chữ hoa, chữ thường, chữ số và ký tự đặc biệt dài từ 8 ký tự trở lên.',
            'Đặt chung một mật khẩu "123456" cho mọi tài khoản.',
            'Chia sẻ mật khẩu cho bạn cùng bàn để nhờ đăng nhập hộ.'
          ],
          correct: 1,
          time: 30
        },
        {
          question: 'Hành động nào thể hiện tinh thần hợp tác hiệu quả trong làm việc nhóm ở lớp học?',
          options: [
            'Phân công rõ nhiệm vụ, lắng nghe góp ý và hỗ trợ bạn hoàn thành phần việc khó.',
            'Để một bạn học giỏi làm toàn bộ sản phẩm của cả nhóm.',
            'Bác bỏ mọi ý kiến của các bạn khác để làm theo ý mình.',
            'Không tham gia thảo luận nhưng vẫn đòi ghi tên đạt điểm cao.'
          ],
          correct: 0,
          time: 30
        },
        {
          question: 'Cho $H_{2}O$ điện phân hoàn toàn tạo ra hai chất khí nào sau đây?',
          options: ['$H_{2}$ và $O_{2}$', '$CO_{2}$ và $N_{2}$', '$Cl_{2}$ và $H_{2}$', '$SO_{2}$ và $O_{2}$'],
          correct: 0,
          time: 30
        },
        {
          question: 'Nghiệm của bất phương trình $2x - 8 > 0$ là tập hợp các giá trị nào?',
          options: ['$x > 4$', '$x < 4$', '$x \\ge 4$', '$x > -4$'],
          correct: 0,
          time: 30
        },
        {
          question: 'Trong tam giác vuông có cạnh huyền $c = 13\\text{ cm}$ và một cạnh góc vuông $a = 5\\text{ cm}$, cạnh góc vuông còn lại $b$ bằng:',
          options: ['$12\\text{ cm}$', '$8\\text{ cm}$', '$10\\text{ cm}$', '$18\\text{ cm}$'],
          correct: 0,
          time: 45
        },
        {
          question: 'Hiệu điện thế định mức của mạng điện sinh hoạt gia đình tại Việt Nam thường là bao nhiêu?',
          options: ['$110\\text{ V}$', '$220\\text{ V}$', '$12\\text{ V}$', '$380\\text{ V}$'],
          correct: 1,
          time: 30
        },
        {
          question: 'Việt Nam gia nhập Hiệp hội các quốc gia Đông Nam Á (ASEAN) vào năm nào?',
          options: ['$1990$', '$1995$', '$2000$', '$2007$'],
          correct: 1,
          time: 30
        },
        {
          question: 'Hằng đẳng thức hiệu hai bình phương $a^{2} - b^{2}$ được viết dưới dạng tích đúng là:',
          options: ['$(a - b)^{2}$', '$(a - b)(a + b)$', '$(a + b)^{2}$', '$a(a - b)$'],
          correct: 1,
          time: 30
        },
        {
          question: 'Kim loại nào sau đây dẫn điện tốt ở trạng thái rắn và thường dùng làm lõi dây điện dân dụng?',
          options: ['Chì ($Pb$)', 'Đồng ($Cu$)', 'Thủy ngân ($Hg$)', 'Natri ($Na$)'],
          correct: 1,
          time: 30
        },
        {
          question: 'Trong câu tiếng Anh "She ____ to school every morning", động từ thích hợp điền vào chỗ trống là:',
          options: ['go', 'goes', 'going', 'went'],
          correct: 1,
          time: 30
        },
        {
          question: 'Ngày Nhà giáo Việt Nam được tổ chức trang trọng hằng năm vào ngày tháng nào?',
          options: ['Ngày 20 tháng 10', 'Ngày 20 tháng 11', 'Ngày 26 tháng 3', 'Ngày 19 tháng 5'],
          correct: 1,
          time: 30
        },
        {
          question: 'Biện pháp thiết thực nhất học sinh có thể làm hằng ngày để bảo vệ môi trường trường học là gì?',
          options: [
            'Bỏ rác đúng nơi quy định, tiết kiệm điện nước và chăm sóc cây xanh sân trường.',
            'Đốt rác nhựa ngay sau góc lớp học.',
            'Để quên quạt và đèn sáng suốt giờ ra chơi.',
            'Bẻ cành hoa trong bồn cây trường để trang trí cặp sách.'
          ],
          correct: 0,
          time: 30
        }
      ]
    }
  ];

  window.GMM_BUILTIN_TOPIC_SETS = BUILTIN_TOPIC_SETS;
})();
