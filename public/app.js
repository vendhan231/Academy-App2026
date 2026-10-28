/**
 * Vendhan Sports Academy - Single-Page Application (SPA) Engine
 * Theme: White, Athletic Orange, Sports Green, Alert Red
 *
 * Core Features:
 * - Admin-Only Logo Upload & Persistence (Server-backed + LocalStore)
 * - Coach Dashboard:
 *   * Interactive 6-Sport Selection Grid & Today's Attendance Marking
 *   * Attendance View as List (Student Attendance Logs with Filters)
 *   * Fees View as List (Dual Tuition & Kit Fees Ledger with Fees Icon Trigger)
 * - Head Coach Dashboard:
 *   * 6-Discipline Coaches Supervision & Today's Marking
 *   * Coach Attendance View as List
 *   * Student Attendance View as List
 *   * Academy Fees View as List
 * - Admin Dashboard:
 *   * Full User Management, Attendance List, Fees List, Salaries, and CMS with Logo Editor
 * - Student Portal:
 *   * Dual Tuition & Kit Fee Tracking with Progress Bars and Attendance Analytics
 */

// Global Application State
const state = {
  token: localStorage.getItem('vsa_token') || null,
  user: JSON.parse(localStorage.getItem('vsa_user') || 'null'),
  academyInfo: null,
  currentTab: 'overview',
  coachTab: 'workspace', // 'workspace' | 'attendance_list' | 'fees_list'
  headCoachTab: 'supervision', // 'supervision' | 'coach_attendance_list' | 'student_attendance_list' | 'fees_list'
  scheduleDayFilter: 'All',
  selectedSportFilter: 'Roller Skating', // Active sport in Coach Grid
  selectedDate: new Date().toISOString().slice(0, 10),
  usersList: [],
  attendanceRecords: [],
  studentDashboardData: null,
  loading: false
};

// 6 Core Sports Metadata
const ACADEMY_SPORTS = [
  {
    id: 'Roller Skating',
    name: 'Roller Skating',
    icon: 'fa-person-skating',
    gradient: 'from-orange-500 to-amber-500',
    color: 'text-orange-600',
    badge: 'bg-orange-50 text-orange-700 border-orange-200',
    description: '200m banked oval track, speed inline racing, slalom agility and state championship trials.'
  },
  {
    id: 'Archery',
    name: 'Archery',
    icon: 'fa-bullseye',
    gradient: 'from-amber-500 to-yellow-500',
    color: 'text-amber-600',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    description: '70m Olympic recurve and compound range, ballistic stance drills & tournament precision.'
  },
  {
    id: 'Football',
    name: 'Football',
    icon: 'fa-futbol',
    gradient: 'from-emerald-500 to-green-600',
    color: 'text-emerald-600',
    badge: 'bg-green-50 text-green-700 border-green-200',
    description: 'FIFA-standard turf pitch, positional defending, passing triangles & youth academy cups.'
  },
  {
    id: 'Yoga',
    name: 'Yoga',
    icon: 'fa-spa',
    gradient: 'from-teal-500 to-emerald-600',
    color: 'text-teal-600',
    badge: 'bg-teal-50 text-teal-700 border-teal-200',
    description: 'Hatha and Vinyasa asanas, core flexibility, respiratory pranayama & mental poise.'
  },
  {
    id: 'Physical Fitness',
    name: 'Physical Fitness',
    icon: 'fa-dumbbell',
    gradient: 'from-red-500 to-orange-600',
    color: 'text-red-600',
    badge: 'bg-red-50 text-red-700 border-red-200',
    description: 'High-intensity plyometrics, core endurance, sprint agility & cardiovascular conditioning.'
  },
  {
    id: 'Silambam',
    name: 'Silambam',
    icon: 'fa-wand-magic-sparkles',
    gradient: 'from-orange-600 to-red-600',
    color: 'text-orange-700',
    badge: 'bg-orange-50 text-orange-800 border-orange-200',
    description: 'Traditional Tamil martial arts, rapid staff spins, footwork sparring & weapon routines.'
  }
];

// -------------------------------------------------------------
// 1. API Client Helper
// -------------------------------------------------------------
const api = {
  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    if (state.token) {
      headers['Authorization'] = `Bearer ${state.token}`;
    }

    try {
      const response = await fetch(endpoint, {
        ...options,
        headers
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401 && state.token) {
          auth.logout(false);
          ui.toast('Session expired. Please sign in again.', 'error');
        }
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (err) {
      console.error(`API Error on ${endpoint}:`, err);
      throw err;
    }
  },

  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  },

  post(endpoint, body) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },

  put(endpoint, body) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  }
};

window.api = api;

// -------------------------------------------------------------
// 2. Authentication Controller
// -------------------------------------------------------------
const auth = {
  async login(username, password) {
    try {
      ui.showLoading();
      const res = await api.post('/api/login', { username, password });

      if (res.success && res.token) {
        state.token = res.token;
        state.user = res.user;
        localStorage.setItem('vsa_token', res.token);
        localStorage.setItem('vsa_user', JSON.stringify(res.user));

        if (res.user.role === 'coach' && res.user.sport && res.user.sport !== 'All') {
          state.selectedSportFilter = res.user.sport;
        }

        ui.closeModal('modal-login');
        ui.toast(`Welcome back, ${res.user.name}! (${res.user.role.toUpperCase()})`, 'success');
        
        state.currentTab = 'overview';
        state.coachTab = 'workspace';
        state.headCoachTab = 'supervision';
        router.render();
      }
    } catch (err) {
      const errBox = document.getElementById('login-error');
      if (errBox) {
        errBox.textContent = err.message || 'Login failed. Please verify credentials.';
        errBox.classList.remove('hidden');
      }
      ui.toast(err.message || 'Authentication error', 'error');
    } finally {
      ui.hideLoading();
    }
  },

  fillCredentials(username, password) {
    const uInput = document.getElementById('login-username');
    const pInput = document.getElementById('login-password');
    if (uInput) uInput.value = username;
    if (pInput) pInput.value = password;
    const errBox = document.getElementById('login-error');
    if (errBox) errBox.classList.add('hidden');
  },

  quickLogin(username, password) {
    this.fillCredentials(username, password);
    this.login(username, password);
  },

  handleLoginSubmit(e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    this.login(username, password);
  },

  logout(showToast = true) {
    state.token = null;
    state.user = null;
    state.currentTab = 'overview';
    state.coachTab = 'workspace';
    state.headCoachTab = 'supervision';
    localStorage.removeItem('vsa_token');
    localStorage.removeItem('vsa_user');

    if (showToast) {
      ui.toast('Logged out successfully.', 'info');
    }
    router.render();
  }
};

window.auth = auth;

// -------------------------------------------------------------
// 3. UI Helpers & Logo Handling (Admin Controlled)
// -------------------------------------------------------------
const ui = {
  toast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold border transition-all duration-300 transform translate-y-2 opacity-0 ${
      type === 'success'
        ? 'bg-sportsGreen-50 text-sportsGreen-700 border-sportsGreen-200'
        : type === 'error'
        ? 'bg-sportsRed-50 text-sportsRed-700 border-sportsRed-200'
        : 'bg-white text-slate-800 border-slate-200'
    }`;

    const icon =
      type === 'success'
        ? '<i class="fa-solid fa-circle-check text-sportsGreen-600"></i>'
        : type === 'error'
        ? '<i class="fa-solid fa-circle-exclamation text-sportsRed-600"></i>'
        : '<i class="fa-solid fa-circle-info text-brand-600"></i>';

    toast.innerHTML = `${icon} <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.remove('translate-y-2', 'opacity-0');
    }, 10);

    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-2');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  },

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('hidden');
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('hidden');
  },

  selectPortalTab(portalId = 'admin') {
    state.activePortalTab = portalId;
    const tabAdmin = document.getElementById('tab-portal-admin');
    const tabCoach = document.getElementById('tab-portal-coach');
    const tabStudent = document.getElementById('tab-portal-student');
    const infoBox = document.getElementById('portal-info-box');
    const submitLabel = document.getElementById('login-submit-label');
    const userLabel = document.getElementById('login-username-label');
    const userInput = document.getElementById('login-username');

    if (!tabAdmin || !tabCoach || !tabStudent || !infoBox) return;

    const activeClass = 'bg-white text-brand-600 shadow-xs border border-slate-200';
    const inactiveClass = 'text-slate-600 hover:text-slate-900';

    tabAdmin.className = `py-2 px-1 rounded-lg text-xs font-bold transition flex flex-col items-center gap-1 cursor-pointer ${portalId === 'admin' ? activeClass : inactiveClass}`;
    tabCoach.className = `py-2 px-1 rounded-lg text-xs font-bold transition flex flex-col items-center gap-1 cursor-pointer ${portalId === 'coach' ? activeClass : inactiveClass}`;
    tabStudent.className = `py-2 px-1 rounded-lg text-xs font-bold transition flex flex-col items-center gap-1 cursor-pointer ${portalId === 'student' ? activeClass : inactiveClass}`;

    if (portalId === 'admin') {
      if (userLabel) userLabel.textContent = 'Administrator ID / Username';
      if (userInput) userInput.placeholder = 'e.g. admin';
      if (submitLabel) submitLabel.textContent = 'Sign In to Admin Portal';

      infoBox.className = 'mb-5 p-3.5 rounded-xl bg-orange-50/80 border border-orange-200 text-xs';
      infoBox.innerHTML = `
        <div class="flex items-center justify-between font-bold text-orange-950 mb-1.5">
          <span class="flex items-center gap-1.5"><i class="fa-solid fa-shield-halved text-brand-600"></i> Admin Portal Preset:</span>
          <span class="font-mono text-[11px] text-slate-500">Superuser</span>
        </div>
        <p class="text-[11px] text-slate-600 mb-2.5">Full control over users, CMS content, coach salaries, and master logs.</p>
        <div class="p-2.5 rounded-lg bg-white border border-orange-200 shadow-xs text-[11px] text-slate-600">
          Enter your administrator username and password to sign in. Demo credentials are not displayed for security.
        </div>
      `;
    } else if (portalId === 'coach') {
      if (userLabel) userLabel.textContent = 'Coach / Head Coach ID';
      if (userInput) userInput.placeholder = 'e.g. coach, vendhan';
      if (submitLabel) submitLabel.textContent = 'Sign In to Coach Portal';

      infoBox.className = 'mb-5 p-3.5 rounded-xl bg-blue-50/80 border border-blue-200 text-xs';
      infoBox.innerHTML = `
        <div class="flex items-center justify-between font-bold text-blue-950 mb-1.5">
          <span class="flex items-center gap-1.5"><i class="fa-solid fa-whistle text-blue-600"></i> Coach & Head Coach Portals:</span>
          <span class="font-mono text-[11px] text-slate-500">2 Presets</span>
        </div>
        <div class="space-y-2">
          <div class="p-2 rounded-lg bg-white border border-blue-200 text-[11px] text-slate-600">
            Use the username and password provided for your coach or head coach account. Demo credentials are not displayed for security.
          </div>
        </div>
      `;
    } else if (portalId === 'student') {
      if (userLabel) userLabel.textContent = 'Allocated Student ID';
      if (userInput) userInput.placeholder = 'e.g. student1, STU-2026-001';
      if (submitLabel) submitLabel.textContent = 'Sign In to Student Portal';

      infoBox.className = 'mb-5 p-3.5 rounded-xl bg-purple-50/80 border border-purple-200 text-xs';
      infoBox.innerHTML = `
        <div class="flex items-center justify-between font-bold text-purple-950 mb-1.5">
          <span class="flex items-center gap-1.5"><i class="fa-solid fa-graduation-cap text-purple-600"></i> Student Athlete Portal:</span>
          <span class="font-mono text-[11px] text-slate-500">Trainee Access</span>
        </div>
        <p class="text-[11px] text-slate-600 mb-2">Unique student IDs and credentials are dynamically allocated by Admin upon admission.</p>
        <div class="p-2.5 rounded-lg bg-white border border-purple-200 shadow-xs text-[11px] text-slate-600">
          Use the student ID and password allocated by the Admin. Demo credentials are not displayed for security.
        </div>
      `;
    }
  },

  openLoginModal(portalId = 'admin') {
    const errBox = document.getElementById('login-error');
    if (errBox) errBox.classList.add('hidden');
    this.openModal('modal-login');
    this.selectPortalTab(portalId);
  },

  toggleMobileMenu() {
    const menu = document.getElementById('mobile-nav');
    if (menu) menu.classList.toggle('hidden');
  },

  togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    if (input) {
      input.type = input.type === 'password' ? 'text' : 'password';
    }
  },

  applyCustomLogo(logoUrl) {
    const imgEl = document.getElementById('header-logo-image');
    const defaultCrest = document.getElementById('header-default-crest');
    if (imgEl && defaultCrest) {
      if (logoUrl) {
        imgEl.src = logoUrl;
        imgEl.classList.remove('hidden');
        defaultCrest.classList.add('hidden');
      } else {
        imgEl.src = '';
        imgEl.classList.add('hidden');
        defaultCrest.classList.remove('hidden');
      }
    }
  },

  initLogo() {
    // Check academy info logo or local stored custom logo
    const savedLogo = (state.academyInfo && state.academyInfo.logoUrl) || localStorage.getItem('vsa_custom_logo');
    if (savedLogo) {
      this.applyCustomLogo(savedLogo);
    }
  },

  showLoading() {
    state.loading = true;
  },

  hideLoading() {
    state.loading = false;
  }
};

window.ui = ui;

