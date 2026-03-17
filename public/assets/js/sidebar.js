const Sidebar = {
    container: document.getElementById('sidebar-container'),
    menuData: null,

    async loadMenu() {
        if (!this.menuData) {
            const basePath = document.querySelector('meta[name="base-path"]')?.content || '';
            const response = await fetch(`${basePath}/assets/json/menu.json?t=${new Date().getTime()}`);
            this.menuData = await response.json();
        }
        return this.menuData;
    },

    async render(userData) {
        // Handle both user object and simple role string for backward compatibility
        if (!userData) return;
        const user = typeof userData === 'object' ? userData : { role: userData, full_name: userData };
        const role = String(user.role || 'User');

        const data = await this.loadMenu();

        const categories = data.sidebar;
        const currentHash = window.location.hash || '#/';

        // Fetch settings for dynamic branding
        const settingsRes = await fetch(`${document.querySelector('meta[name="base-path"]')?.content || ''}/api/settings`);
        const settings = await settingsRes.json();
        const appTitle = settings.app_title || 'RT-Digital';

        // Fetch counts for badges independently
        let unpaidCount = 0;
        let alertCount = 0;
        let unpaidUsersCount = 0;

        const basePath = document.querySelector('meta[name="base-path"]')?.content || '';

        try {
            const unpaidRes = await fetch(`${basePath}/api/invoices/unpaid-count`);
            if (unpaidRes.ok) {
                const unpaidData = await unpaidRes.json();
                unpaidCount = unpaidData.count || 0;
            }
        } catch (e) { console.error('Unpaid count fetch failed', e); }

        try {
            const alertRes = await fetch(`${basePath}/api/attendance/alert-count`);
            if (alertRes.ok) {
                const alertData = await alertRes.json();
                alertCount = alertData.count || 0;
            }
        } catch (e) { console.error('Alert count fetch failed', e); }

        try {
            const usersRes = await fetch(`${basePath}/api/invoices/unpaid-users-count`);
            if (usersRes.ok) {
                const usersData = await usersRes.json();
                unpaidUsersCount = usersData.count || 0;
            }
        } catch (e) { console.error('Unpaid users count fetch failed', e); }

        let html = `
        <!-- Overlay for Mobile -->
        <div id="sidebar-overlay" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[90] hidden lg:hidden"></div>

        <div id="sidebar-main" class="flex flex-col w-72 lg:w-64 h-full bg-white border-r border-slate-100 hidden lg:flex fixed lg:relative inset-y-0 left-0 z-[100] transition-transform duration-300">
            <!-- Logo Area -->
            <div class="h-16 flex items-center px-6 border-b border-slate-100">
                <div class="flex items-center space-x-2.5">
                    <div class="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm">
                        <i data-lucide="home" class="w-5 h-5"></i>
                    </div>
                    <div class="flex flex-col">
                        <span class="text-sm font-bold text-slate-900 tracking-tight leading-none">${appTitle}</span>
                        <a href="#/changelog" class="text-[10px] font-medium text-slate-500 mt-1 uppercase tracking-wider hover:text-brand-600 transition-colors">Versi ${settings.app_version || '1.0.0'}</a>
                    </div>
                </div>
            </div>

            <!-- Navigation Area -->
            <div class="flex-1 overflow-y-auto py-6 px-3 custom-scrollbar">
                <nav class="space-y-0.5">
        `;

        categories.forEach(cat => {
            const hasVisibleItem = cat.items.some(item => {
                if (item.roles && item.roles.includes(role)) return true;
                if (item.children && item.children.some(child => child.roles.includes(role))) return true;
                return false;
            });

            if (!hasVisibleItem) return;

            // Category Header
            html += `<div class="px-3 mt-6 mb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">${cat.category}</div>`;

            cat.items.forEach(item => {
                const isItemAllowed = item.roles && item.roles.includes(role);
                const hasVisibleChildren = item.children && item.children.some(child => child.roles.includes(role));

                if (!isItemAllowed && !hasVisibleChildren) return;

                if (item.children) {
                    const isAnyChildActive = item.children.some(child => currentHash.startsWith(child.path));

                    // Check if any child needs a badge (to show on parent when collapsed)
                    const hasAlertInChild = item.children.some(child => {
                        const isChildInvoice = child.path === '#/invoice-admin' || child.path === '#/invoice-resident';
                        const isChildPatrol = child.path === '#/patrol-status';
                        return (unpaidCount > 0 && isChildInvoice) || (alertCount > 0 && isChildPatrol);
                    });

                    html += `
                        <div class="relative">
                            <button onclick="Sidebar.toggleSubmenu(this)" class="w-full flex items-center justify-between px-3 py-2 text-[13px] font-medium transition-all rounded-md ${isAnyChildActive ? 'text-brand-600 bg-brand-50/40' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'} group">
                                <div class="flex items-center">
                                    <i data-lucide="${item.icon}" class="w-4 h-4"></i>
                                    <span class="ml-3">${item.name}</span>
                                    ${hasAlertInChild ? `
                                        <span class="ml-1.5 flex h-1.5 w-1.5 rounded-full bg-rose-500 shadow-[0_0_5px_rgba(244,63,94,0.4)]"></span>
                                    ` : ''}
                                </div>
                                <i data-lucide="chevron-right" class="w-3.5 h-3.5 transition-transform duration-200 ${isAnyChildActive ? 'rotate-90' : ''} submenu-chevron"></i>
                            </button>
                            <div class="${isAnyChildActive ? '' : 'hidden'} mt-1 ml-4 pl-3.5 border-l border-slate-100 space-y-0.5 submenu-container">
                                ${item.children.map(child => {
                        if (!child.roles.includes(role)) return '';
                        const isChildActive = currentHash.startsWith(child.path);

                        const isChildInvoice = child.path === '#/invoice-admin' || child.path === '#/invoice-resident';
                        const isChildPatrol = child.path === '#/patrol-status';
                        const showChildBadge = (unpaidCount > 0 && isChildInvoice) || (alertCount > 0 && isChildPatrol);

                        return `
                                        <a href="${child.path}" class="relative transition-all block py-1.5 px-2 text-[13px] rounded-md transition-colors ${isChildActive ? 'text-brand-600 font-semibold bg-brand-50/40' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}">
                                            ${child.name}
                                            ${showChildBadge ? `
                                                <span class="absolute right-2 top-1/2 -translate-y-1/2 flex h-2 w-2">
                                                    <span class="animate-pulse-red absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                                    <span class="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                                                </span>
                                            ` : ''}
                                        </a>
                                    `;
                    }).join('')}
                            </div>
                        </div>
                    `;
                } else {
                    const isActive = currentHash.startsWith(item.path);
                    const activeClass = isActive
                        ? 'bg-brand-50/50 text-brand-600 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900';

                    // Check if badge is needed
                    const isInvoiceMenu = item.path === '#/invoice-admin' || item.path === '#/invoice-resident';
                    const isPatrolMenu = item.path === '#/patrol-status';
                    const isWargaMenu = item.path === '#/warga';
                    const isAiMenu = item.name.includes('(AI)') || item.path === '#/demographics';

                    const showBadge = (unpaidCount > 0 && isInvoiceMenu) || (alertCount > 0 && isPatrolMenu);
                    const showWargaBadge = unpaidUsersCount > 0 && isWargaMenu;

                    html += `
                        <a href="${item.path}" class="group relative flex items-center px-3 py-2 text-[13px] font-medium transition-all rounded-md ${activeClass}">
                            ${isActive ? '<div class="absolute left-0 top-1.5 bottom-1.5 w-1 bg-brand-600 rounded-r-full"></div>' : ''}
                            <i data-lucide="${item.icon}" class="w-4 h-4"></i>
                            <span class="ml-3">${item.name}</span>
                            ${isAiMenu ? `
                                <div class="ml-auto flex items-center gap-2">
                                    <span class="px-1.5 py-0.5 bg-brand-600 text-[8px] font-black text-white rounded-md flex items-center gap-1 shadow-sm">
                                        <i data-lucide="sparkles" class="w-2 h-2"></i>
                                        AI
                                    </span>
                                </div>
                            ` : ''}
                            ${showBadge ? `
                                <span class="absolute right-3 flex h-2 w-2">
                                    <span class="animate-pulse-red absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                    <span class="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                                </span>
                            ` : ''}
                            ${showWargaBadge ? `
                                <span class="absolute right-3 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full animate-pulse-red">
                                    ${unpaidUsersCount}
                                </span>
                            ` : ''}
                        </a>
                    `;
                }
            });
        });

        html += `
                </nav>
            </div>

            <!-- Profile Hub Area -->
            <div class="p-4 border-t border-slate-100 relative">
                <!-- Dropup Menu -->
                <div id="profile-dropup" class="absolute bottom-full left-4 right-4 mb-2 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 hidden animate-in slide-in-from-bottom-2 duration-200 z-[110]">
                    <a href="#/profile" class="flex items-center px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-brand-600 transition-colors">
                        <i data-lucide="user" class="w-4 h-4 mr-3 text-slate-400"></i>
                        Profil Saya
                    </a>
                    <a href="#/profile?section=security" class="flex items-center px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-brand-600 transition-colors">
                        <i data-lucide="shield-check" class="w-4 h-4 mr-3 text-slate-400"></i>
                        Keamanan
                    </a>
                    <div class="h-px bg-slate-50 my-1 mx-2"></div>
                    <button onclick="window.handleLogout()" class="w-full flex items-center px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors">
                        <i data-lucide="log-out" class="w-4 h-4 mr-3"></i>
                        Keluar Sesi
                    </button>
                </div>

                <div id="btn-profile-hub" class="flex items-center p-3 rounded-2xl hover:bg-slate-50 active:bg-slate-100 transition-all cursor-pointer group border border-transparent hover:border-slate-100 relative">
                    <div class="relative">
                        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-600 flex items-center justify-center font-black text-sm shadow-sm border border-brand-200/20">
                            ${(user.full_name || role).charAt(0).toUpperCase()}
                        </div>
                        <span class="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full">
                            <span class="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-25"></span>
                        </span>
                    </div>
                    <div class="ml-3 overflow-hidden">
                        <p class="text-[13px] font-black text-slate-900 truncate tracking-tight leading-none mb-1.5">${user.full_name || 'User'}</p>
                        <div class="flex items-center">
                            <span class="px-2 py-0.5 rounded-md ${role === 'Admin' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                role === 'Satpam' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                    role === 'Bendahara' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                        'bg-emerald-50 text-emerald-600 border-emerald-100'
            } text-[9px] font-black uppercase tracking-widest border border-opacity-50">${role}</span>
                        </div>
                    </div>
                    <div class="ml-auto flex flex-col items-center">
                         <i data-lucide="chevron-up" class="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-transform" id="profile-hub-chevron"></i>
                    </div>
                </div>
            </div>
        </div>

        <!-- Mobile Bottom Tab Bar -->
        <div class="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-slate-100 px-6 py-2 flex items-center justify-between z-50 lg:hidden shadow-[0_-1px_10px_rgba(0,0,0,0.02)]">
        `;

        const mobileTabs = data.mobileTabs;
        mobileTabs.forEach(tab => {
            if (tab.roles.includes(role)) {
                const isActive = currentHash.startsWith(tab.path);
                const isInvoiceTab = tab.path === '#/invoice-admin' || tab.path === '#/invoice-resident';
                const isPatrolTab = tab.path === '#/patrol-status';

                const showBadge = (unpaidCount > 0 && isInvoiceTab) || (alertCount > 0 && isPatrolTab);

                html += `
                    <a href="${tab.path}" class="relative flex flex-col items-center py-1.5 px-3 rounded-lg transition-all ${isActive ? 'text-brand-600' : 'text-slate-400 hover:text-slate-600 focus:text-brand-500'}">
                        <i data-lucide="${tab.icon}" class="w-5 h-5 mb-1 ${isActive ? 'fill-brand-50' : ''}"></i>
                        <span class="text-[10px] font-bold tracking-tight">${tab.name}</span>
                        ${showBadge ? `
                            <span class="absolute top-1 right-3 flex h-2 w-2">
                                <span class="animate-pulse-red absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                <span class="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                            </span>
                        ` : ''}
                    </a>
                `;
            }
        });

        html += `</div>`;

        this.container.innerHTML = html;
        if (window.lucide) {
            lucide.createIcons();
        }
        this.initMobileHandlers();

        // Close sidebar on link click (Mobile)
        this.container.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                const sidebar = document.getElementById('sidebar-main');
                const overlay = document.getElementById('sidebar-overlay');
                if (window.innerWidth < 1024) {
                    sidebar?.classList.add('hidden');
                    overlay?.classList.add('hidden');
                }
            });
        });

        // Profile Hub Handlers
        const btnHub = document.getElementById('btn-profile-hub');
        const dropup = document.getElementById('profile-dropup');
        const chevron = document.getElementById('profile-hub-chevron');

        if (btnHub && dropup) {
            btnHub.onclick = (e) => {
                e.stopPropagation();
                const isHidden = dropup.classList.contains('hidden');
                dropup.classList.toggle('hidden');
                if (chevron) {
                    chevron.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
                }
            };

            // Close when clicking outside
            document.addEventListener('click', (e) => {
                if (!dropup.contains(e.target) && !btnHub.contains(e.target)) {
                    dropup.classList.add('hidden');
                    if (chevron) chevron.style.transform = 'rotate(0deg)';
                }
            });
        }
    },

    toggleSubmenu(btn) {
        const container = btn.nextElementSibling;
        const chevron = btn.querySelector('.submenu-chevron');

        const isHidden = container.classList.contains('hidden');

        if (isHidden) {
            container.classList.remove('hidden');
            chevron.classList.add('rotate-90');
        } else {
            container.classList.add('hidden');
            chevron.classList.remove('rotate-90');
        }
    },

    initMobileHandlers() {
        const toggleBtn = document.getElementById('sidebar-toggle');
        const sidebar = document.getElementById('sidebar-main');
        const overlay = document.getElementById('sidebar-overlay');

        if (toggleBtn && sidebar && overlay) {
            const toggle = () => {
                const isHidden = sidebar.classList.contains('hidden');
                if (isHidden) {
                    sidebar.classList.remove('hidden');
                    overlay.classList.remove('hidden');
                    document.body.style.overflow = 'hidden'; // Prevent background scroll
                } else {
                    sidebar.classList.add('hidden');
                    overlay.classList.add('hidden');
                    document.body.style.overflow = '';
                }
            };

            toggleBtn.onclick = toggle;
            overlay.onclick = toggle;
        }
    }
};

window.Sidebar = Sidebar;
export default Sidebar;
