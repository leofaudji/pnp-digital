import API from '../api.js';

export const Analytics = async (ctx) => {
    ctx.container.innerHTML = `
        <div class="p-4 md:p-8 max-w-7xl mx-auto pb-24 md:pb-8">
            <div class="mb-8">
                <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Analitik & Transparansi Keuangan</h1>
                <p class="text-slate-500 text-sm mt-1">Pantau arus kas dan alokasi dana warga secara real-time.</p>
            </div>

            <!-- Stats Overview -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div class="flex items-center justify-between mb-4">
                        <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <i data-lucide="trending-up" class="w-5 h-5"></i>
                        </div>
                        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Partisipasi Iuran</span>
                    </div>
                    <div id="participation-stat" class="text-2xl font-black text-slate-900">0%</div>
                    <div class="text-xs text-slate-400 mt-1">Warga sudah membayar bulan ini</div>
                </div>
                <div id="income-stat-card" class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div class="flex items-center justify-between mb-4">
                        <div class="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                            <i data-lucide="arrow-down-left" class="w-5 h-5"></i>
                        </div>
                        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Pemasukan</span>
                    </div>
                    <div id="total-income" class="text-2xl font-black text-slate-900">Rp 0</div>
                    <div class="text-xs text-slate-400 mt-1">6 bulan terakhir</div>
                </div>
                <div id="expense-stat-card" class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div class="flex items-center justify-between mb-4">
                        <div class="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                            <i data-lucide="arrow-up-right" class="w-5 h-5"></i>
                        </div>
                        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Pengeluaran</span>
                    </div>
                    <div id="total-expense" class="text-2xl font-black text-slate-900">Rp 0</div>
                    <div class="text-xs text-slate-400 mt-1">6 bulan terakhir</div>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <!-- Cash Flow Trend -->
                <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div class="flex items-center justify-between mb-6">
                        <h3 class="font-bold text-slate-800">Tren Arus Kas</h3>
                        <div class="text-[10px] font-bold text-slate-400 uppercase">6 Bulan Terakhir</div>
                    </div>
                    <div class="h-[300px] w-full relative">
                        <canvas id="trendChart"></canvas>
                    </div>
                </div>

                <!-- Fund Allocation -->
                <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div class="flex items-center justify-between mb-6">
                        <h3 class="font-bold text-slate-800">Alokasi Dana Keluar</h3>
                        <div class="text-[10px] font-bold text-slate-400 uppercase">Bulan Ini</div>
                    </div>
                    <div class="h-[300px] w-full relative flex items-center justify-center">
                        <canvas id="allocationChart"></canvas>
                    </div>
                </div>
            </div>
        </div>
    `;

    if (window.lucide) lucide.createIcons();

    try {
        const [analytics, allocation] = await Promise.all([
            API.get('/api/finance/analytics'),
            API.get('/api/finance/allocation')
        ]);

        // --- 1. Stats Calculation ---
        const totalInc = analytics.trends.reduce((acc, curr) => acc + parseFloat(curr.income), 0);
        const totalExp = analytics.trends.reduce((acc, curr) => acc + parseFloat(curr.expense), 0);

        document.getElementById('total-income').innerText = `Rp ${totalInc.toLocaleString('id-ID')}`;
        document.getElementById('total-expense').innerText = `Rp ${totalExp.toLocaleString('id-ID')}`;

        const paidCount = analytics.participation.find(p => p.status === 'PAID')?.count || 0;
        const unpaidCount = analytics.participation.find(p => p.status === 'UNPAID')?.count || 0;
        const totalInvoices = parseInt(paidCount) + parseInt(unpaidCount);
        const participationPerc = totalInvoices > 0 ? Math.round((paidCount / totalInvoices) * 100) : 0;
        document.getElementById('participation-stat').innerText = `${participationPerc}%`;

        // --- 2. Cash Flow Chart ---
        const trendCtx = document.getElementById('trendChart').getContext('2d');
        new Chart(trendCtx, {
            type: 'line',
            data: {
                labels: analytics.trends.map(t => {
                    const [y, m] = t.month.split('-');
                    const names = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
                    return names[parseInt(m) - 1] + ' ' + y;
                }),
                datasets: [
                    {
                        label: 'Pemasukan',
                        data: analytics.trends.map(t => t.income),
                        borderColor: '#0070f3',
                        backgroundColor: 'rgba(0, 112, 243, 0.05)',
                        fill: true,
                        tension: 0.4,
                        borderWidth: 3,
                        pointRadius: 4,
                        pointBackgroundColor: '#fff',
                        pointBorderWidth: 2
                    },
                    {
                        label: 'Pengeluaran',
                        data: analytics.trends.map(t => t.expense),
                        borderColor: '#f43f5e',
                        backgroundColor: 'rgba(244, 63, 94, 0.05)',
                        fill: true,
                        tension: 0.4,
                        borderWidth: 3,
                        pointRadius: 4,
                        pointBackgroundColor: '#fff',
                        pointBorderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            padding: 20,
                            font: { size: 10, weight: 'bold' }
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        padding: 12,
                        backgroundColor: 'rgba(15, 23, 42, 0.9)'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { borderDash: [5, 5], color: '#f1f5f9' },
                        ticks: {
                            font: { size: 10 },
                            callback: (value) => value >= 1000000 ? (value / 1000000) + 'jt' : value.toLocaleString()
                        }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { font: { size: 10 } }
                    }
                }
            }
        });

        // --- 3. Allocation Chart ---
        if (allocation.length > 0) {
            const allocCtx = document.getElementById('allocationChart').getContext('2d');
            new Chart(allocCtx, {
                type: 'doughnut',
                data: {
                    labels: allocation.map(a => a.label),
                    datasets: [{
                        data: allocation.map(a => a.value),
                        backgroundColor: [
                            '#0070f3', '#10b981', '#f59e0b', '#8b5cf6', '#f43f5e', '#06b6d4', '#64748b'
                        ],
                        borderWidth: 0,
                        hoverOffset: 10
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '70%',
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                usePointStyle: true,
                                padding: 15,
                                font: { size: 10, weight: 'bold' }
                            }
                        }
                    }
                }
            });
        } else {
            document.getElementById('allocationChart').parentElement.innerHTML = `
                <div class="flex flex-col items-center justify-center h-full text-slate-300">
                    <i data-lucide="pie-chart" class="w-12 h-12 mb-2 opacity-20"></i>
                    <p class="text-xs italic font-medium">Belum ada data pengeluaran bulan ini.</p>
                </div>
            `;
            if (window.lucide) lucide.createIcons();
        }

    } catch (e) {
        console.error('Analytics Loading Error:', e);
    }
};