// -------------------------------------------------------------
// 4. View Rendering Router
// -------------------------------------------------------------
const router = {
  async init() {
    try {
      const res = await api.get('/api/academy-info');
      state.academyInfo = res.data;
    } catch (e) {
      console.warn('Could not load academy info initially');
    }
    ui.initLogo();
    this.render();
  },

  render() {
    this.renderAuthButtons();
    const root = document.getElementById('app-root');
    if (!root) return;

    if (!state.user) {
      root.innerHTML = this.renderPublicLanding();
      return;
    }

    switch (state.user.role) {
      case 'admin':
        this.renderAdminView(root);
        break;
      case 'head_coach':
        this.renderHeadCoachView(root);
        break;
      case 'coach':
        this.renderCoachView(root);
        break;
      case 'student':
        this.renderStudentView(root);
        break;
      default:
        root.innerHTML = this.renderPublicLanding();
    }
  },

  renderAuthButtons() {
    const container = document.getElementById('auth-buttons-container');
    const navLinks = document.getElementById('nav-public-links');
    if (!container) return;

    if (!state.user) {
      if (navLinks) navLinks.classList.remove('hidden');
      container.innerHTML = `
        <button onclick="window.ui.openLoginModal()" class="px-5 py-2 rounded-xl text-sm font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-600/30 transition flex items-center gap-2">
          <i class="fa-solid fa-arrow-right-to-bracket"></i> Sign In
        </button>
      `;
    } else {
      if (navLinks) navLinks.classList.add('hidden');
      const roleBadge = {
        admin: 'bg-red-100 text-red-700 border-red-300',
        head_coach: 'bg-blue-100 text-blue-700 border-blue-300',
        coach: 'bg-emerald-100 text-emerald-700 border-emerald-300',
        student: 'bg-purple-100 text-purple-700 border-purple-300'
      }[state.user.role] || 'bg-slate-100 text-slate-700';

      const roleLabel = {
        admin: 'Super Admin',
        head_coach: 'Head Coach',
        coach: 'Coach',
        student: 'Student'
      }[state.user.role] || state.user.role;

      container.innerHTML = `
        <div class="flex items-center gap-3">
          <div class="hidden sm:flex flex-col text-right">
            <span class="text-sm font-bold text-slate-900 tracking-tight">${state.user.name}</span>
            <span class="text-[11px] font-bold uppercase px-2 py-0.5 rounded-full border self-end mt-0.5 ${roleBadge}">
              ${roleLabel}
            </span>
          </div>
          <button onclick="window.auth.logout()" title="Sign Out" class="w-10 h-10 rounded-xl bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 border border-slate-200 transition flex items-center justify-center">
            <i class="fa-solid fa-arrow-right-from-bracket"></i>
          </button>
        </div>
      `;
    }
  },

  // -----------------------------------------------------------
  // 4.1 PUBLIC LANDING PAGE
  // -----------------------------------------------------------
  renderPublicLanding() {
    const info = state.academyInfo || {
      startedYear: '2014',
      aboutText: 'Vendhan Sports Academy is a premier athletic institution.',
      sportsAvailable: ACADEMY_SPORTS.map((s) => s.name),
      achievements: [],
      weeklySchedule: [],
      events: [],
      gallery: []
    };

    const filteredSchedule = state.scheduleDayFilter === 'All'
      ? (info.weeklySchedule || [])
      : (info.weeklySchedule || []).filter((s) => s.day === state.scheduleDayFilter);

    const days = ['All', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    const getSportIcon = (sportName) => {
      const match = ACADEMY_SPORTS.find((s) => s.name.toLowerCase() === (sportName || '').toLowerCase());
      return match ? match.icon : 'fa-trophy';
    };

    return `
      <div class="space-y-16 pb-16">

        <!-- Hero Banner -->
        <section class="relative rounded-3xl overflow-hidden bg-white border border-slate-200 shadow-xl p-8 sm:p-14 lg:p-20 hero-glow">
          <div class="relative z-10 max-w-3xl space-y-6">
            <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-bold tracking-wide uppercase">
              <i class="fa-solid fa-award text-brand-600"></i> Established in ${info.startedYear} • 6 Core Disciplines
            </div>
            
            <h1 class="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 font-display leading-tight">
              Forging Champions in <span class="text-brand-600">Skating, Archery, Football, Yoga, Fitness & Silambam</span>
            </h1>

            <p class="text-slate-600 text-base sm:text-lg leading-relaxed max-w-2xl font-normal">
              ${info.aboutText}
            </p>

            <div class="flex flex-wrap gap-4 pt-2">
              <a href="#disciplines" class="px-6 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold shadow-md shadow-brand-600/30 transition flex items-center gap-2">
                <span>Explore 6 Disciplines</span>
                <i class="fa-solid fa-arrow-down text-xs"></i>
              </a>
              <button onclick="window.ui.openLoginModal()" class="px-6 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold border border-slate-300 transition flex items-center gap-2">
                <i class="fa-solid fa-lock text-brand-600"></i>
                <span>Portal Login</span>
              </button>
            </div>
          </div>

          <div class="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12 pt-8 border-t border-slate-200">
            <div class="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div class="text-3xl font-black text-brand-600 font-display">6</div>
              <div class="text-xs text-slate-600 font-semibold mt-1">Core Sports Disciplines</div>
            </div>
            <div class="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div class="text-3xl font-black text-slate-900 font-display">500+</div>
              <div class="text-xs text-slate-600 font-semibold mt-1">Tournament Medals Won</div>
            </div>
            <div class="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div class="text-3xl font-black text-sportsGreen-600 font-display">100%</div>
              <div class="text-xs text-slate-600 font-semibold mt-1">Certified Master Coaches</div>
            </div>
            <div class="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div class="text-3xl font-black text-amber-600 font-display">${info.startedYear}</div>
              <div class="text-xs text-slate-600 font-semibold mt-1">Founded Year</div>
            </div>
          </div>
        </section>

<!-- Weekly Schedule Timetable -->
        <section id="schedule" class="space-y-6 scroll-mt-24">
          <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div class="inline-flex items-center gap-2 text-xs font-bold text-brand-600 uppercase tracking-wider">
                <i class="fa-solid fa-calendar-days"></i> Training Timetable
              </div>
              <h2 class="text-3xl font-extrabold text-slate-900 font-display mt-1">Weekly Training Schedule</h2>
              <p class="text-slate-500 text-xs sm:text-sm">Filter sessions across all 6 disciplines to check training timings and coaches.</p>
            </div>

            <div class="flex flex-wrap gap-1.5 p-1 rounded-xl bg-white border border-slate-200 shadow-xs">
              ${days.map((day) => `
                <button onclick="window.router.filterSchedule('${day}')" class="px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  state.scheduleDayFilter === day
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }">
                  ${day}
                </button>
              `).join('')}
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            ${filteredSchedule.length === 0 ? `
              <div class="col-span-full p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-sm">
                No training sessions scheduled for ${state.scheduleDayFilter}.
              </div>
            ` : filteredSchedule.map((s) => `
              <div class="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-brand-300 transition flex items-start gap-4">
                <div class="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 shrink-0 text-xl border border-brand-200">
                  <i class="fa-solid ${getSportIcon(s.sport)}"></i>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-brand-100 text-brand-800 border border-brand-200">
                      ${s.day}
                    </span>
                    <span class="text-xs text-slate-500 font-mono font-semibold"><i class="fa-regular fa-clock mr-1 text-slate-400"></i>${s.time}</span>
                  </div>
                  <h4 class="font-bold text-slate-900 text-base truncate">${s.sport}</h4>
                  <p class="text-xs text-slate-600 mt-1 flex items-center gap-1.5 font-medium">
                    <i class="fa-solid fa-user-tie text-brand-600 text-[11px]"></i> Coach: <span class="text-slate-800">${s.coach}</span>
                  </p>
                </div>
              </div>
            `).join('')}
          </div>
        </section>

        <!-- Achievements -->
        <section id="achievements" class="space-y-8 scroll-mt-24">
          <div class="text-center max-w-2xl mx-auto space-y-3">
            <div class="inline-flex items-center gap-2 text-xs font-bold text-amber-600 uppercase tracking-wider">
              <i class="fa-solid fa-trophy"></i> Hall of Fame
            </div>
            <h2 class="text-3xl sm:text-4xl font-extrabold text-slate-900 font-display">Major Achievements</h2>
            <p class="text-slate-500 text-sm">Medals and championship honors earned across our 6 training disciplines.</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            ${(info.achievements || []).map((ach) => `
              <div class="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-amber-400 transition flex items-start gap-4">
                <div class="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center text-xl shrink-0">
                  <i class="fa-solid fa-medal"></i>
                </div>
                <div class="space-y-1">
                  <div class="inline-block text-xs font-extrabold text-amber-700 tracking-wider">
                    ${ach.year} CHAMPIONSHIP
                  </div>
                  <h3 class="text-base font-bold text-slate-900">${ach.title}</h3>
                  <p class="text-xs text-slate-600 leading-relaxed">${ach.description}</p>
                </div>
              </div>
            `).join('')}
          </div>
        </section>

        <!-- Events -->
        <section id="events" class="space-y-8 scroll-mt-24">
          <div class="text-center max-w-2xl mx-auto space-y-3">
            <div class="inline-flex items-center gap-2 text-xs font-bold text-brand-600 uppercase tracking-wider">
              <i class="fa-solid fa-bullhorn"></i> Tournaments & Trials
            </div>
            <h2 class="text-3xl sm:text-4xl font-extrabold text-slate-900 font-display">Upcoming Events & Meets</h2>
            <p class="text-slate-500 text-sm">Official selection trials, invitational meets, and championship schedules.</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            ${(info.events || []).map((ev) => `
              <div class="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition flex items-start gap-4">
                <div class="p-3 rounded-xl bg-brand-50 border border-brand-200 text-center min-w-[70px] shrink-0">
                  <div class="text-xs uppercase text-brand-700 font-bold tracking-wider">${new Date(ev.date).toLocaleString('default', { month: 'short' })}</div>
                  <div class="text-2xl font-black text-brand-600 font-display">${new Date(ev.date).getDate() || '15'}</div>
                </div>
                <div class="space-y-1">
                  <h3 class="text-base font-bold text-slate-900">${ev.name}</h3>
                  <p class="text-xs text-slate-600 flex items-center gap-1.5 font-medium">
                    <i class="fa-solid fa-location-dot text-brand-600"></i> ${ev.location}
                  </p>
                  <p class="text-xs text-slate-500 leading-relaxed pt-1">${ev.description}</p>
                </div>
              </div>
            `).join('')}
          </div>
        </section>

        <!-- Gallery -->
        <section id="gallery" class="space-y-8 scroll-mt-24">
          <div class="text-center max-w-2xl mx-auto space-y-3">
            <div class="inline-flex items-center gap-2 text-xs font-bold text-brand-600 uppercase tracking-wider">
              <i class="fa-solid fa-camera"></i> Life at Vendhan Academy
            </div>
            <h2 class="text-3xl sm:text-4xl font-extrabold text-slate-900 font-display">Photo Gallery Showcase</h2>
            <p class="text-slate-500 text-sm">Athletic action from skating tracks, archery grounds, football matches, and silambam arenas.</p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            ${(info.gallery || []).map((imgUrl, i) => `
              <div class="group relative rounded-2xl overflow-hidden aspect-[4/3] border border-slate-200 shadow-sm bg-white">
                <img src="${imgUrl}" alt="Academy Photo ${i + 1}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                <div class="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition duration-300 flex items-end p-4">
                  <span class="text-xs text-white font-medium flex items-center gap-2">
                    <i class="fa-solid fa-magnifying-glass-plus text-brand-400"></i> Vendhan Sports Academy
                  </span>
                </div>
              </div>
            `).join('')}
          </div>
        </section>

      </div>
    `;
  },

  filterSchedule(day) {
    state.scheduleDayFilter = day;
    this.render();
  },

  // -----------------------------------------------------------
  // 4.2 REGULAR COACH DASHBOARD: 3 TABS (WORKFLOW, ATTENDANCE LIST, FEES LIST)
  // -----------------------------------------------------------
  async renderCoachView(root) {
    root.innerHTML = `
      <div class="space-y-8">
        
        <!-- Header -->
        <div class="p-6 sm:p-7 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2 text-xs font-bold text-brand-600 uppercase tracking-wider mb-1">
              <i class="fa-solid fa-person-running"></i> Coach Training Portal
            </div>
            <h1 class="text-2xl sm:text-3xl font-black text-slate-900 font-display">Sports Coaching, Attendance & Fees</h1>
            <p class="text-xs text-slate-500">Universal access across all 6 sports with dedicated Attendance and Dual Fees list views.</p>
          </div>
          <div class="text-xs bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700">
            Coach: <span class="font-bold text-slate-900">${state.user.name}</span>
          </div>
        </div>

        <!-- Coach Navigation Sub-tabs -->
        <div class="flex overflow-x-auto gap-2 p-1.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <button onclick="window.coach.switchTab('workspace')" class="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
            state.coachTab === 'workspace' ? 'bg-brand-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }">
            <i class="fa-solid fa-table-cells-large"></i> Interactive Training Grid
          </button>
          <button onclick="window.coach.switchTab('student_profiles_coach')" class="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
            state.coachTab === 'student_profiles_coach' ? 'bg-brand-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }">
            <i class="fa-solid fa-id-card"></i> Regular Student Profiles
          </button>
          <button onclick="window.coach.switchTab('attendance_list')" class="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
            state.coachTab === 'attendance_list' ? 'bg-brand-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }">
            <i class="fa-solid fa-clipboard-list"></i> Attendance View (List)
          </button>
          <button onclick="window.coach.switchTab('fees_list')" class="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
            state.coachTab === 'fees_list' ? 'bg-brand-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }">
            <i class="fa-solid fa-receipt"></i> Fees View (List)
          </button>
        </div>

        <!-- Tab Container -->
        <div id="coach-tab-container">
          <div class="p-8 text-center text-slate-400"><i class="fa-solid fa-spinner fa-spin text-xl"></i> Loading...</div>
        </div>

      </div>
    `;

    await coach.loadCoachTabContent();
  },

  // -----------------------------------------------------------
  // 4.3 HEAD COACH DASHBOARD: 4 TABS (SUPERVISION, COACH ATTENDANCE LIST, STUDENT ATTENDANCE LIST, FEES LIST)
  // -----------------------------------------------------------
  async renderHeadCoachView(root) {
    root.innerHTML = `
      <div class="space-y-8">
        
        <!-- Header -->
        <div class="p-6 sm:p-7 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
              <i class="fa-solid fa-whistle"></i> Head Coach Command
            </div>
            <h1 class="text-2xl sm:text-3xl font-black text-slate-900 font-display">Coaching Oversight, Attendance & Fees</h1>
            <p class="text-xs text-slate-500">Supervise staff across 6 disciplines, enroll regular students, monitor attendance, and inspect fees.</p>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <button onclick="openAddStudentModal()" class="px-5 py-2.5 rounded-xl bg-sportsGreen-600 hover:bg-sportsGreen-700 text-white font-bold text-xs shadow-md shadow-green-600/20 flex items-center gap-2 transition cursor-pointer">
              <i class="fa-solid fa-user-plus"></i> + Add New Student
            </button>
            <div class="text-xs text-slate-700 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 font-medium">
              Head of Coaching: <span class="font-bold text-slate-900">${state.user.name}</span>
            </div>
          </div>
        </div>

        <!-- Head Coach Sub-Tabs (Exclusive Coach Oversight + Extended Student Powers) -->
        <div class="flex overflow-x-auto gap-2 p-1.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <button onclick="window.headCoach.switchTab('supervision')" class="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
            state.headCoachTab === 'supervision' ? 'bg-brand-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }">
            <i class="fa-solid fa-network-wired"></i> Coaches & Daily Marking
          </button>
          <button onclick="window.headCoach.switchTab('coach_attendance_list')" class="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
            state.headCoachTab === 'coach_attendance_list' ? 'bg-brand-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }">
            <i class="fa-solid fa-user-check"></i> Coach Attendance (List)
          </button>
          <button onclick="window.headCoach.switchTab('student_grid')" class="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
            state.headCoachTab === 'student_grid' ? 'bg-brand-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }">
            <i class="fa-solid fa-table-cells-large"></i> Student Training (6 Sports)
          </button>
          <button onclick="window.headCoach.switchTab('student_profiles_hc')" class="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
            state.headCoachTab === 'student_profiles_hc' ? 'bg-brand-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }">
            <i class="fa-solid fa-id-card"></i> Regular Student Profiles
          </button>
          <button onclick="window.headCoach.switchTab('student_attendance_list')" class="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
            state.headCoachTab === 'student_attendance_list' ? 'bg-brand-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }">
            <i class="fa-solid fa-clipboard-user"></i> Student Attendance (List)
          </button>
          <button onclick="window.headCoach.switchTab('fees_list')" class="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
            state.headCoachTab === 'fees_list' ? 'bg-brand-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }">
            <i class="fa-solid fa-receipt"></i> Academy Fees (List)
          </button>
        </div>

        <!-- Head Coach Tab Container -->
        <div id="headcoach-tab-container">
          <div class="p-8 text-center text-slate-400"><i class="fa-solid fa-spinner fa-spin text-xl"></i> Loading...</div>
        </div>

      </div>
    `;

    await headCoach.loadHeadCoachTabContent();
  },

  // -----------------------------------------------------------
  // 4.4 ADMIN DASHBOARD (ADMIN-ONLY LOGO UPLOAD & LISTS)
  // -----------------------------------------------------------
  async renderAdminView(root) {
    root.innerHTML = `
      <div class="space-y-8">
        <!-- Admin Header with Admin-Only Logo Upload Button -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-7 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div>
            <div class="flex items-center gap-2 text-xs font-bold text-sportsRed-600 uppercase tracking-wider mb-1">
              <i class="fa-solid fa-shield-halved"></i> Superuser Administration
            </div>
            <h1 class="text-2xl sm:text-3xl font-black text-slate-900 font-display">Academy Command Center</h1>
            <p class="text-xs text-slate-500">Full control across 6 sports: user allocation, dual fee ledger, coach payroll, and logo branding.</p>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <!-- Dedicated Admin-Only Logo Upload Button -->
            <label title="Upload Official Academy Logo (Admin Only)" class="cursor-pointer px-4 py-2.5 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold text-xs border border-brand-200 shadow-xs flex items-center gap-2 transition">
              <i class="fa-solid fa-cloud-arrow-up text-brand-600 text-sm"></i>
              <span>Upload Academy Logo</span>
              <input type="file" id="admin-logo-upload-input" accept="image/*" class="hidden" onchange="window.admin.handleAdminLogoUpload(event)" />
            </label>
            <button onclick="window.ui.openModal('modal-add-user')" class="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md shadow-brand-600/30 flex items-center gap-2 transition">
              <i class="fa-solid fa-user-plus"></i> Allocate Credentials
            </button>
          </div>
        </div>

        <!-- Navigation Tabs -->
        <div class="flex overflow-x-auto gap-2 p-1.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          ${[
            { id: 'overview', icon: 'fa-chart-pie', label: 'System Overview' },
            { id: 'users', icon: 'fa-users', label: 'User Management' },
            { id: 'student_profiles', icon: 'fa-id-card', label: 'Regular Student Profiles' },
            { id: 'archive', icon: 'fa-box-archive', label: 'Student Archive' },
            { id: 'attendance', icon: 'fa-clipboard-user', label: 'Attendance (List)' },
            { id: 'fees', icon: 'fa-receipt', label: 'Dual Fees (List)' },
            { id: 'salaries', icon: 'fa-money-bill-wave', label: 'Coach Salaries' },
            { id: 'cms', icon: 'fa-pen-to-square', label: 'Website CMS & Logo' }
          ].map((tab) => `
            <button onclick="window.router.switchTab('${tab.id}')" class="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
              state.currentTab === tab.id
                ? 'bg-brand-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }">
              <i class="fa-solid ${tab.icon}"></i> ${tab.label}
            </button>
          `).join('')}
        </div>

        <div id="admin-tab-content">
          <div class="py-12 text-center text-slate-400"><i class="fa-solid fa-spinner fa-spin text-2xl"></i> Loading data...</div>
        </div>
      </div>
    `;

    await this.loadAdminTabData();
  },

  async loadAdminTabData() {
    const container = document.getElementById('admin-tab-content');
    if (!container) return;

    try {
      if (state.currentTab === 'overview') {
        const usersRes = await api.get('/api/users');
        const users = usersRes.data || [];
        const students = users.filter((u) => u.role === 'student');
        const coaches = users.filter((u) => u.role === 'coach' || u.role === 'head_coach');

        const totalTuitionFees = students.reduce((acc, s) => acc + (s.fees?.total || 0), 0);
        const paidTuitionFees = students.reduce((acc, s) => acc + (s.fees?.paid || 0), 0);
        const dueTuitionFees = students.reduce((acc, s) => acc + (s.fees?.due || 0), 0);

        const totalKitFees = students.reduce((acc, s) => acc + (s.kitFees?.total || 0), 0);
        const paidKitFees = students.reduce((acc, s) => acc + (s.kitFees?.paid || 0), 0);
        const dueKitFees = students.reduce((acc, s) => acc + (s.kitFees?.due || 0), 0);

        container.innerHTML = `
          <div class="space-y-6">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div class="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <div class="flex items-center justify-between text-slate-500 text-xs mb-2">
                  <span class="font-semibold">Enrolled Trainees</span>
                  <i class="fa-solid fa-user-graduate text-purple-600 text-base"></i>
                </div>
                <div class="text-3xl font-black text-slate-900 font-display">${students.length}</div>
                <div class="text-[11px] text-slate-500 mt-1">Across 6 sports disciplines</div>
              </div>

              <div class="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <div class="flex items-center justify-between text-slate-500 text-xs mb-2">
                  <span class="font-semibold">Coaching Staff</span>
                  <i class="fa-solid fa-whistle text-blue-600 text-base"></i>
                </div>
                <div class="text-3xl font-black text-slate-900 font-display">${coaches.length}</div>
                <div class="text-[11px] text-slate-500 mt-1">1 Head Coach + ${coaches.length - 1} Coaches</div>
              </div>

              <div class="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <div class="flex items-center justify-between text-slate-500 text-xs mb-2">
                  <span class="font-semibold">Tuition Collected</span>
                  <i class="fa-solid fa-circle-check text-sportsGreen-600 text-base"></i>
                </div>
                <div class="text-3xl font-black text-sportsGreen-600 font-display">₹${paidTuitionFees.toLocaleString()}</div>
                <div class="text-[11px] text-slate-500 mt-1 font-semibold text-sportsRed-600">Pending Due: ₹${dueTuitionFees.toLocaleString()}</div>
              </div>

              <div class="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <div class="flex items-center justify-between text-slate-500 text-xs mb-2">
                  <span class="font-semibold">Kit / Uniform Collected</span>
                  <i class="fa-solid fa-shirt text-brand-600 text-base"></i>
                </div>
                <div class="text-3xl font-black text-brand-600 font-display">₹${paidKitFees.toLocaleString()}</div>
                <div class="text-[11px] text-slate-500 mt-1 font-semibold text-amber-700">Kit Pending: ₹${dueKitFees.toLocaleString()}</div>
              </div>
            </div>

            <!-- Action shortcuts -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div onclick="window.router.switchTab('fees')" class="cursor-pointer p-6 rounded-2xl bg-white border border-slate-200 hover:border-brand-400 shadow-xs transition">
                <i class="fa-solid fa-receipt text-brand-600 text-2xl mb-3"></i>
                <h3 class="font-bold text-slate-900 text-base">Dual Fees List View</h3>
                <p class="text-xs text-slate-500 mt-1">Click the Fees icon on any student to view Tuition & Kit breakdowns and perform instant updates.</p>
              </div>
              <div onclick="window.router.switchTab('attendance')" class="cursor-pointer p-6 rounded-2xl bg-white border border-slate-200 hover:border-brand-400 shadow-xs transition">
                <i class="fa-solid fa-clipboard-user text-blue-600 text-2xl mb-3"></i>
                <h3 class="font-bold text-slate-900 text-base">Attendance List View</h3>
                <p class="text-xs text-slate-500 mt-1">Universal attendance lists for students and coaches with date & status filters.</p>
              </div>
              <div onclick="window.router.switchTab('cms')" class="cursor-pointer p-6 rounded-2xl bg-white border border-slate-200 hover:border-brand-400 shadow-xs transition">
                <i class="fa-solid fa-image text-amber-600 text-2xl mb-3"></i>
                <h3 class="font-bold text-slate-900 text-base">Logo & Website CMS</h3>
                <p class="text-xs text-slate-500 mt-1">Upload and manage official academy logo, training timetables, and tournament notices.</p>
              </div>
            </div>
          </div>
        `;
      } else if (state.currentTab === 'users') {
        const res = await api.get('/api/users');
        state.usersList = res.data || [];
        this.renderAdminUsersTab(container);
      } else if (state.currentTab === 'student_profiles') {
        const res = await api.get('/api/users?role=student');
        const students = res.data || [];
        container.innerHTML = `
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-lg font-bold text-slate-900 font-display">Regular Student Profiles</h3>
                <p class="text-xs text-slate-500">Complete profiles with details, fees, and about section for all active regular students</p>
              </div>
              <span class="text-xs font-semibold text-slate-600">${students.length} Active Students</span>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              ${students.map((s) => `
                <div class="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-brand-300 transition">
                  <div class="flex items-start gap-3 mb-3">
                    <button onclick="window.openStudentProfileModal('${s._id || s.id}')" class="w-12 h-12 rounded-full bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center text-brand-700 border-2 border-white shadow-sm hover:scale-105 transition">
                      <i class="fa-solid fa-id-card text-lg"></i>
                    </button>
                    <div class="flex-1 min-w-0">
                      <h4 class="font-bold text-slate-900 truncate">${s.name}</h4>
                      <p class="text-xs text-slate-500 font-mono">ID: ${s.username}</p>
                      <p class="text-xs text-brand-700 font-semibold">${s.sport || 'General'} ${s.sportLevel ? '(' + s.sportLevel + ')' : ''}</p>
                    </div>
                  </div>
                  <div class="space-y-2 text-xs">
                    <div class="p-2 rounded-lg bg-slate-50 border border-slate-200">
                      <span class="text-slate-500">Enrollment:</span> <span class="font-semibold text-slate-900">${s.enrollmentDate ? new Date(s.enrollmentDate).toLocaleDateString('en-IN') : 'N/A'}</span>
                    </div>
                    <div class="p-2 rounded-lg bg-slate-50 border border-slate-200">
                      <span class="text-slate-500">Fees Due:</span> <span class="font-bold ${((s.fees?.due||0) + (s.kitFees?.due||0)) > 0 ? 'text-sportsRed-600' : 'text-sportsGreen-600'}">₹${((s.fees?.due||0) + (s.kitFees?.due||0)).toLocaleString('en-IN')}</span>
                    </div>
                    ${s.bio ? `<div class="p-2 rounded-lg bg-slate-50 border border-slate-200"><span class="text-slate-500 block mb-1">About:</span> <span class="text-slate-700 line-clamp-2">${s.bio}</span></div>` : ''}
                  </div>
                  <button onclick="window.openStudentProfileModal('${s._id || s.id}')" class="w-full mt-3 px-3 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition">
                    View Full Profile
                  </button>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      } else if (state.currentTab === 'archive') {
        await this.renderAdminArchiveTab(container);
      } else if (state.currentTab === 'attendance') {
        this.renderAdminAttendanceTab(container);
      } else if (state.currentTab === 'fees') {
        const res = await api.get('/api/users?role=student');
        this.renderAdminFeesTab(container, res.data || []);
      } else if (state.currentTab === 'salaries') {
        const res = await api.get('/api/users');
        const coaches = (res.data || []).filter((u) => u.role === 'coach' || u.role === 'head_coach');
        this.renderAdminSalariesTab(container, coaches);
      } else if (state.currentTab === 'cms') {
        this.renderAdminCmsTab(container);
      }
    } catch (err) {
      container.innerHTML = `<div class="p-6 rounded-2xl bg-red-50 border border-red-200 text-sportsRed-600 text-sm font-semibold">${err.message}</div>`;
    }
  },

  renderAdminUsersTab(container) {
    container.innerHTML = `
      <div class="space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="text-sm text-slate-600 font-medium">Total Registered Users: <span class="font-bold text-slate-900">${state.usersList.length}</span></div>
          <div class="flex items-center gap-2">
            <select id="user-filter-role" onchange="window.admin.filterUsers(this.value)" class="px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-800 font-semibold focus:outline-none">
              <option value="all">All Roles</option>
              <option value="student">Students</option>
              <option value="coach">Regular Coaches</option>
              <option value="head_coach">Head Coaches</option>
              <option value="admin">Administrators</option>
            </select>
          </div>
        </div>

        <div class="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50 text-slate-700 border-b border-slate-200">
                <tr>
                  <th class="py-3.5 px-4 font-bold uppercase">Username (ID)</th>
                  <th class="py-3.5 px-4 font-bold uppercase">Full Name</th>
                  <th class="py-3.5 px-4 font-bold uppercase">Role</th>
                  <th class="py-3.5 px-4 font-bold uppercase">Sport / Discipline</th>
                  <th class="py-3.5 px-4 font-bold uppercase">Phone</th>
                  <th class="py-3.5 px-4 font-bold uppercase">Financial Record</th>
                </tr>
              </thead>
              <tbody id="users-table-body" class="divide-y divide-slate-100">
                ${state.usersList.map((u) => admin.renderUserRow(u)).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  async renderAdminArchiveTab(container) {
    container.innerHTML = `
      <div class="space-y-6">
        <!-- Search and Action Bar -->
        <div class="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2.5">
              <h3 class="text-lg font-bold text-slate-900 font-display">Student Historical Archive</h3>
              <span id="archive-count-badge" class="px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 font-bold border border-brand-200 text-xs">
                <i class="fa-solid fa-spinner fa-spin mr-1"></i> Loading...
              </span>
            </div>
            <p class="text-xs text-slate-500 mt-0.5">Search and inspect former admissions, alumni records, and legacy registrations across all sports disciplines.</p>
          </div>
          
          <div class="flex items-center gap-3">
            <button onclick="window.admin.openAddArchiveModal()" class="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md shadow-brand-600/30 flex items-center gap-2 transition cursor-pointer">
              <i class="fa-solid fa-plus"></i> Add Archive Record
            </button>
          </div>
        </div>

        <!-- Real-Time Search Bar -->
        <div class="relative">
          <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
            <i class="fa-solid fa-magnifying-glass"></i>
          </span>
          <input
            type="text"
            id="archive-search-input"
            placeholder="Real-time search by student name, contact number, sport, parent, or address..."
            oninput="window.admin.onArchiveSearchInput(event)"
            class="w-full pl-10 pr-16 py-3 rounded-2xl bg-white border border-slate-200 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 shadow-xs"
          />
          <button
            type="button"
            onclick="document.getElementById('archive-search-input').value=''; window.admin.loadArchiveRecords('');"
            class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 text-xs font-semibold cursor-pointer"
          >
            Clear
          </button>
        </div>

        <!-- Archive Data Table -->
        <div class="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50 text-slate-700 border-b border-slate-200">
                <tr>
                  <th class="py-3.5 px-4 font-bold uppercase">Student Name</th>
                  <th class="py-3.5 px-4 font-bold uppercase">Sport Selected</th>
                  <th class="py-3.5 px-4 font-bold uppercase">DOB & Gender</th>
                  <th class="py-3.5 px-4 font-bold uppercase">Parent / Guardian</th>
                  <th class="py-3.5 px-4 font-bold uppercase">Permanent Address</th>
                  <th class="py-3.5 px-4 font-bold uppercase">Contact Number</th>
                  <th class="py-3.5 px-4 font-bold uppercase">Enrollment Date</th>
                </tr>
              </thead>
              <tbody id="archive-table-body" class="divide-y divide-slate-100">
                <tr>
                  <td colspan="7" class="py-12 text-center text-slate-400">
                    <i class="fa-solid fa-spinner fa-spin text-xl"></i> Loading archive records...
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    await admin.loadArchiveRecords();
  },

  async renderAdminAttendanceTab(container) {
    const today = state.selectedDate;
    container.innerHTML = `
      <div class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div class="flex items-center gap-3">
            <span class="text-xs font-bold text-slate-700 uppercase">Filter Date:</span>
            <input type="date" value="${today}" onchange="window.admin.changeAttendanceDate(this.value)" class="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs font-medium focus:outline-none focus:border-brand-500" />
          </div>

          <div class="flex items-center gap-2">
            <button id="att-tab-students" onclick="window.admin.toggleAttendanceRole('student')" class="px-4 py-1.5 rounded-xl text-xs font-bold bg-brand-600 text-white shadow-xs transition cursor-pointer">
              Student Records (List)
            </button>
            <button id="att-tab-coaches" onclick="window.admin.toggleAttendanceRole('coach')" class="px-4 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition cursor-pointer">
              Coach Records (List)
            </button>
          </div>
        </div>

        <div id="admin-attendance-records-container">
          <div class="py-12 text-center text-slate-400"><i class="fa-solid fa-spinner fa-spin text-xl"></i> Loading records...</div>
        </div>
      </div>
    `;

    await admin.loadAttendanceLogs('student', today);
  },

  renderAdminFeesTab(container, students) {
    container.innerHTML = `
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-base font-bold text-slate-900 font-display">Trainee Dual Fees (List View)</h3>
            <p class="text-xs text-slate-500">Click the Fees icon on any student to open the breakdown and edit Tuition / Kit amounts</p>
          </div>
          <span class="text-xs text-slate-600 font-semibold">${students.length} Total Enrolled Trainees</span>
        </div>

        <div class="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50 text-slate-700 border-b border-slate-200">
                <tr>
                  <th class="py-3.5 px-4 font-bold uppercase">Student</th>
                  <th class="py-3.5 px-4 font-bold uppercase">Discipline</th>
                  <th class="py-3.5 px-4 font-bold uppercase">Tuition Status</th>
                  <th class="py-3.5 px-4 font-bold uppercase">Kit Status</th>
                  <th class="py-3.5 px-4 font-bold uppercase text-right">Fees Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${students.map((s) => {
                  const tuitionDue = (s.fees?.due || 0);
                  const kitDue = (s.kitFees?.due || 0);
                  return `
                    <tr class="hover:bg-slate-50">
                      <td class="py-3.5 px-4">
                        <div class="flex items-center gap-2">
                          <button onclick="window.openStudentProfileModal('${s._id || s.id}')" title="View Student Profile" class="w-8 h-8 rounded-full bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 flex items-center justify-center transition shrink-0">
                            <i class="fa-solid fa-id-card text-sm"></i>
                          </button>
                          <div>
                            <div class="font-bold text-slate-900">${s.name}</div>
                            <div class="text-[10px] text-slate-500 font-mono">ID: ${s.username}</div>
                          </div>
                        </div>
                      </td>
                      <td class="py-3.5 px-4 text-slate-700 font-semibold">${s.sport || 'General'}</td>
                      <td class="py-3.5 px-4">
                        ${tuitionDue > 0 ? `
                          <span class="px-2.5 py-1 rounded-full bg-red-50 text-sportsRed-600 border border-red-200 font-bold">
                            ₹${tuitionDue.toLocaleString()} Due
                          </span>
                        ` : `
                          <span class="px-2.5 py-1 rounded-full bg-green-50 text-sportsGreen-600 border border-green-200 font-bold">
                            Paid
                          </span>
                        `}
                      </td>
                      <td class="py-3.5 px-4">
                        ${kitDue > 0 ? `
                          <span class="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-bold">
                            ₹${kitDue.toLocaleString()} Due
                          </span>
                        ` : `
                          <span class="px-2.5 py-1 rounded-full bg-green-50 text-sportsGreen-600 border border-green-200 font-bold">
                            Paid
                          </span>
                        `}
                      </td>
                      <td class="py-3.5 px-4 text-right">
                        <button onclick="window.fees.openEditFeesModal('${s._id || s.id}', '${s.name}', '${s.sport}', ${s.fees?.total || 0}, ${s.fees?.paid || 0}, ${s.kitFees?.total || 0}, ${s.kitFees?.paid || 0})" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-brand-700 border border-brand-200 font-bold text-xs transition cursor-pointer shadow-xs">
                          <i class="fa-solid fa-receipt text-brand-600"></i>
                          <span>Fees</span>
                          ${(tuitionDue > 0 || kitDue > 0) ? '<span class="w-2 h-2 rounded-full bg-red-500"></span>' : '<span class="w-2 h-2 rounded-full bg-green-500"></span>'}
                        </button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  renderAdminSalariesTab(container, coaches) {
    container.innerHTML = `
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-base font-bold text-slate-900 font-display">Coach Salary & Disbursal Management</h3>
          <span class="text-xs text-slate-600 font-semibold">${coaches.length} Staff Members</span>
        </div>

        <div class="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50 text-slate-700 border-b border-slate-200">
                <tr>
                  <th class="py-3.5 px-4 font-bold uppercase">Coach Name</th>
                  <th class="py-3.5 px-4 font-bold uppercase">Role</th>
                  <th class="py-3.5 px-4 font-bold uppercase">Discipline</th>
                  <th class="py-3.5 px-4 font-bold uppercase">Monthly Salary</th>
                  <th class="py-3.5 px-4 font-bold uppercase">Status</th>
                  <th class="py-3.5 px-4 font-bold uppercase text-right">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${coaches.map((c) => `
                  <tr class="hover:bg-slate-50">
                    <td class="py-3.5 px-4">
                      <div class="font-bold text-slate-900">${c.name}</div>
                      <div class="text-[10px] text-slate-500 font-mono">ID: ${c.username}</div>
                    </td>
                    <td class="py-3.5 px-4">
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase ${c.role === 'head_coach' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}">
                        ${c.role === 'head_coach' ? 'Head Coach' : 'Discipline Coach'}
                      </span>
                    </td>
                    <td class="py-3.5 px-4 text-slate-700 font-semibold">${c.sport || 'Physical Fitness'}</td>
                    <td class="py-3.5 px-4 font-bold text-slate-900">₹${(c.coachSalary?.amount || 0).toLocaleString()}</td>
                    <td class="py-3.5 px-4">
                      <span class="px-2.5 py-1 rounded-full text-xs font-bold ${
                        c.coachSalary?.status === 'Paid'
                          ? 'bg-green-50 text-sportsGreen-600 border border-green-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }">
                        <i class="fa-solid ${c.coachSalary?.status === 'Paid' ? 'fa-check' : 'fa-clock'} mr-1"></i>
                        ${c.coachSalary?.status || 'Pending'}
                      </span>
                    </td>
                    <td class="py-3.5 px-4 text-right">
                      <button onclick="window.admin.openEditSalaryModal('${c._id || c.id}', '${c.name}', '${c.sport}', ${c.coachSalary?.amount || 0}, '${c.coachSalary?.status || 'Pending'}')" class="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-amber-700 border border-slate-300 font-bold text-xs transition cursor-pointer">
                        <i class="fa-solid fa-pen-to-square mr-1"></i> Set Salary
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  renderAdminCmsTab(container) {
    const info = state.academyInfo || {};
    const currentLogo = info.logoUrl || localStorage.getItem('vsa_custom_logo') || '';

    container.innerHTML = `
      <form id="form-cms-editor" onsubmit="window.cms.handleSave(event)" class="space-y-6">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-base font-bold text-slate-900 font-display">Live Website CMS & Official Branding Editor</h3>
            <p class="text-xs text-slate-500">Only Administrators have permission to upload logos and publish landing content.</p>
          </div>
          <button type="submit" class="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md shadow-brand-600/30 flex items-center gap-2 cursor-pointer">
            <i class="fa-solid fa-floppy-disk"></i> Save & Publish CMS
          </button>
        </div>

        <!-- Admin-Only Academy Logo Section -->
        <div class="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <h4 class="text-xs font-bold text-brand-700 uppercase tracking-wider flex items-center gap-2">
            <i class="fa-solid fa-shield-halved text-brand-600"></i> Official Academy Logo (Admin Only Accessible)
          </h4>
          <div class="flex flex-col sm:flex-row items-center gap-6">
            <div class="w-24 h-24 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden shrink-0">
              ${currentLogo ? `<img id="cms-logo-preview" src="${currentLogo}" class="w-full h-full object-contain p-1" />` : `<div id="cms-logo-preview" class="text-slate-400 text-center text-xs p-2"><i class="fa-solid fa-image text-2xl mb-1"></i><br/>No logo</div>`}
            </div>
            <div class="space-y-2 text-center sm:text-left">
              <label class="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-sm transition">
                <i class="fa-solid fa-cloud-arrow-up"></i> Choose Logo File
                <input type="file" accept="image/*" class="hidden" onchange="window.admin.handleAdminLogoUpload(event)" />
              </label>
              <p class="text-[11px] text-slate-500">Supports PNG, JPG, WebP, or SVG. Automatically syncs with the academy header banner.</p>
            </div>
          </div>
        </div>

        <div class="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Started Year</label>
              <input type="text" id="cms-startedYear" value="${info.startedYear || '2014'}" class="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-brand-500" />
            </div>
            <div class="sm:col-span-3">
              <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Disciplines (Comma separated)</label>
              <input type="text" id="cms-sports" value="${(info.sportsAvailable || []).join(', ')}" class="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-brand-500" />
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Academy Overview / About Text</label>
            <textarea id="cms-aboutText" rows="3" class="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-brand-500">${info.aboutText || ''}</textarea>
          </div>
        </div>

        <!-- Weekly Schedule Editor -->
        <div class="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div class="flex items-center justify-between">
            <h4 class="text-xs font-bold text-brand-700 uppercase tracking-wider">Weekly Schedule Items (6 Sports)</h4>
            <button type="button" onclick="window.cms.addScheduleRow()" class="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold cursor-pointer">
              <i class="fa-solid fa-plus mr-1"></i> Add Session
            </button>
          </div>
          <div id="cms-schedule-list" class="space-y-2">
            ${(info.weeklySchedule || []).map((s) => `
              <div class="grid grid-cols-4 gap-2 items-center p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <input type="text" value="${s.day}" placeholder="Day (e.g. Monday)" class="cms-sched-day px-2 py-1.5 rounded bg-white border border-slate-300 text-slate-900" />
                <input type="text" value="${s.sport}" placeholder="Sport" class="cms-sched-sport px-2 py-1.5 rounded bg-white border border-slate-300 text-slate-900" />
                <input type="text" value="${s.time}" placeholder="Time Slot" class="cms-sched-time px-2 py-1.5 rounded bg-white border border-slate-300 text-slate-900" />
                <div class="flex items-center gap-2">
                  <input type="text" value="${s.coach}" placeholder="Coach Name" class="cms-sched-coach w-full px-2 py-1.5 rounded bg-white border border-slate-300 text-slate-900" />
                  <button type="button" onclick="this.closest('.grid').remove()" class="text-sportsRed-600 hover:text-sportsRed-700 p-1 cursor-pointer"><i class="fa-solid fa-trash"></i></button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="flex justify-end">
          <button type="submit" class="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-md shadow-brand-600/30 flex items-center gap-2 cursor-pointer">
            <i class="fa-solid fa-floppy-disk"></i> Save & Publish CMS
          </button>
        </div>
      </form>
    `;
  },

  switchTab(tabId) {
    state.currentTab = tabId;
    this.render();
  },

  // -----------------------------------------------------------
  // 4.5 STUDENT PORTAL
  // -----------------------------------------------------------
  async renderStudentView(root) {
    root.innerHTML = `
      <div id="student-portal-wrapper" class="space-y-8">
        <div class="py-12 text-center text-slate-400"><i class="fa-solid fa-spinner fa-spin text-2xl"></i> Loading your athletic profile...</div>
      </div>
    `;

    try {
      const res = await api.get('/api/student/me');
      state.studentDashboardData = res;
      const profile = res.profile || {};
      const fees = res.fees || { total: 0, paid: 0, due: 0 };
      const kitFees = res.kitFees || { total: 0, paid: 0, due: 0 };
      const stats = res.attendanceStats || { totalSessions: 0, presentCount: 0, lateCount: 0, absentCount: 0, attendanceRate: 100 };
      const recent = res.recentAttendance || [];

      const tuitionPercent = fees.total > 0 ? Math.min(100, Math.round((fees.paid / fees.total) * 100)) : 100;
      const kitPercent = kitFees.total > 0 ? Math.min(100, Math.round((kitFees.paid / kitFees.total) * 100)) : 100;

      const wrapper = document.getElementById('student-portal-wrapper');
      if (!wrapper) return;

      wrapper.innerHTML = `
        <div class="space-y-8">

          <!-- Profile Banner -->
          <div class="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div class="flex items-center gap-4">
              <button onclick="window.openStudentProfileModal('${profile.id || state.user?._id || state.user?.id}')" class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-amber-500 flex items-center justify-center text-white text-2xl shadow-md hover:scale-105 transition" title="View Full Profile">
                <i class="fa-solid fa-id-card"></i>
              </button>
              <div>
                <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200 text-[11px] font-bold uppercase tracking-wider mb-1">
                  Enrolled Athlete
                </div>
                <h1 class="text-2xl sm:text-3xl font-black text-slate-900 font-display">${profile.name}</h1>
                <p class="text-xs text-slate-500">Allocated ID: <span class="font-mono text-slate-800 font-bold">${profile.username}</span> • Discipline: <span class="text-brand-600 font-bold">${profile.sport}</span></p>
              </div>
            </div>

            <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button onclick="window.openStudentProfileModal('${profile.id || state.user?._id || state.user?.id}')" class="px-4 py-2.5 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 font-bold text-xs flex items-center justify-center gap-2 transition">
                <i class="fa-solid fa-id-card"></i> View Full Profile
              </button>
              <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
                <div class="text-slate-500 font-bold uppercase text-[10px]">Assigned Coach:</div>
                <div class="font-bold text-slate-900 flex items-center gap-1.5">
                  <i class="fa-solid fa-whistle text-brand-600"></i> ${profile.assignedCoach?.name || 'Academy Coach'}
                </div>
                <div class="text-slate-500 text-[11px]"><i class="fa-solid fa-phone mr-1"></i> ${profile.assignedCoach?.phone || '+91 98765 11001'}</div>
              </div>
            </div>
          </div>

          <!-- Dual Fee Summary Cards -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            <!-- Tuition Fees -->
            <div class="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-5">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div class="w-9 h-9 rounded-xl bg-green-50 text-sportsGreen-600 border border-green-200 flex items-center justify-center">
                    <i class="fa-solid fa-graduation-cap"></i>
                  </div>
                  <h3 class="text-base font-bold text-slate-900 font-display">Academy Tuition Fees</h3>
                </div>
                <span class="px-2.5 py-1 rounded-full text-xs font-bold ${fees.due > 0 ? 'bg-red-50 text-sportsRed-600 border border-red-200' : 'bg-green-50 text-sportsGreen-600 border border-green-200'}">
                  ${fees.due > 0 ? `₹${fees.due.toLocaleString()} Due` : 'Fully Paid'}
                </span>
              </div>

              <div class="grid grid-cols-3 gap-3">
                <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div class="text-[11px] text-slate-500 font-semibold mb-1">Total Fee</div>
                  <div class="text-lg font-black text-slate-900 font-display">₹${fees.total.toLocaleString()}</div>
                </div>
                <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div class="text-[11px] text-slate-500 font-semibold mb-1">Paid Amount</div>
                  <div class="text-lg font-black text-sportsGreen-600 font-display">₹${fees.paid.toLocaleString()}</div>
                </div>
                <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div class="text-[11px] text-slate-500 font-semibold mb-1">Remaining Due</div>
                  <div class="text-lg font-black text-sportsRed-600 font-display">₹${fees.due.toLocaleString()}</div>
                </div>
              </div>

              <div>
                <div class="flex justify-between text-xs text-slate-500 mb-1.5 font-medium">
                  <span>Tuition Payment Progress</span>
                  <span class="font-bold text-slate-900">${tuitionPercent}%</span>
                </div>
                <div class="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div class="h-full bg-sportsGreen-600 rounded-full transition-all duration-500" style="width: ${tuitionPercent}%"></div>
                </div>
              </div>
            </div>

            <!-- Kit Fees -->
            <div class="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-5">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div class="w-9 h-9 rounded-xl bg-orange-50 text-brand-600 border border-orange-200 flex items-center justify-center">
                    <i class="fa-solid fa-shirt"></i>
                  </div>
                  <h3 class="text-base font-bold text-slate-900 font-display">Sports Kit & Uniform Fees</h3>
                </div>
                <span class="px-2.5 py-1 rounded-full text-xs font-bold ${kitFees.due > 0 ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-green-50 text-sportsGreen-600 border border-green-200'}">
                  ${kitFees.due > 0 ? `₹${kitFees.due.toLocaleString()} Due` : 'Kit Cleared'}
                </span>
              </div>

              <div class="grid grid-cols-3 gap-3">
                <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div class="text-[11px] text-slate-500 font-semibold mb-1">Kit Total</div>
                  <div class="text-lg font-black text-slate-900 font-display">₹${kitFees.total.toLocaleString()}</div>
                </div>
                <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div class="text-[11px] text-slate-500 font-semibold mb-1">Kit Paid</div>
                  <div class="text-lg font-black text-brand-600 font-display">₹${kitFees.paid.toLocaleString()}</div>
                </div>
                <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div class="text-[11px] text-slate-500 font-semibold mb-1">Kit Balance</div>
                  <div class="text-lg font-black text-amber-700 font-display">₹${kitFees.due.toLocaleString()}</div>
                </div>
              </div>

              <div>
                <div class="flex justify-between text-xs text-slate-500 mb-1.5 font-medium">
                  <span>Kit Payment Progress</span>
                  <span class="font-bold text-slate-900">${kitPercent}%</span>
                </div>
                <div class="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div class="h-full bg-brand-500 rounded-full transition-all duration-500" style="width: ${kitPercent}%"></div>
                </div>
              </div>
            </div>

          </div>

          <!-- Attendance Metric & Timetable -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div class="flex items-center justify-between">
                <h3 class="text-base font-bold text-slate-900 font-display flex items-center gap-2">
                  <i class="fa-solid fa-chart-line text-brand-600"></i> Attendance Metric & Logs
                </h3>
                <span class="px-2.5 py-1 rounded-full text-xs font-bold ${stats.attendanceRate >= 75 ? 'bg-green-50 text-sportsGreen-600 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}">
                  ${stats.attendanceRate}% Presence
                </span>
              </div>

              <div class="grid grid-cols-4 gap-2 text-center text-xs">
                <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span class="text-slate-500 font-semibold">Total</span>
                  <div class="text-lg font-black text-slate-900 mt-0.5">${stats.totalSessions}</div>
                </div>
                <div class="p-2.5 rounded-xl bg-green-50 border border-green-200">
                  <span class="text-sportsGreen-700 font-semibold">Present</span>
                  <div class="text-lg font-black text-sportsGreen-700 mt-0.5">${stats.presentCount}</div>
                </div>
                <div class="p-2.5 rounded-xl bg-amber-50 border border-amber-200">
                  <span class="text-amber-700 font-semibold">Late</span>
                  <div class="text-lg font-black text-amber-700 mt-0.5">${stats.lateCount}</div>
                </div>
                <div class="p-2.5 rounded-xl bg-red-50 border border-red-200">
                  <span class="text-sportsRed-700 font-semibold">Absent</span>
                  <div class="text-lg font-black text-sportsRed-700 mt-0.5">${stats.absentCount}</div>
                </div>
              </div>

              <div class="divide-y divide-slate-100 text-xs max-h-[220px] overflow-y-auto">
                ${recent.length === 0 ? `
                  <div class="py-4 text-center text-slate-400">No attendance sessions recorded yet.</div>
                ` : recent.map((att) => `
                  <div class="py-2.5 flex items-center justify-between">
                    <div>
                      <span class="font-mono text-slate-800 font-bold">${att.date}</span>
                      <span class="text-[10px] text-slate-500 ml-1.5 font-medium">${att.sport || profile.sport}</span>
                    </div>
                    <span class="px-2.5 py-0.5 rounded text-[11px] font-bold ${
                      att.status === 'Present' ? 'badge-present' : att.status === 'Late' ? 'badge-late' : 'badge-absent'
                    }">
                      ${att.status}
                    </span>
                  </div>
                `).join('')}
              </div>
            </div>

            <div class="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
              <h3 class="text-base font-bold text-slate-900 font-display flex items-center gap-2">
                <i class="fa-solid fa-clock text-amber-600"></i> My Discipline Timetable
              </h3>

              <div class="space-y-2 text-xs">
                ${(state.academyInfo?.weeklySchedule || [])
                  .filter((s) => !profile.sport || s.sport === profile.sport || s.sport.includes(profile.sport))
                  .map((s) => `
                    <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div>
                        <div class="font-bold text-slate-900">${s.day} • ${s.sport}</div>
                        <div class="text-slate-500 text-[11px]">Coach: ${s.coach}</div>
                      </div>
                      <span class="px-2.5 py-1 rounded-lg bg-brand-50 text-brand-700 border border-brand-200 font-mono font-bold">
                        ${s.time}
                      </span>
                    </div>
                  `).join('')}
              </div>
            </div>

          </div>

        </div>
      `;
    } catch (err) {
      const wrapper = document.getElementById('student-portal-wrapper');
      if (wrapper) {
        wrapper.innerHTML = `<div class="p-6 rounded-2xl bg-red-50 border border-red-200 text-sportsRed-600">${err.message}</div>`;
      }
    }
  }
};

window.router = router;

// -------------------------------------------------------------
// 5. Regular Coach Domain Controller (Workspace, Attendance List, Fees List)
// -------------------------------------------------------------
const coach = {
  switchTab(tab) {
    state.coachTab = tab;
    router.render();
  },

  selectSport(sportName) {
    state.selectedSportFilter = sportName;
    const activeLabel = document.getElementById('active-sport-label');
    if (activeLabel) activeLabel.textContent = sportName;
    router.render();
  },

  async onDateChange(newDate) {
    state.selectedDate = newDate;
    await this.loadCoachTabContent();
  },

  async loadCoachTabContent() {
    const container = document.getElementById('coach-tab-container');
    if (!container) return;

    if (state.coachTab === 'workspace') {
      await this.renderCoachWorkspaceTab(container);
    } else if (state.coachTab === 'student_profiles_coach') {
      try {
        const res = await api.get('/api/users?role=student');
        const students = res.data || [];
        container.innerHTML = `
          <div class="space-y-4">
            <div class="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div>
                <h3 class="text-base font-bold text-slate-900 font-display">Regular Student Profiles</h3>
                <p class="text-xs text-slate-500">View student details, fees, and about section (View-only access)</p>
              </div>
              <span class="text-xs font-semibold text-slate-600">${students.length} Active Students</span>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              ${students.map((s) => `
                <div class="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-brand-300 transition">
                  <div class="flex items-start gap-3 mb-3">
                    <button onclick="window.openStudentProfileModal('${s._id || s.id}')" class="w-12 h-12 rounded-full bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center text-brand-700 border-2 border-white shadow-sm">
                      <i class="fa-solid fa-id-card text-lg"></i>
                    </button>
                    <div class="flex-1 min-w-0">
                      <h4 class="font-bold text-slate-900 truncate">${s.name}</h4>
                      <p class="text-xs text-slate-500 font-mono">ID: ${s.username}</p>
                      <p class="text-xs text-brand-700 font-semibold">${s.sport || 'General'}</p>
                    </div>
                  </div>
                  <div class="space-y-2 text-xs">
                    <div class="p-2 rounded-lg bg-slate-50 border border-slate-200">
                      <span class="text-slate-500">Fees Due:</span> <span class="font-bold ${((s.fees?.due||0) + (s.kitFees?.due||0)) > 0 ? 'text-sportsRed-600' : 'text-sportsGreen-600'}">₹${((s.fees?.due||0) + (s.kitFees?.due||0)).toLocaleString('en-IN')}</span>
                    </div>
                    ${s.bio ? `<div class="p-2 rounded-lg bg-slate-50 border border-slate-200"><span class="text-slate-500 block mb-1">About:</span> <span class="text-slate-700 line-clamp-2">${s.bio}</span></div>` : ''}
                  </div>
                  <button onclick="window.openStudentProfileModal('${s._id || s.id}')" class="w-full mt-3 px-3 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition">
                    View Profile
                  </button>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      } catch (err) {
        container.innerHTML = `<div class="p-4 text-sportsRed-600 text-xs">${err.message}</div>`;
      }
    } else if (state.coachTab === 'attendance_list') {
      await this.renderCoachAttendanceListTab(container);
    } else if (state.coachTab === 'fees_list') {
      await this.renderCoachFeesListTab(container);
    }
  },

  // Sub-Tab 1: Interactive Training Grid & Today's Attendance Marking
  async renderCoachWorkspaceTab(container) {
    container.innerHTML = `
      <div class="space-y-6">
        <!-- 6-Sport Interactive Grid -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
              <i class="fa-solid fa-layer-group text-brand-600"></i> Select Sport Discipline (Universal Coach Access)
            </h3>
            <span class="text-xs text-brand-700 font-bold">Active: <span id="active-sport-label">${state.selectedSportFilter}</span></span>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
            ${ACADEMY_SPORTS.map((sport) => {
              const isActive = state.selectedSportFilter === sport.name;
              return `
                <button
                  type="button"
                  onclick="window.coach.selectSport('${sport.name}')"
                  class="p-4 sm:p-5 rounded-2xl border text-left transition duration-200 cursor-pointer flex items-center gap-3.5 sm:gap-4 ${
                    isActive
                      ? 'sport-card-active'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-xs'
                  }"
                >
                  <div class="w-12 h-12 rounded-xl bg-gradient-to-tr ${sport.gradient} flex items-center justify-center text-white text-xl shrink-0 shadow-sm">
                    <i class="fa-solid ${sport.icon}"></i>
                  </div>
                  <div class="min-w-0">
                    <div class="font-bold text-slate-900 text-sm sm:text-base font-display truncate">${sport.name}</div>
                    <div class="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1 font-medium">
                      ${isActive ? '<span class="text-sportsGreen-700 font-bold"><i class="fa-solid fa-circle-check"></i> Active</span>' : '<span>Click to select</span>'}
                    </div>
                  </div>
                </button>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Date & Batch Mark Controls -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div class="flex items-center gap-3">
            <span class="text-xs font-bold text-slate-700 uppercase">Training Date:</span>
            <input type="date" id="coach-student-date" value="${state.selectedDate}" onchange="window.coach.onDateChange(this.value)" class="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs font-medium focus:outline-none focus:border-brand-500" />
          </div>
          <div class="flex items-center gap-3">
            <button onclick="window.coach.markAllPresent()" class="px-3.5 py-1.5 rounded-xl bg-sportsGreen-50 text-sportsGreen-700 hover:bg-sportsGreen-600 hover:text-white border border-sportsGreen-200 text-xs font-bold transition shadow-xs cursor-pointer">
              <i class="fa-solid fa-check-double mr-1"></i> Mark All Present
            </button>
            <div class="text-xs text-slate-600 font-semibold">
              Discipline: <span class="text-slate-900">${state.selectedSportFilter}</span>
            </div>
          </div>
        </div>

        <div id="coach-student-roster-content"></div>
      </div>
    `;

    const rosterContent = document.getElementById('coach-student-roster-content');
    try {
      const currentSport = state.selectedSportFilter;
      const [studentsRes, attRes] = await Promise.all([
        api.get(`/api/users?role=student&sport=${encodeURIComponent(currentSport)}`),
        api.get(`/api/attendance?role=student&sport=${encodeURIComponent(currentSport)}`)
      ]);

      const students = studentsRes.data || [];
      const allAtt = attRes.data || [];
      const todayRecords = allAtt.filter((a) => a.date === state.selectedDate);

      if (students.length === 0) {
        rosterContent.innerHTML = `
          <div class="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-xs text-slate-500 text-sm">
            <i class="fa-solid fa-user-xmark text-2xl text-slate-400 mb-2"></i>
            <p>No students enrolled in <span class="text-slate-900 font-bold">${currentSport}</span>.</p>
          </div>
        `;
        return;
      }

      rosterContent.innerHTML = `
        <div class="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50 text-slate-700 border-b border-slate-200">
                <tr>
                  <th class="py-3 px-4 font-bold uppercase">Student Trainee</th>
                  <th class="py-3 px-4 font-bold uppercase">Today's Attendance</th>
                  <th class="py-3 px-4 font-bold uppercase text-right">Student Fees</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${students.map((s) => {
                  const rec = todayRecords.find((r) => (r.targetUserId?._id || r.targetUserId) === (s._id || s.id));
                  const status = rec ? rec.status : 'Unmarked';
                  const tuitionDue = (s.fees?.due || 0);
                  const kitDue = (s.kitFees?.due || 0);
                  const hasDue = tuitionDue > 0 || kitDue > 0;

                  return `
                    <tr class="hover:bg-slate-50">
                      <td class="py-3.5 px-4">
                        <div class="flex items-center gap-2">
                          <button onclick="window.openStudentProfileModal('${s._id || s.id}')" title="View Student Profile" class="w-8 h-8 rounded-full bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 flex items-center justify-center transition shrink-0">
                            <i class="fa-solid fa-id-card text-sm"></i>
                          </button>
                          <div>
                            <div class="font-bold text-slate-900 text-sm">${s.name}</div>
                            <div class="text-[10px] text-slate-500 font-mono">ID: ${s.username} • Sport: ${s.sport}</div>
                          </div>
                        </div>
                      </td>
                      <td class="py-3.5 px-4">
                        <div class="flex items-center gap-2">
                          <span class="px-2.5 py-0.5 rounded text-[11px] font-bold ${
                            status === 'Present' ? 'badge-present' : status === 'Late' ? 'badge-late' : status === 'Absent' ? 'badge-absent' : 'bg-slate-100 text-slate-600'
                          }">
                            ${status}
                          </span>
                          <div class="inline-flex gap-1">
                            <button onclick="window.coach.markAttendance('${s._id || s.id}', 'Present')" class="px-2.5 py-1 rounded-md text-[11px] font-bold bg-green-50 text-sportsGreen-700 hover:bg-sportsGreen-600 hover:text-white border border-green-200 transition cursor-pointer">P</button>
                            <button onclick="window.coach.markAttendance('${s._id || s.id}', 'Late')" class="px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 hover:bg-amber-600 hover:text-white border border-amber-200 transition cursor-pointer">L</button>
                            <button onclick="window.coach.markAttendance('${s._id || s.id}', 'Absent')" class="px-2.5 py-1 rounded-md text-[11px] font-bold bg-red-50 text-sportsRed-700 hover:bg-sportsRed-600 hover:text-white border border-red-200 transition cursor-pointer">A</button>
                          </div>
                        </div>
                      </td>
                      <td class="py-3.5 px-4 text-right">
                        <!-- Fees icon button: only shows after clicking it then updation -->
                        <button onclick="window.fees.openEditFeesModal('${s._id || s.id}', '${s.name}', '${s.sport}', ${s.fees?.total || 0}, ${s.fees?.paid || 0}, ${s.kitFees?.total || 0}, ${s.kitFees?.paid || 0})" title="Click to view full fee breakdown and update" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 font-bold text-xs shadow-xs transition cursor-pointer">
                          <i class="fa-solid fa-receipt text-brand-600 text-sm"></i>
                          <span>Fees</span>
                          ${hasDue ? '<span class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>' : '<span class="w-2 h-2 rounded-full bg-green-500"></span>'}
                        </button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    } catch (err) {
      rosterContent.innerHTML = `<div class="p-4 text-sportsRed-600 text-xs font-semibold">${err.message}</div>`;
    }
  },

  // Sub-Tab 2: Attendance View as List
  async renderCoachAttendanceListTab(container) {
    try {
      const recordsRes = await api.get('/api/attendance?role=student');
      const records = recordsRes.data || [];

      container.innerHTML = `
        <div class="space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div>
              <h3 class="text-base font-bold text-slate-900 font-display">Student Attendance History (List View)</h3>
              <p class="text-xs text-slate-500">Complete historical attendance logs for student trainees.</p>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-slate-700">Total Logs:</span>
              <span class="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 font-bold text-xs">${records.length}</span>
            </div>
          </div>

          <div class="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead class="bg-slate-50 text-slate-700 border-b border-slate-200">
                  <tr>
                    <th class="py-3 px-4 font-bold uppercase">Date</th>
                    <th class="py-3 px-4 font-bold uppercase">Student Name</th>
                    <th class="py-3 px-4 font-bold uppercase">Discipline</th>
                    <th class="py-3 px-4 font-bold uppercase">Status</th>
                    <th class="py-3 px-4 font-bold uppercase">Marked By</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  ${records.length === 0 ? `
                    <tr><td colspan="5" class="py-8 text-center text-slate-400">No attendance records found.</td></tr>
                  ` : records.map((r) => `
                    <tr class="hover:bg-slate-50">
                      <td class="py-3 px-4 font-mono font-bold text-slate-900">${r.date}</td>
                      <td class="py-3 px-4 font-bold text-slate-900">${r.targetUserId?.name || 'Student'}</td>
                      <td class="py-3 px-4 text-slate-700 font-medium">${r.sport || r.targetUserId?.sport || 'General'}</td>
                      <td class="py-3 px-4">
                        <span class="px-2.5 py-0.5 rounded text-[11px] font-bold ${
                          r.status === 'Present' ? 'badge-present' : r.status === 'Late' ? 'badge-late' : 'badge-absent'
                        }">
                          ${r.status}
                        </span>
                      </td>
                      <td class="py-3 px-4 text-slate-500">${r.markedBy?.name || 'Coach'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div class="p-4 text-sportsRed-600 text-xs">${err.message}</div>`;
    }
  },

  // Sub-Tab 3: Fees View as List
  async renderCoachFeesListTab(container) {
    try {
      const studentsRes = await api.get('/api/users?role=student');
      const students = studentsRes.data || [];

      container.innerHTML = `
        <div class="space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div>
              <h3 class="text-base font-bold text-slate-900 font-display">Student Fees Ledger (List View)</h3>
              <p class="text-xs text-slate-500">View Tuition Fees and Sports Kit Fees. Click Fees icon to view details & update.</p>
            </div>
            <span class="text-xs text-slate-600 font-semibold">${students.length} Total Enrolled Trainees</span>
          </div>

          <div class="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead class="bg-slate-50 text-slate-700 border-b border-slate-200">
                  <tr>
                    <th class="py-3.5 px-4 font-bold uppercase">Student</th>
                    <th class="py-3.5 px-4 font-bold uppercase">Discipline</th>
                    <th class="py-3.5 px-4 font-bold uppercase">Tuition Status</th>
                    <th class="py-3.5 px-4 font-bold uppercase">Kit Status</th>
                    <th class="py-3.5 px-4 font-bold uppercase text-right">Fees Action</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  ${students.map((s) => {
                    const tuitionDue = (s.fees?.due || 0);
                    const kitDue = (s.kitFees?.due || 0);
                    return `
                      <tr class="hover:bg-slate-50">
                        <td class="py-3.5 px-4">
                          <div class="flex items-center gap-2">
                            <button onclick="window.openStudentProfileModal('${s._id || s.id}')" title="View Student Profile" class="w-8 h-8 rounded-full bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 flex items-center justify-center transition shrink-0">
                              <i class="fa-solid fa-id-card text-sm"></i>
                            </button>
                            <div>
                              <div class="font-bold text-slate-900 text-sm">${s.name}</div>
                              <div class="text-[10px] text-slate-500 font-mono">ID: ${s.username}</div>
                            </div>
                          </div>
                        </td>
                        <td class="py-3.5 px-4 text-slate-700 font-semibold">${s.sport || 'General'}</td>
                        <td class="py-3.5 px-4">
                          ${tuitionDue > 0 ? `
                            <span class="px-2.5 py-1 rounded-full bg-red-50 text-sportsRed-600 border border-red-200 font-bold">
                              ₹${tuitionDue.toLocaleString()} Due
                            </span>
                          ` : `
                            <span class="px-2.5 py-1 rounded-full bg-green-50 text-sportsGreen-600 border border-green-200 font-bold">
                              Paid
                            </span>
                          `}
                        </td>
                        <td class="py-3.5 px-4">
                          ${kitDue > 0 ? `
                            <span class="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-bold">
                              ₹${kitDue.toLocaleString()} Due
                            </span>
                          ` : `
                            <span class="px-2.5 py-1 rounded-full bg-green-50 text-sportsGreen-600 border border-green-200 font-bold">
                              Paid
                            </span>
                          `}
                        </td>
                        <td class="py-3.5 px-4 text-right">
                          <button onclick="window.fees.openEditFeesModal('${s._id || s.id}', '${s.name}', '${s.sport}', ${s.fees?.total || 0}, ${s.fees?.paid || 0}, ${s.kitFees?.total || 0}, ${s.kitFees?.paid || 0})" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-brand-700 border border-brand-200 font-bold text-xs transition cursor-pointer shadow-xs">
                            <i class="fa-solid fa-receipt text-brand-600"></i>
                            <span>Fees</span>
                            ${(tuitionDue > 0 || kitDue > 0) ? '<span class="w-2 h-2 rounded-full bg-red-500"></span>' : '<span class="w-2 h-2 rounded-full bg-green-500"></span>'}
                          </button>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div class="p-4 text-sportsRed-600 text-xs">${err.message}</div>`;
    }
  },

  async markAttendance(targetUserId, status) {
    try {
      const date = state.selectedDate;
      const sport = state.selectedSportFilter;
      await api.post('/api/attendance/student', { targetUserId, date, status, sport });
      ui.toast(`Marked student as ${status} for ${sport}`, 'success');
      if (state.user?.role === 'head_coach') {
        await headCoach.loadHeadCoachTabContent();
      } else {
        await this.loadCoachTabContent();
      }
    } catch (err) {
      ui.toast(err.message || 'Error recording student attendance', 'error');
    }
  },

  async markAllPresent() {
    try {
      const currentSport = state.selectedSportFilter;
      const studentsRes = await api.get(`/api/users?role=student&sport=${encodeURIComponent(currentSport)}`);
      const students = studentsRes.data || [];
      const date = state.selectedDate;

      for (const s of students) {
        await api.post('/api/attendance/student', {
          targetUserId: s._id || s.id,
          date,
          status: 'Present',
          sport: currentSport
        });
      }

      ui.toast(`Marked all ${students.length} ${currentSport} students as Present!`, 'success');
      if (state.user?.role === 'head_coach') {
        await headCoach.loadHeadCoachTabContent();
      } else {
        await this.loadCoachTabContent();
      }
    } catch (err) {
      ui.toast(err.message || 'Error batch marking attendance', 'error');
    }
  }
};

window.coach = coach;

// -------------------------------------------------------------
// 6. Fees Domain Controller (Opens only on click -> Updation)
// -------------------------------------------------------------
const fees = {
  openEditFeesModal(id, name, sport, tuitionTotal, tuitionPaid, kitTotal = 0, kitPaid = 0) {
    document.getElementById('edit-fee-student-id').value = id;
    document.getElementById('edit-fee-student-name').textContent = name;
    document.getElementById('edit-fee-student-sport').textContent = sport || 'General';

    document.getElementById('edit-fee-total').value = tuitionTotal;
    document.getElementById('edit-fee-paid').value = tuitionPaid;
    document.getElementById('edit-kit-total').value = kitTotal;
    document.getElementById('edit-kit-paid').value = kitPaid;

    this.recalcDue();
    ui.openModal('modal-edit-fees');
  },

  recalcDue() {
    const tTotal = Number(document.getElementById('edit-fee-total').value || 0);
    const tPaid = Number(document.getElementById('edit-fee-paid').value || 0);
    const tDue = Math.max(0, tTotal - tPaid);
    const tPreview = document.getElementById('edit-fee-due-preview');
    if (tPreview) tPreview.textContent = `Due: ₹${tDue.toLocaleString()}`;

    const kTotal = Number(document.getElementById('edit-kit-total').value || 0);
    const kPaid = Number(document.getElementById('edit-kit-paid').value || 0);
    const kDue = Math.max(0, kTotal - kPaid);
    const kPreview = document.getElementById('edit-kit-due-preview');
    if (kPreview) kPreview.textContent = `Kit Due: ₹${kDue.toLocaleString()}`;
  },

  async handleEditFeesSubmit(e) {
    e.preventDefault();
    try {
      const id = document.getElementById('edit-fee-student-id').value;
      const total = Number(document.getElementById('edit-fee-total').value);
      const paid = Number(document.getElementById('edit-fee-paid').value);
      const kitTotal = Number(document.getElementById('edit-kit-total').value);
      const kitPaid = Number(document.getElementById('edit-kit-paid').value);
      const paymentMethod = document.getElementById('edit-fee-payment-method').value;

      await api.put(`/api/students/${id}/fees`, {
        total,
        paid,
        kitTotal,
        kitPaid,
        paymentMethod
      });

      ui.toast('Student fees updated and saved successfully!', 'success');
      ui.closeModal('modal-edit-fees');

      if (state.user.role === 'admin') {
        router.loadAdminTabData();
      } else if (state.user.role === 'coach') {
        coach.loadCoachTabContent();
      } else if (state.user.role === 'head_coach') {
        headCoach.loadHeadCoachTabContent();
      }
    } catch (err) {
      ui.toast(err.message || 'Error saving fee record', 'error');
    }
  }
};

window.fees = fees;

// -------------------------------------------------------------
// 7. Head Coach Domain Controller
// -------------------------------------------------------------
const headCoach = {
  switchTab(tab) {
    state.headCoachTab = tab;
    router.render();
  },

  async onDateChange(newDate) {
    state.selectedDate = newDate;
    await this.loadHeadCoachTabContent();
  },

  async loadHeadCoachTabContent() {
    const container = document.getElementById('headcoach-tab-container');
    if (!container) return;

    if (state.headCoachTab === 'supervision') {
      await this.renderSupervisionTab(container);
    } else if (state.headCoachTab === 'coach_attendance_list') {
      await this.renderCoachAttendanceListTab(container);
    } else if (state.headCoachTab === 'student_grid') {
      await coach.renderCoachWorkspaceTab(container);
    } else if (state.headCoachTab === 'student_profiles_hc') {
      try {
        const res = await api.get('/api/users?role=student');
        const students = res.data || [];
        container.innerHTML = `
          <div class="space-y-4">
            <div class="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div>
                <h3 class="text-base font-bold text-slate-900 font-display">Regular Student Profiles</h3>
                <p class="text-xs text-slate-500">View complete profiles, details, fees, and about section for all active students</p>
              </div>
              <span class="text-xs font-semibold text-slate-600">${students.length} Active Students</span>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              ${students.map((s) => `
                <div class="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-brand-300 transition">
                  <div class="flex items-start gap-3 mb-3">
                    <button onclick="window.openStudentProfileModal('${s._id || s.id}')" class="w-12 h-12 rounded-full bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center text-brand-700 border-2 border-white shadow-sm hover:scale-105 transition">
                      <i class="fa-solid fa-id-card text-lg"></i>
                    </button>
                    <div class="flex-1 min-w-0">
                      <h4 class="font-bold text-slate-900 truncate">${s.name}</h4>
                      <p class="text-xs text-slate-500 font-mono">ID: ${s.username}</p>
                      <p class="text-xs text-brand-700 font-semibold">${s.sport || 'General'}</p>
                    </div>
                  </div>
                  <div class="space-y-2 text-xs">
                    <div class="p-2 rounded-lg bg-slate-50 border border-slate-200">
                      <span class="text-slate-500">Parent:</span> <span class="font-semibold text-slate-900">${s.parentName || 'N/A'}</span>
                    </div>
                    <div class="p-2 rounded-lg bg-slate-50 border border-slate-200">
                      <span class="text-slate-500">Fees Due:</span> <span class="font-bold ${((s.fees?.due||0) + (s.kitFees?.due||0)) > 0 ? 'text-sportsRed-600' : 'text-sportsGreen-600'}">₹${((s.fees?.due||0) + (s.kitFees?.due||0)).toLocaleString('en-IN')}</span>
                    </div>
                    ${s.bio ? `<div class="p-2 rounded-lg bg-slate-50 border border-slate-200"><span class="text-slate-500 block mb-1">About:</span> <span class="text-slate-700 line-clamp-2">${s.bio}</span></div>` : ''}
                  </div>
                  <button onclick="window.openStudentProfileModal('${s._id || s.id}')" class="w-full mt-3 px-3 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition">
                    View Full Profile
                  </button>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      } catch (err) {
        container.innerHTML = `<div class="p-4 text-sportsRed-600 text-xs">${err.message}</div>`;
      }
    } else if (state.headCoachTab === 'student_attendance_list') {
      await this.renderStudentAttendanceListTab(container);
    } else if (state.headCoachTab === 'fees_list') {
      await this.renderHeadCoachFeesListTab(container);
    }
  },

  async renderSupervisionTab(container) {
    container.innerHTML = `
      <div class="space-y-6">
        <!-- 6 Sports Overview Grid -->
        <div class="space-y-3">
          <h3 class="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
            <i class="fa-solid fa-network-wired text-brand-600"></i> Coaching Staff by Discipline
          </h3>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-4" id="headcoach-sports-grid">
            ${ACADEMY_SPORTS.map((sport) => `
              <div class="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3.5">
                <div class="w-11 h-11 rounded-xl bg-gradient-to-tr ${sport.gradient} flex items-center justify-center text-white text-lg shrink-0 shadow-xs">
                  <i class="fa-solid ${sport.icon}"></i>
                </div>
                <div class="min-w-0">
                  <h4 class="font-bold text-slate-900 text-sm font-display truncate">${sport.name}</h4>
                  <p class="text-[11px] text-slate-500 mt-0.5 font-medium" id="hc-coach-${sport.name.replace(/\s+/g, '-')}">Loading coach...</p>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Coach Daily Attendance Marker -->
        <div class="space-y-4">
          <div class="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div class="flex items-center gap-3">
              <span class="text-xs font-bold text-slate-700 uppercase">Attendance Date:</span>
              <input type="date" id="head-coach-date" value="${state.selectedDate}" onchange="window.headCoach.onDateChange(this.value)" class="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs font-medium focus:outline-none focus:border-brand-500" />
            </div>
            <span class="text-xs text-brand-700 font-bold">Universal Coach Attendance</span>
          </div>

          <div id="head-coach-roster" class="space-y-3">
            <div class="p-8 text-center text-slate-400"><i class="fa-solid fa-spinner fa-spin text-xl"></i> Loading coaches...</div>
          </div>
        </div>
      </div>
    `;

    const rosterContainer = document.getElementById('head-coach-roster');
    try {
      const [coachesRes, attRes] = await Promise.all([
        api.get('/api/users?role=coach'),
        api.get(`/api/attendance?role=coach&date=${state.selectedDate}`)
      ]);

      const coaches = coachesRes.data || [];
      const todayRecords = attRes.data || [];

      ACADEMY_SPORTS.forEach((sport) => {
        const el = document.getElementById(`hc-coach-${sport.name.replace(/\s+/g, '-')}`);
        if (el) {
          const match = coaches.find((c) => (c.sport || '').toLowerCase() === sport.name.toLowerCase());
          el.textContent = match ? `Coach: ${match.name}` : 'Coach: Assigned Staff';
        }
      });

      rosterContainer.innerHTML = coaches.map((c) => {
        const rec = todayRecords.find((r) => (r.targetUserId?._id || r.targetUserId) === (c._id || c.id));
        const status = rec ? rec.status : 'Unmarked';
        return `
          <div class="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold">
                <i class="fa-solid fa-whistle"></i>
              </div>
              <div>
                <h4 class="font-bold text-slate-900 text-sm">${c.name}</h4>
                <p class="text-xs text-slate-500 font-medium">Sport: <span class="text-brand-600 font-bold">${c.sport}</span> • Phone: ${c.phone || '—'}</p>
              </div>
            </div>

            <div class="flex items-center gap-3 self-end sm:self-auto">
              <span class="px-2.5 py-1 rounded-full text-xs font-bold ${
                status === 'Present' ? 'badge-present' : status === 'Late' ? 'badge-late' : status === 'Absent' ? 'badge-absent' : 'bg-slate-100 text-slate-600'
              }">
                ${status}
              </span>

              <div class="inline-flex gap-1">
                <button onclick="window.headCoach.markAttendance('${c._id || c.id}', 'Present', '${c.sport}')" class="px-3 py-1.5 rounded-lg text-xs font-bold bg-green-50 text-sportsGreen-700 hover:bg-sportsGreen-600 hover:text-white border border-green-200 transition cursor-pointer">
                  Present
                </button>
                <button onclick="window.headCoach.markAttendance('${c._id || c.id}', 'Late', '${c.sport}')" class="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 hover:bg-amber-600 hover:text-white border border-amber-200 transition cursor-pointer">
                  Late
                </button>
                <button onclick="window.headCoach.markAttendance('${c._id || c.id}', 'Absent', '${c.sport}')" class="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-50 text-sportsRed-700 hover:bg-sportsRed-600 hover:text-white border border-red-200 transition cursor-pointer">
                  Absent
                </button>
              </div>
            </div>
          </div>
        `;
      }).join('');
    } catch (err) {
      rosterContainer.innerHTML = `<div class="p-4 text-sportsRed-600 text-xs">${err.message}</div>`;
    }
  },

  // Head Coach Sub-Tab 2: Coach Attendance List
  async renderCoachAttendanceListTab(container) {
    try {
      const recordsRes = await api.get('/api/attendance?role=coach');
      const records = recordsRes.data || [];

      container.innerHTML = `
        <div class="space-y-4">
          <div class="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div>
              <h3 class="text-base font-bold text-slate-900 font-display">Coach Attendance Records (List View)</h3>
              <p class="text-xs text-slate-500">Historical presence logs for all academy coaches across 6 sports.</p>
            </div>
            <span class="text-xs font-bold text-slate-700">Total Logs: ${records.length}</span>
          </div>

          <div class="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead class="bg-slate-50 text-slate-700 border-b border-slate-200">
                  <tr>
                    <th class="py-3 px-4 font-bold uppercase">Date</th>
                    <th class="py-3 px-4 font-bold uppercase">Coach Name</th>
                    <th class="py-3 px-4 font-bold uppercase">Discipline</th>
                    <th class="py-3 px-4 font-bold uppercase">Status</th>
                    <th class="py-3 px-4 font-bold uppercase">Marked By</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  ${records.length === 0 ? `
                    <tr><td colspan="5" class="py-8 text-center text-slate-400">No coach attendance logs found.</td></tr>
                  ` : records.map((r) => `
                    <tr class="hover:bg-slate-50">
                      <td class="py-3 px-4 font-mono font-bold text-slate-900">${r.date}</td>
                      <td class="py-3 px-4 font-bold text-slate-900">${r.targetUserId?.name || 'Coach'}</td>
                      <td class="py-3 px-4 text-slate-700 font-medium">${r.sport || r.targetUserId?.sport || 'General'}</td>
                      <td class="py-3 px-4">
                        <span class="px-2.5 py-0.5 rounded text-[11px] font-bold ${
                          r.status === 'Present' ? 'badge-present' : r.status === 'Late' ? 'badge-late' : 'badge-absent'
                        }">
                          ${r.status}
                        </span>
                      </td>
                      <td class="py-3 px-4 text-slate-500">${r.markedBy?.name || 'Head Coach'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div class="p-4 text-sportsRed-600 text-xs">${err.message}</div>`;
    }
  },

  // Head Coach Sub-Tab 3: Student Attendance List
  async renderStudentAttendanceListTab(container) {
    try {
      const recordsRes = await api.get('/api/attendance?role=student');
      const records = recordsRes.data || [];

      container.innerHTML = `
        <div class="space-y-4">
          <div class="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div>
              <h3 class="text-base font-bold text-slate-900 font-display">Student Trainees Attendance (List View)</h3>
              <p class="text-xs text-slate-500">Universal academy student attendance records across all disciplines.</p>
            </div>
            <span class="text-xs font-bold text-slate-700">Total Logs: ${records.length}</span>
          </div>

          <div class="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead class="bg-slate-50 text-slate-700 border-b border-slate-200">
                  <tr>
                    <th class="py-3 px-4 font-bold uppercase">Date</th>
                    <th class="py-3 px-4 font-bold uppercase">Student Name</th>
                    <th class="py-3 px-4 font-bold uppercase">Discipline</th>
                    <th class="py-3 px-4 font-bold uppercase">Status</th>
                    <th class="py-3 px-4 font-bold uppercase">Recorded By</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  ${records.length === 0 ? `
                    <tr><td colspan="5" class="py-8 text-center text-slate-400">No student attendance logs found.</td></tr>
                  ` : records.map((r) => `
                    <tr class="hover:bg-slate-50">
                      <td class="py-3 px-4 font-mono font-bold text-slate-900">${r.date}</td>
                      <td class="py-3 px-4 font-bold text-slate-900">${r.targetUserId?.name || 'Student'}</td>
                      <td class="py-3 px-4 text-slate-700 font-medium">${r.sport || r.targetUserId?.sport || 'General'}</td>
                      <td class="py-3 px-4">
                        <span class="px-2.5 py-0.5 rounded text-[11px] font-bold ${
                          r.status === 'Present' ? 'badge-present' : r.status === 'Late' ? 'badge-late' : 'badge-absent'
                        }">
                          ${r.status}
                        </span>
                      </td>
                      <td class="py-3 px-4 text-slate-500">${r.markedBy?.name || 'Coach'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div class="p-4 text-sportsRed-600 text-xs">${err.message}</div>`;
    }
  },

  // Head Coach Sub-Tab 4: Academy Fees List
  async renderHeadCoachFeesListTab(container) {
    try {
      const studentsRes = await api.get('/api/users?role=student');
      const students = studentsRes.data || [];

      container.innerHTML = `
        <div class="space-y-4">
          <div class="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div>
              <h3 class="text-base font-bold text-slate-900 font-display">Academy Trainee Fees (List View)</h3>
              <p class="text-xs text-slate-500">Overview of tuition and kit fee accounts across all 6 sports disciplines.</p>
            </div>
            <span class="text-xs text-slate-600 font-semibold">${students.length} Total Enrolled Trainees</span>
          </div>

          <div class="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead class="bg-slate-50 text-slate-700 border-b border-slate-200">
                  <tr>
                    <th class="py-3.5 px-4 font-bold uppercase">Student</th>
                    <th class="py-3.5 px-4 font-bold uppercase">Discipline</th>
                    <th class="py-3.5 px-4 font-bold uppercase">Tuition Status</th>
                    <th class="py-3.5 px-4 font-bold uppercase">Kit Status</th>
                    <th class="py-3.5 px-4 font-bold uppercase text-right">Fees Action</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  ${students.map((s) => {
                    const tuitionDue = (s.fees?.due || 0);
                    const kitDue = (s.kitFees?.due || 0);
                    return `
                      <tr class="hover:bg-slate-50">
                        <td class="py-3.5 px-4">
                          <div class="flex items-center gap-2">
                            <button onclick="window.openStudentProfileModal('${s._id || s.id}')" title="View Student Profile" class="w-8 h-8 rounded-full bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 flex items-center justify-center transition shrink-0">
                              <i class="fa-solid fa-id-card text-sm"></i>
                            </button>
                            <div>
                              <div class="font-bold text-slate-900 text-sm">${s.name}</div>
                              <div class="text-[10px] text-slate-500 font-mono">ID: ${s.username}</div>
                            </div>
                          </div>
                        </td>
                        <td class="py-3.5 px-4 text-slate-700 font-semibold">${s.sport || 'General'}</td>
                        <td class="py-3.5 px-4">
                          ${tuitionDue > 0 ? `
                            <span class="px-2.5 py-1 rounded-full bg-red-50 text-sportsRed-600 border border-red-200 font-bold">
                              ₹${tuitionDue.toLocaleString()} Due
                            </span>
                          ` : `
                            <span class="px-2.5 py-1 rounded-full bg-green-50 text-sportsGreen-600 border border-green-200 font-bold">
                              Paid
                            </span>
                          `}
                        </td>
                        <td class="py-3.5 px-4">
                          ${kitDue > 0 ? `
                            <span class="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-bold">
                              ₹${kitDue.toLocaleString()} Due
                            </span>
                          ` : `
                            <span class="px-2.5 py-1 rounded-full bg-green-50 text-sportsGreen-600 border border-green-200 font-bold">
                              Paid
                            </span>
                          `}
                        </td>
                        <td class="py-3.5 px-4 text-right">
                          <button onclick="window.fees.openEditFeesModal('${s._id || s.id}', '${s.name}', '${s.sport}', ${s.fees?.total || 0}, ${s.fees?.paid || 0}, ${s.kitFees?.total || 0}, ${s.kitFees?.paid || 0})" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-brand-700 border border-brand-200 font-bold text-xs transition cursor-pointer shadow-xs">
                            <i class="fa-solid fa-receipt text-brand-600"></i>
                            <span>Fees</span>
                            ${(tuitionDue > 0 || kitDue > 0) ? '<span class="w-2 h-2 rounded-full bg-red-500"></span>' : '<span class="w-2 h-2 rounded-full bg-green-500"></span>'}
                          </button>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div class="p-4 text-sportsRed-600 text-xs">${err.message}</div>`;
    }
  },

  async markAttendance(targetUserId, status, sport) {
    try {
      const date = state.selectedDate;
      await api.post('/api/attendance/coach', { targetUserId, date, status, sport });
      ui.toast(`Recorded coach attendance: ${status}`, 'success');
      await this.loadHeadCoachTabContent();
    } catch (err) {
      ui.toast(err.message || 'Error recording attendance', 'error');
    }
  },

  openAddStudentModal() {
    const form = document.getElementById('form-add-student-hc');
    if (form) form.reset();
    document.getElementById('hc-student-password').value = '';
    document.getElementById('hc-student-total-fee').value = '18000';
    document.getElementById('hc-student-paid-fee').value = '10000';
    document.getElementById('hc-student-kit-total').value = '4000';
    document.getElementById('hc-student-kit-paid').value = '2000';
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('hc-student-enrollment-date').value = today;
    ui.openModal('modal-add-student-hc');
  },

  async handleAddStudentSubmit(e) {
    e.preventDefault();
    try {
      const username = document.getElementById('hc-student-username').value.trim();
      const password = document.getElementById('hc-student-password').value;
      const name = document.getElementById('hc-student-name').value.trim();
      const phone = document.getElementById('hc-student-phone').value.trim();
      const sport = document.getElementById('hc-student-sport').value;
      const parentName = document.getElementById('hc-student-parent').value.trim();
      const address = document.getElementById('hc-student-address').value.trim();
      const enrollmentDate = document.getElementById('hc-student-enrollment-date').value || null;
      const bio = document.getElementById('hc-student-bio').value.trim();

      const totalFee = Number(document.getElementById('hc-student-total-fee').value || 0);
      const paidFee = Number(document.getElementById('hc-student-paid-fee').value || 0);
      const kitTotal = Number(document.getElementById('hc-student-kit-total').value || 0);
      const kitPaid = Number(document.getElementById('hc-student-kit-paid').value || 0);

      const payload = {
        username,
        password,
        name,
        sport,
        phone,
        parentName,
        address,
        enrollmentDate,
        bio,
        fees: {
          total: totalFee,
          paid: paidFee,
          due: Math.max(0, totalFee - paidFee)
        },
        kitFees: {
          total: kitTotal,
          paid: kitPaid,
          due: Math.max(0, kitTotal - kitPaid)
        }
      };

      const res = await api.post('/api/students', payload);
      ui.toast(`Trainee "${res.student?.name || name}" enrolled into ${res.student?.sport || sport}!`, 'success');
      ui.closeModal('modal-add-student-hc');
      e.target.reset();

      // Switch to student_grid view or refresh current view
      state.selectedSportFilter = sport;
      if (state.headCoachTab === 'student_grid' || state.headCoachTab === 'fees_list') {
        await headCoach.loadHeadCoachTabContent();
      } else {
        headCoach.switchTab('student_grid');
      }
    } catch (err) {
      ui.toast(err.message || 'Error enrolling student', 'error');
    }
  }
};

window.headCoach = headCoach;
window.openAddStudentModal = function() {
  if (window.headCoach && typeof window.headCoach.openAddStudentModal === 'function') {
    window.headCoach.openAddStudentModal();
  }
};

// -------------------------------------------------------------
// 8. Admin Domain Controller (Admin Logo Upload & Management)
// -------------------------------------------------------------
const admin = {
  // Admin only logo upload handler
  async handleAdminLogoUpload(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      ui.toast('Please select a valid image file (PNG, JPG, SVG, WebP)', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target.result;
      try {
        ui.showLoading();
        // Save to server via Admin-only endpoint
        const res = await api.post('/api/academy-logo', { logoUrl: dataUrl });
        if (res.success) {
          localStorage.setItem('vsa_custom_logo', dataUrl);
          ui.applyCustomLogo(dataUrl);

          const cmsPreview = document.getElementById('cms-logo-preview');
          if (cmsPreview) {
            cmsPreview.outerHTML = `<img id="cms-logo-preview" src="${dataUrl}" class="w-full h-full object-contain p-1" />`;
          }

          ui.toast('Academy official logo uploaded and saved successfully!', 'success');
        }
      } catch (err) {
        ui.toast(err.message || 'Failed to save academy logo', 'error');
      } finally {
        ui.hideLoading();
      }
    };
    reader.readAsDataURL(file);
  },

  renderUserRow(u) {
    const roleColors = {
      admin: 'bg-red-50 text-sportsRed-700 border-red-200',
      head_coach: 'bg-blue-50 text-blue-700 border-blue-200',
      coach: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      student: 'bg-purple-50 text-purple-700 border-purple-200'
    };

    const extraDetail =
      u.role === 'student'
        ? `Tuition Due: ₹${u.fees?.due || 0} | Kit Due: ₹${u.kitFees?.due || 0}`
        : u.role === 'coach' || u.role === 'head_coach'
        ? `Salary: ₹${u.coachSalary?.amount || 0} (${u.coachSalary?.status || 'Pending'})`
        : 'Superuser Access';

    return `
      <tr class="hover:bg-slate-50">
        <td class="py-3.5 px-4 font-mono font-bold text-slate-900">${u.username}</td>
        <td class="py-3.5 px-4 font-bold text-slate-900">${u.name}</td>
        <td class="py-3.5 px-4">
          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${roleColors[u.role] || 'bg-slate-100 text-slate-700'}">
            ${u.role}
          </span>
        </td>
        <td class="py-3.5 px-4 text-slate-700 font-semibold">${u.sport || '—'}</td>
        <td class="py-3.5 px-4 text-slate-500">${u.phone || '—'}</td>
        <td class="py-3.5 px-4 text-slate-600 font-mono text-[11px] font-semibold">${extraDetail}</td>
      </tr>
    `;
  },

  filterUsers(role) {
    const tbody = document.getElementById('users-table-body');
    if (!tbody) return;

    const filtered = role === 'all'
      ? state.usersList
      : state.usersList.filter((u) => u.role === role);

    tbody.innerHTML = filtered.map((u) => this.renderUserRow(u)).join('');
  },

  onRoleChange(val) {
    const studentSec = document.getElementById('section-student-fees');
    const coachSec = document.getElementById('section-coach-salary');

    if (val === 'student') {
      if (studentSec) studentSec.classList.remove('hidden');
      if (coachSec) coachSec.classList.add('hidden');
    } else {
      if (studentSec) studentSec.classList.add('hidden');
      if (coachSec) coachSec.classList.remove('hidden');
    }
  },

  async handleAddUserSubmit(e) {
    e.preventDefault();
    try {
      const role = document.getElementById('new-user-role').value;
      const username = document.getElementById('new-user-username').value;
      const password = document.getElementById('new-user-password').value;
      const name = document.getElementById('new-user-name').value;
      const phone = document.getElementById('new-user-phone').value;
      const sport = document.getElementById('new-user-sport').value;

      const body = {
        role,
        username,
        password,
        name,
        phone,
        sport
      };

      if (role === 'student') {
        const total = Number(document.getElementById('new-user-total-fee').value || 0);
        const paid = Number(document.getElementById('new-user-paid-fee').value || 0);
        body.fees = { total, paid, due: total - paid };

        const kitTotal = Number(document.getElementById('new-user-kit-total').value || 0);
        const kitPaid = Number(document.getElementById('new-user-kit-paid').value || 0);
        body.kitFees = { total: kitTotal, paid: kitPaid, due: kitTotal - kitPaid };
      } else {
        const amount = Number(document.getElementById('new-coach-salary').value || 0);
        const status = document.getElementById('new-coach-status').value || 'Pending';
        body.coachSalary = { amount, status };
      }

      const res = await api.post('/api/users', body);
      ui.toast(`User "${res.user.name}" created successfully!`, 'success');
      ui.closeModal('modal-add-user');
      e.target.reset();

      if (state.currentTab === 'users' || state.currentTab === 'overview') {
        router.loadAdminTabData();
      }
    } catch (err) {
      ui.toast(err.message || 'Error creating user', 'error');
    }
  },

  async toggleAttendanceRole(role) {
    const btnStudents = document.getElementById('att-tab-students');
    const btnCoaches = document.getElementById('att-tab-coaches');

    if (role === 'student') {
      btnStudents.className = 'px-4 py-1.5 rounded-xl text-xs font-bold bg-brand-600 text-white shadow-xs transition cursor-pointer';
      btnCoaches.className = 'px-4 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition cursor-pointer';
    } else {
      btnCoaches.className = 'px-4 py-1.5 rounded-xl text-xs font-bold bg-brand-600 text-white shadow-xs transition cursor-pointer';
      btnStudents.className = 'px-4 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition cursor-pointer';
    }

    await this.loadAttendanceLogs(role, state.selectedDate);
  },

  async changeAttendanceDate(newDate) {
    state.selectedDate = newDate;
    const isCoach = document.getElementById('att-tab-coaches')?.classList.contains('bg-brand-600');
    await this.loadAttendanceLogs(isCoach ? 'coach' : 'student', newDate);
  },

  async loadAttendanceLogs(role, date) {
    const container = document.getElementById('admin-attendance-records-container');
    if (!container) return;

    try {
      const [recordsRes, usersRes] = await Promise.all([
        api.get(`/api/attendance?role=${role}&date=${date}`),
        api.get(`/api/users?role=${role}`)
      ]);

      const records = recordsRes.data || [];
      const users = usersRes.data || [];

      container.innerHTML = `
        <div class="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 text-slate-700 border-b border-slate-200">
              <tr>
                <th class="py-3 px-4 font-bold uppercase">${role === 'student' ? 'Student' : 'Coach'} Name</th>
                <th class="py-3 px-4 font-bold uppercase">Discipline</th>
                <th class="py-3 px-4 font-bold uppercase">Status for ${date}</th>
                <th class="py-3 px-4 font-bold uppercase text-right">Quick Mark</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${users.map((u) => {
                const rec = records.find((r) => (r.targetUserId?._id || r.targetUserId) === (u._id || u.id));
                const currentStatus = rec ? rec.status : 'Unmarked';
                return `
                  <tr class="hover:bg-slate-50">
                    <td class="py-3.5 px-4">
                      <div class="font-bold text-slate-900">${u.name}</div>
                      <div class="text-[10px] text-slate-500 font-mono">ID: ${u.username}</div>
                    </td>
                    <td class="py-3.5 px-4 text-slate-700 font-semibold">${u.sport || '—'}</td>
                    <td class="py-3.5 px-4">
                      <span class="px-2.5 py-1 rounded-full text-xs font-bold ${
                        currentStatus === 'Present' ? 'badge-present' : currentStatus === 'Late' ? 'badge-late' : currentStatus === 'Absent' ? 'badge-absent' : 'bg-slate-100 text-slate-600'
                      }">
                        ${currentStatus}
                      </span>
                    </td>
                    <td class="py-3.5 px-4 text-right">
                      <div class="inline-flex gap-1.5">
                        <button onclick="window.admin.quickMarkAttendance('${role}', '${u._id || u.id}', '${date}', 'Present', '${u.sport}')" class="px-2.5 py-1 rounded text-[11px] font-bold bg-green-50 text-sportsGreen-700 hover:bg-sportsGreen-600 hover:text-white border border-green-200 transition cursor-pointer">P</button>
                        <button onclick="window.admin.quickMarkAttendance('${role}', '${u._id || u.id}', '${date}', 'Late', '${u.sport}')" class="px-2.5 py-1 rounded text-[11px] font-bold bg-amber-50 text-amber-700 hover:bg-amber-600 hover:text-white border border-amber-200 transition cursor-pointer">L</button>
                        <button onclick="window.admin.quickMarkAttendance('${role}', '${u._id || u.id}', '${date}', 'Absent', '${u.sport}')" class="px-2.5 py-1 rounded text-[11px] font-bold bg-red-50 text-sportsRed-700 hover:bg-sportsRed-600 hover:text-white border border-red-200 transition cursor-pointer">A</button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div class="p-6 text-sportsRed-600 text-xs font-semibold">${err.message}</div>`;
    }
  },

  async quickMarkAttendance(role, targetUserId, date, status, sport) {
    try {
      const endpoint = role === 'student' ? '/api/attendance/student' : '/api/attendance/coach';
      await api.post(endpoint, { targetUserId, date, status, sport });
      ui.toast(`Marked ${status} for ${date}`, 'success');
      await this.loadAttendanceLogs(role, date);
    } catch (err) {
      ui.toast(err.message || 'Error marking attendance', 'error');
    }
  },

  openEditSalaryModal(id, name, sport, amount, status) {
    document.getElementById('edit-salary-coach-id').value = id;
    document.getElementById('edit-salary-coach-name').textContent = name;
    document.getElementById('edit-salary-coach-sport').textContent = sport;
    document.getElementById('edit-salary-amount').value = amount;
    document.getElementById('edit-salary-status').value = status;
    ui.openModal('modal-edit-salary');
  },

  async handleEditSalarySubmit(e) {
    e.preventDefault();
    try {
      const id = document.getElementById('edit-salary-coach-id').value;
      const amount = Number(document.getElementById('edit-salary-amount').value);
      const status = document.getElementById('edit-salary-status').value;

      await api.put(`/api/coaches/${id}/salary`, { amount, status });
      ui.toast('Coach salary updated successfully!', 'success');
      ui.closeModal('modal-edit-salary');
      router.loadAdminTabData();
    } catch (err) {
      ui.toast(err.message || 'Error updating salary', 'error');
    }
  },

  archiveSearchTimeout: null,

  onArchiveSearchInput(event) {
    clearTimeout(this.archiveSearchTimeout);
    const term = event.target.value;
    this.archiveSearchTimeout = setTimeout(() => {
      this.loadArchiveRecords(term);
    }, 200);
  },

  async loadArchiveRecords(query = '') {
    const tbody = document.getElementById('archive-table-body');
    const countBadge = document.getElementById('archive-count-badge');
    try {
      const url = query && query.trim() !== ''
        ? `/api/archive-students?search=${encodeURIComponent(query.trim())}`
        : '/api/archive-students';
      const res = await api.get(url);
      const records = res.data || [];

      if (countBadge) {
        countBadge.textContent = `${records.length} Archived Records`;
      }

      if (!tbody) return;

      if (records.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" class="py-12 text-center text-slate-400">
              <i class="fa-solid fa-box-open text-3xl text-slate-300 mb-2"></i>
              <p class="font-medium text-slate-600">No archived records matching "${query}".</p>
              <p class="text-[11px] text-slate-400 mt-1">Try another search term or clear the filter.</p>
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = records.map((r) => {
        const sportBadge = admin.getArchiveSportBadge(r.sportsSelected);
        return `
          <tr class="hover:bg-slate-50 transition">
            <td class="py-3.5 px-4 font-bold text-slate-900">${r.studentName}</td>
            <td class="py-3.5 px-4">
              <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${sportBadge}">
                ${r.sportsSelected || 'General'}
              </span>
            </td>
            <td class="py-3.5 px-4 text-slate-600">
              <div class="font-mono text-slate-800">${r.dateOfBirth || '—'}</div>
              <div class="text-[10px] text-slate-500 uppercase font-bold">${r.gender || '—'}</div>
            </td>
            <td class="py-3.5 px-4 text-slate-700 font-medium">${r.parentName || '—'}</td>
            <td class="py-3.5 px-4 text-slate-600 text-[11px] max-w-[240px] truncate" title="${r.permanentAddress || ''}">
              ${r.permanentAddress || '—'}
            </td>
            <td class="py-3.5 px-4 font-mono text-slate-700 font-semibold">${r.contactNumber || '—'}</td>
            <td class="py-3.5 px-4 font-mono text-slate-600">${r.enrollmentDate || '—'}</td>
          </tr>
        `;
      }).join('');
    } catch (err) {
      if (tbody) {
        tbody.innerHTML = `<tr><td colspan="7" class="py-6 text-center text-sportsRed-600 font-semibold">${err.message}</td></tr>`;
      }
    }
  },

  getArchiveSportBadge(sport = '') {
    const lower = (sport || '').toLowerCase();
    if (lower.includes('skating')) return 'bg-orange-50 text-orange-700 border-orange-200';
    if (lower.includes('archery')) return 'bg-amber-50 text-amber-700 border-amber-200';
    if (lower.includes('football')) return 'bg-green-50 text-sportsGreen-700 border-green-200';
    if (lower.includes('silambam')) return 'bg-red-50 text-sportsRed-700 border-red-200';
    if (lower.includes('yoga')) return 'bg-teal-50 text-teal-700 border-teal-200';
    if (lower.includes('fitness')) return 'bg-rose-50 text-rose-700 border-rose-200';
    if (lower.includes('shuttle')) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (lower.includes('chess')) return 'bg-purple-50 text-purple-700 border-purple-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  },

  openAddArchiveModal() {
    const form = document.getElementById('form-add-archive');
    if (form) form.reset();
    ui.openModal('modal-add-archive');
  },

  async handleAddArchiveSubmit(e) {
    e.preventDefault();
    try {
      const studentName = document.getElementById('arch-student-name').value.trim();
      const sportsSelected = document.getElementById('arch-sports-selected').value.trim() || 'General';
      const dateOfBirth = document.getElementById('arch-dob').value.trim() || null;
      const gender = document.getElementById('arch-gender').value;
      const enrollmentDate = document.getElementById('arch-enrollment-date').value.trim() || null;
      const parentName = document.getElementById('arch-parent-name').value.trim() || null;
      const contactNumber = document.getElementById('arch-contact').value.trim() || null;
      const permanentAddress = document.getElementById('arch-address').value.trim() || null;

      const res = await api.post('/api/archive-students', {
        studentName,
        sportsSelected,
        dateOfBirth,
        gender,
        enrollmentDate,
        parentName,
        contactNumber,
        permanentAddress
      });

      ui.toast(res.message || 'Archived record created successfully!', 'success');
      ui.closeModal('modal-add-archive');
      e.target.reset();
      await this.loadArchiveRecords();
    } catch (err) {
      ui.toast(err.message || 'Error saving archive entry', 'error');
    }
  }
};

window.admin = admin;

// -------------------------------------------------------------
// 9. CMS Editor Controller
// -------------------------------------------------------------
const cms = {
  addScheduleRow() {
    const list = document.getElementById('cms-schedule-list');
    if (!list) return;

    const row = document.createElement('div');
    row.className = 'grid grid-cols-4 gap-2 items-center p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs';
    row.innerHTML = `
      <input type="text" value="Monday" placeholder="Day" class="cms-sched-day px-2 py-1.5 rounded bg-white border border-slate-300 text-slate-900" />
      <input type="text" value="Silambam" placeholder="Sport" class="cms-sched-sport px-2 py-1.5 rounded bg-white border border-slate-300 text-slate-900" />
      <input type="text" value="05:00 PM - 07:00 PM" placeholder="Time Slot" class="cms-sched-time px-2 py-1.5 rounded bg-white border border-slate-300 text-slate-900" />
      <div class="flex items-center gap-2">
        <input type="text" value="Karthik Raja" placeholder="Coach Name" class="cms-sched-coach w-full px-2 py-1.5 rounded bg-white border border-slate-300 text-slate-900" />
        <button type="button" onclick="this.closest('.grid').remove()" class="text-sportsRed-600 hover:text-sportsRed-700 p-1 cursor-pointer"><i class="fa-solid fa-trash"></i></button>
      </div>
    `;
    list.appendChild(row);
  },

  async handleSave(e) {
    e.preventDefault();
    try {
      const startedYear = document.getElementById('cms-startedYear').value;
      const aboutText = document.getElementById('cms-aboutText').value;
      const sportsAvailable = document.getElementById('cms-sports').value.split(',').map((s) => s.trim()).filter(Boolean);

      const scheduleDays = Array.from(document.querySelectorAll('.cms-sched-day')).map((el) => el.value);
      const scheduleSports = Array.from(document.querySelectorAll('.cms-sched-sport')).map((el) => el.value);
      const scheduleTimes = Array.from(document.querySelectorAll('.cms-sched-time')).map((el) => el.value);
      const scheduleCoaches = Array.from(document.querySelectorAll('.cms-sched-coach')).map((el) => el.value);

      const weeklySchedule = scheduleDays.map((day, i) => ({
        day,
        sport: scheduleSports[i] || 'General',
        time: scheduleTimes[i] || '06:00 AM - 08:00 AM',
        coach: scheduleCoaches[i] || 'Coach'
      }));

      const payload = {
        startedYear,
        aboutText,
        sportsAvailable,
        weeklySchedule
      };

      const res = await api.put('/api/academy-info', payload);
      state.academyInfo = res.data;
      ui.toast('CMS details saved and published successfully!', 'success');
    } catch (err) {
      ui.toast(err.message || 'Error updating CMS', 'error');
    }
  }
};

window.cms = cms;

// Close modals when clicking backdrop or pressing Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    [
      'modal-login',
      'modal-add-user',
      'modal-add-student-hc',
      'modal-add-archive',
      'modal-edit-fees',
      'modal-edit-salary'
    ].forEach((id) => {
      ui.closeModal(id);
    });
  }
});

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  router.init();
});

// Student Profile Modal - Icon-Driven, Responsive, Role-Aware
window.openStudentProfileModal = async function(studentId) {
  try {
    const res = await fetch('/api/students/' + encodeURIComponent(studentId) + '/profile', {
      headers: { 'Authorization': 'Bearer ' + (state.token || localStorage.getItem('vsa_token') || '') }
    });
    const json = await res.json();
    if (!json.success) { 
      alert(json.message || 'Failed to load profile'); 
      return; 
    }
    const s = json.data || {};
    
    // Calculate fee statuses
    const tuitionTotal = s.fees?.total || 0;
    const tuitionPaid = s.fees?.paid || 0;
    const tuitionDue = s.fees?.due !== undefined ? s.fees.due : Math.max(0, tuitionTotal - tuitionPaid);
    
    const kitTotal = s.kitFees?.total || 0;
    const kitPaid = s.kitFees?.paid || 0;
    const kitDue = s.kitFees?.due !== undefined ? s.kitFees.due : Math.max(0, kitTotal - kitPaid);
    
    const totalDue = tuitionDue + kitDue;
    const totalFee = tuitionTotal + kitTotal;
    const totalPaid = tuitionPaid + kitPaid;
    
    let overallStatus = 'Paid';
    let statusClass = 'bg-green-50 text-sportsGreen-700 border-green-200';
    if (totalDue > 0 && totalPaid > 0) {
      overallStatus = 'Partial';
      statusClass = 'bg-amber-50 text-amber-700 border-amber-200';
    } else if (totalDue > 0 && totalPaid === 0) {
      overallStatus = 'Overdue';
      statusClass = 'bg-red-50 text-sportsRed-700 border-red-200';
    }
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-sm';
    modal.onclick = function(e) {
      if (e.target === modal) {
        modal.remove();
      }
    };
    modal.innerHTML = `
      <div class="bg-white rounded-2xl w-full max-w-2xl max-h-[95vh] overflow-y-auto relative shadow-2xl">
        <button class="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 transition z-10" onclick="this.closest('.fixed').remove()">
          <i class="fa-solid fa-xmark"></i>
        </button>
        
        <!-- Header -->
        <div class="p-6 sm:p-8 border-b border-slate-200">
          <div class="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
            <div class="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg shrink-0">
              ${s.profilePhoto ? `<img src="${s.profilePhoto}" class="w-full h-full object-cover"/>` : '<i class="fa-solid fa-circle-user text-4xl sm:text-5xl text-brand-600"></i>'}
            </div>
            <div class="flex-1 text-center sm:text-left space-y-2">
              <h2 class="text-2xl sm:text-3xl font-black text-slate-900 font-display">${s.name || 'N/A'}</h2>
              <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3">
                <span class="px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold">
                  <i class="fa-solid fa-id-card mr-1"></i> Allocated ID: ${s.username || s.id || 'N/A'}
                </span>
                <span class="px-3 py-1 rounded-lg bg-brand-50 text-brand-700 text-xs font-bold">
                  <i class="fa-solid fa-medal mr-1"></i> ${s.sport || 'N/A'} ${s.sportLevel ? '(' + s.sportLevel + ')' : ''}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Academy Information -->
        <div class="p-6 sm:p-8 space-y-6">
          <section>
            <h3 class="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
              <i class="fa-solid fa-school text-brand-600"></i> Academy Information
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <p class="text-xs text-slate-500 font-semibold mb-1">Joining / Enrollment Date</p>
                <p class="text-sm text-slate-900 font-bold">${s.enrollmentDate ? new Date(s.enrollmentDate).toLocaleDateString('en-IN') : (s.createdAt ? new Date(s.createdAt).toLocaleDateString('en-IN') : 'N/A')}</p>
              </div>
              <div class="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <p class="text-xs text-slate-500 font-semibold mb-1">Sport Level</p>
                <p class="text-sm text-slate-900 font-bold">${s.sportLevel || 'Not Specified'}</p>
              </div>
            </div>
            <div class="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <p class="text-xs text-slate-500 font-semibold mb-2">About Themselves & Achievements so far</p>
              <p class="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">${s.bio || 'No bio provided.'}</p>
            </div>
          </section>
          
          <!-- Fee Breakdown -->
          <section>
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-lg font-bold text-slate-900 flex items-center gap-2">
                <i class="fa-solid fa-receipt text-brand-600"></i> Comprehensive Fee Breakdown
              </h3>
              <span class="px-3 py-1 rounded-full text-xs font-bold border ${statusClass}">
                ${overallStatus}
              </span>
            </div>
            <div class="space-y-3">
              <div class="p-4 rounded-xl border border-slate-200">
                <h4 class="text-sm font-bold text-slate-900 mb-2">Regular Tuition Fees</h4>
                <div class="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p class="text-xs text-slate-500">Total</p>
                    <p class="text-sm font-bold text-slate-900">₹${tuitionTotal.toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <p class="text-xs text-slate-500">Amount Paid</p>
                    <p class="text-sm font-bold text-sportsGreen-700">₹${tuitionPaid.toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <p class="text-xs text-slate-500">Balance Due</p>
                    <p class="text-sm font-bold text-sportsRed-700">₹${tuitionDue.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              </div>
              <div class="p-4 rounded-xl border border-slate-200">
                <h4 class="text-sm font-bold text-slate-900 mb-2">Sports Kit / Uniform Fees</h4>
                <div class="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p class="text-xs text-slate-500">Total</p>
                    <p class="text-sm font-bold text-slate-900">₹${kitTotal.toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <p class="text-xs text-slate-500">Amount Paid</p>
                    <p class="text-sm font-bold text-sportsGreen-700">₹${kitPaid.toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <p class="text-xs text-slate-500">Balance Due</p>
                    <p class="text-sm font-bold text-sportsRed-700">₹${kitDue.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
          
          <!-- Personal & Emergency Details -->
          <section>
            <h3 class="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
              <i class="fa-solid fa-address-card text-brand-600"></i> Personal & Emergency Details
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <p class="text-xs text-slate-500 font-semibold">Date of Birth</p>
                <p class="text-sm text-slate-900 font-medium">${s.dateOfBirth ? (typeof s.dateOfBirth === 'string' ? s.dateOfBirth : new Date(s.dateOfBirth).toLocaleDateString('en-IN')) : 'N/A'}</p>
              </div>
              <div class="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <p class="text-xs text-slate-500 font-semibold">Gender</p>
                <p class="text-sm text-slate-900 font-medium">${s.gender || 'N/A'}</p>
              </div>
              <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 sm:col-span-2">
                <p class="text-xs text-slate-500 font-semibold">Parent/Guardian Name</p>
                <p class="text-sm text-slate-900 font-medium">${s.parentName || 'N/A'}</p>
              </div>
              <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 sm:col-span-2">
                <p class="text-xs text-slate-500 font-semibold">Contact Numbers</p>
                <p class="text-sm text-slate-900 font-medium">${s.phone || 'N/A'}</p>
              </div>
              <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 sm:col-span-2">
                <p class="text-xs text-slate-500 font-semibold">Residential Address</p>
                <p class="text-sm text-slate-900 font-medium whitespace-pre-wrap">${s.address || 'N/A'}</p>
              </div>
            </div>
          </section>
        </div>
      </div>`;
    document.body.appendChild(modal);
  } catch (e) {
    console.error(e);
    alert('Error loading profile');
  }
};
