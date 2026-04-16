import API from '../api.js';

export const SecurityContributions = async (App) => {
    document.getElementById('header-container').classList.remove('hidden');
    document.getElementById('page-title').innerText = 'Kontribusi Satpam';
    
    let currentYear = new RegExp('year=([^&]*)').exec(window.location.hash)?.[1] || new Date().getFullYear();
    let currentUserId = new RegExp('user_id=([^&]*)').exec(window.location.hash)?.[1] || null;

    const renderUI = async () => {
        const satpams = await API.get('/api/users/satpam');
        if (!currentUserId && satpams.length > 0) {
            currentUserId = satpams[0].id;
        }

        const res = await API.get(`/api/analytics/contributions?user_id=${currentUserId}&year=${currentYear}`);
        const data = res || { contributions: {}, summary: {} };

        let html = `
        <div class="max-w-7xl mx-auto pb-24 px-4 sm:px-6 space-y-8 animate-in fade-in duration-500">
            <!-- Header & Filters -->
            <div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 class="text-3xl font-black text-slate-900 tracking-tight">Grafik Kontribusi</h1>
                    <p class="text-slate-500 font-medium">Pantau konsistensi patroli satpam dalam setahun terakhir.</p>
                </div>
                
                <div class="flex flex-wrap items-center gap-3">
                    <div class="flex flex-col gap-1.5">
                        <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pilih Satpam</label>
                        <select id="user-filter" class="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all">
                            ${satpams.map(s => `<option value="${s.id}" ${s.id == currentUserId ? 'selected' : ''}>${s.full_name}</option>`).join('')}
                        </select>
                    </div>
                    
                    <div class="flex flex-col gap-1.5">
                        <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tahun</label>
                        <select id="year-filter" class="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all">
                            ${[2024, 2025, 2026].map(y => `<option value="${y}" ${y == currentYear ? 'selected' : ''}>${y}</option>`).join('')}
                        </select>
                    </div>
                </div>
            </div>

            <!-- Summary Cards -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                ${renderSummaryCard('Total Scan', data.summary.total_scans || 0, 'activity', 'brand')}
                ${renderSummaryCard('Streak Terlama', (data.summary.longest_streak || 0) + ' Hari', 'zap', 'amber')}
                ${renderSummaryCard('Streak Saat Ini', (data.summary.current_streak || 0) + ' Hari', 'flame', 'rose')}
                ${renderSummaryCard('Rekor Harian', data.summary.max_daily || 0, 'award', 'emerald')}
            </div>

            <!-- Heatmap Container -->
            <div class="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 overflow-x-auto min-w-full custom-scrollbar">
                <div class="flex items-center justify-between mb-8">
                    <h3 class="text-lg font-black text-slate-900 flex items-center gap-2">
                        <i data-lucide="calendar-days" class="w-5 h-5 text-brand-600"></i>
                        Aktivitas Patroli ${currentYear}
                    </h3>
                    <div class="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                        <span>Less</span>
                        <div class="flex gap-1">
                            <div class="w-3 h-3 rounded-sm bg-slate-100"></div>
                            <div class="w-3 h-3 rounded-sm bg-brand-100"></div>
                            <div class="w-3 h-3 rounded-sm bg-brand-300"></div>
                            <div class="w-3 h-3 rounded-sm bg-brand-500"></div>
                            <div class="w-3 h-3 rounded-sm bg-brand-700"></div>
                        </div>
                        <span>More</span>
                    </div>
                </div>

                <div class="flex gap-2">
                    <!-- Day names -->
                    <div class="flex flex-col justify-between text-[9px] font-black text-slate-300 uppercase py-6 pr-2 h-[120px]">
                        <span>Mon</span>
                        <span>Wed</span>
                        <span>Fri</span>
                    </div>
                    
                    <!-- Month labels & Grid -->
                    <div class="flex-1">
                        <div class="flex mb-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            ${renderMonthLabels(currentYear)}
                        </div>
                        <div class="grid grid-flow-col grid-rows-7 gap-1">
                            ${renderHeatmapGrid(currentYear, data.contributions)}
                        </div>
                    </div>
                </div>
                
                <p class="mt-6 text-[10px] text-center text-slate-400 font-medium">
                    Setiap kotak mewakili satu hari. Warna yang lebih gelap menandakan jumlah scan yang lebih banyak pada hari tersebut.
                </p>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <!-- Milestones Timeline (1/3) -->
                <div class="lg:order-2 space-y-6">
                    <div class="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 h-full">
                        <h3 class="text-lg font-black text-slate-900 flex items-center gap-2 mb-6">
                            <i data-lucide="trophy" class="w-5 h-5 text-amber-500"></i>
                            Milestones & Rekor
                        </h3>
                        <div class="relative space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                            ${renderMilestones(data)}
                        </div>
                    </div>
                </div>

                <!-- Punch Card & AI Insight (2/3) -->
                <div class="lg:col-span-2 lg:order-1 space-y-8">
                    <!-- Punch Card -->
                    <div class="bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
                        <div class="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                        
                        <div class="relative z-10 flex flex-col gap-8">
                            <div>
                                <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 backdrop-blur-md mb-4">
                                    <i data-lucide="clock" class="w-3 h-3 text-brand-400"></i>
                                    <span class="text-[9px] font-black uppercase tracking-widest text-slate-300">Pola Jam Kerja</span>
                                </div>
                                <h3 class="text-2xl font-black text-white tracking-tight mb-2">Punch Card Aktivitas</h3>
                                <p class="text-xs text-slate-400 font-medium leading-relaxed">
                                    Visualisasi frekuensi patroli berdasarkan hari dan jam.
                                </p>
                            </div>

                            <div class="overflow-x-auto no-scrollbar">
                                <div class="min-w-[520px]">
                                    <div class="flex ml-12 mb-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                        ${Array.from({length: 24}, (_, i) => `<div class="flex-1 text-center">${i.toString().padStart(2, '0')}</div>`).join('')}
                                    </div>
                                    <div class="space-y-2">
                                        ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, dIdx) => `
                                            <div class="flex items-center gap-2">
                                                <div class="w-10 text-[10px] font-black text-slate-500 uppercase">${day}</div>
                                                <div class="flex-1 flex justify-between items-center bg-slate-800/20 rounded-full px-2 py-1">
                                                    ${Array.from({length: 24}, (_, hIdx) => {
                                                        const count = data.punch_card?.[dIdx]?.[hIdx] || 0;
                                                        const maxInCard = Math.max(...(data.punch_card || []).flatMap(d => d)) || 1;
                                                        const sizePercent = (count / maxInCard) * 100;
                                                        const size = Math.max(2, (sizePercent / 100) * 12);
                                                        let color = 'bg-slate-700';
                                                        if (sizePercent > 75) color = 'bg-brand-400';
                                                        else if (sizePercent > 50) color = 'bg-brand-500/80';
                                                        else if (sizePercent > 25) color = 'bg-brand-600/60';
                                                        else if (count > 0) color = 'bg-brand-700/40';
                                                        return `<div class="flex-1 flex items-center justify-center group/punch relative">
                                                            <div class="rounded-full ${color} transition-all duration-500" style="width: ${size}px; height: ${size}px;"></div>
                                                            <div class="hidden group-hover/punch:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-white text-[9px] text-slate-900 font-black rounded shadow-xl z-50 whitespace-nowrap">
                                                                ${day}, ${hIdx}:00 • ${count} Scan
                                                            </div>
                                                        </div>`;
                                                    }).join('')}
                                                </div>
                                            </div>`).join('')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- AI Pattern Alert -->
                    <div class="bg-gradient-to-br from-brand-600 to-indigo-700 rounded-[2.5rem] p-8 shadow-xl text-white relative overflow-hidden group">
                        <div class="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000"></div>
                        <div class="relative z-10 flex flex-col md:flex-row items-center gap-6">
                            <div class="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0 animate-bounce-slow">
                                <i data-lucide="sparkles" class="w-8 h-8 text-white"></i>
                            </div>
                            <div>
                                <h3 class="text-xl font-black flex items-center gap-2 mb-2 uppercase tracking-tight">
                                    <i data-lucide="bot" class="w-5 h-5"></i>
                                    AI Pattern Intelligence
                                </h3>
                                <p id="ai-insight-text" class="text-sm font-medium text-brand-100 italic leading-relaxed">
                                    "${generateAIAlert(data, satpams.find(s => s.id == currentUserId)?.full_name)}"
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;

        App.container.innerHTML = html;
        if (window.lucide) lucide.createIcons();
        setupEventListeners();
    };

    const generateAIAlert = (data, name) => {
        if (!data.punch_card) return "Menunggu data untuk dianalisa...";
        
        const shortName = name.split(' ')[0];
        const alerts = [];
        
        // Pattern 1: Late night gaps
        const nightHours = [1, 2, 3, 4];
        let quietNights = [];
        const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        
        for (let d = 1; d < 6; d++) { // Mon-Fri
            let nightTotal = 0;
            nightHours.forEach(h => nightTotal += data.punch_card[d][h]);
            if (nightTotal === 0) quietNights.push(dayNames[d]);
        }

        if (quietNights.length > 2) {
            alerts.push(`AI mendeteksi Pak ${shortName} sering melewatkan patroli dini hari (jam 1 - 4) di hari ${quietNights.slice(0, 2).join(' & ')}. Disarankan briefing untuk penguatan area di jam kritis.`);
        }

        // Pattern 2: Consistency
        if (data.summary.longest_streak > 20) {
            alerts.push(`Luar biasa! Pak ${shortName} menunjukkan konsistensi tingkat tinggi dengan streak ${data.summary.longest_streak} hari. AI merekomendasikan pemberian apresiasi atau 'Guard of the Month'.`);
        } else if (data.summary.total_scans > 0 && data.summary.longest_streak < 5) {
            alerts.push(`Pola patroli Pak ${shortName} terlihat fluktuatif (tidak konsisten). AI menyarankan pengecekan apakah ada kendala teknis pada perangkat atau rute patroli.`);
        }

        // Pattern 3: Peak performance
        let maxH = 0, peakH = 0;
        for (let h = 0; h < 24; h++) {
            let hSum = 0;
            for (let d = 0; d < 7; d++) hSum += data.punch_card[d][h];
            if (hSum > maxH) { maxH = hSum; peakH = h; }
        }
        if (maxH > 0) {
            alerts.push(`Jam tersibuk Pak ${shortName} adalah pukul ${peakH.toString().padStart(2, '0')}:00. AI menyarankan untuk merotasi jam istirahat agar tetap fit di jam padat tersebut.`);
        }

        return alerts[Math.floor(Math.random() * alerts.length)] || `AI melihat pola kerja Pak ${shortName} dalam batas normal. Pertahankan kewaspadaan di setiap titik kontrol.`;
    };

    const renderMilestones = (data) => {
        const events = [];
        
        // Milestone: Current Streak
        if (data.summary.current_streak > 0) {
            events.push({
                title: 'Fokus Terjaga',
                desc: `Hari ini Pak Satpam mencapai streak <b>${data.summary.current_streak} hari</b> tanpa putus.`,
                icon: 'flame',
                color: 'rose'
            });
        }

        // Milestone: Max Daily Record
        if (data.summary.max_daily > 0) {
            events.push({
                title: 'Rekor Terpecahkan',
                desc: `Pernah mencapai performa puncak dengan <b>${data.summary.max_daily} scan</b> dalam satu hari!`,
                icon: 'zap',
                color: 'amber'
            });
        }

        // Milestone: Total Contribution
        if (data.summary.total_scans > 100) {
            events.push({
                title: 'Kontribusi Hebat',
                desc: `Telah melakukan lebih dari <b>${data.summary.total_scans} kali</b> pemindaian keamanan tahun ini.`,
                icon: 'shield',
                color: 'brand'
            });
        }

        if (events.length === 0) {
            events.push({
                title: 'Mulai Melangkah',
                desc: 'Terus tingkatkan patroli untuk membuka milestone dan rekor baru.',
                icon: 'play-circle',
                color: 'slate'
            });
        }

        return events.map(e => `
            <div class="relative pl-8 group">
                <div class="absolute left-0 top-0 w-6 h-6 rounded-lg bg-${e.color}-50 text-${e.color}-600 flex items-center justify-center z-10 group-hover:scale-110 transition-transform shadow-sm ring-4 ring-white">
                    <i data-lucide="${e.icon}" class="w-3.5 h-3.5"></i>
                </div>
                <div>
                    <h4 class="text-xs font-black text-slate-900 uppercase tracking-tight mb-1">${e.title}</h4>
                    <p class="text-[10px] text-slate-500 font-medium leading-relaxed">${e.desc}</p>
                </div>
            </div>
        `).join('');
    };

    const setupEventListeners = () => {
        document.getElementById('user-filter').onchange = (e) => {
            currentUserId = e.target.value;
            window.location.hash = `#/security-contributions?user_id=${currentUserId}&year=${currentYear}`;
            renderUI();
        };

        document.getElementById('year-filter').onchange = (e) => {
            currentYear = e.target.value;
            window.location.hash = `#/security-contributions?user_id=${currentUserId}&year=${currentYear}`;
            renderUI();
        };
    };

    const renderSummaryCard = (title, value, icon, color) => `
        <div class="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
            <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-2xl bg-${color}-50 text-${color}-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <i data-lucide="${icon}" class="w-6 h-6"></i>
                </div>
                <div>
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">${title}</p>
                    <h4 class="text-xl font-black text-slate-900">${value}</h4>
                </div>
            </div>
        </div>
    `;

    const renderMonthLabels = (year) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return months.map(m => `<div class="flex-1 text-center">${m}</div>`).join('');
    };

    const renderHeatmapGrid = (year, contributions) => {
        const start = new Date(year, 0, 1);
        const end = new Date(year, 11, 31);
        const grid = [];
        
        // Offset for the first week
        let firstDay = start.getDay(); 
        if (firstDay === 0) firstDay = 7; // Sunday to last
        
        // Empty cells for the first week
        for (let i = 1; i < firstDay; i++) {
            grid.push(`<div class="w-3 h-3 bg-transparent"></div>`);
        }

        let curr = new Date(start);
        while (curr <= end) {
            const dateStr = curr.toISOString().split('T')[0];
            const count = contributions[dateStr] || 0;
            
            let colorClass = 'bg-slate-100';
            if (count > 15) colorClass = 'bg-brand-700';
            else if (count > 10) colorClass = 'bg-brand-500';
            else if (count > 5) colorClass = 'bg-brand-300';
            else if (count > 0) colorClass = 'bg-brand-100';

            const formattedDate = curr.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            
            grid.push(`
                <div 
                    class="w-3 h-3 rounded-sm ${colorClass} transition-all hover:scale-150 hover:z-10 cursor-help relative group/cell"
                    title="${count} scan pada ${formattedDate}"
                >
                    <div class="hidden group-hover/cell:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-[10px] text-white rounded whitespace-nowrap z-50">
                        ${count} scan • ${formattedDate}
                    </div>
                </div>
            `);
            curr.setDate(curr.getDate() + 1);
        }

        return grid.join('');
    };

    renderUI();
};
