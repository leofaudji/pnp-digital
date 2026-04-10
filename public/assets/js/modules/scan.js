import API from '../api.js';

export const Scan = async (App) => {
    document.getElementById('header-container').classList.remove('hidden');
    document.getElementById('page-title').innerText = 'Scanner Active';
    const user = await App.getUser();
    const userRole = user ? user.role : null;

    const scanMode = App.scanMode || 'IN';
    const modeDisplay = {
        'IN': { title: 'Absen Masuk', color: 'emerald', icon: 'log-in' },
        'OUT': { title: 'Absen Pulang', color: 'rose', icon: 'log-out' },
        'CHECKPOINT': { title: 'Checkpoint Patrol', color: 'blue', icon: 'shield-check' }
    }[scanMode];

    App.container.innerHTML = `
        <div class="max-w-2xl mx-auto">
            <div class="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-2xl">
                <div class="flex items-center justify-between mb-8">
                    <div class="flex items-center space-x-4">
                        <div class="w-14 h-14 bg-${modeDisplay.color}-50 text-${modeDisplay.color}-600 rounded-2xl flex items-center justify-center">
                            <i data-lucide="${modeDisplay.icon}" class="w-7 h-7"></i>
                        </div>
                        <div>
                            <h3 class="text-xl font-black text-slate-900">${modeDisplay.title}</h3>
                            <p class="text-sm text-slate-500 font-medium">Point your camera to the QR Code</p>
                        </div>
                    </div>
                    <button onclick="window.location.hash = '#/satpam-portal'" class="p-3 bg-slate-50 text-slate-500 rounded-2xl hover:bg-slate-100 transition-colors">
                        <i data-lucide="x" class="w-6 h-6"></i>
                    </button>
                </div>
                
                <div class="relative group">
                    <div id="reader" class="overflow-hidden rounded-[2rem] border-4 border-slate-50 bg-slate-100 shadow-inner"></div>
                    <div class="absolute inset-0 pointer-events-none border-[12px] border-white/20 rounded-[2rem]"></div>
                    <div class="absolute top-0 left-0 w-full h-[2px] bg-${modeDisplay.color}-400 animate-[scan_2s_infinite] shadow-[0_0_15px_${modeDisplay.color}]"></div>
                </div>
                
                <div class="mt-8 grid grid-cols-2 gap-4">
                    <div class="p-5 bg-${modeDisplay.color}-50/50 rounded-2xl border border-${modeDisplay.color}-100">
                        <p class="text-[10px] font-black text-${modeDisplay.color}-500 uppercase tracking-widest mb-1">Status</p>
                        <p class="text-sm font-black text-${modeDisplay.color}-900 flex items-center">
                            <i data-lucide="loader-2" class="w-3 h-3 mr-2 animate-spin"></i>
                            Searching...
                        </p>
                    </div>
                     <div class="p-5 bg-slate-50 rounded-2xl border border-slate-100/50">
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Target</p>
                        <p class="text-sm font-black text-slate-700 flex items-center">
                            <i data-lucide="target" class="w-3 h-3 mr-2"></i>
                            ${scanMode === 'CHECKPOINT' ? 'Gate QR' : 'Citizen QR'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
        
        <style>
            @keyframes scan {
                0% { top: 0; }
                50% { top: 100%; }
                100% { top: 0; }
            }
            #reader video {
                border-radius: 1.5rem !important;
                object-fit: cover !important;
            }
        </style>
    `;

    const onScanSuccess = async (decodedText) => {
        try {
            if (App.html5Scanner) {
                await App.html5Scanner.stop();
            }

            let notes = null;
            let imageData = null;
            if (scanMode === 'CHECKPOINT') {
                const reportResult = await Swal.fire({
                    title: 'Lapor Temuan?',
                    text: 'Apakah ada insiden atau temuan khusus di titik ini?',
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonText: 'Ya, Ada Temuan',
                    cancelButtonText: 'Tidak, Aman',
                    confirmButtonColor: '#0070f3',
                    cancelButtonColor: '#cbd5e1',
                });

                if (reportResult.isConfirmed) {
                    const { value: formValues } = await Swal.fire({
                        title: 'Detail Temuan & Foto',
                        html: `
                            <div class="text-left">
                                <label class="block text-xs font-black text-slate-400 uppercase mb-2">Catatan Temuan</label>
                                <textarea id="swal-notes" class="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-semibold mb-4" placeholder="Ketik detail temuan di sini..." rows="3"></textarea>
                                
                                <label class="block text-xs font-black text-slate-400 uppercase mb-2">Foto Bukti (Opsional)</label>
                                <div class="relative group">
                                    <input type="file" id="swal-image" accept="image/*" capture="environment" class="hidden">
                                    <button type="button" onclick="document.getElementById('swal-image').click()" class="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold hover:border-brand-500 hover:text-brand-500 transition-all flex flex-col items-center justify-center space-y-2">
                                        <i data-lucide="camera" class="w-8 h-8"></i>
                                        <span id="file-name">Ambil Foto atau Pilih Gambar</span>
                                    </button>
                                    <img id="image-preview" class="hidden mt-4 w-full h-48 object-cover rounded-2xl border border-slate-200">
                                </div>
                            </div>
                        `,
                        didOpen: () => {
                            if (window.lucide) lucide.createIcons();
                            const fileInput = document.getElementById('swal-image');
                            const fileName = document.getElementById('file-name');
                            const preview = document.getElementById('image-preview');
                            fileInput.onchange = (e) => {
                                const file = e.target.files[0];
                                if (file) {
                                    fileName.innerText = file.name;
                                    const reader = new FileReader();
                                    reader.onload = (re) => {
                                        preview.src = re.target.result;
                                        preview.classList.remove('hidden');
                                    };
                                    reader.readAsDataURL(file);
                                }
                            };
                        },
                        focusConfirm: false,
                        preConfirm: () => {
                            return {
                                notes: document.getElementById('swal-notes').value,
                                image: document.getElementById('image-preview').src.startsWith('data:image') ? document.getElementById('image-preview').src : null
                            }
                        },
                        showCancelButton: true,
                        confirmButtonText: 'Kirim Laporan',
                        cancelButtonText: 'Batal',
                    });

                    if (formValues) {
                        notes = formValues.notes;
                        imageData = formValues.image;
                    }
                }
            }

            const result = await API.post(`/api/attendance/scan?_t=${Date.now()}`, {
                qr_code: decodedText,
                type: scanMode,
                notes: notes,
                image: imageData
            });

            if (result.success) {
                await SwalCustom.fire({
                    title: 'Berhasil',
                    text: result.message,
                    icon: 'success'
                });
                window.location.hash = '#/satpam-portal';
            } else {
                await SwalCustom.fire({
                    title: 'Gagal',
                    text: result.error || 'Terjadi kesalahan saat memproses QR.',
                    icon: 'error'
                });
                if (window.location.hash === '#/scan') {
                    startScanning();
                }
            }
        } catch (e) {
            console.error(e);
            await SwalCustom.fire({
                title: 'Error',
                text: 'Koneksi jaringan bermasalah.',
                icon: 'warning'
            });
            if (window.location.hash === '#/scan') {
                startScanning();
            }
        }
    };

    const startScanning = async () => {
        try {
            App.html5Scanner = new Html5Qrcode("reader");
            const config = { fps: 20, qrbox: { width: 280, height: 280 } };
            await App.html5Scanner.start({ facingMode: "environment" }, config, onScanSuccess);
        } catch (err) {
            console.error(err);
            try {
                await App.html5Scanner.start({ facingMode: "user" }, config, onScanSuccess);
            } catch (fallbackErr) {
                SwalCustom.fire({
                    title: 'Kamera Bermasalah',
                    text: 'Tidak dapat mengakses kamera: ' + fallbackErr,
                    icon: 'error'
                });
            }
        }
    };

    setTimeout(startScanning, 300);

    const cleanupScanner = () => {
        if (App.html5Scanner && App.html5Scanner.isScanning) {
            App.html5Scanner.stop().catch(e => console.warn(e));
        }
        window.removeEventListener('hashchange', cleanupScanner);
    };
    window.addEventListener('hashchange', cleanupScanner);

    if (window.lucide) lucide.createIcons();
};

