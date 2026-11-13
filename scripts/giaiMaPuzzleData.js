/**
 * ==============================================================================
 * MODULE DỮ LIỆU & RENDER MA TRẬN BỨC TRANH BÍ ẨN: "TRI ÂN THẦY CÔ 20/11"
 * File: scripts/giaiMaPuzzleData.js
 * Đơn vị: TRƯỜNG THCS TÂN HẢI
 *
 * PHIÊN BẢN NÂNG CẤP TOÀN DIỆN (64x40 HIGH-RES ORTHOGONAL POLYOMINO MATRIX):
 * - Chuẩn Typography Tiếng Việt có dấu trang trọng: "TRI ÂN THẦY CÔ" đầy đủ dấu mũ (^),
 *   dấu huyền (\) tách bạch, chữ số "2" uốn vòm cổ điển chuẩn mẫu tranh ma trận.
 * - Hỗ trợ chuyển đổi tức thì giữa 2 kiểu ngày lễ: "20/11" (gạch chéo) & "20-11" (gạch ngang).
 * - Hỗ trợ chế độ "Liền Khối Nghệ Thuật" (Seamless Strokes) làm tan biến đường gân nội bộ
 *   cùng màu khi công bố đáp án rực rỡ trên màn hình máy chiếu.
 * ==============================================================================
 */

