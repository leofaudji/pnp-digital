import API from '../api.js';

export const Attendance = async (App) => {
    document.getElementById('header-container').classList.remove('hidden');
    document.getElementById('page-title').innerText = 'Riwayat Kehadiran';
    const user = await App.getUser();
    const settings = await API.get('/api/settings');

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const currentDate = now.getDate();

    const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
    const month = parseInt(urlParams.get('month') || currentMonth);
    const year = parseInt(urlParams.get('year') || currentYear);
    const selectedUserId = urlParams.get('user_id') || '';

    // If Admin or Warga, fetch Satpams first to determine default
    let satpams = [];
    if (user.role_id == 1 || user.role_id == 4) {
        satpams = await API.get('/api/users/satpam');
    }

    // Fetch Holidays
    const holidays = await API.get(`/api/settings/holidays?year=${year}`) || [];

    let effectiveUserId = selectedUserId;
    if ((user.role_id == 1 || user.role_id == 4) && !effectiveUserId && satpams.length > 0) {
        effectiveUserId = satpams[0].id;
    }

    // Fetch History using effective ID
    const history = (user.role_id != 1 && user.role_id != 4 || effectiveUserId)
        ? await API.get(`/api/attendance/history?month=${month}&year=${year}${effectiveUserId ? `&user_id=${effectiveUserId}` : ''}`)
        : [];

    // Handle displayed days: Only up to today if looking at current month/year
    const isCurrentMonth = month === currentMonth && year === currentYear;
    const daysToDisplay = isCurrentMonth ? currentDate : new Date(year, month, 0).getDate();

    // DEBUG: Check data loaded
    // if (history.length === 0) alert('Debug: No history data found for this month.');
    console.log('History loaded:', history);

    const groupedData = {};
    for (let d = 1; d <= daysToDisplay; d++) {
        groupedData[d] = {
            date: d,
            checkIn: null,
            checkOut: null,
            patrols: [],
            hasActivity: false
        };
    }

    // Process history data with Overnight Shift Support
    // 1. Sort history ASC to process sequentially
    const sortedHistory = [...history].sort((a, b) => a.timestamp.localeCompare(b.timestamp));

    // 2. Track active shifts for pairing
    let activeShiftDate = null;
    let lastInTimestamp = null;

    sortedHistory.forEach(item => {
        // Safe parsing for SQL timestamp
        const itemDate = new Date(item.timestamp.replace(' ', 'T'));
        const itemDay = itemDate.getDate();
        const itemTime = itemDate.getTime();

        // 16 hours heuristic for pairing (16 * 60 * 60 * 1000)
        const pairingWindow = 57600000;

        if (item.type === 'IN') {
            activeShiftDate = itemDay;
            lastInTimestamp = itemTime;

            if (groupedData[itemDay]) {
                groupedData[itemDay].hasActivity = true;
                const timeStr = itemDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                if (!groupedData[itemDay].checkIn || item.timestamp < groupedData[itemDay].checkIn.raw) {
                    groupedData[itemDay].checkIn = { time: timeStr, raw: item.timestamp };
                }
            }
        }
        else if (item.type === 'OUT') {
            // Try to pair with last IN within window
            let targetDay = itemDay;
            let isOvernight = false;

            if (lastInTimestamp && (itemTime - lastInTimestamp) < pairingWindow) {
                targetDay = activeShiftDate;
                isOvernight = targetDay !== itemDay;
            }

            if (groupedData[targetDay]) {
                groupedData[targetDay].hasActivity = true;
                const timeStr = itemDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                if (!groupedData[targetDay].checkOut || item.timestamp > groupedData[targetDay].checkOut.raw) {
                    groupedData[targetDay].checkOut = {
                        time: timeStr,
                        raw: item.timestamp,
                        isOvernight: isOvernight
                    };
                }
            }
        }
        else if (item.type === 'CHECKPOINT') {
            // Pair patrols with active shift if within window
            let targetDay = itemDay;
            if (lastInTimestamp && (itemTime - lastInTimestamp) < pairingWindow) {
                targetDay = activeShiftDate;
            }

            if (groupedData[targetDay]) {
                groupedData[targetDay].hasActivity = true;
                const timeStr = itemDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                groupedData[targetDay].patrols.push({
                    time: timeStr,
                    location: item.detail,
                    realDay: itemDay,
                    notes: item.notes,
                    image_proof: item.image_proof
                });
            }
        }
    });

    window.viewPatrolImage = (img) => {
        Swal.fire({
            imageUrl: `${API.basePath}/uploads/patrol/${img}`,
            imageAlt: 'Bukti Patroli',
            showConfirmButton: false,
            showCloseButton: true,
            customClass: {
                popup: 'rounded-[2rem] p-0 overflow-hidden',
                image: 'm-0'
            }
        });
    };

    const shiftMorningStart = settings.shift_morning_start || '06:00';
    const shiftNightStart = settings.shift_night_start || '20:00';
    let totalLates = 0;
    let totalActiveDays = 0;
    let totalPatrolScans = 0;
    let totalHolidaysInPeriod = 0;
    let perfectDays = 0;

    // Pre-calculate stats loop
    Object.values(groupedData).forEach(day => {
        if (day.hasActivity) totalActiveDays++;
        totalPatrolScans += day.patrols.length;

        const checkDateStr = `${year}-${String(month).padStart(2, '0')}-${String(day.date).padStart(2, '0')}`;
        if (holidays.some(h => h.date === checkDateStr)) {
            totalHolidaysInPeriod++;
        } else {
            // Check for Perfect Day (On-time & Patrol)
            if (day.checkIn) {
                const [inH, inM] = day.checkIn.time.split(':').map(Number);
                let checkShift = (inH < 14)
                    ? { baseline: settings.shift_morning_start || '06:00' }
                    : { baseline: settings.shift_night_start || '20:00' };

                const [startH, startM] = checkShift.baseline.split(':').map(Number);
                const isLate = inH > startH || (inH === startH && inM > startM);

                if (!isLate && day.patrols.length > 0) {
                    perfectDays++;
                }
            }
        }
    });

    const workDaysSoFar = Math.max(1, daysToDisplay - totalHolidaysInPeriod);
    const attendanceRate = Math.min(100, Math.round((perfectDays / workDaysSoFar) * 100));

    const historyRows = Object.values(groupedData).reverse().map(day => {
        const isToday = day.date === currentDate && isCurrentMonth;

        let statusColor = "slate";
        let statusText = "Tidak Ada Data";
        let statusIcon = "circle-dashed";
        let isLate = false;
        let detectedShift = null;

        if (day.checkIn) {
            const [inH, inM] = day.checkIn.time.split(':').map(Number);

            // Smart Shift Detection: < 14:00 is Morning, >= 14:00 is Night
            if (inH < 14) {
                detectedShift = { name: 'Pagi', baseline: shiftMorningStart, icon: 'sun', color: 'amber' };
            } else {
                detectedShift = { name: 'Malam', baseline: shiftNightStart, icon: 'moon', color: 'blue' };
            }

            const [startH, startM] = detectedShift.baseline.split(':').map(Number);
            if (inH > startH || (inH === startH && inM > startM)) {
                isLate = true;
                totalLates++;
            }
        }

        if (day.hasActivity) {
            if (day.checkIn && day.checkOut) {
                if (day.patrols.length > 0) {
                    statusColor = "emerald";
                    statusText = "Lengkap";
                    statusIcon = "check-circle";
                } else {
                    statusColor = "orange";
                    statusText = "Tanpa Patroli";
                    statusIcon = "alert-triangle";
                }
            } else {
                statusColor = "amber";
                statusText = "Belum Lengkap";
                statusIcon = "alert-circle";
            }
        } else if (!isToday) {
            // Check if holiday
            const checkDateStr = `${year}-${String(month).padStart(2, '0')}-${String(day.date).padStart(2, '0')}`;
            const holiday = holidays.find(h => h.date === checkDateStr);

            if (holiday) {
                statusColor = "teal";
                statusText = `Libur: ${holiday.description}`;
                statusIcon = "calendar-heart";
            } else {
                statusColor = "rose";
                statusText = "Alpha / Mangkir";
                statusIcon = "x-circle";
            }
        } else {
            statusColor = "blue";
            statusText = "Menunggu Scan";
            statusIcon = "clock";
        }

        return `
            <tr class="${isToday ? 'bg-brand-50/20' : 'hover:bg-slate-50/50'} transition-colors">
                <td class="px-4 py-3 md:px-8 md:py-5 whitespace-nowrap">
                    <div class="flex flex-col">
                        <span class="text-xs md:text-sm font-bold text-slate-900">${day.date} ${new Date(year, month - 1, day.date).toLocaleString('id-ID', { month: 'short' })}</span>
                        <span class="text-[9px] md:text-[10px] text-slate-400 font-medium">${new Date(year, month - 1, day.date).toLocaleString('id-ID', { weekday: 'long' })}</span>
                    </div>
                </td>
                <td class="px-4 py-3 md:px-8 md:py-5 whitespace-nowrap">
                    ${day.checkIn ? `
                        <div class="flex flex-col">
                            <div class="flex items-center text-xs md:text-sm font-bold text-slate-700">
                                <i data-lucide="clock" class="w-3 h-3 md:w-3.5 md:h-3.5 mr-1.5 md:mr-2 text-emerald-500"></i>
                                ${day.checkIn.time}
                            </div>
                            <div class="flex items-center gap-1.5 mt-1">
                                <span class="text-[8px] md:text-[9px] font-black text-${detectedShift.color}-600 bg-${detectedShift.color}-50 px-1.5 py-0.5 rounded border border-${detectedShift.color}-100 uppercase tracking-tighter flex items-center">
                                    <i data-lucide="${detectedShift.icon}" class="w-2.5 h-2.5 mr-1"></i>
                                    Shift ${detectedShift.name}
                                </span>
                                ${isLate ? `<span class="text-[8px] md:text-[9px] font-black text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100 uppercase tracking-tighter">Terlambat</span>` : ''}
                            </div>
                        </div>
                    ` : `
                        <span class="text-[10px] md:text-xs text-slate-300 italic">-- : --</span>
                    `}
                </td>
                <td class="px-4 py-3 md:px-8 md:py-5 whitespace-nowrap">
                    ${day.checkOut ? `
                        <div class="flex flex-col">
                            <div class="flex items-center text-xs md:text-sm font-bold text-slate-700">
                                <i data-lucide="clock" class="w-3 h-3 md:w-3.5 md:h-3.5 mr-1.5 md:mr-2 text-rose-500"></i>
                                ${day.checkOut.time}
                            </div>
                            ${day.checkOut.isOvernight ? `<span class="text-[8px] md:text-[9px] text-slate-400 font-bold ml-4 md:ml-5 uppercase tracking-tighter">(Besok)</span>` : ''}
                        </div>
                    ` : `
                        <span class="text-[10px] md:text-xs text-slate-300 italic">-- : --</span>
                    `}
                </td>
                <td class="px-4 py-3 md:px-8 md:py-5 min-w-[150px]">
                    <div class="flex flex-wrap gap-2">
                        ${day.patrols.length > 0 ? day.patrols.map(p => `
                            <div class="group relative px-2 py-1 ${p.notes ? 'bg-rose-50 text-rose-700 border-rose-100 shadow-sm' : 'bg-blue-50 text-blue-700 border-blue-100'} text-[9px] md:text-[10px] font-black rounded-lg border flex items-center cursor-help transition-all hover:scale-105 whitespace-nowrap">
                                <i data-lucide="${p.notes ? 'alert-triangle' : 'shield-check'}" class="w-2.5 h-2.5 mr-1"></i>
                                ${p.image_proof ? `<i data-lucide="camera" class="w-2.5 h-2.5 mr-1 text-sky-500"></i>` : ''}
                                ${p.time}
                                <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-40 md:w-48 p-3 bg-slate-900 text-white rounded-2xl text-[10px] text-left shadow-2xl z-50 whitespace-normal">
                                    <p class="font-black border-b border-white/10 pb-1 mb-1 uppercase tracking-widest text-[9px]">Detail Patroli</p>
                                    <p class="opacity-70 mb-2">Lokasi: ${p.location}</p>
                                    ${p.notes ? `
                                        <div class="bg-rose-500/20 p-2 rounded-xl border border-rose-500/30 font-bold text-rose-200 mt-1">
                                            <span class="text-[8px] uppercase block mb-1 opacity-50">Temuan/Insiden:</span>
                                            ${p.notes}
                                        </div>
                                    ` : ''}
                                    ${p.image_proof ? `
                                        <button onclick="window.viewPatrolImage('${p.image_proof}')" class="mt-3 w-full py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg font-bold flex items-center justify-center transition-colors">
                                            <i data-lucide="eye" class="w-3 h-3 mr-2"></i> Lihat Foto
                                        </button>
                                    ` : ''}
                                </div>
                            </div>
                        `).join('') : `
                            <span class="text-[10px] md:text-xs text-slate-300 italic">Belum Patroli</span>
                        `}
                    </div>
                </td>
                <td class="px-4 py-3 md:px-8 md:py-5 text-right whitespace-nowrap">
                    <span class="inline-flex items-center px-2 py-0.5 md:px-2.5 md:py-1 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-wider bg-${statusColor}-50 text-${statusColor}-700 border border-${statusColor}-100">
                        <i data-lucide="${statusIcon}" class="w-3 h-3 mr-1 md:mr-1.5"></i>
                        ${statusText}
                    </span>
                </td>
            </tr>
        `;
    }).join('');

    let html = `
    <!-- Statistik Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        <div class="bg-white/70 backdrop-blur-xl p-5 md:p-6 rounded-[2rem] border border-slate-100 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1">
            <div class="flex items-center mb-3">
                <div class="w-10 h-10 bg-brand-50 text-brand-600 rounded-xl flex items-center justify-center mr-3">
                    <i data-lucide="user-check" class="w-5 h-5"></i>
                </div>
                <span class="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">Kehadiran</span>
            </div>
            <div class="flex items-baseline space-x-2">
                <span class="text-2xl md:text-3xl font-black text-slate-900">${totalActiveDays}</span>
                <span class="text-xs font-bold text-slate-400">Hari</span>
            </div>
        </div>

        <div class="bg-white/70 backdrop-blur-xl p-5 md:p-6 rounded-[2rem] border border-slate-100 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1">
            <div class="flex items-center mb-3">
                <div class="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mr-3">
                    <i data-lucide="shield-check" class="w-5 h-5"></i>
                </div>
                <span class="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">Patroli</span>
            </div>
            <div class="flex items-baseline space-x-2">
                <span class="text-2xl md:text-3xl font-black text-slate-900">${totalPatrolScans}</span>
                <span class="text-xs font-bold text-slate-400">Scan</span>
            </div>
        </div>

        <div class="bg-white/70 backdrop-blur-xl p-5 md:p-6 rounded-[2rem] border border-slate-100 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1">
            <div class="flex items-center mb-3">
                <div class="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center mr-3">
                    <i data-lucide="clock-alert" class="w-5 h-5"></i>
                </div>
                <span class="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">Terlambat</span>
            </div>
            <div class="flex items-baseline space-x-2">
                <span class="text-2xl md:text-3xl font-black text-slate-900">${totalLates}</span>
                <span class="text-xs font-bold text-slate-400">Kali</span>
            </div>
        </div>

        <div class="bg-white/70 backdrop-blur-xl p-5 md:p-6 rounded-[2rem] border border-slate-100 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1">
            <div class="flex items-center mb-3">
                <div class="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mr-3">
                    <i data-lucide="percent" class="w-5 h-5"></i>
                </div>
                <span class="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">Rating</span>
            </div>
            <div class="flex items-baseline space-x-2">
                <span class="text-2xl md:text-3xl font-black text-slate-900">${attendanceRate}%</span>
                <span class="text-xs font-bold text-slate-400">Score</span>
            </div>
        </div>
    </div>

    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-6">
        <div class="px-6 py-5 md:px-8 md:py-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-50/30 gap-4">
            <div class="flex flex-col">
                <h3 class="text-lg md:text-xl font-bold text-slate-900 flex items-center">
                    <i data-lucide="calendar-days" class="w-5 h-5 mr-3 text-brand-600"></i>
                    Laporan Harian
                </h3>
                <p class="text-xs text-slate-500 font-medium ml-8">${new Date(year, month - 1).toLocaleString('id-ID', { month: 'long', year: 'numeric' })}</p>
            </div>
            
            <div class="grid grid-cols-2 md:flex items-center gap-3 w-full md:w-auto">
                ${(user.role_id == 1 || user.role_id == 4) ? `
                    <div class="col-span-2 md:col-span-1 flex items-center space-x-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
                        <i data-lucide="user-cog" class="w-4 h-4 text-slate-400"></i>
                        <select id="filter-user" class="bg-transparent border-none text-xs font-bold text-slate-700 focus:ring-0 cursor-pointer min-w-[150px] w-full">
                            <option value="">-- Pilih Satpam --</option>
                            ${satpams.map(s => `<option value="${s.id}" ${s.id == effectiveUserId ? 'selected' : ''}>${s.full_name}</option>`).join('')}
                        </select>
                    </div>
                ` : ''}
                
                <div class="col-span-2 md:col-span-1 flex items-center space-x-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm justify-between md:justify-start">
                    <select id="filter-month" class="bg-transparent border-none text-xs font-bold text-slate-700 focus:ring-0 cursor-pointer flex-1 md:flex-none">
                        ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => `
                            <option value="${m}" ${m == month ? 'selected' : ''}>${new Date(2000, m - 1).toLocaleString('id-ID', { month: 'long' })}</option>
                        `).join('')}
                    </select>
                    <div class="w-px h-4 bg-slate-200 mx-2"></div>
                    <select id="filter-year" class="bg-transparent border-none text-xs font-bold text-slate-700 focus:ring-0 cursor-pointer flex-1 md:flex-none">
                        ${[currentYear, currentYear - 1].map(y => `
                            <option value="${y}" ${y == year ? 'selected' : ''}>${y}</option>
                        `).join('')}
                    </select>
                </div>
            </div>
        </div>
        
        ${totalLates === 0 && history.length > 0 ? `
            <div class="m-8 mb-4 bg-emerald-50 border border-emerald-100 rounded-[2rem] p-6 flex items-center animate-in fade-in zoom-in duration-500">
                <div class="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm mr-6 text-emerald-600">
                    <i data-lucide="award" class="w-8 h-8"></i>
                </div>
                <div>
                    <h4 class="text-emerald-900 font-black uppercase tracking-widest text-[13px] mb-1">Apresiasi Kedisiplinan</h4>
                    <p class="text-emerald-700 text-xs font-medium">Luar biasa! Tidak ada catatan keterlambatan untuk periode ini. Pertahankan dedikasi Anda!</p>
                </div>
            </div>
        ` : totalLates > 0 ? `
            <div class="m-8 mb-4 bg-rose-50 border border-rose-100 rounded-[2rem] p-6 flex items-center animate-in fade-in zoom-in duration-500">
                <div class="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm mr-6 text-rose-600">
                    <i data-lucide="alert-triangle" class="w-8 h-8"></i>
                </div>
                <div>
                    <h4 class="text-rose-900 font-black uppercase tracking-widest text-[13px] mb-1">Catatan Kehadiran</h4>
                    <p class="text-rose-700 text-xs font-medium">Terdeteksi <span class="font-black">${totalLates} kali keterlambatan</span> di bulan ini. Pastikan untuk hadir tepat waktu sesuai standar operasional.</p>
                </div>
            </div>
        ` : ''}

        <div class="overflow-x-auto">
            <table class="w-full text-left">
                <thead>
                    <tr class="bg-slate-50/50">
                        <th class="px-4 py-3 md:px-8 md:py-4 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Tanggal</th>
                        <th class="px-4 py-3 md:px-8 md:py-4 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Masuk</th>
                        <th class="px-4 py-3 md:px-8 md:py-4 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Pulang</th>
                        <th class="px-4 py-3 md:px-8 md:py-4 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Patroli</th>
                        <th class="px-4 py-3 md:px-8 md:py-4 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Status</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                    ${historyRows}
                </tbody>
            </table>
        </div>
    </div>`;

    App.container.innerHTML = html;

    const reloadWithFilters = () => {
        const m = document.getElementById('filter-month').value;
        const y = document.getElementById('filter-year').value;
        const u = document.getElementById('filter-user') ? document.getElementById('filter-user').value : '';
        window.location.hash = `#/attendance?month=${m}&year=${y}${u ? `&user_id=${u}` : ''}`;
    };

    document.getElementById('filter-month').addEventListener('change', reloadWithFilters);
    document.getElementById('filter-year').addEventListener('change', reloadWithFilters);
    if (document.getElementById('filter-user')) {
        document.getElementById('filter-user').addEventListener('change', reloadWithFilters);
    }

    if (window.lucide) lucide.createIcons();
};

