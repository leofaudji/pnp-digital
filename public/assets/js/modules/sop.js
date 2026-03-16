import API from '../api.js';
import Sidebar from '../sidebar.js';

export const Sop = async (App) => {
    document.getElementById('header-container').classList.remove('hidden');
    document.getElementById('page-title').innerText = 'Standard Operating Procedure';
    const user = await App.getUser();
    await Sidebar.render(user ? user.role : null);

    const isAdmin = user.role_id == 1;
    const settings = await API.get('/api/settings');
    let sopContent = settings.sop_content || "Belum ada SOP yang diatur.";

    // Helper to format plain text SOP into nice HTML
    const formatSOP = (text) => {
        if (!text) return "";

        let lines = text.split('\n');
        let formattedHtml = "";
        let inList = false;
        let listType = ""; // 'ul' or 'ol'

        const closeList = () => {
            if (inList) {
                formattedHtml += `</${listType}>`;
                inList = false;
            }
        };

        lines.forEach(line => {
            let trimmed = line.trim();

            // Handle Headers (Line starting with # or all caps with at least 5 chars)
            if (trimmed.startsWith('#')) {
                closeList();
                let level = trimmed.match(/^#+/)[0].length;
                let title = trimmed.replace(/^#+/, '').trim();
                formattedHtml += `<h${level + 1} class="text-slate-900 font-black mt-8 mb-4 tracking-tight">${title}</h${level + 1}>`;
            }
            // Handle Unordered Lists (- or *)
            else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                if (!inList || listType !== 'ul') {
                    closeList();
                    formattedHtml += `<ul class="list-disc list-outside space-y-2 my-4 ml-6 text-slate-600 font-medium">`;
                    inList = true;
                    listType = 'ul';
                }
                let item = trimmed.substring(2).trim();
                formattedHtml += `<li>${item}</li>`;
            }
            // Handle Ordered Lists (1. 2. etc)
            else if (/^\d+\.\s/.test(trimmed)) {
                if (!inList || listType !== 'ol') {
                    closeList();
                    formattedHtml += `<ol class="list-decimal list-outside space-y-2 my-4 ml-6 text-slate-600 font-medium">`;
                    inList = true;
                    listType = 'ol';
                }
                let item = trimmed.replace(/^\d+\.\s/, '').trim();
                formattedHtml += `<li>${item}</li>`;
            }
            // Handle Empty lines
            else if (trimmed === "") {
                closeList();
                formattedHtml += `<div class="h-4"></div>`;
            }
            // Normal Text
            else {
                closeList();
                // Check if line is likely a sub-header (All caps)
                if (trimmed === trimmed.toUpperCase() && trimmed.length > 5) {
                    formattedHtml += `<h4 class="text-slate-800 font-bold mt-6 mb-2 uppercase text-sm tracking-widest">${trimmed}</h4>`;
                } else {
                    formattedHtml += `<p class="mb-3 leading-relaxed text-slate-600 font-medium">${trimmed}</p>`;
                }
            }
        });

        closeList();

        // Final bold replacement (**text**)
        return formattedHtml.replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-900 font-bold">$1</strong>');
    };

    const render = () => {
        let html = `
        <div class="max-w-5xl mx-auto pb-24 px-4 sm:px-6">
            <!-- Header Section -->
            <div class="flex flex-col md:flex-row md:items-end justify-between mb-8 md:mb-10 gap-6 animate-in fade-in slide-in-from-top-4 duration-700">
                <div>
                    <div class="flex items-center space-x-3 mb-3">
                        <div class="bg-brand-600 p-2 rounded-xl shadow-lg shadow-brand-200">
                            <i data-lucide="book-open" class="w-5 h-5 md:w-6 md:h-6 text-white"></i>
                        </div>
                        <span class="text-[10px] md:text-xs font-black text-brand-600 uppercase tracking-[0.2em]">Dokumen Resmi</span>
                    </div>
                    <h1 class="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-2">SOP Lingkungan</h1>
                    <p class="text-sm md:text-base text-slate-500 font-medium max-w-xl leading-relaxed">Panduan prosedur operasional standar untuk menjaga ketertiban dan keamanan lingkungan.</p>
                </div>
                <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:space-x-3">
                    <button onclick="window.print()" class="flex items-center justify-center px-6 py-3 bg-white text-slate-700 text-sm font-bold border-2 border-slate-100 rounded-2xl hover:bg-slate-50 hover:border-slate-200 transition-all shadow-sm active:scale-95 group">
                        <i data-lucide="printer" class="w-4 h-4 mr-2 text-slate-400 group-hover:text-slate-600"></i> Cetak Dokumen
                    </button>
                    ${isAdmin ? `
                    <button id="btn-edit-sop" class="flex items-center justify-center px-6 py-3 bg-brand-600 text-white text-sm font-bold rounded-2xl hover:bg-brand-700 transition-all shadow-xl shadow-brand-100 active:scale-95">
                        <i data-lucide="edit-3" class="w-4 h-4 mr-2"></i> Edit SOP
                    </button>
                    ` : ''}
                </div>
            </div>

            <!-- Content Area -->
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <!-- Main Content (Paper Style) -->
                <div class="lg:col-span-8">
                    <div class="bg-white rounded-2xl md:rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-1000">
                        <!-- Toolbar (View Mode) -->
                        <div class="px-6 md:px-8 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest">
                            <div class="flex items-center">
                                <span class="w-2 h-2 bg-green-500 rounded-full mr-2"></span> Aktif
                            </div>
                            <div id="last-updated-label">Rev. ${new Date().toLocaleDateString('id-ID')}</div>
                        </div>

                        <!-- SOP Viewer -->
                        <div id="sop-view" class="p-6 sm:p-8 md:p-16">
                            <article id="sop-content-area" class="prose prose-slate max-w-none">
                                ${formatSOP(sopContent)}
                            </article>
                        </div>

                        <!-- SOP Editor -->
                        ${isAdmin ? `
                        <div id="sop-edit" class="hidden p-6 md:p-8 bg-slate-50 border-t border-slate-100 animate-in fade-in zoom-in-95 duration-300">
                            <div class="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <h3 class="font-black text-slate-900 uppercase tracking-tight flex items-center text-sm md:text-base">
                                    <i data-lucide="file-edit" class="w-5 h-5 mr-2 text-brand-600"></i> Editor SOP
                                </h3>
                                <div class="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase tracking-wider">Markdown Supported</div>
                            </div>
                            <textarea id="sop-input" class="w-full h-[400px] md:h-[600px] p-6 md:p-8 bg-white border-2 border-slate-100 rounded-2xl md:rounded-[2rem] outline-none font-mono text-xs md:text-sm leading-relaxed transition-all focus:border-brand-500 focus:shadow-2xl focus:shadow-brand-500/5 overflow-y-auto" placeholder="Tuliskan isi SOP di sini...">${sopContent}</textarea>
                            <div class="flex flex-col sm:flex-row gap-3 mt-6 md:mt-8 justify-end">
                                <button id="btn-cancel-sop" class="px-8 py-4 bg-white text-slate-600 font-bold rounded-2xl border-2 border-slate-100 hover:bg-slate-50 transition-all text-sm">Batal</button>
                                <button id="btn-save-sop" class="px-10 py-4 bg-brand-600 text-white font-black rounded-2xl hover:bg-brand-700 transition-all shadow-xl shadow-brand-200 flex items-center justify-center text-sm">
                                    <i data-lucide="check" class="w-5 h-5 mr-2"></i> Simpan SOP
                                </button>
                            </div>
                        </div>
                        ` : ''}
                    </div>
                </div>

                <!-- Sidebar / Reference Card -->
                <div class="lg:col-span-4 space-y-6">
                    <div class="bg-slate-900 p-6 md:p-8 rounded-2xl md:rounded-[2.5rem] text-white shadow-2xl shadow-indigo-200 relative overflow-hidden group">
                        <div class="absolute -right-4 -top-4 w-32 h-32 bg-brand-500/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
                        <h3 class="text-lg md:text-xl font-black mb-4">Informasi Penting</h3>
                        <p class="text-slate-400 text-xs md:text-sm leading-relaxed mb-6 font-medium">SOP ini dirancang untuk memastikan keamanan maksimal di wilayah lingkungan kita.</p>
                        <div class="space-y-4">
                            <div class="flex items-start">
                                <i data-lucide="check-circle-2" class="w-4 h-4 mr-3 mt-1 text-brand-400 shrink-0"></i>
                                <p class="text-[11px] md:text-xs text-slate-300 leading-relaxed font-medium">Wajib dipatuhi oleh seluruh satpam.</p>
                            </div>
                            <div class="flex items-start">
                                <i data-lucide="check-circle-2" class="w-4 h-4 mr-3 mt-1 text-brand-400 shrink-0"></i>
                                <p class="text-[11px] md:text-xs text-slate-300 leading-relaxed font-medium">Laporkan kejadian melalui sistem.</p>
                            </div>
                        </div>
                    </div>

                    <div class="bg-brand-50 p-6 md:p-8 rounded-2xl md:rounded-[2.5rem] border border-brand-100 shadow-sm transition-all hover:shadow-md">
                        <div class="flex items-center space-x-3 mb-4">
                            <i data-lucide="shield-alert" class="w-5 h-5 text-brand-600"></i>
                            <h4 class="font-black text-brand-900 text-[11px] md:text-sm uppercase tracking-wider">Kepatuhan</h4>
                        </div>
                        <p class="text-brand-800/70 text-xs md:text-[13px] leading-relaxed font-medium italic">"Keselamatan adalah prioritas utama setiap petugas."</p>
                    </div>
                </div>
            </div>
        </div>

        <style>
            @media print {
                #sidebar-container, #header-container, header, footer, .grid > div:last-child, button {
                    display: none !important;
                }
                .grid { display: block !important; }
                .lg\\:col-span-8 { width: 100% !important; }
                #app-content { padding: 0 !important; }
                .bg-white { border: none !important; box-shadow: none !important; }
                .p-8, .p-16 { padding: 0 !important; }
                body { background: white !important; }
                #app { display: block !important; }
            }
        </style>
        `;

        App.container.innerHTML = html;
        if (window.lucide) lucide.createIcons();

        if (isAdmin) {
            const btnEdit = document.getElementById('btn-edit-sop');
            const btnCancel = document.getElementById('btn-cancel-sop');
            const btnSave = document.getElementById('btn-save-sop');
            const viewDiv = document.getElementById('sop-view');
            const editDiv = document.getElementById('sop-edit');
            const input = document.getElementById('sop-input');

            btnEdit.onclick = () => {
                viewDiv.classList.add('hidden');
                btnEdit.classList.add('hidden');
                editDiv.classList.remove('hidden');
                editDiv.scrollIntoView({ behavior: 'smooth' });
                input.focus();
            };

            btnCancel.onclick = () => {
                editDiv.classList.add('hidden');
                viewDiv.classList.remove('hidden');
                btnEdit.classList.remove('hidden');
                input.value = sopContent;
            };

            btnSave.onclick = async () => {
                const newContent = input.value;
                Swal.fire({ title: 'Menyimpan...', didOpen: () => Swal.showLoading() });

                const res = await API.post('/api/settings', { sop_content: newContent });
                if (res.success) {
                    sopContent = newContent;
                    Sop(App);
                    SwalCustom.fire('Tersimpan', 'SOP berhasil diperbarui dan dipublikasikan', 'success');
                } else {
                    SwalCustom.fire('Gagal', res.error, 'error');
                }
            };
        }
    };

    render();
};
