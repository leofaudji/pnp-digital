import API from '../api.js';
import Sidebar from '../sidebar.js';

export const Warga = async (App) => {
    document.getElementById('header-container').classList.remove('hidden');
    document.getElementById('page-title').innerText = 'Data Warga';
    const userMe = await App.getUser();
    await Sidebar.render(userMe ? userMe.role : null);

    const allUsersRaw = await API.get('/api/users');
    const allUsers = Array.isArray(allUsersRaw) ? allUsersRaw : [];
    const settings = await API.get('/api/settings');
    const categoriesRes = await API.get('/api/settings/fee-categories');
    const feeCategories = Array.isArray(categoriesRes) ? categoriesRes.filter(c => c.is_active == 1) : [];

    // State for Filter (Persist during session if possible, or default to current)
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    if (!App.wargaState) {
        App.wargaState = {
            month: currentMonth,
            year: currentYear,
            view: 'list' // 'list' or 'map'
        };
    }

    const iuranPaidWarga = await API.get(`/api/fees/summary?month=${App.wargaState.month}&year=${App.wargaState.year}`);
    const arrearsData = await API.get(`/api/fees/arrears?year=${App.wargaState.year}`);

    // Calculate total itemized fee
    const feeAmount = feeCategories.reduce((sum, cat) => sum + parseInt(cat.amount), 0) || parseInt(settings.fee_amount || 50000);
    const feeItemizedDesc = feeCategories.map(cat => `${cat.name} (Rp ${parseInt(cat.amount).toLocaleString('id-ID')})`).join(', ');

    // Defensive check for role_id 4
    const wargaRaw = allUsers.filter(u => u.role_id == 4);

    // Grouping & Sorting Logic
    const groups = {};
    wargaRaw.forEach(u => {
        const kk = u.no_kk || `IND-${u.id}`; // Fallback for no KK
        if (!groups[kk]) groups[kk] = [];
        groups[kk].push(u);
    });

    const sortedGroups = Object.entries(groups).map(([kk, members]) => {
        const head = members.find(m => m.is_kk_head == 1) || members[0];
        const sortedMembers = [...members].sort((a, b) => {
            if (a.is_kk_head == 1) return -1;
            if (b.is_kk_head == 1) return 1;
            return a.full_name.localeCompare(b.full_name);
        });
        return { head, members: sortedMembers };
    });

    // Sort groups by Head name alphabetically
    sortedGroups.sort((a, b) => a.head.full_name.localeCompare(b.head.full_name));

    // Live Filtering (Search)
    const searchQuery = (App.wargaState.search || '').toLowerCase();
    const filteredGroups = sortedGroups.filter(g => {
        if (!searchQuery) return true;
        // Check if any member matches the search
        return g.members.some(m =>
            (m.full_name || '').toLowerCase().includes(searchQuery) ||
            (m.no_rumah || '').toLowerCase().includes(searchQuery) ||
            (m.no_kk || '').toLowerCase().includes(searchQuery)
        );
    });

    // Flatten back into a single list
    const wargaList = filteredGroups.flatMap(g => g.members);

    // Calculate Statistics
    const totalKK = sortedGroups.length;
    const totalWarga = wargaRaw.length;
    const paidKK = sortedGroups.filter(g => iuranPaidWarga.includes(g.head.id)).length;
    const unpaidKK = totalKK - paidKK;
    const arrearsKKCount = Object.keys(arrearsData).filter(uid => {
        const user = wargaRaw.find(w => w.id == uid);
        return user && user.is_kk_head == 1;
    }).length;
    const completionRate = Math.round((paidKK / totalKK) * 100) || 0;

    App.container.innerHTML = `
    <style>
        .filter-emerald-glow { filter: drop-shadow(0 0 8px rgba(16, 185, 129, 0.4)); }
        .filter-rose-glow { filter: drop-shadow(0 0 5px rgba(244, 63, 94, 0.2)); }
    </style>
    <!-- Statistics Dashboard -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
        <!-- Card 1: Payment Progress -->
        <div class="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between overflow-hidden relative group">
            <div class="absolute -right-2 -top-2 w-16 h-16 bg-emerald-50 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
            <div class="flex justify-between items-start mb-4 relative z-10">
                <div class="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                    <i data-lucide="line-chart" class="w-5 h-5"></i>
                </div>
                <span class="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full uppercase tracking-tighter">${completionRate}% Lunas</span>
            </div>
            <div class="relative z-10">
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Capaian Iuran</p>
                <div class="flex items-end gap-1">
                    <h3 class="text-2xl font-black text-slate-900">${paidKK}</h3>
                    <p class="text-[10px] font-bold text-slate-400 mb-1.5 uppercase">/ ${totalKK} KK</p>
                </div>
                <div class="mt-4 w-full h-1.5 bg-slate-50 rounded-full overflow-hidden">
                    <div class="h-full bg-emerald-500 rounded-full transition-all duration-1000" style="width: ${completionRate}%"></div>
                </div>
            </div>
        </div>

        <!-- Card 2: Population -->
        <div class="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between overflow-hidden relative group">
            <div class="absolute -right-2 -top-2 w-16 h-16 bg-brand-50 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
            <div class="flex justify-between items-start mb-4 relative z-10">
                <div class="p-2 bg-brand-50 text-brand-600 rounded-xl">
                    <i data-lucide="users" class="w-5 h-5"></i>
                </div>
            </div>
            <div class="relative z-10">
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Populasi</p>
                <div class="flex items-end gap-1">
                    <h3 class="text-2xl font-black text-slate-900">${totalWarga}</h3>
                    <p class="text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Jiwa</p>
                </div>
                <p class="mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Dalam <span class="text-brand-600">${totalKK} Keluarga</span> terdaftar</p>
            </div>
        </div>

        <!-- Card 3: Arrears -->
        <div class="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between overflow-hidden relative group">
            <div class="absolute -right-2 -top-2 w-16 h-16 bg-rose-50 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
            <div class="flex justify-between items-start mb-4 relative z-10">
                <div class="p-2 bg-rose-50 text-rose-600 rounded-xl">
                    <i data-lucide="alert-circle" class="w-5 h-5"></i>
                </div>
                ${unpaidKK > 0 ? `
                    <span class="text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-1 rounded-full uppercase tracking-tighter">Bulan Ini</span>
                ` : ''}
            </div>
            <div class="relative z-10">
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tunggakan Terdeteksi</p>
                <div class="flex items-end gap-1">
                    <h3 class="text-2xl font-black ${unpaidKK > 0 ? 'text-rose-600' : 'text-slate-900'}">${unpaidKK}</h3>
                    <p class="text-[10px] font-bold text-slate-400 mb-1.5 uppercase">KK Belum Bayar</p>
                </div>
                <p class="mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                    <span class="text-rose-600">${arrearsKKCount} KK</span> Total menunggak
                </p>
            </div>
        </div>

        <!-- Card 4: House Coverage -->
        <div class="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between overflow-hidden relative group">
            <div class="absolute -right-2 -top-2 w-16 h-16 bg-blue-50 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
            <div class="flex justify-between items-start mb-4 relative z-10">
                <div class="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <i data-lucide="home" class="w-5 h-5"></i>
                </div>
            </div>
            <div class="relative z-10">
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cakupan Area</p>
                <div class="flex items-end gap-1">
                    <h3 class="text-2xl font-black text-slate-900">${new Set(wargaRaw.map(u => u.no_rumah)).size}</h3>
                    <p class="text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Rumah Terdaftar</p>
                </div>
                <p class="mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Efisiensi Iuran: <span class="text-blue-600">${Math.round((paidKK / totalKK) * 100)}%</span></p>
            </div>
        </div>
    </div>

    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div class="px-4 py-4 md:px-6 md:py-5 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-50/30 gap-4">
            <div class="flex flex-col">
                <h3 class="text-lg font-bold text-slate-900 flex items-center">
                    <i data-lucide="users" class="w-5 h-5 mr-3 text-brand-600"></i> Data Warga
                </h3>
                <p class="text-[10px] md:text-xs text-slate-500 font-medium ml-8">Total Terdaftar: ${sortedGroups.length} KK</p>
            </div>
            
            <div class="flex-1 max-w-sm mx-1 md:mx-4 relative group">
                <i data-lucide="search" class="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-brand-600 transition-colors"></i>
                <input type="text" id="search-warga" placeholder="Cari Nama / Blok / KK..." 
                       class="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all shadow-sm group-hover:bg-slate-50/50"
                       value="${App.wargaState.search || ''}">
            </div>

            <div class="flex items-center space-x-2 md:space-x-3 w-full md:w-auto">
                <!-- View Toggle -->
                <div class="flex bg-slate-100 p-1 rounded-xl mr-2">
                    <button id="view-list" class="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all ${App.wargaState.view === 'list' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}">
                        <i data-lucide="list" class="w-3.5 h-3.5 inline mr-1"></i> Daftar
                    </button>
                    <button id="view-map" class="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all ${App.wargaState.view === 'map' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}">
                        <i data-lucide="layout-grid" class="w-3.5 h-3.5 inline mr-1"></i> Denah
                    </button>
                </div>

                <!-- Filters -->
                <div class="flex items-center bg-white border border-slate-200 rounded-xl px-2 py-1 shadow-sm">
                    <select id="filter-month" class="bg-transparent text-[10px] md:text-xs font-bold text-slate-600 outline-none p-1 cursor-pointer">
                        ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => `
                            <option value="${m}" ${App.wargaState.month == m ? 'selected' : ''}>${new Date(2000, m - 1).toLocaleString('id-ID', { month: 'short' })}</option>
                        `).join('')}
                    </select>
                    <div class="w-px h-4 bg-slate-200 mx-1"></div>
                    <select id="filter-year" class="bg-transparent text-[10px] md:text-xs font-bold text-slate-600 outline-none p-1 cursor-pointer">
                        ${[currentYear, currentYear - 1].map(y => `
                            <option value="${y}" ${App.wargaState.year == y ? 'selected' : ''}>${y}</option>
                        `).join('')}
                    </select>
                </div>

                <button id="btn-bulk-payment" class="hidden flex-1 md:flex-none px-3 py-2 md:px-4 md:py-2 bg-emerald-50 text-emerald-700 text-[10px] md:text-xs font-black rounded-xl border border-emerald-100 shadow-sm hover:bg-emerald-100 transition-all flex items-center justify-center">
                    <i data-lucide="banknote" class="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2"></i> Bayar (<span id="selected-count">0</span>)
                </button>
                <button id="btn-add-warga" class="flex-1 md:flex-none px-4 py-2.5 md:px-5 md:py-2.5 bg-brand-600 text-white text-xs md:text-sm font-black rounded-xl shadow-lg shadow-brand-500/20 hover:bg-brand-700 hover:-translate-y-0.5 transition-all flex items-center justify-center">
                    <i data-lucide="user-plus" class="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2"></i> Tambah Warga
                </button>
            </div>
        </div>
        
        ${App.wargaState.view === 'list' ? `
        <!-- Desktop Table -->
        <div class="hidden md:block overflow-x-auto">
            <table class="w-full text-left">
                <thead>
                    <tr class="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                        <th class="px-6 py-4 w-10 text-center">
                            <input type="checkbox" id="select-all-warga" class="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer">
                        </th>
                        <th class="px-6 py-4">Informasi Warga</th>
                        <th class="px-6 py-4 text-center">No. Rumah / KK</th>
                        <th class="px-6 py-4 text-center">Iuran (Bulan Ini)</th>
                        <th class="px-6 py-4">Kontak (WA)</th>
                        <th class="px-6 py-4 text-right">Aksi</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                     ${wargaList.map(u => {
        const isPaid = iuranPaidWarga.includes(u.id);
        const arrearsCount = arrearsData[u.id] || 0;
        const isMember = !u.is_kk_head && u.no_kk;

        return `
                    <tr class="hover:bg-slate-50/50 transition-colors group ${isMember ? 'bg-slate-50/20' : 'bg-white'}">
                        <td class="px-6 py-4 text-center">
                            ${(u.is_kk_head && !isPaid) ? `
                            <input type="checkbox" class="warga-checkbox w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer" data-id="${u.id}">
                            ` : (u.is_kk_head && isPaid ? `
                            <div class="flex items-center justify-center text-emerald-500 opacity-40 cursor-help" title="Sudah Lunas">
                                <i data-lucide="check-circle" class="w-4 h-4"></i>
                            </div>
                            ` : `
                            <div class="flex items-center justify-center opacity-10 cursor-help" title="Tagihan dibebankan ke Kepala Keluarga">
                                <i data-lucide="corner-down-right" class="w-4 h-4"></i>
                            </div>
                            `)}
                        </td>
                        <td class="px-6 py-4">
                            <div class="flex items-center">
                                ${isMember ? '<div class="w-4 h-px bg-slate-200 mr-2"></div>' : ''}
                                <div>
                                    <div class="font-bold text-sm ${u.is_kk_head ? 'text-slate-900' : 'text-slate-600'}">${u.full_name} ${u.is_kk_head ? '<span class="ml-1 text-[8px] bg-brand-600 text-white px-1.5 py-0.5 rounded-full uppercase">Kepala</span>' : ''}</div>
                                    <div class="text-[11px] text-slate-400 font-normal tracking-tight">@${u.username}</div>
                                </div>
                            </div>
                        </td>
                        <td class="px-6 py-4 text-center">
                            <div class="flex flex-col items-center gap-1">
                                <span class="px-3 py-1 bg-slate-100 text-slate-700 text-[10px] font-black rounded-full border border-slate-200 uppercase tracking-wider">
                                    ${u.no_rumah || 'N/A'}
                                </span>
                                <span class="text-[9px] font-bold text-slate-400">KK: ${u.no_kk || '-'}</span>
                                ${u.is_kk_head ? '<span class="text-[8px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-md font-black">KK HEAD</span>' : ''}
                            </div>
                        </td>
                        <td class="px-6 py-4 text-center">
                            ${u.is_kk_head ? `
                            <div class="flex flex-col items-center">
                                <div class="flex items-center">
                                    <span class="flex h-2 w-2 rounded-full ${isPaid ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'} mr-2"></span>
                                    <span class="text-[11px] font-black ${isPaid ? 'text-emerald-600' : 'text-rose-600'} uppercase tracking-tighter">
                                        ${isPaid ? 'Lunas' : 'Belum Bayar'}
                                    </span>
                                </div>
                                ${arrearsData[u.id] ? `
                                    <span class="btn-arrears-info mt-1 flex items-center text-[9px] font-black text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100 uppercase tracking-tighter animate-pulse cursor-help" 
                                          data-months='${JSON.stringify(arrearsData[u.id].months)}' 
                                          data-name="${u.full_name}">
                                        <i data-lucide="alert-triangle" class="w-2.5 h-2.5 mr-1"></i> ${arrearsData[u.id].count} Bulan
                                    </span>
                                ` : ''}
                            </div>
                            ` : `
                            <span class="text-[10px] font-bold text-slate-300 uppercase italic">Ditanggung KK</span>
                            `}
                        </td>
                        <td class="px-6 py-4 text-[13px] font-medium text-slate-600">
                            ${u.wa_number ? u.wa_number : '<span class="text-slate-300 italic">N/A</span>'}
                        </td>
                        <td class="px-6 py-4 text-right whitespace-nowrap opacity-40 group-hover:opacity-100 transition-opacity">
                            ${u.is_kk_head ? `
                            <button class="btn-card p-2 text-brand-600 hover:bg-brand-50 rounded-lg transition-colors mr-1" data-warga='${JSON.stringify(u).replace(/'/g, "&apos;")}' title="Kartu Iuran">
                                <i data-lucide="contact-2" class="w-4 h-4"></i>
                            </button>
                            <button class="btn-iuran p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors mr-1" data-warga='${JSON.stringify(u).replace(/'/g, "&apos;")}' title="Detail Iuran">
                                <i data-lucide="wallet" class="w-4 h-4"></i>
                            </button>
                            ` : ''}
                            <button class="btn-edit-warga p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors mr-1" data-warga='${JSON.stringify(u).replace(/'/g, "&apos;")}' title="Edit Data">
                                <i data-lucide="user-cog" class="w-4 h-4"></i>
                            </button>
                            <button class="btn-delete-warga p-2 text-rose-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors" data-id="${u.id}" title="Hapus">
                                <i data-lucide="trash-2" class="w-4 h-4"></i>
                            </button>
                        </td>
                    </tr>`}).join('')}
                </tbody>
            </table>
        </div>

        <!-- Mobile View (Cards) -->
        <div class="md:hidden divide-y divide-slate-100">
            ${wargaList.map(u => {
            const isPaid = iuranPaidWarga.includes(u.id);
            const arrearsCount = arrearsData[u.id] || 0;
            const isMember = !u.is_kk_head && u.no_kk;
            return `
                <div class="p-4 flex flex-col space-y-4 ${isMember ? 'bg-slate-50/50 border-l-4 border-slate-200' : ''}">
                    <div class="flex items-start justify-between">
                        <div class="flex items-center">
                            ${(u.is_kk_head && !isPaid) ? `
                                <input type="checkbox" class="warga-checkbox w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer mr-3" data-id="${u.id}">
                            ` : (u.is_kk_head && isPaid ? `
                                <div class="w-4 mr-3 flex justify-center text-emerald-500 opacity-40"><i data-lucide="check-circle" class="w-3.5 h-3.5"></i></div>
                            ` : `
                                <div class="w-4 mr-3 flex justify-center text-slate-300"><i data-lucide="corner-down-right" class="w-3.5 h-3.5"></i></div>
                            `)}
                            <div class="w-10 h-10 rounded-xl ${u.is_kk_head ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/30' : 'bg-slate-100 text-slate-500'} flex items-center justify-center font-bold text-sm mr-3">
                                ${u.full_name?.charAt(0) || '?'}
                            </div>
                            <div>
                                <div class="text-sm font-bold text-slate-900">${u.full_name} ${u.is_kk_head ? '👑' : ''}</div>
                                <div class="text-[11px] text-slate-400">${u.status_keluarga || 'Anggota'} • @${u.username}</div>
                            </div>
                        </div>
                        <div class="flex flex-col items-end gap-1">
                            <span class="px-2.5 py-1 bg-slate-100 text-slate-700 text-[9px] font-black rounded-lg border border-slate-200">
                                ${u.no_rumah || 'N/A'}
                            </span>
                            <span class="text-[8px] text-slate-400 font-bold">KK: ${u.no_kk || '-'}</span>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-3 py-1">
                        <div class="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-center">
                            <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status Iuran</span>
                            ${u.is_kk_head ? `
                            <div class="flex items-center">
                                <span class="h-1.5 w-1.5 rounded-full ${isPaid ? 'bg-emerald-500' : 'bg-rose-500'} mr-1.5"></span>
                                <span class="text-[10px] font-black ${isPaid ? 'text-emerald-600' : 'text-rose-600'} uppercase">${isPaid ? 'Lunas' : 'Belum Bayar'}</span>
                            </div>
                            ${arrearsData[u.id] ? `
                                <button class="btn-arrears-info mt-1.5 text-[8px] font-black text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100 uppercase tracking-tight w-fit" 
                                        data-months='${JSON.stringify(arrearsData[u.id].months)}' 
                                        data-name="${u.full_name}">
                                    ${arrearsData[u.id].count} Bulan Tunggakan
                                </button>
                            ` : ''}
                            ` : `
                            <span class="text-[10px] font-bold text-slate-300 italic">Pusat di KK</span>
                            `}
                        </div>
                        <div class="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-center">
                            <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Kontak WA</span>
                            ${u.wa_number ? `
                                <a href="https://wa.me/${u.wa_number.replace(/[^0-9]/g, '')}" target="_blank" class="text-[10px] font-black text-emerald-600 flex items-center">
                                    <i data-lucide="phone" class="w-3 h-3 mr-1"></i> ${u.wa_number}
                                </a>
                            ` : '<span class="text-[10px] text-slate-300 italic">No Contact</span>'}
                        </div>
                    </div>

                    <div class="flex gap-2">
                        ${u.is_kk_head ? `
                        <button class="btn-card flex-1 flex items-center justify-center gap-2 py-2.5 bg-brand-50 text-brand-600 rounded-xl text-[11px] font-black transition-all active:scale-95" data-warga='${JSON.stringify(u).replace(/'/g, "&apos;")}' title="Kartu Iuran">
                            <i data-lucide="contact-2" class="w-3.5 h-3.5"></i>
                            Kartu Iuran
                        </button>
                        <button class="btn-iuran flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-50 text-emerald-600 rounded-xl text-[11px] font-black transition-all active:scale-95" data-warga='${JSON.stringify(u).replace(/'/g, "&apos;")}' title="Status Iuran">
                            <i data-lucide="wallet" class="w-3.5 h-3.5"></i>
                            Status Iuran
                        </button>
                        ` : ''}
                        <button class="btn-edit-warga flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-50 text-blue-600 rounded-xl text-[11px] font-black transition-all active:scale-95" data-warga='${JSON.stringify(u).replace(/'/g, "&apos;")}' title="Edit Data">
                            <i data-lucide="user-cog" class="w-3.5 h-3.5"></i>
                            Edit
                        </button>
                        <button class="btn-delete-warga p-2.5 bg-rose-50 text-rose-500 rounded-xl transition-all active:scale-95" data-id="${u.id}" title="Hapus">
                            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                        </button>
                    </div>
                </div>
            `}).join('')}
        </div>
        ` : `
        <!-- Map View (Denah Premium) -->
        <div class="p-6 bg-slate-100 min-h-[600px] relative overflow-hidden">
            <!-- Background Decorative Streets -->
            <div class="absolute inset-0 opacity-[0.03] pointer-events-none" style="background-image: radial-gradient(#000 1px, transparent 1px); background-size: 20px 20px;"></div>
            
            <div class="max-w-6xl mx-auto relative z-10">
                <div class="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
                    <div>
                        <h4 class="text-lg font-black text-slate-900 uppercase tracking-tighter flex items-center">
                            <i data-lucide="map" class="w-6 h-6 mr-2 text-brand-600"></i>
                            Peta Digital Lingkungan RT
                        </h4>
                        <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Gunakan scroll atau geser untuk melihat area lain</p>
                    </div>
                    <div class="flex flex-wrap gap-4 bg-white/80 backdrop-blur-md p-3 rounded-2xl border border-white shadow-sm">
                        <div class="flex items-center gap-2">
                            <div class="w-3 h-3 bg-emerald-500 rounded-sm shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                            <span class="text-[10px] font-black text-slate-600 uppercase tracking-tighter">Lunas Iuran</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <div class="w-3 h-3 bg-rose-500 rounded-sm shadow-[0_0_10px_rgba(244,63,94,0.5)]"></div>
                            <span class="text-[10px] font-black text-slate-600 uppercase tracking-tighter">Ada Tunggakan</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <div class="w-3 h-3 bg-slate-300 rounded-sm"></div>
                            <span class="text-[10px] font-black text-slate-600 uppercase tracking-tighter">Belum Terdata</span>
                        </div>
                    </div>
                </div>

                <div class="space-y-16 lg:space-y-24 pb-20">
                    ${(() => {
            const mapData = {};
            wargaRaw.forEach(u => {
                const blockName = (u.no_rumah || 'Blok ?').split('-')[0].trim();
                if (!mapData[blockName]) mapData[blockName] = {};
                if (u.is_kk_head == 1 || !mapData[blockName][u.no_rumah]) {
                    mapData[blockName][u.no_rumah] = u;
                }
            });

            return Object.entries(mapData).sort().map(([block, houses]) => `
                            <div>
                                <div class="flex items-center mb-8">
                                    <div class="bg-brand-600 text-white px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-[0.2em] shadow-lg shadow-brand-500/20 mr-4">
                                        AREA ${block}
                                    </div>
                                    <div class="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent"></div>
                                </div>

                                <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-x-3 gap-y-8 md:gap-x-6 md:gap-y-12">
                                                ${Object.entries(houses).sort().map(([no, u]) => {
                const isPaid = iuranPaidWarga.includes(u.id);
                const hasArrears = arrearsData[u.id] && arrearsData[u.id].count > 0;
                const houseNo = no.split('-').pop();

                // Color Logic
                // Paid = Emerald (Green)
                // Arrears = Rose (Red)
                // Neutral (Unpaid but no arrears/not due) = Slate (Gray)

                let roofStroke = '#475569';
                let roofFill = '#64748b';
                let bodyStroke = '#e2e8f0';
                let doorFill = '#94a3b8';
                let windowFill = '#f1f5f9';
                let windowStroke = '#cbd5e1';
                let glowClass = '';

                if (isPaid) {
                    roofStroke = '#059669';
                    roofFill = '#10b981';
                    bodyStroke = '#10b981';
                    doorFill = '#059669';
                    windowFill = '#ecfdf5';
                    windowStroke = '#10b981';
                    glowClass = 'filter-emerald-glow';
                } else if (hasArrears) {
                    roofStroke = '#e11d48';
                    roofFill = '#f43f5e';
                    bodyStroke = '#fb7185';
                    doorFill = '#fda4af';
                    windowFill = '#fff1f2';
                    windowStroke = '#fb7185';
                    glowClass = 'filter-rose-glow';
                }

                return `
                                            <div class="group relative perspective-1000">
                                                <button class="btn-card w-full relative transition-all duration-500 transform group-hover:-translate-y-3 group-hover:scale-110" 
                                                        data-warga='${JSON.stringify(u).replace(/'/g, "&apos;")}'
                                                        title="Klik untuk lihat riwayat pembayaran lengkap">
                                                    
                                                    <!-- Detailed SVG House Illustration -->
                                                    <div class="relative w-full aspect-square flex flex-col items-center justify-center">
                                                            <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-lg transition-all duration-500 ${glowClass}">
                                                                <!-- Roof -->
                                                                <path d="M15 50 L50 20 L85 50" fill="none" stroke="${roofStroke}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" />
                                                                <path d="M20 50 L50 25 L80 50" fill="${roofFill}" />
                                                                
                                                                <!-- Main Body -->
                                                                <rect x="25" y="50" width="50" height="40" rx="4" fill="white" stroke="${bodyStroke}" stroke-width="2" />
                                                                
                                                                <!-- Door -->
                                                                <rect x="42" y="70" width="16" height="20" rx="2" fill="${doorFill}" />
                                                                <circle cx="54" cy="80" r="1.5" fill="white" opacity="0.5" />
                                                                
                                                                <!-- Window -->
                                                                <rect x="35" y="58" width="10" height="10" rx="1.5" fill="${windowFill}" stroke="${windowStroke}" stroke-width="1" />
                                                                <rect x="55" y="58" width="10" height="10" rx="1.5" fill="${windowFill}" stroke="${windowStroke}" stroke-width="1" />
                                                            
                                                            ${isPaid ? `
                                                            <!-- Success Glow -->
                                                            <circle cx="50" cy="65" r="15" fill="url(#grad-success)" class="animate-pulse" />
                                                            <defs>
                                                                <radialGradient id="grad-success">
                                                                    <stop offset="0%" stop-color="#10b981" stop-opacity="0.2" />
                                                                    <stop offset="100%" stop-color="#10b981" stop-opacity="0" />
                                                                </radialGradient>
                                                            </defs>
                                                            ` : ''}
                                                        </svg>

                                                        <!-- House Number Label -->
                                                        <div class="absolute -bottom-1 md:-bottom-2 px-1.5 md:px-2 py-0.5 bg-slate-900 text-white rounded-full text-[7px] md:text-[8px] font-black tracking-widest shadow-lg transform transition-transform group-hover:scale-110">
                                                            ${houseNo}
                                                        </div>
                                                    </div>
                                                </button>

                                                <!-- Hover Info Popover -->
                                                <div class="absolute left-1/2 -top-24 -translate-x-1/2 w-48 bg-slate-900 text-white p-3 rounded-2xl shadow-2xl opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 pointer-events-none z-30">
                                                    <div class="text-center">
                                                        <p class="text-[7px] font-black text-brand-400 uppercase tracking-widest mb-1">DATA PENGHUNI</p>
                                                        <p class="text-[10px] font-black leading-tight mb-1 truncate">${u.full_name}</p>
                                                        <div class="flex items-center justify-center gap-2 mb-2">
                                                            <span class="text-[8px] bg-white/10 px-1.5 py-0.5 rounded uppercase font-black">${no}</span>
                                                            <span class="text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase ${isPaid ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}">
                                                                ${isPaid ? 'Lunas' : 'Menunggak'}
                                                            </span>
                                                        </div>
                                                        <p class="text-[8px] text-white/50 italic">Klik untuk riwayat lengkap</p>
                                                    </div>
                                                    <!-- Arrow -->
                                                    <div class="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900"></div>
                                                </div>
                                            </div>
                                        `;
            }).join('')}
                                </div>
                            </div>
                        `).join('');
        })()}
                </div>
            </div>
        </div>
        `}
    </div>
    
    ${wargaList.length === 0 ? `
            <div class="p-12 text-center">
                <div class="flex flex-col items-center">
                    <i data-lucide="users" class="w-12 h-12 text-slate-200 mb-4"></i>
                    <p class="text-slate-400 font-medium text-sm">Belum ada data warga terdaftar</p>
                </div>
            </div>
        ` : ''}
    </div>
    
    <!-- Modal Iuran -->
    <div id="iuran-modal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-md hidden flex items-center justify-center p-4 z-50">
        <div class="bg-white w-full max-w-xl rounded-[2rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100">
            <div class="px-6 py-5 md:px-8 md:py-6 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                <div>
                    <h3 class="text-xl font-bold text-slate-900" id="iuran-warga-name">Status Iuran</h3>
                    <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1" id="iuran-warga-info">Tahun 2026 • Blok A-12</p>
                </div>
                <button id="btn-close-iuran" class="p-2 hover:bg-slate-200 rounded-xl transition-colors">
                    <i data-lucide="x" class="w-5 h-5 text-slate-500"></i>
                </button>
            </div>
            <div class="p-6 md:p-8">
                <div class="grid grid-cols-3 md:grid-cols-4 gap-4" id="months-grid">
                    <!-- Months will be injected here -->
                </div>
                <div class="mt-6 md:mt-10 p-4 bg-blue-50/50 rounded-2xl flex items-start border border-blue-100/50">
                    <i data-lucide="info" class="w-4 h-4 text-blue-500 mt-0.5 mr-3 shrink-0"></i>
                    <p class="text-[11px] leading-relaxed text-blue-700 font-medium">
                        Klik pada bulan yang belum terbayar untuk melakukan pencatatan iuran. Pembayaran akan otomatis masuk ke laporan keuangan kas RT.
                    </p>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal Form (Hidden) -->
    <div id="warga-modal" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm hidden flex items-center justify-center p-4 z-50">
        <div class="bg-white w-full max-w-md rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-8 shadow-2xl">
            <h3 id="warga-modal-title" class="text-xl font-bold mb-6 text-slate-900">Tambah Warga</h3>
            <form id="warga-form" class="space-y-4">
                <input type="hidden" id="warga-id">
                <div>
                    <label class="block text-xs font-bold text-slate-400 mb-1 ml-1 uppercase">Username</label>
                    <input id="warga-username" type="text" placeholder="Username login" class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all" required>
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-400 mb-1 ml-1 uppercase">Nama Lengkap</label>
                    <input id="warga-full-name" type="text" placeholder="Nama Warga" class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all" required>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-bold text-slate-400 mb-1 ml-1 uppercase">No. Rumah</label>
                        <input id="warga-no-rumah" type="text" placeholder="Misal: A-12" class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-400 mb-1 ml-1 uppercase">WA Number</label>
                        <input id="warga-wa" type="text" placeholder="08xxx" class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all">
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-bold text-slate-400 mb-1 ml-1 uppercase">No. KK</label>
                        <input id="warga-no-kk" type="text" list="kk-list" placeholder="No. Kartu Keluarga" class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all">
                        <datalist id="kk-list"></datalist>
                    </div>
                    <div class="flex items-end pb-3">
                        <label class="flex items-center cursor-pointer select-none">
                            <div class="relative">
                                <input id="warga-is-kk-head" type="checkbox" class="sr-only">
                                <div class="block bg-slate-100 border border-slate-200 w-12 h-6 rounded-full"></div>
                                <div class="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition"></div>
                            </div>
                            <div class="ml-3 text-xs font-black text-slate-500 uppercase">Kepala KK</div>
                        </label>
                    </div>
                </div>
                <style>
                    #warga-is-kk-head:checked ~ .dot { transform: translateX(150%); background-color: #10b981; }
                    #warga-is-kk-head:checked ~ .block { background-color: #ecfdf5; border-color: #10b981; }
                </style>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-bold text-slate-400 mb-1 ml-1 uppercase">Tgl Lahir</label>
                        <input id="warga-tgl-lahir" type="date" class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-400 mb-1 ml-1 uppercase">Gender</label>
                        <select id="warga-gender" class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all">
                            <option value="">- Pilih -</option>
                            <option value="Laki-laki">Laki-laki</option>
                            <option value="Perempuan">Perempuan</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-400 mb-1 ml-1 uppercase">Pekerjaan</label>
                    <input id="warga-pekerjaan" type="text" placeholder="Misal: Karyawan Swasta" class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all">
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-400 mb-1 ml-1 uppercase">Password Login</label>
                    <input id="warga-password" type="password" placeholder="Isi untuk set/ganti" class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all">
                </div>
                <div class="flex space-x-3 pt-6">
                    <button type="button" id="btn-close-warga" class="flex-1 py-3 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">Batal</button>
                    <button type="submit" class="flex-1 py-3 text-sm font-bold text-white bg-brand-600 rounded-xl shadow-lg hover:bg-brand-700 transition-all">Simpan Data</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Payment Card Modal (Premium Redesign) -->
    <div id="card-modal" class="hidden fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-2 md:p-4">
        <div class="bg-slate-50 w-full max-w-[360px] md:max-w-md rounded-[2rem] md:rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden animate-in zoom-in-95 duration-300 border border-white">
            <!-- Modal Header -->
            <div class="px-5 py-4 md:px-8 md:py-6 flex justify-between items-center bg-white border-b border-slate-100">
                <div class="flex items-center gap-3 md:gap-4">
                    <div class="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center shadow-lg shadow-brand-500/30">
                        <i data-lucide="contact-2" class="w-5 h-5 md:w-6 md:h-6"></i>
                    </div>
                    <div>
                        <h3 class="text-xs md:text-base font-black text-slate-900 uppercase tracking-tighter">Kartu Iuran Digital</h3>
                        <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5" id="card-user-name">Memuat...</p>
                    </div>
                </div>
                <button id="btn-close-card" class="p-2.5 hover:bg-slate-100 rounded-2xl transition-all hover:rotate-90 duration-300">
                    <i data-lucide="x" class="w-5 h-5 text-slate-400"></i>
                </button>
            </div>

            <div class="p-4 md:p-6">
                <!-- Physical-style Card -->
                <div class="bg-slate-900 rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-6 mb-6 md:mb-8 text-white shadow-2xl relative overflow-hidden group min-h-[140px] md:min-h-[180px] flex flex-col justify-between">
                    <!-- Card Background Pattern -->
                    <div class="absolute inset-0 opacity-20 pointer-events-none" style="background-image: radial-gradient(circle at 2px 2px, white 1px, transparent 0); background-size: 24px 24px;"></div>
                    <div class="absolute -right-20 -top-20 w-64 h-64 bg-brand-500/20 rounded-full blur-[80px]"></div>
                    <div class="absolute -left-20 -bottom-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px]"></div>
                    
                    <div class="relative z-10 flex justify-between items-start">
                        <div>
                            <p class="text-[8px] font-black text-brand-400 uppercase tracking-[0.3em] mb-1">E-Warga System</p>
                            <p class="text-lg font-black tracking-tight" id="card-user-display-name">NAMA WARGA</p>
                        </div>
                        <div class="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 flex items-center justify-center">
                            <i data-lucide="qr-code" class="w-6 h-6 text-white/40"></i>
                        </div>
                    </div>

                    <div class="relative z-10 grid grid-cols-2 gap-8 pt-4 border-t border-white/10">
                        <div>
                            <p class="text-[8px] font-black text-white/40 uppercase tracking-widest">Nomor KK</p>
                            <p class="text-xs font-black tracking-[0.2em] mt-1" id="card-kk-no">0000 0000 0000 0000</p>
                        </div>
                        <div>
                            <p class="text-[8px] font-black text-white/40 uppercase tracking-widest text-right">Blok / No. Rumah</p>
                            <p class="text-xs font-black tracking-widest mt-1 text-right" id="card-house-no">A-00</p>
                        </div>
                    </div>
                </div>

                <!-- Year Navigation -->
                <div class="flex items-center justify-between mb-4 md:mb-6 px-1">
                    <div class="flex items-center gap-2">
                        <div class="w-0.5 h-3 md:w-1 md:h-4 bg-brand-500 rounded-full"></div>
                        <h4 class="text-[10px] md:text-xs font-black text-slate-900 uppercase tracking-[0.1em] md:tracking-[0.15em]">Riwayat <span id="card-year" class="text-brand-600">2026</span></h4>
                    </div>
                    <select id="card-year-select" class="text-[9px] md:text-[10px] font-black text-slate-600 bg-white border border-slate-200 rounded-lg md:rounded-xl px-2 py-1.5 md:px-4 md:py-2 outline-none hover:border-brand-300 focus:ring-2 focus:ring-brand-500/20 transition-all cursor-pointer shadow-sm">
                        <!-- Options injected by JS -->
                    </select>
                </div>

                <!-- Grid 12 Bulan -->
                <div class="grid grid-cols-3 gap-2 md:gap-4" id="payment-grid">
                    <!-- Matrix of 12 months -->
                </div>

                <div class="mt-6 md:mt-8 flex items-center justify-center gap-3 md:gap-4 py-3 md:py-4 px-4 md:px-6 bg-white rounded-xl md:rounded-2xl border border-slate-100 shadow-sm text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-[0.1em]">
                    <div class="flex items-center gap-2">
                        <div class="w-3 h-3 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                        <span>Lunas</span>
                    </div>
                    <div class="w-px h-3 bg-slate-200"></div>
                    <div class="flex items-center gap-2">
                        <div class="w-3 h-3 bg-slate-200 rounded-full"></div>
                        <span>Belum</span>
                    </div>
                </div>
            </div>
        </div>
    </div>`;

    // Event Listeners for Filters
    const filterMonth = document.getElementById('filter-month');
    const filterYear = document.getElementById('filter-year');
    const searchInput = document.getElementById('search-warga');

    const handleFilterChange = () => {
        App.wargaState.month = filterMonth.value;
        App.wargaState.year = filterYear.value;
        App.wargaState.search = searchInput.value;
        Warga(App); // Re-render
    };

    if (filterMonth) filterMonth.onchange = handleFilterChange;
    if (filterYear) filterYear.onchange = handleFilterChange;

    const btnViewList = document.getElementById('view-list');
    const btnViewMap = document.getElementById('view-map');

    if (btnViewList) {
        btnViewList.onclick = () => {
            App.wargaState.view = 'list';
            Warga(App);
        };
    }
    if (btnViewMap) {
        btnViewMap.onclick = () => {
            App.wargaState.view = 'map';
            Warga(App);
        };
    }

    if (searchInput) {
        let searchTimeout;
        searchInput.oninput = () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(handleFilterChange, 300);
        };
    }

    // Event Listeners for Checkboxes
    const selectAll = document.getElementById('select-all-warga');
    const checkboxes = document.querySelectorAll('.warga-checkbox');
    const bulkBtn = document.getElementById('btn-bulk-payment');
    const selectedCountSpan = document.getElementById('selected-count');

    const updateBulkBtn = () => {
        const checkedCheckboxes = document.querySelectorAll('.warga-checkbox:checked');
        const uniqueIds = new Set(Array.from(checkedCheckboxes).map(cb => cb.dataset.id));
        const checkedCount = uniqueIds.size;

        if (checkedCount > 0) {
            bulkBtn.classList.remove('hidden');
            selectedCountSpan.innerText = checkedCount;
        } else {
            bulkBtn.classList.add('hidden');
        }
    };

    if (selectAll) {
        selectAll.onchange = () => {
            checkboxes.forEach(cb => cb.checked = selectAll.checked);
            updateBulkBtn();
        };
    }

    checkboxes.forEach(cb => {
        cb.onchange = updateBulkBtn;
    });

    // Bulk Payment Action
    if (bulkBtn) {
        bulkBtn.onclick = async () => {
            const checkedCheckboxes = document.querySelectorAll('.warga-checkbox:checked');
            const selectedIds = [...new Set(Array.from(checkedCheckboxes).map(cb => cb.dataset.id))];
            const currentYear = App.wargaState.year;
            const currentMonth = App.wargaState.month;

            const { value: formValues } = await SwalCustom.fire({
                title: 'Pembayaran Kolektif',
                html: `
                <div class="space-y-4 py-4">
                    <div class="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 mb-6 flex items-start">
                        <i data-lucide="info" class="w-5 h-5 text-emerald-600 mr-3 mt-0.5"></i>
                        <div class="flex flex-col text-left">
                            <p class="text-xs font-black text-emerald-700 uppercase tracking-widest leading-tight">Pembayaran Kolektif</p>
                            <p class="text-[10px] font-medium text-emerald-600 mt-1 italic">Mencatat untuk <span class="font-black underline">${selectedIds.length} warga</span> sekaligus.</p>
                            <div class="mt-2 pt-2 border-t border-emerald-100">
                                <p class="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Rincian Per Orang:</p>
                                <p class="text-[10px] font-medium text-emerald-600">${feeItemizedDesc || 'Iuran Bulanan'}</p>
                                <p class="text-xs font-black text-emerald-800 mt-1">Total: Rp ${feeAmount.toLocaleString('id-ID')}</p>
                            </div>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="text-left">
                            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Pilih Bulan</label>
                            <select id="bulk-month" class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 transition-all">
                                ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => `
                                    <option value="${m}" ${m == currentMonth ? 'selected' : ''}>${new Date(2000, m - 1).toLocaleString('id-ID', { month: 'long' })}</option>
                                `).join('')}
                            </select>
                        </div>
                        <div class="text-left">
                            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Pilih Tahun</label>
                            <select id="bulk-year" class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 transition-all">
                                <option value="${currentYear}">${currentYear}</option>
                                <option value="${currentYear - 1}">${currentYear - 1}</option>
                            </select>
                        </div>
                    </div>
                </div>
            `,
                focusConfirm: false,
                showCancelButton: true,
                confirmButtonText: 'Proses Pembayaran',
                cancelButtonText: 'Batal',
                didOpen: () => { if (window.lucide) lucide.createIcons(); },
                preConfirm: () => {
                    return {
                        month: document.getElementById('bulk-month').value,
                        year: document.getElementById('bulk-year').value
                    }
                }
            });

            if (formValues) {
                SwalCustom.fire({
                    title: 'Sedang Memproses...',
                    didOpen: () => { Swal.showLoading(); }
                });

                const res = await API.post('/api/fees/pay-bulk', {
                    user_ids: selectedIds,
                    month: formValues.month,
                    year: formValues.year,
                    amount: feeAmount
                });

                if (res.success) {
                    await SwalCustom.fire({
                        title: 'Berhasil!',
                        text: res.message,
                        icon: 'success'
                    });
                    Warga(App); // Refresh everything
                } else {
                    SwalCustom.fire('Gagal!', res.error, 'error');
                }
            }
        };
    }

    document.getElementById('btn-add-warga').onclick = () => showWargaModal();
    document.getElementById('btn-close-warga').onclick = () => document.getElementById('warga-modal').classList.add('hidden');
    document.getElementById('btn-close-iuran').onclick = () => document.getElementById('iuran-modal').classList.add('hidden');
    document.getElementById('btn-close-card').onclick = () => document.getElementById('card-modal').classList.add('hidden');

    document.querySelectorAll('.btn-card').forEach(btn => {
        btn.onclick = () => showPaymentCardModal(JSON.parse(btn.dataset.warga));
    });

    document.querySelectorAll('.btn-iuran').forEach(btn => {
        btn.onclick = () => showIuranModal(JSON.parse(btn.dataset.warga));
    });

    document.querySelectorAll('.btn-arrears-info').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            const months = JSON.parse(btn.dataset.months);
            const name = btn.dataset.name;
            SwalCustom.fire({
                title: 'Detail Tunggakan',
                html: `
                    <div class="py-4">
                        <p class="text-sm font-bold text-slate-500 mb-6 uppercase tracking-wider">Warga: ${name}</p>
                        <div class="grid grid-cols-2 gap-3 text-left">
                            ${months.map(m => `
                                <div class="flex items-center p-3 bg-rose-50 border border-rose-100 rounded-xl">
                                    <div class="p-1.5 bg-rose-500 rounded-lg mr-3 shadow-sm shadow-rose-500/20">
                                        <i data-lucide="calendar-x-2" class="w-3.5 h-3.5 text-white"></i>
                                    </div>
                                    <span class="text-xs font-black text-rose-700 uppercase tracking-widest">${m}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `,
                confirmButtonText: 'Tutup',
                didOpen: () => { if (window.lucide) lucide.createIcons(); }
            });
        };
    });

    const showIuranModal = async (u) => {
        const modal = document.getElementById('iuran-modal');
        const grid = document.getElementById('months-grid');
        const year = new Date().getFullYear();

        document.getElementById('iuran-warga-name').innerText = u.full_name;
        document.getElementById('iuran-warga-info').innerText = `Tahun ${year} • Blok ${u.no_rumah || 'N/A'}`;

        modal.classList.remove('hidden');
        grid.innerHTML = '<div class="col-span-full py-10 text-center animate-pulse text-slate-300 font-bold">Memuat status...</div>';

        const payments = await API.get(`/api/fees/status?user_id=${u.id}&year=${year}`);
        const paidMonths = payments.map(p => parseInt(p.month));

        const months = [
            'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
            'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
        ];

        grid.innerHTML = months.map((m, i) => {
            const monthNum = i + 1;
            const isPaid = paidMonths.includes(monthNum);
            return `
                <button 
                    class="month-btn flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${isPaid ? 'bg-emerald-50 border-emerald-200 text-emerald-700 cursor-default' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-brand-200 hover:bg-brand-50/50'}"
                    ${isPaid ? 'disabled' : ''}
                    data-month="${monthNum}"
                    data-month-name="${m}"
                >
                    <span class="text-[10px] font-black uppercase tracking-widest mb-1">${m}</span>
                    <i data-lucide="${isPaid ? 'check-circle' : 'circle'}" class="w-5 h-5 ${isPaid ? 'text-emerald-500' : 'text-slate-200'}"></i>
                    <span class="text-[9px] font-bold mt-2 uppercase">
                        ${isPaid ? 'Lunas' : 'Bayar'}
                    </span>
                </button>
            `;
        }).join('');

        if (window.lucide) lucide.createIcons();

        document.querySelectorAll('.month-btn:not([disabled])').forEach(btn => {
            btn.onclick = async () => {
                const month = btn.dataset.month;
                const monthName = btn.dataset.monthName;

                const result = await SwalCustom.fire({
                    title: 'Konfirmasi Pembayaran',
                    html: `
                        <div class="py-4 text-left">
                            <!-- OCR Action Area -->
                            <div class="mb-6">
                                <button id="btn-scan-ocr" class="w-full p-4 rounded-2xl border-2 border-dashed border-brand-200 bg-brand-50/30 flex items-center justify-center gap-3 group hover:border-brand-500 hover:bg-brand-50 transition-all">
                                    <div class="w-10 h-10 rounded-xl bg-white text-brand-600 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                        <i data-lucide="scan-line" class="w-6 h-6"></i>
                                    </div>
                                    <div class="flex flex-col">
                                        <span class="text-xs font-black text-brand-700 uppercase tracking-tight">Scan Bukti Bayar (AI)</span>
                                        <span class="text-[9px] font-bold text-brand-400 uppercase tracking-widest">Otomatis deteksi nominal & tanggal</span>
                                    </div>
                                </button>
                                <input type="file" id="ocr-file-input" class="hidden" accept="image/*">
                            </div>

                            <div id="ocr-result-badge" class="hidden mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                                <div class="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                    <i data-lucide="check" class="w-4 h-4"></i>
                                </div>
                                <div>
                                    <p class="text-[8px] font-black text-emerald-700 uppercase tracking-widest">AI Verified</p>
                                    <p class="text-[10px] font-bold text-emerald-600" id="ocr-extracted-info">Nominal terdeteksi sesuai.</p>
                                </div>
                            </div>

                            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Rincian Pembayaran:</p>
                            <div class="p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-4">
                                <p class="text-[11px] text-slate-500 mb-2">Bulan <span class="font-black text-slate-900">${monthName}</span> untuk <span class="font-black text-slate-900">${u.full_name}</span></p>
                                <div class="space-y-1.5">
                                    ${feeCategories.length > 0 ? feeCategories.map(cat => `
                                        <div class="flex justify-between text-xs font-bold text-slate-600">
                                            <span>${cat.name}</span>
                                            <span>Rp ${parseInt(cat.amount).toLocaleString('id-ID')}</span>
                                        </div>
                                    `).join('') : `
                                        <div class="flex justify-between text-xs font-bold text-slate-600">
                                            <span>Iuran Bulanan</span>
                                            <span>Rp ${feeAmount.toLocaleString('id-ID')}</span>
                                        </div>
                                    `}
                                    <div class="pt-2 mt-2 border-t border-slate-200 flex justify-between text-sm font-black text-emerald-600">
                                        <span>TOTAL</span>
                                        <span>Rp ${feeAmount.toLocaleString('id-ID')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `,
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonText: 'Ya, Bayar Sekarang',
                    cancelButtonText: 'Nanti Dulu',
                    didOpen: () => {
                        if (window.lucide) lucide.createIcons();

                        const scanBtn = document.getElementById('btn-scan-ocr');
                        const fileInput = document.getElementById('ocr-file-input');
                        const resultBadge = document.getElementById('ocr-result-badge');
                        const resultInfo = document.getElementById('ocr-extracted-info');

                        scanBtn.onclick = () => fileInput.click();
                        fileInput.onchange = async (e) => {
                            const file = e.target.files[0];
                            if (!file) return;

                            const data = await processReceiptAI(file);

                            // Restore Swal UI
                            Swal.update({
                                title: 'Konfirmasi Pembayaran',
                                showConfirmButton: true
                            });

                            if (data && data.nominal) {
                                resultBadge.classList.remove('hidden');
                                const isMatch = data.nominal === feeAmount;

                                resultInfo.innerHTML = `Terdeteksi <span class="font-black">Rp ${data.nominal.toLocaleString('id-ID')}</span> ${isMatch ? '(Sesuai)' : '(Beda nominal?)'}`;
                                if (!isMatch) {
                                    resultBadge.classList.replace('bg-emerald-50', 'bg-amber-50');
                                    resultBadge.classList.replace('border-emerald-100', 'border-amber-100');
                                    resultBadge.querySelector('.bg-emerald-500').classList.replace('bg-emerald-500', 'bg-amber-500');
                                    resultBadge.querySelector('i').setAttribute('data-lucide', 'alert-circle');
                                }
                                if (window.lucide) lucide.createIcons();
                            } else {
                                SwalCustom.fire({
                                    title: 'AI Menyerah...',
                                    text: 'Maaf pak, tulisan di struk kurang jelas atau formatnya tidak dikenali. Silakan cek manual ya.',
                                    icon: 'info'
                                });
                            }
                        };
                    }
                });

                if (result.isConfirmed) {
                    const res = await API.post('/api/fees/pay', {
                        user_id: u.id,
                        month: month,
                        year: year,
                        amount: feeAmount // Although backend recalculates, we send for validation
                    });

                    if (res.success) {
                        SwalCustom.fire('Berhasil!', 'Pembayaran telah dicatat.', 'success');
                        showIuranModal(u); // Refresh grid
                        // Optionally refresh the main list badge but that needs rerender
                    } else {
                        SwalCustom.fire('Gagal!', res.error, 'error');
                    }
                }
            };
        });
    };

    document.querySelectorAll('.btn-edit-warga').forEach(btn => {
        btn.onclick = () => showWargaModal(JSON.parse(btn.dataset.warga));
    });

    document.querySelectorAll('.btn-delete-warga').forEach(btn => {
        btn.onclick = async () => {
            const result = await SwalCustom.fire({
                title: 'Hapus Warga?',
                text: "Akun login warga ini juga akan terhapus!",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Ya, Hapus!',
                cancelButtonText: 'Batal'
            });

            if (result.isConfirmed) {
                const res = await API.post('/api/users/delete', { id: btn.dataset.id });
                if (res.success) {
                    SwalCustom.fire('Terhapus!', 'Data warga telah dihapus.', 'success');
                    Warga(App);
                } else {
                    SwalCustom.fire('Gagal!', res.error, 'error');
                }
            }
        };
    });

    const showWargaModal = (u = null) => {
        // Populate KK Datalist
        const kkList = document.getElementById('kk-list');

        // Group users by KK and find the head for each
        const kkMap = {};
        allUsers.filter(user => user.no_kk).forEach(user => {
            if (!kkMap[user.no_kk] || user.is_kk_head == 1) {
                kkMap[user.no_kk] = user.is_kk_head == 1 ? user.full_name : (kkMap[user.no_kk] || user.full_name);
            }
        });

        kkList.innerHTML = Object.entries(kkMap).map(([kk, headName]) =>
            `<option value="${kk}">${headName ? `Keluarga ${headName}` : ''}</option>`
        ).join('');

        document.getElementById('warga-modal').classList.remove('hidden');
        document.getElementById('warga-id').value = u ? u.id : '';
        document.getElementById('warga-username').value = u ? u.username : '';
        document.getElementById('warga-full-name').value = u ? u.full_name : '';
        document.getElementById('warga-no-rumah').value = u ? (u.no_rumah || '') : '';
        document.getElementById('warga-wa').value = u ? (u.wa_number || '') : '';
        document.getElementById('warga-no-kk').value = u ? (u.no_kk || '') : '';
        document.getElementById('warga-is-kk-head').checked = u ? (parseInt(u.is_kk_head) === 1) : false;
        document.getElementById('warga-tgl-lahir').value = u ? (u.tgl_lahir || '') : '';
        document.getElementById('warga-gender').value = u ? (u.jenis_kelamin || '') : '';
        document.getElementById('warga-pekerjaan').value = u ? (u.pekerjaan || '') : '';
        document.getElementById('warga-password').value = '';
        document.getElementById('warga-modal-title').innerText = u ? 'Edit Data Warga' : 'Tambah Warga Baru';
    };

    document.getElementById('warga-form').onsubmit = async (e) => {
        e.preventDefault();
        const id = document.getElementById('warga-id').value;
        const data = {
            username: document.getElementById('warga-username').value,
            full_name: document.getElementById('warga-full-name').value,
            no_rumah: document.getElementById('warga-no-rumah').value,
            wa_number: document.getElementById('warga-wa').value,
            no_kk: document.getElementById('warga-no-kk').value,
            is_kk_head: document.getElementById('warga-is-kk-head').checked ? 1 : 0,
            tgl_lahir: document.getElementById('warga-tgl-lahir').value,
            jenis_kelamin: document.getElementById('warga-gender').value,
            pekerjaan: document.getElementById('warga-pekerjaan').value,
            role_id: 4, // Always Warga
            password: document.getElementById('warga-password').value
        };

        const res = await API.post(id ? '/api/users/update' : '/api/users', id ? { ...data, id } : data);
        if (res.success) {
            document.getElementById('warga-modal').classList.add('hidden');
            Warga(App);
        } else {
            SwalCustom.fire('Gagal!', res.error, 'error');
        }
    };

    const showPaymentCardModal = async (u) => {
        const modal = document.getElementById('card-modal');
        const grid = document.getElementById('payment-grid');
        const yearSelect = document.getElementById('card-year-select');
        const currentYear = new Date().getFullYear();

        document.getElementById('card-user-name').innerText = u.username || 'n/a';
        document.getElementById('card-user-display-name').innerText = u.full_name;
        document.getElementById('card-kk-no').innerText = u.no_kk || '-';
        document.getElementById('card-house-no').innerText = u.no_rumah || '-';
        document.getElementById('card-year').innerText = currentYear;

        // Dynamic Year Selection (Past 5 Years)
        let yearOptions = '';
        for (let i = 0; i < 5; i++) {
            const y = currentYear - i;
            yearOptions += `<option value="${y}">${y}</option>`;
        }
        yearSelect.innerHTML = yearOptions;
        yearSelect.value = currentYear;

        modal.classList.remove('hidden');
        if (window.lucide) lucide.createIcons();

        const renderGrid = async (year) => {
            grid.innerHTML = '<div class="col-span-full py-20 text-center text-[10px] text-slate-400 font-black uppercase lg:tracking-[0.3em] animate-pulse">Synchronizing Data...</div>';

            const payments = await API.get(`/api/fees/status?user_id=${u.id}&year=${year}`);
            const months = [
                'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
            ];

            grid.innerHTML = '';
            months.forEach((name, index) => {
                const monthNum = index + 1;
                const p = payments?.find ? payments.find(pay => pay.month == monthNum) : null;
                const isPaid = !!p;

                // Determine status logic
                // If not paid:
                // - Past months/Current month: RED (Unpaid/Arrears)
                // - Future months: SLATE (Not due yet)
                const now = new Date();
                const currentMonth = now.getMonth() + 1;
                const currentYear = now.getFullYear();

                // Check if this month is in the past or is current month of current year (or previous years)
                const isDue = (parseInt(year) < currentYear) || (parseInt(year) === currentYear && monthNum <= currentMonth);

                // Style Logic
                let bgClass = 'bg-white border-slate-100 hover:border-slate-200 shadow-sm';
                let textClass = 'text-slate-400';
                let iconClass = 'bg-slate-100 text-slate-300';
                let iconName = 'minus';
                let barClass = 'bg-slate-200';
                let barWidth = '0%';

                if (isPaid) {
                    bgClass = 'bg-white border-emerald-100 shadow-[0_8px_16px_-8px_rgba(16,185,129,0.1)]';
                    textClass = 'text-emerald-600';
                    iconClass = 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30';
                    iconName = 'check';
                    barClass = 'bg-emerald-500';
                    barWidth = '100%';
                } else if (isDue) {
                    // Unpaid & Due = RED
                    bgClass = 'bg-rose-50 border-rose-100 hover:border-rose-200 shadow-[0_8px_16px_-8px_rgba(244,63,94,0.1)]';
                    textClass = 'text-rose-600';
                    iconClass = 'bg-rose-500 text-white shadow-lg shadow-rose-500/30 animate-pulse';
                    iconName = 'x';
                    barClass = 'bg-rose-500';
                    barWidth = '15%'; // Small indicator for unpaid
                }

                const item = document.createElement('div');
                item.className = `group/month relative p-3 rounded-[1.5rem] border transition-all duration-300 flex flex-col items-center justify-center gap-2 ${bgClass}`;

                item.innerHTML = `
                    <span class="text-[7px] font-black uppercase tracking-widest ${textClass}">${name.substring(0, 3)}</span>
                    <div class="relative w-7 h-7 rounded-full flex items-center justify-center transition-transform group-hover/month:scale-110 ${iconClass}">
                        <i data-lucide="${iconName}" class="w-3.5 h-3.5"></i>
                    </div>
                    <div class="h-1 w-full bg-slate-50 rounded-full overflow-hidden">
                        <div class="h-full ${barClass} transition-all duration-700" style="width: ${barWidth}"></div>
                    </div>
                    ${isPaid && p.paid_at ? `
                        <div class="absolute -top-1 right-0 translate-x-1/2 -translate-y-1/2 opacity-0 group-hover/month:opacity-100 transition-opacity z-20">
                            <div class="bg-slate-900 text-white text-[7px] font-black px-2 py-1 rounded-lg shadow-xl whitespace-nowrap uppercase tracking-widest">
                                Lunas: ${new Date(p.paid_at).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' })}
                            </div>
                        </div>
                    ` : (isDue && !isPaid ? `
                        <div class="absolute -top-1 right-0 translate-x-1/2 -translate-y-1/2 z-20">
                             <span class="flex h-2 w-2">
                                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                <span class="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                            </span>
                        </div>
                    ` : '')}
                `;
                grid.appendChild(item);
            });
            if (window.lucide) lucide.createIcons();
        };

        yearSelect.onchange = () => {
            document.getElementById('card-year').innerText = yearSelect.value;
            renderGrid(yearSelect.value);
        };

        renderGrid(currentYear);
    };

    const loadOCR = () => {
        return new Promise((resolve, reject) => {
            if (window.Tesseract) return resolve(window.Tesseract);
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/tesseract.js@v5.0.3/dist/tesseract.min.js';
            script.onload = () => resolve(window.Tesseract);
            script.onerror = reject;
            document.head.appendChild(script);
        });
    };

    const processReceiptAI = async (file) => {
        try {
            const Tesseract = await loadOCR();
            const worker = await Tesseract.createWorker('ind'); // Use Indonesian

            Swal.update({
                title: 'AI sedang membaca struk...',
                html: '<div class="py-10 flex flex-col items-center"><div class="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mb-4"></div><p class="text-xs font-black text-slate-400 uppercase animate-pulse">Scanning Visual Data...</p></div>',
                showConfirmButton: false
            });

            const { data: { text } } = await worker.recognize(file);
            await worker.terminate();

            console.log("OCR Result:", text);

            // Simple Parsing Logic
            // 1. Nominal (Look for Rp or long numbers)
            const nominalMatches = text.replace(/[,.]/g, '').match(/\d{5,8}/g); // Look for 5-8 digit numbers
            const nominal = nominalMatches ? Math.max(...nominalMatches.map(Number)) : null;

            // 2. Date (DD/MM/YYYY or similar)
            const dateMatch = text.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/);
            const dateValue = dateMatch ? dateMatch[0] : null;

            return { nominal, date: dateValue, raw: text };
        } catch (err) {
            console.error("OCR Error:", err);
            return null;
        }
    };

    if (window.lucide) lucide.createIcons();
};