(function () {
  'use strict';

  const STORAGE_KEY_DATE_SEP = 'gmm_date_sep_style_v1';
  const STORAGE_KEY_COLOR_OVERRIDES = 'gmm_default_color_overrides_v1';

  const BASE_COLOR_RULES = {
    '1B': { qNum: 1, color: '#dc2626', name: 'Đỏ son', part: 'Chữ TRI' },
    '2C': { qNum: 2, color: '#dc2626', name: 'Đỏ son', part: 'Chữ ÂN' },
    '3A': { qNum: 3, color: '#f59e0b', name: 'Vàng cam', part: 'Chữ THẦY' },
    '4C': { qNum: 4, color: '#f59e0b', name: 'Vàng cam', part: 'Chữ CÔ' },
    '5B': { qNum: 5, color: '#2563eb', name: 'Xanh dương', part: 'Số 20' },
    '6C': { qNum: 6, color: '#2563eb', name: 'Xanh dương', part: 'Số /11' },
    '7C': { qNum: 7, color: '#ec4899', name: 'Hồng sen', part: 'Trái Tim Trái' },
    '8A': { qNum: 8, color: '#ec4899', name: 'Hồng sen', part: 'Trái Tim Phải' },
    '9A': { qNum: 9, color: '#10b981', name: 'Xanh lục', part: 'Nhành Lá Tri Ân' },
    '10B': { qNum: 10, color: '#eab308', name: 'Vàng kim', part: 'Ngôi Sao Tri Thức' }
  };

  // 1. BẢNG QUY ƯỚC MÃ MÀU 10 CÂU HỎI CHỦ ĐỀ 20/11
  const COLOR_RULES = {};
  Object.keys(BASE_COLOR_RULES).forEach(k => {
    COLOR_RULES[k] = Object.assign({}, BASE_COLOR_RULES[k]);
  });

  // 2A. MA TRẬN KIỂU DẤU GẠCH CHÉO "20/11" (91 MẢNG MÀU CHUẨN)
  const PUZZLE_CELLS_SLASH = [
    {"id":"piece_0","code":"1A","isTarget":false,"d":"M 0 0 L 87.5 0 L 87.5 13 L 0 13 Z","labelPos":[43.8,6.5],"fontSize":8},
    {"id":"piece_1","code":"1D","isTarget":false,"d":"M 87.5 0 L 175 0 L 175 13 L 150 13 L 150 26 L 137.5 26 L 137.5 13 L 87.5 13 Z","labelPos":[131.3,6.5],"fontSize":8},
    {"id":"piece_2","code":"1A","isTarget":false,"d":"M 175 0 L 262.5 0 L 262.5 26 L 237.5 26 L 237.5 13 L 175 13 Z","labelPos":[225,6.5],"fontSize":8},
    {"id":"piece_3","code":"1D","isTarget":false,"d":"M 212.5 26 L 262.5 26 L 262.5 0 L 275 0 L 275 13 L 300 13 L 300 52 L 262.5 52 L 262.5 39 L 212.5 39 Z","labelPos":[281.3,32.5],"fontSize":8.5},
    {"id":"piece_4","code":"1A","isTarget":false,"d":"M 275 0 L 362.5 0 L 362.5 26 L 325 26 L 325 13 L 275 13 Z","labelPos":[343.8,13],"fontSize":8.5},
    {"id":"piece_5","code":"10D","isTarget":false,"d":"M 362.5 0 L 450 0 L 450 26 L 425 26 L 425 13 L 400 13 L 400 26 L 362.5 26 Z","labelPos":[381.3,13],"fontSize":8},
    {"id":"piece_6","code":"2A","isTarget":false,"d":"M 450 0 L 537.5 0 L 537.5 13 L 512.5 13 L 512.5 26 L 450 26 Z","labelPos":[487.5,13],"fontSize":8.5},
    {"id":"piece_7","code":"2D","isTarget":false,"d":"M 512.5 13 L 537.5 13 L 537.5 0 L 600 0 L 600 13 L 562.5 13 L 562.5 26 L 550 26 L 550 39 L 512.5 39 Z","labelPos":[531.3,26],"fontSize":8.5},
    {"id":"piece_8","code":"2A","isTarget":false,"d":"M 600 0 L 687.5 0 L 687.5 39 L 675 39 L 675 26 L 662.5 26 L 662.5 13 L 600 13 Z","labelPos":[656.3,6.5],"fontSize":8},
    {"id":"piece_9","code":"2D","isTarget":false,"d":"M 687.5 0 L 775 0 L 775 13 L 700 13 L 700 26 L 687.5 26 Z","labelPos":[725,6.5],"fontSize":8},
    {"id":"piece_10","code":"2A","isTarget":false,"d":"M 775 0 L 800 0 L 800 52 L 787.5 52 L 787.5 65 L 737.5 65 L 737.5 52 L 750 52 L 750 39 L 775 39 Z","labelPos":[768.8,52],"fontSize":8.5},
    {"id":"piece_11","code":"1D","isTarget":false,"d":"M 0 13 L 87.5 13 L 87.5 39 L 50 39 L 50 26 L 0 26 Z","labelPos":[68.8,26],"fontSize":8.5},
    {"id":"piece_12","code":"1A","isTarget":false,"d":"M 87.5 13 L 137.5 13 L 137.5 26 L 175 26 L 175 39 L 87.5 39 Z","labelPos":[112.5,26],"fontSize":8.5},
    {"id":"piece_13","code":"1C","isTarget":false,"d":"M 150 13 L 237.5 13 L 237.5 26 L 212.5 26 L 212.5 39 L 175 39 L 175 26 L 150 26 Z","labelPos":[193.8,26],"fontSize":8.5},
    {"id":"piece_14","code":"1C","isTarget":false,"d":"M 300 13 L 325 13 L 325 26 L 387.5 26 L 387.5 39 L 375 39 L 375 52 L 362.5 52 L 362.5 39 L 300 39 Z","labelPos":[337.5,32.5],"fontSize":8},
    {"id":"piece_15","code":"10C","isTarget":false,"d":"M 475 52 L 462.5 52 L 462.5 39 L 387.5 39 L 387.5 26 L 400 26 L 400 13 L 425 13 L 425 26 L 475 26 Z","labelPos":[431.3,32.5],"fontSize":7.5},
    {"id":"piece_16","code":"2C","isTarget":true,"d":"M 562.5 13 L 575 13 L 575 26 L 587.5 26 L 587.5 39 L 600 39 L 600 52 L 575 52 L 575 39 L 562.5 39 Z","labelPos":[575,32.5],"fontSize":8,"targetColor":"#dc2626"},
    {"id":"piece_17","code":"2B","isTarget":false,"d":"M 575 13 L 662.5 13 L 662.5 26 L 650 26 L 650 39 L 587.5 39 L 587.5 26 L 575 26 Z","labelPos":[618.8,26],"fontSize":8.5},
    {"id":"piece_18","code":"2B","isTarget":false,"d":"M 687.5 26 L 700 26 L 700 13 L 775 13 L 775 39 L 750 39 L 750 52 L 737.5 52 L 737.5 26 L 712.5 26 L 712.5 39 L 687.5 39 Z","labelPos":[756.3,26],"fontSize":8.5},
    {"id":"piece_19","code":"1C","isTarget":false,"d":"M 0 26 L 50 26 L 50 52 L 0 52 Z","labelPos":[25,39],"fontSize":8.5},
    {"id":"piece_20","code":"2B","isTarget":false,"d":"M 550 65 L 550 78 L 537.5 78 L 537.5 65 L 500 65 L 500 52 L 475 52 L 475 26 L 512.5 26 L 512.5 39 L 537.5 39 L 537.5 52 L 562.5 52 L 562.5 65 Z","labelPos":[518.8,52],"fontSize":8.5},
    {"id":"piece_21","code":"2C","isTarget":true,"d":"M 550 26 L 562.5 26 L 562.5 52 L 537.5 52 L 537.5 39 L 550 39 Z","labelPos":[550,45.5],"fontSize":8,"targetColor":"#dc2626"},
    {"id":"piece_22","code":"2D","isTarget":false,"d":"M 650 26 L 675 26 L 675 39 L 712.5 39 L 712.5 26 L 737.5 26 L 737.5 52 L 650 52 Z","labelPos":[693.8,45.5],"fontSize":8},
    {"id":"piece_23","code":"1A","isTarget":false,"d":"M 0 52 L 50 52 L 50 39 L 87.5 39 L 87.5 52 L 112.5 52 L 112.5 65 L 37.5 65 L 37.5 78 L 12.5 78 L 12.5 65 L 0 65 Z","labelPos":[68.8,52],"fontSize":8.5},
    {"id":"piece_24","code":"1C","isTarget":false,"d":"M 87.5 39 L 175 39 L 175 65 L 112.5 65 L 112.5 52 L 87.5 52 Z","labelPos":[137.5,52],"fontSize":8.5},
    {"id":"piece_25","code":"1A","isTarget":false,"d":"M 175 39 L 262.5 39 L 262.5 52 L 237.5 52 L 237.5 65 L 175 65 Z","labelPos":[212.5,52],"fontSize":8.5},
    {"id":"piece_26","code":"1A","isTarget":false,"d":"M 300 39 L 362.5 39 L 362.5 52 L 387.5 52 L 387.5 65 L 375 65 L 375 78 L 325 78 L 325 52 L 300 52 Z","labelPos":[350,65],"fontSize":8.5},
    {"id":"piece_27","code":"10D","isTarget":false,"d":"M 375 39 L 462.5 39 L 462.5 52 L 450 52 L 450 65 L 387.5 65 L 387.5 52 L 375 52 Z","labelPos":[418.8,52],"fontSize":8},
    {"id":"piece_28","code":"2A","isTarget":false,"d":"M 562.5 39 L 575 39 L 575 52 L 600 52 L 600 39 L 650 39 L 650 65 L 562.5 65 Z","labelPos":[625,52],"fontSize":8.5},
    {"id":"piece_29","code":"1C","isTarget":false,"d":"M 237.5 52 L 325 52 L 325 65 L 275 65 L 275 78 L 287.5 78 L 287.5 91 L 250 91 L 250 78 L 237.5 78 Z","labelPos":[256.3,65],"fontSize":8.5},
    {"id":"piece_30","code":"10A","isTarget":false,"d":"M 450 78 L 450 91 L 437.5 91 L 437.5 78 L 425 78 L 425 65 L 450 65 L 450 52 L 500 52 L 500 65 L 487.5 65 L 487.5 78 Z","labelPos":[468.8,65],"fontSize":8},
    {"id":"piece_31","code":"2B","isTarget":false,"d":"M 700 117 L 687.5 117 L 687.5 91 L 675 91 L 675 78 L 662.5 78 L 662.5 65 L 650 65 L 650 52 L 737.5 52 L 737.5 65 L 700 65 Z","labelPos":[681.3,65],"fontSize":8.5},
    {"id":"piece_32","code":"2D","isTarget":false,"d":"M 787.5 52 L 800 52 L 800 78 L 775 78 L 775 91 L 725 91 L 725 65 L 787.5 65 Z","labelPos":[750,78],"fontSize":8.5},
    {"id":"piece_33","code":"1D","isTarget":false,"d":"M 0 65 L 12.5 65 L 12.5 78 L 37.5 78 L 37.5 65 L 75 65 L 75 91 L 0 91 Z","labelPos":[56.3,78],"fontSize":8.5},
    {"id":"piece_34","code":"1B","isTarget":true,"d":"M 75 65 L 150 65 L 150 91 L 75 91 Z","labelPos":[112.5,78],"fontSize":8.5,"targetColor":"#dc2626"},
    {"id":"piece_35","code":"1D","isTarget":false,"d":"M 150 65 L 175 65 L 175 104 L 137.5 104 L 137.5 91 L 150 91 Z","labelPos":[156.3,97.5],"fontSize":8},
    {"id":"piece_36","code":"1B","isTarget":true,"d":"M 175 65 L 237.5 65 L 237.5 78 L 250 78 L 250 104 L 225 104 L 225 78 L 200 78 L 200 91 L 187.5 91 L 187.5 78 L 175 78 Z","labelPos":[212.5,71.5],"fontSize":8,"targetColor":"#dc2626"},
    {"id":"piece_37","code":"1B","isTarget":true,"d":"M 275 65 L 325 65 L 325 78 L 312.5 78 L 312.5 104 L 300 104 L 300 117 L 287.5 117 L 287.5 78 L 275 78 Z","labelPos":[300,71.5],"fontSize":8,"targetColor":"#dc2626"},
    {"id":"piece_38","code":"10A","isTarget":false,"d":"M 412.5 65 L 412.5 78 L 400 78 L 400 91 L 362.5 91 L 362.5 117 L 350 117 L 350 104 L 325 104 L 325 78 L 375 78 L 375 65 Z","labelPos":[343.8,91],"fontSize":8},
    {"id":"piece_39","code":"10B","isTarget":true,"d":"M 412.5 65 L 425 65 L 425 78 L 437.5 78 L 437.5 91 L 450 91 L 450 104 L 412.5 104 L 412.5 117 L 400 117 L 400 104 L 387.5 104 L 387.5 91 L 400 91 L 400 78 L 412.5 78 Z","labelPos":[418.8,91],"fontSize":8,"targetColor":"#eab308"},
    {"id":"piece_40","code":"2A","isTarget":false,"d":"M 525 91 L 525 104 L 512.5 104 L 512.5 91 L 450 91 L 450 78 L 487.5 78 L 487.5 65 L 537.5 65 L 537.5 91 Z","labelPos":[512.5,78],"fontSize":8.5},
    {"id":"piece_41","code":"2C","isTarget":true,"d":"M 550 65 L 587.5 65 L 587.5 78 L 600 78 L 600 91 L 612.5 91 L 612.5 104 L 587.5 104 L 587.5 91 L 575 91 L 575 78 L 562.5 78 L 562.5 91 L 537.5 91 L 537.5 78 L 550 78 Z","labelPos":[568.8,71.5],"fontSize":8,"targetColor":"#dc2626"},
    {"id":"piece_42","code":"2B","isTarget":false,"d":"M 587.5 65 L 637.5 65 L 637.5 117 L 612.5 117 L 612.5 91 L 600 91 L 600 78 L 587.5 78 Z","labelPos":[618.8,78],"fontSize":8.5},
    {"id":"piece_43","code":"2C","isTarget":true,"d":"M 637.5 65 L 662.5 65 L 662.5 78 L 675 78 L 675 91 L 662.5 91 L 662.5 104 L 650 104 L 650 91 L 637.5 91 Z","labelPos":[656.3,84.5],"fontSize":8,"targetColor":"#dc2626"},
    {"id":"piece_44","code":"2C","isTarget":true,"d":"M 700 117 L 700 65 L 725 65 L 725 117 Z","labelPos":[712.5,91],"fontSize":8,"targetColor":"#dc2626"},
    {"id":"piece_45","code":"1B","isTarget":true,"d":"M 175 78 L 187.5 78 L 187.5 91 L 200 91 L 200 104 L 237.5 104 L 237.5 117 L 175 117 Z","labelPos":[200,110.5],"fontSize":8,"targetColor":"#dc2626"},
    {"id":"piece_46","code":"1C","isTarget":false,"d":"M 200 78 L 225 78 L 225 104 L 200 104 Z","labelPos":[212.5,91],"fontSize":8},
    {"id":"piece_47","code":"10D","isTarget":false,"d":"M 375 117 L 387.5 117 L 387.5 130 L 375 130 L 375 143 L 337.5 143 L 337.5 130 L 312.5 130 L 312.5 78 L 325 78 L 325 104 L 350 104 L 350 117 L 362.5 117 L 362.5 104 L 375 104 Z","labelPos":[331.3,117],"fontSize":8},
    {"id":"piece_48","code":"2A","isTarget":false,"d":"M 562.5 78 L 575 78 L 575 91 L 587.5 91 L 587.5 117 L 550 117 L 550 91 L 562.5 91 Z","labelPos":[568.8,104],"fontSize":8.5},
    {"id":"piece_49","code":"2B","isTarget":false,"d":"M 725 91 L 775 91 L 775 78 L 800 78 L 800 117 L 762.5 117 L 762.5 104 L 725 104 Z","labelPos":[781.3,104],"fontSize":8.5},
    {"id":"piece_50","code":"1A","isTarget":false,"d":"M 0 91 L 87.5 91 L 87.5 104 L 0 104 Z","labelPos":[43.8,97.5],"fontSize":8},
    {"id":"piece_51","code":"1D","isTarget":false,"d":"M 87.5 91 L 100 91 L 100 117 L 12.5 117 L 12.5 104 L 87.5 104 Z","labelPos":[62.5,110.5],"fontSize":8},
    {"id":"piece_52","code":"1B","isTarget":true,"d":"M 100 91 L 125 91 L 125 156 L 100 156 Z","labelPos":[112.5,123.5],"fontSize":8,"targetColor":"#dc2626"},
    {"id":"piece_53","code":"1C","isTarget":false,"d":"M 125 91 L 137.5 91 L 137.5 104 L 175 104 L 175 130 L 150 130 L 150 143 L 125 143 Z","labelPos":[150,117],"fontSize":8.5},
    {"id":"piece_54","code":"1A","isTarget":false,"d":"M 250 91 L 287.5 91 L 287.5 117 L 275 117 L 275 130 L 237.5 130 L 237.5 104 L 250 104 Z","labelPos":[268.8,104],"fontSize":8.5},
    {"id":"piece_55","code":"10B","isTarget":true,"d":"M 362.5 91 L 387.5 91 L 387.5 104 L 400 104 L 400 117 L 425 117 L 425 130 L 387.5 130 L 387.5 117 L 375 117 L 375 104 L 362.5 104 Z","labelPos":[406.3,123.5],"fontSize":7.5,"targetColor":"#eab308"},
    {"id":"piece_56","code":"10B","isTarget":true,"d":"M 412.5 104 L 450 104 L 450 91 L 475 91 L 475 104 L 462.5 104 L 462.5 117 L 412.5 117 Z","labelPos":[437.5,110.5],"fontSize":7.5,"targetColor":"#eab308"},
    {"id":"piece_57","code":"10A","isTarget":false,"d":"M 450 117 L 462.5 117 L 462.5 104 L 475 104 L 475 91 L 512.5 91 L 512.5 104 L 525 104 L 525 130 L 450 130 Z","labelPos":[493.8,117],"fontSize":8},
    {"id":"piece_58","code":"2C","isTarget":true,"d":"M 550 91 L 550 117 L 537.5 117 L 537.5 130 L 525 130 L 525 91 Z","labelPos":[537.5,104],"fontSize":8,"targetColor":"#dc2626"},
    {"id":"piece_59","code":"2C","isTarget":true,"d":"M 637.5 91 L 650 91 L 650 104 L 662.5 104 L 662.5 156 L 637.5 156 Z","labelPos":[650,123.5],"fontSize":8,"targetColor":"#dc2626"},
    {"id":"piece_60","code":"2C","isTarget":true,"d":"M 662.5 91 L 687.5 91 L 687.5 117 L 725 117 L 725 130 L 675 130 L 675 104 L 662.5 104 Z","labelPos":[700,123.5],"fontSize":8,"targetColor":"#dc2626"},
    {"id":"piece_61","code":"1C","isTarget":false,"d":"M 0 104 L 12.5 104 L 12.5 117 L 87.5 117 L 87.5 130 L 75 130 L 75 143 L 0 143 Z","labelPos":[37.5,130],"fontSize":8.5},
    {"id":"piece_62","code":"1B","isTarget":true,"d":"M 300 104 L 312.5 104 L 312.5 143 L 325 143 L 325 156 L 275 156 L 275 143 L 287.5 143 L 287.5 117 L 300 117 Z","labelPos":[300,149.5],"fontSize":8,"targetColor":"#dc2626"},
    {"id":"piece_63","code":"2C","isTarget":true,"d":"M 537.5 117 L 587.5 117 L 587.5 104 L 612.5 104 L 612.5 156 L 587.5 156 L 587.5 130 L 537.5 130 Z","labelPos":[587.5,123.5],"fontSize":8,"targetColor":"#dc2626"},
    {"id":"piece_64","code":"2B","isTarget":false,"d":"M 662.5 104 L 675 104 L 675 130 L 687.5 130 L 687.5 143 L 700 143 L 700 156 L 737.5 156 L 737.5 169 L 650 169 L 650 156 L 662.5 156 Z","labelPos":[681.3,156],"fontSize":8.5},
    {"id":"piece_65","code":"2D","isTarget":false,"d":"M 725 104 L 762.5 104 L 762.5 117 L 800 117 L 800 156 L 787.5 156 L 787.5 143 L 737.5 143 L 737.5 130 L 725 130 Z","labelPos":[762.5,130],"fontSize":8.5},
    {"id":"piece_66","code":"1A","isTarget":false,"d":"M 87.5 117 L 100 117 L 100 156 L 12.5 156 L 12.5 143 L 75 143 L 75 130 L 87.5 130 Z","labelPos":[68.8,149.5],"fontSize":8},
    {"id":"piece_67","code":"1C","isTarget":false,"d":"M 200 117 L 212.5 117 L 212.5 130 L 225 130 L 225 156 L 262.5 156 L 262.5 169 L 175 169 L 175 156 L 200 156 Z","labelPos":[212.5,162.5],"fontSize":8},
    {"id":"piece_68","code":"1B","isTarget":true,"d":"M 175 117 L 200 117 L 200 156 L 175 156 Z","labelPos":[187.5,136.5],"fontSize":8,"targetColor":"#dc2626"},
    {"id":"piece_69","code":"1B","isTarget":true,"d":"M 212.5 117 L 237.5 117 L 237.5 130 L 250 130 L 250 156 L 225 156 L 225 130 L 212.5 130 Z","labelPos":[237.5,143],"fontSize":8,"targetColor":"#dc2626"},
    {"id":"piece_70","code":"1D","isTarget":false,"d":"M 275 117 L 287.5 117 L 287.5 143 L 275 143 L 275 156 L 300 156 L 300 182 L 287.5 182 L 287.5 169 L 262.5 169 L 262.5 156 L 250 156 L 250 130 L 275 130 Z","labelPos":[268.8,136.5],"fontSize":8},
    {"id":"piece_71","code":"10B","isTarget":true,"d":"M 462.5 143 L 475 143 L 475 156 L 450 156 L 450 143 L 425 143 L 425 117 L 450 117 L 450 130 L 462.5 130 Z","labelPos":[443.8,136.5],"fontSize":7.5,"targetColor":"#eab308"},
    {"id":"piece_72","code":"2A","isTarget":false,"d":"M 612.5 117 L 637.5 117 L 637.5 156 L 650 156 L 650 169 L 662.5 169 L 662.5 182 L 612.5 182 Z","labelPos":[631.3,169],"fontSize":8.5},
    {"id":"piece_73","code":"1D","isTarget":false,"d":"M 87.5 156 L 125 156 L 125 143 L 150 143 L 150 130 L 175 130 L 175 169 L 87.5 169 Z","labelPos":[150,156],"fontSize":8.5},
    {"id":"piece_74","code":"1A","isTarget":false,"d":"M 312.5 130 L 337.5 130 L 337.5 143 L 362.5 143 L 362.5 156 L 387.5 156 L 387.5 169 L 362.5 169 L 362.5 182 L 337.5 182 L 337.5 169 L 300 169 L 300 156 L 325 156 L 325 143 L 312.5 143 Z","labelPos":[343.8,156],"fontSize":8.5},
    {"id":"piece_75","code":"10B","isTarget":true,"d":"M 412.5 130 L 412.5 143 L 387.5 143 L 387.5 156 L 362.5 156 L 362.5 143 L 375 143 L 375 130 Z","labelPos":[393.8,136.5],"fontSize":7.5,"targetColor":"#eab308"},
    {"id":"piece_76","code":"10C","isTarget":false,"d":"M 412.5 130 L 425 130 L 425 143 L 450 143 L 450 156 L 475 156 L 475 169 L 387.5 169 L 387.5 143 L 412.5 143 Z","labelPos":[425,156],"fontSize":8},
    {"id":"piece_77","code":"10D","isTarget":false,"d":"M 462.5 130 L 525 130 L 525 169 L 500 169 L 500 156 L 475 156 L 475 143 L 462.5 143 Z","labelPos":[500,143],"fontSize":8},
    {"id":"piece_78","code":"2B","isTarget":false,"d":"M 525 156 L 550 156 L 550 130 L 587.5 130 L 587.5 156 L 612.5 156 L 612.5 169 L 575 169 L 575 182 L 537.5 182 L 537.5 169 L 525 169 Z","labelPos":[568.8,156],"fontSize":8.5},
    {"id":"piece_79","code":"2C","isTarget":true,"d":"M 550 130 L 550 156 L 525 156 L 525 130 Z","labelPos":[537.5,143],"fontSize":8,"targetColor":"#dc2626"},
    {"id":"piece_80","code":"2C","isTarget":true,"d":"M 687.5 130 L 725 130 L 725 156 L 700 156 L 700 143 L 687.5 143 Z","labelPos":[706.3,136.5],"fontSize":8,"targetColor":"#dc2626"},
    {"id":"piece_81","code":"2A","isTarget":false,"d":"M 725 130 L 737.5 130 L 737.5 143 L 787.5 143 L 787.5 156 L 800 156 L 800 182 L 762.5 182 L 762.5 169 L 750 169 L 750 156 L 725 156 Z","labelPos":[768.8,156],"fontSize":8.5},
    {"id":"piece_82","code":"1C","isTarget":false,"d":"M 0 143 L 12.5 143 L 12.5 156 L 87.5 156 L 87.5 169 L 50 169 L 50 182 L 0 182 Z","labelPos":[25,169],"fontSize":8.5},
    {"id":"piece_83","code":"10A","isTarget":false,"d":"M 450 169 L 475 169 L 475 156 L 500 156 L 500 169 L 537.5 169 L 537.5 182 L 450 182 Z","labelPos":[493.8,175.5],"fontSize":7.5},
    {"id":"piece_84","code":"2D","isTarget":false,"d":"M 662.5 169 L 737.5 169 L 737.5 156 L 750 156 L 750 182 L 687.5 182 L 687.5 195 L 662.5 195 Z","labelPos":[706.3,175.5],"fontSize":8},
    {"id":"piece_85","code":"1A","isTarget":false,"d":"M 50 169 L 137.5 169 L 137.5 182 L 125 182 L 125 195 L 112.5 195 L 112.5 182 L 50 182 Z","labelPos":[93.8,175.5],"fontSize":8},
    {"id":"piece_86","code":"1D","isTarget":false,"d":"M 125 182 L 137.5 182 L 137.5 169 L 237.5 169 L 237.5 182 L 200 182 L 200 195 L 175 195 L 175 182 L 162.5 182 L 162.5 195 L 125 195 Z","labelPos":[175,175.5],"fontSize":8},
    {"id":"piece_87","code":"1A","isTarget":false,"d":"M 200 182 L 237.5 182 L 237.5 169 L 287.5 169 L 287.5 195 L 200 195 Z","labelPos":[262.5,182],"fontSize":8.5},
    {"id":"piece_88","code":"3C","isTarget":false,"d":"M 287.5 182 L 300 182 L 300 169 L 337.5 169 L 337.5 182 L 375 182 L 375 208 L 337.5 208 L 337.5 195 L 287.5 195 Z","labelPos":[318.8,182],"fontSize":8.5},
    {"id":"piece_89","code":"10D","isTarget":false,"d":"M 362.5 169 L 450 169 L 450 195 L 425 195 L 425 182 L 362.5 182 Z","labelPos":[412.5,175.5],"fontSize":7.5},
    {"id":"piece_90","code":"2A","isTarget":false,"d":"M 575 169 L 612.5 169 L 612.5 182 L 662.5 182 L 662.5 195 L 637.5 195 L 637.5 208 L 600 208 L 600 195 L 575 195 Z","labelPos":[618.8,195],"fontSize":8.5},
    {"id":"piece_91","code":"4B","isTarget":false,"d":"M 750 169 L 762.5 169 L 762.5 182 L 800 182 L 800 208 L 787.5 208 L 787.5 221 L 775 221 L 775 208 L 750 208 L 750 195 L 725 195 L 725 182 L 750 182 Z","labelPos":[775,195],"fontSize":8.5},
    {"id":"piece_92","code":"3D","isTarget":false,"d":"M 0 182 L 87.5 182 L 87.5 208 L 0 208 Z","labelPos":[43.8,195],"fontSize":8.5},
    {"id":"piece_93","code":"1C","isTarget":false,"d":"M 87.5 182 L 112.5 182 L 112.5 195 L 162.5 195 L 162.5 182 L 175 182 L 175 208 L 87.5 208 Z","labelPos":[131.3,201.5],"fontSize":8},
    {"id":"piece_94","code":"3B","isTarget":false,"d":"M 312.5 195 L 337.5 195 L 337.5 208 L 375 208 L 375 182 L 400 182 L 400 221 L 325 221 L 325 208 L 312.5 208 Z","labelPos":[362.5,214.5],"fontSize":8},
    {"id":"piece_95","code":"10C","isTarget":false,"d":"M 400 182 L 425 182 L 425 195 L 450 195 L 450 182 L 487.5 182 L 487.5 208 L 475 208 L 475 221 L 450 221 L 450 208 L 412.5 208 L 412.5 195 L 400 195 Z","labelPos":[468.8,195],"fontSize":8},
    {"id":"piece_96","code":"2D","isTarget":false,"d":"M 500 195 L 500 208 L 487.5 208 L 487.5 182 L 575 182 L 575 234 L 525 234 L 525 221 L 562.5 221 L 562.5 195 Z","labelPos":[537.5,188.5],"fontSize":8},
    {"id":"piece_97","code":"4D","isTarget":false,"d":"M 637.5 195 L 687.5 195 L 687.5 182 L 725 182 L 725 208 L 700 208 L 700 221 L 662.5 221 L 662.5 208 L 637.5 208 Z","labelPos":[681.3,208],"fontSize":8.5},
    {"id":"piece_98","code":"3D","isTarget":false,"d":"M 262.5 208 L 262.5 221 L 250 221 L 250 234 L 212.5 234 L 212.5 221 L 175 221 L 175 195 L 225 195 L 225 208 Z","labelPos":[200,208],"fontSize":8.5},
    {"id":"piece_99","code":"3C","isTarget":false,"d":"M 300 221 L 312.5 221 L 312.5 234 L 287.5 234 L 287.5 221 L 275 221 L 275 208 L 225 208 L 225 195 L 287.5 195 L 287.5 208 L 300 208 Z","labelPos":[262.5,201.5],"fontSize":8},
    {"id":"piece_100","code":"3A","isTarget":true,"d":"M 287.5 195 L 312.5 195 L 312.5 208 L 325 208 L 325 221 L 337.5 221 L 337.5 234 L 312.5 234 L 312.5 221 L 300 221 L 300 208 L 287.5 208 Z","labelPos":[312.5,214.5],"fontSize":8,"targetColor":"#f59e0b"},
    {"id":"piece_101","code":"3D","isTarget":false,"d":"M 337.5 221 L 400 221 L 400 195 L 412.5 195 L 412.5 208 L 425 208 L 425 247 L 400 247 L 400 234 L 337.5 234 Z","labelPos":[393.8,227.5],"fontSize":8},
    {"id":"piece_102","code":"8B","isTarget":false,"d":"M 475 208 L 500 208 L 500 195 L 562.5 195 L 562.5 221 L 475 221 Z","labelPos":[525,208],"fontSize":8.5},
    {"id":"piece_103","code":"4B","isTarget":false,"d":"M 575 195 L 600 195 L 600 208 L 662.5 208 L 662.5 221 L 625 221 L 625 234 L 575 234 Z","labelPos":[600,221],"fontSize":8.5},
    {"id":"piece_104","code":"4A","isTarget":false,"d":"M 725 195 L 750 195 L 750 208 L 775 208 L 775 221 L 787.5 221 L 787.5 208 L 800 208 L 800 234 L 787.5 234 L 787.5 247 L 775 247 L 775 234 L 750 234 L 750 221 L 737.5 221 L 737.5 208 L 725 208 Z","labelPos":[775,227.5],"fontSize":8},
    {"id":"piece_105","code":"3C","isTarget":false,"d":"M 0 208 L 87.5 208 L 87.5 234 L 0 234 Z","labelPos":[43.8,221],"fontSize":8.5},
    {"id":"piece_106","code":"3B","isTarget":false,"d":"M 87.5 208 L 175 208 L 175 221 L 162.5 221 L 162.5 234 L 150 234 L 150 221 L 87.5 221 Z","labelPos":[131.3,214.5],"fontSize":8},
    {"id":"piece_107","code":"3A","isTarget":true,"d":"M 262.5 208 L 275 208 L 275 221 L 287.5 221 L 287.5 234 L 300 234 L 300 247 L 275 247 L 275 234 L 262.5 234 Z","labelPos":[275,227.5],"fontSize":8,"targetColor":"#f59e0b"},
    {"id":"piece_108","code":"7A","isTarget":false,"d":"M 425 208 L 450 208 L 450 221 L 512.5 221 L 512.5 234 L 475 234 L 475 247 L 425 247 Z","labelPos":[450,234],"fontSize":8.5},
    {"id":"piece_109","code":"4A","isTarget":false,"d":"M 725 208 L 725 221 L 712.5 221 L 712.5 234 L 700 234 L 700 247 L 637.5 247 L 637.5 221 L 700 221 L 700 208 Z","labelPos":[675,234],"fontSize":8.5},
    {"id":"piece_110","code":"4C","isTarget":true,"d":"M 725 208 L 737.5 208 L 737.5 221 L 750 221 L 750 234 L 762.5 234 L 762.5 247 L 737.5 247 L 737.5 234 L 725 234 Z","labelPos":[737.5,227.5],"fontSize":8,"targetColor":"#f59e0b"},
    {"id":"piece_111","code":"3D","isTarget":false,"d":"M 87.5 221 L 150 221 L 150 234 L 175 234 L 175 247 L 150 247 L 150 260 L 125 260 L 125 247 L 87.5 247 Z","labelPos":[125,234],"fontSize":8.5},
    {"id":"piece_112","code":"3C","isTarget":false,"d":"M 162.5 221 L 212.5 221 L 212.5 234 L 225 234 L 225 260 L 187.5 260 L 187.5 247 L 175 247 L 175 234 L 162.5 234 Z","labelPos":[193.8,234],"fontSize":8.5},
    {"id":"piece_113","code":"3A","isTarget":true,"d":"M 250 221 L 262.5 221 L 262.5 247 L 237.5 247 L 237.5 234 L 250 234 Z","labelPos":[250,240.5],"fontSize":8,"targetColor":"#f59e0b"},
    {"id":"piece_114","code":"8C","isTarget":false,"d":"M 512.5 221 L 525 221 L 525 234 L 575 234 L 575 247 L 487.5 247 L 487.5 234 L 512.5 234 Z","labelPos":[531.3,240.5],"fontSize":8},
    {"id":"piece_115","code":"4D","isTarget":false,"d":"M 625 221 L 637.5 221 L 637.5 247 L 612.5 247 L 612.5 260 L 575 260 L 575 234 L 625 234 Z","labelPos":[593.8,247],"fontSize":8.5},
    {"id":"piece_116","code":"4C","isTarget":true,"d":"M 712.5 221 L 725 221 L 725 247 L 700 247 L 700 234 L 712.5 234 Z","labelPos":[712.5,240.5],"fontSize":8,"targetColor":"#f59e0b"},
    {"id":"piece_117","code":"3B","isTarget":false,"d":"M 0 234 L 87.5 234 L 87.5 247 L 0 247 Z","labelPos":[43.8,240.5],"fontSize":8},
    {"id":"piece_118","code":"3B","isTarget":false,"d":"M 262.5 234 L 275 234 L 275 247 L 300 247 L 300 234 L 312.5 234 L 312.5 273 L 287.5 273 L 287.5 260 L 250 260 L 250 273 L 225 273 L 225 234 L 237.5 234 L 237.5 247 L 262.5 247 Z","labelPos":[268.8,253.5],"fontSize":8},
    {"id":"piece_119","code":"3C","isTarget":false,"d":"M 312.5 234 L 400 234 L 400 247 L 312.5 247 Z","labelPos":[356.3,240.5],"fontSize":8},
    {"id":"piece_120","code":"7B","isTarget":false,"d":"M 400 247 L 475 247 L 475 234 L 487.5 234 L 487.5 260 L 462.5 260 L 462.5 273 L 412.5 273 L 412.5 260 L 400 260 Z","labelPos":[437.5,260],"fontSize":8.5},
    {"id":"piece_121","code":"4D","isTarget":false,"d":"M 725 234 L 737.5 234 L 737.5 247 L 762.5 247 L 762.5 260 L 675 260 L 675 247 L 725 247 Z","labelPos":[718.8,253.5],"fontSize":8},
    {"id":"piece_122","code":"4B","isTarget":false,"d":"M 762.5 234 L 775 234 L 775 247 L 787.5 247 L 787.5 234 L 800 234 L 800 286 L 787.5 286 L 787.5 299 L 775 299 L 775 273 L 762.5 273 Z","labelPos":[781.3,260],"fontSize":8.5},
    {"id":"piece_123","code":"3D","isTarget":false,"d":"M 0 247 L 87.5 247 L 87.5 260 L 25 260 L 25 273 L 0 273 Z","labelPos":[37.5,253.5],"fontSize":8},
    {"id":"piece_124","code":"3B","isTarget":false,"d":"M 87.5 247 L 125 247 L 125 299 L 112.5 299 L 112.5 286 L 100 286 L 100 260 L 87.5 260 Z","labelPos":[106.3,253.5],"fontSize":8},
    {"id":"piece_125","code":"3B","isTarget":false,"d":"M 187.5 247 L 187.5 260 L 175 260 L 175 299 L 150 299 L 150 247 Z","labelPos":[168.8,253.5],"fontSize":8},
    {"id":"piece_126","code":"3D","isTarget":false,"d":"M 312.5 247 L 400 247 L 400 260 L 387.5 260 L 387.5 286 L 362.5 286 L 362.5 260 L 312.5 260 Z","labelPos":[362.5,253.5],"fontSize":8},
    {"id":"piece_127","code":"8D","isTarget":false,"d":"M 487.5 247 L 575 247 L 575 273 L 562.5 273 L 562.5 260 L 550 260 L 550 273 L 537.5 273 L 537.5 260 L 512.5 260 L 512.5 273 L 487.5 273 Z","labelPos":[531.3,253.5],"fontSize":8},
    {"id":"piece_128","code":"4B","isTarget":false,"d":"M 700 260 L 700 273 L 650 273 L 650 260 L 612.5 260 L 612.5 247 L 675 247 L 675 260 Z","labelPos":[650,253.5],"fontSize":8},
    {"id":"piece_129","code":"3A","isTarget":true,"d":"M 25 260 L 100 260 L 100 286 L 75 286 L 75 299 L 50 299 L 50 286 L 25 286 Z","labelPos":[62.5,273],"fontSize":8.5,"targetColor":"#f59e0b"},
    {"id":"piece_130","code":"3A","isTarget":true,"d":"M 125 260 L 150 260 L 150 299 L 175 299 L 175 312 L 125 312 Z","labelPos":[150,305.5],"fontSize":8,"targetColor":"#f59e0b"},
    {"id":"piece_131","code":"3A","isTarget":true,"d":"M 175 260 L 200 260 L 200 299 L 187.5 299 L 187.5 312 L 175 312 Z","labelPos":[187.5,286],"fontSize":8,"targetColor":"#f59e0b"},
    {"id":"piece_132","code":"3D","isTarget":false,"d":"M 225 273 L 237.5 273 L 237.5 286 L 225 286 L 225 351 L 200 351 L 200 260 L 225 260 Z","labelPos":[218.8,279.5],"fontSize":8},
    {"id":"piece_133","code":"3A","isTarget":true,"d":"M 250 260 L 287.5 260 L 287.5 273 L 300 273 L 300 299 L 287.5 299 L 287.5 286 L 275 286 L 275 273 L 262.5 273 L 262.5 286 L 237.5 286 L 237.5 273 L 250 273 Z","labelPos":[268.8,266.5],"fontSize":8,"targetColor":"#f59e0b"},
    {"id":"piece_134","code":"3C","isTarget":false,"d":"M 300 273 L 312.5 273 L 312.5 260 L 337.5 260 L 337.5 286 L 350 286 L 350 299 L 362.5 299 L 362.5 312 L 325 312 L 325 299 L 312.5 299 L 312.5 286 L 300 286 Z","labelPos":[331.3,292.5],"fontSize":8},
    {"id":"piece_135","code":"3A","isTarget":true,"d":"M 337.5 260 L 362.5 260 L 362.5 286 L 387.5 286 L 387.5 260 L 412.5 260 L 412.5 286 L 400 286 L 400 299 L 350 299 L 350 286 L 337.5 286 Z","labelPos":[375,292.5],"fontSize":8,"targetColor":"#f59e0b"},
    {"id":"piece_136","code":"7C","isTarget":true,"d":"M 462.5 260 L 487.5 260 L 487.5 273 L 500 273 L 500 299 L 450 299 L 450 273 L 462.5 273 Z","labelPos":[475,286],"fontSize":8.5,"targetColor":"#ec4899"},
    {"id":"piece_137","code":"8A","isTarget":true,"d":"M 500 273 L 512.5 273 L 512.5 260 L 537.5 260 L 537.5 273 L 550 273 L 550 299 L 537.5 299 L 537.5 286 L 500 286 Z","labelPos":[525,279.5],"fontSize":8,"targetColor":"#ec4899"},
    {"id":"piece_138","code":"4A","isTarget":false,"d":"M 550 260 L 562.5 260 L 562.5 273 L 575 273 L 575 260 L 600 260 L 600 273 L 587.5 273 L 587.5 325 L 562.5 325 L 562.5 312 L 550 312 Z","labelPos":[568.8,292.5],"fontSize":8.5},
    {"id":"piece_139","code":"4C","isTarget":true,"d":"M 650 273 L 662.5 273 L 662.5 286 L 637.5 286 L 637.5 273 L 612.5 273 L 612.5 286 L 600 286 L 600 260 L 650 260 Z","labelPos":[625,266.5],"fontSize":8,"targetColor":"#f59e0b"},
    {"id":"piece_140","code":"4C","isTarget":true,"d":"M 700 260 L 762.5 260 L 762.5 273 L 775 273 L 775 286 L 750 286 L 750 273 L 712.5 273 L 712.5 286 L 700 286 L 700 299 L 687.5 299 L 687.5 273 L 700 273 Z","labelPos":[725,266.5],"fontSize":8,"targetColor":"#f59e0b"},
    {"id":"piece_141","code":"3C","isTarget":false,"d":"M 0 273 L 25 273 L 25 286 L 50 286 L 50 325 L 0 325 Z","labelPos":[25,299],"fontSize":8.5},
    {"id":"piece_142","code":"3C","isTarget":false,"d":"M 262.5 273 L 275 273 L 275 286 L 287.5 286 L 287.5 312 L 250 312 L 250 286 L 262.5 286 Z","labelPos":[268.8,299],"fontSize":8.5},
    {"id":"piece_143","code":"3D","isTarget":false,"d":"M 412.5 273 L 450 273 L 450 312 L 387.5 312 L 387.5 299 L 400 299 L 400 286 L 412.5 286 Z","labelPos":[425,299],"fontSize":8.5},
    {"id":"piece_144","code":"4C","isTarget":true,"d":"M 587.5 273 L 600 273 L 600 286 L 612.5 286 L 612.5 338 L 587.5 338 Z","labelPos":[600,305.5],"fontSize":8,"targetColor":"#f59e0b"},
    {"id":"piece_145","code":"4B","isTarget":false,"d":"M 637.5 273 L 637.5 286 L 625 286 L 625 299 L 687.5 299 L 687.5 312 L 650 312 L 650 325 L 637.5 325 L 637.5 338 L 612.5 338 L 612.5 273 Z","labelPos":[631.3,312],"fontSize":8.5},
    {"id":"piece_146","code":"4A","isTarget":false,"d":"M 662.5 273 L 687.5 273 L 687.5 299 L 625 299 L 625 286 L 662.5 286 Z","labelPos":[662.5,292.5],"fontSize":8},
    {"id":"piece_147","code":"4A","isTarget":false,"d":"M 712.5 273 L 750 273 L 750 338 L 712.5 338 Z","labelPos":[731.3,305.5],"fontSize":8.5},
    {"id":"piece_148","code":"3C","isTarget":false,"d":"M 112.5 286 L 112.5 299 L 125 299 L 125 338 L 112.5 338 L 112.5 325 L 75 325 L 75 286 Z","labelPos":[100,312],"fontSize":8.5},
    {"id":"piece_149","code":"3A","isTarget":true,"d":"M 250 286 L 250 312 L 237.5 312 L 237.5 338 L 225 338 L 225 286 Z","labelPos":[237.5,299],"fontSize":8,"targetColor":"#f59e0b"},
    {"id":"piece_150","code":"3A","isTarget":true,"d":"M 300 286 L 312.5 286 L 312.5 312 L 300 312 L 300 325 L 287.5 325 L 287.5 299 L 300 299 Z","labelPos":[300,305.5],"fontSize":8,"targetColor":"#f59e0b"},
    {"id":"piece_151","code":"8A","isTarget":true,"d":"M 512.5 299 L 512.5 312 L 500 312 L 500 286 L 537.5 286 L 537.5 299 Z","labelPos":[518.8,292.5],"fontSize":8,"targetColor":"#ec4899"},
    {"id":"piece_152","code":"4C","isTarget":true,"d":"M 700 286 L 712.5 286 L 712.5 312 L 700 312 L 700 325 L 687.5 325 L 687.5 299 L 700 299 Z","labelPos":[700,305.5],"fontSize":8,"targetColor":"#f59e0b"},
    {"id":"piece_153","code":"4C","isTarget":true,"d":"M 762.5 338 L 762.5 351 L 750 351 L 750 286 L 775 286 L 775 338 Z","labelPos":[762.5,318.5],"fontSize":8,"targetColor":"#f59e0b"},
    {"id":"piece_154","code":"4A","isTarget":false,"d":"M 787.5 286 L 800 286 L 800 338 L 787.5 338 L 787.5 351 L 775 351 L 775 299 L 787.5 299 Z","labelPos":[787.5,318.5],"fontSize":8},
    {"id":"piece_155","code":"3A","isTarget":true,"d":"M 50 299 L 75 299 L 75 351 L 50 351 Z","labelPos":[62.5,325],"fontSize":8,"targetColor":"#f59e0b"},
    {"id":"piece_156","code":"3A","isTarget":true,"d":"M 187.5 299 L 200 299 L 200 351 L 175 351 L 175 312 L 187.5 312 Z","labelPos":[187.5,325],"fontSize":8,"targetColor":"#f59e0b"},
    {"id":"piece_157","code":"3D","isTarget":false,"d":"M 312.5 299 L 325 299 L 325 312 L 362.5 312 L 362.5 364 L 350 364 L 350 351 L 312.5 351 Z","labelPos":[337.5,331.5],"fontSize":8.5},
    {"id":"piece_158","code":"3A","isTarget":true,"d":"M 362.5 299 L 387.5 299 L 387.5 351 L 362.5 351 Z","labelPos":[375,325],"fontSize":8,"targetColor":"#f59e0b"},
    {"id":"piece_159","code":"7C","isTarget":true,"d":"M 500 351 L 487.5 351 L 487.5 338 L 475 338 L 475 325 L 462.5 325 L 462.5 312 L 450 312 L 450 299 L 500 299 Z","labelPos":[481.3,312],"fontSize":8.5,"targetColor":"#ec4899"},
    {"id":"piece_160","code":"8A","isTarget":true,"d":"M 512.5 338 L 512.5 351 L 500 351 L 500 312 L 512.5 312 L 512.5 299 L 550 299 L 550 312 L 537.5 312 L 537.5 325 L 525 325 L 525 338 Z","labelPos":[518.8,318.5],"fontSize":8,"targetColor":"#ec4899"},
    {"id":"piece_161","code":"3A","isTarget":true,"d":"M 125 312 L 150 312 L 150 351 L 125 351 Z","labelPos":[137.5,331.5],"fontSize":8,"targetColor":"#f59e0b"},
    {"id":"piece_162","code":"3B","isTarget":false,"d":"M 150 351 L 150 312 L 175 312 L 175 351 Z","labelPos":[162.5,331.5],"fontSize":8},
    {"id":"piece_163","code":"3A","isTarget":true,"d":"M 287.5 312 L 287.5 325 L 250 325 L 250 351 L 225 351 L 225 338 L 237.5 338 L 237.5 312 Z","labelPos":[262.5,318.5],"fontSize":8,"targetColor":"#f59e0b"},
    {"id":"piece_164","code":"3A","isTarget":true,"d":"M 300 312 L 312.5 312 L 312.5 351 L 287.5 351 L 287.5 325 L 300 325 Z","labelPos":[300,338],"fontSize":8,"targetColor":"#f59e0b"},
    {"id":"piece_165","code":"7A","isTarget":false,"d":"M 387.5 312 L 462.5 312 L 462.5 325 L 475 325 L 475 338 L 437.5 338 L 437.5 325 L 387.5 325 Z","labelPos":[437.5,318.5],"fontSize":8},
    {"id":"piece_166","code":"4B","isTarget":false,"d":"M 562.5 312 L 562.5 325 L 587.5 325 L 587.5 338 L 600 338 L 600 351 L 587.5 351 L 587.5 364 L 537.5 364 L 537.5 312 Z","labelPos":[562.5,338],"fontSize":8.5},
    {"id":"piece_167","code":"4D","isTarget":false,"d":"M 650 312 L 687.5 312 L 687.5 338 L 700 338 L 700 364 L 650 364 L 650 338 L 662.5 338 L 662.5 325 L 650 325 Z","labelPos":[675,351],"fontSize":8.5},
    {"id":"piece_168","code":"4C","isTarget":true,"d":"M 700 312 L 712.5 312 L 712.5 338 L 750 338 L 750 351 L 700 351 L 700 338 L 687.5 338 L 687.5 325 L 700 325 Z","labelPos":[725,344.5],"fontSize":8,"targetColor":"#f59e0b"},
    {"id":"piece_169","code":"3D","isTarget":false,"d":"M 0 325 L 50 325 L 50 351 L 75 351 L 75 364 L 0 364 Z","labelPos":[25,344.5],"fontSize":8.5},
    {"id":"piece_170","code":"3B","isTarget":false,"d":"M 112.5 325 L 112.5 338 L 125 338 L 125 351 L 150 351 L 150 364 L 100 364 L 100 351 L 75 351 L 75 325 Z","labelPos":[93.8,338],"fontSize":8.5},
    {"id":"piece_171","code":"3B","isTarget":false,"d":"M 225 351 L 250 351 L 250 325 L 287.5 325 L 287.5 351 L 312.5 351 L 312.5 364 L 225 364 Z","labelPos":[268.8,351],"fontSize":8.5},
    {"id":"piece_172","code":"6B","isTarget":false,"d":"M 387.5 351 L 387.5 325 L 437.5 325 L 437.5 338 L 475 338 L 475 351 Z","labelPos":[412.5,338],"fontSize":8.5},
    {"id":"piece_173","code":"8D","isTarget":false,"d":"M 450 351 L 475 351 L 475 338 L 487.5 338 L 487.5 351 L 512.5 351 L 512.5 338 L 525 338 L 525 325 L 537.5 325 L 537.5 390 L 525 390 L 525 364 L 450 364 Z","labelPos":[506.3,357.5],"fontSize":8},
    {"id":"piece_174","code":"4C","isTarget":true,"d":"M 600 338 L 637.5 338 L 637.5 325 L 662.5 325 L 662.5 338 L 650 338 L 650 351 L 600 351 Z","labelPos":[625,344.5],"fontSize":8,"targetColor":"#f59e0b"},
    {"id":"piece_175","code":"4B","isTarget":false,"d":"M 762.5 338 L 775 338 L 775 351 L 787.5 351 L 787.5 377 L 725 377 L 725 364 L 700 364 L 700 351 L 762.5 351 Z","labelPos":[750,364],"fontSize":8.5},
    {"id":"piece_176","code":"9D","isTarget":false,"d":"M 787.5 338 L 800 338 L 800 403 L 750 403 L 750 377 L 787.5 377 Z","labelPos":[775,390],"fontSize":8.5},
    {"id":"piece_177","code":"9B","isTarget":false,"d":"M 0 364 L 75 364 L 75 351 L 87.5 351 L 87.5 390 L 75 390 L 75 377 L 50 377 L 50 390 L 0 390 Z","labelPos":[25,377],"fontSize":8.5},
    {"id":"piece_178","code":"3C","isTarget":false,"d":"M 87.5 351 L 100 351 L 100 364 L 150 364 L 150 351 L 200 351 L 200 377 L 125 377 L 125 390 L 100 390 L 100 377 L 87.5 377 Z","labelPos":[175,364],"fontSize":8.5},
    {"id":"piece_179","code":"5D","isTarget":false,"d":"M 262.5 390 L 262.5 403 L 250 403 L 250 390 L 225 390 L 225 377 L 200 377 L 200 351 L 225 351 L 225 364 L 287.5 364 L 287.5 377 L 275 377 L 275 390 Z","labelPos":[250,377],"fontSize":8.5},
    {"id":"piece_180","code":"5A","isTarget":false,"d":"M 287.5 364 L 312.5 364 L 312.5 351 L 350 351 L 350 364 L 400 364 L 400 377 L 287.5 377 Z","labelPos":[331.3,364],"fontSize":8.5},
    {"id":"piece_181","code":"6D","isTarget":false,"d":"M 362.5 351 L 450 351 L 450 364 L 437.5 364 L 437.5 377 L 400 377 L 400 364 L 362.5 364 Z","labelPos":[418.8,364],"fontSize":8.5},
    {"id":"piece_182","code":"6D","isTarget":false,"d":"M 537.5 364 L 587.5 364 L 587.5 351 L 625 351 L 625 377 L 575 377 L 575 390 L 562.5 390 L 562.5 403 L 550 403 L 550 390 L 537.5 390 Z","labelPos":[556.3,377],"fontSize":8.5},
    {"id":"piece_183","code":"4A","isTarget":false,"d":"M 625 351 L 650 351 L 650 364 L 712.5 364 L 712.5 377 L 675 377 L 675 390 L 625 390 Z","labelPos":[650,377],"fontSize":8.5},
    {"id":"piece_184","code":"7B","isTarget":false,"d":"M 437.5 364 L 525 364 L 525 377 L 437.5 377 Z","labelPos":[481.3,370.5],"fontSize":8},
    {"id":"piece_185","code":"9D","isTarget":false,"d":"M 625 390 L 675 390 L 675 377 L 712.5 377 L 712.5 364 L 725 364 L 725 390 L 712.5 390 L 712.5 403 L 625 403 Z","labelPos":[693.8,390],"fontSize":8.5},
    {"id":"piece_186","code":"9A","isTarget":true,"d":"M 112.5 403 L 112.5 416 L 62.5 416 L 62.5 403 L 50 403 L 50 377 L 75 377 L 75 390 L 87.5 390 L 87.5 403 Z","labelPos":[68.8,396.5],"fontSize":8,"targetColor":"#10b981"},
    {"id":"piece_187","code":"9D","isTarget":false,"d":"M 87.5 377 L 100 377 L 100 390 L 125 390 L 125 377 L 162.5 377 L 162.5 390 L 150 390 L 150 403 L 87.5 403 Z","labelPos":[125,396.5],"fontSize":8},
    {"id":"piece_188","code":"5B","isTarget":true,"d":"M 150 390 L 162.5 390 L 162.5 377 L 225 377 L 225 390 L 237.5 390 L 237.5 403 L 212.5 403 L 212.5 390 L 175 390 L 175 403 L 150 403 Z","labelPos":[193.8,383.5],"fontSize":8,"targetColor":"#2563eb"},
    {"id":"piece_189","code":"5B","isTarget":true,"d":"M 275 377 L 337.5 377 L 337.5 390 L 350 390 L 350 403 L 325 403 L 325 390 L 287.5 390 L 287.5 403 L 275 403 Z","labelPos":[312.5,383.5],"fontSize":8,"targetColor":"#2563eb"},
    {"id":"piece_190","code":"5C","isTarget":false,"d":"M 337.5 377 L 425 377 L 425 390 L 400 390 L 400 403 L 375 403 L 375 416 L 350 416 L 350 390 L 337.5 390 Z","labelPos":[375,390],"fontSize":8.5},
    {"id":"piece_191","code":"6C","isTarget":true,"d":"M 425 377 L 450 377 L 450 403 L 437.5 403 L 437.5 429 L 425 429 L 425 442 L 412.5 442 L 412.5 403 L 425 403 Z","labelPos":[425,416],"fontSize":8,"targetColor":"#2563eb"},
    {"id":"piece_192","code":"6A","isTarget":false,"d":"M 500 377 L 500 390 L 487.5 390 L 487.5 403 L 475 403 L 475 416 L 500 416 L 500 429 L 437.5 429 L 437.5 403 L 450 403 L 450 377 Z","labelPos":[468.8,390],"fontSize":8.5},
    {"id":"piece_193","code":"6C","isTarget":true,"d":"M 487.5 390 L 500 390 L 500 377 L 525 377 L 525 403 L 487.5 403 Z","labelPos":[506.3,396.5],"fontSize":8,"targetColor":"#2563eb"},
    {"id":"piece_194","code":"6A","isTarget":false,"d":"M 600 377 L 600 390 L 587.5 390 L 587.5 403 L 575 403 L 575 429 L 562.5 429 L 562.5 416 L 525 416 L 525 390 L 550 390 L 550 403 L 562.5 403 L 562.5 390 L 575 390 L 575 377 Z","labelPos":[550,409.5],"fontSize":8},
    {"id":"piece_195","code":"6C","isTarget":true,"d":"M 575 403 L 587.5 403 L 587.5 390 L 600 390 L 600 377 L 625 377 L 625 429 L 600 429 L 600 416 L 575 416 Z","labelPos":[606.3,403],"fontSize":8.5,"targetColor":"#2563eb"},
    {"id":"piece_196","code":"9A","isTarget":true,"d":"M 712.5 390 L 725 390 L 725 377 L 750 377 L 750 403 L 712.5 403 Z","labelPos":[731.3,396.5],"fontSize":8,"targetColor":"#10b981"},
    {"id":"piece_197","code":"9D","isTarget":false,"d":"M 50 403 L 62.5 403 L 62.5 416 L 50 416 L 50 429 L 0 429 L 0 390 L 50 390 Z","labelPos":[25,409.5],"fontSize":8.5},
    {"id":"piece_198","code":"5A","isTarget":false,"d":"M 200 416 L 200 429 L 187.5 429 L 187.5 416 L 175 416 L 175 390 L 212.5 390 L 212.5 416 Z","labelPos":[193.8,403],"fontSize":8.5},
    {"id":"piece_199","code":"5C","isTarget":false,"d":"M 212.5 429 L 225 429 L 225 416 L 237.5 416 L 237.5 390 L 250 390 L 250 403 L 262.5 403 L 262.5 429 L 250 429 L 250 442 L 212.5 442 Z","labelPos":[243.8,422.5],"fontSize":8},
    {"id":"piece_200","code":"5B","isTarget":true,"d":"M 262.5 390 L 275 390 L 275 403 L 287.5 403 L 287.5 455 L 262.5 455 Z","labelPos":[275,422.5],"fontSize":8,"targetColor":"#2563eb"},
    {"id":"piece_201","code":"5A","isTarget":false,"d":"M 287.5 390 L 325 390 L 325 442 L 312.5 442 L 312.5 429 L 300 429 L 300 416 L 287.5 416 Z","labelPos":[306.3,403],"fontSize":8.5},
    {"id":"piece_202","code":"6B","isTarget":false,"d":"M 425 390 L 425 403 L 412.5 403 L 412.5 429 L 387.5 429 L 387.5 416 L 375 416 L 375 403 L 400 403 L 400 390 Z","labelPos":[393.8,409.5],"fontSize":8},
    {"id":"piece_203","code":"5D","isTarget":false,"d":"M 100 416 L 112.5 416 L 112.5 403 L 175 403 L 175 416 L 187.5 416 L 187.5 429 L 100 429 Z","labelPos":[143.8,416],"fontSize":8.5},
    {"id":"piece_204","code":"5B","isTarget":true,"d":"M 237.5 403 L 237.5 416 L 225 416 L 225 429 L 212.5 429 L 212.5 442 L 200 442 L 200 455 L 187.5 455 L 187.5 468 L 162.5 468 L 162.5 455 L 175 455 L 175 442 L 187.5 442 L 187.5 429 L 200 429 L 200 416 L 212.5 416 L 212.5 403 Z","labelPos":[200,435.5],"fontSize":8,"targetColor":"#2563eb"},
    {"id":"piece_205","code":"5B","isTarget":true,"d":"M 350 468 L 337.5 468 L 337.5 455 L 325 455 L 325 403 L 350 403 Z","labelPos":[337.5,435.5],"fontSize":8,"targetColor":"#2563eb"},
    {"id":"piece_206","code":"6C","isTarget":true,"d":"M 475 403 L 525 403 L 525 416 L 475 416 Z","labelPos":[500,409.5],"fontSize":8,"targetColor":"#2563eb"},
    {"id":"piece_207","code":"9C","isTarget":false,"d":"M 687.5 416 L 700 416 L 700 429 L 675 429 L 675 442 L 650 442 L 650 429 L 625 429 L 625 403 L 687.5 403 Z","labelPos":[662.5,416],"fontSize":8.5},
    {"id":"piece_208","code":"9A","isTarget":true,"d":"M 687.5 403 L 737.5 403 L 737.5 416 L 687.5 416 Z","labelPos":[712.5,409.5],"fontSize":8,"targetColor":"#10b981"},
    {"id":"piece_209","code":"9C","isTarget":false,"d":"M 737.5 403 L 800 403 L 800 442 L 762.5 442 L 762.5 429 L 750 429 L 750 416 L 737.5 416 Z","labelPos":[775,416],"fontSize":8.5},
    {"id":"piece_210","code":"9A","isTarget":true,"d":"M 50 416 L 100 416 L 100 429 L 125 429 L 125 442 L 87.5 442 L 87.5 429 L 50 429 Z","labelPos":[75,422.5],"fontSize":8,"targetColor":"#10b981"},
    {"id":"piece_211","code":"5D","isTarget":false,"d":"M 287.5 416 L 300 416 L 300 429 L 312.5 429 L 312.5 442 L 325 442 L 325 468 L 287.5 468 Z","labelPos":[306.3,455],"fontSize":8.5},
    {"id":"piece_212","code":"5A","isTarget":false,"d":"M 362.5 442 L 362.5 455 L 350 455 L 350 416 L 387.5 416 L 387.5 429 L 400 429 L 400 455 L 387.5 455 L 387.5 442 Z","labelPos":[368.8,429],"fontSize":8.5},
    {"id":"piece_213","code":"6C","isTarget":true,"d":"M 512.5 455 L 512.5 468 L 500 468 L 500 416 L 525 416 L 525 455 Z","labelPos":[512.5,442],"fontSize":8,"targetColor":"#2563eb"},
    {"id":"piece_214","code":"6B","isTarget":false,"d":"M 525 416 L 562.5 416 L 562.5 429 L 587.5 429 L 587.5 442 L 525 442 Z","labelPos":[543.8,429],"fontSize":8.5},
    {"id":"piece_215","code":"6D","isTarget":false,"d":"M 575 416 L 600 416 L 600 455 L 525 455 L 525 442 L 587.5 442 L 587.5 429 L 575 429 Z","labelPos":[568.8,448.5],"fontSize":8},
    {"id":"piece_216","code":"9A","isTarget":true,"d":"M 750 416 L 750 429 L 737.5 429 L 737.5 442 L 725 442 L 725 455 L 712.5 455 L 712.5 442 L 675 442 L 675 429 L 700 429 L 700 416 Z","labelPos":[718.8,429],"fontSize":8.5,"targetColor":"#10b981"},
    {"id":"piece_217","code":"9C","isTarget":false,"d":"M 0 429 L 62.5 429 L 62.5 455 L 0 455 Z","labelPos":[31.3,442],"fontSize":8.5},
    {"id":"piece_218","code":"9A","isTarget":true,"d":"M 62.5 429 L 87.5 429 L 87.5 442 L 125 442 L 125 455 L 75 455 L 75 442 L 62.5 442 Z","labelPos":[100,448.5],"fontSize":8,"targetColor":"#10b981"},
    {"id":"piece_219","code":"5C","isTarget":false,"d":"M 187.5 429 L 187.5 442 L 175 442 L 175 455 L 150 455 L 150 481 L 125 481 L 125 429 Z","labelPos":[150,442],"fontSize":8.5},
    {"id":"piece_220","code":"5A","isTarget":false,"d":"M 262.5 468 L 275 468 L 275 481 L 237.5 481 L 237.5 468 L 187.5 468 L 187.5 455 L 200 455 L 200 442 L 250 442 L 250 429 L 262.5 429 Z","labelPos":[237.5,455],"fontSize":8.5},
    {"id":"piece_221","code":"6C","isTarget":true,"d":"M 412.5 442 L 425 442 L 425 455 L 412.5 455 L 412.5 481 L 387.5 481 L 387.5 455 L 400 455 L 400 429 L 412.5 429 Z","labelPos":[400,468],"fontSize":8,"targetColor":"#2563eb"},
    {"id":"piece_222","code":"6B","isTarget":false,"d":"M 425 429 L 500 429 L 500 455 L 425 455 Z","labelPos":[462.5,442],"fontSize":8.5},
    {"id":"piece_223","code":"6C","isTarget":true,"d":"M 600 429 L 625 429 L 625 455 L 600 455 Z","labelPos":[612.5,442],"fontSize":8,"targetColor":"#2563eb"},
    {"id":"piece_224","code":"6D","isTarget":false,"d":"M 625 429 L 650 429 L 650 442 L 675 442 L 675 481 L 650 481 L 650 468 L 625 468 Z","labelPos":[650,455],"fontSize":8.5},
    {"id":"piece_225","code":"9D","isTarget":false,"d":"M 762.5 429 L 762.5 442 L 800 442 L 800 455 L 775 455 L 775 468 L 725 468 L 725 442 L 737.5 442 L 737.5 429 Z","labelPos":[750,455],"fontSize":8.5},
    {"id":"piece_226","code":"9B","isTarget":false,"d":"M 62.5 442 L 75 442 L 75 455 L 87.5 455 L 87.5 468 L 75 468 L 75 481 L 12.5 481 L 12.5 468 L 0 468 L 0 455 L 62.5 455 Z","labelPos":[43.8,468],"fontSize":8.5},
    {"id":"piece_227","code":"9D","isTarget":false,"d":"M 337.5 468 L 350 468 L 350 455 L 362.5 455 L 362.5 442 L 387.5 442 L 387.5 481 L 337.5 481 Z","labelPos":[368.8,468],"fontSize":8.5},
    {"id":"piece_228","code":"9A","isTarget":true,"d":"M 700 494 L 687.5 494 L 687.5 481 L 675 481 L 675 442 L 712.5 442 L 712.5 468 L 700 468 Z","labelPos":[693.8,455],"fontSize":8.5,"targetColor":"#10b981"},
    {"id":"piece_229","code":"9A","isTarget":true,"d":"M 87.5 455 L 125 455 L 125 481 L 162.5 481 L 162.5 494 L 100 494 L 100 468 L 87.5 468 Z","labelPos":[125,487.5],"fontSize":8,"targetColor":"#10b981"},
    {"id":"piece_230","code":"5B","isTarget":true,"d":"M 150 455 L 162.5 455 L 162.5 468 L 237.5 468 L 237.5 481 L 150 481 Z","labelPos":[187.5,474.5],"fontSize":8,"targetColor":"#2563eb"},
    {"id":"piece_231","code":"5B","isTarget":true,"d":"M 262.5 455 L 287.5 455 L 287.5 468 L 325 468 L 325 455 L 337.5 455 L 337.5 481 L 275 481 L 275 468 L 262.5 468 Z","labelPos":[300,474.5],"fontSize":8,"targetColor":"#2563eb"},
    {"id":"piece_232","code":"9C","isTarget":false,"d":"M 500 455 L 500 468 L 475 468 L 475 481 L 412.5 481 L 412.5 455 Z","labelPos":[450,468],"fontSize":8.5},
    {"id":"piece_233","code":"6C","isTarget":true,"d":"M 475 468 L 512.5 468 L 512.5 455 L 525 455 L 525 468 L 550 468 L 550 481 L 475 481 Z","labelPos":[512.5,474.5],"fontSize":8,"targetColor":"#2563eb"},
    {"id":"piece_234","code":"6A","isTarget":false,"d":"M 525 455 L 600 455 L 600 468 L 575 468 L 575 481 L 550 481 L 550 468 L 525 468 Z","labelPos":[562.5,461.5],"fontSize":8},
    {"id":"piece_235","code":"6C","isTarget":true,"d":"M 575 468 L 600 468 L 600 455 L 625 455 L 625 468 L 650 468 L 650 481 L 575 481 Z","labelPos":[612.5,474.5],"fontSize":8,"targetColor":"#2563eb"},
    {"id":"piece_236","code":"9B","isTarget":false,"d":"M 712.5 455 L 725 455 L 725 468 L 787.5 468 L 787.5 494 L 725 494 L 725 481 L 700 481 L 700 468 L 712.5 468 Z","labelPos":[750,481],"fontSize":8.5},
    {"id":"piece_237","code":"9C","isTarget":false,"d":"M 775 455 L 800 455 L 800 520 L 737.5 520 L 737.5 507 L 712.5 507 L 712.5 494 L 787.5 494 L 787.5 468 L 775 468 Z","labelPos":[768.8,507],"fontSize":8.5},
    {"id":"piece_238","code":"9C","isTarget":false,"d":"M 0 468 L 12.5 468 L 12.5 481 L 87.5 481 L 87.5 494 L 62.5 494 L 62.5 507 L 0 507 Z","labelPos":[37.5,494],"fontSize":8.5},
    {"id":"piece_239","code":"9D","isTarget":false,"d":"M 75 468 L 100 468 L 100 494 L 150 494 L 150 507 L 162.5 507 L 162.5 520 L 87.5 520 L 87.5 481 L 75 481 Z","labelPos":[112.5,507],"fontSize":8.5},
    {"id":"piece_240","code":"9A","isTarget":true,"d":"M 150 494 L 212.5 494 L 212.5 481 L 237.5 481 L 237.5 507 L 150 507 Z","labelPos":[200,500.5],"fontSize":8,"targetColor":"#10b981"},
    {"id":"piece_241","code":"9A","isTarget":true,"d":"M 162.5 481 L 212.5 481 L 212.5 494 L 162.5 494 Z","labelPos":[187.5,487.5],"fontSize":8,"targetColor":"#10b981"},
    {"id":"piece_242","code":"9A","isTarget":true,"d":"M 237.5 481 L 325 481 L 325 507 L 312.5 507 L 312.5 494 L 237.5 494 Z","labelPos":[287.5,487.5],"fontSize":8,"targetColor":"#10b981"},
    {"id":"piece_243","code":"9A","isTarget":true,"d":"M 325 481 L 375 481 L 375 494 L 325 494 Z","labelPos":[350,487.5],"fontSize":8,"targetColor":"#10b981"},
    {"id":"piece_244","code":"9A","isTarget":true,"d":"M 325 494 L 375 494 L 375 481 L 412.5 481 L 412.5 507 L 325 507 Z","labelPos":[393.8,494],"fontSize":8.5,"targetColor":"#10b981"},
    {"id":"piece_245","code":"9A","isTarget":true,"d":"M 412.5 481 L 500 481 L 500 494 L 475 494 L 475 507 L 462.5 507 L 462.5 494 L 412.5 494 Z","labelPos":[456.3,487.5],"fontSize":8,"targetColor":"#10b981"},
    {"id":"piece_246","code":"9A","isTarget":true,"d":"M 500 481 L 562.5 481 L 562.5 494 L 500 494 Z","labelPos":[531.3,487.5],"fontSize":8,"targetColor":"#10b981"},
    {"id":"piece_247","code":"9A","isTarget":true,"d":"M 562.5 481 L 637.5 481 L 637.5 494 L 562.5 494 Z","labelPos":[600,487.5],"fontSize":8,"targetColor":"#10b981"},
    {"id":"piece_248","code":"9A","isTarget":true,"d":"M 600 494 L 637.5 494 L 637.5 481 L 687.5 481 L 687.5 494 L 650 494 L 650 507 L 600 507 Z","labelPos":[662.5,487.5],"fontSize":8,"targetColor":"#10b981"},
    {"id":"piece_249","code":"9D","isTarget":false,"d":"M 737.5 507 L 737.5 520 L 687.5 520 L 687.5 494 L 700 494 L 700 481 L 725 481 L 725 494 L 712.5 494 L 712.5 507 Z","labelPos":[712.5,513.5],"fontSize":8},
    {"id":"piece_250","code":"9B","isTarget":false,"d":"M 0 507 L 62.5 507 L 62.5 494 L 87.5 494 L 87.5 520 L 0 520 Z","labelPos":[50,513.5],"fontSize":8},
    {"id":"piece_251","code":"9A","isTarget":true,"d":"M 237.5 494 L 312.5 494 L 312.5 507 L 237.5 507 Z","labelPos":[275,500.5],"fontSize":8,"targetColor":"#10b981"},
    {"id":"piece_252","code":"9A","isTarget":true,"d":"M 412.5 494 L 462.5 494 L 462.5 507 L 412.5 507 Z","labelPos":[437.5,500.5],"fontSize":8,"targetColor":"#10b981"},
    {"id":"piece_253","code":"9A","isTarget":true,"d":"M 475 494 L 537.5 494 L 537.5 507 L 475 507 Z","labelPos":[506.3,500.5],"fontSize":8,"targetColor":"#10b981"},
    {"id":"piece_254","code":"9A","isTarget":true,"d":"M 537.5 494 L 600 494 L 600 507 L 537.5 507 Z","labelPos":[568.8,500.5],"fontSize":8,"targetColor":"#10b981"},
    {"id":"piece_255","code":"9C","isTarget":false,"d":"M 600 507 L 650 507 L 650 494 L 687.5 494 L 687.5 520 L 600 520 Z","labelPos":[668.8,507],"fontSize":8.5},
    {"id":"piece_256","code":"9B","isTarget":false,"d":"M 162.5 507 L 250 507 L 250 520 L 162.5 520 Z","labelPos":[206.3,513.5],"fontSize":8},
    {"id":"piece_257","code":"9D","isTarget":false,"d":"M 250 507 L 337.5 507 L 337.5 520 L 250 520 Z","labelPos":[293.8,513.5],"fontSize":8},
    {"id":"piece_258","code":"9B","isTarget":false,"d":"M 337.5 507 L 425 507 L 425 520 L 337.5 520 Z","labelPos":[381.3,513.5],"fontSize":8},
    {"id":"piece_259","code":"9D","isTarget":false,"d":"M 425 507 L 512.5 507 L 512.5 520 L 425 520 Z","labelPos":[468.8,513.5],"fontSize":8},
    {"id":"piece_260","code":"9B","isTarget":false,"d":"M 512.5 507 L 600 507 L 600 520 L 512.5 520 Z","labelPos":[556.3,513.5],"fontSize":8}
  ];

  // 2B. MA TRẬN KIỂU DẤU GẠCH NGANG "20-11" (97 MẢNG MÀU CHUẨN - GIỐNG BỘ MẪU GIẤY IN TRUYỀN THỐNG)
  const PUZZLE_CELLS_DASH = [
    {"id":"piece_0","code":"1A","isTarget":false,"d":"M 0 0 L 87.5 0 L 87.5 13 L 12.5 13 L 12.5 26 L 0 26 Z","labelPos":[37.5,6.5],"fontSize":8},
    {"id":"piece_1","code":"1D","isTarget":false,"d":"M 87.5 0 L 175 0 L 175 26 L 137.5 26 L 137.5 13 L 87.5 13 Z","labelPos":[156.3,13],"fontSize":8.5},
    {"id":"piece_2","code":"1A","isTarget":false,"d":"M 175 0 L 262.5 0 L 262.5 26 L 200 26 L 200 13 L 175 13 Z","labelPos":[225,13],"fontSize":8.5},
    {"id":"piece_3","code":"1D","isTarget":false,"d":"M 262.5 0 L 350 0 L 350 26 L 325 26 L 325 13 L 287.5 13 L 287.5 26 L 262.5 26 Z","labelPos":[306.3,6.5],"fontSize":8},
    {"id":"piece_4","code":"10C","isTarget":false,"d":"M 350 0 L 437.5 0 L 437.5 13 L 350 13 Z","labelPos":[393.8,6.5],"fontSize":7.5},
    {"id":"piece_5","code":"2D","isTarget":false,"d":"M 437.5 0 L 525 0 L 525 13 L 475 13 L 475 26 L 437.5 26 Z","labelPos":[456.3,13],"fontSize":8.5},
    {"id":"piece_6","code":"2A","isTarget":false,"d":"M 525 0 L 612.5 0 L 612.5 39 L 587.5 39 L 587.5 26 L 575 26 L 575 13 L 525 13 Z","labelPos":[593.8,13],"fontSize":8.5},
    {"id":"piece_7","code":"2D","isTarget":false,"d":"M 612.5 0 L 700 0 L 700 26 L 662.5 26 L 662.5 13 L 612.5 13 Z","labelPos":[681.3,13],"fontSize":8.5},
    {"id":"piece_8","code":"2A","isTarget":false,"d":"M 700 0 L 787.5 0 L 787.5 13 L 750 13 L 750 26 L 725 26 L 725 13 L 700 13 Z","labelPos":[743.8,6.5],"fontSize":8},
    {"id":"piece_9","code":"2D","isTarget":false,"d":"M 787.5 0 L 800 0 L 800 39 L 750 39 L 750 13 L 787.5 13 Z","labelPos":[775,26],"fontSize":8.5},
    {"id":"piece_10","code":"1C","isTarget":false,"d":"M 12.5 13 L 137.5 13 L 137.5 26 L 12.5 26 Z","labelPos":[75,19.5],"fontSize":8},
    {"id":"piece_11","code":"1C","isTarget":false,"d":"M 175 13 L 200 13 L 200 26 L 237.5 26 L 237.5 39 L 175 39 Z","labelPos":[200,32.5],"fontSize":8},
    {"id":"piece_12","code":"1A","isTarget":false,"d":"M 237.5 26 L 287.5 26 L 287.5 13 L 325 13 L 325 39 L 237.5 39 Z","labelPos":[306.3,26],"fontSize":8.5},
    {"id":"piece_13","code":"10D","isTarget":false,"d":"M 350 13 L 437.5 13 L 437.5 26 L 350 26 Z","labelPos":[393.8,19.5],"fontSize":7.5},
    {"id":"piece_14","code":"2B","isTarget":false,"d":"M 550 26 L 550 39 L 537.5 39 L 537.5 26 L 500 26 L 500 39 L 475 39 L 475 13 L 562.5 13 L 562.5 26 Z","labelPos":[512.5,19.5],"fontSize":8},
    {"id":"piece_15","code":"2C","isTarget":true,"d":"M 562.5 13 L 575 13 L 575 26 L 587.5 26 L 587.5 39 L 600 39 L 600 52 L 575 52 L 575 39 L 562.5 39 Z","labelPos":[575,32.5],"fontSize":8,"targetColor":"#dc2626"},
    {"id":"piece_16","code":"2B","isTarget":false,"d":"M 612.5 13 L 662.5 13 L 662.5 26 L 700 26 L 700 39 L 612.5 39 Z","labelPos":[637.5,26],"fontSize":8.5},
    {"id":"piece_17","code":"2D","isTarget":false,"d":"M 687.5 39 L 700 39 L 700 13 L 725 13 L 725 26 L 750 26 L 750 39 L 775 39 L 775 52 L 762.5 52 L 762.5 65 L 750 65 L 750 52 L 687.5 52 Z","labelPos":[725,39],"fontSize":8.5},
    {"id":"piece_18","code":"1D","isTarget":false,"d":"M 0 26 L 87.5 26 L 87.5 52 L 75 52 L 75 39 L 0 39 Z","labelPos":[50,32.5],"fontSize":8},
    {"id":"piece_19","code":"1A","isTarget":false,"d":"M 87.5 26 L 175 26 L 175 39 L 162.5 39 L 162.5 52 L 137.5 52 L 137.5 39 L 87.5 39 Z","labelPos":[137.5,32.5],"fontSize":8},
    {"id":"piece_20","code":"1C","isTarget":false,"d":"M 250 39 L 325 39 L 325 26 L 337.5 26 L 337.5 52 L 250 52 Z","labelPos":[300,45.5],"fontSize":8},
    {"id":"piece_21","code":"10C","isTarget":false,"d":"M 337.5 26 L 425 26 L 425 39 L 337.5 39 Z","labelPos":[381.3,32.5],"fontSize":7.5},
    {"id":"piece_22","code":"10A","isTarget":false,"d":"M 500 26 L 512.5 26 L 512.5 65 L 475 65 L 475 52 L 462.5 52 L 462.5 39 L 425 39 L 425 26 L 475 26 L 475 39 L 500 39 Z","labelPos":[493.8,52],"fontSize":8},
    {"id":"piece_23","code":"2D","isTarget":false,"d":"M 562.5 39 L 575 39 L 575 52 L 600 52 L 600 78 L 587.5 78 L 587.5 65 L 512.5 65 L 512.5 26 L 537.5 26 L 537.5 52 L 562.5 52 Z","labelPos":[550,58.5],"fontSize":8},
    {"id":"piece_24","code":"2C","isTarget":true,"d":"M 550 26 L 562.5 26 L 562.5 52 L 537.5 52 L 537.5 39 L 550 39 Z","labelPos":[550,45.5],"fontSize":8,"targetColor":"#dc2626"},
    {"id":"piece_25","code":"1C","isTarget":false,"d":"M 0 39 L 75 39 L 75 52 L 62.5 52 L 62.5 65 L 37.5 65 L 37.5 52 L 0 52 Z","labelPos":[37.5,45.5],"fontSize":8},
    {"id":"piece_26","code":"1D","isTarget":false,"d":"M 62.5 52 L 87.5 52 L 87.5 39 L 137.5 39 L 137.5 52 L 150 52 L 150 65 L 62.5 65 Z","labelPos":[112.5,52],"fontSize":8.5},
    {"id":"piece_27","code":"1D","isTarget":false,"d":"M 162.5 39 L 250 39 L 250 52 L 162.5 52 Z","labelPos":[206.3,45.5],"fontSize":8},
    {"id":"piece_28","code":"10A","isTarget":false,"d":"M 337.5 39 L 425 39 L 425 52 L 337.5 52 Z","labelPos":[381.3,45.5],"fontSize":7.5},
    {"id":"piece_29","code":"10D","isTarget":false,"d":"M 412.5 65 L 412.5 78 L 400 78 L 400 65 L 387.5 65 L 387.5 52 L 425 52 L 425 39 L 462.5 39 L 462.5 52 L 475 52 L 475 65 Z","labelPos":[443.8,52],"fontSize":8},
    {"id":"piece_30","code":"2A","isTarget":false,"d":"M 600 39 L 687.5 39 L 687.5 52 L 600 52 Z","labelPos":[643.8,45.5],"fontSize":8},
    {"id":"piece_31","code":"2B","isTarget":false,"d":"M 775 39 L 800 39 L 800 91 L 762.5 91 L 762.5 78 L 787.5 78 L 787.5 52 L 775 52 Z","labelPos":[781.3,84.5],"fontSize":8},
    {"id":"piece_32","code":"1A","isTarget":false,"d":"M 0 52 L 37.5 52 L 37.5 65 L 75 65 L 75 91 L 12.5 91 L 12.5 78 L 0 78 Z","labelPos":[37.5,78],"fontSize":8.5},
    {"id":"piece_33","code":"1C","isTarget":false,"d":"M 150 52 L 237.5 52 L 237.5 65 L 175 65 L 175 78 L 150 78 Z","labelPos":[187.5,58.5],"fontSize":8},
    {"id":"piece_34","code":"1A","isTarget":false,"d":"M 237.5 52 L 300 52 L 300 65 L 275 65 L 275 78 L 287.5 78 L 287.5 91 L 275 91 L 275 104 L 250 104 L 250 78 L 237.5 78 Z","labelPos":[256.3,65],"fontSize":8.5},
    {"id":"piece_35","code":"1D","isTarget":false,"d":"M 312.5 78 L 325 78 L 325 65 L 300 65 L 300 52 L 387.5 52 L 387.5 65 L 362.5 65 L 362.5 78 L 337.5 78 L 337.5 91 L 312.5 91 Z","labelPos":[343.8,65],"fontSize":8.5},
    {"id":"piece_36","code":"2B","isTarget":false,"d":"M 662.5 52 L 662.5 65 L 637.5 65 L 637.5 78 L 612.5 78 L 612.5 91 L 600 91 L 600 52 Z","labelPos":[618.8,65],"fontSize":8.5},
    {"id":"piece_37","code":"2B","isTarget":false,"d":"M 700 117 L 687.5 117 L 687.5 91 L 675 91 L 675 78 L 662.5 78 L 662.5 52 L 700 52 Z","labelPos":[681.3,65],"fontSize":8.5},
    {"id":"piece_38","code":"2A","isTarget":false,"d":"M 700 52 L 750 52 L 750 65 L 762.5 65 L 762.5 52 L 787.5 52 L 787.5 78 L 725 78 L 725 65 L 700 65 Z","labelPos":[750,71.5],"fontSize":8},
    {"id":"piece_39","code":"1B","isTarget":true,"d":"M 75 65 L 150 65 L 150 91 L 125 91 L 125 104 L 100 104 L 100 91 L 75 91 Z","labelPos":[112.5,78],"fontSize":8.5,"targetColor":"#dc2626"},
    {"id":"piece_40","code":"1B","isTarget":true,"d":"M 175 65 L 225 65 L 225 78 L 175 78 Z","labelPos":[200,71.5],"fontSize":8,"targetColor":"#dc2626"},
    {"id":"piece_41","code":"1B","isTarget":true,"d":"M 225 65 L 237.5 65 L 237.5 78 L 250 78 L 250 104 L 237.5 104 L 237.5 91 L 225 91 Z","labelPos":[237.5,84.5],"fontSize":8,"targetColor":"#dc2626"},
    {"id":"piece_42","code":"1B","isTarget":true,"d":"M 275 65 L 325 65 L 325 78 L 312.5 78 L 312.5 104 L 287.5 104 L 287.5 78 L 275 78 Z","labelPos":[300,71.5],"fontSize":8,"targetColor":"#dc2626"},
    {"id":"piece_43","code":"10C","isTarget":false,"d":"M 362.5 104 L 375 104 L 375 117 L 350 117 L 350 104 L 312.5 104 L 312.5 91 L 337.5 91 L 337.5 78 L 362.5 78 L 362.5 65 L 400 65 L 400 91 L 362.5 91 Z","labelPos":[381.3,78],"fontSize":8},
    {"id":"piece_44","code":"10B","isTarget":true,"d":"M 412.5 65 L 425 65 L 425 78 L 437.5 78 L 437.5 104 L 387.5 104 L 387.5 91 L 400 91 L 400 78 L 412.5 78 Z","labelPos":[418.8,91],"fontSize":8,"targetColor":"#eab308"},
    {"id":"piece_45","code":"10C","isTarget":false,"d":"M 425 65 L 512.5 65 L 512.5 104 L 475 104 L 475 91 L 437.5 91 L 437.5 78 L 425 78 Z","labelPos":[475,78],"fontSize":8},
    {"id":"piece_46","code":"2A","isTarget":false,"d":"M 462.5 104 L 512.5 104 L 512.5 65 L 550 65 L 550 78 L 537.5 78 L 537.5 91 L 525 91 L 525 117 L 462.5 117 Z","labelPos":[500,110.5],"fontSize":8},
    {"id":"piece_47","code":"2C","isTarget":true,"d":"M 550 65 L 587.5 65 L 587.5 78 L 600 78 L 600 91 L 575 91 L 575 78 L 562.5 78 L 562.5 91 L 537.5 91 L 537.5 78 L 550 78 Z","labelPos":[568.8,71.5],"fontSize":8,"targetColor":"#dc2626"},
    {"id":"piece_48","code":"2C","isTarget":true,"d":"M 637.5 65 L 662.5 65 L 662.5 78 L 675 78 L 675 91 L 650 91 L 650 104 L 637.5 104 Z","labelPos":[656.3,84.5],"fontSize":8,"targetColor":"#dc2626"},
    {"id":"piece_49","code":"2C","isTarget":true,"d":"M 687.5 117 L 700 117 L 700 65 L 725 65 L 725 143 L 712.5 143 L 712.5 130 L 687.5 130 Z","labelPos":[706.3,123.5],"fontSize":8,"targetColor":"#dc2626"},
    {"id":"piece_50","code":"1C","isTarget":false,"d":"M 0 78 L 12.5 78 L 12.5 91 L 75 91 L 75 104 L 0 104 Z","labelPos":[31.3,97.5],"fontSize":8},
    {"id":"piece_51","code":"1D","isTarget":false,"d":"M 150 78 L 175 78 L 175 117 L 125 117 L 125 91 L 150 91 Z","labelPos":[150,104],"fontSize":8.5},
    {"id":"piece_52","code":"1B","isTarget":true,"d":"M 175 78 L 200 78 L 200 104 L 187.5 104 L 187.5 117 L 200 117 L 200 130 L 175 130 Z","labelPos":[187.5,91],"fontSize":8,"targetColor":"#dc2626"},
    {"id":"piece_53","code":"1D","isTarget":false,"d":"M 200 78 L 225 78 L 225 104 L 200 104 Z","labelPos":[212.5,91],"fontSize":8},
    {"id":"piece_54","code":"2A","isTarget":false,"d":"M 562.5 78 L 575 78 L 575 91 L 587.5 91 L 587.5 117 L 550 117 L 550 91 L 562.5 91 Z","labelPos":[568.8,104],"fontSize":8.5},
    {"id":"piece_55","code":"2D","isTarget":false,"d":"M 612.5 78 L 637.5 78 L 637.5 143 L 625 143 L 625 130 L 612.5 130 Z","labelPos":[625,110.5],"fontSize":8},
    {"id":"piece_56","code":"2D","isTarget":false,"d":"M 725 78 L 762.5 78 L 762.5 91 L 800 91 L 800 104 L 775 104 L 775 117 L 737.5 117 L 737.5 104 L 725 104 Z","labelPos":[756.3,104],"fontSize":8.5},
    {"id":"piece_57","code":"1D","isTarget":false,"d":"M 75 91 L 100 91 L 100 143 L 25 143 L 25 130 L 87.5 130 L 87.5 104 L 75 104 Z","labelPos":[75,136.5],"fontSize":8},
    {"id":"piece_58","code":"1B","isTarget":true,"d":"M 225 91 L 237.5 91 L 237.5 117 L 187.5 117 L 187.5 104 L 225 104 Z","labelPos":[212.5,110.5],"fontSize":8,"targetColor":"#dc2626"},
    {"id":"piece_59","code":"1D","isTarget":false,"d":"M 275 91 L 287.5 91 L 287.5 143 L 275 143 L 275 156 L 250 156 L 250 130 L 237.5 130 L 237.5 104 L 275 104 Z","labelPos":[262.5,117],"fontSize":8.5},
    {"id":"piece_60","code":"10B","isTarget":true,"d":"M 362.5 91 L 387.5 91 L 387.5 104 L 437.5 104 L 437.5 91 L 475 91 L 475 104 L 462.5 104 L 462.5 117 L 375 117 L 375 104 L 362.5 104 Z","labelPos":[418.8,110.5],"fontSize":7.5,"targetColor":"#eab308"},
    {"id":"piece_61","code":"2C","isTarget":true,"d":"M 550 91 L 550 117 L 537.5 117 L 537.5 130 L 525 130 L 525 91 Z","labelPos":[537.5,104],"fontSize":8,"targetColor":"#dc2626"},
    {"id":"piece_62","code":"2C","isTarget":true,"d":"M 587.5 91 L 612.5 91 L 612.5 117 L 587.5 117 Z","labelPos":[600,104],"fontSize":8,"targetColor":"#dc2626"},
    {"id":"piece_63","code":"2C","isTarget":true,"d":"M 637.5 104 L 650 104 L 650 91 L 687.5 91 L 687.5 130 L 675 130 L 675 104 L 662.5 104 L 662.5 117 L 637.5 117 Z","labelPos":[668.8,97.5],"fontSize":8,"targetColor":"#dc2626"},
    {"id":"piece_64","code":"1A","isTarget":false,"d":"M 0 104 L 87.5 104 L 87.5 130 L 0 130 Z","labelPos":[43.8,117],"fontSize":8.5},
    {"id":"piece_65","code":"1B","isTarget":true,"d":"M 100 104 L 125 104 L 125 156 L 100 156 Z","labelPos":[112.5,130],"fontSize":8,"targetColor":"#dc2626"},
    {"id":"piece_66","code":"1B","isTarget":true,"d":"M 275 143 L 287.5 143 L 287.5 104 L 312.5 104 L 312.5 143 L 325 143 L 325 156 L 275 156 Z","labelPos":[300,149.5],"fontSize":8,"targetColor":"#dc2626"},
    {"id":"piece_67","code":"10D","isTarget":false,"d":"M 387.5 117 L 387.5 130 L 375 130 L 375 143 L 337.5 143 L 337.5 130 L 312.5 130 L 312.5 104 L 350 104 L 350 117 Z","labelPos":[356.3,130],"fontSize":8},
    {"id":"piece_68","code":"2D","isTarget":false,"d":"M 662.5 104 L 675 104 L 675 130 L 687.5 130 L 687.5 143 L 700 143 L 700 156 L 712.5 156 L 712.5 169 L 650 169 L 650 156 L 662.5 156 Z","labelPos":[681.3,156],"fontSize":8.5},
    {"id":"piece_69","code":"2B","isTarget":false,"d":"M 725 104 L 737.5 104 L 737.5 117 L 775 117 L 775 104 L 800 104 L 800 130 L 725 130 Z","labelPos":[762.5,123.5],"fontSize":8},
    {"id":"piece_70","code":"1A","isTarget":false,"d":"M 175 117 L 175 169 L 150 169 L 150 143 L 125 143 L 125 117 Z","labelPos":[150,130],"fontSize":8.5},
    {"id":"piece_71","code":"1C","isTarget":false,"d":"M 200 117 L 212.5 117 L 212.5 130 L 225 130 L 225 156 L 275 156 L 275 169 L 187.5 169 L 187.5 156 L 200 156 Z","labelPos":[225,162.5],"fontSize":8},
    {"id":"piece_72","code":"1B","isTarget":true,"d":"M 212.5 117 L 237.5 117 L 237.5 130 L 250 130 L 250 156 L 225 156 L 225 130 L 212.5 130 Z","labelPos":[237.5,143],"fontSize":8,"targetColor":"#dc2626"},
    {"id":"piece_73","code":"10B","isTarget":true,"d":"M 387.5 117 L 450 117 L 450 130 L 462.5 130 L 462.5 143 L 475 143 L 475 156 L 450 156 L 450 143 L 425 143 L 425 130 L 387.5 130 Z","labelPos":[425,123.5],"fontSize":7.5,"targetColor":"#eab308"},
    {"id":"piece_74","code":"10D","isTarget":false,"d":"M 450 117 L 525 117 L 525 143 L 500 143 L 500 156 L 475 156 L 475 143 L 462.5 143 L 462.5 130 L 450 130 Z","labelPos":[487.5,130],"fontSize":8},
    {"id":"piece_75","code":"2C","isTarget":true,"d":"M 537.5 117 L 612.5 117 L 612.5 130 L 537.5 130 Z","labelPos":[575,123.5],"fontSize":8,"targetColor":"#dc2626"},
    {"id":"piece_76","code":"2C","isTarget":true,"d":"M 637.5 117 L 662.5 117 L 662.5 156 L 637.5 156 Z","labelPos":[650,136.5],"fontSize":8,"targetColor":"#dc2626"},
    {"id":"piece_77","code":"1C","isTarget":false,"d":"M 0 130 L 25 130 L 25 143 L 87.5 143 L 87.5 156 L 12.5 156 L 12.5 169 L 0 169 Z","labelPos":[31.3,149.5],"fontSize":8},
    {"id":"piece_78","code":"1B","isTarget":true,"d":"M 175 130 L 200 130 L 200 156 L 175 156 Z","labelPos":[187.5,143],"fontSize":8,"targetColor":"#dc2626"},
    {"id":"piece_79","code":"1C","isTarget":false,"d":"M 312.5 130 L 337.5 130 L 337.5 143 L 362.5 143 L 362.5 169 L 312.5 169 L 312.5 156 L 325 156 L 325 143 L 312.5 143 Z","labelPos":[343.8,156],"fontSize":8.5},
    {"id":"piece_80","code":"10D","isTarget":false,"d":"M 412.5 130 L 425 130 L 425 143 L 450 143 L 450 169 L 362.5 169 L 362.5 156 L 387.5 156 L 387.5 143 L 412.5 143 Z","labelPos":[412.5,156],"fontSize":8},
    {"id":"piece_81","code":"10B","isTarget":true,"d":"M 362.5 143 L 375 143 L 375 130 L 412.5 130 L 412.5 143 L 387.5 143 L 387.5 156 L 362.5 156 Z","labelPos":[393.8,136.5],"fontSize":7.5,"targetColor":"#eab308"},
    {"id":"piece_82","code":"2C","isTarget":true,"d":"M 550 130 L 550 156 L 525 156 L 525 130 Z","labelPos":[537.5,143],"fontSize":8,"targetColor":"#dc2626"},
    {"id":"piece_83","code":"2D","isTarget":false,"d":"M 537.5 156 L 550 156 L 550 130 L 587.5 130 L 587.5 156 L 625 156 L 625 182 L 562.5 182 L 562.5 169 L 537.5 169 Z","labelPos":[587.5,169],"fontSize":8.5},
    {"id":"piece_84","code":"2C","isTarget":true,"d":"M 587.5 130 L 612.5 130 L 612.5 156 L 587.5 156 Z","labelPos":[600,143],"fontSize":8,"targetColor":"#dc2626"},
    {"id":"piece_85","code":"2B","isTarget":false,"d":"M 612.5 130 L 625 130 L 625 143 L 637.5 143 L 637.5 156 L 650 156 L 650 169 L 662.5 169 L 662.5 182 L 650 182 L 650 195 L 625 195 L 625 156 L 612.5 156 Z","labelPos":[643.8,175.5],"fontSize":8},
    {"id":"piece_86","code":"2C","isTarget":true,"d":"M 687.5 130 L 712.5 130 L 712.5 143 L 725 143 L 725 156 L 700 156 L 700 143 L 687.5 143 Z","labelPos":[700,136.5],"fontSize":8,"targetColor":"#dc2626"},
    {"id":"piece_87","code":"2D","isTarget":false,"d":"M 737.5 143 L 737.5 156 L 725 156 L 725 130 L 800 130 L 800 156 L 775 156 L 775 143 Z","labelPos":[762.5,136.5],"fontSize":8},
    {"id":"piece_88","code":"1C","isTarget":false,"d":"M 87.5 143 L 100 143 L 100 156 L 125 156 L 125 143 L 150 143 L 150 169 L 112.5 169 L 112.5 182 L 75 182 L 75 169 L 62.5 169 L 62.5 156 L 87.5 156 Z","labelPos":[93.8,169],"fontSize":8.5},
    {"id":"piece_89","code":"2B","isTarget":false,"d":"M 450 156 L 500 156 L 500 143 L 525 143 L 525 156 L 537.5 156 L 537.5 195 L 525 195 L 525 182 L 512.5 182 L 512.5 169 L 450 169 Z","labelPos":[506.3,162.5],"fontSize":8},
    {"id":"piece_90","code":"2A","isTarget":false,"d":"M 712.5 156 L 737.5 156 L 737.5 143 L 775 143 L 775 156 L 800 156 L 800 169 L 712.5 169 Z","labelPos":[756.3,156],"fontSize":8.5},
    {"id":"piece_91","code":"1D","isTarget":false,"d":"M 0 169 L 12.5 169 L 12.5 156 L 62.5 156 L 62.5 169 L 75 169 L 75 195 L 50 195 L 50 182 L 0 182 Z","labelPos":[37.5,169],"fontSize":8.5},
    {"id":"piece_92","code":"1D","isTarget":false,"d":"M 225 169 L 225 182 L 200 182 L 200 195 L 162.5 195 L 162.5 169 L 175 169 L 175 156 L 187.5 156 L 187.5 169 Z","labelPos":[181.3,182],"fontSize":8.5},
    {"id":"piece_93","code":"1D","isTarget":false,"d":"M 275 156 L 312.5 156 L 312.5 169 L 362.5 169 L 362.5 182 L 350 182 L 350 195 L 337.5 195 L 337.5 182 L 275 182 Z","labelPos":[293.8,169],"fontSize":8.5},
    {"id":"piece_94","code":"1C","isTarget":false,"d":"M 75 182 L 112.5 182 L 112.5 169 L 162.5 169 L 162.5 195 L 137.5 195 L 137.5 208 L 125 208 L 125 195 L 75 195 Z","labelPos":[137.5,182],"fontSize":8.5},
    {"id":"piece_95","code":"3D","isTarget":false,"d":"M 237.5 195 L 237.5 208 L 225 208 L 225 169 L 275 169 L 275 182 L 312.5 182 L 312.5 195 L 287.5 195 L 287.5 208 L 262.5 208 L 262.5 195 Z","labelPos":[250,182],"fontSize":8.5},
    {"id":"piece_96","code":"10A","isTarget":false,"d":"M 350 182 L 362.5 182 L 362.5 169 L 425 169 L 425 182 L 437.5 182 L 437.5 195 L 350 195 Z","labelPos":[393.8,182],"fontSize":8},
    {"id":"piece_97","code":"10C","isTarget":false,"d":"M 425 169 L 512.5 169 L 512.5 182 L 475 182 L 475 195 L 437.5 195 L 437.5 182 L 425 182 Z","labelPos":[456.3,182],"fontSize":8},
    {"id":"piece_98","code":"2A","isTarget":false,"d":"M 537.5 169 L 562.5 169 L 562.5 182 L 625 182 L 625 208 L 587.5 208 L 587.5 195 L 537.5 195 Z","labelPos":[606.3,195],"fontSize":8.5},
    {"id":"piece_99","code":"2A","isTarget":false,"d":"M 662.5 169 L 750 169 L 750 195 L 687.5 195 L 687.5 182 L 662.5 182 Z","labelPos":[712.5,182],"fontSize":8.5},
    {"id":"piece_100","code":"4B","isTarget":false,"d":"M 750 169 L 800 169 L 800 234 L 775 234 L 775 182 L 750 182 Z","labelPos":[775,175.5],"fontSize":8},
    {"id":"piece_101","code":"3D","isTarget":false,"d":"M 0 182 L 50 182 L 50 195 L 87.5 195 L 87.5 208 L 0 208 Z","labelPos":[25,195],"fontSize":8.5},
    {"id":"piece_102","code":"1A","isTarget":false,"d":"M 137.5 195 L 200 195 L 200 182 L 225 182 L 225 208 L 200 208 L 200 221 L 175 221 L 175 208 L 137.5 208 Z","labelPos":[187.5,201.5],"fontSize":8},
    {"id":"piece_103","code":"3C","isTarget":false,"d":"M 312.5 182 L 337.5 182 L 337.5 195 L 400 195 L 400 208 L 375 208 L 375 221 L 325 221 L 325 208 L 312.5 208 Z","labelPos":[350,208],"fontSize":8.5},
    {"id":"piece_104","code":"2D","isTarget":false,"d":"M 475 182 L 525 182 L 525 195 L 587.5 195 L 587.5 208 L 487.5 208 L 487.5 195 L 475 195 Z","labelPos":[506.3,195],"fontSize":8.5},
    {"id":"piece_105","code":"2D","isTarget":false,"d":"M 600 208 L 625 208 L 625 195 L 650 195 L 650 182 L 687.5 182 L 687.5 221 L 675 221 L 675 208 L 662.5 208 L 662.5 221 L 600 221 Z","labelPos":[643.8,208],"fontSize":8.5},
    {"id":"piece_106","code":"4A","isTarget":false,"d":"M 687.5 195 L 750 195 L 750 182 L 775 182 L 775 221 L 737.5 221 L 737.5 208 L 725 208 L 725 221 L 712.5 221 L 712.5 208 L 687.5 208 Z","labelPos":[756.3,208],"fontSize":8.5},
    {"id":"piece_107","code":"3C","isTarget":false,"d":"M 87.5 195 L 125 195 L 125 208 L 175 208 L 175 221 L 112.5 221 L 112.5 234 L 87.5 234 Z","labelPos":[106.3,208],"fontSize":8.5},
    {"id":"piece_108","code":"3B","isTarget":false,"d":"M 162.5 221 L 200 221 L 200 208 L 237.5 208 L 237.5 195 L 262.5 195 L 262.5 221 L 250 221 L 250 234 L 162.5 234 Z","labelPos":[225,221],"fontSize":8.5},
    {"id":"piece_109","code":"3A","isTarget":true,"d":"M 287.5 195 L 312.5 195 L 312.5 208 L 325 208 L 325 221 L 337.5 221 L 337.5 234 L 312.5 234 L 312.5 221 L 300 221 L 300 208 L 287.5 208 Z","labelPos":[312.5,214.5],"fontSize":8,"targetColor":"#f59e0b"},
    {"id":"piece_110","code":"10D","isTarget":false,"d":"M 400 195 L 487.5 195 L 487.5 221 L 400 221 Z","labelPos":[443.8,208],"fontSize":8},
    {"id":"piece_111","code":"3B","isTarget":false,"d":"M 0 208 L 87.5 208 L 87.5 234 L 37.5 234 L 37.5 221 L 0 221 Z","labelPos":[62.5,221],"fontSize":8.5},
    {"id":"piece_112","code":"3A","isTarget":true,"d":"M 262.5 208 L 275 208 L 275 221 L 287.5 221 L 287.5 234 L 300 234 L 300 247 L 275 247 L 275 234 L 262.5 234 Z","labelPos":[275,227.5],"fontSize":8,"targetColor":"#f59e0b"},
    {"id":"piece_113","code":"3B","isTarget":false,"d":"M 275 208 L 300 208 L 300 221 L 312.5 221 L 312.5 234 L 337.5 234 L 337.5 221 L 362.5 221 L 362.5 247 L 350 247 L 350 260 L 337.5 260 L 337.5 247 L 300 247 L 300 234 L 287.5 234 L 287.5 221 L 275 221 Z","labelPos":[325,240.5],"fontSize":8},
    {"id":"piece_114","code":"3D","isTarget":false,"d":"M 375 234 L 375 247 L 362.5 247 L 362.5 221 L 375 221 L 375 208 L 400 208 L 400 221 L 450 221 L 450 247 L 425 247 L 425 234 Z","labelPos":[406.3,227.5],"fontSize":8},
    {"id":"piece_115","code":"7B","isTarget":false,"d":"M 450 221 L 487.5 221 L 487.5 208 L 512.5 208 L 512.5 221 L 537.5 221 L 537.5 234 L 450 234 Z","labelPos":[493.8,227.5],"fontSize":8},
    {"id":"piece_116","code":"8D","isTarget":false,"d":"M 512.5 208 L 600 208 L 600 221 L 587.5 221 L 587.5 234 L 575 234 L 575 221 L 562.5 221 L 562.5 234 L 537.5 234 L 537.5 221 L 512.5 221 Z","labelPos":[556.3,214.5],"fontSize":8},
    {"id":"piece_117","code":"4D","isTarget":false,"d":"M 687.5 234 L 687.5 247 L 675 247 L 675 234 L 662.5 234 L 662.5 247 L 625 247 L 625 221 L 662.5 221 L 662.5 208 L 675 208 L 675 221 L 687.5 221 L 687.5 208 L 712.5 208 L 712.5 234 Z","labelPos":[643.8,234],"fontSize":8.5},
    {"id":"piece_118","code":"4C","isTarget":true,"d":"M 725 208 L 737.5 208 L 737.5 221 L 750 221 L 750 234 L 762.5 234 L 762.5 247 L 737.5 247 L 737.5 234 L 725 234 Z","labelPos":[737.5,227.5],"fontSize":8,"targetColor":"#f59e0b"},
    {"id":"piece_119","code":"3D","isTarget":false,"d":"M 0 221 L 37.5 221 L 37.5 234 L 87.5 234 L 87.5 247 L 75 247 L 75 260 L 50 260 L 50 247 L 0 247 Z","labelPos":[18.8,234],"fontSize":8.5},
    {"id":"piece_120","code":"3B","isTarget":false,"d":"M 87.5 234 L 112.5 234 L 112.5 221 L 162.5 221 L 162.5 234 L 175 234 L 175 247 L 87.5 247 Z","labelPos":[137.5,234],"fontSize":8.5},
    {"id":"piece_121","code":"3A","isTarget":true,"d":"M 250 221 L 262.5 221 L 262.5 247 L 237.5 247 L 237.5 234 L 250 234 Z","labelPos":[250,240.5],"fontSize":8,"targetColor":"#f59e0b"},
    {"id":"piece_122","code":"8B","isTarget":false,"d":"M 487.5 234 L 562.5 234 L 562.5 221 L 575 221 L 575 286 L 562.5 286 L 562.5 273 L 537.5 273 L 537.5 260 L 550 260 L 550 247 L 487.5 247 Z","labelPos":[543.8,240.5],"fontSize":8},
    {"id":"piece_123","code":"4B","isTarget":false,"d":"M 587.5 273 L 587.5 286 L 575 286 L 575 234 L 587.5 234 L 587.5 221 L 625 221 L 625 247 L 612.5 247 L 612.5 260 L 600 260 L 600 273 Z","labelPos":[593.8,247],"fontSize":8.5},
    {"id":"piece_124","code":"4B","isTarget":false,"d":"M 725 234 L 737.5 234 L 737.5 247 L 762.5 247 L 762.5 234 L 750 234 L 750 221 L 775 221 L 775 273 L 762.5 273 L 762.5 260 L 687.5 260 L 687.5 234 L 700 234 L 700 247 L 725 247 Z","labelPos":[737.5,253.5],"fontSize":8},
    {"id":"piece_125","code":"4C","isTarget":true,"d":"M 712.5 221 L 725 221 L 725 247 L 700 247 L 700 234 L 712.5 234 Z","labelPos":[712.5,240.5],"fontSize":8,"targetColor":"#f59e0b"},
    {"id":"piece_126","code":"3C","isTarget":false,"d":"M 237.5 234 L 237.5 247 L 200 247 L 200 260 L 175 260 L 175 299 L 150 299 L 150 260 L 162.5 260 L 162.5 247 L 175 247 L 175 234 Z","labelPos":[181.3,253.5],"fontSize":8},
    {"id":"piece_127","code":"3D","isTarget":false,"d":"M 262.5 234 L 275 234 L 275 247 L 287.5 247 L 287.5 260 L 250 260 L 250 273 L 237.5 273 L 237.5 260 L 200 260 L 200 247 L 262.5 247 Z","labelPos":[243.8,253.5],"fontSize":8},
    {"id":"piece_128","code":"3C","isTarget":false,"d":"M 350 247 L 375 247 L 375 234 L 425 234 L 425 247 L 437.5 247 L 437.5 273 L 412.5 273 L 412.5 260 L 387.5 260 L 387.5 286 L 362.5 286 L 362.5 260 L 350 260 Z","labelPos":[400,247],"fontSize":8.5},
    {"id":"piece_129","code":"7D","isTarget":false,"d":"M 437.5 247 L 450 247 L 450 234 L 487.5 234 L 487.5 247 L 550 247 L 550 260 L 512.5 260 L 512.5 273 L 487.5 273 L 487.5 260 L 437.5 260 Z","labelPos":[468.8,247],"fontSize":8.5},
    {"id":"piece_130","code":"4A","isTarget":false,"d":"M 687.5 260 L 700 260 L 700 273 L 650 273 L 650 260 L 612.5 260 L 612.5 247 L 662.5 247 L 662.5 234 L 675 234 L 675 247 L 687.5 247 Z","labelPos":[668.8,260],"fontSize":8.5},
    {"id":"piece_131","code":"4D","isTarget":false,"d":"M 775 234 L 800 234 L 800 299 L 775 299 Z","labelPos":[787.5,266.5],"fontSize":8},
    {"id":"piece_132","code":"3B","isTarget":false,"d":"M 50 247 L 50 260 L 25 260 L 25 286 L 50 286 L 50 312 L 37.5 312 L 37.5 299 L 0 299 L 0 247 Z","labelPos":[25,292.5],"fontSize":8},
    {"id":"piece_133","code":"3C","isTarget":false,"d":"M 75 247 L 162.5 247 L 162.5 260 L 75 260 Z","labelPos":[118.8,253.5],"fontSize":8},
    {"id":"piece_134","code":"3C","isTarget":false,"d":"M 287.5 247 L 337.5 247 L 337.5 286 L 350 286 L 350 312 L 337.5 312 L 337.5 299 L 325 299 L 325 286 L 300 286 L 300 273 L 287.5 273 Z","labelPos":[318.8,273],"fontSize":8.5},
    {"id":"piece_135","code":"3A","isTarget":true,"d":"M 25 260 L 100 260 L 100 286 L 25 286 Z","labelPos":[62.5,273],"fontSize":8.5,"targetColor":"#f59e0b"},
    {"id":"piece_136","code":"3B","isTarget":false,"d":"M 100 260 L 125 260 L 125 312 L 100 312 L 100 325 L 75 325 L 75 286 L 100 286 Z","labelPos":[100,299],"fontSize":8.5},
    {"id":"piece_137","code":"3A","isTarget":true,"d":"M 125 260 L 150 260 L 150 286 L 125 286 Z","labelPos":[137.5,273],"fontSize":8,"targetColor":"#f59e0b"},
    {"id":"piece_138","code":"3A","isTarget":true,"d":"M 200 299 L 187.5 299 L 187.5 286 L 175 286 L 175 260 L 200 260 Z","labelPos":[187.5,273],"fontSize":8,"targetColor":"#f59e0b"},
    {"id":"piece_139","code":"3C","isTarget":false,"d":"M 200 260 L 237.5 260 L 237.5 286 L 212.5 286 L 212.5 299 L 200 299 Z","labelPos":[218.8,273],"fontSize":8.5},
    {"id":"piece_140","code":"3A","isTarget":true,"d":"M 250 260 L 287.5 260 L 287.5 273 L 300 273 L 300 286 L 275 286 L 275 273 L 262.5 273 L 262.5 286 L 237.5 286 L 237.5 273 L 250 273 Z","labelPos":[268.8,266.5],"fontSize":8,"targetColor":"#f59e0b"},
    {"id":"piece_141","code":"3A","isTarget":true,"d":"M 337.5 260 L 362.5 260 L 362.5 286 L 375 286 L 375 299 L 350 299 L 350 286 L 337.5 286 Z","labelPos":[350,273],"fontSize":8,"targetColor":"#f59e0b"},
    {"id":"piece_142","code":"3A","isTarget":true,"d":"M 387.5 286 L 387.5 260 L 412.5 260 L 412.5 286 Z","labelPos":[400,273],"fontSize":8,"targetColor":"#f59e0b"},
    {"id":"piece_143","code":"7B","isTarget":false,"d":"M 412.5 273 L 437.5 273 L 437.5 260 L 462.5 260 L 462.5 273 L 450 273 L 450 312 L 425 312 L 425 299 L 400 299 L 400 286 L 412.5 286 Z","labelPos":[431.3,286],"fontSize":8.5},
    {"id":"piece_144","code":"7C","isTarget":true,"d":"M 500 312 L 487.5 312 L 487.5 299 L 475 299 L 475 312 L 450 312 L 450 273 L 462.5 273 L 462.5 260 L 487.5 260 L 487.5 273 L 500 273 Z","labelPos":[475,286],"fontSize":8.5,"targetColor":"#ec4899"},
    {"id":"piece_145","code":"8A","isTarget":true,"d":"M 512.5 260 L 537.5 260 L 537.5 273 L 550 273 L 550 299 L 537.5 299 L 537.5 286 L 500 286 L 500 273 L 512.5 273 Z","labelPos":[525,279.5],"fontSize":8,"targetColor":"#ec4899"},
    {"id":"piece_146","code":"4C","isTarget":true,"d":"M 650 273 L 662.5 273 L 662.5 286 L 637.5 286 L 637.5 273 L 612.5 273 L 612.5 286 L 587.5 286 L 587.5 273 L 600 273 L 600 260 L 650 260 Z","labelPos":[625,266.5],"fontSize":8,"targetColor":"#f59e0b"},
    {"id":"piece_147","code":"4C","isTarget":true,"d":"M 700 260 L 762.5 260 L 762.5 273 L 700 273 Z","labelPos":[731.3,266.5],"fontSize":8,"targetColor":"#f59e0b"},
    {"id":"piece_148","code":"3C","isTarget":false,"d":"M 262.5 273 L 275 273 L 275 286 L 287.5 286 L 287.5 312 L 250 312 L 250 286 L 262.5 286 Z","labelPos":[268.8,299],"fontSize":8.5},
    {"id":"piece_149","code":"8D","isTarget":false,"d":"M 550 273 L 562.5 273 L 562.5 286 L 587.5 286 L 587.5 325 L 537.5 325 L 537.5 312 L 550 312 Z","labelPos":[568.8,305.5],"fontSize":8.5},
    {"id":"piece_150","code":"4B","isTarget":false,"d":"M 662.5 273 L 687.5 273 L 687.5 299 L 650 299 L 650 312 L 612.5 312 L 612.5 273 L 637.5 273 L 637.5 286 L 662.5 286 Z","labelPos":[631.3,299],"fontSize":8.5},
    {"id":"piece_151","code":"4C","isTarget":true,"d":"M 712.5 273 L 712.5 325 L 687.5 325 L 687.5 273 Z","labelPos":[700,299],"fontSize":8,"targetColor":"#f59e0b"},
    {"id":"piece_152","code":"4D","isTarget":false,"d":"M 712.5 273 L 750 273 L 750 338 L 712.5 338 Z","labelPos":[731.3,305.5],"fontSize":8.5},
    {"id":"piece_153","code":"4C","isTarget":true,"d":"M 750 273 L 775 273 L 775 325 L 750 325 Z","labelPos":[762.5,299],"fontSize":8,"targetColor":"#f59e0b"},
    {"id":"piece_154","code":"3A","isTarget":true,"d":"M 50 286 L 75 286 L 75 351 L 50 351 Z","labelPos":[62.5,318.5],"fontSize":8,"targetColor":"#f59e0b"},
    {"id":"piece_155","code":"3A","isTarget":true,"d":"M 125 286 L 150 286 L 150 312 L 125 312 Z","labelPos":[137.5,299],"fontSize":8,"targetColor":"#f59e0b"},
    {"id":"piece_156","code":"3A","isTarget":true,"d":"M 150 299 L 175 299 L 175 286 L 187.5 286 L 187.5 299 L 200 299 L 200 325 L 175 325 L 175 312 L 150 312 Z","labelPos":[175,305.5],"fontSize":8,"targetColor":"#f59e0b"},
    {"id":"piece_157","code":"3D","isTarget":false,"d":"M 212.5 286 L 225 286 L 225 351 L 200 351 L 200 299 L 212.5 299 Z","labelPos":[212.5,318.5],"fontSize":8},
    {"id":"piece_158","code":"3A","isTarget":true,"d":"M 250 286 L 250 312 L 225 312 L 225 286 Z","labelPos":[237.5,299],"fontSize":8,"targetColor":"#f59e0b"},
    {"id":"piece_159","code":"3A","isTarget":true,"d":"M 287.5 286 L 312.5 286 L 312.5 325 L 262.5 325 L 262.5 312 L 287.5 312 Z","labelPos":[287.5,318.5],"fontSize":8,"targetColor":"#f59e0b"},
    {"id":"piece_160","code":"3B","isTarget":false,"d":"M 312.5 286 L 325 286 L 325 299 L 337.5 299 L 337.5 312 L 350 312 L 350 299 L 362.5 299 L 362.5 338 L 312.5 338 Z","labelPos":[337.5,325],"fontSize":8.5},
    {"id":"piece_161","code":"3A","isTarget":true,"d":"M 362.5 299 L 375 299 L 375 286 L 400 286 L 400 299 L 387.5 299 L 387.5 351 L 362.5 351 Z","labelPos":[375,318.5],"fontSize":8,"targetColor":"#f59e0b"},
    {"id":"piece_162","code":"8A","isTarget":true,"d":"M 537.5 299 L 550 299 L 550 312 L 500 312 L 500 286 L 537.5 286 Z","labelPos":[518.8,299],"fontSize":8.5,"targetColor":"#ec4899"},
    {"id":"piece_163","code":"4C","isTarget":true,"d":"M 612.5 351 L 600 351 L 600 338 L 587.5 338 L 587.5 286 L 612.5 286 Z","labelPos":[600,318.5],"fontSize":8,"targetColor":"#f59e0b"},
    {"id":"piece_164","code":"3C","isTarget":false,"d":"M 0 299 L 37.5 299 L 37.5 312 L 50 312 L 50 325 L 0 325 Z","labelPos":[18.8,312],"fontSize":8.5},
    {"id":"piece_165","code":"7D","isTarget":false,"d":"M 425 299 L 425 312 L 462.5 312 L 462.5 325 L 450 325 L 450 338 L 425 338 L 425 325 L 387.5 325 L 387.5 299 Z","labelPos":[406.3,312],"fontSize":8.5},
    {"id":"piece_166","code":"7C","isTarget":true,"d":"M 500 351 L 487.5 351 L 487.5 338 L 475 338 L 475 325 L 462.5 325 L 462.5 312 L 475 312 L 475 299 L 487.5 299 L 487.5 312 L 500 312 Z","labelPos":[481.3,318.5],"fontSize":8,"targetColor":"#ec4899"},
    {"id":"piece_167","code":"4D","isTarget":false,"d":"M 650 299 L 687.5 299 L 687.5 338 L 662.5 338 L 662.5 325 L 637.5 325 L 637.5 338 L 612.5 338 L 612.5 312 L 650 312 Z","labelPos":[668.8,312],"fontSize":8.5},
    {"id":"piece_168","code":"4A","isTarget":false,"d":"M 775 299 L 800 299 L 800 351 L 787.5 351 L 787.5 364 L 775 364 L 775 351 L 762.5 351 L 762.5 338 L 775 338 Z","labelPos":[781.3,344.5],"fontSize":8},
    {"id":"piece_169","code":"3D","isTarget":false,"d":"M 100 312 L 125 312 L 125 338 L 112.5 338 L 112.5 351 L 75 351 L 75 325 L 100 325 Z","labelPos":[93.8,338],"fontSize":8.5},
    {"id":"piece_170","code":"3B","isTarget":false,"d":"M 112.5 338 L 125 338 L 125 351 L 150 351 L 150 312 L 175 312 L 175 377 L 125 377 L 125 364 L 87.5 364 L 87.5 351 L 112.5 351 Z","labelPos":[150,364],"fontSize":8.5},
    {"id":"piece_171","code":"3A","isTarget":true,"d":"M 125 312 L 150 312 L 150 351 L 125 351 Z","labelPos":[137.5,331.5],"fontSize":8,"targetColor":"#f59e0b"},
    {"id":"piece_172","code":"3A","isTarget":true,"d":"M 262.5 312 L 262.5 325 L 250 325 L 250 351 L 225 351 L 225 312 Z","labelPos":[243.8,318.5],"fontSize":8,"targetColor":"#f59e0b"},
    {"id":"piece_173","code":"8A","isTarget":true,"d":"M 512.5 338 L 512.5 351 L 500 351 L 500 312 L 537.5 312 L 537.5 325 L 525 325 L 525 338 Z","labelPos":[518.8,318.5],"fontSize":8,"targetColor":"#ec4899"},
    {"id":"piece_174","code":"3B","isTarget":false,"d":"M 0 325 L 50 325 L 50 351 L 0 351 Z","labelPos":[25,338],"fontSize":8.5},
    {"id":"piece_175","code":"3A","isTarget":true,"d":"M 175 325 L 200 325 L 200 351 L 175 351 Z","labelPos":[187.5,338],"fontSize":8,"targetColor":"#f59e0b"},
    {"id":"piece_176","code":"3D","isTarget":false,"d":"M 262.5 351 L 250 351 L 250 325 L 287.5 325 L 287.5 351 L 337.5 351 L 337.5 364 L 262.5 364 Z","labelPos":[268.8,338],"fontSize":8.5},
    {"id":"piece_177","code":"3A","isTarget":true,"d":"M 287.5 325 L 312.5 325 L 312.5 351 L 287.5 351 Z","labelPos":[300,338],"fontSize":8,"targetColor":"#f59e0b"},
    {"id":"piece_178","code":"3C","isTarget":false,"d":"M 312.5 338 L 362.5 338 L 362.5 351 L 387.5 351 L 387.5 325 L 400 325 L 400 377 L 375 377 L 375 364 L 337.5 364 L 337.5 351 L 312.5 351 Z","labelPos":[368.8,357.5],"fontSize":8},
    {"id":"piece_179","code":"7B","isTarget":false,"d":"M 425 325 L 425 338 L 450 338 L 450 325 L 475 325 L 475 338 L 487.5 338 L 487.5 351 L 400 351 L 400 325 Z","labelPos":[443.8,344.5],"fontSize":8},
    {"id":"piece_180","code":"4A","isTarget":false,"d":"M 525 325 L 587.5 325 L 587.5 338 L 600 338 L 600 364 L 575 364 L 575 351 L 562.5 351 L 562.5 338 L 525 338 Z","labelPos":[562.5,331.5],"fontSize":8},
    {"id":"piece_181","code":"4C","isTarget":true,"d":"M 662.5 325 L 662.5 338 L 650 338 L 650 351 L 612.5 351 L 612.5 338 L 637.5 338 L 637.5 325 Z","labelPos":[631.3,344.5],"fontSize":8,"targetColor":"#f59e0b"},
    {"id":"piece_182","code":"4C","isTarget":true,"d":"M 687.5 325 L 712.5 325 L 712.5 338 L 750 338 L 750 325 L 775 325 L 775 338 L 762.5 338 L 762.5 351 L 700 351 L 700 338 L 687.5 338 Z","labelPos":[731.3,344.5],"fontSize":8,"targetColor":"#f59e0b"},
    {"id":"piece_183","code":"8B","isTarget":false,"d":"M 487.5 351 L 512.5 351 L 512.5 338 L 562.5 338 L 562.5 351 L 575 351 L 575 364 L 487.5 364 Z","labelPos":[537.5,351],"fontSize":8.5},
    {"id":"piece_184","code":"4A","isTarget":false,"d":"M 650 338 L 700 338 L 700 351 L 737.5 351 L 737.5 377 L 687.5 377 L 687.5 351 L 650 351 Z","labelPos":[712.5,364],"fontSize":8.5},
    {"id":"piece_185","code":"3C","isTarget":false,"d":"M 0 351 L 87.5 351 L 87.5 364 L 0 364 Z","labelPos":[43.8,357.5],"fontSize":8},
    {"id":"piece_186","code":"5A","isTarget":false,"d":"M 175 351 L 262.5 351 L 262.5 364 L 225 364 L 225 377 L 175 377 Z","labelPos":[200,364],"fontSize":8.5},
    {"id":"piece_187","code":"7D","isTarget":false,"d":"M 400 351 L 487.5 351 L 487.5 377 L 475 377 L 475 390 L 462.5 390 L 462.5 377 L 437.5 377 L 437.5 364 L 400 364 Z","labelPos":[462.5,364],"fontSize":8.5},
    {"id":"piece_188","code":"4B","isTarget":false,"d":"M 600 351 L 687.5 351 L 687.5 377 L 650 377 L 650 364 L 600 364 Z","labelPos":[668.8,364],"fontSize":8.5},
    {"id":"piece_189","code":"4D","isTarget":false,"d":"M 787.5 351 L 800 351 L 800 377 L 787.5 377 L 787.5 390 L 775 390 L 775 377 L 737.5 377 L 737.5 351 L 775 351 L 775 364 L 787.5 364 Z","labelPos":[756.3,364],"fontSize":8.5},
    {"id":"piece_190","code":"9C","isTarget":false,"d":"M 0 364 L 125 364 L 125 377 L 0 377 Z","labelPos":[62.5,370.5],"fontSize":8},
    {"id":"piece_191","code":"5D","isTarget":false,"d":"M 225 364 L 312.5 364 L 312.5 377 L 275 377 L 275 390 L 262.5 390 L 262.5 377 L 250 377 L 250 390 L 225 390 Z","labelPos":[262.5,370.5],"fontSize":8},
    {"id":"piece_192","code":"5A","isTarget":false,"d":"M 312.5 364 L 375 364 L 375 377 L 362.5 377 L 362.5 390 L 337.5 390 L 337.5 377 L 312.5 377 Z","labelPos":[343.8,370.5],"fontSize":8},
    {"id":"piece_193","code":"6B","isTarget":false,"d":"M 362.5 377 L 400 377 L 400 364 L 437.5 364 L 437.5 377 L 450 377 L 450 390 L 362.5 390 Z","labelPos":[418.8,377],"fontSize":8.5},
    {"id":"piece_194","code":"6D","isTarget":false,"d":"M 487.5 364 L 575 364 L 575 390 L 562.5 390 L 562.5 403 L 525 403 L 525 377 L 487.5 377 Z","labelPos":[550,377],"fontSize":8.5},
    {"id":"piece_195","code":"6B","isTarget":false,"d":"M 562.5 390 L 575 390 L 575 364 L 637.5 364 L 637.5 416 L 625 416 L 625 377 L 600 377 L 600 390 L 587.5 390 L 587.5 403 L 562.5 403 Z","labelPos":[606.3,370.5],"fontSize":8},
    {"id":"piece_196","code":"9C","isTarget":false,"d":"M 725 377 L 725 390 L 712.5 390 L 712.5 403 L 662.5 403 L 662.5 416 L 637.5 416 L 637.5 364 L 650 364 L 650 377 Z","labelPos":[675,390],"fontSize":8.5},
    {"id":"piece_197","code":"9D","isTarget":false,"d":"M 0 377 L 50 377 L 50 403 L 0 403 Z","labelPos":[25,390],"fontSize":8.5},
    {"id":"piece_198","code":"9A","isTarget":true,"d":"M 112.5 403 L 112.5 416 L 62.5 416 L 62.5 403 L 50 403 L 50 377 L 75 377 L 75 390 L 87.5 390 L 87.5 403 Z","labelPos":[68.8,396.5],"fontSize":8,"targetColor":"#10b981"},
    {"id":"piece_199","code":"9D","isTarget":false,"d":"M 75 377 L 162.5 377 L 162.5 390 L 150 390 L 150 403 L 87.5 403 L 87.5 390 L 75 390 Z","labelPos":[118.8,390],"fontSize":8.5},
    {"id":"piece_200","code":"5B","isTarget":true,"d":"M 150 390 L 162.5 390 L 162.5 377 L 225 377 L 225 390 L 237.5 390 L 237.5 416 L 225 416 L 225 403 L 212.5 403 L 212.5 390 L 175 390 L 175 403 L 150 403 Z","labelPos":[200,383.5],"fontSize":8,"targetColor":"#2563eb"},
    {"id":"piece_201","code":"5C","isTarget":false,"d":"M 250 377 L 262.5 377 L 262.5 442 L 225 442 L 225 416 L 237.5 416 L 237.5 390 L 250 390 Z","labelPos":[243.8,429],"fontSize":8.5},
    {"id":"piece_202","code":"5B","isTarget":true,"d":"M 275 377 L 337.5 377 L 337.5 403 L 325 403 L 325 390 L 287.5 390 L 287.5 403 L 262.5 403 L 262.5 390 L 275 390 Z","labelPos":[300,383.5],"fontSize":8,"targetColor":"#2563eb"},
    {"id":"piece_203","code":"6A","isTarget":false,"d":"M 450 377 L 462.5 377 L 462.5 390 L 475 390 L 475 377 L 500 377 L 500 390 L 487.5 390 L 487.5 403 L 475 403 L 475 416 L 487.5 416 L 487.5 429 L 450 429 L 450 416 L 437.5 416 L 437.5 390 L 450 390 Z","labelPos":[456.3,403],"fontSize":8.5},
    {"id":"piece_204","code":"6C","isTarget":true,"d":"M 525 377 L 525 390 L 512.5 390 L 512.5 403 L 487.5 403 L 487.5 390 L 500 390 L 500 377 Z","labelPos":[512.5,383.5],"fontSize":8,"targetColor":"#2563eb"},
    {"id":"piece_205","code":"6C","isTarget":true,"d":"M 587.5 390 L 600 390 L 600 377 L 625 377 L 625 403 L 587.5 403 Z","labelPos":[606.3,396.5],"fontSize":8,"targetColor":"#2563eb"},
    {"id":"piece_206","code":"9A","isTarget":true,"d":"M 687.5 403 L 712.5 403 L 712.5 390 L 725 390 L 725 377 L 750 377 L 750 403 L 737.5 403 L 737.5 416 L 725 416 L 725 429 L 700 429 L 700 416 L 687.5 416 Z","labelPos":[712.5,409.5],"fontSize":8,"targetColor":"#10b981"},
    {"id":"piece_207","code":"9B","isTarget":false,"d":"M 787.5 377 L 800 377 L 800 403 L 750 403 L 750 377 L 775 377 L 775 390 L 787.5 390 Z","labelPos":[775,396.5],"fontSize":8},
    {"id":"piece_208","code":"5C","isTarget":false,"d":"M 150 403 L 175 403 L 175 390 L 212.5 390 L 212.5 416 L 200 416 L 200 429 L 187.5 429 L 187.5 416 L 150 416 Z","labelPos":[193.8,403],"fontSize":8.5},
    {"id":"piece_209","code":"5D","isTarget":false,"d":"M 287.5 390 L 325 390 L 325 416 L 312.5 416 L 312.5 429 L 300 429 L 300 416 L 287.5 416 Z","labelPos":[306.3,403],"fontSize":8.5},
    {"id":"piece_210","code":"5B","isTarget":true,"d":"M 337.5 390 L 350 390 L 350 416 L 337.5 416 L 337.5 429 L 325 429 L 325 403 L 337.5 403 Z","labelPos":[337.5,409.5],"fontSize":8,"targetColor":"#2563eb"},
    {"id":"piece_211","code":"6D","isTarget":false,"d":"M 350 390 L 437.5 390 L 437.5 416 L 375 416 L 375 403 L 350 403 Z","labelPos":[400,403],"fontSize":8.5},
    {"id":"piece_212","code":"6C","isTarget":true,"d":"M 475 403 L 512.5 403 L 512.5 390 L 525 390 L 525 429 L 512.5 429 L 512.5 442 L 500 442 L 500 416 L 475 416 Z","labelPos":[500,409.5],"fontSize":8,"targetColor":"#2563eb"},
    {"id":"piece_213","code":"9C","isTarget":false,"d":"M 62.5 403 L 62.5 416 L 50 416 L 50 442 L 0 442 L 0 403 Z","labelPos":[25,422.5],"fontSize":8.5},
    {"id":"piece_214","code":"5A","isTarget":false,"d":"M 100 416 L 112.5 416 L 112.5 403 L 150 403 L 150 416 L 187.5 416 L 187.5 429 L 100 429 Z","labelPos":[131.3,416],"fontSize":8.5},
    {"id":"piece_215","code":"5B","isTarget":true,"d":"M 212.5 403 L 225 403 L 225 429 L 212.5 429 L 212.5 442 L 200 442 L 200 455 L 187.5 455 L 187.5 429 L 200 429 L 200 416 L 212.5 416 Z","labelPos":[212.5,422.5],"fontSize":8,"targetColor":"#2563eb"},
    {"id":"piece_216","code":"5B","isTarget":true,"d":"M 287.5 403 L 287.5 429 L 262.5 429 L 262.5 403 Z","labelPos":[275,416],"fontSize":8,"targetColor":"#2563eb"},
    {"id":"piece_217","code":"5C","isTarget":false,"d":"M 350 403 L 375 403 L 375 416 L 387.5 416 L 387.5 442 L 350 442 Z","labelPos":[368.8,429],"fontSize":8.5},
    {"id":"piece_218","code":"6A","isTarget":false,"d":"M 525 403 L 575 403 L 575 416 L 587.5 416 L 587.5 429 L 525 429 Z","labelPos":[550,416],"fontSize":8.5},
    {"id":"piece_219","code":"6C","isTarget":true,"d":"M 575 403 L 625 403 L 625 416 L 575 416 Z","labelPos":[600,409.5],"fontSize":8,"targetColor":"#2563eb"},
    {"id":"piece_220","code":"9B","isTarget":false,"d":"M 687.5 416 L 700 416 L 700 429 L 675 429 L 675 442 L 625 442 L 625 416 L 662.5 416 L 662.5 403 L 687.5 403 Z","labelPos":[650,429],"fontSize":8.5},
    {"id":"piece_221","code":"9D","isTarget":false,"d":"M 737.5 403 L 800 403 L 800 429 L 750 429 L 750 416 L 737.5 416 Z","labelPos":[775,416],"fontSize":8.5},
    {"id":"piece_222","code":"9A","isTarget":true,"d":"M 50 416 L 100 416 L 100 429 L 125 429 L 125 442 L 87.5 442 L 87.5 429 L 50 429 Z","labelPos":[75,422.5],"fontSize":8,"targetColor":"#10b981"},
    {"id":"piece_223","code":"5C","isTarget":false,"d":"M 287.5 416 L 300 416 L 300 429 L 312.5 429 L 312.5 416 L 325 416 L 325 468 L 287.5 468 Z","labelPos":[306.3,442],"fontSize":8.5},
    {"id":"piece_224","code":"5B","isTarget":true,"d":"M 337.5 416 L 350 416 L 350 455 L 325 455 L 325 429 L 337.5 429 Z","labelPos":[337.5,442],"fontSize":8,"targetColor":"#2563eb"},
    {"id":"piece_225","code":"6C","isTarget":true,"d":"M 387.5 416 L 450 416 L 450 442 L 387.5 442 Z","labelPos":[418.8,429],"fontSize":8.5,"targetColor":"#2563eb"},
    {"id":"piece_226","code":"6B","isTarget":false,"d":"M 487.5 416 L 500 416 L 500 442 L 487.5 442 L 487.5 455 L 437.5 455 L 437.5 442 L 450 442 L 450 429 L 487.5 429 Z","labelPos":[468.8,442],"fontSize":8.5},
    {"id":"piece_227","code":"6D","isTarget":false,"d":"M 587.5 416 L 600 416 L 600 442 L 525 442 L 525 429 L 587.5 429 Z","labelPos":[568.8,435.5],"fontSize":8},
    {"id":"piece_228","code":"6C","isTarget":true,"d":"M 600 416 L 625 416 L 625 455 L 600 455 Z","labelPos":[612.5,435.5],"fontSize":8,"targetColor":"#2563eb"},
    {"id":"piece_229","code":"9A","isTarget":true,"d":"M 750 416 L 750 429 L 737.5 429 L 737.5 442 L 712.5 442 L 712.5 429 L 725 429 L 725 416 Z","labelPos":[737.5,422.5],"fontSize":8,"targetColor":"#10b981"},
    {"id":"piece_230","code":"9B","isTarget":false,"d":"M 50 429 L 62.5 429 L 62.5 442 L 75 442 L 75 455 L 87.5 455 L 87.5 468 L 0 468 L 0 442 L 50 442 Z","labelPos":[43.8,455],"fontSize":8.5},
    {"id":"piece_231","code":"9A","isTarget":true,"d":"M 62.5 429 L 87.5 429 L 87.5 442 L 125 442 L 125 455 L 112.5 455 L 112.5 468 L 87.5 468 L 87.5 455 L 75 455 L 75 442 L 62.5 442 Z","labelPos":[100,448.5],"fontSize":8,"targetColor":"#10b981"},
    {"id":"piece_232","code":"5C","isTarget":false,"d":"M 187.5 429 L 187.5 442 L 175 442 L 175 455 L 150 455 L 150 481 L 125 481 L 125 429 Z","labelPos":[150,442],"fontSize":8.5},
    {"id":"piece_233","code":"5D","isTarget":false,"d":"M 262.5 468 L 275 468 L 275 481 L 237.5 481 L 237.5 468 L 187.5 468 L 187.5 455 L 200 455 L 200 442 L 212.5 442 L 212.5 429 L 225 429 L 225 442 L 262.5 442 Z","labelPos":[231.3,455],"fontSize":8.5},
    {"id":"piece_234","code":"5B","isTarget":true,"d":"M 275 455 L 275 468 L 262.5 468 L 262.5 429 L 287.5 429 L 287.5 455 Z","labelPos":[275,442],"fontSize":8,"targetColor":"#2563eb"},
    {"id":"piece_235","code":"6C","isTarget":true,"d":"M 512.5 429 L 525 429 L 525 468 L 550 468 L 550 481 L 475 481 L 475 468 L 500 468 L 500 442 L 512.5 442 Z","labelPos":[512.5,474.5],"fontSize":8,"targetColor":"#2563eb"},
    {"id":"piece_236","code":"9A","isTarget":true,"d":"M 712.5 442 L 725 442 L 725 455 L 712.5 455 L 712.5 468 L 700 468 L 700 481 L 687.5 481 L 687.5 468 L 675 468 L 675 429 L 712.5 429 Z","labelPos":[693.8,448.5],"fontSize":8.5,"targetColor":"#10b981"},
    {"id":"piece_237","code":"9C","isTarget":false,"d":"M 737.5 429 L 800 429 L 800 455 L 750 455 L 750 468 L 725 468 L 725 442 L 737.5 442 Z","labelPos":[762.5,442],"fontSize":8.5},
    {"id":"piece_238","code":"5B","isTarget":true,"d":"M 175 442 L 187.5 442 L 187.5 481 L 150 481 L 150 455 L 175 455 Z","labelPos":[168.8,468],"fontSize":8.5,"targetColor":"#2563eb"},
    {"id":"piece_239","code":"6D","isTarget":false,"d":"M 425 455 L 425 468 L 412.5 468 L 412.5 455 L 350 455 L 350 442 L 437.5 442 L 437.5 455 Z","labelPos":[393.8,448.5],"fontSize":8},
    {"id":"piece_240","code":"9B","isTarget":false,"d":"M 487.5 442 L 500 442 L 500 468 L 475 468 L 475 481 L 425 481 L 425 455 L 487.5 455 Z","labelPos":[450,468],"fontSize":8.5},
    {"id":"piece_241","code":"6B","isTarget":false,"d":"M 525 442 L 600 442 L 600 468 L 575 468 L 575 481 L 550 481 L 550 468 L 525 468 Z","labelPos":[562.5,455],"fontSize":8.5},
    {"id":"piece_242","code":"6D","isTarget":false,"d":"M 625 442 L 675 442 L 675 481 L 650 481 L 650 468 L 625 468 Z","labelPos":[650,455],"fontSize":8.5},
    {"id":"piece_243","code":"9A","isTarget":true,"d":"M 112.5 455 L 125 455 L 125 481 L 137.5 481 L 137.5 494 L 100 494 L 100 468 L 112.5 468 Z","labelPos":[118.8,487.5],"fontSize":8,"targetColor":"#10b981"},
    {"id":"piece_244","code":"5B","isTarget":true,"d":"M 350 455 L 350 468 L 337.5 468 L 337.5 481 L 275 481 L 275 455 L 287.5 455 L 287.5 468 L 325 468 L 325 455 Z","labelPos":[312.5,474.5],"fontSize":8,"targetColor":"#2563eb"},
    {"id":"piece_245","code":"9D","isTarget":false,"d":"M 337.5 468 L 350 468 L 350 455 L 412.5 455 L 412.5 468 L 425 468 L 425 481 L 337.5 481 Z","labelPos":[381.3,468],"fontSize":8.5},
    {"id":"piece_246","code":"6C","isTarget":true,"d":"M 575 468 L 600 468 L 600 455 L 625 455 L 625 468 L 650 468 L 650 481 L 575 481 Z","labelPos":[612.5,474.5],"fontSize":8,"targetColor":"#2563eb"},
    {"id":"piece_247","code":"9D","isTarget":false,"d":"M 712.5 455 L 725 455 L 725 468 L 787.5 468 L 787.5 481 L 737.5 481 L 737.5 494 L 725 494 L 725 481 L 712.5 481 L 712.5 520 L 700 520 L 700 468 L 712.5 468 Z","labelPos":[731.3,474.5],"fontSize":8},
    {"id":"piece_248","code":"9B","isTarget":false,"d":"M 750 455 L 800 455 L 800 507 L 750 507 L 750 494 L 737.5 494 L 737.5 481 L 787.5 481 L 787.5 468 L 750 468 Z","labelPos":[775,494],"fontSize":8.5},
    {"id":"piece_249","code":"9D","isTarget":false,"d":"M 0 468 L 87.5 468 L 87.5 494 L 0 494 Z","labelPos":[43.8,481],"fontSize":8.5},
    {"id":"piece_250","code":"9B","isTarget":false,"d":"M 87.5 468 L 100 468 L 100 494 L 112.5 494 L 112.5 507 L 25 507 L 25 494 L 87.5 494 Z","labelPos":[75,500.5],"fontSize":8},
    {"id":"piece_251","code":"5B","isTarget":true,"d":"M 187.5 468 L 237.5 468 L 237.5 481 L 187.5 481 Z","labelPos":[212.5,474.5],"fontSize":8,"targetColor":"#2563eb"},
    {"id":"piece_252","code":"9A","isTarget":true,"d":"M 675 468 L 687.5 468 L 687.5 481 L 700 481 L 700 494 L 650 494 L 650 481 L 675 481 Z","labelPos":[675,487.5],"fontSize":8,"targetColor":"#10b981"},
    {"id":"piece_253","code":"9A","isTarget":true,"d":"M 137.5 481 L 200 481 L 200 494 L 137.5 494 Z","labelPos":[168.8,487.5],"fontSize":8,"targetColor":"#10b981"},
    {"id":"piece_254","code":"9A","isTarget":true,"d":"M 200 481 L 287.5 481 L 287.5 507 L 250 507 L 250 494 L 200 494 Z","labelPos":[268.8,494],"fontSize":8.5,"targetColor":"#10b981"},
    {"id":"piece_255","code":"9A","isTarget":true,"d":"M 287.5 481 L 350 481 L 350 494 L 287.5 494 Z","labelPos":[318.8,487.5],"fontSize":8,"targetColor":"#10b981"},
    {"id":"piece_256","code":"9A","isTarget":true,"d":"M 350 481 L 437.5 481 L 437.5 494 L 400 494 L 400 507 L 375 507 L 375 494 L 350 494 Z","labelPos":[393.8,487.5],"fontSize":8,"targetColor":"#10b981"},
    {"id":"piece_257","code":"9A","isTarget":true,"d":"M 400 494 L 437.5 494 L 437.5 481 L 487.5 481 L 487.5 507 L 400 507 Z","labelPos":[462.5,494],"fontSize":8.5,"targetColor":"#10b981"},
    {"id":"piece_258","code":"9A","isTarget":true,"d":"M 487.5 481 L 562.5 481 L 562.5 494 L 487.5 494 Z","labelPos":[525,487.5],"fontSize":8,"targetColor":"#10b981"},
    {"id":"piece_259","code":"9A","isTarget":true,"d":"M 562.5 481 L 650 481 L 650 494 L 562.5 494 Z","labelPos":[606.3,487.5],"fontSize":8,"targetColor":"#10b981"},
    {"id":"piece_260","code":"9C","isTarget":false,"d":"M 800 507 L 800 520 L 712.5 520 L 712.5 481 L 725 481 L 725 494 L 750 494 L 750 507 Z","labelPos":[731.3,507],"fontSize":8.5},
    {"id":"piece_261","code":"9C","isTarget":false,"d":"M 0 494 L 25 494 L 25 507 L 87.5 507 L 87.5 520 L 0 520 Z","labelPos":[37.5,513.5],"fontSize":8},
    {"id":"piece_262","code":"9D","isTarget":false,"d":"M 87.5 507 L 112.5 507 L 112.5 494 L 150 494 L 150 507 L 175 507 L 175 520 L 87.5 520 Z","labelPos":[131.3,507],"fontSize":8.5},
    {"id":"piece_263","code":"9A","isTarget":true,"d":"M 150 494 L 250 494 L 250 507 L 150 507 Z","labelPos":[200,500.5],"fontSize":8,"targetColor":"#10b981"},
    {"id":"piece_264","code":"9A","isTarget":true,"d":"M 287.5 494 L 375 494 L 375 507 L 287.5 507 Z","labelPos":[331.3,500.5],"fontSize":8,"targetColor":"#10b981"},
    {"id":"piece_265","code":"9A","isTarget":true,"d":"M 487.5 494 L 575 494 L 575 507 L 487.5 507 Z","labelPos":[531.3,500.5],"fontSize":8,"targetColor":"#10b981"},
    {"id":"piece_266","code":"9A","isTarget":true,"d":"M 575 494 L 650 494 L 650 507 L 575 507 Z","labelPos":[612.5,500.5],"fontSize":8,"targetColor":"#10b981"},
    {"id":"piece_267","code":"9C","isTarget":false,"d":"M 612.5 507 L 650 507 L 650 494 L 700 494 L 700 520 L 612.5 520 Z","labelPos":[675,507],"fontSize":8.5},
    {"id":"piece_268","code":"9B","isTarget":false,"d":"M 175 507 L 262.5 507 L 262.5 520 L 175 520 Z","labelPos":[218.8,513.5],"fontSize":8},
    {"id":"piece_269","code":"9D","isTarget":false,"d":"M 262.5 507 L 350 507 L 350 520 L 262.5 520 Z","labelPos":[306.3,513.5],"fontSize":8},
    {"id":"piece_270","code":"9B","isTarget":false,"d":"M 350 507 L 437.5 507 L 437.5 520 L 350 520 Z","labelPos":[393.8,513.5],"fontSize":8},
    {"id":"piece_271","code":"9D","isTarget":false,"d":"M 437.5 507 L 525 507 L 525 520 L 437.5 520 Z","labelPos":[481.3,513.5],"fontSize":8},
    {"id":"piece_272","code":"9B","isTarget":false,"d":"M 525 507 L 612.5 507 L 612.5 520 L 525 520 Z","labelPos":[568.8,513.5],"fontSize":8}
  ];

  // Khôi phục lựa chọn dấu phân cách (slash = 20/11 | dash = 20-11)
  let dateSeparatorStyle = 'slash';
  try {
    const savedSep = localStorage.getItem(STORAGE_KEY_DATE_SEP);
    if (savedSep === 'dash' || savedSep === 'slash') {
      dateSeparatorStyle = savedSep;
    }
  } catch {
    dateSeparatorStyle = 'slash';
  }

  function getCellsForSeparator(sep) {
    return sep === 'dash' ? PUZZLE_CELLS_DASH : PUZZLE_CELLS_SLASH;
  }

  function buildColorRulesForSeparator(sep) {
    const cloned = {};
    Object.keys(COLOR_RULES).forEach(k => {
      cloned[k] = Object.assign({}, COLOR_RULES[k]);
    });
    cloned['6C'].part = sep === 'dash' ? 'Số -11' : 'Số /11';
    return cloned;
  }

  // Áp dụng tùy chỉnh tên màu bút dạ đã lưu cho bộ tranh mặc định 20/11
  function applyDefaultOverridesFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_COLOR_OVERRIDES);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return;
      Object.keys(parsed).forEach(code => {
        if (!COLOR_RULES[code]) return;
        if (parsed[code].name) COLOR_RULES[code].name = parsed[code].name;
        if (parsed[code].color) {
          COLOR_RULES[code].color = parsed[code].color;
          PUZZLE_CELLS_SLASH.forEach(c => { if (c.isTarget && c.code === code) c.targetColor = parsed[code].color; });
          PUZZLE_CELLS_DASH.forEach(c => { if (c.isTarget && c.code === code) c.targetColor = parsed[code].color; });
        }
      });
    } catch {
      // Bỏ qua lỗi đọc LocalStorage
    }
  }
  applyDefaultOverridesFromStorage();

  const PUZZLE_CELLS = getCellsForSeparator(dateSeparatorStyle);
  const TARGET_CELL_IDS = PUZZLE_CELLS.filter(c => c.isTarget).map(c => c.id);

  // BIẾN QUẢN LÝ BỨC TRANH ĐANG KÍCH HOẠT (DYNAMIC ACTIVE PUZZLE)
  let isCustomPuzzleActive = false;
  let activeCells = [...PUZZLE_CELLS];
  let activeColorRules = buildColorRulesForSeparator(dateSeparatorStyle);
  let activeTargetIds = [...TARGET_CELL_IDS];
  let activeTitle = dateSeparatorStyle === 'dash' ? 'TRI ÂN THẦY CÔ 20-11' : 'TRI ÂN THẦY CÔ 20/11';

  // Cập nhật COLOR_RULES['6C'] đồng bộ
  COLOR_RULES['6C'].part = dateSeparatorStyle === 'dash' ? 'Số -11' : 'Số /11';

  function updateActiveColorRule(codeKey, newName, newColor) {
    if (!codeKey || !activeColorRules[codeKey]) return;
    if (newName) activeColorRules[codeKey].name = newName;
    if (newColor) {
      activeColorRules[codeKey].color = newColor;
      activeCells.forEach(c => {
        if (c.isTarget && c.code === codeKey) {
          c.targetColor = newColor;
        }
      });
    }

    if (!isCustomPuzzleActive && COLOR_RULES[codeKey]) {
      if (newName) COLOR_RULES[codeKey].name = newName;
      if (newColor) {
        COLOR_RULES[codeKey].color = newColor;
        PUZZLE_CELLS_SLASH.forEach(c => { if (c.isTarget && c.code === codeKey) c.targetColor = newColor; });
        PUZZLE_CELLS_DASH.forEach(c => { if (c.isTarget && c.code === codeKey) c.targetColor = newColor; });
      }
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY_COLOR_OVERRIDES) || '{}');
        saved[codeKey] = {
          name: COLOR_RULES[codeKey].name,
          color: COLOR_RULES[codeKey].color
        };
        localStorage.setItem(STORAGE_KEY_COLOR_OVERRIDES, JSON.stringify(saved));
      } catch {
        // Bỏ qua lỗi ghi LocalStorage
      }
    }

    if (window.GiaiMaBiMat && typeof window.GiaiMaBiMat.renderDecryptUI === 'function') {
      window.GiaiMaBiMat.renderDecryptUI();
    }
    if (window.GiaiMaBiMat && typeof window.GiaiMaBiMat.updateExportPreview === 'function') {
      window.GiaiMaBiMat.updateExportPreview();
    }
    if (window.GiaiMaTeacherKey && typeof window.GiaiMaTeacherKey.renderTeacherAnswerKeyTab === 'function') {
      window.GiaiMaTeacherKey.renderTeacherAnswerKeyTab();
    }
  }

  function resetDefaultColorOverrides() {
    try {
      localStorage.removeItem(STORAGE_KEY_COLOR_OVERRIDES);
    } catch {
      // Bỏ qua lỗi LocalStorage
    }
    Object.keys(BASE_COLOR_RULES).forEach(code => {
      COLOR_RULES[code] = Object.assign({}, BASE_COLOR_RULES[code]);
      const baseHex = BASE_COLOR_RULES[code].color;
      PUZZLE_CELLS_SLASH.forEach(c => { if (c.isTarget && c.code === code) c.targetColor = baseHex; });
      PUZZLE_CELLS_DASH.forEach(c => { if (c.isTarget && c.code === code) c.targetColor = baseHex; });
    });
    COLOR_RULES['6C'].part = dateSeparatorStyle === 'dash' ? 'Số -11' : 'Số /11';
    if (!isCustomPuzzleActive) {
      activeColorRules = buildColorRulesForSeparator(dateSeparatorStyle);
    }
    if (window.GiaiMaBiMat && typeof window.GiaiMaBiMat.renderDecryptUI === 'function') {
      window.GiaiMaBiMat.renderDecryptUI();
    }
    if (window.GiaiMaTeacherKey && typeof window.GiaiMaTeacherKey.renderTeacherAnswerKeyTab === 'function') {
      window.GiaiMaTeacherKey.renderTeacherAnswerKeyTab();
    }
  }

  function syncDateSeparatorButtonsUI() {
    const isDash = (dateSeparatorStyle === 'dash');
    const labelShort = isDash ? '📅 Kiểu ngày: 20-11' : '📅 Kiểu ngày: 20/11';
    const btnTk = document.getElementById('gmmTkBtnDateSep');
    if (btnTk) {
      btnTk.classList.toggle('active', isDash);
      btnTk.innerHTML = '<span>' + labelShort + '</span>';
      btnTk.style.display = isCustomPuzzleActive ? 'none' : 'inline-flex';
    }
    const btnTab4 = document.getElementById('gmmBtnDateSepTab4');
    if (btnTab4) {
      btnTab4.innerHTML = '<span>' + (isDash ? '📅 Ngày lễ: 20-11 (Đổi sang 20/11)' : '📅 Ngày lễ: 20/11 (Đổi sang 20-11)') + '</span>';
      btnTab4.style.display = isCustomPuzzleActive ? 'none' : '';
    }
  }

  function isDefaultTriAnPuzzle() {
    return !isCustomPuzzleActive;
  }

  function getDateSeparatorStyle() {
    return dateSeparatorStyle;
  }

  function remapTeamColorsBetweenCells(prevCells, nextCells) {
    if (!window.GiaiMaBiMat || typeof window.GiaiMaBiMat.getArenaLiveSnapshot !== 'function') return;
    const snap = window.GiaiMaBiMat.getArenaLiveSnapshot();
    if (!snap) return;

    const prevById = {};
    (prevCells || []).forEach(c => { prevById[c.id] = c; });

    ['teamA', 'teamB'].forEach(tKey => {
      const team = snap[tKey];
      if (!team || !team.coloredRegions || Object.keys(team.coloredRegions).length === 0) return;

      const oldMap = team.coloredRegions;
      const colorByPath = {};
      const targetCodeColor = {};
      const targetCodeHits = {};
      const targetCodeTotal = {};

      (prevCells || []).forEach(c => {
        if (c.isTarget) {
          targetCodeTotal[c.code] = (targetCodeTotal[c.code] || 0) + 1;
        }
      });

      Object.keys(oldMap).forEach(cellId => {
        const col = oldMap[cellId];
        const prevCell = prevById[cellId];
        if (!col || !prevCell) return;
        colorByPath[prevCell.d] = col;
        if (prevCell.isTarget) {
          targetCodeColor[prevCell.code] = col;
          targetCodeHits[prevCell.code] = (targetCodeHits[prevCell.code] || 0) + 1;
        }
      });

      const nextMap = {};
      (nextCells || []).forEach(nc => {
        if (colorByPath[nc.d]) {
          nextMap[nc.id] = colorByPath[nc.d];
        } else if (
          nc.isTarget &&
          targetCodeColor[nc.code] &&
          targetCodeHits[nc.code] >= Math.max(1, Math.floor((targetCodeTotal[nc.code] || 1) * 0.5))
        ) {
          nextMap[nc.id] = targetCodeColor[nc.code];
        }
      });

      team.coloredRegions = nextMap;
    });
  }

  function setDateSeparatorStyle(style) {
    const nextStyle = (style === 'dash') ? 'dash' : 'slash';
    const prevCells = activeCells;
    dateSeparatorStyle = nextStyle;
    try {
      localStorage.setItem(STORAGE_KEY_DATE_SEP, nextStyle);
    } catch {
      // Bỏ qua nếu trình duyệt chặn LocalStorage
    }

    COLOR_RULES['6C'].part = nextStyle === 'dash' ? 'Số -11' : 'Số /11';

    if (!isCustomPuzzleActive) {
      const nextCells = getCellsForSeparator(nextStyle);
      remapTeamColorsBetweenCells(prevCells, nextCells);
      activeCells = [...nextCells];
      activeColorRules = buildColorRulesForSeparator(nextStyle);
      activeTargetIds = activeCells.filter(c => c.isTarget).map(c => c.id);
      activeTitle = nextStyle === 'dash' ? 'TRI ÂN THẦY CÔ 20-11' : 'TRI ÂN THẦY CÔ 20/11';
    }

    syncDateSeparatorButtonsUI();

    if (window.GiaiMaBiMat && typeof window.GiaiMaBiMat.renderDecryptUI === 'function') {
      window.GiaiMaBiMat.renderDecryptUI();
    }
    if (window.GiaiMaTeacherKey && typeof window.GiaiMaTeacherKey.renderTeacherAnswerKeyTab === 'function') {
      window.GiaiMaTeacherKey.renderTeacherAnswerKeyTab();
    }
  }

  function toggleDateSeparatorStyle() {
    const nextStyle = (dateSeparatorStyle === 'slash') ? 'dash' : 'slash';
    isCustomPuzzleActive = false;
    setDateSeparatorStyle(nextStyle);
    if (typeof window.showToast === 'function') {
      const msg = nextStyle === 'dash'
        ? '📅 Đã chuyển sang kiểu gạch ngang truyền thống: “TRI ÂN THẦY CÔ 20-11”!'
        : '📅 Đã chuyển sang kiểu gạch chéo hiện đại: “TRI ÂN THẦY CÔ 20/11”!';
      window.showToast(msg, 'info');
    }
    return nextStyle;
  }

  function setActivePuzzle(puzzleData) {
    if (!puzzleData || !puzzleData.cells) return;
    const rawTitle = String(puzzleData.title || '').trim().toUpperCase();
    const isTriAnPreset = (
      puzzleData.id === 'preset_trian_2011' ||
      rawTitle === 'TRI ÂN THẦY CÔ 20/11' ||
      rawTitle === 'TRI ÂN THẦY CÔ 20-11'
    ) && (puzzleData.cells === PUZZLE_CELLS_SLASH || puzzleData.cells === PUZZLE_CELLS_DASH || puzzleData.cells === PUZZLE_CELLS);

    isCustomPuzzleActive = !isTriAnPreset;

    if (isTriAnPreset) {
      const nextCells = getCellsForSeparator(dateSeparatorStyle);
      activeCells = [...nextCells];
      activeColorRules = buildColorRulesForSeparator(dateSeparatorStyle);
      activeTargetIds = activeCells.filter(c => c.isTarget).map(c => c.id);
      activeTitle = dateSeparatorStyle === 'dash' ? 'TRI ÂN THẦY CÔ 20-11' : 'TRI ÂN THẦY CÔ 20/11';
    } else {
      activeCells = puzzleData.cells;
      activeColorRules = puzzleData.colorRules || activeColorRules;
      activeTargetIds = activeCells.filter(c => c.isTarget).map(c => c.id);
      activeTitle = puzzleData.title || activeTitle;
    }

    syncDateSeparatorButtonsUI();

    if (window.GiaiMaBiMat && typeof window.GiaiMaBiMat.renderDecryptUI === 'function') {
      window.GiaiMaBiMat.renderDecryptUI();
    }
    if (window.GiaiMaTeacherKey && typeof window.GiaiMaTeacherKey.renderTeacherAnswerKeyTab === 'function') {
      window.GiaiMaTeacherKey.renderTeacherAnswerKeyTab();
    }
  }

  function getActivePuzzle() {
    return {
      title: activeTitle,
      cells: activeCells,
      colorRules: activeColorRules,
      targetCellIds: activeTargetIds,
      isDefaultTriAn: !isCustomPuzzleActive,
      dateSeparatorStyle: dateSeparatorStyle
    };
  }

  // 3. HÀM TẠO SVG MA TRẬN BỨC TRANH BÍ MẬT
  function renderSvgMatrix(teamKey, teamData, options = {}) {
    const isPrintMode = Boolean(options.isPrint);
    const isSolvedAnswerKey = Boolean(options.isSolvedAnswerKey);
    const isSeamlessStrokes = Boolean(options.seamlessStrokes);
    const coloredRegions = (teamData && teamData.coloredRegions) ? teamData.coloredRegions : {};
    const unlockedRegions = (teamData && teamData.unlockedRegions) ? teamData.unlockedRegions : [];
    const newlyUnlocked = (options.newlyUnlocked)
      ? options.newlyUnlocked
      : ((teamData && teamData.newlyUnlocked) ? teamData.newlyUnlocked : []);
    const isDecryptPhase = Boolean(options.isDecryptPhase);
    const isStealthMode = Boolean(options.isStealthMode);
    const puzzle = options.puzzle || getActivePuzzle();
    const cellsToRender = (puzzle && puzzle.cells) ? puzzle.cells : activeCells;

    // Chế độ Nền Giấy A1 Tương Phản Cao Chuyên Dụng Cho Chiếu Tivi & Máy Chiếu Lớp Học
    const isPaperTheme = isPrintMode || Boolean(options.isPaperTheme || (options.canvasTheme === 'paper'));

    const bgFill = isPaperTheme ? '#ffffff' : '#0f172a';
    const borderStroke = isPaperTheme ? '#334155' : 'rgba(255, 255, 255, 0.45)';
    const cellDefaultFill = isPaperTheme ? '#ffffff' : '#1e293b';

    let svg = `
      <svg viewBox="0 0 800 520" xmlns="http://www.w3.org/2000/svg"
           class="gmm-tri-an-matrix-svg ${isPrintMode ? 'print-mode' : ''} ${isPaperTheme ? 'paper-theme' : 'dark-theme'} ${isStealthMode ? 'stealth-mode' : ''} ${isSeamlessStrokes ? 'seamless-mode' : ''}"
           style="width: 100%; height: 100%; display: block; border-radius: 8px; background: ${bgFill} !important; user-select: none;">
        <defs>
          <filter id="glow_${teamKey}" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="seamless_outline_${teamKey}" x="-6%" y="-6%" width="112%" height="112%">
            <feMorphology in="SourceAlpha" operator="dilate" radius="1.35" result="dilated" />
            <feFlood flood-color="#0f172a" flood-opacity="0.92" result="outlineColor" />
            <feComposite in="outlineColor" in2="dilated" operator="in" result="outline" />
            <feMerge>
              <feMergeNode in="outline" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <rect width="800" height="520" fill="${bgFill}" rx="6"/>
    `;

    function buildSingleCellSvg(cell) {
      const isColored = isSolvedAnswerKey ? Boolean(cell.isTarget) : Boolean(coloredRegions[cell.id]);
      const isUnlocked = isSolvedAnswerKey || isDecryptPhase || unlockedRegions.includes(cell.id) || unlockedRegions.includes(`code_${cell.code}`);
      const isPulseGlow = !isPrintMode && (
        newlyUnlocked.includes(cell.id) ||
        newlyUnlocked.includes(`code_${cell.code}`) ||
        newlyUnlocked.includes(cell.code)
      );

      let fillColor = cellDefaultFill;
      let strokeColor = borderStroke;
      let strokeWidth = isPaperTheme ? '1.8' : '1.5';
      let textColor = isPaperTheme ? '#0f172a' : '#f1f5f9';
      let textWeight = isPaperTheme ? '800' : '700';

      if (isSolvedAnswerKey) {
        if (cell.isTarget) {
          fillColor = cell.targetColor || '#ef4444';
          textColor = '#ffffff';
          textWeight = '900';
          if (isSeamlessStrokes) {
            strokeColor = fillColor;
            strokeWidth = '1.35';
          } else {
            strokeColor = isPaperTheme ? '#0f172a' : '#000000';
            strokeWidth = '2';
          }
        } else {
          fillColor = isPaperTheme ? '#f8fafc' : '#1e293b';
          textColor = isSeamlessStrokes ? (isPaperTheme ? '#94a3b8' : '#475569') : (isPaperTheme ? '#64748b' : '#cbd5e1');
          textWeight = '600';
          strokeColor = isSeamlessStrokes
            ? (isPaperTheme ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)')
            : (isPaperTheme ? '#cbd5e1' : 'rgba(255, 255, 255, 0.25)');
          strokeWidth = isSeamlessStrokes ? '0.9' : '1.2';
        }
      } else if (isColored) {
        fillColor = coloredRegions[cell.id] || cell.targetColor || '#ef4444';
        textColor = '#ffffff';
        textWeight = '900';
        if (isSeamlessStrokes) {
          strokeColor = fillColor;
          strokeWidth = '1.35';
        } else {
          strokeColor = isPaperTheme ? '#0f172a' : 'rgba(255, 255, 255, 0.7)';
          strokeWidth = '2';
        }
      } else if (isUnlocked && !isPrintMode) {
        if (isPaperTheme) {
          fillColor = '#fef08a';
          textColor = '#78350f';
          strokeColor = '#ea580c';
          strokeWidth = '2.6';
          textWeight = '900';
        } else {
          fillColor = '#334155';
          textColor = '#fde047';
          strokeColor = '#eab308';
          strokeWidth = '2';
        }
      }

      let cursorStyle = 'default';
      let onclickAttr = '';
      if (!isPrintMode && !isSolvedAnswerKey) {
        if (isDecryptPhase || isUnlocked) {
          cursorStyle = 'pointer';
          onclickAttr = `onclick="if(window.GiaiMaBiMat&amp;&amp;typeof window.GiaiMaBiMat.handleCellClick==='function')window.GiaiMaBiMat.handleCellClick('${teamKey}','${cell.id}')"`;
        }
      }

      const pathStyle = `fill: ${fillColor} !important; stroke: ${strokeColor} !important; stroke-width: ${strokeWidth}px !important; cursor: ${cursorStyle}; transition: fill 0.25s ease, stroke 0.25s ease;`;

      // Tối ưu kích thước chữ mã tọa độ: đậm nét, rõ ràng, học sinh ngồi xa trên Tivi vẫn thấy rõ mồn một
      let baseFontSize = cell.fontSize || 9;
      if (isPaperTheme) {
        // Tăng cỡ chữ lên 1.35x (tối thiểu 10.5px, tối đa 12px) để mã ô nổi bật trên nền giấy A1
        baseFontSize = Math.max(Math.round(baseFontSize * 1.35 * 10) / 10, 10.5);
        if (cell.code && cell.code.length >= 3) {
          baseFontSize = Math.min(baseFontSize, 10.2);
        }
      } else {
        baseFontSize = Math.max(Math.round(baseFontSize * 1.2 * 10) / 10, 9.5);
      }

      const textShadowStyle = isColored
        ? 'text-shadow: 0 1px 3px rgba(0,0,0,0.9), 0 0 3px rgba(0,0,0,0.8);'
        : (isPaperTheme ? 'text-shadow: none;' : 'text-shadow: 0 1px 2px rgba(0,0,0,0.7);');

      const textStyle = `fill: ${textColor} !important; font-weight: ${textWeight} !important; font-size: ${baseFontSize}px !important; font-family: system-ui, -apple-system, BlinkMacSystemFont, Arial, sans-serif !important; ${textShadowStyle}`;

      // Bổ sung mã ô lên tranh: luôn hiện mã chữ số trên tranh để học sinh định vị tọa độ tô màu
      const isShowLabel = isPrintMode || isPaperTheme || isSolvedAnswerKey || !isStealthMode || isUnlocked || isColored;

      return {
        isTargetColored: Boolean(isSolvedAnswerKey ? cell.isTarget : isColored),
        pathOnly: `
          <path id="${teamKey}_${cell.id}"
                class="gmm-svg-region ${isColored ? 'colored' : ''} ${isUnlocked ? 'unlocked' : ''} ${isPulseGlow ? 'pulse-newly-unlocked' : ''} ${isPrintMode ? 'print-region' : ''}"
                d="${cell.d}"
                fill="${fillColor}"
                stroke="${strokeColor}"
                stroke-width="${strokeWidth}"
                stroke-linejoin="round"
                stroke-linecap="round"
                style="${pathStyle}"
                ${onclickAttr}
                data-cell-id="${cell.id}"
                data-code="${cell.code}">
            <title>Mã: ${cell.code}</title>
          </path>`,
        textOnly: isShowLabel ? `
          <text x="${cell.labelPos[0]}" y="${cell.labelPos[1]}"
                fill="${textColor}"
                font-family="system-ui, -apple-system, Arial, sans-serif"
                font-size="${baseFontSize}"
                font-weight="${textWeight}"
                text-anchor="middle"
                dominant-baseline="central"
                pointer-events="none"
                style="${textStyle}">
            ${cell.code}
          </text>` : '',
        groupClass: `gmm-puzzle-cell-group ${isColored ? 'colored' : ''} ${isUnlocked ? 'unlocked' : ''} ${isPulseGlow ? 'pulse-newly-unlocked' : ''} ${isPrintMode ? 'print-cell' : ''}`
      };
    }

    if (isSolvedAnswerKey) {
      // Vẽ lớp ô bẫy nền trước, lớp mảng màu mục tiêu lên trên để đường viền sắc nét tuyệt đối
      const bgItems = [];
      const fgItems = [];
      cellsToRender.forEach(cell => {
        const rendered = buildSingleCellSvg(cell);
        if (rendered.isTargetColored) {
          fgItems.push(rendered);
        } else {
          bgItems.push(rendered);
        }
      });

      svg += '<g class="gmm-layer-bg-cells">';
      bgItems.forEach(item => {
        svg += `<g class="${item.groupClass}">${item.pathOnly}${item.textOnly}</g>`;
      });
      svg += '</g>';

      if (isSeamlessStrokes) {
        // Khi bật Liền Khối Nghệ Thuật: gom toàn bộ path màu vào 1 nhóm có viền bao ngoài mượt mà
        svg += `<g class="gmm-layer-target-seamless" filter="url(#seamless_outline_${teamKey})">`;
        fgItems.forEach(item => { svg += item.pathOnly; });
        svg += '</g>';
        svg += '<g class="gmm-layer-target-labels">';
        fgItems.forEach(item => { svg += item.textOnly; });
        svg += '</g>';
      } else {
        svg += '<g class="gmm-layer-target-cells">';
        fgItems.forEach(item => {
          svg += `<g class="${item.groupClass}">${item.pathOnly}${item.textOnly}</g>`;
        });
        svg += '</g>';
      }
    } else {
      cellsToRender.forEach(cell => {
        const item = buildSingleCellSvg(cell);
        svg += `<g class="${item.groupClass}">${item.pathOnly}${item.textOnly}</g>`;
      });
    }

    svg += '</svg>';
    return svg;
  }

  // 4. HÀM TÔ MẪU THỬ / TỰ ĐỘNG GIẢI MÃ MA TRẬN
  function autoColorTargetCells(teamData) {
    if (!teamData) return;
    teamData.coloredRegions = {};

    activeCells.forEach(cell => {
      if (cell.isTarget && cell.targetColor) {
        teamData.coloredRegions[cell.id] = cell.targetColor;
      }
    });
  }

  // 5. TÍNH TOÁN TIẾN ĐỘ HOÀN THÀNH (%)
  function calculateProgress(teamData) {
    if (!teamData || !teamData.coloredRegions) return { percent: 0, colored: 0, total: activeTargetIds.length, isComplete: false };

    let coloredTargetCount = 0;
    activeTargetIds.forEach(id => {
      if (teamData.coloredRegions[id]) {
        coloredTargetCount++;
      }
    });

    const percent = Math.min(100, Math.round((coloredTargetCount / (activeTargetIds.length || 1)) * 100));
    const isComplete = coloredTargetCount >= activeTargetIds.length;

    return {
      percent,
      colored: coloredTargetCount,
      total: activeTargetIds.length,
      isComplete
    };
  }

  // 6. XUẤT CỬA SỔ IN PHIẾU TRANH MA TRẬN CHO HỌC SINH TÔ MÀU
  function printMatrixWorksheet(_questionsList) {
    if (window.GiaiMaBiMat && typeof window.GiaiMaBiMat.openExportWorksheetModal === 'function') {
      window.GiaiMaBiMat.openExportWorksheetModal();
      return;
    }
    const printSvg = renderSvgMatrix('print_sheet', {}, { isPrint: true });

    const printWindow = window.open('', '_blank', 'width=1150,height=850');
    if (!printWindow) {
      if (typeof window.showToast === 'function') {
        window.showToast('Vui lòng cho phép mở popup để in Phiếu Ma Trận Giấy!', 'warning');
      }
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <title>PHIẾU THI ĐẤU: GIẢI MÃ BỨC TRANH MA TRẬN</title>
        <style>
          @page { size: A4 landscape; margin: 8mm; }
          * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body { font-family: 'Times New Roman', Times, serif, system-ui; color: #000; margin: 0; padding: 10px; background: #fff; }
          .print-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 8px; }
          .print-title { text-align: center; flex: 1; }
          .print-title h1 { font-size: 18pt; margin: 0; text-transform: uppercase; letter-spacing: 0.5px; }
          .team-box { border: 1.5px dashed #000; padding: 6px 14px; font-size: 11pt; font-weight: bold; border-radius: 6px; }
          .legend-bar { display: flex; flex-wrap: wrap; gap: 14px; background: #f8fafc; padding: 8px 12px; border-radius: 6px; font-size: 10pt; margin-bottom: 8px; border: 1.5px solid #000; justify-content: center; align-items: center; }
          .legend-item { display: inline-flex; align-items: center; gap: 6px; font-weight: bold; }
          .color-dot { width: 14px; height: 14px; border-radius: 3px; display: inline-block; border: 1px solid #000; }
          .matrix-canvas-wrap { width: 100%; aspect-ratio: 800 / 520; max-height: 500px; margin: 0 auto; border: 2px solid #000; border-radius: 6px; overflow: hidden; background: #fff; }
          .print-footer { margin-top: 8px; display: flex; justify-content: space-between; font-size: 9.5pt; font-style: italic; border-top: 1px solid #000; padding-top: 6px; }
          @media print { .no-print { display: none !important; } body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="no-print" style="background: #e0f2fe; padding: 10px 16px; margin-bottom: 12px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: bold; color: #0369a1; font-family: sans-serif;">
            📄 Phiếu in sẵn sàng cho khổ giấy A4, A3, A2 hoặc A1. Học sinh trả lời câu hỏi và tô màu theo mã đáp án đúng tìm được.
          </span>
          <button onclick="window.print()" style="background: #0284c7; color: #fff; font-weight: bold; border: none; padding: 8px 18px; border-radius: 6px; cursor: pointer; font-size: 11pt;">
            🖨️ Bấm Vào Đây Để In Ngay (Ctrl+P)
          </button>
        </div>

        <div class="print-header">
          <div style="font-size: 11pt; font-weight: bold; line-height: 1.4;">
            TRƯỜNG THCS TÂN HẢI<br>
            HOẠT ĐỘNG DẠY HỌC TÍCH CỰC
          </div>
          <div class="print-title">
            <h1>GIẢI MÃ BỨC TRANH BÍ ẨN</h1>
          </div>
          <div class="team-box">
            ĐỘI THI: .........................<br>
            THỜI GIAN: .....................
          </div>
        </div>

        <div class="legend-bar">
          <span style="font-weight: 900; color: #000;">👉 BẢNG QUY ƯỚC MÃ MÀU TÔ TRANH:</span>
          <span class="legend-item"><span class="color-dot" style="background: #dc2626;"></span> Câu 1, Câu 2: Màu Đỏ son</span>
          <span class="legend-item"><span class="color-dot" style="background: #f59e0b;"></span> Câu 3, Câu 4: Màu Vàng cam</span>
          <span class="legend-item"><span class="color-dot" style="background: #2563eb;"></span> Câu 5, Câu 6: Màu Xanh dương</span>
          <span class="legend-item"><span class="color-dot" style="background: #ec4899;"></span> Câu 7, Câu 8: Màu Hồng sen</span>
          <span class="legend-item"><span class="color-dot" style="background: #10b981;"></span> Câu 9: Màu Xanh lục</span>
          <span class="legend-item"><span class="color-dot" style="background: #eab308;"></span> Câu 10: Màu Vàng kim</span>
        </div>

        <div class="matrix-canvas-wrap">
          ${printSvg}
        </div>

        <div class="print-footer">
          <span>* Hướng dẫn: Trả lời đúng câu hỏi -> Tìm tất cả các ô chứa mã tương ứng trên ma trận -> Dùng bút dạ tô màu theo Bảng quy ước. Các ô chứa đáp án sai không tô.</span>
          <span>Ban Giám Khảo chấm điểm độ chính xác và tính thẩm mỹ</span>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncDateSeparatorButtonsUI);
  } else {
    syncDateSeparatorButtonsUI();
  }

  // 7. EXPORT ĐỐI TƯỢNG TOÀN CỤC CHO ỨNG DỤNG SỬ DỤNG
  window.GiaiMaPuzzle = {
    COLOR_RULES,
    PUZZLE_CELLS,
    PUZZLE_CELLS_SLASH,
    PUZZLE_CELLS_DASH,
    TARGET_CELL_IDS,
    setActivePuzzle,
    getActivePuzzle,
    isDefaultTriAnPuzzle,
    getDateSeparatorStyle,
    setDateSeparatorStyle,
    toggleDateSeparatorStyle,
    updateActiveColorRule,
    resetDefaultColorOverrides,
    renderSvgMatrix,
    autoColorTargetCells,
    calculateProgress,
    printMatrixWorksheet
  };

})();
