import API from '../api.js';
import Sidebar from '../sidebar.js';

export const Leaderboard = async (App) => {
    document.getElementById('header-container').classList.remove('hidden');
    document.getElementById('page-title').innerText = 'Leaderboard';
    const user = await App.getUser();
    await Sidebar.render(user ? user.role : null);

    const getRankIdentity = (points) => {
        if (points >= 500) return { label: 'Legendary Guardian', color: 'text-indigo-500', bg: 'bg-indigo-50/50', border: 'border-indigo-100', icon: 'crown', shadow: 'shadow-indigo-200/50' };
        if (points >= 300) return { label: 'Elite Protector', color: 'text-brand-500', bg: 'bg-brand-50/50', border: 'border-brand-100', icon: 'shield-check', shadow: 'shadow-brand-200/50' };
        if (points >= 150) return { label: 'Diligent Sentinel', color: 'text-emerald-500', bg: 'bg-emerald-50/50', border: 'border-emerald-100', icon: 'shield', shadow: 'shadow-emerald-200/50' };
        return { label: 'Active Guard', color: 'text-slate-500', bg: 'bg-slate-50/50', border: 'border-slate-100', icon: 'user', shadow: 'shadow-slate-200/50' };
    };

    const render = async () => {
        let leaderboard = await API.get('/api/leaderboard');
        const settings = await API.get('/api/settings');

        if (!Array.isArray(leaderboard)) {
            console.error('Leaderboard data is not an array:', leaderboard);
            App.container.innerHTML = `
                <div class="flex flex-col items-center justify-center p-20 text-center">
                    <div class="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center text-red-500 mb-6 transition-transform hover:scale-110 duration-500">
                        <i data-lucide="alert-circle" class="w-10 h-10"></i>
                    </div>
                    <h3 class="text-2xl font-black text-slate-900 mb-2">Gagal Memuat Data</h3>
                    <p class="text-slate-500 max-w-xs mx-auto">Terjadi kesalahan saat mengambil data peringkat. Silakan coba lagi nanti.</p>
                    <button onclick="window.location.reload()" class="mt-8 px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-brand-600 transition-all active:scale-95 shadow-lg shadow-slate-200">Reload Halaman</button>
                </div>
            `;
            if (window.lucide) lucide.createIcons();
            return;
        }

        // Split Top 3 and Others
        const top3 = leaderboard.slice(0, 3);
        const others = leaderboard.slice(3);

        let html = `
        <div class="max-w-6xl mx-auto pb-24 px-4 sm:px-6">
            <!-- Header Section -->
            <div class="text-center mb-16 animate-in fade-in slide-in-from-top-8 duration-1000">
                <div class="inline-flex items-center space-x-2 px-4 py-2 bg-brand-50 rounded-full border border-brand-100 mb-6">
                    <span class="relative flex h-2 w-2">
                        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                        <span class="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
                    </span>
                    <span class="text-[10px] font-black text-brand-600 uppercase tracking-widest">Update Real-time</span>
                </div>
                <h1 class="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter mb-4 leading-none">Guardians <span class="text-brand-600">RT</span></h1>
                <p class="text-slate-500 font-medium max-w-lg mx-auto leading-relaxed text-sm md:text-base">Apresiasi khusus untuk pahlawan lingkungan yang berdedikasi menjaga keamanan kita 24/7.</p>
            </div>

            <!-- Podium / Top 3 -->
            <div class="flex flex-col md:flex-row items-end justify-center gap-6 mb-20">
                ${top3.map((p, i) => {
            const rank = getRankIdentity(p.total_points);
            // Order logic for podium: [2, 1, 3] on desktop
            const order = i === 0 ? 'order-1 md:order-2' : (i === 1 ? 'order-2 md:order-1' : 'order-3');
            const isWinner = i === 0;

            return `
                    <div class="${order} w-full md:w-1/3 group animate-in fade-in slide-in-from-bottom-${isWinner ? '12' : '8'} duration-700 delay-${i * 200}">
                        <div class="relative bg-white/70 backdrop-blur-xl p-8 rounded-[3rem] border ${isWinner ? 'border-amber-200 ring-2 ring-amber-100 shadow-2xl shadow-amber-200/50' : 'border-slate-100 shadow-xl'} transition-all duration-500 group-hover:-translate-y-4">
                            
                            <!-- Large Background Icon -->
                            <i data-lucide="${rank.icon}" class="w-32 h-32 absolute -right-4 -bottom-4 text-slate-50 opacity-10 group-hover:scale-110 transition-transform duration-700"></i>

                            <div class="relative z-10">
                                <div class="flex flex-col items-center mb-6">
                                    <div class="relative mb-4">
                                        <div class="w-20 h-20 rounded-[2rem] bg-gradient-to-tr ${isWinner ? 'from-amber-400 to-yellow-300 shadow-amber-200' : 'from-slate-200 to-slate-100 shadow-slate-100'} shadow-lg flex items-center justify-center text-white ring-4 ring-white">
                                            ${isWinner ? '<i data-lucide="trophy" class="w-10 h-10"></i>' : `<span class="text-2xl font-black ${i === 1 ? 'text-slate-400' : 'text-orange-400'}">${i + 1}</span>`}
                                        </div>
                                        ${isWinner ? `<div class="absolute -top-3 -right-3 w-8 h-8 bg-amber-400 rounded-full border-4 border-white flex items-center justify-center animate-bounce shadow-sm">
                                            <i data-lucide="crown" class="w-4 h-4 text-white"></i>
                                        </div>` : ''}
                                    </div>
                                    <h3 class="text-xl font-black text-slate-900 tracking-tight text-center leading-tight mb-1">${p.full_name}</h3>
                                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">@${p.username}</span>
                                </div>

                                <div class="p-4 bg-slate-50/50 rounded-3xl border border-slate-100 mb-6 group-hover:bg-brand-50 group-hover:border-brand-100 transition-colors">
                                    <div class="flex items-center justify-center gap-2 mb-1">
                                        <span class="text-4xl font-black text-slate-900 group-hover:text-brand-600 transition-colors">${parseInt(p.total_points).toLocaleString()}</span>
                                        <span class="text-[10px] font-black text-slate-400 uppercase tracking-tighter">pts</span>
                                    </div>
                                    
                                    <div class="flex justify-between items-center pt-3 border-t border-slate-200/50">
                                        <div class="text-center flex-1 border-r border-slate-200/50">
                                            <p class="text-[11px] font-black text-emerald-500">+${p.attendance_points}</p>
                                            <p class="text-[7px] text-slate-400 font-bold uppercase tracking-widest">Absen</p>
                                        </div>
                                        <div class="text-center flex-1">
                                            <p class="text-[11px] font-black text-brand-500">+${p.patrol_points}</p>
                                            <p class="text-[7px] text-slate-400 font-bold uppercase tracking-widest">Patroli</p>
                                        </div>
                                    </div>
                                </div>

                                <div class="flex justify-center">
                                    <span class="px-4 py-1.5 ${rank.bg} ${rank.color} ${rank.border} border text-[8px] font-black rounded-full uppercase tracking-widest shadow-sm">${rank.label}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    `;
        }).join('')}
            </div>

            <!-- List Section -->
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                
                <!-- Detailed Rankings -->
                <div class="lg:col-span-8">
                    <div class="bg-white/70 backdrop-blur-xl rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500">
                        <div class="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                            <div>
                                <h3 class="text-xl font-black text-slate-900 tracking-tight">Active Guards</h3>
                                <div class="flex items-center gap-2 mt-1">
                                    <div class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                    <p class="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none">Peringkat ${others.length + top3.length} Petugas Terdaftar</p>
                                </div>
                            </div>
                            <div class="flex items-center gap-2">
                                <div class="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-slate-400 shadow-sm">
                                    <i data-lucide="filter" class="w-4 h-4"></i>
                                </div>
                            </div>
                        </div>

                        <div class="overflow-x-auto">
                            <table class="w-full">
                                <thead>
                                    <tr class="text-left">
                                        <th class="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Rank</th>
                                        <th class="px-4 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Identitas</th>
                                        <th class="px-4 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Rekap Aktifitas</th>
                                        <th class="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right whitespace-nowrap">Total Poin</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-slate-50">
                                    ${others.map((p, i) => {
            const rank = getRankIdentity(p.total_points);
            return `
                                        <tr class="group hover:bg-slate-50/50 transition-all duration-300">
                                            <td class="px-8 py-6">
                                                <div class="w-8 h-8 rounded-xl bg-slate-100 text-slate-400 text-xs font-black flex items-center justify-center group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors">
                                                    #${i + 4}
                                                </div>
                                            </td>
                                            <td class="px-4 py-6 whitespace-nowrap">
                                                <div class="flex items-center">
                                                    <div class="w-12 h-12 rounded-[1.2rem] bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mr-4 font-black text-lg group-hover:rotate-6 transition-transform shadow-sm">
                                                        ${p.full_name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p class="text-sm font-black text-slate-900 group-hover:text-brand-600 transition-colors">${p.full_name}</p>
                                                        <div class="flex items-center gap-1.5 mt-0.5">
                                                            <i data-lucide="${rank.icon}" class="w-3 h-3 ${rank.color}"></i>
                                                            <span class="text-[9px] font-black ${rank.color} uppercase tracking-widest">${rank.label}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td class="px-4 py-6">
                                                <div class="flex justify-center gap-2">
                                                    <div class="flex flex-col items-center px-4 py-2 bg-emerald-50/30 rounded-2xl border border-emerald-100/30 min-w-[70px]">
                                                        <span class="text-sm font-black text-emerald-600">${p.total_attendance}</span>
                                                        <span class="text-[7px] font-bold text-slate-400 uppercase tracking-tighter">Hari</span>
                                                    </div>
                                                    <div class="flex flex-col items-center px-4 py-2 bg-brand-50/30 rounded-2xl border border-brand-100/30 min-w-[70px]">
                                                        <span class="text-sm font-black text-brand-600">${p.total_patrols}</span>
                                                        <span class="text-[7px] font-bold text-slate-400 uppercase tracking-tighter">Scan</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td class="px-8 py-6 text-right whitespace-nowrap">
                                                <div class="flex flex-col items-end">
                                                    <div class="flex items-baseline gap-1">
                                                        <span class="text-lg font-black text-slate-900">${parseInt(p.total_points).toLocaleString()}</span>
                                                        <span class="text-[9px] font-black text-slate-400 uppercase">pts</span>
                                                    </div>
                                                    <div class="flex gap-2 mt-1">
                                                        <span class="text-[7px] font-black text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded uppercase">+${p.attendance_points}</span>
                                                        <span class="text-[7px] font-black text-brand-500 bg-brand-50 px-1.5 py-0.5 rounded uppercase">+${p.patrol_points}</span>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                        `;
        }).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- Right Info Grid -->
                <div class="lg:col-span-4 space-y-8 animate-in fade-in slide-in-from-right-12 duration-1000 delay-700">
                    
                    <!-- Scoring Info Card -->
                    <div class="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
                        <div class="absolute -right-10 -top-10 w-40 h-40 bg-brand-500 opacity-10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
                        
                        <div class="relative z-10">
                            <h4 class="text-xl font-black mb-6 uppercase tracking-tighter flex items-center">
                                <i data-lucide="info" class="w-6 h-6 mr-3 text-brand-400"></i>
                                Sistem Skor
                            </h4>
                            
                            <div class="space-y-6">
                                <div class="p-5 bg-white/5 rounded-3xl border border-white/5 group-hover:bg-white/10 transition-colors">
                                    <div class="flex items-center gap-3 mb-2">
                                        <div class="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                                            <i data-lucide="calendar-check" class="w-4 h-4"></i>
                                        </div>
                                        <span class="text-xs font-black uppercase tracking-widest text-emerald-400">Konsistensi</span>
                                    </div>
                                    <p class="text-sm text-slate-400 font-medium leading-relaxed">Dapatkan <span class="text-white font-bold">+10 Poin</span> setiap kali absen masuk tepat waktu sesuai jadwal shift.</p>
                                </div>

                                <div class="p-5 bg-white/5 rounded-3xl border border-white/5 group-hover:bg-white/10 transition-colors">
                                    <div class="flex items-center gap-3 mb-2">
                                        <div class="w-8 h-8 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center">
                                            <i data-lucide="activity" class="w-4 h-4"></i>
                                        </div>
                                        <span class="text-xs font-black uppercase tracking-widest text-brand-400">Mobilitas</span>
                                    </div>
                                    <p class="text-sm text-slate-400 font-medium leading-relaxed">Dapatkan <span class="text-white font-bold">+2 Poin</span> untuk setiap titik checkpoint yang berhasil discan saat patroli.</p>
                                    <div class="mt-3 bg-white/5 p-3 rounded-xl border border-white/5 space-y-1">
                                        <p class="text-[10px] text-slate-500 font-medium flex justify-between">
                                            <span>Cooldown Scan:</span>
                                            <span class="text-white font-bold">${settings?.patrol_scan_cooldown || 60} Menit</span>
                                        </p>
                                        <p class="text-[10px] text-slate-500 font-medium flex justify-between">
                                            <span>Max Poin Harian:</span>
                                            <span class="text-white font-bold">${settings?.patrol_max_points_daily || 20} Poin</span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div class="mt-10 p-4 bg-brand-500 rounded-2xl flex items-center gap-4 text-white shadow-lg shadow-brand-500/20">
                                <div class="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                    <i data-lucide="gift" class="w-5 h-5"></i>
                                </div>
                                <div>
                                    <p class="text-[10px] font-black uppercase tracking-widest leading-none">Papan Hadiah</p>
                                    <p class="text-xs font-medium">Rank 1 mendapatkan reward kas RT!</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Motivation Card -->
                    <div class="bg-gradient-to-br from-brand-600 to-brand-800 p-8 rounded-[3rem] text-white shadow-xl shadow-brand-600/20 relative overflow-hidden group">
                        <i data-lucide="sparkles" class="w-32 h-32 absolute -left-8 -bottom-8 text-white/10 group-hover:rotate-12 transition-transform duration-700"></i>
                        <p class="text-lg font-black leading-tight italic relative z-10">"Keamanan bukan segalanya, tapi tanpa keamanan segalanya bukan apa-apa."</p>
                    </div>
                </div>
            </div>
        </div>
        `;

        App.container.innerHTML = html;
        if (window.lucide) lucide.createIcons();
    };

    render();
};
