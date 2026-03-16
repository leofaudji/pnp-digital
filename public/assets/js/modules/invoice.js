import API from '../api.js';

export const InvoiceAdmin = async (ctx) => {
    const user = await ctx.getUser();
    if (user.role_id != 1 && user.role_id != 2) {
        ctx.container.innerHTML = '<h1 class="text-2xl text-red-500">Unauthorized</h1>';
        return;
    }

    let currentMonth = new Date().getMonth() + 1;
    let currentYear = new Date().getFullYear();
    let currentStatus = '';
    let currentUserId = '';

    // Fetch Warga for filter
    const users = await API.get('/api/users');
    const citizens = users.filter(u => u.role_id == 4 && u.is_kk_head == 1)
        .sort((a, b) => (a.no_rumah || '').localeCompare(b.no_rumah || '', undefined, { numeric: true }));

    ctx.container.innerHTML = `
        <div class="p-4 md:p-6 max-w-7xl mx-auto pb-24 md:pb-6">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
                <div>
                    <h1 class="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Digital Invoicing</h1>
                    <p class="text-slate-500 text-xs md:text-sm mt-1">Kelola tagihan iuran warga secara digital.</p>
                </div>
                <div class="flex items-center gap-3">
                    <button id="generate-invoices" class="w-full md:w-auto flex items-center justify-center px-4 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-bold shadow-sm shadow-brand-100 hover:bg-brand-700 transition-all">
                        <i data-lucide="zap" class="w-4 h-4 mr-2"></i>
                        Generate Tagihan
                    </button>
                </div>
            </div>

            <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-6">
                <!-- Filter Section -->
                <div class="p-4 border-b border-slate-100 bg-slate-50/50">
                    <div class="flex flex-col space-y-4">
                        <div class="flex items-center space-x-2">
                            <i data-lucide="filter" class="w-4 h-4 text-slate-400"></i>
                            <span class="text-xs font-bold text-slate-700 uppercase tracking-wider">Filter Data</span>
                        </div>
                        
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div class="space-y-1 col-span-2 md:col-span-1">
                                <label class="text-[10px] font-bold text-slate-400 uppercase ml-1">Status Pembayaran</label>
                                <select id="filter-status" class="w-full bg-white border border-slate-200 text-slate-700 text-xs font-bold px-3 py-2.5 rounded-xl outline-none focus:border-brand-500 transition-colors appearance-none">
                                    <option value="">Semua Status</option>
                                    <option value="PAID">PAID (Lunas)</option>
                                    <option value="UNPAID">UNPAID (Belum Bayar)</option>
                                </select>
                            </div>

                            <div class="space-y-1">
                                <label class="text-[10px] font-bold text-slate-400 uppercase ml-1">Bulan</label>
                                <select id="filter-month" class="w-full bg-white border border-slate-200 text-slate-700 text-xs font-bold px-3 py-2.5 rounded-xl outline-none focus:border-brand-500 transition-colors appearance-none">
                                    <option value="">Semua Bulan</option>
                                    ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => `
                                        <option value="${m}" ${m == currentMonth ? 'selected' : ''}>Bulan ${m}</option>
                                    `).join('')}
                                </select>
                            </div>

                            <div class="space-y-1">
                                <label class="text-[10px] font-bold text-slate-400 uppercase ml-1">Tahun</label>
                                <select id="filter-year" class="w-full bg-white border border-slate-200 text-slate-700 text-xs font-bold px-3 py-2.5 rounded-xl outline-none focus:border-brand-500 transition-colors appearance-none">
                                    <option value="">Semua Tahun</option>
                                    ${[currentYear - 1, currentYear, currentYear + 1].map(y => `
                                        <option value="${y}" ${y == currentYear ? 'selected' : ''}>${y}</option>
                                    `).join('')}
                                </select>
                            </div>

                            <div class="space-y-1 col-span-2 md:col-span-1">
                                <label class="text-[10px] font-bold text-slate-400 uppercase ml-1">Nama Warga (KK)</label>
                                <div class="relative">
                                    <input type="text" id="filter-warga-input" list="warga-list" placeholder="Ketik Nama..." 
                                           class="w-full bg-white border border-slate-200 text-slate-700 text-xs font-bold px-3 py-2.5 rounded-xl outline-none focus:border-brand-500 transition-colors">
                                    <datalist id="warga-list">
                                        ${citizens.map(c => `<option value="[${c.no_rumah || '-'}] ${c.full_name}">`).join('')}
                                    </datalist>
                                    <i data-lucide="search" class="absolute right-3 top-2.5 w-4 h-4 text-slate-400"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Desktop Table View -->
                <div class="hidden md:block overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="border-b border-slate-50">
                                <th class="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Warga</th>
                                <th class="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Periode</th>
                                <th class="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Jumlah</th>
                                <th class="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Status</th>
                                <th class="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody id="invoice-table-body" class="divide-y divide-slate-50">
                            <tr><td colspan="5" class="px-6 py-12 text-center text-slate-400 text-sm">
                                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mx-auto mb-3"></div>
                                Memuat data...
                            </td></tr>
                        </tbody>
                    </table>
                </div>

                <!-- Mobile Card View -->
                <div id="invoice-cards-mobile" class="md:hidden divide-y divide-slate-50">
                    <div class="p-12 text-center">
                        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mx-auto mb-3"></div>
                        <span class="text-xs text-slate-400">Memuat data...</span>
                    </div>
                </div>
            </div>
        </div>
    `;

    if (window.lucide) lucide.createIcons();

    const loadInvoices = async () => {
        try {
            const url = `/api/invoices?month=${currentMonth}&year=${currentYear}&status=${currentStatus}&user_id=${currentUserId}`;
            const invoices = await API.get(url);
            const tbody = document.getElementById('invoice-table-body');
            const cardContainer = document.getElementById('invoice-cards-mobile');

            if (!Array.isArray(invoices) || invoices.length === 0) {
                const emptyMsg = `<tr><td colspan="5" class="px-6 py-12 text-center text-slate-400 text-sm italic">Belum ada tagihan untuk kriteria ini.</td></tr>`;
                const emptyCardMsg = `<div class="p-12 text-center text-slate-400 text-xs italic">Belum ada tagihan untuk kriteria ini.</div>`;
                if (tbody) tbody.innerHTML = emptyMsg;
                if (cardContainer) cardContainer.innerHTML = emptyCardMsg;
                return;
            }

            // Render Table (Desktop)
            tbody.innerHTML = invoices.map(inv => `
                <tr class="hover:bg-slate-50/50 transition-colors group">
                    <td class="px-6 py-4">
                        <div class="flex items-center">
                            <div class="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-xs mr-3">
                                ${inv.full_name?.charAt(0) || '?'}
                            </div>
                            <div>
                                <div class="text-[13px] font-bold text-slate-900">${inv.full_name}</div>
                                <div class="text-[11px] text-slate-400">@${inv.username}</div>
                            </div>
                        </div>
                    </td>
                    <td class="px-6 py-4">
                        <span class="text-[13px] font-medium text-slate-600">${inv.month}/${inv.year}</span>
                    </td>
                    <td class="px-6 py-4 text-right">
                        <span class="text-[13px] font-bold text-slate-900">Rp ${Number(inv.amount).toLocaleString('id-ID')}</span>
                    </td>
                    <td class="px-6 py-4 text-center">
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${inv.status === 'PAID' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                }">
                            ${inv.status}
                        </span>
                    </td>
                    <td class="px-6 py-4 text-right">
                        <div class="flex items-center justify-end gap-2">
                            <button onclick="window.printInvoice(${inv.id})" class="p-2 text-slate-400 hover:text-brand-600 transition-colors" title="Cetak PDF">
                                <i data-lucide="printer" class="w-4 h-4"></i>
                            </button>
                            ${inv.status === 'UNPAID' ? `
                                <button onclick="window.sendReminder(${inv.id})" class="p-2 text-slate-400 hover:text-emerald-600 transition-colors" title="Kirim WA Reminder">
                                    <i data-lucide="message-square" class="w-4 h-4"></i>
                                </button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `).join('');

            // Render Cards (Mobile)
            cardContainer.innerHTML = invoices.map(inv => `
                <div class="p-4 flex flex-col space-y-3">
                    <div class="flex items-start justify-between">
                        <div class="flex items-center">
                            <div class="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-sm mr-3">
                                ${inv.full_name?.charAt(0) || '?'}
                            </div>
                            <div>
                                <div class="text-sm font-bold text-slate-900">${inv.full_name}</div>
                                <div class="text-[11px] text-slate-400">@${inv.username}</div>
                            </div>
                        </div>
                        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${inv.status === 'PAID' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                }">
                            ${inv.status}
                        </span>
                    </div>
                    <div class="flex items-center justify-between px-1">
                        <div class="text-xs text-slate-500 font-medium">Periode: <span class="text-slate-900 font-bold">${inv.month}/${inv.year}</span></div>
                        <div class="text-sm font-black text-brand-600">Rp ${Number(inv.amount).toLocaleString('id-ID')}</div>
                    </div>
                    <div class="flex items-center gap-2">
                        <button onclick="window.printInvoice(${inv.id})" class="flex-1 flex items-center justify-center gap-2 py-2.5 bg-brand-50 text-brand-600 rounded-xl text-xs font-bold transition-all active:scale-95">
                            <i data-lucide="printer" class="w-3.5 h-3.5"></i>
                            Cetak PDF
                        </button>
                        ${inv.status === 'UNPAID' ? `
                            <button onclick="window.sendReminder(${inv.id})" class="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold transition-all active:scale-95">
                                <i data-lucide="message-square" class="w-3.5 h-3.5"></i>
                                WhatsApp
                            </button>
                        ` : ''}
                    </div>
                </div>
            `).join('');

            if (window.lucide) lucide.createIcons();
        } catch (e) {
            console.error('Invoice Load Error:', e);
            const msg = `<div class="p-12 text-center text-rose-500 text-xs">Gagal memuat data.</div>`;
            if (document.getElementById('invoice-table-body')) document.getElementById('invoice-table-body').innerHTML = `<tr><td colspan="5" class="px-6 py-12 text-center text-rose-500 text-sm">Gagal memuat data.</td></tr>`;
            if (document.getElementById('invoice-cards-mobile')) document.getElementById('invoice-cards-mobile').innerHTML = msg;
        }
    };

    // Event Listeners for Filters
    document.getElementById('filter-month').onchange = (e) => {
        currentMonth = e.target.value;
        loadInvoices();
    };
    document.getElementById('filter-year').onchange = (e) => {
        currentYear = e.target.value;
        loadInvoices();
    };
    document.getElementById('filter-warga-input').onchange = (e) => {
        const val = e.target.value;
        // Match the format "[No. Rumah] Full Name"
        const user = citizens.find(c => `[${c.no_rumah || '-'}] ${c.full_name}` === val);
        currentUserId = user ? user.id : '';
        loadInvoices();
    };
    document.getElementById('filter-status').onchange = (e) => {
        currentStatus = e.target.value;
        loadInvoices();
    };

    document.getElementById('generate-invoices').onclick = async () => {
        try {
            const { isConfirmed } = await SwalCustom.fire({
                title: 'Generate Tagihan?',
                text: `Sistem akan membuat tagihan bagi semua warga untuk periode ${currentMonth}/${currentYear}.`,
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Ya, Generate!',
                cancelButtonText: 'Batal'
            });

            if (isConfirmed) {
                const res = await API.post('/api/invoices/generate', { month: currentMonth, year: currentYear });
                if (res && res.success) {
                    SwalCustom.fire('Berhasil!', res.message, 'success');
                    loadInvoices();
                } else {
                    SwalCustom.fire('Gagal!', res?.error || 'Gagal membuat tagihan.', 'error');
                }
            }
        } catch (e) {
            console.error(e);
            SwalCustom.fire('Error!', 'Terjadi kesalahan jaringan atau server.', 'error');
        }
    };

    window.printInvoice = (id) => {
        window.open(`${ctx.basePath}/api/invoices/print?id=${id}`, '_blank');
    };

    window.sendReminder = async (id) => {
        try {
            const res = await API.get(`/api/invoices/reminder?id=${id}`);
            if (res && res.url) {
                window.open(res.url, '_blank');
            } else {
                SwalCustom.fire('Oops!', 'Gagal mendapatkan link pengingat.', 'error');
            }
        } catch (e) {
            console.error(e);
            SwalCustom.fire('Error!', 'Terjadi kesalahan saat menghubungi server.', 'error');
        }
    };

    loadInvoices();
};

export const InvoiceResident = async (ctx) => {
    ctx.container.innerHTML = `
        <div class="p-4 md:p-6 max-w-5xl mx-auto pb-24 md:pb-6">
            <div class="mb-6 md:mb-8">
                <h1 class="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Tagihan Saya</h1>
                <p class="text-slate-500 text-xs md:text-sm mt-1">Daftar iuran bulanan Anda.</p>
            </div>

            <div id="invoice-list" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="md:col-span-2 flex justify-center p-12">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
                </div>
            </div>
        </div>
    `;

    const loadInvoices = async () => {
        try {
            const invoices = await API.get('/api/invoices');
            const list = document.getElementById('invoice-list');

            if (!Array.isArray(invoices) || invoices.length === 0) {
                list.innerHTML = `<div class="md:col-span-2 bg-white rounded-2xl p-12 text-center border border-dashed border-slate-200 text-slate-400 text-sm">Belum ada data tagihan.</div>`;
                return;
            }

            list.innerHTML = invoices.map(inv => `
                <div class="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:border-brand-200 transition-all flex items-center justify-between group">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors">
                            <i data-lucide="receipt" class="w-6 h-6"></i>
                        </div>
                        <div>
                            <h3 class="text-sm font-bold text-slate-900">Periode ${inv.month}/${inv.year}</h3>
                            <p class="text-[10px] text-slate-500 mt-1 font-medium">Total: <span class="text-slate-900 font-bold">Rp ${Number(inv.amount).toLocaleString('id-ID')}</span></p>
                            ${inv.status === 'PAID' && inv.paid_at ? `
                                <p class="text-[9px] text-emerald-600 font-black uppercase tracking-tighter mt-1 flex items-center">
                                    <i data-lucide="calendar-check" class="w-2.5 h-2.5 mr-1"></i>
                                    Lunas: ${new Date(inv.paid_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </p>
                            ` : ''}
                        </div>
                    </div>
                    <div class="flex flex-col items-end gap-3">
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${inv.status === 'PAID' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                }">
                            ${inv.status}
                        </span>
                        <button onclick="window.printInvoice(${inv.id})" class="p-2.5 bg-brand-50 text-brand-600 rounded-xl hover:bg-brand-600 hover:text-white transition-all active:scale-95" title="Download Invoice">
                            <i data-lucide="download" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
            `).join('');
            if (window.lucide) lucide.createIcons();
        } catch (e) {
            console.error('Invoice Load Error:', e);
            const list = document.getElementById('invoice-list');
            if (list) list.innerHTML = `<div class="md:col-span-2 bg-white rounded-2xl p-12 text-center text-rose-500 text-sm">Gagal memuat tagihan. Silakan coba lagi nanti.</div>`;
        }
    };

    window.printInvoice = (id) => {
        window.open(`${ctx.basePath}/api/invoices/print?id=${id}`, '_blank');
    };

    loadInvoices();
};