export const MyQR = async (App) => {
    document.getElementById('header-container').classList.remove('hidden');
    document.getElementById('page-title').innerText = 'QR Code Saya';
    const user = await App.getUser();

    const data = await API.get('/api/user/qr');

    App.container.innerHTML = `
        <div class="max-w-md mx-auto">
            <div class="bg-white p-10 rounded-[2.5rem] border-2 border-slate-100 shadow-2xl flex flex-col items-center">
                <div class="w-16 h-16 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center mb-8">
                    <i data-lucide="qr-code" class="w-8 h-8"></i>
                </div>
                <h3 class="text-2xl font-black text-slate-900 mb-2">My Identity QR</h3>
                <p class="text-slate-500 text-center mb-10 text-sm font-medium">Tunjukkan QR Code ini ke petugas satpam atau scan di checkpoint perumahan.</p>
                
                <div class="p-4 bg-slate-50 rounded-3xl border-4 border-slate-100 shadow-inner">
                    <div id="qrcode" class="bg-white p-4 rounded-2xl"></div>
                </div>
                
                <div class="mt-10 px-8 py-3 bg-brand-50 rounded-full flex items-center space-x-3 border border-brand-100">
                    <div class="w-2.5 h-2.5 bg-brand-500 rounded-full animate-pulse"></div>
                    <span class="text-xs font-black text-brand-700 uppercase tracking-widest">${data.qr_code}</span>
                </div>
            </div>
        </div>
    `;

    new QRCode(document.getElementById("qrcode"), {
        text: data.qr_code,
        width: 200,
        height: 200,
        colorDark: "#0f172a",
        colorLight: "#ffffff",
    });
    if (window.lucide) lucide.createIcons();
};
