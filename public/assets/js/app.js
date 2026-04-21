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

        window.addEventListener('hashchange', () => this.handleRoute());
        await this.handleRoute();
        await Chatbot.init();

        // Hide splash screen with a gentle delay for premium feel
        setTimeout(() => {
            const splash = document.getElementById('global-splash');
            if (splash) {
                splash.classList.add('splash-hidden');
                // Remove from DOM after transition to keep it clean
                setTimeout(() => splash.remove(), 800);
            }
        }, 1200);
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
