/**
 * ==============================================================================
 * MODULE ĐIỀU PHỐI TRANG CHỦ & ROUTER ĐIỀU HƯỚNG (scripts/landing.js)
 * Tên concept: HAPPY CLASSROOM – PLAY, LEARN & SHINE
 * Quản lý: Kho trò chơi, bộ lọc thể loại, tìm kiếm, danh sách yêu thích,
 * chuyển đổi màn hình (Landing View <-> Game Arena View), modal hướng dẫn.
 * ==============================================================================
 */

(function () {
  'use strict';

  // --- 1. DỮ LIỆU DANH MỤC TRÒ CHƠI THỰC TẾ TRONG ỨNG DỤNG ---
  const GAMES_DATA = [
    {
      id: 'wheel',
      title: 'Vòng Quay May Mắn',
      desc: 'Bánh xe sắc màu xoay tít, hồi hộp từng tích tắc trước khi kim chỉ dừng lại ở ngôi sao may mắn của lớp.',
      icon: '🎡',
      category: 'picker',
      categoryLabel: 'Gọi tên & May mắn',
      tag: 'HOT',
      tagColor: '#ef4444',
      themeBg: '#eff6ff',
      themeBorder: '#bfdbfe',
      isComingSoon: false,
      action: () => window.LandingRouter.playGame('wheel')
    },
    {
      id: 'slot',
      title: 'Thẻ Lướt Hồi Hộp',
      desc: 'Hiệu ứng giật thẻ Slot tốc độ cao. Hỗ trợ gọi cá nhân (1), ghép cặp đối kháng (2) hoặc chọn nhóm 4, nhóm 6.',
      icon: '🎰',
      category: 'picker',
      categoryLabel: 'Gọi tên & May mắn',
      tag: 'Kịch tính',
      tagColor: '#8b5cf6',
      themeBg: '#f5f3ff',
      themeBorder: '#ddd6fe',
      isComingSoon: false,
      action: () => window.LandingRouter.playGame('slot')
    },
    {
      id: 'seating',
      title: 'Sơ Đồ Lớp Học (4 Tổ)',
      desc: 'Bốc thăm gọi tên trực quan trên mô phỏng chỗ ngồi thực tế. Tranh tài sôi nổi giữa 4 biệt đội linh vật đáng yêu.',
      icon: '🪑',
      category: 'interactive',
      categoryLabel: 'Chia nhóm & Tương tác',
      tag: '4 Tổ thi đua',
      tagColor: '#0d9488',
      themeBg: '#f0fdfa',
      themeBorder: '#99f6e4',
      isComingSoon: false,
      action: () => window.LandingRouter.playGame('seating')
    },
    {
      id: 'quiz',
      title: 'Đấu Trường Trắc Nghiệm',
      desc: 'Màn hình song song: hiển thị câu hỏi trắc nghiệm bên trái & bốc thăm học sinh giải đề bên phải. Có trợ giúp 50:50 và gọi bạn.',
      icon: '🏆',
      category: 'quiz',
      categoryLabel: 'Đố vui & Trắc nghiệm',
      tag: 'Kho đề thi',
      tagColor: '#ea580c',
      themeBg: '#fff7ed',
      themeBorder: '#fed7aa',
      isComingSoon: false,
      action: () => window.LandingRouter.playGame('quiz')
    },
    {
      id: 'bonus',
      title: 'Vòng Quay Điểm Thưởng',
      desc: 'Tặng điểm số may mắn (+1, +2, +10 điểm, tràng pháo tay...) giúp học sinh hào hứng sau khi trả lời bài đúng.',
      icon: '🎁',
      category: 'picker',
      categoryLabel: 'Gọi tên & May mắn',
      tag: 'Khích lệ',
      tagColor: '#ca8a04',
      themeBg: '#fefce8',
      themeBorder: '#fef08a',
      isComingSoon: false,
      action: () => {
        if (typeof window.openBonusWheelModal === 'function') {
          window.openBonusWheelModal();
        } else {
          window.LandingRouter.playGame('classic');
        }
      }
    },
    {
      id: 'groups',
      title: 'Chia Nhóm Cả Lớp',
      desc: 'Xáo trộn ngẫu nhiên và chia cả lớp thành các nhóm 2, 4, 6 người công bằng trong 1 giây để thảo luận nhóm.',
      icon: '🧩',
      category: 'interactive',
      categoryLabel: 'Chia nhóm & Tương tác',
      tag: 'Tự động',
      tagColor: '#db2777',
      themeBg: '#fdf2f8',
      themeBorder: '#fbcfe8',
      isComingSoon: false,
      action: () => {
        if (typeof window.openAllGroupsModal === 'function') {
          window.openAllGroupsModal();
        } else {
          window.LandingRouter.playGame('classic');
        }
      }
    },
    {
      id: 'golden_bell',
      title: 'Rung Chuông Vàng Sinh Tồn',
      desc: 'Đấu trường sinh tồn loại trực tiếp dành cho cả lớp: học sinh trả lời sai bị loại cho tới khi tìm ra Nhà vô địch giải cứu đồng đội.',
      icon: '🔔',
      category: 'quiz',
      categoryLabel: 'Đố vui & Trắc nghiệm',
      tag: 'Sắp ra mắt',
      tagColor: '#64748b',
      themeBg: '#f8fafc',
      themeBorder: '#e2e8f0',
      isComingSoon: true,
      action: () => {
        if (typeof window.showToast === 'function') {
          window.showToast('🔔 Trò chơi Rung Chuông Vàng đang trong giai đoạn phát triển và sẽ sớm ra mắt ở bản cập nhật tới!', 'info');
        }
      }
    }
  ];

  // Quản lý danh sách yêu thích trong LocalStorage
  const FAVORITES_STORAGE_KEY = 'happy_classroom_favorites_v1';
  function getFavorites() {
    try {
      const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
      return raw ? JSON.parse(raw) : ['wheel', 'quiz'];
    } catch (e) {
      return ['wheel', 'quiz'];
    }
  }

  function saveFavorites(favs) {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favs));
    } catch (e) {
      console.warn('Could not save favorites to localStorage:', e);
    }
  }

  function toggleFavorite(gameId) {
    let favs = getFavorites();
    if (favs.includes(gameId)) {
      favs = favs.filter(id => id !== gameId);
      if (typeof window.showToast === 'function') {
        window.showToast('Đã xóa khỏi danh sách yêu thích', 'info');
      }
    } else {
      favs.push(gameId);
      if (typeof window.showToast === 'function') {
        window.showToast('⭐ Đã thêm vào danh sách yêu thích!', 'success');
      }
    }
    saveFavorites(favs);
    renderGameCatalog();
  }

  // Trạng thái bộ lọc hiện tại
  const catalogState = {
    searchQuery: '',
    currentCategory: 'all' // 'all', 'picker', 'quiz', 'interactive', 'favorites'
  };

  // --- 2. RENDER LƯỚI TRÒ CHƠI ---
  function renderGameCatalog() {
    const grid = document.getElementById('catalogGamesGrid');
    const emptyState = document.getElementById('catalogEmptyState');
    if (!grid) return;

    const favorites = getFavorites();
    const query = catalogState.searchQuery.trim().toLowerCase();

    const filtered = GAMES_DATA.filter(game => {
      // Lọc theo từ khóa tìm kiếm
      if (query) {
        const matchTitle = game.title.toLowerCase().includes(query);
        const matchDesc = game.desc.toLowerCase().includes(query);
        const matchCat = game.categoryLabel.toLowerCase().includes(query);
        if (!matchTitle && !matchDesc && !matchCat) return false;
      }

      // Lọc theo thể loại
      if (catalogState.currentCategory === 'all') return true;
      if (catalogState.currentCategory === 'favorites') {
        return favorites.includes(game.id);
      }
      return game.category === catalogState.currentCategory;
    });

    grid.innerHTML = '';

    if (filtered.length === 0) {
      if (emptyState) emptyState.classList.add('visible');
      return;
    } else {
      if (emptyState) emptyState.classList.remove('visible');
    }

    filtered.forEach(game => {
      const isFav = favorites.includes(game.id);
      const card = document.createElement('div');
      card.className = `game-card ${game.isComingSoon ? 'is-coming-soon' : ''}`;
      card.setAttribute('data-id', game.id);

      card.innerHTML = `
        <div class="game-card-header">
          <div class="game-card-icon-wrap" style="background: ${game.themeBg}; border: 1px solid ${game.themeBorder};">
            <span>${game.icon}</span>
          </div>
          <div class="game-card-badges">
            <span class="game-tag-badge" style="background: ${game.themeBg}; color: ${game.tagColor}; border: 1px solid ${game.themeBorder};">
              ${game.tag}
            </span>
            <button class="game-favorite-btn ${isFav ? 'favorited' : ''}" title="${isFav ? 'Bỏ yêu thích' : 'Yêu thích trò chơi này'}" data-game-id="${game.id}">
              ${isFav ? '❤️' : '🤍'}
            </button>
          </div>
        </div>

        <div class="game-card-title">${game.title}</div>
        <div class="game-card-desc">${game.desc}</div>

        <div class="game-card-footer">
          <span class="game-category-label">${game.categoryLabel}</span>
          <button class="btn-game-launch" ${game.isComingSoon ? 'style="background: #f1f5f9; color: #64748b;"' : ''}>
            <span>${game.isComingSoon ? 'Xem lộ trình' : 'Chơi ngay'}</span>
            <span>➔</span>
          </button>
        </div>
      `;

      // Bắt sự kiện click nút yêu thích
      const favBtn = card.querySelector('.game-favorite-btn');
      if (favBtn) {
        favBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          toggleFavorite(game.id);
        });
      }

      // Bấm vào thẻ để chơi
      card.addEventListener('click', () => {
        game.action();
      });

      grid.appendChild(card);
    });
  }

  // --- 3. ĐỒNG BỘ CHỈ SỐ THỐNG KÊ (LIVE METRICS) ---
  function updateLiveMetrics() {
    try {
      const state = window.state;
      if (!state) return;

      const currentClass = typeof window.getCurrentClass === 'function' ? window.getCurrentClass() : null;
      const studentCount = currentClass && currentClass.students ? currentClass.students.length : 0;
      const calledCount = currentClass && currentClass.called ? currentClass.called.length : 0;

      const metricStudents = document.getElementById('metricStudentsCount');
      if (metricStudents) {
        metricStudents.textContent = studentCount || '45';
      }

      const metricCalled = document.getElementById('metricCalledCount');
      if (metricCalled) {
        metricCalled.textContent = calledCount || '0';
      }

      const metricQuiz = document.getElementById('metricQuizCount');
      if (metricQuiz) {
        const count = (window.quizBank && window.quizBank.length) || 10;
        metricQuiz.textContent = count;
      }

      // Cập nhật nhãn lớp trên Navbar Trang chủ
      const navClassName = document.getElementById('landingNavClassName');
      if (navClassName && currentClass) {
        navClassName.textContent = `${currentClass.name} (${studentCount} HS)`;
      }
    } catch (e) {
      console.warn('updateLiveMetrics error:', e);
    }
  }

  // --- 4. HỆ THỐNG ROUTER ĐIỀU HƯỚNG MÀN HÌNH (LANDING <-> GAME ARENA) ---
  const LandingRouter = {
    currentScreen: 'home',

    navigateTo(screenName, gameId) {
      const homeView = document.getElementById('homeLandingView');
      const gameView = document.getElementById('gameArenaView');
      const body = document.body;

      if (screenName === 'game') {
        this.currentScreen = 'game';
        body.classList.remove('mode-landing');
        body.classList.add('mode-game');

        if (homeView) homeView.classList.remove('active');
        if (gameView) gameView.classList.add('active');

        // Reset vị trí cuộn về đỉnh tuyệt đối
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;

        const appContainer = document.querySelector('.app-container');
        if (appContainer) appContainer.scrollTop = 0;

        const mainStage = document.querySelector('.main-stage');
        if (mainStage) mainStage.scrollTop = 0;

        // Nếu có chỉ định gameId, chọn game đó
        if (gameId && typeof window.selectGame === 'function') {
          window.selectGame(gameId);
        } else if (typeof window.selectGame === 'function') {
          window.selectGame('wheel');
        }

        // Đảm bảo vẽ lại Canvas của Wheel nếu chọn bánh xe và đảm bảo sân khấu ở đỉnh
        setTimeout(() => {
          if (window.state && window.state.viewMode === 'wheel' && typeof window.drawLuckyWheel === 'function') {
            window.drawLuckyWheel();
          }
          if (mainStage) mainStage.scrollTop = 0;
        }, 100);
      } else {
        // Mặc định về 'home' (Trang chủ)
        this.currentScreen = 'home';
        body.classList.add('mode-landing');
        body.classList.remove('mode-game');

        if (gameView) gameView.classList.remove('active');
        if (homeView) homeView.classList.add('active');

        updateLiveMetrics();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }

      // Cập nhật trạng thái active trên navbar
      document.querySelectorAll('.landing-nav-link').forEach(link => {
        const target = link.getAttribute('data-target');
        link.classList.toggle('active', target === screenName);
      });
    },

    playGame(gameId) {
      this.navigateTo('game', gameId);
    },

    scrollToSection(sectionId) {
      if (this.currentScreen !== 'home') {
        this.navigateTo('home');
      }
      setTimeout(() => {
        const target = document.getElementById(sectionId);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 50);
    }
  };

  window.LandingRouter = LandingRouter;

  // --- 5. MODAL HƯỚNG DẪN CÁCH CHƠI (HOW TO PLAY MODAL) ---
  function openHowToPlayModal() {
    const modal = document.getElementById('howToPlayModal');
    if (modal) modal.classList.add('open');
  }

  function closeHowToPlayModal() {
    const modal = document.getElementById('howToPlayModal');
    if (modal) modal.classList.remove('open');
  }

  window.openHowToPlayModal = openHowToPlayModal;
  window.closeHowToPlayModal = closeHowToPlayModal;

  // --- 6. KHỞI TẠO CÁC SỰ KIỆN TRÊN TRANG CHỦ ---
  function initLandingEvents() {
    // 1. Ô tìm kiếm kho trò chơi
    const searchInput = document.getElementById('catalogSearchInput');
    const clearBtn = document.getElementById('catalogSearchClear');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        catalogState.searchQuery = e.target.value;
        if (clearBtn) {
          clearBtn.style.display = e.target.value ? 'block' : 'none';
        }
        renderGameCatalog();
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (searchInput) {
          searchInput.value = '';
          catalogState.searchQuery = '';
          clearBtn.style.display = 'none';
          searchInput.focus();
          renderGameCatalog();
        }
      });
    }

    // 2. Các nút tab lọc thể loại
    const filterTabs = document.querySelectorAll('.filter-tab');
    filterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        catalogState.currentCategory = tab.getAttribute('data-category') || 'all';
        renderGameCatalog();
      });
    });

    // 3. Nút đặt lại tìm kiếm trong empty state
    const resetSearchBtn = document.getElementById('btnResetCatalogSearch');
    if (resetSearchBtn) {
      resetSearchBtn.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        catalogState.searchQuery = '';
        if (clearBtn) clearBtn.style.display = 'none';
        catalogState.currentCategory = 'all';
        filterTabs.forEach(t => t.classList.toggle('active', t.getAttribute('data-category') === 'all'));
        renderGameCatalog();
      });
    }

    // 4. Nút bật tắt âm thanh đồng bộ trên Navbar Trang chủ
    const landingSoundToggle = document.getElementById('landingSoundToggle');
    if (landingSoundToggle) {
      landingSoundToggle.addEventListener('click', () => {
        if (window.DOM && window.DOM.soundToggleBtn) {
          window.DOM.soundToggleBtn.click();
          syncSoundBtnState();
        }
      });
    }

    // 5. Nút bật/tắt toàn màn hình trên Navbar Trang chủ
    const landingFullscreenBtn = document.getElementById('landingFullscreenBtn');
    if (landingFullscreenBtn) {
      landingFullscreenBtn.addEventListener('click', () => {
        if (window.DOM && window.DOM.fullscreenToggleBtn) {
          window.DOM.fullscreenToggleBtn.click();
        }
      });
    }

    // 6. Hamburger Menu trên Mobile
    const mobileToggle = document.getElementById('landingMobileToggle');
    const navLinks = document.getElementById('landingNavLinks');
    if (mobileToggle && navLinks) {
      mobileToggle.addEventListener('click', () => {
        navLinks.classList.toggle('mobile-open');
      });
      // Đóng khi click vào link
      navLinks.querySelectorAll('a, button').forEach(item => {
        item.addEventListener('click', () => {
          navLinks.classList.remove('mobile-open');
        });
      });
    }

    // 7. Đóng modal hướng dẫn khi click ra ngoài backdrop
    const howToPlayModal = document.getElementById('howToPlayModal');
    if (howToPlayModal) {
      howToPlayModal.addEventListener('click', (e) => {
        if (e.target === howToPlayModal) {
          closeHowToPlayModal();
        }
      });
    }

    // Lắng nghe phím ESC để đóng modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeHowToPlayModal();
      }
    });

    renderGameCatalog();
    updateLiveMetrics();
    syncSoundBtnState();
  }

  function syncSoundBtnState() {
    const landingSoundToggle = document.getElementById('landingSoundToggle');
    const isSoundOn = window.state ? window.state.soundEnabled : true;
    if (landingSoundToggle) {
      landingSoundToggle.classList.toggle('active', isSoundOn);
      landingSoundToggle.title = isSoundOn ? 'Tắt âm thanh (Phím M)' : 'Bật âm thanh (Phím M)';
      const iconOn = landingSoundToggle.querySelector('.sound-icon-on');
      const iconOff = landingSoundToggle.querySelector('.sound-icon-off');
      if (iconOn) iconOn.style.display = isSoundOn ? 'block' : 'none';
      if (iconOff) iconOff.style.display = isSoundOn ? 'none' : 'block';
    }
  }

  window.syncSoundBtnState = syncSoundBtnState;
  window.updateLiveMetrics = updateLiveMetrics;

  // Tự động khởi tạo sau khi DOM sẵn sàng
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initLandingEvents();
      // Khởi động mặc định vào Trang chủ mới (Landing View)
      LandingRouter.navigateTo('home');
    });
  } else {
    initLandingEvents();
    LandingRouter.navigateTo('home');
  }

  // Hook vào hàm updateUI gốc để tự động cập nhật lại metrics mỗi khi nạp lớp hay đổi dữ liệu
  const originalUpdateUI = window.updateUI;
  if (typeof originalUpdateUI === 'function') {
    window.updateUI = function () {
      originalUpdateUI.apply(this, arguments);
      updateLiveMetrics();
    };
  }
})();
