import API from '../api.js';
import Sidebar from '../sidebar.js';

export const CCTV = async (App) => {
    document.getElementById('header-container').classList.remove('hidden');
    document.getElementById('page-title').innerText = 'Monitoring CCTV';
    const user = await App.getUser();
    await Sidebar.render(user ? user.role : null);

    const res = await API.get('/api/cctv');
    const channels = Array.isArray(res) ? res : [];

    let html = `
    <div id="cctv-container" class="space-y-6 pb-20">
        <!-- Header & Controls -->
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0 animate-in fade-in slide-in-from-top-4 duration-500">
            <div>
                <h2 class="text-2xl font-black text-slate-900 tracking-tight">CCTV Command Center</h2>
                <p class="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">
                    <span class="w-2 h-2 bg-emerald-500 rounded-full inline-block mr-1 animate-pulse"></span>
                    Live Monitoring System
                </p>
            </div>
            
            <div class="flex items-center space-x-3">
                ${user.role_id == 1 ? `
                <button id="btn-add-cctv" class="flex items-center px-4 py-2.5 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all shadow-lg active:scale-95">
                    <i data-lucide="plus-circle" class="w-4 h-4 mr-2"></i> Tambah Kamera
                </button>
                ` : ''}
                <button onclick="document.documentElement.requestFullscreen()" class="p-2.5 bg-white text-slate-600 rounded-xl border border-slate-200 hover:bg-slate-50 hover:text-brand-600 transition-all active:scale-95">
                    <i data-lucide="maximize" class="w-5 h-5"></i>
                </button>
            </div>
        </div>

        <!-- Camera Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            ${channels.map(cam => {
        const streamUrl = cam.use_proxy == 1
            ? `${API.basePath}/api/cctv/proxy?url=${encodeURIComponent(cam.stream_url)}`
            : cam.stream_url;

        return `
            <div class="bg-black rounded-2xl overflow-hidden shadow-xl aspect-video relative group animate-in zoom-in-95 duration-700">
                <!-- Video/Stream Placeholder -->
                ${cam.stream_url && cam.stream_url.endsWith('.m3u8') ? `
                    <div class="w-full h-full bg-slate-900 flex items-center justify-center relative">
                        <video id="video-${cam.id}" class="w-full h-full object-cover" muted autoplay playsinline data-url="${streamUrl}"></video>
                        <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                         <!-- Center Play Button (Zoom) -->
                        <button onclick='window.zoomCCTV(${JSON.stringify(cam).replace(/'/g, "&apos;")})' class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-10">
                            <div class="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center hover:scale-110 transition-transform">
                                <i data-lucide="maximize-2" class="w-8 h-8 text-white"></i>
                            </div>
                        </button>
                    </div>
                ` : `
                    <div class="w-full h-full bg-slate-800 flex flex-col items-center justify-center text-slate-500">
                        <i data-lucide="video-off" class="w-12 h-12 mb-2 opacity-50"></i>
                        <span class="text-[10px] font-black uppercase tracking-widest">${cam.stream_url ? 'Invalid Stream' : 'Signal Lost'}</span>
                    </div>
                `}

                <!-- Overlay Info -->
                <div class="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none z-20">
                    <div class="bg-red-600/90 backdrop-blur-sm text-white text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-widest flex items-center shadow-lg">
                        <span class="w-1.5 h-1.5 bg-white rounded-full mr-1.5 animate-pulse"></span> REC
                    </div>
                    <div class="flex space-x-2 pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity translate-y-[-10px] group-hover:translate-y-0 duration-300">
                        ${user.role_id == 1 ? `
                        <button onclick="window.deleteCCTV(${cam.id})" class="p-1.5 bg-black/50 hover:bg-red-600 text-white rounded-lg backdrop-blur-md transition-colors">
                            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                        </button>
                        <button onclick='window.editCCTV(${JSON.stringify(cam).replace(/'/g, "&apos;")})' class="p-1.5 bg-black/50 hover:bg-brand-600 text-white rounded-lg backdrop-blur-md transition-colors">
                            <i data-lucide="settings-2" class="w-3.5 h-3.5"></i>
                        </button>
                        ` : ''}
                         <button onclick='window.zoomCCTV(${JSON.stringify(cam).replace(/'/g, "&apos;")})' class="p-1.5 bg-black/50 hover:bg-blue-500 text-white rounded-lg backdrop-blur-md transition-colors">
                            <i data-lucide="maximize-2" class="w-3.5 h-3.5"></i>
                        </button>
                    </div>
                </div>

                <div class="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent pointer-events-none z-20">
                    <h3 class="text-white font-bold text-sm shadow-black/50 drop-shadow-md">${cam.name}</h3>
                    <p class="text-slate-300 text-[10px] font-medium uppercase tracking-widest mt-0.5 flex items-center">
                        <i data-lucide="map-pin" class="w-3 h-3 mr-1"></i> ${cam.location || 'Unknown Location'}
                    </p>
                     ${cam.use_proxy == 1 ? `<span class="absolute right-4 bottom-4 text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">PROXY</span>` : ''}
                </div>
            </div>
            `;
    }).join('')}

            ${channels.length === 0 ? `
            <div class="col-span-full py-20 text-center">
                <div class="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                    <i data-lucide="camera-off" class="w-8 h-8 text-slate-400"></i>
                </div>
                <h3 class="text-slate-900 font-bold text-lg">Belum ada kamera</h3>
                <p class="text-slate-500 text-sm mt-1">Tambahkan kamera CCTV untuk mulai memantau.</p>
            </div>
            ` : ''}
        </div>
    </div>

    <!-- Zoom Modal -->
    <div id="cctv-zoom-modal" class="fixed inset-0 bg-black/95 backdrop-blur-md hidden z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
        <button onclick="window.closeZoom()" class="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-50">
            <i data-lucide="x" class="w-6 h-6"></i>
        </button>
        <div class="w-full max-w-6xl aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl relative">
             <video id="zoom-video" class="w-full h-full object-contain" controls autoplay playsinline></video>
             <div class="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
                <h2 id="zoom-title" class="text-2xl font-black text-white tracking-tight drop-shadow-lg">Camera Name</h2>
                <div class="flex items-center text-red-500 font-bold uppercase tracking-widest text-xs mt-1">
                    <span class="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></span> Live Feed
                </div>
             </div>
        </div>
    </div>

    <!-- Add/Edit CCTV Modal -->
    <div id="cctv-modal" class="fixed inset-0 bg-slate-900/80 backdrop-blur-sm hidden flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
        <div class="bg-white w-full max-w-md rounded-[2rem] shadow-2xl p-8 border border-slate-100 scale-95 transition-transform duration-300" id="cctv-modal-content">
            <div class="flex items-center mb-6">
                <div class="p-3 bg-slate-900 rounded-2xl mr-4 text-white shadow-lg shadow-slate-900/20">
                    <i data-lucide="video" class="w-6 h-6"></i>
                </div>
                <div>
                    <h3 class="text-xl font-black text-slate-900 tracking-tight" id="modal-title">Tambah Kamera</h3>
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Konfigurasi stream CCTV</p>
                </div>
            </div>
            
            <form id="cctv-form" class="space-y-5">
                <input type="hidden" id="cam-id">
                <div class="space-y-4">
                    <div>
                        <label class="block text-[10px] font-black text-slate-400 uppercase ml-1 mb-1.5">Nama Kamera</label>
                        <input id="cam-name" type="text" placeholder="Misal: Gerbang Depan" class="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-700 focus:bg-white focus:border-brand-500 transition-all" required>
                    </div>
                    <div>
                        <label class="block text-[10px] font-black text-slate-400 uppercase ml-1 mb-1.5">Lokasi</label>
                        <input id="cam-loc" type="text" placeholder="Misal: Pos Satpam Blok A" class="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-semibold text-slate-700 focus:bg-white focus:border-brand-500 transition-all">
                    </div>
                    <div>
                        <label class="block text-[10px] font-black text-slate-400 uppercase ml-1 mb-1.5">Stream URL (HLS/M3U8)</label>
                        <input id="cam-url" type="url" placeholder="https://..." class="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-mono text-xs text-slate-600 focus:bg-white focus:border-brand-500 transition-all" required>
                    </div>
                    
                    <div class="flex items-center space-x-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <input type="checkbox" id="cam-proxy" class="w-5 h-5 rounded-lg border-slate-300 text-brand-600 focus:ring-brand-500">
                        <div>
                            <label for="cam-proxy" class="block text-sm font-bold text-slate-700">Gunakan Proxy Server</label>
                            <p class="text-[10px] text-slate-400">Aktifkan ini jika stream tidak muncul karena blokir CORS.</p>
                        </div>
                    </div>
                </div>
                
                <div class="flex space-x-3 pt-4">
                    <button type="button" onclick="document.getElementById('cctv-modal').classList.add('hidden')" class="flex-1 py-4 bg-slate-50 text-slate-500 font-bold rounded-2xl hover:bg-slate-100 transition-colors">Batal</button>
                    <button type="submit" class="flex-1 py-4 bg-slate-900 text-white font-black rounded-2xl shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all active:scale-95">Simpan</button>
                </div>
            </form>
        </div>
    </div>
    `;

    App.container.innerHTML = html;

    // Load HLS.js for streams
    if (!window.Hls) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
        script.onload = () => initPlayers(channels);
        document.head.appendChild(script);
    } else {
        initPlayers(channels);
    }

    if (window.lucide) lucide.createIcons();

    // Event Handlers
    const btnAdd = document.getElementById('btn-add-cctv');
    if (btnAdd) {
        btnAdd.onclick = () => {
            document.getElementById('cctv-form').reset();
            document.getElementById('cam-id').value = '';
            document.getElementById('cam-proxy').checked = false;
            document.getElementById('modal-title').innerText = 'Tambah Kamera';
            document.getElementById('cctv-modal').classList.remove('hidden');
            document.getElementById('cctv-modal-content').classList.remove('scale-95');
            document.getElementById('cctv-modal-content').classList.add('scale-100');
        };
    }

    window.editCCTV = (cam) => {
        document.getElementById('cam-id').value = cam.id;
        document.getElementById('cam-name').value = cam.name;
        document.getElementById('cam-loc').value = cam.location || '';
        document.getElementById('cam-url').value = cam.stream_url;
        document.getElementById('cam-proxy').checked = cam.use_proxy == 1;

        document.getElementById('modal-title').innerText = 'Edit Kamera';
        document.getElementById('cctv-modal').classList.remove('hidden');
        document.getElementById('cctv-modal-content').classList.remove('scale-95');
        document.getElementById('cctv-modal-content').classList.add('scale-100');
    };

    const form = document.getElementById('cctv-form');
    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            const id = document.getElementById('cam-id').value;
            const url = id ? '/api/cctv/update' : '/api/cctv';

            const payload = {
                name: document.getElementById('cam-name').value,
                location: document.getElementById('cam-loc').value,
                stream_url: document.getElementById('cam-url').value,
                use_proxy: document.getElementById('cam-proxy').checked ? 1 : 0
            };

            if (id) payload.id = id;

            const res = await API.post(url, payload);

            if (res.success) {
                document.getElementById('cctv-modal').classList.add('hidden');
                await CCTV(App);
                SwalCustom.fire('Berhasil', id ? 'Data dapat diperbarui' : 'Kamera baru telah ditambahkan', 'success');
            }
        };
    }

    window.deleteCCTV = async (id) => {
        const confirm = await SwalCustom.fire({
            title: 'Hapus Kamera?',
            text: 'Tindakan ini tidak dapat dibatalkan.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ya, Hapus',
            cancelButtonText: 'Batal'
        });

        if (confirm.isConfirmed) {
            const res = await API.post(`/api/cctv/delete?id=${id}`);
            if (res.success) await CCTV(App);
        }
    };

    // Zoom Logic with Proxy support
    let zoomHls = null;
    window.zoomCCTV = (cam) => {
        const modal = document.getElementById('cctv-zoom-modal');
        const video = document.getElementById('zoom-video');
        const title = document.getElementById('zoom-title');

        title.innerText = cam.name;
        modal.classList.remove('hidden');

        const streamUrl = cam.use_proxy == 1
            ? `${API.basePath}/api/cctv/proxy?url=${encodeURIComponent(cam.stream_url)}`
            : cam.stream_url;

        if (Hls.isSupported()) {
            if (zoomHls) zoomHls.destroy();
            zoomHls = new Hls();
            zoomHls.loadSource(streamUrl);
            zoomHls.attachMedia(video);
            zoomHls.on(Hls.Events.MANIFEST_PARSED, function () {
                video.play();
            });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = streamUrl;
            video.addEventListener('loadedmetadata', function () {
                video.play();
            });
        }
    };

    window.closeZoom = () => {
        const modal = document.getElementById('cctv-zoom-modal');
        const video = document.getElementById('zoom-video');

        video.pause();
        if (zoomHls) {
            zoomHls.destroy();
            zoomHls = null;
        }
        modal.classList.add('hidden');
    };
};

const initPlayers = (channels) => {
    channels.forEach(cam => {
        const video = document.getElementById(`video-${cam.id}`);
        // We use data-url attribute which contains the proxied URL if needed
        const streamUrl = video ? video.getAttribute('data-url') : cam.stream_url;

        if (video && streamUrl && cam.stream_url.endsWith('.m3u8')) {
            if (Hls.isSupported()) {
                const hls = new Hls();
                hls.loadSource(streamUrl);
                hls.attachMedia(video);
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = streamUrl;
            }
        }
    });
};