export const SatpamPortal = async (App) => {
    document.getElementById('header-container').classList.remove('hidden');
    document.getElementById('page-title').innerText = 'Satpam Portal';
    const user = await App.getUser();
    const userRole = user ? user.role : null;

    // Initial Loading State
    App.container.innerHTML = `
        <div class="flex flex-col items-center justify-center py-20 animate-in fade-in duration-500">
            <div class="w-20 h-20 bg-brand-50 rounded-[2.5rem] flex items-center justify-center text-brand-600 mb-6 shadow-xl shadow-brand-500/10">
                <i data-lucide="loader-2" class="w-10 h-10 animate-spin"></i>
            </div>
            <h2 class="text-xl font-black text-slate-900 mb-1">Menghubungkan...</h2>
            <p class="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Sinkronisasi status kehadiran anda</p>
        </div>
    `;
    if (window.lucide) lucide.createIcons();

    // Fetch Attendance Status
    const status = await API.get('/api/attendance/status');
    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    App.container.innerHTML = `
        <div class="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
                <h1 class="text-3xl font-black text-slate-900 tracking-tight mb-2">Security Hub</h1>
                <p class="text-slate-500 font-medium italic flex items-center">
                    <span class="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
                    System Time: ${timeStr} WIB
                </p>
            </div>
            <div class="px-6 py-3 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center">
                <div class="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center mr-4">
                    <i data-lucide="user" class="w-5 h-5"></i>
                </div>
                <div>
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Operator</p>
                    <p class="text-sm font-bold text-slate-700">${user.full_name}</p>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-4 duration-700">
            <!-- Absen Masuk -->
            <button id="btn-scan-in" ${status.checkedIn ? 'disabled' : ''} class="group relative bg-white p-8 rounded-[2rem] border-2 ${status.checkedIn ? 'border-emerald-100 opacity-80 cursor-default' : 'border-slate-100 hover:border-emerald-500 hover:shadow-2xl hover:shadow-emerald-500/10'} transition-all duration-300 text-left overflow-hidden">
                <div class="w-16 h-16 ${status.checkedIn ? 'bg-emerald-500 text-white' : 'bg-emerald-50 text-emerald-600'} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <i data-lucide="${status.checkedIn ? 'check-circle' : 'log-in'}" class="w-8 h-8"></i>
                </div>
                <h3 class="text-xl font-black text-slate-900 mb-2">Absen Masuk</h3>
                <p class="text-slate-500 text-sm leading-relaxed mb-4">Scan QR Code di Pos/Gerbang untuk log kedatangan anda.</p>
                
                ${status.checkedIn ? `
                    <div class="flex items-center text-emerald-600 font-black text-sm bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 w-fit">
                        <i data-lucide="clock" class="w-4 h-4 mr-2"></i> Sudah Masuk (${status.checkInTime})
                    </div>
                ` : `
                    <div class="flex items-center text-emerald-600 font-bold text-sm">Open Scanner <i data-lucide="chevron-right" class="w-4 h-4 ml-1"></i></div>
                `}
            </button>

            <!-- Absen Pulang -->
            <button id="btn-scan-out" ${status.checkedOut || !status.checkedIn ? 'disabled' : ''} class="group relative bg-white p-8 rounded-[2rem] border-2 ${status.checkedOut ? 'border-rose-100 opacity-80 cursor-default' : (!status.checkedIn ? 'border-slate-50 opacity-50 cursor-not-allowed' : 'border-slate-100 hover:border-rose-500 hover:shadow-2xl hover:shadow-rose-500/10')} transition-all duration-300 text-left overflow-hidden">
                <div class="w-16 h-16 ${status.checkedOut ? 'bg-rose-500 text-white' : 'bg-rose-50 text-rose-600'} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <i data-lucide="${status.checkedOut ? 'check-circle' : 'log-out'}" class="w-8 h-8"></i>
                </div>
                <h3 class="text-xl font-black text-slate-900 mb-2">Absen Pulang</h3>
                <p class="text-slate-500 text-sm leading-relaxed mb-4">Scan QR Code di Pos/Gerbang untuk log kepulangan anda.</p>
                
                ${status.checkedOut ? `
                    <div class="flex items-center text-rose-600 font-black text-sm bg-rose-50 px-4 py-2 rounded-xl border border-rose-100 w-fit">
                        <i data-lucide="clock" class="w-4 h-4 mr-2"></i> Sudah Pulang (${status.checkOutTime})
                    </div>
                ` : (status.checkedIn ? `
                    <div class="flex items-center text-rose-600 font-bold text-sm">Open Scanner <i data-lucide="chevron-right" class="w-4 h-4 ml-1"></i></div>
                ` : `
                    <div class="flex items-center text-slate-400 font-bold text-sm italic">Belum Absen Masuk</div>
                `)}
            </button>

            <!-- Patroli -->
            <button id="btn-scan-cp" class="group relative bg-white p-8 rounded-[2rem] border-2 border-slate-100 hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 text-left overflow-hidden">
                <div class="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <i data-lucide="shield-check" class="w-8 h-8"></i>
                </div>
                <h3 class="text-xl font-black text-slate-900 mb-2">Patroli Gate</h3>
                <p class="text-slate-500 text-sm leading-relaxed mb-4">Scan QR Code di setiap Gate atau Pos Ronda patroli.</p>
                <div class="flex items-center text-blue-600 font-bold text-sm">Open Scanner <i data-lucide="chevron-right" class="w-4 h-4 ml-1"></i></div>
            </button>
        </div>
    `;

    document.getElementById('btn-scan-in').onclick = () => {
        if (!status.checkedIn) { App.scanMode = 'IN'; window.location.hash = '#/scan'; }
    };
    document.getElementById('btn-scan-out').onclick = () => {
        if (!status.checkedOut && status.checkedIn) { App.scanMode = 'OUT'; window.location.hash = '#/scan'; }
    };
    document.getElementById('btn-scan-cp').onclick = () => {
        App.scanMode = 'CHECKPOINT'; window.location.hash = '#/scan';
    };

    if (window.lucide) lucide.createIcons();
};
