import API from '../api.js';
import Sidebar from '../sidebar.js';

export const Finance = async (App, m = null, y = null) => {
    document.getElementById('header-container').classList.remove('hidden');
    document.getElementById('page-title').innerText = 'Keuangan RT';
    const user = await App.getUser();
    await Sidebar.render(user ? user.role : null);

    const now = new Date();
    const selectedMonth = m || (now.getMonth() + 1);
    const selectedYear = y || now.getFullYear();

    const resBase = await API.get(`/api/finance?month=${selectedMonth}&year=${selectedYear}`);
    const finance = resBase.data || [];
    const summary = resBase.summary || { total_balance: 0, monthly_income: 0, monthly_expense: 0 };
    const advances = await API.get('/api/finance/advances');
    const satpams = (user.role_id == 1 || user.role_id == 2) ? await API.get('/api/users/satpam') : [];

    const isKasbonRoute = window.location.hash === '#/kasbon';

    let html = `
    <div id="report-content" class="space-y-8">
        <!-- Summary Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <div class="bg-gradient-to-br from-brand-600 to-brand-700 p-6 rounded-[2rem] shadow-xl shadow-brand-500/20 text-white relative overflow-hidden group">
                <i data-lucide="wallet" class="w-24 h-24 absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-700"></i>
                <div class="relative z-10">
                    <p class="text-[10px] font-black uppercase tracking-widest text-brand-100 mb-1 opacity-80">Saldo Akhir Kas</p>
                    <h4 class="text-2xl font-black">Rp ${parseInt(summary.total_balance).toLocaleString('id-ID')}</h4>
                    <div class="mt-4 flex items-center text-[10px] font-bold bg-white/10 backdrop-blur-md rounded-full px-3 py-1 w-fit">
                        <span class="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-2"></span>
                        Operational Ready
                    </div>
                </div>
            </div>

            <div class="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm group">
                <div class="flex items-center justify-between mb-4">
                    <div class="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <i data-lucide="trending-up" class="w-6 h-6"></i>
                    </div>
                    <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bulan Ini</span>
                </div>
                <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Pemasukan</p>
                <h4 class="text-xl font-black text-slate-900">+ Rp ${parseInt(summary.monthly_income).toLocaleString('id-ID')}</h4>
            </div>

            <div class="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm group">
                <div class="flex items-center justify-between mb-4">
                    <div class="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <i data-lucide="trending-down" class="w-6 h-6"></i>
                    </div>
                    <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bulan Ini</span>
                </div>
                <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Pengeluaran</p>
                <h4 class="text-xl font-black text-slate-900">- Rp ${parseInt(summary.monthly_expense).toLocaleString('id-ID')}</h4>
            </div>
        </div>

        <!-- Tab System -->
        <div class="flex space-x-2 p-1 bg-slate-100 rounded-2xl w-full md:w-fit overflow-x-auto no-scrollbar">
            <button onclick="document.querySelectorAll('.fin-tab').forEach(t=>t.classList.add('hidden')); document.getElementById('tab-transaksi').classList.remove('hidden'); document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('bg-white','shadow-sm','text-brand-600')); this.classList.add('bg-white','shadow-sm','text-brand-600')" class="tab-btn px-6 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap flex-shrink-0 ${!isKasbonRoute ? 'bg-white shadow-sm text-brand-600' : 'text-slate-500'}">
                Laporan Transaksi
            </button>
            <button onclick="document.querySelectorAll('.fin-tab').forEach(t=>t.classList.add('hidden')); document.getElementById('tab-kasbon').classList.remove('hidden'); document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('bg-white','shadow-sm','text-brand-600')); this.classList.add('bg-white','shadow-sm','text-brand-600')" class="tab-btn px-6 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap flex-shrink-0 ${isKasbonRoute ? 'bg-white shadow-sm text-brand-600' : 'text-slate-500'}">
                Kasbon Petugas
            </button>
            <button onclick="document.querySelectorAll('.fin-tab').forEach(t=>t.classList.add('hidden')); document.getElementById('tab-recap').classList.remove('hidden'); document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('bg-white','shadow-sm','text-brand-600')); this.classList.add('bg-white','shadow-sm','text-brand-600'); window.renderYearlyRecap()" class="tab-btn px-6 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap flex-shrink-0 text-slate-500">
                Rekap Tahunan
            </button>
        </div>

        <!-- Transaksi Tab -->
        <div id="tab-transaksi" class="fin-tab bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700 ${isKasbonRoute ? 'hidden' : ''}">
            <div class="px-6 md:px-8 py-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0 bg-slate-50/30">
                <h3 class="text-lg font-bold text-slate-900 flex items-center">
                    <i data-lucide="list" class="w-5 h-5 mr-3 text-brand-600"></i>
                    Rincian Transaksi
                </h3>
                <div class="grid grid-cols-2 md:flex items-center gap-3 w-full md:w-auto">
                    <div class="col-span-2 md:col-span-1 flex items-center bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm w-full md:w-auto justify-between md:justify-start">
                        <select id="filter-month" class="bg-transparent text-[11px] font-black uppercase tracking-widest outline-none cursor-pointer text-slate-600 flex-1">
                            ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => `
                                <option value="${m}" ${m == selectedMonth ? 'selected' : ''}>${new Date(2000, m - 1).toLocaleString('id-ID', { month: 'long' })}</option>
                            `).join('')}
                        </select>
                        <div class="w-px h-4 bg-slate-200 mx-3"></div>
                        <select id="filter-year" class="bg-transparent text-[11px] font-black uppercase tracking-widest outline-none cursor-pointer text-slate-600">
                            ${[2024, 2025, 2026, 2027].map(y => `
                                <option value="${y}" ${y == selectedYear ? 'selected' : ''}>${y}</option>
                            `).join('')}
                        </select>
                    </div>
                    <button id="btn-export-csv" class="flex items-center justify-center px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-all active:scale-95 shadow-sm">
                        <i data-lucide="file-spreadsheet" class="w-4 h-4 mr-2 text-emerald-600"></i> CSV
                    </button>
                    <button id="btn-export-pdf" class="flex items-center justify-center px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-all active:scale-95 shadow-sm">
                        <i data-lucide="file-text" class="w-4 h-4 mr-2 text-rose-600"></i> PDF
                    </button>
                    <button id="btn-add-finance" class="col-span-2 md:col-span-1 flex items-center justify-center px-5 py-2.5 bg-brand-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-brand-700 transition-all shadow-lg active:scale-95 shadow-brand-500/20">
                        <i data-lucide="plus" class="w-4 h-4 mr-2"></i> Tambah Data
                    </button>
                </div>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full text-left">
                    <thead>
                        <tr class="bg-slate-50/50 text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                            <th class="px-4 py-3 md:px-8 md:py-4">Tanggal</th>
                            <th class="px-4 py-3 md:px-8 md:py-4">Keterangan</th>
                            <th class="px-4 py-3 md:px-8 md:py-4 text-center">Tipe</th>
                            <th class="px-4 py-3 md:px-8 md:py-4 text-right">Jumlah</th>
                            ${(user.role_id == 1 || user.role_id == 2) ? '<th class="px-4 py-3 md:px-8 md:py-4 text-center">Aksi</th>' : ''}
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        ${finance.map(item => {
        const isIncome = item.type === 'INCOME';
        return `
                            <tr class="hover:bg-slate-50/50 transition-colors">
                                <td class="px-4 py-3 md:px-8 md:py-4 text-xs font-bold text-slate-500 whitespace-nowrap">
                                    ${new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: '2-digit' })}
                                </td>
                                <td class="px-4 py-3 md:px-8 md:py-4 max-w-[120px] md:max-w-xs truncate">
                                    <p class="text-xs md:text-sm font-bold text-slate-900 truncate">${item.description}</p>
                                    <p class="text-[9px] md:text-[10px] text-slate-400 font-medium tracking-tight truncate">Oleh: ${item.created_by_name}</p>
                                </td>
                                <td class="px-4 py-3 md:px-8 md:py-4 text-center">
                                    <span class="px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest ${isIncome ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}">
                                        ${item.type}
                                    </span>
                                </td>
                                <td class="px-4 py-3 md:px-8 md:py-4 text-right font-black text-xs md:text-sm text-${isIncome ? 'emerald' : 'rose'}-600 whitespace-nowrap">
                                    ${isIncome ? '+' : '-'} ${parseInt(item.amount).toLocaleString('id-ID')}
                                </td>
                                ${(user.role_id == 1 || user.role_id == 2) ? `
                                <td class="px-4 py-3 md:px-8 md:py-4 text-center">
                                    <div class="flex items-center justify-center space-x-1 md:space-x-2">
                                        <button onclick='window.editFinance(${JSON.stringify(item)})' class="p-1.5 md:p-2 bg-slate-100 text-slate-500 rounded-lg hover:bg-brand-50 hover:text-brand-600 transition-colors">
                                            <i data-lucide="pencil" class="w-3 h-3 md:w-4 md:h-4"></i>
                                        </button>
                                        <button onclick="window.deleteFinance(${item.id})" class="p-1.5 md:p-2 bg-slate-100 text-slate-500 rounded-lg hover:bg-rose-50 hover:text-rose-600 transition-colors">
                                            <i data-lucide="trash-2" class="w-3 h-3 md:w-4 md:h-4"></i>
                                        </button>
                                    </div>
                                </td>
                                ` : ''}
                            </tr>`;
    }).join('')}
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Kasbon Tab -->
        <div id="tab-kasbon" class="fin-tab bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden ${!isKasbonRoute ? 'hidden' : ''} animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div class="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-rose-50/30">
                <h3 class="text-lg font-bold text-slate-900 flex items-center">
                    <i data-lucide="hand-coins" class="w-5 h-5 mr-3 text-rose-600"></i>
                    Pinjaman Gaji (Kasbon)
                </h3>
                ${(user.role_id == 1 || user.role_id == 2) ? `
                <button id="btn-add-kasbon" class="flex items-center px-5 py-2.5 bg-rose-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-rose-700 transition-all shadow-lg active:scale-95 shadow-rose-500/20">
                    <i data-lucide="plus" class="w-4 h-4 mr-2"></i> Catat Kasbon
                </button>
                ` : ''}
            </div>
            <div class="overflow-x-auto">
                <table class="w-full text-left">
                    <thead>
                        <tr class="bg-slate-50/50 text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                            <th class="px-4 py-3 md:px-8 md:py-4">Tanggal</th>
                            <th class="px-4 py-3 md:px-8 md:py-4">Petugas</th>
                            <th class="px-4 py-3 md:px-8 md:py-4">Keterangan</th>
                            <th class="px-4 py-3 md:px-8 md:py-4 text-center">Status</th>
                            <th class="px-4 py-3 md:px-8 md:py-4 text-right">Jumlah</th>
                            ${(user.role_id == 1 || user.role_id == 2) ? '<th class="px-4 py-3 md:px-8 md:py-4 text-center">Aksi</th>' : ''}
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        ${advances.map(item => `
                            <tr class="hover:bg-slate-50/50 transition-colors">
                                <td class="px-4 py-3 md:px-8 md:py-4 text-xs font-bold text-slate-500 whitespace-nowrap">
                                    ${new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: '2-digit' })}
                                </td>
                                <td class="px-4 py-3 md:px-8 md:py-4">
                                    <p class="text-xs md:text-sm font-bold text-slate-900 line-clamp-1">${item.full_name}</p>
                                    <p class="text-[9px] md:text-[10px] text-slate-400 font-medium tracking-tight uppercase">${item.role_name}</p>
                                </td>
                                <td class="px-4 py-3 md:px-8 md:py-4 text-xs md:text-sm font-medium text-slate-600 max-w-[150px] md:max-w-sm whitespace-normal break-words leading-tight">${item.description || '-'}</td>
                                <td class="px-4 py-3 md:px-8 md:py-4 text-center">
                                    <span class="px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest ${item.status === 'PENDING' ? 'bg-orange-50 text-orange-600 border border-orange-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}">
                                        ${item.status}
                                    </span>
                                </td>
                                <td class="px-4 py-3 md:px-8 md:py-4 text-right font-black text-xs md:text-sm text-rose-600 whitespace-nowrap">
                                    ${parseInt(item.amount).toLocaleString('id-ID')}
                                </td>
                                ${(user.role_id == 1 || user.role_id == 2) ? `
                                <td class="px-4 py-3 md:px-8 md:py-4 text-center">
                                    ${item.status === 'PENDING' ? `
                                    <button onclick="window.settleAdvance(${item.id})" class="px-2 py-1 md:px-3 md:py-1.5 bg-emerald-600 text-white text-[8px] md:text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-emerald-700 transition-all shadow-md shadow-emerald-500/20 active:scale-95 whitespace-nowrap">
                                        Lunasi
                                    </button>
                                    ` : '<i data-lucide="check-circle-2" class="w-3 h-3 md:w-4 md:h-4 text-emerald-500 mx-auto"></i>'}
                                </td>
                                ` : ''}
                            </tr>
                        `).join('')}
                        ${advances.length === 0 ? `
                            <tr>
                                <td colspan="5" class="px-8 py-20 text-center">
                                    <p class="text-slate-400 font-medium italic text-sm">Belum ada riwayat kasbon.</p>
                                </td>
                            </tr>
                        ` : ''}
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Recap Tab -->
        <div id="tab-recap" class="fin-tab bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div class="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-brand-50/30">
                <h3 class="text-lg font-bold text-slate-900 flex items-center">
                    <i data-lucide="bar-chart-3" class="w-5 h-5 mr-3 text-brand-600"></i>
                    Rekap Bulanan Tahunan
                </h3>
                <div class="flex items-center space-x-3">
                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">Pilih Tahun:</label>
                    <select id="recap-year-select" class="p-2.5 bg-white border border-slate-200 rounded-xl outline-none font-bold text-xs text-slate-700 focus:border-brand-300 transition-all cursor-pointer">
                        ${[2024, 2025, 2026, 2027].map(y => `<option value="${y}" ${y === new Date().getFullYear() ? 'selected' : ''}>${y}</option>`).join('')}
                    </select>
                    <div class="w-px h-4 bg-slate-200 mx-1"></div>
                    <button id="btn-export-lpj" class="flex items-center px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-all active:scale-95 shadow-sm">
                        <i data-lucide="printer" class="w-4 h-4 mr-2 text-brand-600"></i> Cetak LPJ
                    </button>
                </div>
            </div>
            <div id="recap-table-container">
                <!-- Recap table will be rendered here -->
                <div class="p-20 text-center">
                    <div class="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p class="text-xs font-bold text-slate-400 uppercase tracking-widest">Memuat Data...</p>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Transaksi Modal -->
    <div id="finance-modal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-md hidden flex items-center justify-center p-4 z-50">
        <div class="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 border border-slate-100">
            <h3 class="text-xl font-bold mb-6 text-slate-900">Input Transaksi Baru</h3>
            <form id="finance-form" class="space-y-5">
                <div class="flex space-x-3 mb-6 p-1 bg-slate-100 rounded-2xl">
                    <label class="flex-1">
                        <input type="radio" name="type" value="INCOME" checked class="hidden peer">
                        <div class="p-3 text-center cursor-pointer font-black text-[10px] uppercase tracking-widest rounded-xl transition-all peer-checked:bg-white peer-checked:text-emerald-600 peer-checked:shadow-sm text-slate-500">Masuk</div>
                    </label>
                    <label class="flex-1">
                        <input type="radio" name="type" value="EXPENSE" class="hidden peer">
                        <div class="p-3 text-center cursor-pointer font-black text-[10px] uppercase tracking-widest rounded-xl transition-all peer-checked:bg-white peer-checked:text-rose-600 peer-checked:shadow-sm text-slate-500">Keluar</div>
                    </label>
                </div>
                <div class="space-y-4">
                    <div>
                        <label class="block text-[10px] font-black text-slate-400 uppercase ml-1 mb-1.5">Tanggal</label>
                        <input id="fin-date" type="date" value="${new Date().toISOString().split('T')[0]}" class="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-semibold" required>
                    </div>
                    <div>
                        <label class="block text-[10px] font-black text-slate-400 uppercase ml-1 mb-1.5">Nominal (Rp)</label>
                        <input id="fin-amount" type="number" placeholder="0" class="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold" required>
                    </div>
                    <div>
                        <label class="block text-[10px] font-black text-slate-400 uppercase ml-1 mb-1.5">Keterangan</label>
                        <textarea id="fin-desc" placeholder="Deskripsi..." class="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-semibold resize-none" rows="2" required></textarea>
                    </div>
                </div>
                <div class="flex space-x-3 pt-6">
                    <button type="button" onclick="document.getElementById('finance-modal').classList.add('hidden')" class="flex-1 py-4 bg-slate-50 text-slate-500 font-bold rounded-2xl">Batal</button>
                    <button type="submit" class="flex-1 py-4 bg-brand-600 text-white font-black rounded-2xl shadow-xl">Simpan</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Kasbon Modal -->
    <div id="kasbon-modal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-md hidden flex items-center justify-center p-4 z-50">
        <div class="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 border border-slate-100">
            <div class="flex items-center mb-6">
                <div class="p-3 bg-rose-50 rounded-2xl mr-4"><i data-lucide="hand-coins" class="w-6 h-6 text-rose-600"></i></div>
                <h3 class="text-xl font-bold text-slate-900">Catat Kasbon Baru</h3>
            </div>
            <form id="kasbon-form" class="space-y-5">
                <div class="space-y-4">
                    <div>
                        <label class="block text-[10px] font-black text-slate-400 uppercase ml-1 mb-1.5">Pilih Petugas (Satpam)</label>
                        <select id="kasbon-user-id" class="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none appearance-none font-semibold" required>
                            <option value="">-- Pilih Satpam --</option>
                            ${satpams.map(s => `<option value="${s.id}">${s.full_name}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="block text-[10px] font-black text-slate-400 uppercase ml-1 mb-1.5">Tanggal Pinjaman</label>
                        <input id="kasbon-date" type="date" value="${new Date().toISOString().split('T')[0]}" class="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-semibold" required>
                    </div>
                    <div>
                        <label class="block text-[10px] font-black text-slate-400 uppercase ml-1 mb-1.5">Jumlah Kasbon (Rp)</label>
                        <input id="kasbon-amount" type="number" placeholder="50.000" class="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold" required>
                    </div>
                    <div>
                        <label class="block text-[10px] font-black text-slate-400 uppercase ml-1 mb-1.5">Alasan/Keterangan</label>
                        <input id="kasbon-desc" type="text" placeholder="Misal: Keperluan mendadak..." class="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-semibold">
                    </div>
                </div>
                <div class="flex space-x-3 pt-6">
                    <button type="button" onclick="document.getElementById('kasbon-modal').classList.add('hidden')" class="flex-1 py-4 bg-slate-50 text-slate-500 font-bold rounded-2xl">Batal</button>
                    <button type="submit" class="flex-1 py-4 bg-rose-600 text-white font-black rounded-2xl shadow-xl shadow-rose-500/20">Catat kasbon</button>
                </div>
            </form>
        </div>
    </div>`;
    App.container.innerHTML = html;

    const filterMonth = document.getElementById('filter-month');
    const filterYear = document.getElementById('filter-year');
    if (filterMonth && filterYear) {
        const refreshFinance = () => Finance(App, filterMonth.value, filterYear.value);
        filterMonth.onchange = refreshFinance;
        filterYear.onchange = refreshFinance;
    }

    // btnAddFinance moved below

    const btnAddKasbon = document.getElementById('btn-add-kasbon');
    if (btnAddKasbon) btnAddKasbon.onclick = () => document.getElementById('kasbon-modal').classList.remove('hidden');

    window.renderYearlyRecap = async () => {
        const yearSelect = document.getElementById('recap-year-select');
        const container = document.getElementById('recap-table-container');
        if (!yearSelect || !container) return;

        const year = yearSelect.value;
        container.innerHTML = `
            <div class="p-20 text-center">
                <div class="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p class="text-xs font-bold text-slate-400 uppercase tracking-widest">Memperbarui Rekap ${year}...</p>
            </div>
        `;

        const res = await API.get(`/api/finance/recap?year=${year}`);
        const data = res.data || {};
        const monthNames = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

        let tbody = '';
        let grandTotalIn = 0;
        let grandTotalOut = 0;

        for (let i = 1; i <= 12; i++) {
            const row = data[i] || { income: 0, expense: 0 };
            const net = row.income - row.expense;
            grandTotalIn += row.income;
            grandTotalOut += row.expense;

            tbody += `
                <tr class="hover:bg-slate-50/50 transition-colors">
                    <td class="px-4 py-3 md:px-8 md:py-4 text-xs font-black text-slate-500 uppercase tracking-widest">${monthNames[i]}</td>
                    <td class="px-4 py-3 md:px-8 md:py-4 text-right font-bold text-emerald-600 whitespace-nowrap">${row.income.toLocaleString('id-ID')}</td>
                    <td class="px-4 py-3 md:px-8 md:py-4 text-right font-bold text-rose-600 whitespace-nowrap">${row.expense.toLocaleString('id-ID')}</td>
                    <td class="px-4 py-3 md:px-8 md:py-4 text-right font-black text-slate-900 bg-slate-50/30 whitespace-nowrap">${net.toLocaleString('id-ID')}</td>
                </tr>
            `;
        }

        container.innerHTML = `
            <div class="overflow-x-auto">
                <table class="w-full text-left">
                    <thead>
                        <tr class="bg-slate-50/50 text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                            <th class="px-4 py-3 md:px-8 md:py-4">Bulan (${year})</th>
                            <th class="px-4 py-3 md:px-8 md:py-4 text-right text-emerald-600">Pemasukan</th>
                            <th class="px-4 py-3 md:px-8 md:py-4 text-right text-rose-600">Pengeluaran</th>
                            <th class="px-4 py-3 md:px-8 md:py-4 text-right bg-slate-50/50">Saldo Bersih</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        ${tbody}
                    </tbody>
                    <tfoot class="bg-slate-900 text-white font-black text-[10px] md:text-xs uppercase tracking-widest">
                        <tr>
                            <td class="px-4 py-3 md:px-8 md:py-5">TOTAL</td>
                            <td class="px-4 py-3 md:px-8 md:py-5 text-right text-emerald-400 whitespace-nowrap">${grandTotalIn.toLocaleString('id-ID')}</td>
                            <td class="px-4 py-3 md:px-8 md:py-5 text-right text-rose-400 whitespace-nowrap">${grandTotalOut.toLocaleString('id-ID')}</td>
                            <td class="px-4 py-3 md:px-8 md:py-5 text-right bg-white/10 whitespace-nowrap">${(grandTotalIn - grandTotalOut).toLocaleString('id-ID')}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
            <div class="p-6 bg-slate-50 flex items-center justify-center space-x-2">
                <i data-lucide="info" class="w-3.5 h-3.5 text-slate-400"></i>
                <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Data di atas mencakup seluruh transaksi yang tercatat dalam buku besar RT untuk tahun ${year}.</p>
            </div>
        `;
        if (window.lucide) lucide.createIcons();
    };

    const yearSelect = document.getElementById('recap-year-select');
    if (yearSelect) yearSelect.onchange = () => window.renderYearlyRecap();

    document.getElementById('btn-export-csv').onclick = () => {
        window.open(API.basePath + `/api/finance/export/csv?month=${selectedMonth}&year=${selectedYear}`, '_blank');
    };

    document.getElementById('btn-export-pdf').onclick = () => {
        window.open(API.basePath + `/api/finance/export/pdf?month=${selectedMonth}&year=${selectedYear}`, '_blank');
    };

    const btnExportLpj = document.getElementById('btn-export-lpj');
    if (btnExportLpj) {
        btnExportLpj.onclick = () => {
            const y = document.getElementById('recap-year-select').value;
            window.open(API.basePath + `/api/finance/export/lpj?year=${y}`, '_blank');
        };
    }

    document.getElementById('finance-form').onsubmit = async (e) => {
        e.preventDefault();
        const id = document.getElementById('fin-id').value;
        const url = id ? '/api/finance/update' : '/api/finance';

        const payload = {
            type: document.querySelector('input[name="type"]:checked').value,
            date: document.getElementById('fin-date').value,
            amount: document.getElementById('fin-amount').value,
            description: document.getElementById('fin-desc').value
        };

        if (id) payload.id = id;

        const res = await API.post(url, payload);
        if (res.success) {
            document.getElementById('finance-modal').classList.add('hidden');
            Finance(App);
        }
    };

    // Add hidden ID input to form if not exists
    if (!document.getElementById('fin-id')) {
        const inputId = document.createElement('input');
        inputId.type = 'hidden';
        inputId.id = 'fin-id';
        document.getElementById('finance-form').appendChild(inputId);
    }

    const btnAddFinance = document.getElementById('btn-add-finance');
    if (btnAddFinance) {
        btnAddFinance.onclick = () => {
            document.getElementById('finance-form').reset();
            document.getElementById('fin-id').value = '';
            document.getElementById('fin-date').value = new Date().toISOString().split('T')[0];
            document.querySelector('#finance-modal h3').innerText = 'Input Transaksi Baru';
            document.getElementById('finance-modal').classList.remove('hidden');
        };
    }

    window.editFinance = (item) => {
        document.getElementById('fin-id').value = item.id;
        document.getElementById('fin-date').value = item.date;
        document.getElementById('fin-amount').value = parseInt(item.amount);
        document.getElementById('fin-desc').value = item.description;

        // Select Radio
        const radios = document.getElementsByName('type');
        for (const radio of radios) {
            if (radio.value === item.type) radio.checked = true;
        }

        document.querySelector('#finance-modal h3').innerText = 'Edit Transaksi';
        document.getElementById('finance-modal').classList.remove('hidden');
    };

    window.deleteFinance = async (id) => {
        const confirm = await SwalCustom.fire({
            title: 'Hapus Transaksi?',
            text: 'Data yang dihapus tidak dapat dikembalikan.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ya, Hapus!',
            cancelButtonText: 'Batal',
            confirmButtonColor: '#e11d48'
        });

        if (confirm.isConfirmed) {
            const res = await API.post(`/api/finance/delete?id=${id}`);
            if (res.success) {
                Finance(App);
                SwalCustom.fire('Terhapus!', 'Data transaksi berhasil dihapus.', 'success');
            }
        }
    };

    const kasbonForm = document.getElementById('kasbon-form');
    if (kasbonForm) {
        kasbonForm.onsubmit = async (e) => {
            e.preventDefault();
            const res = await API.post('/api/finance/advances', {
                user_id: document.getElementById('kasbon-user-id').value,
                amount: document.getElementById('kasbon-amount').value,
                date: document.getElementById('kasbon-date').value,
                description: document.getElementById('kasbon-desc').value
            });
            if (res.success) Finance(App);
        };
    }

    window.settleAdvance = async (id) => {
        const confirm = await SwalCustom.fire({
            title: 'Konfirmasi Pelunasan',
            text: 'Apakah Anda yakin ingin menandai kasbon ini sebagai Lunas?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Ya, Lunasi!',
            cancelButtonText: 'Batal'
        });

        if (confirm.isConfirmed) {
            const res = await API.post(`/api/finance/advances/settle?id=${id}`);
            if (res.success) {
                Finance(App);
            }
        }
    };

    if (window.lucide) lucide.createIcons();
};

export const Salary = async (App, targetUserId = null) => {
    document.getElementById('header-container').classList.remove('hidden');
    document.getElementById('page-title').innerText = 'Slip Gaji';
    const user = await App.getUser();
    await Sidebar.render(user ? user.role : null);

    const isAdmin = user.role_id == 1 || user.role_id == 2;
    let satpams = [];
    if (isAdmin) {
        satpams = await API.get('/api/users/satpam');
        if (!targetUserId && satpams.length > 0) {
            targetUserId = satpams[0].id;
        }
    }

    const userIdToFetch = targetUserId || user.id;

    const settings = await API.get('/api/settings');
    const attendance = await API.get(`/api/attendance/summary${userIdToFetch ? `?user_id=${userIdToFetch}` : ''}`);
    const debtRes = await API.get(`/api/finance/my-debt${userIdToFetch ? `?user_id=${userIdToFetch}` : ''}`);
    const payStatus = await API.get(`/api/finance/salary/status?user_id=${userIdToFetch}`);
    const history = await API.get(`/api/finance/salary/history?user_id=${userIdToFetch}`);

    const historyRes = await API.get(`/api/attendance/history${userIdToFetch ? `?user_id=${userIdToFetch}` : ''}`);
    const historyData = historyRes || [];

    const baseSalary = parseInt(settings.salary_satpam || 2000000);
    const incentiveAmount = parseInt(settings.incentive_amount || 50000);
    const totalDays = attendance.total_days || 0;
    const mealAllowance = totalDays * 25000;
    const kasbonDeduction = debtRes.total_debt || 0;
    const pendingAdvances = debtRes.pending_advances || [];

    // Calculate Discipline Metrics
    const shiftMorningStart = settings.shift_morning_start || '06:00';
    const shiftNightStart = settings.shift_night_start || '20:00';

    // Group history to check performance per day
    const grouped = {};
    historyData.forEach(item => {
        const date = item.timestamp.split(' ')[0];
        if (!grouped[date]) grouped[date] = { hasIn: false, isLate: false, checkpoints: 0 };
        if (item.type === 'IN') {
            grouped[date].hasIn = true;
            const time = item.timestamp.split(' ')[1].substring(0, 5);
            const [inH, inM] = time.split(':').map(Number);
            const baseline = (inH < 14) ? shiftMorningStart : shiftNightStart;
            const [startH, startM] = baseline.split(':').map(Number);
            if (inH > startH || (inH === startH && inM > startM)) grouped[date].isLate = true;
        } else if (item.type === 'CHECKPOINT') {
            grouped[date].checkpoints++;
        }
    });

    const latenessCount = Object.values(grouped).filter(d => d.isLate).length;
    const incompletePatrols = Object.values(grouped).filter(d => d.hasIn && d.checkpoints === 0).length;
    const eligibleForIncentive = totalDays > 0 && latenessCount === 0 && incompletePatrols === 0;

    const totalSalary = (baseSalary + mealAllowance + (eligibleForIncentive ? incentiveAmount : 0)) - kasbonDeduction;

    const displayUser = isAdmin ? satpams.find(s => s.id == userIdToFetch) : user;
    if (displayUser) {
        displayUser.role = isAdmin ? 'SATPAM' : user.role;
    }

    const isSatpam = user.role_id == 3;

    let html = `
    <div class="space-y-8 max-w-2xl mx-auto pb-20">
        ${isAdmin ? `
        <!-- Selection for Admin -->
        <div class="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-3">Pilih Petugas Satpam</label>
            <div class="relative group">
                <select id="select-satpam-salary" class="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none appearance-none font-bold text-slate-900 group-hover:border-brand-300 transition-all cursor-pointer">
                    ${satpams.map(s => `<option value="${s.id}" ${s.id == userIdToFetch ? 'selected' : ''}>${s.full_name} (@${s.username})</option>`).join('')}
                </select>
                <div class="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-brand-500 transition-colors">
                    <i data-lucide="chevron-down" class="w-5 h-5"></i>
                </div>
            </div>
        </div>
        ` : ''}

        ${!isSatpam ? `
        <div class="bg-white p-6 md:p-12 rounded-[2rem] md:rounded-[3rem] border border-slate-100 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-700" id="slip-area">
            <div class="absolute top-0 right-0 w-32 h-32 md:w-48 md:h-48 bg-brand-50 rounded-bl-full -mr-16 -mt-16 md:-mr-20 md:-mt-20 opacity-50"></div>
            
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 md:mb-16 relative z-10 space-y-4 md:space-y-0">
                <div>
                    <h1 class="text-2xl md:text-3xl font-black uppercase text-slate-900 tracking-tighter mb-1 leading-none">Slip Gaji Digital</h1>
                    <div class="flex flex-wrap items-center gap-2 md:gap-3">
                        <p class="text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-slate-400">Periode: ${new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</p>
                        <div class="flex">
                        ${payStatus.is_paid ? `
                            <span class="px-2 py-0.5 bg-emerald-500 text-white text-[8px] font-black rounded-md tracking-widest uppercase flex items-center shadow-lg shadow-emerald-500/20"><i data-lucide="check" class="w-2.5 h-2.5 mr-1"></i> Terbayar</span>
                        ` : `
                            <span class="px-2 py-0.5 bg-amber-500 text-white text-[8px] font-black rounded-md tracking-widest uppercase flex items-center shadow-lg shadow-amber-500/20"><i data-lucide="clock" class="w-2.5 h-2.5 mr-1"></i> Belum Diproses</span>
                        `}
                        </div>
                    </div>
                </div>
                <div class="w-12 h-12 md:w-16 md:h-16 bg-brand-600 rounded-2xl md:rounded-3xl flex items-center justify-center text-white shadow-xl shadow-brand-500/20">
                    <i data-lucide="shield-check" class="w-6 h-6 md:w-8 md:h-8"></i>
                </div>
            </div>

            <div class="mb-10 md:mb-12 relative z-10">
                <p class="text-2xl md:text-3xl font-black text-slate-900 mb-1 leading-tight">${displayUser.full_name}</p>
                <div class="flex flex-wrap items-center gap-2">
                    <span class="text-[9px] md:text-[10px] font-black text-brand-600 bg-brand-50 px-2 md:px-3 py-1 rounded-full uppercase tracking-widest border border-brand-100">${displayUser.role}</span>
                    <span class="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">@${displayUser.username}</span>
                </div>
            </div>
            
            <div class="space-y-4 md:space-y-6 relative z-10">
                <div class="bg-slate-50/50 rounded-2xl md:rounded-3xl p-4 md:p-6 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between group hover:bg-white hover:border-brand-200 transition-all duration-300 space-y-3 sm:space-y-0">
                    <div class="flex items-center">
                        <div class="w-10 h-10 bg-white rounded-xl md:rounded-2xl flex items-center justify-center text-brand-600 shadow-sm mr-4 group-hover:scale-110 transition-transform"><i data-lucide="calendar-check" class="w-5 h-5"></i></div>
                        <div>
                            <p class="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Rekap Kehadiran</p>
                            <p class="text-xs md:text-sm font-bold text-slate-900">Total Hari Kerja</p>
                        </div>
                    </div>
                    <p class="text-lg md:text-xl font-black text-slate-900">${totalDays} <span class="text-[10px] text-slate-400 uppercase ml-1">Hari</span></p>
                </div>

                <div class="bg-slate-50 rounded-[1.5rem] md:rounded-[2.5rem] p-6 md:p-10 space-y-4 md:space-y-6 border border-slate-100 shadow-inner">
                    <div class="flex justify-between items-center group">
                        <span class="text-xs md:text-sm font-bold text-slate-500 group-hover:text-slate-900 transition-colors uppercase tracking-widest">Gaji Pokok</span>
                        <span class="text-xs md:text-sm font-black text-slate-900">Rp ${baseSalary.toLocaleString('id-ID')}</span>
                    </div>
                    <div class="flex justify-between items-center group">
                        <div class="flex flex-col">
                            <span class="text-xs md:text-sm font-bold text-slate-500 group-hover:text-slate-900 transition-colors uppercase tracking-widest">Uang Makan</span>
                            <span class="text-[8px] md:text-[9px] font-black text-emerald-600 uppercase tracking-widest mt-0.5 md:mt-1">(Rp 25.000 x ${totalDays} Hari)</span>
                        </div>
                        <span class="text-xs md:text-sm font-black text-slate-900">Rp ${mealAllowance.toLocaleString('id-ID')}</span>
                    </div>

                    ${incentiveAmount > 0 ? `
                    <div class="flex justify-between items-center group pt-2 border-t border-slate-100/50">
                        <div class="flex flex-col max-w-[70%]">
                            <span class="text-xs md:text-sm font-bold ${eligibleForIncentive ? 'text-emerald-600' : 'text-slate-400'} transition-colors uppercase tracking-widest flex items-center">
                                Insentif <span class="hidden sm:inline ml-1">Kedisiplinan</span>
                                ${eligibleForIncentive ? `
                                    <span class="ml-2 w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                                ` : ''}
                            </span>
                            <span class="text-[8px] md:text-[9px] font-black ${eligibleForIncentive ? 'text-emerald-500' : 'text-slate-300'} uppercase tracking-widest mt-1">
                                ${eligibleForIncentive ? '🏆 Performa Sempurna' : `Syarat: 0 Telp / 0 Bolos (${latenessCount}/${incompletePatrols})`}
                            </span>
                        </div>
                        <span class="text-xs md:text-sm font-black ${eligibleForIncentive ? 'text-emerald-600' : 'text-slate-400 opacity-50'}">
                            Rp ${eligibleForIncentive ? incentiveAmount.toLocaleString('id-ID') : '0'}
                        </span>
                    </div>
                    ` : ''}
                    
                    ${kasbonDeduction > 0 ? `
                    <div class="space-y-3 pt-2">
                        <div class="flex justify-between items-center group">
                            <div class="flex flex-col">
                                <span class="text-xs md:text-sm font-bold text-rose-500 transition-colors uppercase tracking-widest">Kasbon</span>
                                <span class="text-[8px] md:text-[9px] font-black text-rose-400 uppercase tracking-widest mt-1 italic">Periode ini</span>
                            </div>
                            <span class="text-xs md:text-sm font-black text-rose-600">- Rp ${kasbonDeduction.toLocaleString('id-ID')}</span>
                        </div>
                        
                        ${isAdmin && !payStatus.is_paid ? `
                        <div class="space-y-2 mt-4 ml-2 md:ml-4 pl-3 md:pl-4 border-l-2 border-rose-100">
                            <p class="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Rincian Hutang:</p>
                            ${pendingAdvances.map(adv => `
                            <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-white/50 p-2 md:p-3 rounded-xl border border-rose-50 group/item space-y-2 sm:space-y-0">
                                <div>
                                    <p class="text-[9px] md:text-[10px] font-bold text-slate-700 truncate">${adv.description || 'Kasbon'}</p>
                                    <p class="text-[8px] md:text-[9px] text-slate-400">${new Date(adv.date).toLocaleDateString('id-ID')}</p>
                                </div>
                                <div class="flex items-center justify-between sm:justify-end sm:space-x-3">
                                    <span class="text-[9px] md:text-[10px] font-black text-rose-500 mr-2 sm:mr-0">Rp ${parseInt(adv.amount).toLocaleString('id-ID')}</span>
                                    <button onclick="window.settleFromSlip(${adv.id}, ${userIdToFetch})" class="px-2 md:px-3 py-1 bg-emerald-600 text-white text-[8px] md:text-[9px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-emerald-500/20 active:scale-90 transition-all sm:opacity-0 sm:group-hover/item:opacity-100 hover:bg-emerald-700">Lunasi</button>
                                </div>
                            </div>
                            `).join('')}
                        </div>
                        ` : ''}
                    </div>
                    ` : ''}

                    <div class="pt-6 md:pt-8 border-t-2 border-dashed border-slate-200 flex flex-col items-end sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
                        <span class="text-[10px] md:text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">Total THP</span>
                        <div class="text-right">
                            <span class="text-2xl md:text-3xl font-black text-brand-600 block shadow-brand-500/10 mb-1 leading-none">Rp ${totalSalary.toLocaleString('id-ID')}</span>
                            <span class="text-[8px] md:text-[9px] font-black text-emerald-500 uppercase tracking-widest flex items-center justify-end"><i data-lucide="${payStatus.is_paid ? 'check-circle-2' : 'alert-circle'}" class="w-3 h-3 mr-1"></i> ${payStatus.is_paid ? 'Paid & Verified' : 'Pending'}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="mt-8 md:mt-14 space-y-3 md:space-y-4">
                ${isAdmin && !payStatus.is_paid ? `
                <button onclick="window.processSalary(${userIdToFetch})" class="w-full bg-emerald-600 text-white px-6 md:px-10 py-4 md:py-5 rounded-2xl md:rounded-[2rem] font-black text-[10px] md:text-xs uppercase tracking-widest flex items-center justify-center shadow-xl shadow-emerald-500/20 hover:bg-emerald-700 transition-all active:scale-95 group">
                    <i data-lucide="banknote" class="w-4 h-4 md:w-5 md:h-5 mr-2 md:mr-3 group-hover:scale-110 transition-transform"></i> Proses Gaji
                </button>
                ` : ''}

                <button onclick="window.printSalarySlip(${userIdToFetch})" class="w-full bg-slate-900 text-white px-6 md:px-10 py-4 md:py-5 rounded-2xl md:rounded-[2rem] font-black text-[10px] md:text-xs uppercase tracking-widest flex items-center justify-center shadow-xl hover:bg-slate-800 transition-all active:scale-95 group">
                    <i data-lucide="printer" class="w-4 h-4 md:w-5 md:h-5 mr-2 md:mr-3 group-hover:rotate-12 transition-transform"></i> Cetak PDF
                </button>
                <p class="text-[8px] md:text-[9px] font-bold text-slate-400 text-center uppercase tracking-[0.2em] leading-relaxed max-w-[90%] md:max-w-[80%] mx-auto">
                    Dokumen ini merupakan bukti tanda terima gaji elektronik yang dihasilkan secara otomatis dan sah.
                </p>
            </div>
        </div>
        ` : ''}

        <!-- History Recap Section -->
        <div class="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div class="px-8 py-6 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
                <div class="flex items-center">
                    <div class="p-3 bg-brand-50 rounded-2xl mr-4 shadow-sm">
                        <i data-lucide="history" class="w-6 h-6 text-brand-600"></i>
                    </div>
                    <div>
                        <h3 class="text-xl font-bold text-slate-900">Riwayat Gaji Saya</h3>
                        <p class="text-xs text-slate-500 font-medium">Rekap gaji yang sudah diproses selama ini</p>
                    </div>
                </div>
            </div>
            <div class="p-8">
                ${history.length > 0 ? `
                <div class="space-y-4">
                    ${history.map(row => `
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between p-4 md:p-5 bg-slate-50 rounded-2xl border border-slate-100 group hover:bg-white hover:border-brand-200 transition-all space-y-4 sm:space-y-0">
                        <div class="flex items-center">
                            <div class="w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl flex flex-col items-center justify-center shadow-sm mr-4 border border-slate-200 shrink-0">
                                <span class="text-[7px] md:text-[8px] font-black text-slate-400 uppercase leading-none mb-1">${new Date(row.year, row.month - 1).toLocaleDateString('id-ID', { month: 'short' })}</span>
                                <span class="text-[10px] md:text-xs font-black text-slate-900 leading-none">${row.year}</span>
                            </div>
                            <div>
                                <p class="text-xs md:text-sm font-bold text-slate-900">Gaji Terbayar</p>
                                <p class="text-[9px] md:text-[10px] text-slate-400 font-medium uppercase tracking-widest italic leading-tight">Verified</p>
                            </div>
                        </div>
                        <div class="flex items-center justify-between sm:justify-end sm:space-x-6">
                            <div class="text-right mr-4 sm:mr-0">
                                <p class="text-sm font-black text-slate-900">Rp ${parseInt(row.total_thp).toLocaleString('id-ID')}</p>
                                <p class="text-[8px] md:text-[9px] font-black text-emerald-500 uppercase tracking-widest flex items-center justify-end"><i data-lucide="check" class="w-3 h-3 mr-1"></i> Success</p>
                            </div>
                            <button onclick="window.printSalarySlip(${userIdToFetch}, ${row.month}, ${row.year})" class="p-2.5 md:p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-brand-600 hover:border-brand-200 hover:shadow-md transition-all active:scale-90 group/btn">
                                <i data-lucide="file-text" class="w-4 h-4 md:w-5 md:h-5 group-hover/btn:scale-110 transition-transform"></i>
                            </button>
                        </div>
                    </div>
                    `).join('')}
                </div>
                ` : `
                <div class="text-center py-12 px-8">
                    <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i data-lucide="folder-x" class="w-8 h-8 text-slate-300"></i>
                    </div>
                    <p class="text-sm font-bold text-slate-400 uppercase tracking-widest">Belum ada riwayat gaji</p>
                    <p class="text-[10px] text-slate-300 mt-1 max-w-[200px] mx-auto leading-relaxed">Setelah gaji diproses, rekap pembayaran akan tampil di sini secara kronologis.</p>
                </div>
                `}
            </div>
        </div>
    </div>`;

    App.container.innerHTML = html;

    window.printSalarySlip = async (uid, month = null, year = null) => {
        const data = { user_id: uid };
        if (month) data.month = month;
        if (year) data.year = year;

        await API.post('/api/finance/salary/prepare', data);
        window.open(API.basePath + `/api/finance/salary/print`, '_blank');
    };

    window.processSalary = async (uid) => {
        const confirm = await SwalCustom.fire({
            title: 'Proses Pembayaran?',
            text: 'Tindakan ini akan mencatat gaji sebagai pengeluaran RT dan melunasi kasbon terkait secara otomatis.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ya, Proses Sekarang!',
            cancelButtonText: 'Batal'
        });

        if (confirm.isConfirmed) {
            Swal.fire({ title: 'Memproses...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
            const res = await API.post('/api/finance/salary/process', { user_id: uid });
            if (res.success) {
                await SwalCustom.fire('Berhasil!', res.message, 'success');
                Salary(App, uid);
            } else {
                SwalCustom.fire('Gagal!', res.error, 'error');
            }
        }
    };

    if (isAdmin) {
        const select = document.getElementById('select-satpam-salary');
        if (select) {
            select.onchange = (e) => Salary(App, e.target.value);
        }

        window.settleFromSlip = async (id, uid) => {
            const confirm = await SwalCustom.fire({
                title: 'Konfirmasi Pelunasan',
                text: 'Tandai item kasbon ini sebagai sudah lunas?',
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Ya, Lunasi!',
                cancelButtonText: 'Batal'
            });

            if (confirm.isConfirmed) {
                const res = await API.post(`/api/finance/advances/settle?id=${id}`);
                if (res.success) {
                    Salary(App, uid);
                }
            }
        };
    }

    if (window.lucide) lucide.createIcons();
};
