import API from '../api.js';
import Sidebar from '../sidebar.js';

export const Visitors = async (App) => {
    document.getElementById('header-container').classList.remove('hidden');
    document.getElementById('page-title').innerText = 'Izin Tamu';
    const user = await App.getUser();
    const userRole = user ? user.role : null;
    await Sidebar.render(user);

    let html = `
        <div class="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 class="text-3xl font-black text-slate-900 tracking-tight mb-2">Manajemen Tamu</h1>
            <p class="text-slate-500 font-medium">Sistem undangan digital untuk keamanan gerbang yang lebih modern.</p>
        </div>

        <div class="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
            <!-- Left: Form & Actions -->
            <div class="xl:col-span-1 space-y-6 sm:space-y-8">
                ${userRole === 'Warga' || userRole === 'Admin' ? `
                    <div class="bg-white p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
                        <div class="flex items-center space-x-4 mb-8">
                            <div class="w-12 h-12 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center">
                                <i data-lucide="user-plus" class="w-6 h-6"></i>
                            </div>
                            <h3 class="text-xl font-black text-slate-900">Buat Undangan</h3>
                        </div>
                        
                        <form id="form-add-visitor" class="space-y-6">
                            <div>
                                <label class="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nama Tamu</label>
                                <input type="text" name="name" required class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all font-semibold" placeholder="Contoh: John Doe">
                            </div>
                            <div>
                                <label class="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">No. HP (Opsional)</label>
                                <input type="tel" name="phone" class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all font-semibold" placeholder="0812...">
                            </div>
                            <div>
                                <label class="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Keperluan</label>
                                <textarea name="purpose" class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all font-semibold" placeholder="Contoh: Silaturahmi / Kurir Paket" rows="2"></textarea>
                            </div>
                            
                            <button type="submit" class="w-full py-5 bg-slate-900 text-white font-black rounded-2xl shadow-xl shadow-slate-200 active:scale-95 transition-all hover:bg-brand-600">
                                GENERATE QR CODE
                            </button>
                        </form>
                    </div>
                ` : ''}

                ${userRole === 'Satpam' || userRole === 'Admin' ? `
                    <div class="bg-slate-900 p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl shadow-slate-900/20 text-white overflow-hidden relative">
                        <div class="relative z-10">
                            <div class="flex items-center space-x-4 mb-6">
                                <div class="w-12 h-12 bg-white/10 text-brand-400 rounded-2xl flex items-center justify-center">
                                    <i data-lucide="scan-line" class="w-6 h-6"></i>
                                </div>
                                <h3 class="text-xl font-black">Scanner Gerbang</h3>
                            </div>
                            <p class="text-slate-400 font-medium mb-8">Gunakan kamera untuk memverifikasi QR tamu di gerbang.</p>
                            <button id="btn-open-scanner" class="w-full py-5 bg-brand-600 text-white font-black rounded-2xl shadow-xl shadow-brand-900/20 active:scale-95 transition-all hover:bg-brand-500 flex items-center justify-center space-x-3">
                                <i data-lucide="camera" class="w-5 h-5"></i>
                                <span>MULAI SCAN QR</span>
                            </button>
                        </div>
                        <!-- Background decoration -->
                        <div class="absolute -right-10 -bottom-10 w-40 h-40 bg-brand-500/10 rounded-full blur-3xl"></div>
                    </div>
                ` : ''}
            </div>

            <!-- Right: Visitor List -->
            <div class="xl:col-span-2">
                <div class="bg-white rounded-[2rem] sm:rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
                    <div class="p-6 sm:p-8 border-b border-slate-50 flex items-center justify-between">
                        <div class="flex items-center space-x-4">
                            <div class="w-12 h-12 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center">
                                <i data-lucide="history" class="w-6 h-6"></i>
                            </div>
                            <div>
                                <h3 class="text-xl font-black text-slate-900">Riwayat Tamu</h3>
                                <p class="text-sm text-slate-400 font-medium">Data kunjungan lingkungan terbaru.</p>
                            </div>
                        </div>
                        <button id="btn-refresh-visitors" class="p-3 hover:bg-slate-50 rounded-xl transition-colors">
                            <i data-lucide="refresh-cw" class="w-5 h-5 text-slate-400"></i>
                        </button>
                    </div>

                    <div id="visitor-list-container" class="p-4 sm:p-8">
                        <div class="flex flex-col items-center justify-center py-20 text-slate-300">
                             <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-300 mb-4"></div>
                             <p class="font-bold uppercase tracking-widest text-[10px]">Memuat data...</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- QR Gallery Modal (Hidden by default) -->
        <div id="qr-modal" class="fixed inset-0 z-[100] hidden">
            <div class="absolute inset-0 bg-slate-900/90 backdrop-blur-sm"></div>
            <div class="absolute inset-x-4 top-1/2 -translate-y-1/2 max-w-sm mx-auto bg-white rounded-[2.5rem] sm:rounded-[3rem] p-8 sm:p-10 text-center animate-in zoom-in duration-300">
                <button id="btn-close-qr" class="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600">
                    <i data-lucide="x" class="w-6 h-6"></i>
                </button>
                <div class="mb-6">
                    <h3 class="text-2xl font-black text-slate-900 mb-2">QR Undangan</h3>
                    <p id="qr-visitor-name" class="text-brand-600 font-black uppercase tracking-widest text-sm"></p>
                </div>
                <div class="bg-slate-50 p-4 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] mb-6 sm:mb-8 flex justify-center border-4 border-slate-100">
                    <div id="qr-display-area" class="[&>img]:max-w-full"></div>
                </div>
                <p class="text-slate-500 text-sm font-medium mb-8">Kirim link QR ini ke tamu bapak via WhatsApp agar lebih praktis.</p>
                <div class="space-y-4">
                    <button id="btn-share-wa" class="w-full py-5 bg-emerald-500 text-white font-black rounded-2xl flex items-center justify-center space-x-3 shadow-xl shadow-emerald-500/20 active:scale-95 transition-all">
                        <i data-lucide="message-circle" class="w-6 h-6"></i>
                        <span>KIRIM VIA WHATSAPP</span>
                    </button>
                    <button id="btn-close-qr-2" class="w-full py-4 bg-slate-100 text-slate-500 font-bold rounded-2xl">
                        TUTUP
                    </button>
                </div>
            </div>
        </div>

        <!-- Scanner Modal (Hidden by default) -->
        <div id="scanner-modal" class="fixed inset-0 z-[100] hidden flex flex-col items-center justify-center">
            <div class="absolute inset-0 bg-slate-900/95 backdrop-blur-md"></div>
            <div class="relative w-full max-w-lg px-6">
                <div class="bg-white overflow-hidden rounded-[3rem] shadow-2xl">
                    <div class="p-6 border-b border-slate-100 flex items-center justify-between">
                        <div class="flex items-center space-x-3">
                            <div class="w-8 h-8 bg-brand-50 text-brand-600 rounded-lg flex items-center justify-center">
                                <i data-lucide="scan" class="w-4 h-4"></i>
                            </div>
                            <span class="font-black text-slate-900 uppercase tracking-tighter text-sm">Scanner QR Tamu</span>
                        </div>
                        <button id="btn-close-scanner" class="p-2 text-slate-400 hover:text-slate-600">
                            <i data-lucide="x" class="w-6 h-6"></i>
                        </button>
                    </div>
                    
                    <div class="p-4 relative">
                        <div id="visitor-reader" class="rounded-2xl overflow-hidden bg-black aspect-square"></div>
                        <div class="absolute inset-8 border-2 border-white/30 border-dashed rounded-2xl pointer-events-none"></div>
                        <div class="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[2px] bg-brand-500 animate-pulse shadow-[0_0_15px_#0ea5e9]"></div>
                    </div>
                    
                    <div class="p-8 text-center bg-slate-50">
                        <p class="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-2">Instruksi</p>
                        <p class="text-sm text-slate-700 font-semibold">Posisikan QR Code tamu di dalam kotak scanner</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    App.container.innerHTML = html;
    if (window.lucide) lucide.createIcons();

    // Elements
    const form = document.getElementById('form-add-visitor');
    const refreshBtn = document.getElementById('btn-refresh-visitors');
    const openScannerBtn = document.getElementById('btn-open-scanner');
    const qrModal = document.getElementById('qr-modal');
    const qrDisplay = document.getElementById('qr-display-area');
    const qrClose = document.getElementById('btn-close-qr');
    const qrClose2 = document.getElementById('btn-share-qr');
    const scannerModal = document.getElementById('scanner-modal');
    const scannerClose = document.getElementById('btn-close-scanner');

    let html5QrScanner = null;

    // Load Data
    const loadVisitors = async () => {
        try {
            const listContainer = document.getElementById('visitor-list-container');
            const data = await API.get('/api/visitors');

            if (data.length === 0) {
                listContainer.innerHTML = `
                    <div class="flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-100">
                        <div class="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-slate-200 mb-6 border border-slate-50">
                            <i data-lucide="user-minus" class="w-10 h-10"></i>
                        </div>
                        <p class="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Belum ada tamu terdaftar</p>
                    </div>
                `;
                lucide.createIcons();
                return;
            }

            let listHtml = `
                <!-- Desktop Table View -->
                <div class="hidden md:block overflow-x-auto -mx-4 sm:mx-0">
                    <table class="w-full text-left">
                         <thead>
                            <tr class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                <th class="px-6 py-4">Tamu</th>
                                <th class="px-6 py-4">Status</th>
                                <th class="px-6 py-4">Host / Tuan Rumah</th>
                                <th class="px-6 py-4">Waktu</th>
                                <th class="px-6 py-4 text-right pr-10">Aksi</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-50">
                            ${data.map(v => {
                let statusClass = 'bg-amber-50 text-amber-600 border-amber-100';
                let statusIcon = 'clock';
                let statusText = 'Belum Datang';

                if (v.status === 'ARRIVED') {
                    statusClass = 'bg-emerald-50 text-emerald-600 border-emerald-100';
                    statusIcon = 'check-circle';
                    statusText = 'ADADA (Di lokasi)';
                } else if (v.status === 'DEPARTED') {
                    statusClass = 'bg-slate-100 text-slate-500 border-slate-200';
                    statusIcon = 'log-out';
                    statusText = 'Sudah Pulang';
                }

                return `
                                    <tr class="group hover:bg-slate-50/50 transition-colors">
                                        <td class="px-6 py-6">
                                            <div class="flex items-center space-x-4">
                                                <div class="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-bold text-sm">
                                                    ${v.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p class="font-bold text-slate-900">${v.name}</p>
                                                    <p class="text-[11px] text-slate-400 font-bold uppercase tracking-tight">${v.purpose || 'Kunjungan'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td class="px-6 py-6" >
                                            <div class="inline-flex items-center px-4 py-1.5 rounded-full border ${statusClass} text-[10px] font-black uppercase tracking-widest">
                                                <i data-lucide="${statusIcon}" class="w-3 h-3 mr-2"></i>
                                                ${statusText}
                                            </div>
                                        </td>
                                        <td class="px-6 py-6">
                                            <p class="text-sm font-bold text-slate-700">${v.host_name}</p>
                                        </td>
                                        <td class="px-6 py-6">
                                             <p class="text-xs font-bold text-slate-500">${new Date(v.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</p>
                                             <p class="text-[10px] font-bold text-slate-400">${new Date(v.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                                        </td>
                                        <td class="px-6 py-6 text-right pr-6">
                                            <div class="flex items-center justify-end space-x-2">
                                                ${v.status === 'PENDING' ? `
                                                    <button onclick="window.showQR('${v.qr_token}', '${v.name}', '${v.phone || ''}')" class="p-3 bg-white border border-slate-100 text-slate-600 rounded-xl hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 shadow-sm transition-all group/btn">
                                                        <i data-lucide="qr-code" class="w-5 h-5"></i>
                                                    </button>
                                                ` : ''}
                                                ${v.status === 'ARRIVED' && (userRole === 'Satpam' || userRole === 'Admin') ? `
                                                     <button onclick="window.checkoutVisitor(${v.id})" class="p-3 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl hover:bg-rose-100 transition-all font-black text-[10px] uppercase tracking-widest">
                                                        Checkout
                                                     </button>
                                                ` : ''}
                                            </div>
                                        </td>
                                    </tr>
                                `;
            }).join('')}
                        </tbody>
                    </table>
                </div>

                <!-- Mobile Card View -->
                <div class="md:hidden space-y-4">
                    ${data.map(v => {
                let statusClass = 'bg-amber-50 text-amber-600 border-amber-100';
                let statusIcon = 'clock';
                let statusText = 'Belum Datang';

                if (v.status === 'ARRIVED') {
                    statusClass = 'bg-emerald-50 text-emerald-600 border-emerald-100';
                    statusIcon = 'check-circle';
                    statusText = 'ADADA (Di lokasi)';
                } else if (v.status === 'DEPARTED') {
                    statusClass = 'bg-slate-100 text-slate-500 border-slate-200';
                    statusIcon = 'log-out';
                    statusText = 'Sudah Pulang';
                }

                return `
                            <div class="p-6 bg-slate-50/50 rounded-[2rem] border border-slate-100 space-y-4">
                                <div class="flex items-start justify-between">
                                    <div class="flex items-center space-x-3">
                                        <div class="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-bold text-sm">
                                            ${v.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p class="font-bold text-slate-900">${v.name}</p>
                                            <p class="text-[10px] text-slate-400 font-bold uppercase tracking-tight">${v.purpose || 'Kunjungan'}</p>
                                        </div>
                                    </div>
                                    <div class="flex items-center px-3 py-1 rounded-full border ${statusClass} text-[8px] font-black uppercase tracking-widest">
                                        <i data-lucide="${statusIcon}" class="w-2.5 h-2.5 mr-1.5"></i>
                                        ${statusText}
                                    </div>
                                </div>
                                
                                <div class="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                                    <div class="text-slate-500 font-semibold">
                                        <p class="text-[9px] uppercase tracking-widest text-slate-400 mb-0.5">Tuan Rumah</p>
                                        ${v.host_name}
                                    </div>
                                    <div class="text-right text-slate-400 italic font-medium">
                                        ${new Date(v.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} • ${new Date(v.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>

                                <div class="flex items-center space-x-2 pt-2">
                                    ${v.status === 'PENDING' ? `
                                        <button onclick="window.showQR('${v.qr_token}', '${v.name}', '${v.phone || ''}')" class="flex-1 py-3 bg-white border border-slate-100 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center">
                                            <i data-lucide="qr-code" class="w-4 h-4 mr-2"></i> Tampilkan QR
                                        </button>
                                    ` : ''}
                                    ${v.status === 'ARRIVED' && (userRole === 'Satpam' || userRole === 'Admin') ? `
                                         <button onclick="window.checkoutVisitor(${v.id})" class="flex-1 py-3 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center">
                                            <i data-lucide="log-out" class="w-4 h-4 mr-2"></i> Checkout
                                         </button>
                                    ` : ''}
                                </div>
                            </div>
                        `;
            }).join('')}
                </div>
            `;
            listContainer.innerHTML = listHtml;
            lucide.createIcons();
        } catch (e) {
            console.error(e);
        }
    };

    // Show QR Logic
    window.showQR = (token, name, phone = '') => {
        qrDisplay.innerHTML = '';
        document.getElementById('qr-visitor-name').innerText = name;
        new QRCode(qrDisplay, {
            text: token,
            width: 200,
            height: 200,
            colorDark: "#0f172a",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });

        const waBtn = document.getElementById('btn-share-wa');
        waBtn.onclick = () => {
            const baseUrl = window.location.origin + window.location.pathname;
            const guestLink = `${baseUrl}#/v/${token}`;
            const message = `Halo ${name},%0A%0AIni adalah Undangan Digital untuk kunjungan ke lingkungan kami. Mohon tunjukkan QR Code pada link berikut ke petugas keamanan saat di gerbang:%0A%0A${guestLink}%0A%0ATerima kasih!`;

            let waUrl = `https://wa.me/?text=${message}`;
            if (phone) {
                const cleanPhone = phone.replace(/\D/g, '');
                const formattedPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.substring(1) : cleanPhone;
                waUrl = `https://wa.me/${formattedPhone}?text=${message}`;
            }
            window.open(waUrl, '_blank');
        };

        qrModal.classList.remove('hidden');
    };

    // Checkout Logic
    window.checkoutVisitor = async (id) => {
        const confirm = await SwalCustom.fire({
            title: 'Konfirmasi Pulang',
            text: 'Tamu sudah meninggalkan lokasi?',
            icon: 'question',
            showCancelButton: true
        });

        if (confirm.isConfirmed) {
            const res = await API.post('/api/visitors/checkout', { id });
            if (res.success) {
                SwalCustom.fire('Berhasil', 'Tamu dicatat telah pulang', 'success');
                loadVisitors();
            }
        }
    };

    // Submission
    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const data = {
                name: formData.get('name'),
                phone: formData.get('phone'),
                purpose: formData.get('purpose')
            };

            const res = await API.post('/api/visitors/add', data);
            if (res.success) {
                form.reset();
                window.showQR(res.qr_token, data.name);
                loadVisitors();
            } else {
                Swal.fire('Gagal', res.error || 'Terjadi kesalahan internal', 'error');
            }
        };
    }

    // Scanner Logic
    const startScanner = async () => {
        scannerModal.classList.remove('hidden');
        html5QrScanner = new Html5Qrcode("visitor-reader");

        const onScanSuccess = async (decodedText) => {
            html5QrScanner.stop();
            scannerModal.classList.add('hidden');

            Swal.fire({
                title: 'Memverifikasi...',
                allowOutsideClick: false,
                didOpen: () => { Swal.showLoading(); }
            });

            try {
                const res = await API.post('/api/visitors/verify', { qr_token: decodedText });
                if (res.success) {
                    await SwalCustom.fire({
                        title: 'Tamu Terverifikasi! ✅',
                        html: `
                            <div class="text-left bg-slate-50 p-6 rounded-[2rem] border border-slate-100 mt-4">
                                <p class="text-[10px] font-black text-slate-400 uppercase mb-2">Nama Tamu</p>
                                <p class="text-xl font-black text-slate-900 mb-4">${res.visitor.name}</p>
                                <p class="text-[10px] font-black text-slate-400 uppercase mb-2">Tujuan (Rumah)</p>
                                <p class="font-bold text-slate-700">${res.visitor.host_name}</p>
                            </div>
                        `,
                        icon: 'success'
                    });
                    loadVisitors();
                } else {
                    Swal.fire('Gagal', res.error || 'QR tidak valid atau sudah kadaluarsa', 'error');
                }
            } catch (err) {
                Swal.fire('Error', 'Kesalahan koneksi', 'error');
            }
        };

        const config = { fps: 10, qrbox: { width: 250, height: 250 } };
        html5QrScanner.start({ facingMode: "environment" }, config, onScanSuccess)
            .catch(err => {
                console.error(err);
                Swal.fire('Kamera Error', 'Gagal mengakses kamera.', 'error');
                scannerModal.classList.add('hidden');
            });
    };

    if (openScannerBtn) openScannerBtn.onclick = startScanner;
    qrClose.onclick = () => qrModal.classList.add('hidden');
    document.getElementById('btn-close-qr-2').onclick = () => qrModal.classList.add('hidden');
    scannerClose.onclick = () => {
        if (html5QrScanner && html5QrScanner.isScanning) {
            html5QrScanner.stop().then(() => {
                scannerModal.classList.add('hidden');
            });
        } else {
            scannerModal.classList.add('hidden');
        }
    };

    refreshBtn.onclick = loadVisitors;
    loadVisitors();
};

