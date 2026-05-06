import API from './api.js';
import Sidebar from './sidebar.js';
import { Login, handleLogout } from './modules/auth.js';
import { Dashboard } from './modules/dashboard.js';
import { Attendance, MyQR } from './modules/attendance.js';
import { Scan, SatpamPortal } from './modules/scan.js';
import { CheckpointAdmin } from './modules/checkpoint-admin.js';
import { SecurityAnalytics } from './modules/security-analytics.js';
import { Finance, Salary } from './modules/finance.js';
import { Users } from './modules/users.js';
import { Roles } from './modules/roles.js';
import { Warga } from './modules/warga.js';
import { Settings } from './modules/settings.js';
import { Sop } from './modules/sop.js';
import { Leaderboard } from './modules/leaderboard.js';
import { InvoiceAdmin, InvoiceResident } from './modules/invoice.js';
import { Analytics } from './modules/analytics.js';
import { PatrolStatus } from './modules/patrol-status.js';
import { Visitors, VisitorGuestView } from './modules/visitors.js';
import { Profile } from './modules/profile.js';
import { Minutes } from './modules/minutes.js';
import { Chatbot } from './modules/chatbot.js';
import { Demographics } from './modules/demographics.js';
import { CCTV } from './modules/cctv.js';
import { Changelog } from './modules/changelog.js';
import { SecurityContributions } from './modules/security-contributions.js';

const App = {
    routes: {},
    container: document.getElementById('app-content'),
    scanMode: 'IN',
    html5Scanner: null,
    user: null,

    async init() {
        if (this._initialized) return;
        this._initialized = true;

        this.basePath = document.querySelector('meta[name="base-path"]')?.getAttribute('content') || '';

        // Status Updater
        const statusEl = document.getElementById('splash-status');
        const updateStatus = (text) => {
            if (statusEl) statusEl.innerText = text;
        };

        // SweetAlert2 Global Config
        window.SwalCustom = Swal.mixin({
            confirmButtonColor: '#0070f3',
            cancelButtonColor: '#cbd5e1',
            customClass: {
                popup: 'rounded-[2rem]',
                confirmButton: 'rounded-xl px-6 py-3 text-sm font-bold',
                cancelButton: 'rounded-xl px-6 py-3 text-sm font-bold'
            }
        });

        // Override default alert
        window.alert = (msg) => {
            const isError = msg.toLowerCase().includes('error') || msg.toLowerCase().includes('gagal');
            const isSuccess = msg.toLowerCase().includes('berhasil') || msg.toLowerCase().includes('success') || msg.includes('✅');

            SwalCustom.fire({
                title: isSuccess ? 'Berhasil' : (isError ? 'Gagal' : 'Informasi'),
                text: msg.replace(/[✅❌⚠️]/g, '').trim(),
                icon: isSuccess ? 'success' : (isError ? 'error' : 'info'),
            });
        };

        // Initialize Service Worker & Check for Updates
        await this.initServiceWorker(updateStatus);

        window.addEventListener('hashchange', () => this.handleRoute());
        await this.handleRoute();
        await Chatbot.init();

        // Start Idle Timer
        this.initIdleTimer();

        // Start
        updateStatus('System Ready');
        this.hideSplash();
    },

    initIdleTimer() {
        let timeout;
        const IDLE_TIME = 5 * 60 * 1000; // 5 Minutes

        const resetTimer = () => {
            clearTimeout(timeout);
            // Only set timer if user is logged in and not on login page
            const hash = window.location.hash;
            if (hash !== '#/login' && !hash.startsWith('#/v/')) {
                timeout = setTimeout(async () => {
                    // Check if session is actually still active before showing alert
                    const user = await this.getUser(true);
                    if (user && user.id) {
                        SwalCustom.fire({
                            title: 'Sesi Berakhir',
                            text: 'Anda tidak aktif selama 5 menit. Untuk keamanan, silakan masuk kembali.',
                            icon: 'warning',
                            confirmButtonText: 'Masuk Lagi',
                            allowOutsideClick: false,
                            allowEscapeKey: false
                        }).then(() => {
                            handleLogout(true);
                        });
                    }
                }, IDLE_TIME);
            }
        };

        // Events to monitor
        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(name => {
            document.addEventListener(name, resetTimer, true);
        });

        // Initialize first timer
        resetTimer();
    },

    async initServiceWorker(updateStatus) {
        if (!('serviceWorker' in navigator)) return;

        updateStatus('Initializing System...');

        try {
            const registration = await navigator.serviceWorker.register(`${this.basePath}/service-worker.js`, {
                updateViaCache: 'none'
            });

            // Global update function for manual checks
            window.checkUpdate = async (manual = false) => {
                if (manual) {
                    SwalCustom.fire({
                        title: 'Mengecek Update...',
                        didOpen: () => { Swal.showLoading(); },
                        allowOutsideClick: false
                    });
                }
                
                try {
                    await registration.update();
                    if (manual) {
                        setTimeout(() => {
                            if (!registration.installing && !registration.waiting) {
                                SwalCustom.fire({
                                    title: 'Sistem Terupdate',
                                    text: 'Anda sudah menggunakan versi terbaru.',
                                    icon: 'success',
                                    toast: true,
                                    position: 'top-end',
                                    showConfirmButton: false,
                                    timer: 3000
                                });
                            }
                        }, 1000);
                    }
                } catch (e) {
                    console.error('Update check failed:', e);
                }
            };

            // Listen for controllerchange (when a new SW takes over)
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                updateStatus('Update Installed! Restarting...');
                setTimeout(() => window.location.reload(), 1000);
            });

            // If a new SW is found during this session
            registration.onupdatefound = () => {
                const newWorker = registration.installing;
                updateStatus('New Version Found...');
                
                if (navigator.serviceWorker.controller) {
                    // This is an update (not first install)
                    SwalCustom.fire({
                        title: 'Update Tersedia',
                        text: 'Versi baru sedang diunduh. Aplikasi akan restart otomatis.',
                        icon: 'info',
                        toast: true,
                        position: 'bottom-end',
                        showConfirmButton: false,
                        timer: 5000
                    });
                }

                newWorker.onstatechange = () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        updateStatus('Downloading Update...');
                    }
                };
            };

            // Force check for updates on startup
            await registration.update();

            // Give a small window for update check to resolve
            await new Promise(r => setTimeout(r, 600));

        } catch (err) {
            console.error('SW Registration failed:', err);
            updateStatus('Ready (Offline)');
        }
    },

    hideSplash() {
        setTimeout(() => {
            const splash = document.getElementById('global-splash');
            if (splash) {
                splash.classList.add('splash-hidden');
                // Remove from DOM after transition to keep it clean
                setTimeout(() => splash.remove(), 800);
            }
        }, 800);
    },

    addRoute(path, handler) {
        this.routes[path] = handler;
    },

    async getUser(force = false) {
        if (this.user && !force) return this.user;
        this.user = await API.get('/api/me');
        return this.user;
    },

    async handleRoute() {
        const hash = window.location.hash.split('?')[0] || '#/';
        let handler = this.routes[hash];

        // Support dynamic routes for visitors
        if (!handler && hash.startsWith('#/v/')) {
            handler = this.routes['#/v/'];
        }

        handler = handler || this.routes['#/404'];

        if (handler) {
            this.container.innerHTML = '<div class="flex justify-center items-center h-full"><div class="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div></div>';
            await handler(this);

            // Re-init header on every navigation to ensure events (logout) are attached
            this.initHeader();
        } else {
            this.container.innerHTML = '<h1 class="text-2xl text-red-500">404 Not Found</h1>';
        }
    },

    async initHeader() {
        const hash = window.location.hash.split('?')[0] || '#/';
        if (hash === '#/login' || hash.startsWith('#/v/')) {
            document.getElementById('header-container')?.classList.add('hidden');
            document.getElementById('sidebar-container')?.classList.add('hidden');
            return;
        }

        const user = await this.getUser();
        if (user && user.id) {
            // Show Containers
            document.getElementById('header-container')?.classList.remove('hidden');
            document.getElementById('sidebar-container')?.classList.remove('hidden');

            // Render Sidebar
            await Sidebar.render(user);

            // Check Chatbot Visibility
            Chatbot.updateVisibility(user);

            const nameEl = document.getElementById('user-name');
            const initEl = document.getElementById('user-initial');
            if (nameEl) nameEl.innerText = user.full_name;
            if (initEl) initEl.innerText = user.full_name.charAt(0).toUpperCase();

            const logoutBtn = document.getElementById('logout-btn');
            if (logoutBtn) logoutBtn.onclick = handleLogout;
        }
    }
};

