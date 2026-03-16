import API from '../api.js';
import Sidebar from '../sidebar.js';

export const Dashboard = async (App) => {
    const user = await App.getUser();
    if (!user || user.error) {
        window.location.hash = '#/login';
        return;
    }

    document.getElementById('header-container').classList.remove('hidden');
    document.getElementById('sidebar-container').classList.remove('hidden');
    document.getElementById('user-name').innerText = user.full_name;
    document.getElementById('user-initial').innerText = user.full_name.charAt(0).toUpperCase();
    document.getElementById('page-title').innerText = 'Dashboard';

    // Render Sidebar
    await Sidebar.render(user);

    const stats = await API.get('/api/dashboard');
    const settings = await API.get('/api/settings');

    const formatTime = (isoString) => {
        const date = new Date(isoString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    };

    const role = (user.role || '').toLowerCase();

    App.container.innerHTML = `
        <div class="mb-10 animate-in fade-in slide-in-from-top-4 duration-700 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div class="flex items-center space-x-5">
                <div class="relative">
                    <div class="w-16 h-16 rounded-[2rem] bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white shadow-xl shadow-brand-500/20">
                        <i data-lucide="layout-dashboard" class="w-8 h-8"></i>
                    </div>
                    <div class="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-4 border-slate-50 rounded-full shadow-sm"></div>
                </div>
                <div>
                    <h1 class="text-3xl font-black text-slate-900 tracking-tight leading-tight">Command Center</h1>
                    <p class="text-slate-500 font-medium tracking-tight">Halo, <span class="text-brand-600 font-bold">${user.full_name}</span>. Semua sistem terpantau aman.</p>
                </div>
            </div>
            
            <div class="flex items-center gap-4">
                <!-- Emergency Pulse Button -->
                <button id="btn-emergency" class="group relative flex items-center px-6 py-4 bg-rose-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-rose-500/20 hover:bg-rose-600 transition-all active:scale-95 overflow-hidden">
                    <span class="absolute inset-0 bg-white/20 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500"></span>
                    <span class="relative flex items-center">
                        <span class="w-2 h-2 bg-white rounded-full mr-3 animate-ping"></span>
                        Bantuan Darurat
                    </span>
                </button>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 ${role !== 'satpam' ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-6 mb-12 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            <!-- Warga Stat -->
            <div class="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden relative">
                <div class="absolute -right-4 -top-4 w-24 h-24 bg-blue-50/50 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                <div class="flex items-center justify-between mb-6 relative z-10">
                    <div class="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform shadow-sm">
                        <i data-lucide="users" class="w-6 h-6"></i>
                    </div>
                </div>
                <h3 class="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1 relative z-10">Total Warga</h3>
                <p class="text-3xl font-black text-slate-900 relative z-10">${stats.total_warga || 0}</p>
            </div>
            
            <!-- Financial Stat (Hidden for Satpam) -->
            ${role !== 'satpam' ? `
            <div class="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden relative">
                <div class="absolute -right-4 -top-4 w-24 h-24 ${role !== 'satpam' ? 'bg-emerald-50/50' : 'bg-amber-50/50'} rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                ${role !== 'satpam' && role !== 'warga' ? `
                    <div class="flex items-center justify-between mb-6 relative z-10">
                        <div class="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform shadow-sm">
                            <i data-lucide="wallet" class="w-6 h-6"></i>
                        </div>
                    </div>
                    <h3 class="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1 relative z-10">Saldo Kas RT</h3>
                    <p class="text-xl font-black text-slate-900 relative z-10">Rp ${parseInt(stats.saldo_kas || 0).toLocaleString('id-ID')}</p>
                ` : `
                    <div class="flex items-center justify-between mb-6 relative z-10">
                        <div class="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform shadow-sm">
                            <i data-lucide="receipt" class="w-6 h-6"></i>
                        </div>
                    </div>
                    <h3 class="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1 relative z-10">Tunggakan Iuran</h3>
                    <p class="text-2xl font-black text-slate-900 relative z-10">${stats.unpaid_invoices || 0} <span class="text-xs font-bold text-slate-400 font-sans tracking-normal">Bln</span></p>
                `}
            </div>
            ` : ''}

            <!-- Attendance Stat -->
            <div class="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden relative">
                <div class="absolute -right-4 -top-4 w-24 h-24 bg-orange-50/50 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                <div class="flex items-center justify-between mb-6 relative z-10">
                    <div class="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform shadow-sm">
                        <i data-lucide="calendar-check" class="w-6 h-6"></i>
                    </div>
                    <span class="text-[8px] font-black text-orange-600 bg-orange-50 px-2 py-1 rounded-lg uppercase tracking-widest border border-orange-100">Live</span>
                </div>
                <h3 class="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1 relative z-10">Absensi Hari Ini</h3>
                <p class="text-3xl font-black text-slate-900 relative z-10">${stats.absensi_today || 0}</p>
            </div>

            <!-- Patrol Coverage Stat -->
            <div class="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden relative">
                <div class="absolute -right-4 -top-4 w-24 h-24 bg-indigo-50/50 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                <div class="flex items-center justify-between mb-6 relative z-10">
                    <div class="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform shadow-sm">
                        <i data-lucide="shield" class="w-6 h-6"></i>
                    </div>
                    <span class="text-[8px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg uppercase tracking-widest border border-indigo-100">${stats.patrol_coverage || 0}%</span>
                </div>
                <h3 class="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1 relative z-10">Cakupan Patroli</h3>
                <div class="flex items-end space-x-2 relative z-10">
                    <p class="text-3xl font-black text-slate-900">${stats.scanned_today || 0}</p>
                    <p class="text-xs font-bold text-slate-400 mb-1">/ ${stats.total_checkpoints || 0} Titik</p>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <!-- LEFT COLUMN (70%) -->
            <div class="lg:col-span-8 flex flex-col space-y-10">
                
                <!-- Fund Transparency Widget (For Warga/Admin/Bendahara) -->
                ${role !== 'satpam' ? `
                <div class="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                    <div class="flex items-center justify-between mb-8">
                        <div>
                            <h3 class="text-xl font-bold text-slate-900 tracking-tight">Transparansi Dana RT</h3>
                            <p class="text-xs text-slate-400 font-medium">Alokasi pengeluaran bulan ini</p>
                        </div>
                        <button onclick="window.location.hash = '#/analytics'" class="text-[10px] font-black text-brand-600 bg-brand-50 px-3 py-1.5 rounded-xl uppercase tracking-widest hover:bg-brand-600 hover:text-white transition-all">
                            Detail Analitik
                        </button>
                    </div>
                    
                    <div class="flex flex-col md:flex-row items-center gap-8">
                        <div class="w-full md:w-1/2 h-64 relative">
                            <canvas id="transparencyChart"></canvas>
                        </div>
                        <div id="allocation-legend" class="w-full md:w-1/2 grid grid-cols-1 gap-2">
                             <!-- Legend items will be injected here -->
                        </div>
                    </div>
                </div>
                ` : ''}
                
                <!-- Quick Access Grid -->
                <div class="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                    <div class="absolute -right-20 -top-20 w-64 h-64 bg-slate-50 rounded-full group-hover:scale-110 transition-transform duration-1000"></div>
                    <div class="relative z-10">
                        <div class="flex items-center justify-between mb-8">
                            <div>
                                <h3 class="text-xl font-bold text-slate-900 tracking-tight">Akses Cepat</h3>
                                <p class="text-xs text-slate-400 font-medium">Navigasi instan ke fitur utama</p>
                            </div>
                            <div class="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                                <i data-lucide="zap" class="w-5 h-5"></i>
                            </div>
                        </div>
                        
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                            ${(() => {
            let buttons = [];
            if (role === 'satpam') {
                buttons = [
                    { label: 'Scanner', path: '#/satpam-portal', icon: 'shield', color: 'brand' },
                    { label: 'Absensi', path: '#/attendance', icon: 'clock', color: 'blue' },
                    { label: 'Slip Gaji', path: '#/salary', icon: 'file-text', color: 'emerald' },
                    { label: 'SOP', path: '#/sop', icon: 'book-open', color: 'amber' }
                ];
            } else if (role === 'warga') {
                buttons = [
                    { label: 'Tagihan', path: '#/invoice-resident', icon: 'wallet', color: 'rose' },
                    { label: 'Kas RT', path: '#/finance', icon: 'banknote', color: 'emerald' },
                    { label: 'Satpam Hub', path: '#/attendance', icon: 'shield', color: 'blue' },
                    { label: 'Identitas', path: '#/my-qr', icon: 'qr-code', color: 'indigo' }
                ];
            } else { // Admin / Bendahara
                buttons = [
                    { label: 'Scanner', path: '#/satpam-portal', icon: 'shield', color: 'brand' },
                    { label: 'Keuangan', path: '#/finance', icon: 'banknote', color: 'emerald' },
                    { label: 'Tagihan', path: '#/invoice-admin', icon: 'receipt', color: 'indigo' },
                    { label: 'Warga', path: '#/warga', icon: 'users', color: 'blue' }
                ];
            }

            return buttons.map(btn => `
                                    <button onclick="window.location.hash = '${btn.path}'" class="p-4 bg-slate-50 hover:bg-${btn.color === 'brand' ? 'brand-600' : btn.color + '-600'} hover:text-white rounded-3xl transition-all group/btn flex flex-col items-center text-center">
                                        <div class="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-${btn.color === 'brand' ? 'brand-600' : btn.color + '-600'} group-hover/btn:bg-white/20 group-hover/btn:text-white mb-3 shadow-sm transition-colors">
                                            <i data-lucide="${btn.icon}" class="w-6 h-6"></i>
                                        </div>
                                        <span class="text-[10px] font-black uppercase tracking-widest">${btn.label}</span>
                                    </button>
                                `).join('');
        })()}
                        </div>
                    </div>
                </div>

                <!-- Patrol Findings Carousel -->
                ${(stats.patrol_findings || []).length > 0 ? `
                <div class="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden">
                    <div class="flex items-center justify-between mb-8">
                        <div>
                            <h3 class="text-xl font-bold text-slate-900 tracking-tight">Temuan Lapangan</h3>
                            <p class="text-xs text-slate-400 font-medium">Laporan visual kondisi lingkungan</p>
                        </div>
                        <div class="flex gap-2">
                             <button class="p-2 bg-slate-50 rounded-xl text-slate-400 hover:bg-slate-100 transition-colors">
                                <i data-lucide="camera" class="w-5 h-5"></i>
                             </button>
                        </div>
                    </div>
                    
                    <div class="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-4 scrollbar-hide">
                        ${(stats.patrol_findings || []).map(finding => `
                            <div class="snap-start shrink-0 w-72 bg-slate-50 rounded-[2rem] border border-slate-100 overflow-hidden group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500">
                                ${finding.image_proof ? `
                                <div class="h-44 bg-slate-200 relative overflow-hidden cursor-zoom-in btn-preview-image" data-image="${API.basePath}/uploads/patrol/${finding.image_proof}" data-caption="${finding.checkpoint_name}">
                                    <img src="${API.basePath}/uploads/patrol/${finding.image_proof}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700">
                                    <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity"></div>
                                    <div class="absolute bottom-4 left-4">
                                        <span class="text-[9px] font-black text-white bg-brand-500 px-2 py-1 rounded-lg uppercase tracking-widest">${formatTime(finding.timestamp)}</span>
                                    </div>
                                </div>
                                ` : `
                                <div class="h-44 bg-slate-100 flex flex-col items-center justify-center text-slate-300">
                                    <i data-lucide="file-text" class="w-12 h-12 mb-2"></i>
                                    <span class="text-[9px] font-black uppercase tracking-widest text-slate-400">Tanpa Foto</span>
                                </div>
                                `}
                                <div class="p-6">
                                    <h4 class="font-bold text-slate-900 text-sm mb-2 line-clamp-1">${finding.checkpoint_name}</h4>
                                    <p class="text-xs text-slate-500 leading-relaxed line-clamp-2 h-8 mb-4">
                                        ${finding.notes ? finding.notes : '<span class="italic text-slate-300 font-medium">Laporan rutin tanpa temuan khusus.</span>'}
                                    </p>
                                    <div class="flex items-center pt-4 border-t border-slate-200/60">
                                        <div class="w-6 h-6 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 text-[9px] font-black mr-2">${finding.satpam_name.charAt(0)}</div>
                                        <p class="text-[10px] text-slate-400 font-bold uppercase tracking-tight">${finding.satpam_name}</p>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : `
                <div class="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-sm text-center flex flex-col items-center">
                    <div class="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200 mb-6 group-hover:scale-110 transition-transform">
                        <i data-lucide="camera-off" class="w-10 h-10"></i>
                    </div>
                    <h3 class="text-lg font-bold text-slate-900 mb-2">Tidak Ada Temuan</h3>
                    <p class="text-sm text-slate-400 max-w-xs font-medium">Semua titik patroli dilaporkan dalam kondisi aman dan terkendali hari ini.</p>
                </div>
                `}

                <!-- Patrol Status Checklist (Satpam, Admin & Warga) -->
                ${(role === 'satpam' || role === 'admin' || role === 'warga') ? `
                <div class="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden mt-8">
                    <div class="flex items-center justify-between mb-6">
                        <div>
                            <h3 class="text-xl font-bold text-slate-900 tracking-tight">Status Patroli</h3>
                            <div class="flex items-center gap-2 mt-1">
                                <span class="text-[10px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-lg uppercase tracking-widest border border-indigo-100">Shift ${stats.current_shift?.name || '-'}</span>
                                <span class="text-[10px] font-bold text-slate-400 tracking-tight">${new Date(stats.current_shift?.start).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} - ${new Date(stats.current_shift?.end).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Progress Bar -->
                    <div class="flex items-center gap-4 mb-8">
                        <div class="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                            <div class="bg-indigo-500 h-3 rounded-full transition-all duration-1000 ease-out relative" style="width: ${stats.patrol_coverage || 0}%">
                                 <div class="absolute inset-0 bg-white/30 animate-[shimmer_2s_infinite]"></div>
                            </div>
                        </div>
                        <span class="text-xs font-black text-indigo-600">${stats.patrol_coverage || 0}%</span>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-80 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                        ${(stats.patrol_status || []).map(point => `
                            <div class="flex items-center p-3 rounded-2xl border ${point.status === 'scanned' ? 'bg-emerald-50/50 border-emerald-100' : 'bg-slate-50/50 border-slate-100'} transition-all hover:scale-[1.02] group">
                                <div class="w-10 h-10 rounded-xl flex items-center justify-center mr-3 shadow-sm ${point.status === 'scanned' ? 'bg-emerald-100 text-emerald-600' : 'bg-white text-slate-300'}">
                                    <i data-lucide="${point.status === 'scanned' ? 'check-circle-2' : 'circle'}" class="w-5 h-5"></i>
                                </div>
                                <div class="flex-1 min-w-0">
                                    <h4 class="text-xs font-bold ${point.status === 'scanned' ? 'text-emerald-900' : 'text-slate-500'} truncate">${point.name}</h4>
                                    <p class="text-[10px] text-slate-400 truncate">Titik Pantau</p>
                                </div>
                                ${point.status === 'scanned' ? `
                                    <div class="text-right">
                                        <span class="text-[9px] font-black text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-lg uppercase tracking-tight">${new Date(point.scanned_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
            </div>

            <!-- RIGHT COLUMN (30%) -->
            <div class="lg:col-span-4 flex flex-col gap-8">
                
                <!-- Inspiration Card (Old Quote Moved & Re-styled) -->
                <div id="quote-card" class="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden group min-h-[160px] flex flex-col justify-center">
                    <i data-lucide="quote" class="w-24 h-24 absolute -right-6 -top-6 text-white/5 group-hover:scale-110 transition-transform duration-1000"></i>
                    <div class="relative z-10">
                        <p id="quote-text" class="text-sm font-medium text-slate-200 italic leading-relaxed mb-4 transition-all duration-500 opacity-0 transform translate-y-2">Loading...</p>
                        <div class="flex items-center">
                            <div class="w-6 h-1 bg-brand-500 rounded-full mr-3"></div>
                            <p id="quote-author" class="text-[10px] text-brand-400 font-black uppercase tracking-widest opacity-0 transition-all duration-500 delay-100">WISDOM</p>
                        </div>
                    </div>
                </div>

                <!-- Activity Feed Card (Hidden for Satpam) -->
                ${role !== 'satpam' ? `
                <div class="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex-1">
                    <div class="flex items-center justify-between mb-8">
                        <h3 class="text-xl font-bold text-slate-900 tracking-tight">Log Aktivitas</h3>
                        <div class="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                             <i data-lucide="activity" class="w-5 h-5"></i>
                        </div>
                    </div>
                    <div class="space-y-8 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-50">
                        ${(stats.recent_activities || []).length > 0 ? (stats.recent_activities || []).map(act => {
            let icon = 'info';
            let iconColor = 'slate';
            if (act.type === 'user') { icon = 'user-plus'; iconColor = 'blue'; }
            if (act.type === 'finance') { icon = 'banknote'; iconColor = 'emerald'; }
            if (act.type === 'patrol') { icon = 'shield'; iconColor = 'brand'; }

            return `
                                <div class="flex items-start space-x-4 relative">
                                    <div class="w-10 h-10 rounded-2xl bg-${iconColor}-50 flex items-center justify-center text-${iconColor}-600 z-10 shadow-sm border border-white">
                                        <i data-lucide="${icon}" class="w-5 h-5"></i>
                                    </div>
                                    <div class="flex-1 min-w-0 pt-1">
                                        <div class="flex items-center justify-between mb-1">
                                            <p class="text-xs font-black text-slate-900 uppercase tracking-tight">${act.title}</p>
                                            <span class="text-[9px] font-black text-slate-300 uppercase tracking-tighter whitespace-nowrap ml-2">${formatTime(act.time)}</span>
                                        </div>
                                        <p class="text-xs text-slate-500 font-medium truncate">${act.description}</p>
                                    </div>
                                </div>
                            `;
        }).join('') : `
                            <div class="py-10 text-center">
                                <p class="text-xs text-slate-300 font-bold uppercase tracking-widest italic">Hening hari ini...</p>
                            </div>
                        `}
                    </div>
                </div>
                ` : ''}
            </div>
        </div>

        <!-- Emergency Modal -->
        <div id="emergency-modal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-md hidden flex items-center justify-center p-4 z-50">
            <div class="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 border border-slate-100">
                <div class="bg-rose-600 p-8 text-white relative overflow-hidden">
                    <i data-lucide="phone-call" class="w-24 h-24 absolute -right-4 -bottom-4 opacity-20"></i>
                    <h3 class="text-2xl font-black mb-2 relative z-10">Kontak Darurat</h3>
                    <p class="text-rose-100 text-xs font-medium relative z-10 leading-relaxed">
                        Gunakan nomor di bawah ini hanya untuk situasi darurat yang membutuhkan penanganan segera.
                    </p>
                </div>
                <div class="p-8 space-y-4">
                    <a href="tel:${settings.emergency_police || ''}" class="flex items-center p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-rose-200 hover:bg-white transition-all group">
                        <div class="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-rose-600 shadow-sm mr-4 group-hover:scale-110 transition-transform">
                            <i data-lucide="shield-alert" class="w-6 h-6"></i>
                        </div>
                        <div class="flex-1">
                            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Polisi</p>
                            <p class="text-base font-bold text-slate-900">${settings.emergency_police || 'Panggilan 110'}</p>
                        </div>
                        <i data-lucide="chevron-right" class="w-4 h-4 text-slate-300"></i>
                    </a>

                    <a href="tel:${settings.emergency_health || ''}" class="flex items-center p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-rose-200 hover:bg-white transition-all group">
                        <div class="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-rose-600 shadow-sm mr-4 group-hover:scale-110 transition-transform">
                            <i data-lucide="ambulance" class="w-6 h-6"></i>
                        </div>
                        <div class="flex-1">
                            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kesehatan / RS</p>
                            <p class="text-base font-bold text-slate-900">${settings.emergency_health || 'Panggilan 118'}</p>
                        </div>
                        <i data-lucide="chevron-right" class="w-4 h-4 text-slate-300"></i>
                    </a>

                    <a href="tel:${settings.emergency_fire || ''}" class="flex items-center p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-rose-200 hover:bg-white transition-all group">
                        <div class="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-rose-600 shadow-sm mr-4 group-hover:scale-110 transition-transform">
                            <i data-lucide="flame" class="w-6 h-6"></i>
                        </div>
                        <div class="flex-1">
                            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pemadam</p>
                            <p class="text-base font-bold text-slate-900">${settings.emergency_fire || 'Panggilan 113'}</p>
                        </div>
                        <i data-lucide="chevron-right" class="w-4 h-4 text-slate-300"></i>
                    </a>

                    <a href="tel:${settings.emergency_security || ''}" class="flex items-center p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-rose-200 hover:bg-white transition-all group">
                        <div class="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-rose-600 shadow-sm mr-4 group-hover:scale-110 transition-transform">
                            <i data-lucide="shield" class="w-6 h-6"></i>
                        </div>
                        <div class="flex-1">
                            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pos Keamanan</p>
                            <p class="text-base font-bold text-slate-900">${settings.emergency_security || 'Hubungi Satpam'}</p>
                        </div>
                        <i data-lucide="chevron-right" class="w-4 h-4 text-slate-300"></i>
                    </a>

                    <button id="btn-close-emergency" class="w-full py-4 bg-slate-100 text-slate-600 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition-colors mt-4">
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('btn-emergency').onclick = () => {
        document.getElementById('emergency-modal').classList.remove('hidden');
    };

    document.getElementById('btn-close-emergency').onclick = () => {
        document.getElementById('emergency-modal').classList.add('hidden');
    };

    // Image Preview Handlers
    document.querySelectorAll('.btn-preview-image').forEach(btn => {
        btn.onclick = () => {
            const imageUrl = btn.dataset.image;
            const caption = btn.dataset.caption;
            SwalCustom.fire({
                imageUrl: imageUrl,
                imageAlt: caption || 'Bukti Lapangan',
                title: caption || 'Bukti Lapangan',
                showConfirmButton: false,
                showCloseButton: true,
                width: 'auto',
                customClass: {
                    popup: 'rounded-[2rem] overflow-hidden',
                    image: 'rounded-xl max-h-[80vh] object-contain'
                }
            });
        };
    });

    if (window.lucide) lucide.createIcons();

    // --- Transparency Chart ---
    try {
        const allocation = await API.get('/api/finance/allocation');
        const chartEl = document.getElementById('transparencyChart');
        if (chartEl && allocation.length > 0) {
            const ctx = chartEl.getContext('2d');
            new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: allocation.map(a => a.label),
                    datasets: [{
                        data: allocation.map(a => a.value),
                        backgroundColor: ['#0070f3', '#10b981', '#f59e0b', '#8b5cf6', '#f43f5e', '#06b6d4', '#64748b'],
                        borderWidth: 0,
                        hoverOffset: 12
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    cutout: '75%',
                    plugins: { legend: { display: false } }
                }
            });

            // Custom Legend
            const legendEl = document.getElementById('allocation-legend');
            const total = allocation.reduce((acc, curr) => acc + curr.value, 0);
            legendEl.innerHTML = allocation.map((a, i) => `
                <div class="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors">
                    <div class="flex items-center gap-3">
                        <div class="w-2.5 h-2.5 rounded-full" style="background-color: ${['#0070f3', '#10b981', '#f59e0b', '#8b5cf6', '#f43f5e', '#06b6d4', '#64748b'][i]}"></div>
                        <span class="text-[11px] font-bold text-slate-700">${a.label}</span>
                    </div>
                    <span class="text-[10px] font-black text-slate-400">${Math.round((a.value / total) * 100)}%</span>
                </div>
            `).join('');
        } else if (chartEl) {
            chartEl.parentElement.innerHTML = `
                <div class="flex flex-col items-center justify-center h-full text-slate-200">
                    <i data-lucide="pie-chart" class="w-12 h-12 mb-2 opacity-20"></i>
                    <p class="text-xs italic font-medium">Data pengeluaran belum tersedia</p>
                </div>
            `;
            if (window.lucide) lucide.createIcons();
        }
    } catch (e) {
        console.error('Transparency Loading Error:', e);
    }

    // Quotes Collection (100 items)
    const quotes = [
        { text: "Kesuksesan berawal dari keputusan untuk mencoba.", author: "Anonim" },
        { text: "Disiplin adalah jembatan antara cita-cita dan pencapaian.", author: "Jim Rohn" },
        { text: "Jangan menunggu kesempatan, ciptakanlah.", author: "George Bernard Shaw" },
        { text: "Satu-satunya cara untuk melakukan pekerjaan hebat adalah dengan mencintai apa yang Anda lakukan.", author: "Steve Jobs" },
        { text: "Kebahagiaan bukan sesuatu yang sudah jadi, ia berasal dari tindakan Anda sendiri.", author: "Dalai Lama" },
        { text: "Waktumu terbatas, jangan sia-siakan untuk menjalani hidup orang lain.", author: "Steve Jobs" },
        { text: "Keyakinan dan hard work akan selalu menghasilkan kesuksesan.", author: "Virat Kohli" },
        { text: "Mimpi tidak akan berhasil kecuali jika Anda melakukannya.", author: "John C. Maxwell" },
        { text: "Jangan pernah berhenti belajar, karena hidup tidak pernah berhenti mengajar.", author: "Anonim" },
        { text: "Kualitas kepemimpinan tercermin dalam standar yang mereka tetapkan untuk diri mereka sendiri.", author: "Ray Kroc" },
        { text: "Ubah hidupmu hari ini. Jangan bertaruh pada masa depan, bertindaklah sekarang tanpa menunda.", author: "Simone de Beauvoir" },
        { text: "Kesalahan adalah bukti bahwa Anda sedang mencoba.", author: "Anonim" },
        { text: "Hiduplah seolah-olah kamu akan mati besok. Belajarlah seolah-olah kamu akan hidup selamanya.", author: "Mahatma Gandhi" },
        { text: "Kita adalah apa yang kita kerjakan berulang kali. Keunggulan, bukanlah tindakan, tetapi kebiasaan.", author: "Aristoteles" },
        { text: "Jangan biarkan hari kemarin menyedot terlalu banyak hari ini.", author: "Will Rogers" },
        { text: "Jika kamu bisa memimpikannya, kamu bisa melakukannya.", author: "Walt Disney" },
        { text: "Keberanian bukanlah ketiadaan rasa takut, melainkan penilaian bahwa ada sesuatu yang lebih penting daripada rasa takut.", author: "Ambrose Redmoon" },
        { text: "Keberhasilan itu bukan final, kegagalan itu tidak fatal: keberanian untuk melanjutkanlah yang utama.", author: "Winston Churchill" },
        { text: "Kamu tidak perlu menjadi hebat untuk memulai, tapi kamu harus memulai untuk menjadi hebat.", author: "Zig Ziglar" },
        { text: "Fokuslah pada tempat yang ingin kamu tuju, bukan pada apa yang kamu takuti.", author: "Anthony Robbins" },
        { text: "Tidak ada rahasia untuk sukses. Sukses adalah hasil dari persiapan, kerja keras, dan belajar dari kegagalan.", author: "Colin Powell" },
        { text: "Orang yang paling berani adalah orang yang paling takut, namun ia melakukan apa yang harus dilakukan.", author: "Anonim" },
        { text: "Kesempatan seringkali menyamar sebagai kerja keras, sehingga kebanyakan orang tidak mengenalinya.", author: "Ann Landers" },
        { text: "Ketekunan adalah kerja keras yang kamu lakukan setelah kamu lelah melakukan kerja keras yang sudah kamu lakukan.", author: "Newt Gingrich" },
        { text: "Jangan pernah menyerah pada mimpi hanya karena waktu yang dibutuhkan untuk mencapainya. Waktu akan berjalan terus.", author: "Earl Nightingale" },
        { text: "Investasi terbaik adalah investasi pada diri sendiri.", author: "Warren Buffett" },
        { text: "Kesuksesan adalah berjalan dari kegagalan ke kegagalan tanpa kehilangan antusiasme.", author: "Winston Churchill" },
        { text: "Apa yang kamu tanam itulah yang kamu tuai.", author: "Anonim" },
        { text: "Satu-satunya batasan untuk realisasi hari esok adalah keraguan kita hari ini.", author: "Franklin D. Roosevelt" },
        { text: "Kerjakan dengan segenap hati, maka dunia akan melihatmu.", author: "Anonim" },
        { text: "Berpikir besar, mulai kecil, bertindaklah sekarang.", author: "Anonim" },
        { text: "Pendidikan adalah senjata paling mematikan di dunia, karena dengan pendidikan, Anda dapat mengubah dunia.", author: "Nelson Mandela" },
        { text: "Kegagalan hanyalah kesempatan untuk memulai lagi, kali ini dengan lebih cerdas.", author: "Henry Ford" },
        { text: "Tindakan adalah kunci dasar untuk semua kesuksesan.", author: "Pablo Picasso" },
        { text: "Kesenangan dalam bekerja memberikan kesempurnaan pada hasil karya.", author: "Aristoteles" },
        { text: "Hidup itu seperti mengendarai sepeda. Untuk menjaga keseimbangan, kamu harus terus bergerak.", author: "Albert Einstein" },
        { text: "Jangan takut untuk melepaskan hal yang baik untuk mengejar hal yang luar biasa.", author: "John D. Rockefeller" },
        { text: "Orang pesimis melihat kesulitan di setiap kesempatan. Orang optimis melihat kesempatan di setiap kesulitan.", author: "Winston Churchill" },
        { text: "Sukses biasanya datang kepada mereka yang terlalu sibuk untuk mencarinya.", author: "Henry David Thoreau" },
        { text: "Cara terbaik untuk memprediksi masa depan adalah dengan menciptakannya.", author: "Abraham Lincoln" },
        { text: "Jadilah dirimu sendiri; yang lain sudah dipesan.", author: "Oscar Wilde" },
        { text: "Masa depan adalah milik mereka yang percaya pada keindahan mimpi mereka.", author: "Eleanor Roosevelt" },
        { text: "Jangan biarkan suara pendapat orang lain menenggelamkan suara hatimu sendiri.", author: "Steve Jobs" },
        { text: "Bersyukurlah atas apa yang kamu miliki; kamu akan mendapatkan lebih banyak.", author: "Oprah Winfrey" },
        { text: "Bukan berapa lama hidup kita, tapi bagaimana kita menjalaninya.", author: "Philip James Bailey" },
        { text: "Perjalanan seribu mil dimulai dengan satu langkah.", author: "Lao Tzu" },
        { text: "Jangan berhenti saat lelah. Berhentilah saat sudah selesai.", author: "Anonim" },
        { text: "Percayalah kamu bisa, dan kamu sudah setengah jalan.", author: "Theodore Roosevelt" },
        { text: "Lakukan apa yang kamu bisa, dengan apa yang kamu punya, di mana pun kamu berada.", author: "Theodore Roosevelt" },
        { text: "Setiap pagi kita lahir kembali. Apa yang kita lakukan hari ini adalah yang paling penting.", author: "Buddha" },
        { text: "Kebahagiaan adalah ketika apa yang kamu pikirkan, apa yang kamu katakan, dan apa yang kamu lakukan selaras.", author: "Mahatma Gandhi" },
        { text: "Jangan pernah menyesali sehari pun dalam hidupmu. Hari-hari baik memberimu kebahagiaan dan hari-hari buruk memberimu pengalaman.", author: "Anonim" },
        { text: "Visi tanpa eksekusi adalah halusinasi.", author: "Thomas Edison" },
        { text: "Inovasi membedakan antara pemimpin dan pengikut.", author: "Steve Jobs" },
        { text: "Kesabaran adalah pahit, tapi buahnya manis.", author: "Jean-Jacques Rousseau" },
        { text: "Jangan hitung hari, buatlah hari-hari itu berarti.", author: "Muhammad Ali" },
        { text: "Kamu melewatkan 100% tembakan yang tidak kamu ambil.", author: "Wayne Gretzky" },
        { text: "Hanya mereka yang berani gagal besar yang bisa mencapai keberhasilan besar.", author: "Robert F. Kennedy" },
        { text: "Tantangan adalah apa yang membuat hidup menarik. Mengatasinya adalah apa yang membuat hidup bermakna.", author: "Joshua J. Marine" },
        { text: "Mengejar kesempurnaan tak mungkin, tapi jika kita mengejar kesempurnaan, kita bisa menangkap keunggulan.", author: "Vince Lombardi" },
        { text: "Keunggulan bukan sebuah keterampilan. Itu adalah sikap.", author: "Ralph Marston" },
        { text: "Integritas adalah melakukan hal yang benar bahkan ketika tidak ada orang yang melihat.", author: "C.S. Lewis" },
        { text: "Jangan pernah merendahkan siapapun kecuali kamu sedang membantunya berdiri.", author: "Jesse Jackson" },
        { text: "Kita tidak bisa membantu semua orang, tapi setiap orang bisa membantu seseorang.", author: "Ronald Reagan" },
        { text: "Cara kita memberi jauh lebih penting daripada apa yang kita beri.", author: "Ibu Teresa" },
        { text: "Kebaikan adalah bahasa yang bisa didengar oleh si tuli dan dilihat oleh si buta.", author: "Mark Twain" },
        { text: "Tidak ada yang namanya makan siang gratis.", author: "Milton Friedman" },
        { text: "Uang tidak bisa membeli kebahagiaan, tapi lebih baik menangis di dalam Lamborghini.", author: "Anonim" },
        { text: "Kekuatan tidak datang dari kapasitas fisik, tapi dari kemauan yang gigih.", author: "Mahatma Gandhi" },
        { text: "Kecerdasan tanpa ambisi adalah burung tanpa sayap.", author: "Salvador Dali" },
        { text: "Kebebasan sejati adalah kebebasan dari diri sendiri.", author: "Anonim" },
        { text: "Masa lalu tidak bisa diubah, masa depan masilah di tanganmu.", author: "Anonim" },
        { text: "Jangan bandingkan prosesmu dengan hasil orang lain.", author: "Anonim" },
        { text: "Kerja keras mengalahkan bakat ketika bakat tidak bekerja keras.", author: "Tim Notke" },
        { text: "Sikapmu menentukan ketinggianmu.", author: "Zig Ziglar" },
        { text: "Jadilah perubahan yang ingin kamu lihat di dunia ini.", author: "Mahatma Gandhi" },
        { text: "Berhenti berbicara dan mulailah bertindak.", author: "Walt Disney" },
        { text: "Orang sukses memiliki target, orang biasa memiliki keinginan.", author: "Anonim" },
        { text: "Keberuntungan adalah pertemuan antara persiapan dengan kesempatan.", author: "Seneca" },
        { text: "Jangan pernah menyerah, karena tempat dan waktu di mana arus berbalik akan segera tiba.", author: "Harriet Beecher Stowe" },
        { text: "Lakukan hari ini seolah tidak ada hari esok.", author: "Anonim" },
        { text: "Disiplin diri adalah bentuk tertinggi dari rasa cinta pada diri sendiri.", author: "Anonim" },
        { text: "Tuhan tidak akan mengubah nasib suatu kaum sebelum mereka mengubah keadaan diri mereka sendiri.", author: "QS. Ar-Ra'd: 11" },
        { text: "Barang siapa bersungguh-sungguh, maka ia akan berhasil.", author: "Man Jadda Wajada" },
        { text: "Tangan di atas lebih baik daripada tangan di bawah.", author: "Hadits" },
        { text: "Ilmu tanpa amal bagaikan pohon tanpa buah.", author: "Pepatah" },
        { text: "Sebaik-baik manusia adalah yang paling bermanfaat bagi orang lain.", author: "Hadits" },
        { text: "Kesehatan adalah mahkota di atas kepala orang sehat yang hanya bisa dilihat oleh si sakit.", author: "Pepatah Arab" },
        { text: "Waktu lebih berharga daripada emas.", author: "Anonim" },
        { text: "Hemat pangkal kaya, rajin pangkal pandai.", author: "Pepatah" },
        { text: "Sedikit demi sedikit, lama-lama menjadi bukit.", author: "Pepatah" },
        { text: "Berkatalah yang baik atau diam.", author: "Hadits" },
        { text: "Ibu adalah sekolah pertama bagi anak-anaknya.", author: "Pepatah" },
        { text: "Hormati orang tuamu jika kamu ingin anak-anakmu menghormatimu.", author: "Anonim" },
        { text: "Persahabatan sejati adalah jiwa yang tinggal dalam dua tubuh.", author: "Aristoteles" },
        { text: "Kepuasan terletak pada usaha, bukan pada pencapaian.", author: "Mahatma Gandhi" },
        { text: "Memaafkan adalah ciri orang yang kuat.", author: "Mahatma Gandhi" },
        { text: "Kekuatan tidak berasal dari kemenangan. Perjuanganmu mengembangkan kekuatanmu.", author: "Arnold Schwarzenegger" },
        { text: "Jangan pernah berhenti berharap karena keajaiban terjadi setiap hari.", author: "Anonim" },
        { text: "Hidup adalah petualangan yang berani atau tidak sama sekali.", author: "Helen Keller" }
    ];

    const showRandomQuote = () => {
        const textEl = document.getElementById('quote-text');
        const authorEl = document.getElementById('quote-author');
        if (!textEl || !authorEl) return;

        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

        // Animation out
        textEl.classList.add('opacity-0', 'translate-y-2');
        authorEl.classList.add('opacity-0');

        setTimeout(() => {
            textEl.innerText = `"${randomQuote.text}"`;
            authorEl.innerText = randomQuote.author;

            // Animation in
            textEl.classList.remove('opacity-0', 'translate-y-2');
            authorEl.classList.remove('opacity-0');
        }, 600);
    };

    // Initial show
    setTimeout(showRandomQuote, 100);

    // Setup 30s rotation
    if (window.dashboardQuoteInterval) clearInterval(window.dashboardQuoteInterval);
    window.dashboardQuoteInterval = setInterval(showRandomQuote, 30000);
};
