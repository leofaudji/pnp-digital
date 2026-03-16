import API from '../api.js';

export const Login = async (App) => {
    document.getElementById('header-container').classList.add('hidden');
    document.getElementById('sidebar-container').classList.add('hidden');

    // Hide footer and disable scroll on parents
    const footer = document.querySelector('footer');
    if (footer) footer.classList.add('hidden');

    const mainView = document.getElementById('main-view');
    if (mainView) {
        mainView.classList.add('overflow-hidden');
        mainView.classList.remove('overflow-y-auto');
        mainView.parentElement.classList.add('overflow-hidden');
        mainView.parentElement.classList.remove('overflow-y-auto');
    }

    const settings = await API.get('/api/settings');
    const appTitle = settings.app_title || 'RT-Digital';
    const logoInitial = appTitle.substring(0, 2).toUpperCase();

    document.title = `${appTitle} | Login`;

    const view = `
    <div class="flex min-h-screen bg-slate-50 font-sans overflow-hidden">
        <!-- Left Side: Branding & Visuals (Desktop Only) - 45% Width -->
        <div class="hidden lg:flex lg:w-[45%] bg-slate-900 relative overflow-hidden flex-col justify-between p-16 text-white">
            
            <!-- Abstract Background Pattern -->
            <div class="absolute inset-0 opacity-20">
                <svg class="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path d="M0 100 C 20 0 50 0 100 100 Z" fill="url(#grad1)" />
                    <defs>
                        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" style="stop-color:#059669;stop-opacity:1" />
                            <stop offset="100%" style="stop-color:#10b981;stop-opacity:0" />
                        </linearGradient>
                    </defs>
                </svg>
            </div>
            
            <div class="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-600/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
            <div class="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/3"></div>

            <!-- Top Brand -->
            <div class="relative z-10 animate-in fade-in slide-in-from-top-8 duration-700">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/30">
                        <i data-lucide="shield-check" class="w-6 h-6 text-white"></i>
                    </div>
                    <span class="text-xl font-bold tracking-tight">${appTitle}</span>
                </div>
            </div>

            <!-- Central Content -->
            <div class="relative z-10 my-auto">
                <h1 class="text-5xl font-bold tracking-tight leading-section mb-6">
                    Kelola Lingkungan<br/>
                    <span class="text-brand-400">Lebih Cerdas.</span>
                </h1>
                <p class="text-slate-400 text-lg leading-relaxed max-w-sm mb-8">
                    Solusi manajemen RT terpadu untuk transparansi data warga, keuangan, dan keamanan lingkungan.
                </p>
                
                <div class="flex gap-4">
                    <div class="px-4 py-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400">
                            <i data-lucide="users" class="w-4 h-4"></i>
                        </div>
                        <div>
                            <div class="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Total Warga</div>
                            <div id="total-warga-count" class="text-sm font-bold">Memuat...</div>
                        </div>
                    </div>
                    <div class="px-4 py-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                            <i data-lucide="activity" class="w-4 h-4"></i>
                        </div>
                        <div>
                            <div class="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Status Sistem</div>
                            <div class="text-sm font-bold text-emerald-400">Online</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Bottom Copyright -->
            <div class="relative z-10 text-xs text-slate-500 font-medium">
                &copy; ${new Date().getFullYear()} <a href="https://crudworks.com" target="_blank" class="hover:text-brand-400 transition-colors">CRUDWorks</a>. Allright Reserved.
            </div>
        </div>

        <!-- Right Side: Login Form - 55% Width -->
        <div class="w-full lg:w-[55%] flex flex-col items-center justify-center p-8 md:p-12 pb-24 relative bg-white">
            <div class="w-full max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div class="mb-8">
                    <h2 class="text-3xl font-bold text-slate-900 tracking-tight mb-2">Selamat Datang 👋</h2>
                    <p class="text-slate-500">Masuk ke akun Anda untuk melanjutkan.</p>
                </div>

                <form id="login-form" class="space-y-5">
                    <div class="space-y-1.5">
                        <label class="block text-sm font-semibold text-slate-700 ml-1">Username</label>
                        <div class="relative group">
                            <input type="text" id="username" 
                                class="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all text-slate-900 placeholder:text-slate-400 font-medium" 
                                placeholder="Masukkan username" required>
                            <div class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-brand-500 transition-colors">
                                <i data-lucide="user" class="w-5 h-5"></i>
                            </div>
                        </div>
                    </div>

                    <div class="space-y-1.5">
                        <div class="flex justify-between items-center ml-1">
                            <label class="block text-sm font-semibold text-slate-700">Password</label>
                            <a href="#" class="text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors">Lupa Password?</a>
                        </div>
                        <div class="relative group">
                            <input type="password" id="password" 
                                class="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all text-slate-900 placeholder:text-slate-400 font-medium" 
                                placeholder="••••••••" required>
                             <div class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-brand-500 transition-colors">
                                <i data-lucide="lock" class="w-5 h-5"></i>
                            </div>
                        </div>
                    </div>
                    
                    <div class="pt-2 space-y-3">
                        <button class="w-full py-3.5 bg-slate-900 text-white font-bold rounded-xl shadow-lg shadow-slate-900/20 hover:bg-slate-800 hover:shadow-slate-900/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group" type="submit">
                            <span>Masuk Dashboard</span>
                            <i data-lucide="arrow-right" class="w-4 h-4 group-hover:translate-x-1 transition-transform"></i>
                        </button>
                        
                        <div class="relative flex items-center gap-3">
                            <div class="flex-1 border-t border-slate-200"></div>
                            <span class="text-xs font-medium text-slate-400">atau</span>
                            <div class="flex-1 border-t border-slate-200"></div>
                        </div>

                        <a href="/app-rt/api/auth/google" class="w-full py-3 bg-white border-2 border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 hover:border-slate-300 hover:-translate-y-0.5 active:scale-[0.98] transition-all flex items-center justify-center gap-3 group">
                            <svg class="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            <span>Masuk dengan Google</span>
                        </a>
                    </div>
                </form>

                <div class="mt-8 pt-8 border-t border-slate-100 text-center">
                    <p class="text-sm text-slate-500">
                        Butuh bantuan akses? <a href="#" class="font-semibold text-brand-600 hover:text-brand-700 transition-colors">Hubungi Admin</a>
                    </p>
                </div>
            </div>

            <!-- Bottom Center Logo -->
            <div class="absolute bottom-11 left-0 right-0 flex justify-center opacity-60 hover:opacity-100 transition-opacity">
                <a href="https://crudworks.com" target="_blank"><img src="assets/images/logo.png" alt="Logo" class="h-4 w-auto grayscale hover:grayscale-0 transition-all"></a>
            </div>
        </div>
    </div>
    
    <!-- Splash Screen Overlay -->
    <div id="splash-screen" class="fixed inset-0 bg-brand-600 z-[100] flex flex-col items-center justify-center hidden opacity-0 transition-opacity duration-500">
        <div class="relative">
            <div class="w-24 h-24 bg-white/10 rounded-[2rem] flex items-center justify-center animate-pulse">
                <i data-lucide="shield-check" class="w-12 h-12 text-white"></i>
            </div>
            <div class="absolute inset-0 border-4 border-white/20 rounded-[2rem] animate-ping duration-1000"></div>
        </div>
        <h2 class="text-white text-2xl font-black mt-8 tracking-tighter animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">Menyiapkan Dashboard...</h2>
        <div class="mt-4 flex space-x-1">
            <div class="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div class="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div class="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></div>
        </div>
    </div>
    `;
    App.container.innerHTML = view;

    // Fetch Public Stats
    try {
        const stats = await API.get('/api/public/stats');
        if (stats && stats.total_warga !== undefined) {
            const countEl = document.getElementById('total-warga-count');
            if (countEl) countEl.innerText = stats.total_warga + '+';
        }
    } catch (e) {
        console.error('Failed to fetch public stats', e);
        const countEl = document.getElementById('total-warga-count');
        if (countEl) countEl.innerText = '-';
    }

    // Check for OAuth error (redirected back from Google with error)
    const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
    const oauthError = urlParams.get('oauth_error');
    if (oauthError) {
        Swal.fire({ icon: 'error', title: 'Login Google Gagal', text: decodeURIComponent(oauthError), confirmButtonColor: '#1e293b' });
        // Clean URL
        history.replaceState(null, '', window.location.pathname + '#/login');
    }

    // Remove scrolling on body
    document.body.classList.add('overflow-hidden');

    // Autofocus
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    usernameInput.focus();

    // Key Navigation
    usernameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            passwordInput.focus();
        }
    });

    const showSplashScreen = () => {
        const splash = document.getElementById('splash-screen');
        splash.classList.remove('hidden');
        setTimeout(() => splash.classList.add('opacity-100'), 10);
    };

    document.getElementById('login-form').onsubmit = async (e) => {
        e.preventDefault();
        const username = usernameInput.value;
        const password = passwordInput.value;

        // Visual feedback on button
        const btn = e.submitter;
        const originalContent = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<div class="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>';

        try {
            const result = await API.post('/api/login', { username, password });
            if (result && result.success) {
                // Remove overflow-hidden before transition if needed, 
                // but usually dashboard handles its own scroll.
                showSplashScreen();

                // Allow splash screen to show for 1.8s
                setTimeout(() => {
                    document.body.classList.remove('overflow-hidden');
                    if (mainView) {
                        mainView.classList.remove('overflow-hidden');
                        mainView.classList.add('overflow-y-auto');
                        mainView.parentElement.classList.remove('overflow-hidden');
                        mainView.parentElement.classList.add('overflow-y-auto');
                    }
                    if (footer) footer.classList.remove('hidden');

                    window.location.hash = '#/dashboard';
                }, 1800);
            } else {
                btn.disabled = false;
                btn.innerHTML = originalContent;
                SwalCustom.fire({
                    title: 'Login Gagal',
                    text: (result ? result.message : 'Username atau password salah.'),
                    icon: 'error'
                });
            }
        } catch (err) {
            btn.disabled = false;
            btn.innerHTML = originalContent;
            console.error('Login error:', err);
        }
    };

    if (window.lucide) lucide.createIcons();
};

export const handleLogout = async () => {
    const result = await SwalCustom.fire({
        title: 'Logout?',
        text: "Anda akan keluar dari sesi ini.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Ya, Keluar',
        cancelButtonText: 'Batal',
        confirmButtonColor: '#e11d48', // Rose color for logout
    });

    if (result.isConfirmed) {
        const res = await API.post('/api/logout');
        if (res && res.success) {
            if (window.App) window.App.user = null;
            
            // Hard reload to clear all states and re-initialize the app properly
            const basePath = document.querySelector('meta[name="base-path"]')?.content || '';
            window.location.href = basePath + '/#/login';
            window.location.reload();
        }
    }
};