// Global Exposure if needed for inline onclicks in HTML strings
window.App = App;
window.handleLogout = handleLogout;

// Define Routes
App.addRoute('#/', async (ctx) => {
    const user = await ctx.getUser();
    window.location.hash = (user && user.id) ? '#/dashboard' : '#/login';
});

App.addRoute('#/login', Login);
App.addRoute('#/dashboard', Dashboard);
App.addRoute('#/attendance', Attendance);
App.addRoute('#/my-qr', MyQR);
App.addRoute('#/satpam-portal', SatpamPortal);
App.addRoute('#/scan', Scan);
App.addRoute('#/checkpoint-admin', CheckpointAdmin);
App.addRoute('#/finance', Finance);
App.addRoute('#/kasbon', Finance);
App.addRoute('#/salary', Salary);
App.addRoute('#/users', Users);
App.addRoute('#/warga', Warga);
App.addRoute('#/settings', Settings);
App.addRoute('#/sop', Sop);
App.addRoute('#/leaderboard', Leaderboard);
App.addRoute('#/roles', Roles);
App.addRoute('#/invoice-admin', InvoiceAdmin);
App.addRoute('#/invoice-resident', InvoiceResident);
App.addRoute('#/analytics', Analytics);
App.addRoute('#/patrol-status', PatrolStatus);
App.addRoute('#/visitors', Visitors);
App.addRoute('#/v/', VisitorGuestView);
App.addRoute('#/profile', Profile);
App.addRoute('#/minutes', Minutes);
App.addRoute('#/demographics', Demographics);
App.addRoute('#/security-analytics', SecurityAnalytics);
App.addRoute('#/security-contributions', SecurityContributions);
App.addRoute('#/cctv', CCTV);
App.addRoute('#/changelog', Changelog);

// Start
document.addEventListener('DOMContentLoaded', () => App.init());

export default App;
