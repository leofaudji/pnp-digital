import API from '../api.js';

export const PatrolStatus = async (App) => {
    document.getElementById('header-container').classList.remove('hidden');
    document.getElementById('page-title').innerText = 'Status Patroli';
    const user = await App.getUser();

    const render = async () => {
        const dashboard = await API.get('/api/dashboard');
        const checkpoints = dashboard.patrol_status || [];

        let html = `
        <div class="max-w-4xl mx-auto pb-24 px-4 sm:px-6">
            <!-- Header Status -->
            <div class="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div class="flex items-center space-x-4">
                        <div class="w-12 h-12 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600 shadow-sm shadow-brand-100">
                            <i data-lucide="shield-check" class="w-6 h-6"></i>
                        </div>
                        <div>
                            <h2 class="text-xl font-black text-slate-900 leading-none">Keamanan Real-time</h2>
                            <p class="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Status Patroli Wilayah</p>
                        </div>
                    </div>
                    <div class="flex flex-col items-end">
                        <div class="flex items-center space-x-2 px-4 py-2 bg-emerald-50 rounded-full border border-emerald-100 mb-2">
                            <span class="relative flex h-2 w-2">
                                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span class="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Live Monitoring</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="text-[10px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-lg uppercase tracking-widest border border-indigo-100">Shift ${dashboard.current_shift?.name || '-'}</span>
                            <span class="text-[10px] font-bold text-slate-500">${new Date(dashboard.current_shift?.start).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} - ${new Date(dashboard.current_shift?.end).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Checkpoint List -->
            <div class="space-y-4">
                ${checkpoints.map((cp, i) => {
            const isScanned = cp.status === 'scanned';
            const delay = (i % 10) * 100;
            return `
                    <div class="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm group hover:-translate-y-1 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-${delay}">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center space-x-5">
                                <div class="w-14 h-14 rounded-3xl ${isScanned ? 'bg-emerald-50 text-emerald-500 ring-4 ring-emerald-50/50' : 'bg-slate-50 text-slate-300'} flex items-center justify-center transition-all duration-500 group-hover:scale-110">
                                    <i data-lucide="${isScanned ? 'check-circle' : 'circle'}" class="w-6 h-6"></i>
                                </div>
                                <div>
                                    <h4 class="text-base font-black text-slate-900 group-hover:text-brand-600 transition-colors">${cp.name}</h4>
                                    <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">${cp.location || 'Area Terbuka'}</p>
                                </div>
                            </div>
                            
                            <div class="text-right">
                                ${isScanned ? `
                                    <span class="text-sm font-black text-slate-900 bg-slate-50 px-3 py-1 rounded-xl">${new Date(cp.scanned_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                                    <div class="flex items-center justify-end space-x-1.5 mt-2">
                                        <div class="w-5 h-5 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 text-[8px] font-black">${cp.satpam?.charAt(0) || '?'}</div>
                                        <span class="text-[9px] font-black text-slate-400 uppercase tracking-tight">${cp.satpam || 'Petugas'}</span>
                                    </div>
                                ` : `
                                    <span class="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] animate-pulse">Menunggu</span>
                                `}
                            </div>
                        </div>
                    </div>
                    `;
        }).join('')}
            </div>

            <!-- Motivation / Footer Info -->
            <div class="mt-12 text-center">
                <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Terakhir diperbarui: ${new Date().toLocaleTimeString('id-ID')}</p>
            </div>
        </div>
        `;

        App.container.innerHTML = html;
        if (window.lucide) lucide.createIcons();
    };

    render();
};
