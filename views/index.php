<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="<?= $csrf_token ?>">
    <title>Sistem Manajemen RT | Dashboard</title>
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <!-- Favicon  -->
    <link rel="icon" href="assets/images/favicon.png" />
    <!-- Lucide Icons -->
    <script src="https://unpkg.com/lucide@latest"></script>
    <!-- PDF Generation -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        const themes = {
            'emerald': { 50: '#ecfdf5', 100: '#d1fae5', 200: '#a7f3d0', 300: '#6ee7b7', 400: '#34d399', 500: '#10b981', 600: '#059669', 700: '#047857', 800: '#065f46', 900: '#064e3b' },
            'blue': { 50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd', 400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8', 800: '#1e40af', 900: '#1e3a8a' },
            'rose': { 50: '#fff1f2', 100: '#ffe4e6', 200: '#fecdd3', 300: '#fda4af', 400: '#fb7185', 500: '#f43f5e', 600: '#e11d48', 700: '#be123c', 800: '#9f1239', 900: '#881337' },
            'amber': { 50: '#fffbeb', 100: '#fef3c7', 200: '#fde68a', 300: '#fcd34d', 400: '#fbbf24', 500: '#f59e0b', 600: '#d97706', 700: '#b45309', 800: '#92400e', 900: '#78350f' },
            'indigo': { 50: '#eef2ff', 100: '#e0e7ff', 200: '#c7d2fe', 300: '#a5b4fc', 400: '#818cf8', 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca', 800: '#3730a3', 900: '#312e81' },
        };
        const savedTheme = localStorage.getItem('app-theme') || 'emerald';
        const brandColors = themes[savedTheme] || themes['emerald'];

        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: {
                        sans: ['Inter', 'sans-serif'],
                    },
                    colors: {
                        brand: brandColors,
                        sidebar: '#1e293b',
                    }
                }
            }
        }
    </script>
    <!-- Alpine.js for some interactivity -->
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
    <!-- QR Code Libraries -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
    <script src="https://unpkg.com/html5-qrcode" type="text/javascript"></script>
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <!-- App Styles -->
    <link rel="stylesheet" href="<?= BASE_PATH ?>/assets/css/style.css?v=<?= date('Ymd') ?>">
    <!-- PWA Manifest -->
    <link rel="manifest" href="<?= BASE_PATH ?>/manifest.json?v=<?= app_version() ?>">
    <!-- Base Path for JS -->
    <meta name="base-path" content="<?= BASE_PATH ?>">
    <style>
        @keyframes pulse-red {
            0% {
                transform: scale(0.9);
                box-shadow: 0 0 0 0 rgba(244, 63, 94, 0.7);
            }

            70% {
                transform: scale(1);
                box-shadow: 0 0 0 4px rgba(244, 63, 94, 0);
            }

            100% {
                transform: scale(0.9);
                box-shadow: 0 0 0 0 rgba(244, 63, 94, 0);
            }
        }

        .animate-pulse-red {
            animation: pulse-red 2s infinite;
        }
    </style>
</head>

