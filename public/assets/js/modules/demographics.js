import API from '../api.js';

export const Demographics = async (ctx) => {
    ctx.container.innerHTML = `
        <div class="p-4 md:p-8 max-w-7xl mx-auto pb-24 md:pb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <!-- Header Section -->
            <div class="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div class="relative">
                    <div class="absolute -left-4 top-1/2 -translate-y-1/2 w-1 h-12 bg-brand-600 rounded-full"></div>
                    <h1 class="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">AI Insight <span class="text-brand-600 italic">Demografi</span></h1>
                    <p class="text-slate-400 text-[10px] font-black mt-2 uppercase tracking-[0.3em]">Advanced Community Profiling Engine</p>
                </div>
                <div class="flex items-center gap-3 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100">
                    <button id="btn-refresh-demo" class="group flex items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-brand-50 rounded-xl text-slate-600 hover:text-brand-600 transition-all font-bold text-xs uppercase tracking-widest">
                        <i data-lucide="refresh-cw" class="w-4 h-4 group-hover:rotate-180 transition-transform duration-500"></i>
                        <span>Sync Data</span>
                    </button>
                </div>
            </div>

            <!-- AI Premium Hero Box -->
            <div class="mb-10 group relative rounded-[3rem] p-1 md:p-1.5 bg-gradient-to-tr from-brand-600 via-indigo-600 to-brand-400 shadow-2xl shadow-brand-500/20 overflow-hidden">
                <div class="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <!-- Animated Blobs -->
                <div class="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-white/20 rounded-full blur-[80px] animate-pulse"></div>
                <div class="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-indigo-400/20 rounded-full blur-[80px] animate-pulse delay-700"></div>

                <div class="relative bg-white/5 backdrop-blur-xl rounded-[2.8rem] p-8 md:p-12 border border-white/20">
                    <div class="flex flex-col md:flex-row gap-8 items-start">
                        <div class="flex-shrink-0 relative">
                            <div class="w-20 h-20 md:w-24 md:h-24 rounded-[2rem] bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-xl">
                                <i data-lucide="sparkles" class="w-10 h-10 md:w-12 md:h-12 text-white animate-bounce-slow"></i>
                            </div>
                            <div class="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-emerald-400 border-4 border-white/10 flex items-center justify-center shadow-lg">
                                <div class="w-2 h-2 bg-white rounded-full animate-ping"></div>
                            </div>
                        </div>
                        <div class="flex-1 text-white">
                            <div class="flex items-center gap-3 mb-4">
                                <span class="px-3 py-1 bg-white/10 border border-white/20 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">Asisten AI Pak RT</span>
                                <div class="h-1 w-12 bg-white/20 rounded-full"></div>
                            </div>
                            <h2 class="text-2xl md:text-3xl font-black mb-6 tracking-tight leading-tight">Selamat Siang, <br class="md:hidden">Pak RT! Berikut Analisa Saya...</h2>
                            <div id="ai-narration" class="text-base md:text-lg font-medium leading-relaxed max-w-4xl opacity-90">
                                <div class="flex gap-3 items-center text-white/60 animate-pulse">
                                    <div class="flex gap-1">
                                        <span class="w-1.5 h-1.5 rounded-full bg-white opacity-40 animate-bounce"></span>
                                        <span class="w-1.5 h-1.5 rounded-full bg-white opacity-70 animate-bounce [animation-delay:0.2s]"></span>
                                        <span class="w-1.5 h-1.5 rounded-full bg-white animate-bounce [animation-delay:0.4s]"></span>
                                    </div>
                                    <span class="text-sm font-black uppercase tracking-widest">Membedah algoritma kependudukan bapak...</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Quick Stats Row -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div class="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 flex items-center gap-5 group hover:-translate-y-1 transition-all duration-300">
                    <div class="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                        <i data-lucide="users" class="w-7 h-7"></i>
                    </div>
                    <div>
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Total Warga</p>
                        <h4 id="stat-total" class="text-2xl font-black text-slate-900 tracking-tighter">0 <span class="text-xs font-bold text-slate-300 ml-1">JIWA</span></h4>
                    </div>
                </div>
                <div class="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 flex items-center gap-5 group hover:-translate-y-1 transition-all duration-300">
                    <div class="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                        <i data-lucide="arrow-up-right" class="w-7 h-7"></i>
                    </div>
                    <div>
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Produktivitas</p>
                        <h4 id="stat-productive" class="text-2xl font-black text-slate-900 tracking-tighter">0 <span class="text-xs font-bold text-slate-300 ml-1">PERSEN</span></h4>
                    </div>
                </div>
                <div class="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 flex items-center gap-5 group hover:-translate-y-1 transition-all duration-300">
                    <div class="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                        <i data-lucide="briefcase" class="w-7 h-7"></i>
                    </div>
                    <div>
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Top Profesi</p>
                        <h4 id="stat-job" class="text-base font-black text-slate-900 tracking-tight leading-none truncate max-w-[150px] uppercase">N/A</h4>
                    </div>
                </div>
            </div>

            <!-- Visualization Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <!-- Age Distribution -->
                <div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col hover:shadow-2xl hover:shadow-brand-100/50 transition-all duration-500">
                    <div class="flex justify-between items-start mb-8">
                        <div>
                            <h3 class="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                                <span class="w-2 h-2 bg-brand-500 rounded-full animate-ping"></span>
                                Komposisi Usia
                            </h3>
                            <p class="text-[9px] font-bold text-slate-400 mt-1 uppercase">Berdasarkan data Tahun Lahir</p>
                        </div>
                        <i data-lucide="bar-chart" class="text-slate-200 w-8 h-8"></i>
                    </div>
                    <div class="h-[280px] relative mt-auto">
                        <canvas id="ageChart"></canvas>
                    </div>
                </div>

                <!-- Gender Distribution -->
                <div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col hover:shadow-2xl hover:shadow-emerald-100/50 transition-all duration-500">
                    <div class="flex justify-between items-start mb-8">
                        <div>
                            <h3 class="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                                <span class="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
                                Proporsi Gender
                            </h3>
                            <p class="text-[9px] font-bold text-slate-400 mt-1 uppercase">Laki-laki vs Perempuan</p>
                        </div>
                        <i data-lucide="pie-chart" class="text-slate-200 w-8 h-8"></i>
                    </div>
                    <div class="h-[280px] relative mt-auto px-4">
                        <canvas id="genderChart"></canvas>
                    </div>
                </div>

                <!-- Occupation Distribution -->
                <div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col hover:shadow-2xl hover:shadow-amber-100/50 transition-all duration-500 md:col-span-2 lg:col-span-1">
                    <div class="flex justify-between items-start mb-8">
                        <div>
                            <h3 class="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                                <span class="w-2 h-2 bg-amber-500 rounded-full animate-ping"></span>
                                Sektor Pekerjaan
                            </h3>
                            <p class="text-[9px] font-bold text-slate-400 mt-1 uppercase">Top 5 Jenis Profesi Warga</p>
                        </div>
                        <i data-lucide="layers" class="text-slate-200 w-8 h-8"></i>
                    </div>
                    <div class="h-[280px] relative mt-auto">
                        <canvas id="jobChart"></canvas>
                    </div>
                </div>
            </div>
        </div>
        <style>
            @keyframes bounce-slow {
                0%, 100% { transform: translateY(-5%); animation-timing-function: cubic-bezier(0.8, 0, 1, 1); }
                50% { transform: translateY(0); animation-timing-function: cubic-bezier(0, 0, 0.2, 1); }
            }
            .animate-bounce-slow { animation: bounce-slow 3s infinite; }
        </style>
    `;

    if (window.lucide) lucide.createIcons();

    // Chart.js Default Configs for Premium Look
    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.font.weight = '700';
    Chart.defaults.color = '#94a3b8';

    const renderCharts = async () => {
        try {
            const data = await API.get('/api/analytics/demographics');
            if (!data) return;

            // Header Stats Enrichment
            document.getElementById('stat-total').innerHTML = `${data.total} <span class="text-xs font-bold text-slate-300 ml-1">JIWA</span>`;

            const productiveVal = data.age.find(a => a.label === 'Dewasa' || a.label === 'Remaja/Pemuda')?.value || 0;
            const productivePercent = data.total > 0 ? Math.round((productiveVal / data.total) * 100) : 0;
            document.getElementById('stat-productive').innerHTML = `${productivePercent} <span class="text-xs font-bold text-slate-300 ml-1">PERSEN</span>`;

            const topJob = data.occupation[0]?.label || 'Not Set';
            document.getElementById('stat-job').innerText = topJob;

            // 1. Age Chart (Bar) - Redesigned
            const ageCtx = document.getElementById('ageChart').getContext('2d');
            new Chart(ageCtx, {
                type: 'bar',
                data: {
                    labels: data.age.map(a => a.label),
                    datasets: [{
                        label: 'Jiwa',
                        data: data.age.map(a => a.value),
                        backgroundColor: (context) => {
                            const chart = context.chart;
                            const { ctx, chartArea } = chart;
                            if (!chartArea) return null;
                            const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                            gradient.addColorStop(0, '#0070f3');
                            gradient.addColorStop(1, '#60a5fa');
                            return gradient;
                        },
                        borderRadius: 20,
                        barThickness: 'flex',
                        maxBarThickness: 40
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: { backgroundColor: '#1e293b', titleFont: { size: 12 }, bodyFont: { size: 12 }, padding: 12, borderRadius: 12 }
                    },
                    scales: {
                        y: { beginAtZero: true, grid: { borderDash: [5, 5], color: '#f1f5f9' }, ticks: { padding: 10 } },
                        x: { grid: { display: false }, ticks: { padding: 10, font: { size: 10 } } }
                    }
                }
            });

            // 2. Gender Chart (Doughnut) - Redesigned
            const genderCtx = document.getElementById('genderChart').getContext('2d');
            new Chart(genderCtx, {
                type: 'doughnut',
                data: {
                    labels: data.gender.map(g => g.label),
                    datasets: [{
                        data: data.gender.map(g => g.value),
                        backgroundColor: ['#10b981', '#f43f5e'],
                        hoverBackgroundColor: ['#059669', '#e11d48'],
                        borderWidth: 8,
                        borderColor: '#ffffff',
                        hoverOffset: 20
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    layout: { padding: 20 },
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: { usePointStyle: true, pointStyle: 'circle', padding: 20, font: { size: 11, weight: '900' }, color: '#475569' }
                        },
                        tooltip: { backgroundColor: '#1e293b', padding: 12, borderRadius: 12 }
                    },
                    cutout: '75%'
                }
            });

            // 3. Job Chart (Horizontal Bar) - Redesigned
            const jobCtx = document.getElementById('jobChart').getContext('2d');
            new Chart(jobCtx, {
                type: 'bar',
                data: {
                    labels: data.occupation.map(j => j.label),
                    datasets: [{
                        label: 'Jiwa',
                        data: data.occupation.map(j => j.value),
                        backgroundColor: '#f59e0b',
                        borderRadius: 12,
                        barThickness: 24
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: { backgroundColor: '#1e293b', padding: 12, borderRadius: 12 }
                    },
                    scales: {
                        x: { beginAtZero: true, grid: { borderDash: [5, 5], color: '#f1f5f9' } },
                        y: { grid: { display: false }, ticks: { font: { size: 10 } } }
                    }
                }
            });

            generateAINarration(data);

        } catch (e) {
            console.error('Demographics Chart Error:', e);
        }
    };

    const generateAINarration = (data) => {
        const narrationEl = document.getElementById('ai-narration');
        if (data.total === 0) {
            narrationEl.innerHTML = `
                <div class="flex items-center gap-3 text-white/70">
                    <i data-lucide="alert-circle" class="w-5 h-5"></i>
                    <span>Belum ada data warga lengkap untuk dianalisis pak. Silakan lengkapi profil warga di menu Data Warga.</span>
                </div>
            `;
            if (window.lucide) lucide.createIcons();
            return;
        }

        const topAge = [...data.age].sort((a, b) => b.value - a.value)[0];
        const topJob = [...data.occupation].sort((a, b) => b.value - a.value)[0];
        const males = data.gender.find(g => g.label === 'Laki-laki')?.value || 0;
        const females = data.gender.find(g => g.label === 'Perempuan')?.value || 0;
        const sexRatio = females > 0 ? (males / females) : (males > 0 ? 2 : 1);

        let txt = `Berdasarkan data kependudukan terbaru, wilayah bapak didominasi oleh kelompok <span class="bg-white/20 px-2 py-0.5 rounded-lg text-white font-black blur-none">${topAge.label}</span>. `;

        if (topAge.label === 'Dewasa' || topAge.label === 'Remaja/Pemuda') {
            txt += `Kabar baik pak! Ini menunjukkan lingkungan bapak memiliki kekayaan <span class="text-emerald-300 font-extrabold italic">SDM Produktif</span> yang sangat melimpah. `;
        }

        if (topJob) {
            txt += `Sektor profesi terbesar adalah <span class="text-amber-200 font-black underline underline-offset-4 decoration-white/30">${topJob.label}</span>. `;
        }

        if (sexRatio > 1.25) {
            txt += `Populasi pria cukup dominan, sangat ideal untuk mengoptimalkan <span class="text-white font-black">Sistem Keamanan Mandiri</span> atau kerja bakti lingkungan pak. `;
        } else if (sexRatio < 0.75) {
            txt += `Populasi wanita lebih menonjol, bapak bisa fokus memperkuat program <span class="text-rose-200 font-black">Ekonomi Kreatif</span> atau PKK warga. `;
        } else {
            txt += `Keseimbangan gender di wilayah bapak sangat baik, memudahkan koordinasi segala jenis kegiatan sosial RT. `;
        }

        txt += `
            <div class="mt-8 pt-8 border-t border-white/10 flex items-start gap-4">
                <div class="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0 border border-white/10">
                    <i data-lucide="lightbulb" class="w-5 h-5 text-amber-300"></i>
                </div>
                <div>
                    <h4 class="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-1">Rekomendasi Cerdas:</h4>
                    <p class="text-sm font-bold leading-snug">Manfaatkan besarnya porsi <span class="italic text-brand-300">${topAge.label}</span> untuk inisiatif digitalisasi RT atau program inovasi lainnya pak! Data tidak pernah berbohong.</p>
                </div>
            </div>
        `;

        narrationEl.innerHTML = txt;
        if (window.lucide) lucide.createIcons();
    };

    renderCharts();
    document.getElementById('btn-refresh-demo').onclick = () => Demographics(ctx);
};
