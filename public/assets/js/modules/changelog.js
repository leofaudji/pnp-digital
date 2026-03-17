import API from '../api.js';

export const Changelog = async (ctx) => {
    const data = await API.get('/api/changelog');
    
    let html = `
        <div class="p-6 max-w-5xl mx-auto animate-in fade-in duration-700">
            <!-- Header Section -->
            <div class="mb-12 text-center md:text-left">
                <div class="inline-flex items-center gap-2 px-3 py-1 bg-brand-50 text-brand-600 rounded-full border border-brand-100 mb-4 animate-in slide-in-from-top-4 duration-1000">
                    <i data-lucide="sparkles" class="w-3.5 h-3.5"></i>
                    <span class="text-[10px] font-black uppercase tracking-widest">Update Log</span>
                </div>
                <h1 class="text-4xl font-black text-slate-900 tracking-tight mb-3">Apa Yang Baru?</h1>
                <p class="text-slate-500 text-lg max-w-2xl">Kami terus memperbarui dan meningkatkan sistem untuk pengalaman terbaik Anda.</p>
            </div>

            <div class="grid grid-cols-1 gap-10">
    `;

    if (data && data.versions) {
        data.versions.forEach((v, index) => {
            // Group changes by type for better organization
            const groupedChanges = v.changes.reduce((acc, change) => {
                const type = change.type || 'Update';
                if (!acc[type]) acc[type] = [];
                acc[type].push(change.description);
                return acc;
            }, {});

            html += `
                <div class="relative bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 overflow-hidden group">
                    <!-- Top Accent Line -->
                    <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-500 to-emerald-400 opacity-80"></div>
                    
                    <div class="p-8 md:p-10 flex flex-col md:flex-row gap-8">
                        <!-- Left Info -->
                        <div class="md:w-1/4 flex flex-col md:items-start items-center text-center md:text-left shrink-0">
                            <div class="text-3xl font-black text-slate-900 mb-2">v${v.version}</div>
                            <div class="px-4 py-1.5 bg-slate-50 text-slate-500 rounded-xl text-xs font-bold border border-slate-100 mb-4 w-fit">
                                ${v.date}
                            </div>
                            ${index === 0 ? `
                                <div class="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                                    Paling Terbaru
                                </div>
                            ` : ''}
                        </div>

                        <!-- Right Details -->
                        <div class="flex-1 space-y-8">
            `;

            Object.entries(groupedChanges).forEach(([type, descriptions]) => {
                let typeIcon = 'refresh-cw';
                let typeColor = 'bg-slate-100 text-slate-600 border-slate-200';
                
                if (type === 'New Feature') {
                    typeIcon = 'sparkles';
                    typeColor = 'bg-emerald-50 text-emerald-600 border-emerald-100';
                } else if (type === 'Bug Fix') {
                    typeIcon = 'shield-alert';
                    typeColor = 'bg-rose-50 text-rose-600 border-rose-100';
                }

                html += `
                    <div>
                        <div class="flex items-center gap-2.5 mb-5">
                            <div class="w-7 h-7 flex items-center justify-center rounded-lg ${typeColor} border">
                                <i data-lucide="${typeIcon}" class="w-4 h-4"></i>
                            </div>
                            <h3 class="text-sm font-black text-slate-800 uppercase tracking-widest">${type}</h3>
                            <div class="flex-1 h-px bg-slate-100 ml-2"></div>
                        </div>
                        <ul class="space-y-4">
                            ${descriptions.map(desc => `
                                <li class="flex items-start gap-3 group/item">
                                    <div class="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-400 shrink-0 group-hover/item:scale-125 transition-transform duration-300"></div>
                                    <span class="text-slate-600 leading-relaxed font-medium">${desc}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                `;
            });

            html += `
                        </div>
                    </div>
                </div>
            `;
        });
    }

    html += `
            </div>
            
            <!-- Footer Quote -->
            <div class="mt-20 py-12 border-t border-slate-100 text-center">
                <div class="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <i data-lucide="quote" class="w-6 h-6 text-slate-300"></i>
                </div>
                <p class="text-slate-400 italic text-sm font-medium">"Kecemerlangan bukan satu tindakan, ia adalah satu tabiat."</p>
                <p class="text-slate-500 font-bold text-[10px] mt-2 uppercase tracking-widest">Terus Melangkah Maju</p>
            </div>
        </div>
    `;

    ctx.container.innerHTML = html;
    if (window.lucide) {
        lucide.createIcons();
    }
};
