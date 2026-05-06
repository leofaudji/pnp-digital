import API from '../api.js';

export const Changelog = async (ctx) => {
    const data = await API.get('/api/changelog');
    
    let html = `
        <div class="max-w-4xl mx-auto px-4 py-8 md:py-16 animate-in fade-in duration-700">
            <!-- Header -->
            <div class="text-center mb-16">
                <div class="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 mb-6 shadow-sm">
                    <i data-lucide="zap" class="w-3.5 h-3.5"></i>
                    <span class="text-[10px] font-black uppercase tracking-[0.2em]">Sistem Update Log</span>
                </div>
                <h1 class="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">Apa Yang Baru?</h1>
                <p class="text-slate-500 text-lg font-medium max-w-xl mx-auto leading-relaxed">
                    Kami terus melakukan pembaruan untuk memastikan sistem berjalan lancar dan memberikan kemudahan terbaik untuk bapak.
                </p>
            </div>

            <!-- Feed Section -->
            <div class="space-y-8">
    `;

    if (data && data.versions) {
        data.versions.forEach((v, index) => {
            const groupedChanges = v.changes.reduce((acc, change) => {
                const type = change.type || 'Update';
                if (!acc[type]) acc[type] = [];
                acc[type].push(change.description);
                return acc;
            }, {});

            const isOpen = index === 0;

            html += `
                <details class="group bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden" ${isOpen ? 'open' : ''}>
                    <summary class="flex items-center justify-between p-6 md:p-8 cursor-pointer list-none focus:outline-none">
                        <div class="flex items-center gap-5 md:gap-8">
                            <div class="w-12 h-12 flex flex-col items-center justify-center rounded-xl bg-slate-50 group-open:bg-emerald-50 transition-colors duration-500 border border-slate-100 group-open:border-emerald-100 shrink-0">
                                <span class="text-[8px] font-black text-slate-400 group-open:text-emerald-400 leading-none mb-0.5 uppercase tracking-tighter">V</span>
                                <span class="text-lg font-black text-slate-900 group-open:text-emerald-600 leading-none tracking-tighter">${v.version}</span>
                            </div>
                            
                            <div>
                                <div class="flex items-center gap-2 mb-0.5">
                                    <h2 class="text-lg font-bold text-slate-900 tracking-tight">System Build</h2>
                                    ${index === 0 ? `
                                        <span class="px-1.5 py-0.5 bg-emerald-500 text-white text-[8px] font-black uppercase tracking-wider rounded-md shadow-sm">Terbaru</span>
                                    ` : ''}
                                </div>
                                <div class="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                                    <i data-lucide="calendar" class="w-3 h-3"></i>
                                    <span>${v.date}</span>
                                </div>
                            </div>
                        </div>

                        <div class="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 group-hover:bg-slate-100 group-open:rotate-180 transition-all duration-500 shrink-0">
                            <i data-lucide="chevron-down" class="w-4 h-4 text-slate-400"></i>
                        </div>
                    </summary>

                    <div class="px-6 md:px-8 pb-5 md:pb-6 pt-0 animate-in fade-in slide-in-from-top-1 duration-400">
                        <div class="h-px bg-slate-50 mb-4"></div>
                        <div class="space-y-4">
            `;

            Object.entries(groupedChanges).forEach(([type, descriptions]) => {
                let typeIcon = 'refresh-cw';
                let typeColor = 'bg-slate-50 text-slate-600 border-slate-100';
                
                if (type === 'New Feature' || type === 'Fitur Baru' || type === 'Added') {
                    typeIcon = 'sparkles';
                    typeColor = 'bg-emerald-50 text-emerald-600 border-emerald-100';
                } else if (type === 'Bug Fix' || type === 'Perbaikan' || type === 'Fixed') {
                    typeIcon = 'shield-alert';
                    typeColor = 'bg-rose-50 text-rose-600 border-rose-100';
                } else if (type === 'Redis' || type === 'Performance' || type === 'Changed') {
                    typeIcon = 'zap';
                    typeColor = 'bg-amber-50 text-amber-600 border-amber-100';
                }

                html += `
                    <div>
                        <div class="flex items-center gap-2 mb-2">
                            <div class="w-5 h-5 flex items-center justify-center rounded-lg ${typeColor} border shadow-xs shrink-0">
                                <i data-lucide="${typeIcon}" class="w-2.5 h-2.5"></i>
                            </div>
                            <h3 class="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">${type}</h3>
                            <div class="flex-1 h-px bg-slate-50 ml-2"></div>
                        </div>
                        
                        <div class="grid grid-cols-1 gap-0.5">
                            ${descriptions.map(desc => `
                                <div class="flex items-start gap-2.5 py-1 px-2 rounded-lg hover:bg-slate-50 transition-all duration-200">
                                    <div class="mt-1.5 w-1 h-1 rounded-full bg-slate-300 shrink-0"></div>
                                    <span class="text-slate-600 leading-normal font-semibold text-[11px] md:text-[13px]">${desc}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            });

            html += `
                        </div>
                    </div>
                </details>
            `;
        });
    }

    html += `
            </div>
            
            <!-- Footer -->
            <div class="mt-24 pt-16 border-t border-slate-100 text-center">
                <div class="w-16 h-16 bg-white shadow-sm border border-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-8">
                    <i data-lucide="rocket" class="w-8 h-8 text-emerald-500"></i>
                </div>
                <h3 class="text-2xl font-black text-slate-900 mb-3 tracking-tight">Terus Melangkah Maju</h3>
                <p class="text-slate-400 font-medium max-w-sm mx-auto mb-8 text-sm leading-relaxed">
                    Kami berkomitmen menjaga kualitas sistem demi kenyamanan hidup bapak hari ini dan masa depan.
                </p>
                <div class="flex items-center justify-center gap-6">
                    <div class="h-px w-8 bg-slate-100"></div>
                    <span class="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">RT Digital System</span>
                    <div class="h-px w-8 bg-slate-100"></div>
                </div>
            </div>
        </div>
    `;

    ctx.container.innerHTML = html;
    
    if (window.lucide) {
        lucide.createIcons();
    }
};
