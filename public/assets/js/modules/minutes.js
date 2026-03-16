import API from '../api.js';

export const Minutes = async (App) => {
    App.container.innerHTML = `
        <div class="p-4 lg:p-10 space-y-8 animate-in fade-in duration-500">
            <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h1 class="text-3xl font-black text-slate-900 tracking-tight">Notulensi Rapat AI</h1>
                    <p class="text-slate-500 text-sm font-medium mt-1">Catat dan ringkas rapat warga secara otomatis menggunakan AI.</p>
                </div>
                <button id="btn-add-meeting" class="bg-brand-600 hover:bg-brand-700 text-white px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-brand-500/20 transition-all active:scale-95 flex items-center justify-center gap-3">
                    <i data-lucide="plus" class="w-4 h-4"></i>
                    Rapat Baru
                </button>
            </div>

            <div id="meetings-list" class="grid lg:grid-cols-3 gap-6">
                <!-- Data will be loaded here -->
            </div>
        </div>

        <!-- Add Meeting Modal -->
        <div id="meeting-modal" class="hidden fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div class="bg-white rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
                <div class="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                    <div>
                        <h2 class="text-xl font-black text-slate-900 uppercase tracking-tight">Notulensi Rapat Baru</h2>
                        <p class="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">AI Smart Transcription & Summary</p>
                    </div>
                    <button id="btn-close-meeting" class="p-3 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-2xl transition-all shadow-sm">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>

                <div class="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <div class="grid lg:grid-cols-2 gap-8">
                        <!-- Form Area -->
                        <div class="space-y-6">
                            <div class="space-y-2">
                                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Judul Rapat</label>
                                <input type="text" id="meeting-title" placeholder="Contoh: Rapat Koordinasi Keamanan RT 01" class="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none">
                            </div>
                            <div class="space-y-2">
                                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tanggal Rapat</label>
                                <input type="date" id="meeting-date" value="${new Date().toISOString().split('T')[0]}" class="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none">
                            </div>

                            <div class="p-6 rounded-3xl bg-brand-50/50 border border-brand-100">
                                <div class="flex items-center justify-between mb-4">
                                    <div class="flex items-center gap-3">
                                        <div id="recording-indicator" class="w-3 h-3 rounded-full bg-slate-300"></div>
                                        <span id="recording-status" class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Siap Rekam</span>
                                    </div>
                                    <div id="timer" class="text-sm font-black text-brand-600 font-mono">00:00</div>
                                </div>
                                <div class="flex gap-3">
                                    <button id="btn-start-record" class="flex-1 py-4 rounded-2xl bg-brand-600 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-brand-500/30 hover:bg-brand-700 transition-all flex items-center justify-center gap-2">
                                        <i data-lucide="mic" class="w-4 h-4"></i>
                                        Mulai Rekam
                                    </button>
                                    <button id="btn-stop-record" disabled class="flex-1 py-4 rounded-2xl bg-slate-50 text-slate-400 font-black text-xs uppercase tracking-widest border border-slate-100 transition-all flex items-center justify-center gap-2">
                                        <i data-lucide="square" class="w-4 h-4"></i>
                                        Berhenti
                                    </button>
                                </div>
                            </div>

                            <div class="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm space-y-4">
                                <h3 class="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                    <i data-lucide="sparkles" class="w-4 h-4 text-brand-500"></i>
                                    AI Summarization
                                </h3>
                                <button id="btn-ai-summarize" disabled class="w-full py-4 rounded-2xl bg-slate-900 text-white font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                                    <i data-lucide="zap" class="w-4 h-4"></i>
                                    Generate AI Summary
                                </button>
                                <div id="ai-loading" class="hidden py-4 flex flex-col items-center">
                                    <div class="w-10 h-10 border-4 border-brand-100 border-t-brand-600 rounded-full animate-spin mb-3"></div>
                                    <p class="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">AI is Thinking...</p>
                                </div>
                            </div>
                        </div>

                        <!-- Content Area -->
                        <div class="h-full flex flex-col space-y-4">
                             <div class="flex-1 flex flex-col space-y-2">
                                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Live Transcript</label>
                                <div id="transcript-container" class="flex-1 p-6 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-medium text-slate-600 overflow-y-auto leading-relaxed min-h-[400px] max-h-[600px] relative">
                                    <div id="transcript-placeholder" class="absolute inset-0 flex items-center justify-center text-slate-300 font-bold uppercase text-[10px] tracking-widest">Teks akan muncul di sini...</div>
                                    <p id="transcript-content" class="whitespace-pre-wrap"></p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Result Area (Hidden initially) -->
                    <div id="ai-result-area" class="hidden mt-8 pt-8 border-t border-slate-100 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                        <div class="grid lg:grid-cols-2 gap-8">
                            <div class="space-y-2">
                                <label class="text-[10px] font-black text-brand-600 uppercase tracking-widest ml-1">AI Summary</label>
                                <div id="ai-summary-text" class="p-6 bg-brand-50/30 border border-brand-100 rounded-3xl text-sm font-bold text-slate-800 leading-relaxed italic"></div>
                            </div>
                            <div class="space-y-2">
                                <label class="text-[10px] font-black text-emerald-600 uppercase tracking-widest ml-1">Action Items / Tugas</label>
                                <div id="ai-action-items" class="space-y-2"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="p-8 border-t border-slate-50 flex justify-end gap-3 bg-slate-50/30">
                    <button id="btn-cancel-meeting" class="px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all">Batal</button>
                    <button id="btn-save-meeting" class="px-10 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/20 transition-all active:scale-95">Simpan Notulensi</button>
                </div>
            </div>
        </div>
    `;

    if (window.lucide) lucide.createIcons();

    const loadMeetings = async () => {
        const list = document.getElementById('meetings-list');
        list.innerHTML = '<div class="col-span-full py-20 text-center animate-pulse text-slate-300 font-bold uppercase tracking-widest text-[10px]">Loading Archive...</div>';

        const meetings = await API.get('/api/meetings');

        if (!meetings || !Array.isArray(meetings) || meetings.length === 0) {
            list.innerHTML = `
                <div class="col-span-full py-24 flex flex-col items-center justify-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
                    <div class="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-4">
                        <i data-lucide="mic-off" class="w-10 h-10"></i>
                    </div>
                    <p class="text-sm font-black text-slate-300 uppercase tracking-widest">Belum ada rekaman rapat</p>
                </div>
            `;
            if (window.lucide) lucide.createIcons();
            return;
        }

        list.innerHTML = meetings.map(m => `
            <div class="group relative bg-white rounded-[2.5rem] border border-slate-100 p-8 hover:border-brand-200 hover:shadow-2xl hover:shadow-brand-500/10 transition-all duration-500 flex flex-col h-full">
                <div class="flex items-start justify-between mb-6">
                    <div class="p-3.5 bg-brand-50 text-brand-600 rounded-2xl group-hover:bg-brand-600 group-hover:text-white transition-all duration-500">
                        <i data-lucide="calendar" class="w-5 h-5"></i>
                    </div>
                    <div class="flex flex-col items-end">
                        <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">${new Date(m.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        <span class="px-2.5 py-0.5 rounded-lg bg-slate-50 text-slate-400 text-[8px] font-black uppercase tracking-widest border border-slate-100">Archive #${m.id.toString().padStart(3, '0')}</span>
                    </div>
                </div>

                <h3 class="text-lg font-black text-slate-900 leading-tight mb-4 group-hover:text-brand-700 transition-colors">${m.title}</h3>
                
                <div class="flex-1 space-y-4">
                    <div class="p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50 group-hover:bg-brand-50/30 group-hover:border-brand-100 transition-all">
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><i data-lucide="zap" class="w-3 h-3 text-brand-500"></i> AI Summary</p>
                        <p class="text-[11px] font-bold text-slate-600 leading-relaxed italic truncate">${m.summary || 'Summary not generated'}</p>
                    </div>
                </div>

                <div class="mt-8 flex items-center justify-between pt-6 border-t border-slate-50">
                    <div class="flex items-center gap-2">
                        <div class="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">${m.creator_name ? m.creator_name.charAt(0) : 'U'}</div>
                        <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">${m.creator_name || 'Admin'}</span>
                    </div>
                    <div class="flex gap-2">
                        <button class="btn-delete-meeting p-2 text-slate-300 hover:text-rose-500 transition-all" data-id="${m.id}">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                        <button class="btn-view-meeting px-4 py-2 bg-slate-50 hover:bg-slate-900 hover:text-white text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all" data-data='${JSON.stringify(m).replace(/'/g, "&apos;")}'>Detail</button>
                    </div>
                </div>
            </div>
        `).join('');

        if (window.lucide) lucide.createIcons();

        // Delete Handler
        document.querySelectorAll('.btn-delete-meeting').forEach(btn => {
            btn.onclick = async (e) => {
                const id = btn.dataset.id;
                const result = await SwalCustom.fire({
                    title: 'Hapus Notulensi?',
                    text: 'Data yang dihapus tidak dapat dikembalikan pak.',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Ya, Hapus',
                    cancelButtonText: 'Batal'
                });

                if (result.isConfirmed) {
                    const res = await API.post('/api/meetings/delete?id=' + id);
                    if (res.success) {
                        SwalCustom.fire('Berhasil!', 'Notulensi telah dihapus.', 'success');
                        loadMeetings();
                    }
                }
            };
        });

        // View Handler
        document.querySelectorAll('.btn-view-meeting').forEach(btn => {
            btn.onclick = () => {
                const m = JSON.parse(btn.dataset.data);
                SwalCustom.fire({
                    title: m.title,
                    html: `
                        <div class="py-4 text-left space-y-6">
                            <div class="flex items-center gap-3">
                                <span class="px-3 py-1 bg-brand-50 text-brand-600 text-[10px] font-black uppercase rounded-lg border border-brand-100">${new Date(m.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dibuat oleh: ${m.creator_name || 'Admin'}</span>
                            </div>

                            <div class="p-6 bg-brand-50/50 rounded-3xl border border-brand-100">
                                <h4 class="text-[10px] font-black text-brand-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <i data-lucide="sparkles" class="w-4 h-4"></i> Ringkasan AI
                                </h4>
                                <p class="text-sm font-bold text-slate-800 italic leading-relaxed">${m.summary || 'Summary not available'}</p>
                            </div>

                            <div class="grid lg:grid-cols-2 gap-6">
                                <div class="space-y-3">
                                    <h4 class="text-[10px] font-black text-emerald-600 uppercase tracking-widest ml-1">Agenda & Tugas (Action Items)</h4>
                                    <div class="space-y-2">
                                        ${m.action_items ? JSON.parse(m.action_items).map(item => `
                                            <div class="flex items-center p-3.5 bg-emerald-50/50 border border-emerald-100 rounded-2xl">
                                                <div class="w-5 h-5 rounded-lg bg-emerald-500 text-white flex items-center justify-center mr-3 shadow-lg shadow-emerald-500/20">
                                                    <i data-lucide="check" class="w-3 h-3"></i>
                                                </div>
                                                <span class="text-xs font-bold text-emerald-800">${item}</span>
                                            </div>
                                        `).join('') : '<p class="text-xs text-slate-400 font-bold italic p-4 text-center">Tidak ada agenda tercatat.</p>'}
                                    </div>
                                </div>
                                <div class="space-y-3">
                                    <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Transkrip Lengkap</h4>
                                    <div class="p-5 bg-slate-50 rounded-3xl border border-slate-100 text-[11px] font-medium text-slate-500 leading-relaxed max-h-[300px] overflow-y-auto custom-scrollbar">
                                        ${m.raw_content ? m.raw_content.replace(/\n/g, '<br>') : 'Tidak ada konten.'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    `,
                    width: '56rem',
                    confirmButtonText: 'Tutup',
                    didOpen: () => { if (window.lucide) lucide.createIcons(); }
                });
            };
        });
    };

    loadMeetings();

    // Modal Logic
    const modal = document.getElementById('meeting-modal');
    const openBtn = document.getElementById('btn-add-meeting');
    const closeBtn = document.getElementById('btn-close-meeting');
    const cancelBtn = document.getElementById('btn-cancel-meeting');

    openBtn.onclick = () => {
        modal.classList.remove('hidden');
        resetModal();
    };
    closeBtn.onclick = () => modal.classList.add('hidden');
    cancelBtn.onclick = () => modal.classList.add('hidden');

    const resetModal = () => {
        document.getElementById('meeting-title').value = '';
        document.getElementById('transcript-content').innerText = '';
        document.getElementById('transcript-placeholder').classList.remove('hidden');
        document.getElementById('ai-result-area').classList.add('hidden');
        document.getElementById('btn-ai-summarize').disabled = true;
        document.getElementById('btn-save-meeting').disabled = false;
        document.getElementById('timer').innerText = '00:00';
    };

    // Voice Recording & Transcription Logic
    let recognition = null;
    let isRecording = false;
    let startTime = null;
    let timerInterval = null;

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'id-ID';

        recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }

            const contentEl = document.getElementById('transcript-content');
            const placeholder = document.getElementById('transcript-placeholder');

            if (finalTranscript || interimTranscript) {
                placeholder.classList.add('hidden');
                document.getElementById('btn-ai-summarize').disabled = false;
            }

            // Append final results to current content
            if (finalTranscript) {
                contentEl.innerText += (contentEl.innerText ? ' ' : '') + finalTranscript;
            }

            // For visual feedback of interim results, we could show them separately, but for simplicity let's just focus on final
        };

        recognition.onerror = (err) => {
            console.error('Recognition error:', err);
            isRecording = false;
            stopBtn.click(); // Reset UI state

            if (err.error === 'not-allowed') {
                SwalCustom.fire({
                    title: 'Akses Mic Ditolak',
                    html: `
                        <div class="text-left space-y-3">
                            <p class="text-sm text-slate-600 font-bold">Aplikasi tidak bisa mendengar suara bapak karena akses mikrofon ditolak.</p>
                            <div class="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                                <p class="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2">Cara Memperbaiki:</p>
                                <ol class="text-[11px] text-amber-700 font-bold space-y-1 list-decimal ml-4">
                                    <li>Klik ikon <span class="px-1.5 py-0.5 bg-white rounded border border-amber-200">Gembok 🔒</span> atau <span class="px-1.5 py-0.5 bg-white rounded border border-amber-200">Setting ⚙️</span> di sebelah alamat website (kiri atas).</li>
                                    <li>Ubah Mikrofon menjadi <span class="text-emerald-600">"Allow"</span>.</li>
                                    <li>Pastikan bapak menggunakan koneksi aman (HTTPS) atau localhost.</li>
                                    <li>Refresh halaman ini.</li>
                                </ol>
                            </div>
                        </div>
                    `,
                    icon: 'warning',
                    confirmButtonText: 'Siap Pak'
                });
            } else if (err.error === 'service-not-allowed') {
                SwalCustom.fire('Error', 'Fitur ini perlu koneksi HTTPS atau Localhost agar bisa berjalan pak.', 'error');
            }
        };
    }

    const startBtn = document.getElementById('btn-start-record');
    const stopBtn = document.getElementById('btn-stop-record');
    const indicator = document.getElementById('recording-indicator');
    const status = document.getElementById('recording-status');
    const timerEl = document.getElementById('timer');

    startBtn.onclick = () => {
        if (!recognition) {
            SwalCustom.fire('Error', 'Browser bapak tidak mendukung Speech API. Coba gunakan Chrome terbaru ya.', 'error');
            return;
        }

        try {
            recognition.start();
            isRecording = true;
            status.innerText = 'Merekam...';
            status.classList.add('text-rose-500', 'animate-pulse');
            indicator.classList.remove('bg-slate-300');
            indicator.classList.add('bg-rose-500', 'animate-ping');

            startBtn.disabled = true;
            stopBtn.disabled = false;
            startBtn.classList.replace('bg-brand-600', 'bg-slate-100');
            startBtn.classList.replace('text-white', 'text-slate-400');

            startTime = Date.now();
            timerInterval = setInterval(() => {
                const elapsed = Math.floor((Date.now() - startTime) / 1000);
                const mins = Math.floor(elapsed / 60).toString().padStart(2, '0');
                const secs = (elapsed % 60).toString().padStart(2, '0');
                timerEl.innerText = `${mins}:${secs}`;
            }, 1000);

        } catch (e) {
            console.error(e);
        }
    };

    stopBtn.onclick = () => {
        if (recognition) recognition.stop();
        isRecording = false;
        status.innerText = 'Selesai';
        status.classList.remove('text-rose-500', 'animate-pulse');
        indicator.classList.remove('bg-rose-500', 'animate-ping');
        indicator.classList.add('bg-emerald-500');

        startBtn.disabled = false;
        stopBtn.disabled = true;
        startBtn.classList.replace('bg-slate-100', 'bg-brand-600');
        startBtn.classList.replace('text-slate-400', 'text-white');

        clearInterval(timerInterval);
    };

    // AI Summarize Logic
    const summaryBtn = document.getElementById('btn-ai-summarize');
    const loading = document.getElementById('ai-loading');
    const resultArea = document.getElementById('ai-result-area');

    summaryBtn.onclick = async () => {
        const text = document.getElementById('transcript-content').innerText;
        if (!text) return;

        summaryBtn.classList.add('hidden');
        loading.classList.remove('hidden');

        const res = await API.post('/api/meetings/summarize', { text });

        loading.classList.add('hidden');
        summaryBtn.classList.remove('hidden');

        if (res.summary) {
            resultArea.classList.remove('hidden');
            document.getElementById('ai-summary-text').innerText = res.summary;
            document.getElementById('ai-action-items').innerHTML = res.action_items.map(item => `
                <div class="flex items-center p-3.5 bg-emerald-50 border border-emerald-100 rounded-2xl animate-in slide-in-from-left duration-500">
                    <div class="w-6 h-6 rounded-lg bg-emerald-500 text-white flex items-center justify-center mr-3 shadow-lg shadow-emerald-500/20">
                        <i data-lucide="check" class="w-4 h-4"></i>
                    </div>
                    <span class="text-xs font-black text-emerald-800 uppercase tracking-tight">${item}</span>
                </div>
            `).join('');

            if (window.lucide) lucide.createIcons();

            // Scroll to result
            resultArea.scrollIntoView({ behavior: 'smooth' });
        }
    };

    // Save Logic
    const saveBtn = document.getElementById('btn-save-meeting');
    saveBtn.onclick = async () => {
        const title = document.getElementById('meeting-title').value;
        const date = document.getElementById('meeting-date').value;
        const content = document.getElementById('transcript-content').innerText;
        const summary = document.getElementById('ai-summary-text').innerText;

        // Extract action items from UI if hidden or not
        const actionItems = Array.from(document.querySelectorAll('#ai-action-items span')).map(s => s.innerText);

        if (!title || !content) {
            SwalCustom.fire('Ups!', 'Judul dan Transkrip wajib ada ya pak.', 'warning');
            return;
        }

        const res = await API.post('/api/meetings', {
            title, date, raw_content: content, summary, action_items: actionItems
        });

        if (res.success) {
            SwalCustom.fire('Berhasil!', 'Notulensi rapat telah disimpan.', 'success');
            modal.classList.add('hidden');
            loadMeetings();
        }
    };
};
