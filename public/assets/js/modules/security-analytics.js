import API from '../api.js';

export const SecurityAnalytics = async (App) => {
    document.getElementById('header-container').classList.remove('hidden');
    document.getElementById('page-title').innerText = 'Analisa Keamanan AI';
    const user = await App.getUser();

    const renderUI = async () => {
        const res = await API.get('/api/analytics/security');
        const data = res || {};

        // Safe defaults
        const score = data.score || 0;
        const totalLogs = data.total_logs || 0;
        const blindSpots = data.blind_spots || [];
        const heatmap = data.heatmap || Array(24).fill(0);
        const coverage = data.coverage || [];

        // Determine Security Level
        let level = 'Rendah';
        let levelColor = 'rose';
        if (score >= 80) { level = 'Sangat Aman'; levelColor = 'emerald'; }
        else if (score >= 60) { level = 'Cukup Aman'; levelColor = 'brand'; }
        else if (score >= 40) { level = 'Waspada'; levelColor = 'amber'; }

        let html = `
        <div class="max-w-7xl mx-auto pb-24 px-4 sm:px-6 space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <!-- AI Hero Card -->
            <div class="relative overflow-hidden rounded-[3rem] bg-slate-900 border border-slate-800 shadow-2xl p-8 md:p-12 mb-10 group">
                <div class="absolute top-0 right-0 w-[500px] h-[500px] bg-${levelColor}-500/20 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none animate-pulse"></div>
                <div class="absolute bottom-0 left-0 w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[80px] -ml-20 -mb-20 pointer-events-none"></div>

                <div class="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div class="text-center md:text-left space-y-4 max-w-2xl">
                        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 backdrop-blur-md mb-2">
                             <span class="relative flex h-2 w-2">
                                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-${levelColor}-400 opacity-75"></span>
                                <span class="relative inline-flex rounded-full h-2 w-2 bg-${levelColor}-500"></span>
                            </span>
                            <span class="text-[10px] font-black uppercase tracking-widest text-slate-300">AI Security Analyst</span>
                        </div>
                        <h1 class="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
                            Status Keamanan: <br><span class="text-transparent bg-clip-text bg-gradient-to-r from-${levelColor}-400 to-${levelColor}-200">${level}</span>
                        </h1>
                        <p class="text-sm md:text-base text-slate-400 font-medium leading-relaxed">
                            Analisis pola patroli dan cakupan wilayah dalam <span class="text-white font-bold">${data.period_days || 30} hari terakhir</span>.
                            AI mendeteksi tingkat kepatuhan dan konsistensi pengamanan.
                        </p>
                    </div>

                    <div class="relative group/score">
                        <svg class="w-40 h-40 md:w-56 md:h-56 transform -rotate-90 transition-all duration-1000 group-hover/score:scale-105" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="45" fill="none" stroke="#1e293b" stroke-width="8" />
                            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" stroke-width="8" stroke-dasharray="283" stroke-dashoffset="${283 - (283 * score / 100)}" class="text-${levelColor}-500 transition-all duration-1000 ease-out" stroke-linecap="round" />
                        </svg>
                        <div class="absolute inset-0 flex flex-col items-center justify-center text-white">
                            <span class="text-4xl md:text-5xl font-black tracking-tighter animate-in fade-in zoom-in duration-1000 delay-300">${score}</span>
                            <span class="text-[10px] font-black uppercase tracking-widest text-slate-500">Security Score</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Stats & Insights Grid -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Heatmap Chart -->
                <div class="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 flex flex-col h-full">
                    <div class="flex items-center justify-between mb-6">
                        <div>
                            <h3 class="text-lg font-black text-slate-900 flex items-center gap-2">
                                <i data-lucide="clock" class="w-5 h-5 text-brand-600"></i>
                                Heatmap Aktivitas Patroli
                            </h3>
                            <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Distribusi Waktu Patroli (24 Jam)</p>
                        </div>
                    </div>
                    <div class="flex-1 relative w-full h-64 md:h-80">
                        <canvas id="heatmapChart"></canvas>
                    </div>
                </div>

                <!-- Blind Spots & Recommendation -->
                <div class="space-y-6">
                     <!-- Blind Spots -->
                    <div class="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8">
                        <h3 class="text-lg font-black text-slate-900 flex items-center gap-2 mb-6">
                            <i data-lucide="alert-triangle" class="w-5 h-5 text-amber-500"></i>
                            Titik Rawan (Blind Spots)
                        </h3>
                        <div class="space-y-4">
                            ${blindSpots.length > 0 ? blindSpots.map(b => `
                                <div class="flex items-center justify-between p-4 bg-amber-50 rounded-2xl border border-amber-100 group hover:bg-amber-100 transition-colors">
                                    <div class="flex items-center gap-3">
                                        <div class="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-amber-600 shadow-sm">
                                            <i data-lucide="map-pin" class="w-5 h-5"></i>
                                        </div>
                                        <div>
                                            <p class="text-xs font-black text-slate-900 uppercase tracking-tight">${b.name}</p>
                                            <p class="text-[10px] text-amber-700 font-bold">Hanya ${b.visits}x dikunjungi</p>
                                        </div>
                                    </div>
                                </div>
                            `).join('') : `
                                <div class="text-center py-6">
                                    <div class="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mx-auto mb-3">
                                        <i data-lucide="check-circle" class="w-6 h-6"></i>
                                    </div>
                                    <p class="text-xs font-bold text-slate-400">Tidak ada titik rawan terdeteksi.</p>
                                </div>
                            `}
                        </div>
                    </div>

                    <!-- AI Insights Text -->
                    <div class="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2.5rem] p-8 shadow-xl text-white relative overflow-hidden">
                        <i data-lucide="sparkles" class="absolute top-4 right-4 text-brand-400 opacity-20 w-12 h-12"></i>
                        <h3 class="text-lg font-black flex items-center gap-2 mb-4">
                            <i data-lucide="bot" class="w-5 h-5 text-brand-400"></i>
                            Rekomendasi AI
                        </h3>
                        <p class="text-xs md:text-sm text-slate-300 leading-relaxed font-medium italic">
                            "${generateInsight(score, blindSpots, heatmap)}"
                        </p>
                    </div>
                </div>
            </div>

            <!-- Coverage Details -->
            <div class="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 animate-in slide-in-from-bottom-8 duration-700">
                <div class="flex items-center justify-between mb-8">
                     <div>
                        <h3 class="text-lg font-black text-slate-900 flex items-center gap-2">
                            <i data-lucide="target" class="w-5 h-5 text-emerald-600"></i>
                            Detail Cakupan Wilayah
                        </h3>
                        <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Total ${totalLogs} Scan Log Terverifikasi</p>
                    </div>
                </div>
                
                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    ${coverage.map((c, i) => {
            const percentage = totalLogs > 0 ? Math.round((c.visits / totalLogs) * 100) : 0;
            return `
                        <div class="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-brand-200 hover:shadow-lg transition-all group">
                            <div class="flex justify-between items-start mb-3">
                                <span class="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-400 font-black text-xs border border-slate-100 shadow-sm group-hover:text-brand-600 group-hover:border-brand-100">#${i + 1}</span>
                                <span class="text-[10px] font-black text-slate-300 uppercase tracking-widest">${percentage}% Traffic</span>
                            </div>
                            <h4 class="text-sm font-black text-slate-900 mb-1 truncate">${c.name}</h4>
                            <div class="flex items-end gap-2">
                                <span class="text-2xl font-black text-brand-600 leading-none">${c.visits}</span>
                                <span class="text-[10px] font-bold text-slate-400 mb-1">Kunjungan</span>
                            </div>
                            <div class="w-full bg-slate-200 h-1.5 rounded-full mt-3 overflow-hidden">
                                <div class="bg-brand-500 h-full rounded-full" style="width: ${percentage}%"></div>
                            </div>
                        </div>
                    `}).join('')}
                </div>
            </div>
        </div>
        `;

        App.container.innerHTML = html;
        if (window.lucide) lucide.createIcons();

        // Render Charts
        renderHeatmap(heatmap);
    };

    const generateInsight = (score, blindSpots, heatmap) => {
        if (score > 80) return "Pertahanan solid, Pak! Satpam sangat rajin dan konsisten. Pertahankan ritme ini, mungkin bisa diberikan bonus insentif kerajinan.";
        if (score > 50) return "Cukup baik, tapi ada beberapa celah. Fokuskan patroli ke area blind spot yang terdeteksi agar tidak ada kesempatan bagi maling.";
        return "Perlu evaluasi mendesak! Frekuensi patroli sangat rendah dan banyak titik buta. Segera panggil kepala keamanan untuk briefing ulang.";
    };

    const renderHeatmap = (data) => {
        const ctx = document.getElementById('heatmapChart');
        if (!ctx) return;

        // Gradient
        const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(79, 70, 229, 0.5)'); // Brand 600
        gradient.addColorStop(1, 'rgba(79, 70, 229, 0.0)');

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`),
                datasets: [{
                    label: 'Aktivitas Scan',
                    data: data,
                    backgroundColor: gradient,
                    borderRadius: 8,
                    borderSkipped: false,
                    barThickness: 'flex',
                    maxBarThickness: 24
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#1e293b',
                        padding: 12,
                        titleFont: { family: 'Inter', size: 12, weight: 'bold' },
                        bodyFont: { family: 'Inter', size: 12 },
                        cornerRadius: 12,
                        displayColors: false,
                        callbacks: {
                            title: (tooltipItems) => `Jam ${tooltipItems[0].label}`,
                            label: (tooltipItem) => `${tooltipItem.raw} Scan Aktivitas`
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: '#f1f5f9', borderDash: [5, 5] },
                        ticks: { font: { family: 'Inter', size: 10, weight: 'bold' }, color: '#94a3b8' },
                        border: { display: false }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { font: { family: 'Inter', size: 9, weight: 'bold' }, color: '#94a3b8', maxRotation: 0, autoSkip: true, maxTicksLimit: 12 },
                        border: { display: false }
                    }
                }
            }
        });
    };

    renderUI();
};
