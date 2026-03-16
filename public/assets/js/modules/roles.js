import API from '../api.js';
import Sidebar from '../sidebar.js';

export const Roles = async (App) => {
    document.getElementById('header-container').classList.remove('hidden');
    document.getElementById('page-title').innerText = 'Kelola Role';
    const userMe = await App.getUser();
    await Sidebar.render(userMe ? userMe.role : null);

    const roles = await API.get('/api/roles');

    App.container.innerHTML = `
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div class="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
            <h3 class="text-lg font-bold text-slate-900 flex items-center"><i data-lucide="settings" class="w-5 h-5 mr-3 text-brand-600"></i> Role Access</h3>
            <button id="btn-add-role" class="px-4 py-2 bg-brand-600 text-white text-sm font-bold rounded-lg shadow-md hover:bg-brand-700 transition-colors">Tambah Role</button>
        </div>
        <div class="overflow-x-auto">
            <table class="w-full text-left">
                <tbody class="divide-y divide-slate-100">
                    ${roles.map(r => `
                    <tr>
                        <td class="px-6 py-4 font-bold text-slate-900"><span class="bg-slate-50 text-slate-600 border border-slate-200/50 px-2.5 py-1 text-xs rounded-lg">${r.name}</span></td>
                        <td class="px-6 py-4 text-right">
                            <button class="btn-edit-role p-2 text-blue-600" data-role='${JSON.stringify(r).replace(/'/g, "&apos;")}'><i data-lucide="edit-3" class="w-4 h-4"></i></button>
                            <button class="btn-akses-role p-2 text-orange-600" data-name="${r.name}"><i data-lucide="shield-check" class="w-4 h-4"></i></button>
                            <button class="btn-delete-role p-2 text-rose-600" data-id="${r.id}"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                        </td>
                    </tr>`).join('')}
                </tbody>
            </table>
        </div>
    </div>
    
    <div id="role-modal" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm hidden flex items-center justify-center p-4 z-50">
        <div class="bg-white w-full max-w-sm rounded-3xl p-8">
            <h3 id="role-modal-title" class="text-lg font-bold mb-6">Tambah Role</h3>
            <form id="role-form">
                <input type="hidden" id="role-id">
                <input id="role-name" type="text" placeholder="Nama Role" class="w-full p-3 bg-slate-50 border rounded-xl mb-4" required>
                <div class="flex space-x-3">
                    <button type="button" id="btn-close-role" class="flex-1 py-3 bg-slate-100 rounded-xl">Batal</button>
                    <button type="submit" class="flex-1 py-3 bg-brand-600 text-white font-bold rounded-xl shadow-lg">Simpan</button>
                </div>
            </form>
        </div>
    </div>

    <div id="akses-modal" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm hidden flex items-center justify-center p-4 z-50">
        <div class="bg-white w-full max-w-2xl rounded-[2.5rem] flex flex-col max-h-[90vh]">
            <div class="px-10 py-8 border-b bg-slate-50/50 flex justify-between items-center">
                <h3 class="text-2xl font-black">Set Hak Akses Menu <br><span id="akses-role-name" class="text-brand-600 text-sm"></span></h3>
                <button id="btn-close-akses"><i data-lucide="x" class="w-6 h-6"></i></button>
            </div>
            <div id="akses-content" class="p-10 overflow-y-auto space-y-8 flex-1"></div>
            <div class="px-10 py-8 border-t flex space-x-4">
                <button id="btn-close-akses-2" class="flex-1 py-4 bg-slate-100 font-bold rounded-2xl">Batal</button>
                <button id="btn-save-akses" class="flex-1 py-4 bg-brand-600 text-white font-black rounded-2xl shadow-xl">Update Izin Akses</button>
            </div>
        </div>
    </div>`;

    document.getElementById('btn-add-role').onclick = () => showRoleModal();
    document.getElementById('btn-close-role').onclick = () => document.getElementById('role-modal').classList.add('hidden');
    document.getElementById('btn-close-akses').onclick = document.getElementById('btn-close-akses-2').onclick = () => document.getElementById('akses-modal').classList.add('hidden');

    document.querySelectorAll('.btn-edit-role').forEach(btn => {
        btn.onclick = () => showRoleModal(JSON.parse(btn.dataset.role));
    });

    document.querySelectorAll('.btn-delete-role').forEach(btn => {
        btn.onclick = async () => {
            const result = await SwalCustom.fire({
                title: 'Hapus Role?',
                text: "Menghapus role dapat mempengaruhi akses pengguna terkait.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Ya, Hapus!',
                cancelButtonText: 'Batal'
            });

            if (result.isConfirmed) {
                const res = await API.post('/api/roles/delete', { id: btn.dataset.id });
                if (res.success) {
                    SwalCustom.fire('Berhasil!', 'Role telah dihapus.', 'success');
                    Roles(App);
                } else {
                    SwalCustom.fire('Gagal!', res.error, 'error');
                }
            }
        };
    });

    document.querySelectorAll('.btn-akses-role').forEach(btn => {
        btn.onclick = () => showAksesModal(btn.dataset.name);
    });

    const showRoleModal = (r = null) => {
        document.getElementById('role-modal').classList.remove('hidden');
        document.getElementById('role-id').value = r ? r.id : '';
        document.getElementById('role-name').value = r ? r.name : '';
        document.getElementById('role-modal-title').innerText = r ? 'Edit Role' : 'Tambah Role';
    };

    document.getElementById('role-form').onsubmit = async (e) => {
        e.preventDefault();
        const id = document.getElementById('role-id').value;
        const name = document.getElementById('role-name').value;
        const res = await API.post(id ? '/api/roles/update' : '/api/roles', { id, name });
        if (res.success) { document.getElementById('role-modal').classList.add('hidden'); Roles(App); } else alert(res.error);
    };

    let currentAksesRole = null;
    let menuConfig = null;

    const showAksesModal = async (roleName) => {
        currentAksesRole = roleName;
        document.getElementById('akses-modal').classList.remove('hidden');
        document.getElementById('akses-role-name').innerText = "Role: " + roleName;
        document.getElementById('akses-content').innerHTML = '<div class="flex justify-center p-10"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div></div>';

        menuConfig = await API.get('/api/menu');
        let html = `<div><h4 class="text-xs font-black uppercase text-slate-400 mb-6 tracking-widest bg-slate-100 p-2 rounded text-center">Sidebar Menu Configuration</h4>`;

        menuConfig.sidebar.forEach((cat, catIdx) => {
            html += `
                <div class="mb-10">
                    <div class="flex items-center mb-4">
                        <div class="h-px flex-1 bg-slate-100"></div>
                        <span class="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">${cat.category}</span>
                        <div class="h-px flex-1 bg-slate-100"></div>
                    </div>
                    <div class="space-y-4">
            `;

            cat.items.forEach((item, itemIdx) => {
                html += `
                    <div class="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                        <label class="flex items-center cursor-pointer group">
                            <input type="checkbox" data-type="sidebar" data-cat="${catIdx}" data-item="${itemIdx}" class="w-5 h-5 rounded-md text-brand-600 focus:ring-brand-500" ${item.roles.includes(roleName) ? 'checked' : ''}>
                            <span class="ml-3 text-sm font-bold text-slate-700 flex items-center group-hover:text-brand-600 transition-colors">
                                <i data-lucide="${item.icon || 'circle'}" class="w-4 h-4 mr-2"></i> ${item.name}
                            </span>
                        </label>
                `;

                if (item.children) {
                    html += `
                        <div class="mt-4 ml-8 grid grid-cols-1 md:grid-cols-2 gap-3">
                    `;
                    item.children.forEach((child, childIdx) => {
                        html += `
                            <label class="flex items-center p-3 bg-white rounded-xl border border-slate-100 cursor-pointer hover:border-brand-200 transition-colors">
                                <input type="checkbox" data-type="child" data-cat="${catIdx}" data-item="${itemIdx}" data-child="${childIdx}" class="w-4 h-4 rounded text-brand-600" ${child.roles.includes(roleName) ? 'checked' : ''}>
                                <span class="ml-3 text-xs font-bold text-slate-600">${child.name}</span>
                            </label>
                        `;
                    });
                    html += `</div>`;
                }
                html += `</div>`;
            });
            html += `</div></div>`;
        });

        html += `
            </div>
            <div class="mt-12 bg-white rounded-3xl border-2 border-brand-50 p-8">
                <h4 class="text-xs font-black uppercase text-brand-400 mb-6 tracking-widest text-center">Mobile Tab Navigation</h4>
                <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                    ${menuConfig.mobileTabs.map((item, i) => `
                        <label class="flex items-center p-3 bg-brand-50/30 rounded-xl border border-brand-100 cursor-pointer hover:bg-brand-50 transition-all">
                            <input type="checkbox" data-type="mobile" data-idx="${i}" class="w-4 h-4 rounded text-brand-600" ${item.roles.includes(roleName) ? 'checked' : ''}>
                            <span class="ml-3 text-xs font-black text-brand-700 uppercase tracking-tight">${item.name}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
        `;

        document.getElementById('akses-content').innerHTML = html;
        if (window.lucide) lucide.createIcons();
    };

    document.getElementById('btn-save-akses').onclick = async () => {
        const btn = document.getElementById('btn-save-akses');
        const originalText = btn.innerText;
        btn.disabled = true;
        btn.innerText = 'Menyimpan...';

        document.querySelectorAll('#akses-content input').forEach(cb => {
            const type = cb.dataset.type;
            let item;

            if (type === 'sidebar') {
                item = menuConfig.sidebar[cb.dataset.cat].items[cb.dataset.item];
            } else if (type === 'child') {
                item = menuConfig.sidebar[cb.dataset.cat].items[cb.dataset.item].children[cb.dataset.child];
            } else if (type === 'mobile') {
                item = menuConfig.mobileTabs[cb.dataset.idx];
            }

            if (cb.checked) {
                if (!item.roles.includes(currentAksesRole)) item.roles.push(currentAksesRole);
            } else {
                item.roles = item.roles.filter(r => r !== currentAksesRole);
            }
        });

        const res = await API.post('/api/menu/update', menuConfig);
        if (res.success) {
            await SwalCustom.fire({
                title: 'Berhasil!',
                text: 'Izin akses telah diperbarui dan menu akan disegarkan.',
                icon: 'success'
            });
            document.getElementById('akses-modal').classList.add('hidden');
            Sidebar.menuData = null;
            await Sidebar.render(App.user ? App.user.role : null);
        } else {
            SwalCustom.fire({
                title: 'Gagal!',
                text: res.error,
                icon: 'error'
            });
        }

        btn.disabled = false;
        btn.innerText = originalText;
    };

    if (window.lucide) lucide.createIcons();
};
