
import API from '../api.js';
import Sidebar from '../sidebar.js';

export const Profile = async (App) => {
    document.getElementById('header-container').classList.remove('hidden');
    document.getElementById('page-title').innerText = 'Profil Saya';

    // Force refresh user data to get latest house number
    const user = await App.getUser(true);
    await Sidebar.render(user);

    // Theme Data
    const settings = await API.get('/api/settings') || {};

    // Initial Active Section
    const hashParts = window.location.hash.split('?');
    const params = new URLSearchParams(hashParts[1] || '');
    let activeSection = params.get('section') || 'overview';

    // Theme Data
    const themes = [
        { id: 'emerald', name: 'Emerald Green', color: 'bg-emerald-500', hex: '#10b981' },
        { id: 'blue', name: 'Royal Blue', color: 'bg-blue-500', hex: '#3b82f6' },
        { id: 'rose', name: 'Velvet Rose', color: 'bg-rose-500', hex: '#f43f5e' },
        { id: 'amber', name: 'Golden Amber', color: 'bg-amber-500', hex: '#f59e0b' },
        { id: 'indigo', name: 'Deep Indigo', color: 'bg-indigo-500', hex: '#6366f1' },
    ];
    const currentTheme = localStorage.getItem('app-theme') || 'emerald';

    // Containers for dynamic content
    let activityLogs = [];
    let familyMembers = []; // Store family members data
    // We will load activity logs on demand or initial load if section is activity

    const render = () => {
        App.container.innerHTML = `
        <div class="max-w-5xl mx-auto pb-32 animate-in fade-in duration-500">
            <!-- Header Profile Card -->
            <div class="relative rounded-[3rem] overflow-hidden bg-white border border-slate-100 shadow-2xl shadow-slate-200/50 mb-10 group">
                 <div class="absolute top-0 left-0 w-full h-40 bg-gradient-to-r from-brand-600 to-brand-400 transition-all duration-500 group-hover:scale-[1.02]"></div>
                 <div class="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                 
                 <div class="relative px-8 md:px-12 pb-10 pt-20 flex flex-col md:flex-row items-center md:items-end">
                    <div class="w-28 h-28 md:w-36 md:h-36 rounded-[2rem] bg-white p-2 shadow-2xl rotate-3 md:rotate-0 transition-transform hover:rotate-6 ring-4 ring-white/50 backdrop-blur-sm">
                        <div class="w-full h-full bg-slate-100 rounded-[1.5rem] flex items-center justify-center text-4xl md:text-6xl font-black text-slate-300 overflow-hidden relative">
                            ${user.full_name.charAt(0)}
                            <div class="absolute inset-0 bg-gradient-to-tr from-black/0 to-black/5"></div>
                        </div>
                    </div>
                    <div class="md:ml-8 text-center md:text-left mt-6 md:mt-0 flex-1">
                        <h2 class="text-3xl md:text-4xl font-black text-slate-900 mb-2 tracking-tight">${user.full_name}</h2>
                        <div class="flex flex-wrap justify-center md:justify-start gap-3">
                            <span class="px-4 py-1.5 bg-slate-100 text-slate-600 rounded-full text-[11px] font-bold uppercase tracking-widest border border-slate-200 shadow-sm">
                                @${user.username}
                            </span>
                            <span class="px-4 py-1.5 ${user.role === 'Admin' ? 'bg-rose-100 text-rose-700 border-rose-200' :
                user.role === 'Satpam' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                    user.role === 'Bendahara' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                        'bg-emerald-100 text-emerald-700 border-emerald-200'
            } rounded-full text-[11px] font-black uppercase tracking-widest border shadow-sm flex items-center">
                                ${user.role === 'Admin' ? '<i data-lucide="shield-alert" class="w-3 h-3 mr-1.5"></i>' : ''}
                                ${user.role}
                            </span>
                        </div>
                    </div>
                    <div class="mt-8 md:mt-0 flex flex-col items-end space-y-2">
                        <button onclick="window.history.back()" class="px-6 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-all text-xs shadow-sm hover:shadow-md">
                            Kembali
                        </button>
                        <p class="text-[10px] font-medium text-slate-400">Terdaftar sejak ${new Date(user.created_at || new Date()).getFullYear()}</p>
                    </div>
                 </div>
            </div>

            <!-- Navigation Tabs -->
            <div class="flex flex-wrap justify-center md:justify-start gap-2 p-2 bg-white rounded-[2rem] border border-slate-100 shadow-lg shadow-slate-100/50 mb-10 w-fit mx-auto md:mx-0 overflow-x-auto max-w-full">
                <button id="tab-overview" class="tab-btn px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wide transition-all text-slate-500 hover:bg-slate-50 hover:text-slate-900">
                    <i data-lucide="user-cog" class="w-4 h-4 inline mr-2 mb-0.5"></i> Edit Profil
                </button>
                <button id="tab-card" class="tab-btn px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wide transition-all text-slate-500 hover:bg-slate-50 hover:text-slate-900">
                    <i data-lucide="credit-card" class="w-4 h-4 inline mr-2 mb-0.5"></i> Kartu Warga
                </button>
                ${user.no_rumah ? `
                <button id="tab-family" class="tab-btn px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wide transition-all text-slate-500 hover:bg-slate-50 hover:text-slate-900">
                    <i data-lucide="users" class="w-4 h-4 inline mr-2 mb-0.5"></i> Keluarga
                </button>
                ` : ''}
                <button id="tab-theme" class="tab-btn px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wide transition-all text-slate-500 hover:bg-slate-50 hover:text-slate-900">
                    <i data-lucide="palette" class="w-4 h-4 inline mr-2 mb-0.5"></i> Tema
                </button>
                 <button id="tab-activity" class="tab-btn px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wide transition-all text-slate-500 hover:bg-slate-50 hover:text-slate-900">
                    <i data-lucide="activity" class="w-4 h-4 inline mr-2 mb-0.5"></i> Aktivitas
                </button>
                <button id="tab-security" class="tab-btn px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wide transition-all text-slate-500 hover:bg-slate-50 hover:text-slate-900">
                    <i data-lucide="shield-check" class="w-4 h-4 inline mr-2 mb-0.5"></i> Keamanan
                </button>
            </div>

            <!-- Layout Grid -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                <!-- Left Panel (Details) -->
                <div class="lg:col-span-1 space-y-6">
                    <!-- Data System -->
                    <div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-lg shadow-slate-200/50 relative overflow-hidden">
                        <div class="absolute top-0 right-0 -mr-10 -mt-10 w-32 h-32 bg-slate-50 rounded-full"></div>
                        <h3 class="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 relative">Detail Sistem</h3>
                        <div class="space-y-5 relative">
                            <div class="flex items-center group">
                                <div class="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center mr-4 text-indigo-500 group-hover:scale-110 transition-transform">
                                    <i data-lucide="hash" class="w-5 h-5"></i>
                                </div>
                                <div>
                                    <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">User ID</p>
                                    <p class="text-base font-black text-slate-800 font-mono">#${user.id.toString().padStart(4, '0')}</p>
                                </div>
                            </div>
                            <div class="flex items-center group">
                                <div class="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center mr-4 text-amber-500 group-hover:scale-110 transition-transform">
                                    <i data-lucide="calendar-check" class="w-5 h-5"></i>
                                </div>
                                <div>
                                    <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Status Akun</p>
                                    <p class="text-sm font-black text-slate-800 flex items-center">
                                        <span class="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
                                        Aktif Terverifikasi
                                    </p>
                                </div>
                            </div>
                             ${user.no_rumah ? `
                            <div class="p-5 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-3xl text-white shadow-lg shadow-emerald-500/20 group cursor-default hover:-translate-y-1 transition-transform">
                                 <div class="flex items-center justify-between mb-4">
                                    <div class="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                                        <i data-lucide="home" class="w-5 h-5 text-white"></i>
                                    </div>
                                    <span class="text-[10px] font-black uppercase tracking-widest opacity-70">Unit Warga</span>
                                 </div>
                                 <div>
                                    <p class="text-xs font-medium opacity-80 mb-1">Nomor Rumah</p>
                                    <p class="text-3xl font-black tracking-tight">${user.no_rumah}</p>
                                 </div>
                            </div>
                            ` : ''}
                        </div>
                    </div>

                    <!-- Quick Actions (Only for Warga) -->
                    ${user.role_id == 4 ? `
                    <div class="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl shadow-slate-900/20 text-white relative overflow-hidden group hover:shadow-2xl transition-all">
                        <div class="absolute -right-10 -bottom-10 w-40 h-40 bg-brand-500/20 rounded-full blur-3xl group-hover:bg-brand-500/30 transition-colors"></div>
                        <h3 class="text-xs font-black text-slate-500 uppercase tracking-widest mb-6">Akses Cepat</h3>
                         <button onclick="window.location.hash='#/my-qr'" class="w-full py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl border border-white/5 flex items-center justify-center font-bold transition-all active:scale-95 group-hover:border-white/20">
                            <i data-lucide="qr-code" class="w-5 h-5 mr-3"></i> Buka My QR
                        </button>
                    </div>
                    ` : ''}
                </div>

                <!-- Main Content Area -->
                <div class="lg:col-span-2 relative">
                    
                    <!-- SECTION: OVERVIEW (EDIT) -->
                    <div id="section-overview" class="section-content hidden bg-white p-8 md:p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div class="flex items-center mb-10">
                            <div class="w-14 h-14 bg-brand-50 text-brand-600 rounded-3xl flex items-center justify-center mr-6 shadow-sm">
                                <i data-lucide="user-cog" class="w-7 h-7"></i>
                            </div>
                            <div>
                                <h3 class="text-xl font-black text-slate-900">Edit Informasi Dasar</h3>
                                <p class="text-sm text-slate-500 font-medium mt-1">Perbarui nama publik dan kontak yang terdaftar di sistem.</p>
                            </div>
                        </div>
                        
                        <form id="form-profile-update" class="space-y-8">
                            <div class="space-y-3 group">
                                <label class="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-brand-600 transition-colors">Nama Lengkap</label>
                                <div class="relative">
                                    <input type="text" name="full_name" value="${user.full_name}" class="w-full p-5 pl-5 bg-slate-50 border-2 border-slate-100 rounded-3xl outline-none focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10 transition-all font-bold text-slate-800 text-lg placeholder:text-slate-300" required>
                                </div>
                            </div>
                            <div class="space-y-3 group">
                                <label class="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-brand-600 transition-colors">Nomor Telepon / WA</label>
                                <div class="relative">
                                    <input type="text" name="phone" value="${user.phone || ''}" placeholder="08..." class="w-full p-5 pl-5 bg-slate-50 border-2 border-slate-100 rounded-3xl outline-none focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10 transition-all font-bold text-slate-800 text-lg placeholder:text-slate-300">
                                    <div class="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                        <i data-lucide="phone" class="w-5 h-5"></i>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="pt-6 flex justify-end border-t border-slate-100">
                                <button type="submit" class="px-10 py-5 bg-brand-600 text-white font-black rounded-[1.5rem] shadow-xl shadow-brand-500/30 hover:bg-brand-700 hover:-translate-y-1 active:scale-95 transition-all flex items-center text-sm group">
                                    <i data-lucide="save" class="w-5 h-5 mr-3 group-hover:animate-bounce"></i> SIMPAN PERUBAHAN
                                </button>
                            </div>
                        </form>
                    </div>


                    <!-- SECTION: FAMILY (DIGITAL KK) -->
                    <div id="section-family" class="section-content hidden bg-white p-8 md:p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50 animate-in fade-in slide-in-from-bottom-4 duration-300">
                         <div class="flex items-center mb-10">
                            <div class="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mr-6 shadow-sm">
                                <i data-lucide="users" class="w-7 h-7"></i>
                            </div>
                            <div>
                                <h3 class="text-xl font-black text-slate-900">Anggota Keluarga</h3>
                                <p class="text-sm text-slate-500 font-medium mt-1">Daftar warga yang terdaftar dalam satu rumah.</p>
                            </div>
                        </div>

                        <div id="family-container-loader" class="hidden flex justify-center py-10">
                            <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500"></div>
                        </div>

                        <div id="family-container-list" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <!-- Family items injected by JS -->
                        </div>

                        <div class="mt-8 p-6 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-center">
                            <p class="text-xs text-slate-500">Data keluarga berdasarkan nomor rumah yang terdaftar.</p>
                        </div>
                    </div>

                    <!-- SECTION: CARD (DIGITAL ID) -->
                    <div id="section-card" class="section-content hidden bg-white p-8 md:p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50 animate-in fade-in slide-in-from-bottom-4 duration-300">
                         <div class="flex items-center justify-between mb-8">
                            <div class="flex items-center">
                                <div class="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mr-4 shadow-sm">
                                    <i data-lucide="credit-card" class="w-6 h-6"></i>
                                </div>
                                <div>
                                    <h3 class="text-lg font-black text-slate-900">Kartu Warga Digital</h3>
                                    <p class="text-xs text-slate-500 font-medium mt-0.5">Identitas resmi dalam aplikasi.</p>
                                </div>
                            </div>
                            <button onclick="window.print()" class="p-3 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-colors" title="Print / Simpan PDF">
                                <i data-lucide="printer" class="w-5 h-5"></i>
                            </button>
                        </div>

                        <!-- Card Mockup -->
                        <div class="relative w-full aspect-[1.586] rounded-[2rem] overflow-hidden shadow-2xl shadow-indigo-500/20 group perspective">
                            <!-- Background -->
                            <div class="absolute inset-0 bg-slate-900">
                                <div class="absolute top-0 right-0 w-[80%] h-[80%] bg-gradient-to-bl from-indigo-600 to-violet-600 rounded-bl-full opacity-80"></div>
                                <div class="absolute bottom-0 left-0 w-[60%] h-[60%] bg-gradient-to-tr from-brand-600 to-emerald-600 rounded-tr-full opacity-80"></div>
                                <div class="absolute inset-0 bg-cover opacity-10 mix-blend-overlay" style="background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIi8+CjxwYXRoIGQ9Ik0wIDBMNCA0Wk00IDBMMCA0WiIgc3Ryb2tlPSIjMDAwIiBzdHJva2Utd2lkdGg9IjEiLz4KPC9zdmc+');"></div>
                            </div>

                            <!-- Content -->
                            <div class="absolute inset-0 p-8 flex flex-col justify-between text-white z-10">
                                <div class="flexjustify-between items-start">
                                    <div class="flex items-center space-x-3">
                                        <div class="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 overflow-hidden">
                                            ${settings.app_logo ?
                `<img src="${settings.app_logo}" class="w-full h-full object-cover">` :
                `<i data-lucide="zap" class="w-6 h-6 text-white fill-white"></i>`
            }
                                        </div>
                                        <div>
                                            <h4 class="text-lg font-black tracking-tight leading-none">${settings.app_title || 'RT Digital'}</h4>
                                            <p class="text-[9px] uppercase tracking-widest opacity-70 font-bold">${settings.rt_name || 'Official Member Card'}</p>
                                        </div>
                                    </div>
                                    <div class="px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-[10px] font-black uppercase tracking-widest">
                                        ${user.role}
                                    </div>
                                </div>

                                <div class="flex items-end justify-between">
                                    <div>
                                        <p class="text-[10px] uppercase tracking-widest opacity-60 font-bold mb-1">Nama Pemegang</p>
                                        <p class="text-2xl font-black tracking-tight text-white mb-4 line-clamp-1">${user.full_name}</p>
                                        
                                        <div class="flex space-x-6">
                                            <div>
                                                <p class="text-[8px] uppercase tracking-widest opacity-60 font-bold mb-0.5">ID Member</p>
                                                <p class="text-sm font-bold font-mono text-white/90">${user.id.toString().padStart(6, '0')}</p>
                                            </div>
                                            <div>
                                                <p class="text-[8px] uppercase tracking-widest opacity-60 font-bold mb-0.5">Bergabung</p>
                                                <p class="text-sm font-bold font-mono text-white/90">${new Date(user.created_at || new Date()).getFullYear()}</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- QR Display -->
                                    <div class="bg-white p-2 rounded-2xl shadow-lg">
                                        <div id="card-qrcode"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <p class="text-center text-xs text-slate-400 mt-6 font-medium italic">Kartu ini sah sebagai bukti identitas warga/petugas dalam lingkungan.</p>
                    </div>

                    <!-- SECTION: THEME (PERSONALIZATION) -->
                    <div id="section-theme" class="section-content hidden bg-white p-8 md:p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div class="flex items-center mb-10">
                            <div class="w-14 h-14 bg-fuchsia-50 text-fuchsia-600 rounded-3xl flex items-center justify-center mr-6 shadow-sm">
                                <i data-lucide="palette" class="w-7 h-7"></i>
                            </div>
                            <div>
                                <h3 class="text-xl font-black text-slate-900">Personalisasi Tema</h3>
                                <p class="text-sm text-slate-500 font-medium mt-1">Pilih warna aksen aplikasi sesuai selera Anda.</p>
                            </div>
                        </div>

                        <div class="grid grid-cols-2 md:grid-cols-3 gap-6">
                            ${themes.map(t => `
                                <button onclick="window.changeTheme('${t.id}')" class="group relative p-6 rounded-[2rem] border-2 transition-all ${currentTheme === t.id ? 'border-slate-800 bg-slate-50' : 'border-slate-100 hover:border-slate-200 hover:bg-white'}">
                                    <div class="w-16 h-16 rounded-2xl ${t.color} shadow-lg mb-4 mx-auto transform group-hover:scale-110 transition-transform flex items-center justify-center">
                                        ${currentTheme === t.id ? '<i data-lucide="check" class="w-8 h-8 text-white"></i>' : ''}
                                    </div>
                                    <p class="text-center text-sm font-bold ${currentTheme === t.id ? 'text-slate-900' : 'text-slate-500'}">${t.name}</p>
                                    ${currentTheme === t.id ? '<span class="absolute top-4 right-4 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"></span>' : ''}
                                </button>
                            `).join('')}
                        </div>
                        
                        <div class="mt-10 p-6 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-center">
                            <p class="text-xs text-slate-500">Tema akan tersimpan di perangkat ini dan diterapkan otomatis saat login.</p>
                        </div>
                    </div>

                    <!-- SECTION: ACTIVITY (TIMELINE) -->
                    <div id="section-activity" class="section-content hidden bg-white p-8 md:p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50 animate-in fade-in slide-in-from-bottom-4 duration-300">
                         <div class="flex items-center mb-10">
                            <div class="w-14 h-14 bg-sky-50 text-sky-600 rounded-3xl flex items-center justify-center mr-6 shadow-sm">
                                <i data-lucide="activity" class="w-7 h-7"></i>
                            </div>
                            <div>
                                <h3 class="text-xl font-black text-slate-900">Riwayat Aktivitas</h3>
                                <p class="text-sm text-slate-500 font-medium mt-1">Jejak digital interaksi Anda dengan sistem.</p>
                            </div>
                        </div>

                        <div id="activity-container-loader" class="hidden flex justify-center py-10">
                            <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500"></div>
                        </div>

                        <div id="activity-container-list">
                             <!-- Activity items injected by JS -->
                        </div>
                    </div>

                    <!-- SECTION: SECURITY (PASSWORD) -->
                    <div id="section-security" class="section-content hidden bg-white p-8 md:p-10 rounded-[3rem] border border-rose-100 shadow-xl shadow-rose-500/5 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div class="flex items-center mb-10">
                            <div class="w-14 h-14 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mr-6 shadow-sm">
                                <i data-lucide="lock" class="w-7 h-7"></i>
                            </div>
                            <div>
                                <h3 class="text-xl font-black text-slate-900">Keamanan Akun</h3>
                                <p class="text-sm text-slate-500 font-medium mt-1">Ubah kata sandi untuk melindungi privasi data Anda.</p>
                            </div>
                        </div>
                        
                        <form id="form-password-update" class="space-y-6">
                            <div class="space-y-3 group">
                                <label class="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-rose-500 transition-colors">Kata Sandi Saat Ini</label>
                                <div class="relative">
                                    <input type="password" name="current_password" class="w-full p-5 pl-5 bg-slate-50 border-2 border-slate-100 rounded-3xl outline-none focus:border-rose-500 focus:bg-white focus:ring-4 focus:ring-rose-500/10 transition-all font-bold text-slate-800" required>
                                    <i data-lucide="key" class="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300"></i>
                                </div>
                            </div>
                            <div class="space-y-3 group">
                                <label class="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-rose-500 transition-colors">Kata Sandi Baru</label>
                                <input type="password" name="new_password" class="w-full p-5 pl-5 bg-slate-50 border-2 border-slate-100 rounded-3xl outline-none focus:border-rose-500 focus:bg-white focus:ring-4 focus:ring-rose-500/10 transition-all font-bold text-slate-800" required>
                                <p class="text-[10px] text-slate-400 bg-slate-50 p-2.5 rounded-xl mt-2 border border-slate-100 flex items-center">
                                    <i data-lucide="info" class="w-3 h-3 mr-2"></i> Minimal 6 karakter, disarankan kombinasi huruf dan angka.
                                </p>
                            </div>
                            
                            <div class="pt-6 flex justify-end">
                                <button type="submit" class="px-10 py-5 bg-rose-600 text-white font-black rounded-[1.5rem] shadow-xl shadow-rose-500/30 hover:bg-rose-700 hover:-translate-y-1 active:scale-95 transition-all flex items-center text-sm group">
                                    <i data-lucide="shield-check" class="w-5 h-5 mr-3 group-hover:animate-pulse"></i> UPDATE KATA SANDI
                                </button>
                            </div>
                        </form>

                        <!-- Google Account Linking Card -->
                        <div class="mt-8 p-6 rounded-3xl border-2 bg-slate-50 border-slate-200">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-4">
                                    <div class="w-12 h-12 flex items-center justify-center bg-white rounded-2xl border border-slate-200 shadow-sm">
                                        <svg class="w-6 h-6" viewBox="0 0 24 24">
                                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                        </svg>
                                    </div>
                                    <div>
                                        <p class="text-sm font-black text-slate-900">Login dengan Google</p>
                                        ${user.google_email
                ? `<p class="text-xs text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                                                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                                                Terhubung: ${user.google_email}
                                               </p>`
                : `<p class="text-xs text-slate-400 font-medium mt-0.5">Belum terhubung</p>`
            }
                                    </div>
                                </div>
                                ${user.google_email
                ? `<button id="btn-unlink-google" class="px-5 py-2.5 text-xs font-black text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-2xl transition-all active:scale-95">
                                         Putuskan
                                       </button>`
                : `<a href="/app-rt/api/auth/google/link" class="px-5 py-2.5 text-xs font-black text-white bg-slate-900 hover:bg-slate-800 rounded-2xl transition-all active:scale-95 hover:-translate-y-0.5 shadow-md shadow-slate-900/20">
                                         Hubungkan
                                       </a>`
            }
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
        `;

        if (window.lucide) lucide.createIcons();
    };

    // Render Logic
    render();

    // Logic to Switch Tabs Smoothly
    const switchTab = async (sectionName) => {
        // Update URL silently
        const newUrl = window.location.href.split('?')[0] + '?section=' + sectionName;
        window.history.replaceState({ path: newUrl }, '', newUrl);

        // Update Tab Buttons Styles
        document.querySelectorAll('.tab-btn').forEach(btn => {
            const isTarget = btn.id === `tab-${sectionName}`;

            // Remove active classes
            btn.classList.remove('bg-brand-500', 'text-white', 'shadow-lg', 'ring-2', 'bg-rose-500', 'shadow-brand-500/30', 'shadow-rose-500/30', 'ring-brand-500/20', 'ring-rose-500/20');
            btn.classList.add('text-slate-500', 'hover:bg-slate-50', 'hover:text-slate-900');

            if (isTarget) {
                // Add active classes
                btn.classList.remove('text-slate-500', 'hover:bg-slate-50', 'hover:text-slate-900');
                if (sectionName === 'security') {
                    btn.classList.add('bg-rose-500', 'text-white', 'shadow-lg', 'shadow-rose-500/30', 'ring-2', 'ring-rose-500/20');
                } else {
                    btn.classList.add('bg-brand-500', 'text-white', 'shadow-lg', 'shadow-brand-500/30', 'ring-2', 'ring-brand-500/20');
                }
            }
        });

        // Hide all sections, show target
        document.querySelectorAll('.section-content').forEach(el => {
            el.classList.add('hidden');
        });
        const targetSection = document.getElementById(`section-${sectionName}`);
        if (targetSection) {
            targetSection.classList.remove('hidden');
        }

        // Special handling for Family Tab
        if (sectionName === 'family') {
            const listContainer = document.getElementById('family-container-list');
            const loader = document.getElementById('family-container-loader');

            if (listContainer && (!listContainer.innerHTML.trim() || familyMembers.length === 0)) {
                // Fetch data
                loader.classList.remove('hidden');
                listContainer.innerHTML = '';

                try {
                    const familyRes = await API.get('/api/profile/family');
                    familyMembers = Array.isArray(familyRes) ? familyRes : [];

                    if (familyMembers.length > 0) {
                        listContainer.innerHTML = familyMembers.map((member) => `
                            <div class="relative bg-slate-50 rounded-3xl p-6 border border-slate-100 group hover:border-brand-200 hover:shadow-lg hover:shadow-brand-500/5 transition-all">
                                <div class="flex items-start justify-between mb-4">
                                    <div class="flex items-center">
                                         <div class="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-xl font-black text-slate-300 shadow-sm mr-4 ring-4 ring-white">
                                            ${member.full_name.charAt(0)}
                                        </div>
                                        <div>
                                            <h4 class="text-sm font-black text-slate-900 group-hover:text-brand-600 transition-colors">${member.full_name} ${member.is_me ? '<span class="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full ml-1 align-middle">SAYA</span>' : ''}</h4>
                                            <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">${member.status_keluarga || (member.is_kk_head ? 'Kepala Keluarga' : 'Anggota Keluarga')}</p>
                                        </div>
                                    </div>
                                    ${member.is_kk_head ? '<div class="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center" title="Kepala Keluarga"><i data-lucide="crown" class="w-4 h-4"></i></div>' : (member.role_name === 'Admin' ? '<div class="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center"><i data-lucide="shield-alert" class="w-4 h-4"></i></div>' : '')}
                                </div>
                                
                                <div class="space-y-2 pt-4 border-t border-slate-100/50">
                                   ${member.wa_number ? `
                                    <a href="https://wa.me/${member.wa_number}" target="_blank" class="flex items-center text-xs text-slate-500 hover:text-emerald-600 transition-colors font-medium">
                                        <i data-lucide="message-circle" class="w-3.5 h-3.5 mr-2"></i>
                                        Chat WhatsApp
                                    </a>
                                   ` : ''}
                                    <div class="flex items-center text-xs text-slate-500 font-medium">
                                        <i data-lucide="user" class="w-3.5 h-3.5 mr-2 opacity-70"></i>
                                        ${member.role_name}
                                    </div>
                                </div>
                            </div>
                        `).join('');
                    } else {
                        listContainer.innerHTML = `
                             <div class="col-span-full flex flex-col items-center justify-center py-10 text-center animate-in fade-in">
                                <div class="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                    <i data-lucide="users" class="w-8 h-8 text-slate-300"></i>
                                </div>
                                <p class="text-slate-400 font-medium text-sm">Tidak ada anggota keluarga lain terdaftar.</p>
                            </div>
                        `;
                    }
                } catch (e) {
                    listContainer.innerHTML = `<p class="col-span-full text-center text-rose-500">Gagal memuat data keluarga.</p>`;
                } finally {
                    loader.classList.add('hidden');
                    if (window.lucide) lucide.createIcons();
                }
            }
        }

        // Special handling for Activity Tab
        if (sectionName === 'activity') {
            const listContainer = document.getElementById('activity-container-list');
            const loader = document.getElementById('activity-container-loader');

            if (listContainer && (!listContainer.innerHTML.trim() || activityLogs.length === 0)) {
                // Fetch data
                loader.classList.remove('hidden');
                listContainer.innerHTML = '';

                try {
                    const logsRes = await API.get('/api/profile/activity');
                    activityLogs = Array.isArray(logsRes) ? logsRes : [];

                    if (activityLogs.length > 0) {
                        listContainer.innerHTML = `
                            <div class="relative pl-4 border-l-2 border-slate-100 space-y-8 animate-in fade-in duration-500">
                                ${activityLogs.map((log) => {
                            const date = new Date(log.date);
                            return `
                                    <div class="relative pl-8 group">
                                        <div class="absolute -left-[21px] top-1 w-10 h-10 rounded-full border-4 border-white ${log.type === 'finance' ? 'bg-emerald-100 text-emerald-600' :
                                    log.type === 'patrol' ? 'bg-blue-100 text-blue-600' :
                                        'bg-slate-100 text-slate-500'
                                } flex items-center justify-center shadow-sm z-10">
                                            <i data-lucide="${log.type === 'finance' ? 'banknote' :
                                    log.type === 'patrol' ? 'shield' :
                                        'clock'
                                }" class="w-4 h-4"></i>
                                        </div>
                                        <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-1">
                                            <h4 class="text-sm font-black text-slate-800">${log.title}</h4>
                                            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 px-2 py-1 rounded-lg">
                                                ${date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p class="text-xs text-slate-500 leading-relaxed">${log.desc}</p>
                                        ${log.amount ? `<p class="text-xs font-black text-emerald-600 mt-1">Rp ${parseInt(log.amount).toLocaleString('id-ID')}</p>` : ''}
                                    </div>`;
                        }).join('')}
                            </div>
                        `;
                    } else {
                        listContainer.innerHTML = `
                             <div class="flex flex-col items-center justify-center py-10 text-center animate-in fade-in">
                                <div class="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                    <i data-lucide="history" class="w-8 h-8 text-slate-300"></i>
                                </div>
                                <p class="text-slate-400 font-medium text-sm">Belum ada aktivitas tercatat.</p>
                            </div>
                        `;
                    }
                } catch (e) {
                    listContainer.innerHTML = `<p class="text-center text-rose-500">Gagal memuat aktivitas.</p>`;
                } finally {
                    loader.classList.add('hidden');
                    if (window.lucide) lucide.createIcons();
                }
            }
        }

        // Special Handling for QR (Card Tab)
        if (sectionName === 'card' && window.QRCode) {
            const qrContainer = document.getElementById("card-qrcode");
            if (qrContainer && qrContainer.innerHTML === "") {
                new QRCode(qrContainer, {
                    text: user.qr_code_string || 'USER-' + user.id,
                    width: 64,
                    height: 64,
                    colorDark: "#0f172a",
                    colorLight: "#ffffff",
                    correctLevel: QRCode.CorrectLevel.H
                });
            }
        }
    };

    // Attach Listeners
    document.getElementById('tab-overview').onclick = () => switchTab('overview');
    document.getElementById('tab-card').onclick = () => switchTab('card');
    if (document.getElementById('tab-family')) document.getElementById('tab-family').onclick = () => switchTab('family');
    document.getElementById('tab-theme').onclick = () => switchTab('theme');
    document.getElementById('tab-activity').onclick = () => switchTab('activity');
    document.getElementById('tab-security').onclick = () => switchTab('security');

    // Init Logic
    switchTab(activeSection);

    // Google Link success notification
    if (params.get('linked') === '1') {
        Swal.fire({ icon: 'success', title: '✅ Berhasil!', text: 'Akun Google berhasil dihubungkan. Mulai sekarang Anda bisa login menggunakan Google.', confirmButtonColor: '#1e293b' });
        window.history.replaceState(null, '', window.location.pathname + '#/profile?section=security');
    }

    // Google Unlink button handler (set after render since button is conditional)
    const switchTabAndAttachUnlink = () => {
        const btnUnlink = document.getElementById('btn-unlink-google');
        if (btnUnlink) {
            btnUnlink.onclick = async () => {
                const confirm = await Swal.fire({
                    icon: 'warning',
                    title: 'Putuskan Akun Google?',
                    text: 'Setelah diputuskan, Anda tidak bisa login dengan Google sampai menghubungkan kembali.',
                    showCancelButton: true,
                    confirmButtonText: 'Ya, Putuskan',
                    cancelButtonText: 'Batal',
                    confirmButtonColor: '#dc2626',
                });
                if (!confirm.isConfirmed) return;
                try {
                    await API.post('/api/auth/google/unlink', {});
                    Swal.fire({ icon: 'success', title: 'Diputuskan!', text: 'Akun Google berhasil dilepas.', confirmButtonColor: '#1e293b' });
                    // Re-render profile to reflect change
                    await Profile(App);
                } catch (e) {
                    Swal.fire({ icon: 'error', title: 'Gagal', text: 'Terjadi kesalahan. Coba lagi.' });
                }
            };
        }
    };

    // Attach unlink handler after security tab is shown
    const origSwitchSecurity = document.getElementById('tab-security').onclick;
    document.getElementById('tab-security').onclick = async () => {
        await switchTab('security');
        switchTabAndAttachUnlink();
    };

    // If already on security section
    if (activeSection === 'security') switchTabAndAttachUnlink();

    // Theme Change Handler
    window.changeTheme = (themeId) => {
        localStorage.setItem('app-theme', themeId);
        SwalCustom.fire({
            title: 'Menerapkan Tema...',
            timer: 1000,
            didOpen: () => Swal.showLoading()
        }).then(() => {
            window.location.reload();
        });
    };

    // Form Handlers (Profile & Password)
    const formProfile = document.getElementById('form-profile-update');
    if (formProfile) {
        formProfile.onsubmit = async (e) => {
            e.preventDefault();
            const btn = formProfile.querySelector('button[type="submit"]');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 mr-2 animate-spin"></i> MENYIMPAN...';
            btn.disabled = true;
            if (window.lucide) lucide.createIcons();

            const formData = new FormData(formProfile);
            const data = Object.fromEntries(formData.entries());

            try {
                const res = await API.post('/api/profile/update', data);
                if (res.success) {
                    SwalCustom.fire('Berhasil!', 'Profil Anda telah diperbarui.', 'success');
                    // Refresh user data but stay on page
                    await App.getUser(true);
                } else {
                    throw new Error(res.message || 'Gagal update profil');
                }
            } catch (err) {
                SwalCustom.fire('Gagal!', err.message, 'error');
            } finally {
                btn.innerHTML = originalText;
                btn.disabled = false;
                if (window.lucide) lucide.createIcons();
            }
        };
    }

    const formPassword = document.getElementById('form-password-update');
    if (formPassword) {
        formPassword.onsubmit = async (e) => {
            e.preventDefault();
            const btn = formPassword.querySelector('button[type="submit"]');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 mr-2 animate-spin"></i> MEMPROSES...';
            btn.disabled = true;
            if (window.lucide) lucide.createIcons();

            const formData = new FormData(formPassword);
            const data = Object.fromEntries(formData.entries());

            try {
                const res = await API.post('/api/profile/password', data);
                if (res.success) {
                    SwalCustom.fire({
                        title: 'Berhasil!',
                        text: 'Kata sandi telah diubah. Silakan login ulang.',
                        icon: 'success',
                        confirmButtonText: 'Login Ulang'
                    }).then(() => {
                        window.handleLogout();
                    });
                } else {
                    throw new Error(res.message || 'Gagal ubah password');
                }
            } catch (err) {
                SwalCustom.fire('Gagal!', err.message, 'error');
                btn.innerHTML = originalText;
                btn.disabled = false;
                if (window.lucide) lucide.createIcons();
            }
        };
    }
};
