import API from '../api.js';

export const CheckpointAdmin = async (App) => {
    document.getElementById('header-container').classList.remove('hidden');
    document.getElementById('page-title').innerText = 'Hub Cetak QR';
    const userMe = await App.getUser();

    const checkpoints = await API.get('/api/checkpoints');

    App.container.innerHTML = `
        <div class="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
            <div>
                <h1 class="text-3xl font-black text-slate-900 tracking-tight mb-2">Hub Cetak QR</h1>
                <p class="text-slate-500 font-medium">Cetak kode QR untuk ditempel di gerbang atau titik patroli.</p>
            </div>
            <div class="flex gap-3">
                ${userMe.role_id == 1 ? `
                    <button id="btn-add-checkpoint" class="px-6 py-3 bg-brand-600 text-white font-bold rounded-xl flex items-center hover:bg-brand-700 transition-all shadow-lg active:scale-95">
                        <i data-lucide="plus" class="w-5 h-5 mr-3"></i> Tambah Checkpoint
                    </button>
                ` : ''}
                <button onclick="window.print()" class="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl flex items-center hover:bg-slate-800 transition-all shadow-lg active:scale-95">
                    <i data-lucide="printer" class="w-5 h-5 mr-3"></i> Cetak Halaman Ini
                </button>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <!-- Dynamic Checkpoints -->
            ${checkpoints.map(cp => `
                <div class="bg-white p-8 rounded-[2rem] border-2 border-slate-100 flex flex-col items-center relative group hover:border-brand-500/50 transition-colors">
                    ${userMe.role_id == 1 ? `
                        <div class="absolute top-6 right-6 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity no-print">
                            <button class="btn-edit-cp p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors" data-cp='${JSON.stringify(cp).replace(/'/g, "&apos;")}'>
                                <i data-lucide="edit-3" class="w-4 h-4"></i>
                            </button>
                            <button class="btn-delete-cp p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors" data-id="${cp.id}">
                                <i data-lucide="trash-2" class="w-4 h-4"></i>
                            </button>
                        </div>
                    ` : ''}
                    <h3 class="text-lg font-black text-slate-900 mb-2 uppercase">${cp.name}</h3>
                    <div id="qr-cp-${cp.id}" class="p-4 bg-white border border-slate-100 rounded-2xl mb-6"></div>
                    <p class="text-[10px] text-slate-400 font-mono uppercase">${cp.qr_code_string}</p>
                    <div class="mt-4 px-3 py-1 ${cp.type === 'ATTENDANCE' ? 'bg-blue-50 text-blue-600 border-blue-100/50' : 'bg-brand-50 text-brand-600 border-brand-100/50'} text-[10px] font-bold rounded-lg uppercase tracking-widest border">
                        ${cp.type === 'ATTENDANCE' ? 'Stasiun Absensi' : 'Titik Patroli'}
                    </div>
                </div>
            `).join('')}
        </div>

        <!-- Modal -->
        <div id="cp-modal" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm hidden flex items-center justify-center p-4 z-50 no-print">
            <div class="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl">
                <h3 id="cp-modal-title" class="text-2xl font-black mb-8 text-slate-900">Tambah Checkpoint</h3>
                <form id="cp-form" class="space-y-5">
                    <input type="hidden" id="cp-id">
                    <div>
                        <label class="block text-xs font-black text-slate-400 mb-2 ml-1 uppercase tracking-widest">Nama Titik</label>
                        <input id="cp-name" type="text" placeholder="Contoh: Pos Ronda Blok A" class="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-brand-500/10 outline-none transition-all font-bold text-slate-700" required>
                    </div>
                    <div>
                        <label class="block text-xs font-black text-slate-400 mb-2 ml-1 uppercase tracking-widest">Tipe QR</label>
                        <select id="cp-type" class="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-brand-500/10 outline-none transition-all font-bold text-slate-700" required>
                            <option value="PATROL">Titik Patroli (Security Log)</option>
                            <option value="ATTENDANCE">Stasiun Absensi (Masuk/Pulang)</option>
                        </select>
                        <p class="mt-2 text-[10px] text-slate-400 font-medium ml-1 italic">QR Patroli tidak bisa digunakan untuk Absen, dan sebaliknya.</p>
                    </div>
                    <div>
                        <label class="block text-xs font-black text-slate-400 mb-2 ml-1 uppercase tracking-widest">QR ID (Opsional)</label>
                        <input id="cp-qr" type="text" placeholder="Otomatis jika kosong" class="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-brand-500/10 outline-none transition-all font-mono text-sm" maxlength="50">
                        <p class="mt-2 text-[10px] text-slate-400 font-medium ml-1">Akan diawali dengan 'POS-' secara otomatis.</p>
                    </div>
                    <div class="flex space-x-3 pt-8">
                        <button type="button" id="btn-close-cp" class="flex-1 py-4 text-sm font-black text-slate-500 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-colors uppercase tracking-widest">Batal</button>
                        <button type="submit" class="flex-1 py-4 text-sm font-black text-white bg-brand-600 rounded-2xl shadow-lg shadow-brand-500/20 hover:bg-brand-700 transition-all uppercase tracking-widest">Simpan Data</button>
                    </div>
                </form>
            </div>
        </div>
        
        <style>
            @media print {
                .no-print, header, #sidebar-container, .fixed { display: none !important; }
                main { padding: 0 !important; margin: 0 !important; }
                #page-container { padding: 0 !important; }
                .grid { display: grid !important; grid-template-columns: repeat(2, 1fr) !important; gap: 20px !important; }
                .grid > div { break-inside: avoid; border: 2px solid #f1f5f9 !important; padding: 40px !important; }
                .group-hover\:opacity-100 { opacity: 0 !important; }
            }
        </style>
    `;

    setTimeout(() => {
        checkpoints.forEach(cp => {
            const el = document.getElementById(`qr-cp-${cp.id}`);
            if (el) new QRCode(el, { text: cp.qr_code_string, width: 180, height: 180 });
        });
    }, 100);

    // Event Handlers
    if (userMe.role_id == 1) {
        document.getElementById('btn-add-checkpoint').onclick = () => showCPModal();
        document.getElementById('btn-close-cp').onclick = () => document.getElementById('cp-modal').classList.add('hidden');

        document.querySelectorAll('.btn-edit-cp').forEach(btn => {
            btn.onclick = () => showCPModal(JSON.parse(btn.dataset.cp));
        });

        document.querySelectorAll('.btn-delete-cp').forEach(btn => {
            btn.onclick = async () => {
                const result = await SwalCustom.fire({
                    title: 'Hapus Checkpoint?',
                    text: "Seluruh riwayat patroli pada titik ini akan tetap tersimpan, namun titik ini tidak bisa discan lagi.",
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Ya, Hapus!',
                    cancelButtonText: 'Batal'
                });

                if (result.isConfirmed) {
                    const res = await API.post('/api/checkpoints/delete', { id: btn.dataset.id });
                    if (res.success) {
                        SwalCustom.fire('Berhasil!', 'Titik checkpoint telah dihapus.', 'success');
                        CheckpointAdmin(App);
                    } else {
                        SwalCustom.fire('Gagal!', res.error, 'error');
                    }
                }
            };
        });

        const showCPModal = (cp = null) => {
            document.getElementById('cp-modal').classList.remove('hidden');
            document.getElementById('cp-id').value = cp ? cp.id : '';
            document.getElementById('cp-name').value = cp ? cp.name : '';
            document.getElementById('cp-type').value = cp ? cp.type : 'PATROL';
            document.getElementById('cp-qr').value = cp ? cp.qr_code_string.replace('POS-', '').trim() : '';
            document.getElementById('cp-modal-title').innerText = cp ? 'Edit Checkpoint' : 'Tambah Checkpoint';
        };

        document.getElementById('cp-form').onsubmit = async (e) => {
            e.preventDefault();
            const id = document.getElementById('cp-id').value;
            const data = {
                name: document.getElementById('cp-name').value.trim(),
                type: document.getElementById('cp-type').value,
                qr_code_string: document.getElementById('cp-qr').value.trim()
            };
            const endpoint = id ? '/api/checkpoints/update' : '/api/checkpoints';
            const res = await API.post(endpoint, id ? { ...data, id } : data);

            if (res.success) {
                document.getElementById('cp-modal').classList.add('hidden');
                CheckpointAdmin(App);
                SwalCustom.fire('Berhasil!', 'Data tersimpan.', 'success');
            } else {
                SwalCustom.fire('Gagal!', res.error, 'error');
            }
        };
    }

    if (window.lucide) lucide.createIcons();
};
