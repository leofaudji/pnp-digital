import API from '../api.js';
import Sidebar from '../sidebar.js';

export const Settings = async (App) => {
    document.getElementById('header-container').classList.remove('hidden');
    document.getElementById('page-title').innerText = 'Pengaturan Aplikasi';
    const userMe = await App.getUser();
    await Sidebar.render(userMe ? userMe.role : null);

    const res = await API.get('/api/settings');

    const categoriesRes = await API.get('/api/settings/fee-categories');
    const holidaysRes = await API.get('/api/settings/holidays'); // Fetch holidays
    const settings = res || {};
    let feeCategories = Array.isArray(categoriesRes) ? categoriesRes : [];
    let holidays = Array.isArray(holidaysRes) ? holidaysRes : [];

    App.container.innerHTML = `
    <div class="max-w-5xl mx-auto space-y-12 pb-32 animate-in fade-in duration-700">
        <!-- Brand & Profile Header (Premium Look) -->
        <div class="relative overflow-hidden rounded-[3rem] bg-slate-900 p-10 shadow-2xl shadow-slate-900/20">
            <div class="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-brand-500/10 rounded-full blur-[100px]"></div>
            <div class="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px]"></div>
            
            <div class="relative flex flex-col md:flex-row items-center gap-10">
                <!-- Logo Display -->
                <div class="relative group cursor-pointer" onclick="document.getElementById('upload-logo-input').click()">
                    <div class="w-32 h-32 rounded-full border-4 border-slate-700 shadow-xl overflow-hidden bg-slate-800 relative ring-8 ring-slate-800/50">
                         <img id="logo-preview" src="${settings.app_logo || '/assets/images/logo.png'}" class="w-full h-full object-cover">
                         <div class="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm">
                            <i data-lucide="camera" class="w-8 h-8 text-white"></i>
                         </div>
                    </div>
                    <div class="absolute bottom-1 right-1 bg-brand-500 rounded-full p-2 border-4 border-slate-900 shadow-lg text-white">
                         <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                    </div>
                </div>
                
                <div class="flex-1 text-center md:text-left">
                    <h2 class="text-3xl font-black text-white mb-2">${settings.app_title || 'RT-Digital'}</h2>
                    <p class="text-slate-400 font-medium">${settings.rt_name || 'Unit Lingkungan'} &bull; ${settings.rt_head || 'Ketua Pengurus'}</p>
                    <div class="mt-6 flex flex-wrap justify-center md:justify-start gap-3">
                         <span class="px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black text-slate-300 uppercase tracking-widest border border-white/5">System v2.0</span>
                         <span class="px-4 py-1.5 bg-emerald-500/20 backdrop-blur-md rounded-full text-[10px] font-black text-emerald-400 uppercase tracking-widest border border-emerald-500/20">Active Session</span>
                    </div>
                </div>
            </div>
            <input type="file" id="upload-logo-input" class="hidden" accept="image/png, image/jpeg, image/jpg">
        </div>

        <!-- Identitas Lingkungan -->
        <div class="bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-white shadow-xl shadow-slate-200/50 overflow-hidden">
            <div class="px-10 py-8 border-b border-slate-100/50 flex items-center">
                <div class="p-4 bg-brand-50 text-brand-600 rounded-2xl mr-5 shadow-sm">
                    <i data-lucide="home" class="w-6 h-6"></i>
                </div>
                <div>
                    <h3 class="text-xl font-black text-slate-900">Identitas Lingkungan</h3>
                    <p class="text-xs text-slate-500 font-medium mt-1">Informasi dasar entitas RT dan branding aplikasi</p>
                </div>
            </div>
            <div class="p-10 space-y-8">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div class="space-y-3">
                        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Aplikasi</label>
                        <input id="set-app-title" type="text" value="${settings.app_title || 'RT-Digital'}" placeholder="RT-Digital" class="w-full p-4.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all font-bold text-slate-900">
                    </div>
                    <div class="space-y-3">
                        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama RT/Unit</label>
                        <input id="set-rt-name" type="text" value="${settings.rt_name || ''}" placeholder="RT 05 / RW 12" class="w-full p-4.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all font-bold text-slate-900">
                    </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div class="space-y-3">
                        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Ketua RT</label>
                        <input id="set-rt-head" type="text" value="${settings.rt_head || ''}" placeholder="Nama Lengkap" class="w-full p-4.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all font-bold text-slate-900">
                    </div>
                    <div class="space-y-3">
                        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Alamat Wilayah</label>
                        <textarea id="set-rt-address" rows="1" placeholder="Lokasi RT" class="w-full p-4.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all font-bold text-slate-900 resize-none">${settings.rt_address || ''}</textarea>
                    </div>
                </div>
            </div>
        </div>

        <!-- Finansial & Shift Section (Two Columns) -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <!-- Finance Parameters -->
            <div class="bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-white shadow-xl shadow-slate-200/50 p-10 flex flex-col">
                <div class="flex items-center mb-10">
                    <div class="p-4 bg-emerald-50 text-emerald-600 rounded-2xl mr-5 shadow-sm">
                        <i data-lucide="banknote" class="w-6 h-6"></i>
                    </div>
                    <h3 class="text-xl font-black text-slate-900">Parameter Keuangan</h3>
                </div>
                <div class="space-y-6 flex-1">
                    <div class="space-y-2">
                        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Iuran Default (Rp)</label>
                        <div class="relative group">
                            <span class="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-500 font-black">Rp</span>
                            <input id="set-fee-amount" type="number" value="${settings.fee_amount || ''}" class="w-full p-5 pl-12 bg-emerald-50/20 border border-emerald-100 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all font-black text-xl text-emerald-600">
                        </div>
                    </div>
                    <div class="space-y-2">
                        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Gaji Satpam (Rp)</label>
                        <div class="relative group">
                            <span class="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-black">Rp</span>
                            <input id="set-salary-satpam" type="number" value="${settings.salary_satpam || ''}" class="w-full p-5 pl-12 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-slate-500/10 transition-all font-black text-xl text-slate-700">
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-4 pt-2">
                        <div class="space-y-2">
                            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Makan/Hari</label>
                            <input id="set-meal-allowance" type="number" value="${settings.meal_allowance_amount || '25000'}" class="w-full p-4 bg-amber-50/30 border border-amber-100 rounded-xl outline-none font-bold text-amber-700">
                        </div>
                        <div class="space-y-2">
                            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Insentif</label>
                            <input id="set-incentive-amount" type="number" value="${settings.incentive_amount || '50000'}" class="w-full p-4 bg-purple-50/30 border border-purple-100 rounded-xl outline-none font-bold text-purple-700">
                        </div>
                    </div>
                </div>
            </div>

            <!-- Shift & System -->
            <div class="bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-white shadow-xl shadow-slate-200/50 p-10">
                <div class="flex items-center mb-10">
                    <div class="p-4 bg-blue-50 text-blue-600 rounded-2xl mr-5 shadow-sm">
                        <i data-lucide="clock" class="w-6 h-6"></i>
                    </div>
                    <h3 class="text-xl font-black text-slate-900">Operasional Shift</h3>
                </div>
                <div class="space-y-8">
                    <div class="p-6 bg-slate-50/50 rounded-3xl border border-slate-100 space-y-6">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center text-amber-500">
                                <i data-lucide="sun" class="w-5 h-5 mr-3"></i>
                                <span class="text-xs font-black uppercase tracking-widest">Shift Pagi</span>
                            </div>
                            <input id="set-shift-morning" type="text" value="${settings.shift_morning_start || '06:00'}" class="w-24 p-3 bg-white border border-slate-200 rounded-xl text-center font-black text-slate-700">
                        </div>
                        <div class="flex items-center justify-between">
                            <div class="flex items-center text-blue-600">
                                <i data-lucide="moon" class="w-5 h-5 mr-3"></i>
                                <span class="text-xs font-black uppercase tracking-widest">Shift Malam</span>
                            </div>
                            <input id="set-shift-night" type="text" value="${settings.shift_night_start || '20:00'}" class="w-24 p-3 bg-white border border-slate-200 rounded-xl text-center font-black text-slate-700">
                        </div>
                    </div>
                    
                    <div class="p-6 bg-slate-50/50 rounded-3xl border border-slate-100 space-y-6">
                         <div class="flex items-center mb-2">
                             <div class="p-2 bg-indigo-50 text-indigo-600 rounded-lg mr-3">
                                 <i data-lucide="shield-alert" class="w-4 h-4"></i>
                             </div>
                             <h4 class="text-sm font-black text-slate-900">Pengaturan Patroli</h4>
                         </div>
                         <div class="grid grid-cols-2 gap-4">
                            <div class="space-y-2">
                                <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cooldown (Menit)</label>
                                <input id="set-patrol-cooldown" type="number" value="${settings.patrol_scan_cooldown || '60'}" class="w-full p-3 bg-white border border-slate-200 rounded-xl text-center font-black text-slate-700">
                            </div>
                            <div class="space-y-2">
                                <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Max Poin/Hari</label>
                                <input id="set-patrol-max-points" type="number" value="${settings.patrol_max_points_daily || '20'}" class="w-full p-3 bg-white border border-slate-200 rounded-xl text-center font-black text-slate-700">
                            </div>
                        </div>
                    </div>

                    <div class="p-5 border border-dashed border-slate-200 rounded-3xl">
                        <p class="text-[11px] text-slate-400 font-medium leading-relaxed italic text-center">Sistem membagi shift berdasarkan jam kehadiran Satpam secara cerdas (Auto-shift detection).</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Management Iuran -->
        <div class="bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-white shadow-xl shadow-slate-200/50 overflow-hidden">
            <div class="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/20">
                <div class="flex items-center">
                    <div class="p-4 bg-emerald-50 text-emerald-600 rounded-2xl mr-5 shadow-sm">
                        <i data-lucide="layers" class="w-6 h-6"></i>
                    </div>
                    <div>
                        <h3 class="text-xl font-black text-slate-900">Manajemen Iuran Rutin</h3>
                        <p class="text-xs text-slate-500 font-medium mt-1">Daftar kategori iuran yang dibebankan ke warga</p>
                    </div>
                </div>
                <button id="btn-add-fee-category" class="px-6 py-4 bg-emerald-600 text-white font-black rounded-2xl hover:bg-emerald-700 active:scale-95 transition-all shadow-xl shadow-emerald-500/20 flex items-center text-xs">
                    <i data-lucide="plus" class="w-4 h-4 mr-2"></i> Tambah Baru
                </button>
            </div>
            
            <div class="overflow-x-auto">
                <table class="w-full text-left">
                    <thead>
                        <tr class="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                            <th class="px-10 py-5">Nama Iuran</th>
                            <th class="px-5 py-5 text-right">Nominal</th>
                            <th class="px-5 py-5 text-center">Status</th>
                            <th class="px-10 py-5 text-center">Opsi</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100/50">
                        ${feeCategories.map(cat => `
                            <tr class="hover:bg-brand-50/20 transition-colors group">
                                <td class="px-10 py-5">
                                    <div class="flex items-center">
                                        <div class="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center mr-4 group-hover:bg-white transition-colors">
                                            <i data-lucide="receipt" class="w-4 h-4 text-slate-400"></i>
                                        </div>
                                        <span class="font-bold text-slate-700">${cat.name}</span>
                                    </div>
                                </td>
                                <td class="px-5 py-5 text-right font-black text-emerald-600 uppercase tracking-tighter">Rp ${parseInt(cat.amount).toLocaleString('id-ID')}</td>
                                <td class="px-5 py-5 text-center">
                                    <span class="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black border border-emerald-100 uppercase tracking-widest ${cat.is_active != 1 ? 'grayscale opacity-50' : ''}">
                                        ${cat.is_active == 1 ? 'Aktif' : 'Nonaktif'}
                                    </span>
                                </td>
                                <td class="px-10 py-5">
                                    <div class="flex items-center justify-center space-x-3">
                                        <button onclick='window.editFeeCategory(${JSON.stringify(cat)})' class="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-brand-600 hover:border-brand-200 hover:shadow-sm rounded-xl transition-all">
                                            <i data-lucide="edit-3" class="w-4 h-4"></i>
                                        </button>
                                        <button onclick="window.deleteFeeCategory(${cat.id})" class="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:shadow-sm rounded-xl transition-all">
                                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                        ${feeCategories.length === 0 ? `<tr><td colspan="4" class="px-10 py-16 text-center text-slate-400 italic font-medium">Belum ada iuran rutin yang dikonfigurasi.</td></tr>` : ''}
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Manajemen Hari Libur -->
        <div class="bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-white shadow-xl shadow-slate-200/50 overflow-hidden">
            <div class="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/20">
                <div class="flex items-center">
                    <div class="p-4 bg-rose-50 text-rose-600 rounded-2xl mr-5 shadow-sm">
                        <i data-lucide="calendar-off" class="w-6 h-6"></i>
                    </div>
                    <div>
                        <h3 class="text-xl font-black text-slate-900">Manajemen Hari Libur</h3>
                        <p class="text-xs text-slate-500 font-medium mt-1">Daftar hari libur nasional atau cuti bersama</p>
                    </div>
                </div>
                <button id="btn-add-holiday" class="px-6 py-4 bg-rose-600 text-white font-black rounded-2xl hover:bg-rose-700 active:scale-95 transition-all shadow-xl shadow-rose-500/20 flex items-center text-xs">
                    <i data-lucide="plus" class="w-4 h-4 mr-2"></i> Tambah Libur
                </button>
            </div>
            
            <div class="overflow-x-auto">
                <table class="w-full text-left">
                    <thead>
                        <tr class="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                            <th class="px-10 py-5">Tanggal</th>
                            <th class="px-5 py-5">Keterangan</th>
                            <th class="px-10 py-5 text-center">Opsi</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100/50">
                        ${holidays.map(h => `
                            <tr class="hover:bg-rose-50/20 transition-colors group">
                                <td class="px-10 py-5 font-bold text-slate-700">
                                    ${new Date(h.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </td>
                                <td class="px-5 py-5 text-sm font-medium text-slate-600">${h.description}</td>
                                <td class="px-10 py-5 text-center">
                                    <button onclick="window.deleteHoliday(${h.id})" class="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:shadow-sm rounded-xl transition-all">
                                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                        ${holidays.length === 0 ? `<tr><td colspan="3" class="px-10 py-16 text-center text-slate-400 italic font-medium">Belum ada hari libur yang dikonfigurasi.</td></tr>` : ''}
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Kontak Darurat -->
        <div class="bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-white shadow-xl shadow-slate-200/50 overflow-hidden">
             <div class="px-10 py-8 border-b border-slate-100/50 flex items-center">
                <div class="p-4 bg-rose-50 text-rose-600 rounded-2xl mr-5 shadow-sm">
                    <i data-lucide="phone-call" class="w-6 h-6"></i>
                </div>
                <div>
                    <h3 class="text-xl font-black text-slate-900">Kontak Darurat</h3>
                    <p class="text-xs text-slate-500 font-medium mt-1">Nomor penting yang dapat dihubungi segera</p>
                </div>
            </div>
            <div class="p-10">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <div class="space-y-3">
                        <label class="block text-[10px] font-black text-rose-400 uppercase tracking-widest ml-1">Polisi / Polsek</label>
                        <input id="set-emg-police" type="text" value="${settings.emergency_police || ''}" class="w-full p-4.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all font-bold text-rose-600">
                    </div>
                    <div class="space-y-3">
                        <label class="block text-[10px] font-black text-blue-400 uppercase tracking-widest ml-1">Ambulans / RS</label>
                        <input id="set-emg-health" type="text" value="${settings.emergency_health || ''}" class="w-full p-4.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-blue-600">
                    </div>
                    <div class="space-y-3">
                        <label class="block text-[10px] font-black text-amber-500 uppercase tracking-widest ml-1">Damkar</label>
                        <input id="set-emg-fire" type="text" value="${settings.emergency_fire || ''}" class="w-full p-4.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all font-bold text-amber-600">
                    </div>
                    <div class="space-y-3">
                        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pos Keamanan</label>
                        <input id="set-emg-security" type="text" value="${settings.emergency_security || ''}" class="w-full p-4.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-slate-500/10 focus:border-slate-500 outline-none transition-all font-bold text-slate-900">
                    </div>
                </div>
            </div>
        </div>

        <!-- Database & Maintenance -->
        <div class="bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-white shadow-xl shadow-slate-200/50 overflow-hidden">
             <div class="px-10 py-8 border-b border-slate-100/50 flex items-center bg-slate-50/20">
                <div class="p-4 bg-slate-900 text-white rounded-2xl mr-5 shadow-sm">
                    <i data-lucide="database" class="w-6 h-6"></i>
                </div>
                <div>
                    <h3 class="text-xl font-black text-slate-900">Database & Pemeliharaan</h3>
                    <p class="text-xs text-slate-500 font-medium mt-1">Kelola cadangan data dan pemulihan sistem</p>
                </div>
            </div>
            <div class="p-10">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div class="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-col items-center text-center group hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500">
                        <div class="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <i data-lucide="download-cloud" class="w-10 h-10"></i>
                        </div>
                        <h4 class="text-lg font-black text-slate-900 mb-2">Cadangkan Database</h4>
                        <p class="text-sm text-slate-500 mb-8 leading-relaxed">Unduh salinan lengkap database dalam format .sql untuk pengarsipan mandiri.</p>
                        <button id="btn-backup-db" class="w-full py-4 bg-white border-2 border-slate-200 text-slate-700 font-black rounded-2xl hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all active:scale-95 flex items-center justify-center">
                            <i data-lucide="file-down" class="w-5 h-5 mr-3"></i> UNDUH SQL BACKUP
                        </button>
                    </div>

                    <div class="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-col items-center text-center group hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500">
                        <div class="w-20 h-20 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <i data-lucide="refresh-cw" class="w-10 h-10"></i>
                        </div>
                        <h4 class="text-lg font-black text-slate-900 mb-2">Pulihkan Database</h4>
                        <p class="text-sm text-slate-500 mb-8 leading-relaxed">Unggah file backup .sql untuk memulihkan seluruh data sistem ke keadaan sebelumnya.</p>
                        <button id="btn-restore-db" class="w-full py-4 bg-white border-2 border-slate-200 text-slate-700 font-black rounded-2xl hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all active:scale-95 flex items-center justify-center">
                            <i data-lucide="upload-cloud" class="w-5 h-5 mr-3"></i> RESTORE DATABASE
                        </button>
                        <input type="file" id="restore-db-input" class="hidden" accept=".sql">
                    </div>
                </div>
            </div>
        </div>

        <!-- Sticky Floating Save Button -->
        <div class="fixed bottom-10 inset-x-0 flex justify-center z-[60] px-4 pointer-events-none">
            <button id="btn-save-settings" class="pointer-events-auto px-12 py-5 bg-slate-900 text-white font-black rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:bg-brand-600 hover:-translate-y-2 transition-all duration-300 active:scale-95 flex items-center group ring-8 ring-white/10 backdrop-blur-sm">
                <i data-lucide="save" class="w-6 h-6 mr-4 group-hover:animate-pulse"></i> SIMPAN PERUBAHAN
            </button>
        </div>
    </div>`;

    if (window.lucide) lucide.createIcons();

    // Logo Upload Logic (already integrated in header)
    const logoInput = document.getElementById('upload-logo-input');
    logoInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('logo', file);

        SwalCustom.fire({
            title: 'Mengupload Logo...',
            didOpen: () => { Swal.showLoading(); }
        });

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/settings/logo', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            const result = await response.json();
            if (response.ok && result.success) {
                document.getElementById('logo-preview').src = result.path + '?t=' + new Date().getTime();
                SwalCustom.fire({
                    title: 'Berhasil!',
                    text: 'Logo aplikasi diperbarui.',
                    icon: 'success',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000
                });
            } else { throw new Error(result.error || 'Gagal upload logo'); }
        } catch (error) { SwalCustom.fire('Gagal!', error.message, 'error'); }
    });

    // Save Logic
    document.getElementById('btn-save-settings').onclick = async () => {
        const btn = document.getElementById('btn-save-settings');
        const oldHtml = btn.innerHTML;
        btn.innerHTML = '<i data-lucide="loader-2" class="w-5 h-5 mr-3 animate-spin"></i> MENYIMPAN...';
        btn.disabled = true;
        if (window.lucide) lucide.createIcons();

        const data = {
            app_title: document.getElementById('set-app-title').value,
            rt_name: document.getElementById('set-rt-name').value,
            rt_head: document.getElementById('set-rt-head').value,
            rt_address: document.getElementById('set-rt-address').value,
            fee_amount: document.getElementById('set-fee-amount').value,
            salary_satpam: document.getElementById('set-salary-satpam').value,
            meal_allowance_amount: document.getElementById('set-meal-allowance').value,
            incentive_amount: document.getElementById('set-incentive-amount').value,
            shift_morning_start: document.getElementById('set-shift-morning').value,
            shift_night_start: document.getElementById('set-shift-night').value,
            emergency_police: document.getElementById('set-emg-police').value,
            emergency_health: document.getElementById('set-emg-health').value,
            emergency_fire: document.getElementById('set-emg-fire').value,
            emergency_security: document.getElementById('set-emg-security').value,
            patrol_scan_cooldown: document.getElementById('set-patrol-cooldown').value,
            patrol_max_points_daily: document.getElementById('set-patrol-max-points').value,
        };

        const res = await API.post('/api/settings', data);
        btn.innerHTML = oldHtml;
        btn.disabled = false;
        if (window.lucide) lucide.createIcons();

        if (res.success) {
            SwalCustom.fire({
                title: 'Konfigurasi Tersimpan!',
                text: 'Perubahan telah diterapkan ke seluruh sistem.',
                icon: 'success',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000
            });
        } else { SwalCustom.fire('Gagal!', res.error, 'error'); }
    };

    // Fee Modals Registry (One time per session inject)
    if (!document.getElementById('fee-category-modal')) {
        const modalHtml = `
        <div id="fee-category-modal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-md hidden flex items-center justify-center p-4 z-[100] animate-in fade-in duration-300">
            <div class="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 border border-slate-100">
                <h3 class="text-2xl font-black mb-8 text-slate-900" id="fee-cat-modal-title">Jenis Iuran Baru</h3>
                <form id="fee-category-form" class="space-y-6">
                    <input type="hidden" id="fee-cat-id">
                    <div class="space-y-3">
                        <label class="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nama Iuran</label>
                        <input id="fee-cat-name" type="text" placeholder="Iuran Kebersihan" class="w-full p-4.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-700 focus:border-brand-500 transition-all" required>
                    </div>
                    <div class="space-y-3">
                        <label class="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nominal (Rp)</label>
                        <input id="fee-cat-amount" type="number" placeholder="20000" class="w-full p-4.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-emerald-600 focus:border-emerald-500 transition-all" required>
                    </div>
                    <div class="p-4 bg-slate-50 rounded-2xl flex items-center">
                        <label class="flex items-center cursor-pointer w-full">
                            <input id="fee-cat-active" type="checkbox" checked class="w-5 h-5 rounded-lg text-brand-600 focus:ring-brand-500 mr-4">
                            <span class="text-sm font-bold text-slate-600">Status Aktif</span>
                        </label>
                    </div>
                    <div class="flex space-x-4 pt-4">
                        <button type="button" onclick="document.getElementById('fee-category-modal').classList.add('hidden')" class="flex-1 py-4 bg-slate-100 text-slate-500 font-bold rounded-2xl hover:bg-slate-200 transition-all flex items-center justify-center">Batal</button>
                        <button type="submit" class="flex-1 py-4 bg-brand-600 text-white font-black rounded-2xl shadow-xl shadow-brand-500/20 active:scale-95 transition-all flex items-center justify-center">Simpan</button>
                    </div>
                </form>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    const btnAddFeeCat = document.getElementById('btn-add-fee-category');
    if (btnAddFeeCat) {
        btnAddFeeCat.onclick = () => {
            document.getElementById('fee-cat-id').value = '';
            document.getElementById('fee-cat-name').value = '';
            document.getElementById('fee-cat-amount').value = '';
            document.getElementById('fee-cat-active').checked = true;
            document.getElementById('fee-cat-modal-title').innerText = 'Iuran Rutin Baru';
            document.getElementById('fee-category-modal').classList.remove('hidden');
        };
    }

    window.editFeeCategory = (cat) => {
        document.getElementById('fee-cat-id').value = cat.id;
        document.getElementById('fee-cat-name').value = cat.name;
        document.getElementById('fee-cat-amount').value = parseInt(cat.amount);
        document.getElementById('fee-cat-active').checked = cat.is_active == 1;
        document.getElementById('fee-cat-modal-title').innerText = 'Edit Iuran';
        document.getElementById('fee-category-modal').classList.remove('hidden');
    };

    window.deleteFeeCategory = async (id) => {
        const confirm = await SwalCustom.fire({
            title: 'Hapus Jenis Iuran?',
            text: 'Tindakan ini tidak dapat dibatalkan.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ya, Hapus!',
            cancelButtonText: 'Batal'
        });
        if (confirm.isConfirmed) {
            const res = await API.post(`/api/settings/fee-categories/delete?id=${id}`);
            if (res.success) {
                Settings(App);
                SwalCustom.fire('Berhasil!', 'Jenis iuran telah dihapus.', 'success');
            }
        }
    };

    const feeCatForm = document.getElementById('fee-category-form');
    if (feeCatForm) {
        feeCatForm.onsubmit = async (e) => {
            e.preventDefault();
            const id = document.getElementById('fee-cat-id').value;
            const payload = {
                name: document.getElementById('fee-cat-name').value,
                amount: document.getElementById('fee-cat-amount').value,
                is_active: document.getElementById('fee-cat-active').checked ? 1 : 0
            };
            const url = id ? `/api/settings/fee-categories/update?id=${id}` : '/api/settings/fee-categories/add';
            const res = await API.post(url, payload);
            if (res.success) {
                document.getElementById('fee-category-modal').classList.add('hidden');
                Settings(App);
                SwalCustom.fire('Berhasil!', 'Data iuran telah diperbarui.', 'success');
            }
        };
    }

    // Holiday Modal
    if (!document.getElementById('holiday-modal')) {
        const modalHtml = `
        <div id="holiday-modal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-md hidden flex items-center justify-center p-4 z-[100] animate-in fade-in duration-300">
            <div class="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 border border-slate-100">
                <h3 class="text-2xl font-black mb-8 text-slate-900">Tambah Hari Libur</h3>
                <form id="holiday-form" class="space-y-6">
                    <div class="space-y-3">
                        <label class="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Tanggal</label>
                        <input id="holiday-date" type="date" class="w-full p-4.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-700 focus:border-rose-500 transition-all" required>
                    </div>
                    <div class="space-y-3">
                        <label class="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Keterangan</label>
                        <input id="holiday-desc" type="text" placeholder="Tahun Baru 2024" class="w-full p-4.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-700 focus:border-rose-500 transition-all" required>
                    </div>
                    <div class="flex space-x-4 pt-4">
                        <button type="button" onclick="document.getElementById('holiday-modal').classList.add('hidden')" class="flex-1 py-4 bg-slate-100 text-slate-500 font-bold rounded-2xl hover:bg-slate-200 transition-all flex items-center justify-center">Batal</button>
                        <button type="submit" class="flex-1 py-4 bg-rose-600 text-white font-black rounded-2xl shadow-xl shadow-rose-500/20 active:scale-95 transition-all flex items-center justify-center">Simpan</button>
                    </div>
                </form>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    const btnAddHoliday = document.getElementById('btn-add-holiday');
    if (btnAddHoliday) {
        btnAddHoliday.onclick = () => {
            document.getElementById('holiday-date').value = '';
            document.getElementById('holiday-desc').value = '';
            document.getElementById('holiday-modal').classList.remove('hidden');
        };
    }

    window.deleteHoliday = async (id) => {
        const confirm = await SwalCustom.fire({
            title: 'Hapus Hari Libur?',
            text: 'Tindakan ini tidak dapat dibatalkan.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ya, Hapus!',
            cancelButtonText: 'Batal'
        });
        if (confirm.isConfirmed) {
            const res = await API.post(`/api/settings/holidays/delete?id=${id}`);
            if (res.success) {
                Settings(App);
                SwalCustom.fire('Berhasil!', 'Hari libur telah dihapus.', 'success');
            }
        }
    };

    const holidayForm = document.getElementById('holiday-form');
    if (holidayForm) {
        holidayForm.onsubmit = async (e) => {
            e.preventDefault();
            const payload = {
                date: document.getElementById('holiday-date').value,
                description: document.getElementById('holiday-desc').value
            };
            const res = await API.post('/api/settings/holidays/add', payload);
            if (res.success) {
                document.getElementById('holiday-modal').classList.add('hidden');
                Settings(App);
                SwalCustom.fire('Berhasil!', 'Hari libur ditambahkan.', 'success');
            } else {
                SwalCustom.fire('Gagal!', res.error, 'error');
            }
        };
    }

    // Backup & Restore Logic
    document.getElementById('btn-backup-db').onclick = () => {
        window.location.href = API.basePath + '/api/backup/export';
    };

    const restoreBtn = document.getElementById('btn-restore-db');
    const restoreInput = document.getElementById('restore-db-input');

    restoreBtn.onclick = () => restoreInput.click();

    restoreInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const confirm = await SwalCustom.fire({
            title: 'Restore Database?',
            text: 'Data saat ini akan ditimpa oleh data dari file backup. Pastikan anda yakin!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ya, Restore!',
            cancelButtonText: 'Batal',
            confirmButtonColor: '#e11d48'
        });

        if (confirm.isConfirmed) {
            SwalCustom.fire({
                title: 'Sedang Memulihkan...',
                html: '<div class="mt-4"><p class="text-sm text-slate-500">Harap tidak menutup halaman ini</p></div>',
                allowOutsideClick: false,
                didOpen: () => { Swal.showLoading(); }
            });

            const formData = new FormData();
            formData.append('backup', file);

            try {
                const response = await fetch(API.basePath + '/api/backup/restore', {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();
                if (response.ok && result.success) {
                    SwalCustom.fire({
                        title: 'Restore Berhasil!',
                        text: result.message,
                        icon: 'success'
                    }).then(() => {
                        window.location.reload();
                    });
                } else {
                    throw new Error(result.error || 'Gagal memulihkan database.');
                }
            } catch (err) {
                SwalCustom.fire('Gagal!', err.message, 'error');
            }
        }
        restoreInput.value = ''; // Reset input
    };
};