export const VisitorGuestView = async (App) => {
    const hash = window.location.hash;
    const token = hash.replace('#/v/', '');

    App.container.innerHTML = `
        <div class="min-h-screen flex items-center justify-center p-6 sm:p-12 animate-in fade-in zoom-in duration-700">
            <div class="max-w-md w-full bg-white rounded-[4rem] p-12 text-center shadow-2xl shadow-slate-200 border border-slate-100">
                <div class="mb-10">
                    <div class="w-20 h-20 bg-brand-50 text-brand-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
                        <i data-lucide="home" class="w-10 h-10"></i>
                    </div>
                    <h1 class="text-3xl font-black text-slate-900 mb-2">Undangan Digital</h1>
                    <p class="text-slate-400 font-bold uppercase tracking-widest text-xs">Sistem Keamanan Lingkungan</p>
                </div>

                <div id="guest-loader" class="py-12">
                    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto"></div>
                </div>

                <div id="guest-content" class="hidden">
                    <div class="bg-slate-50 p-3 rounded-[3rem] border border-slate-100 mb-10 overflow-hidden">
                        <div id="guest-qr-area" class="bg-white p-8 rounded-[2.5rem] shadow-sm flex items-center justify-center"></div>
                    </div>

                    <div class="text-left space-y-6 mb-10">
                         <div class="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 relative">
                            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tamu Terdaftar</p>
                            <p id="guest-name" class="text-xl font-black text-slate-900"></p>
                         </div>
                         <div class="grid grid-cols-2 gap-4">
                            <div class="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 italic">
                                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tujuan Rumah</p>
                                <p id="guest-host" class="text-sm font-bold text-slate-700"></p>
                            </div>
                            <div class="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 italic">
                                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Keperluan</p>
                                <p id="guest-purpose" class="text-sm font-bold text-slate-700"></p>
                            </div>
                         </div>
                    </div>

                    <div class="p-6 bg-amber-50 rounded-3xl border border-amber-100 mb-8">
                        <p class="text-amber-800 text-xs font-bold leading-relaxed">Mohon tunjukkan layar ini kepada petugas keamanan saat tiba di gerbang masuk.</p>
                    </div>
                </div>
                
                <p class="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">&copy; RT-DIGITAL SYSTEM</p>
            </div>
        </div>
    `;

    if (window.lucide) lucide.createIcons();

    try {
        const response = await fetch(`${App.basePath}/api/visitors/public?token=${token}`);
        const data = await response.json();

        document.getElementById('guest-loader').classList.add('hidden');
        if (data.id) {
            document.getElementById('guest-content').classList.remove('hidden');
            document.getElementById('guest-name').innerText = data.name;
            document.getElementById('guest-host').innerText = data.host_name;
            document.getElementById('guest-purpose').innerText = data.purpose || 'Kunjungan';

            new QRCode(document.getElementById('guest-qr-area'), {
                text: data.qr_token,
                width: 250,
                height: 250,
                colorDark: "#0f172a",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
        } else {
            document.getElementById('app-content').innerHTML = `
                <div class="min-h-screen flex items-center justify-center p-12">
                    <div class="text-center">
                        <div class="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-8">
                            <i data-lucide="x-circle" class="w-10 h-10"></i>
                        </div>
                        <h1 class="text-3xl font-black text-slate-900 mb-4">Link Tidak Valid</h1>
                        <p class="text-slate-500 mb-8 font-medium">Maaf, undangan bapak sudah kadaluarsa atau tidak ditemukan.</p>
                        <a href="https://crudworks.com" class="text-brand-600 font-black text-sm uppercase tracking-widest">Digital RT System</a>
                    </div>
                </div>
            `;
            if (window.lucide) lucide.createIcons();
        }
    } catch (e) {
        console.error(e);
        document.getElementById('guest-loader').innerHTML = '<p class="text-rose-500 font-bold">Terjadi kesalahan koneksi.</p>';
    }
};
