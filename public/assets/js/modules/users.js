import API from '../api.js';
import Sidebar from '../sidebar.js';

export const Users = async (App) => {
    document.getElementById('header-container').classList.remove('hidden');
    document.getElementById('page-title').innerText = 'Kelola Pengguna';
    const userMe = await App.getUser();
    await Sidebar.render(userMe ? userMe.role : null);

    const users = await API.get('/api/users');
    const roles = await API.get('/api/roles');

    App.container.innerHTML = `
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div class="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
            <h3 class="text-lg font-bold text-slate-900 flex items-center">
                <i data-lucide="users" class="w-5 h-5 mr-3 text-brand-600"></i> Daftar Pengguna
            </h3>
            <button id="btn-add-user" class="px-4 py-2 bg-brand-600 text-white text-sm font-bold rounded-lg shadow-md hover:bg-brand-700 transition-colors">
                Tambah User
            </button>
        </div>
        <div class="overflow-x-auto">
            <table class="w-full text-left">
                <tbody class="divide-y divide-slate-100">
                    ${users.map(u => `
                    <tr class="hover:bg-slate-50/50 transition-colors">
                        <td class="px-6 py-4">
                            <div class="font-bold text-sm text-slate-900">${u.full_name}</div>
                            <div class="text-[11px] text-slate-400 font-normal tracking-tight">@${u.username}</div>
                        </td>
                        <td class="px-6 py-4">
                            <span class="px-2 py-0.5 bg-brand-50 text-brand-700 text-[10px] font-black rounded uppercase tracking-wider border border-brand-100/50">
                                ${u.role_name}
                            </span>
                        </td>
                        <td class="px-6 py-4 text-right">
                            <button class="btn-edit-user p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" data-user='${JSON.stringify(u).replace(/'/g, "&apos;")}'>
                                <i data-lucide="edit-3" class="w-4 h-4"></i>
                            </button>
                            <button class="btn-delete-user p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" data-id="${u.id}">
                                <i data-lucide="trash-2" class="w-4 h-4"></i>
                            </button>
                        </td>
                    </tr>`).join('')}
                </tbody>
            </table>
        </div>
    </div>
    
    <div id="user-modal" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm hidden flex items-center justify-center p-4 z-50">
        <div class="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl">
            <h3 id="user-modal-title" class="text-xl font-bold mb-6 text-slate-900">Tambah User</h3>
            <form id="user-form" class="space-y-4">
                <input type="hidden" id="user-id">
                <div>
                    <label class="block text-xs font-bold text-slate-400 mb-1 ml-1 uppercase">Username</label>
                    <input id="user-username" type="text" placeholder="Username" class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all" required>
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-400 mb-1 ml-1 uppercase">Nama Lengkap</label>
                    <input id="user-full-name" type="text" placeholder="Nama Lengkap" class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all" required>
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-400 mb-1 ml-1 uppercase">Role</label>
                    <select id="user-role-id" class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none appearance-none cursor-pointer">
                        ${roles.map(r => `<option value="${r.id}">${r.name}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-400 mb-1 ml-1 uppercase">Password</label>
                    <input id="user-password" type="password" placeholder="Isi untuk set/ganti" class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all">
                </div>
                <div class="flex space-x-3 pt-6">
                    <button type="button" id="btn-close-user" class="flex-1 py-3 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">Batal</button>
                    <button type="submit" class="flex-1 py-3 text-sm font-bold text-white bg-brand-600 rounded-xl shadow-lg hover:bg-brand-700 transition-all">Simpan</button>
                </div>
            </form>
        </div>
    </div>`;

    document.getElementById('btn-add-user').onclick = () => showUserModal();
    document.getElementById('btn-close-user').onclick = () => document.getElementById('user-modal').classList.add('hidden');

    document.querySelectorAll('.btn-edit-user').forEach(btn => {
        btn.onclick = () => showUserModal(JSON.parse(btn.dataset.user));
    });

    document.querySelectorAll('.btn-delete-user').forEach(btn => {
        btn.onclick = async () => {
            const result = await SwalCustom.fire({
                title: 'Hapus User?',
                text: "Data yang dihapus tidak dapat dikembalikan!",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Ya, Hapus!',
                cancelButtonText: 'Batal'
            });

            if (result.isConfirmed) {
                const res = await API.post('/api/users/delete', { id: btn.dataset.id });
                if (res.success) {
                    SwalCustom.fire('Terhapus!', 'User telah berhasil dihapus.', 'success');
                    Users(App);
                } else {
                    SwalCustom.fire('Gagal!', res.error, 'error');
                }
            }
        };
    });

    const showUserModal = (u = null) => {
        document.getElementById('user-modal').classList.remove('hidden');
        document.getElementById('user-id').value = u ? u.id : '';
        document.getElementById('user-username').value = u ? u.username : '';
        document.getElementById('user-full-name').value = u ? u.full_name : '';
        document.getElementById('user-role-id').value = u ? u.role_id : '4';
        document.getElementById('user-password').value = '';
        document.getElementById('user-modal-title').innerText = u ? 'Edit User' : 'Tambah User';
    };

    document.getElementById('user-form').onsubmit = async (e) => {
        e.preventDefault();
        const id = document.getElementById('user-id').value;
        const data = {
            username: document.getElementById('user-username').value,
            full_name: document.getElementById('user-full-name').value,
            role_id: document.getElementById('user-role-id').value,
            password: document.getElementById('user-password').value
        };
        const res = await API.post(id ? '/api/users/update' : '/api/users', id ? { ...data, id } : data);
        if (res.success) {
            document.getElementById('user-modal').classList.add('hidden');
            Users(App);
            // Update sidebar in case role changed for current user
            if (id == userMe.id) {
                const roleName = roles.find(r => r.id == data.role_id)?.name;
                Sidebar.render(roleName || userMe.role);
            }
        } else {
            alert(res.error);
        }
    };

    if (window.lucide) lucide.createIcons();
};