<body class="bg-gray-50 text-gray-800 font-sans antialiased">

    <!-- Global Splash Screen -->
    <div id="global-splash">
        <div class="splash-logo-container">
            <div class="splash-glow"></div>
            <i data-lucide="shield-check"></i>
        </div>
        <div class="splash-title"><?= htmlspecialchars($app_title) ?></div>
        <div class="splash-shimmer font-bold text-[10px] uppercase tracking-[0.2em]">Sistem Manajemen Terpadu</div>
        
        <div class="splash-loading-bar">
            <div class="splash-loading-progress"></div>
        </div>
    </div>

    <div id="app" class="flex h-screen overflow-hidden bg-slate-50">
        <!-- Sidebar will be injected here if logged in -->
        <div id="sidebar-container" class="h-full flex-shrink-0"></div>

        <!-- Main Content -->
        <div class="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden bg-slate-50">
            <!-- Header -->
            <header id="header-container"
                class="flex items-center justify-between px-8 py-3 bg-white border-b border-slate-100 sticky top-0 z-10 shadow-[0_1px_2px_rgba(0,0,0,0.03)] hidden">
                <div class="flex items-center space-x-4">
                    <button id="sidebar-toggle"
                        class="p-2 -ml-2 text-slate-400 hover:text-slate-600 transition lg:hidden">
                        <i data-lucide="menu" class="w-5 h-5"></i>
                    </button>
                    <div class="flex items-center text-[13px] font-medium">
                        <span class="text-slate-400 hover:text-brand-600 transition-colors cursor-pointer">Pages</span>
                        <i data-lucide="chevron-right" class="w-3.5 h-3.5 mx-2 text-slate-300"></i>
                        <span id="page-title" class="text-slate-900 font-bold tracking-tight">Dashboard</span>
                    </div>
                </div>
                <div class="flex items-center space-x-5">
                    <div class="hidden sm:flex items-center space-x-3 pr-5 border-r border-slate-100">
                        <div
                            class="w-7 h-7 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 font-bold text-[10px] ring-1 ring-brand-100">
                            <span id="user-initial">U</span>
                        </div>
                        <span id="user-name"
                            class="text-[13px] font-semibold text-slate-700 tracking-tight leading-none pt-0.5">User</span>
                    </div>
                    <button id="logout-btn"
                        class="text-[13px] font-semibold text-slate-500 hover:text-rose-600 flex items-center transition-all px-3 py-1.5 rounded-lg hover:bg-rose-50/50 group">
                        <i data-lucide="log-out"
                            class="w-4 h-4 mr-2 text-slate-400 group-hover:text-rose-500 transition-colors"></i>
                        Logout
                    </button>
                </div>
            </header>

            <!-- Main View Container -->
            <main class="w-full flex-grow p-4 md:p-8 pb-32 lg:pb-8 overflow-y-auto" id="main-view">
                <div class="max-w-7xl mx-auto w-full" id="app-content">
                    <!-- Views will be injected here -->
                    <div class="flex justify-center items-center h-64">
                        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
                    </div>
                </div>
            </main>

            <footer class="py-6 flex justify-center items-center space-x-2 text-xs text-slate-400 font-medium">
                <span>&copy; <?= date('Y') ?> <a href="https://crudworks.com" target="_blank"
                        class="hover:text-brand-600 transition-colors">CRUDWorks.com</a> - Allright Reserved. </span>

            </footer>
        </div>
    </div>

    <!-- Floating AI Chatbot -->
    <div id="ai-chatbot-container" class="hidden fixed bottom-28 md:bottom-6 right-6 z-[200] flex flex-col items-end">
        <!-- Chat Window -->
        <div id="chatbot-window"
            class="hidden mb-4 w-[360px] max-w-[90vw] h-[500px] bg-white rounded-[2.5rem] shadow-2xl border border-brand-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
            <!-- Header -->
            <div class="p-6 bg-brand-600 text-white flex items-center justify-between shadow-lg">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <i data-lucide="bot" class="w-6 h-6"></i>
                    </div>
                    <div>
                        <h3 class="text-sm font-black uppercase tracking-tight">Asisten Pak RT (AI)</h3>
                        <div class="flex items-center gap-1.5">
                            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            <span class="text-[9px] font-black uppercase tracking-widest text-brand-100">Online & Siap
                                Bantu</span>
                        </div>
                    </div>
                </div>
                <button id="btn-close-chatbot" class="p-2 hover:bg-white/10 rounded-xl transition-all">
                    <i data-lucide="chevron-down" class="w-5 h-5"></i>
                </button>
            </div>

            <!-- Messages Area -->
            <div id="chatbot-messages" class="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50 custom-scrollbar">
                <div class="flex items-start gap-3">
                    <div
                        class="w-8 h-8 rounded-lg bg-brand-100 text-brand-600 flex items-center justify-center flex-shrink-0">
                        <i data-lucide="bot" class="w-4 h-4"></i>
                    </div>
                    <div class="bg-white p-4 rounded-2xl rounded-tl-none border border-brand-50 shadow-sm">
                        <p class="text-xs font-bold text-slate-800 leading-relaxed">Halo pak! Saya Asisten AI
                            RT-Digital. Ada yang bisa saya bantu seputar data warga, iuran, atau informasi lingkungan?
                        </p>
                    </div>
                </div>
            </div>

            <!-- Predefined Chips -->
            <div class="px-6 py-2 bg-white border-t border-slate-50 flex gap-2 overflow-x-auto no-scrollbar">
                <button
                    class="chat-chip whitespace-nowrap px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100 text-[9px] font-black text-slate-500 uppercase hover:bg-brand-50 hover:border-brand-100 hover:text-brand-600 transition-all">Sisa
                    Saldo Kas?</button>
                <button
                    class="chat-chip whitespace-nowrap px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100 text-[9px] font-black text-slate-500 uppercase hover:bg-brand-50 hover:border-brand-100 hover:text-brand-600 transition-all">Jumlah
                    Warga?</button>
                <button
                    class="chat-chip whitespace-nowrap px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100 text-[9px] font-black text-slate-500 uppercase hover:bg-brand-50 hover:border-brand-100 hover:text-brand-600 transition-all">Aturan
                    Tamu?</button>
            </div>

            <!-- Input Area -->
            <div class="p-4 bg-white border-t border-slate-100">
                <div
                    class="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/10 transition-all">
                    <input type="text" id="chatbot-input" placeholder="Ketik pertanyaan bapak..."
                        class="flex-1 bg-transparent border-none focus:outline-none text-xs font-bold py-2">
                    <button id="btn-send-chat"
                        class="p-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-all shadow-lg active:scale-95">
                        <i data-lucide="send" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
        </div>

        <!-- Toggle Button -->
        <button id="btn-toggle-chatbot"
            class="w-14 h-14 rounded-2xl bg-brand-600 text-white flex items-center justify-center shadow-2xl hover:bg-brand-700 transition-all animate-bounce-slow active:scale-90 group relative">
            <div
                class="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full border-2 border-white flex items-center justify-center">
                <span class="w-1.5 h-1.5 rounded-full bg-white"></span>
            </div>
            <i data-lucide="message-square" class="w-7 h-7 group-hover:hidden"></i>
            <i data-lucide="bot" class="w-7 h-7 hidden group-hover:block"></i>
        </button>
    </div>

    <!-- Scripts -->
    <script type="module" src="<?= BASE_PATH ?>/assets/js/app.js?v=<?= date('Ymd') ?>"></script>
    <?php if (!empty($_GET['google_linked'])): ?>
        <script>
            // Redirect SPA to profile security section after Google account link
            window.location.replace('#/profile?section=security&linked=1');
        </script>
    <?php endif; ?>
    <script>
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('<?= BASE_PATH ?>/service-worker.js')
                    .then(registration => {
                        console.log('ServiceWorker registration successful with scope: ', registration.scope);
                    })
                    .catch(err => {
                        console.log('ServiceWorker registration failed: ', err);
                    });
            });
        }
    </script>
</body>

</html>