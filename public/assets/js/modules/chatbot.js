import API from '../api.js';

export const Chatbot = {
    async init() {
        this.container = document.getElementById('ai-chatbot-container');
        this.window = document.getElementById('chatbot-window');
        this.toggleBtn = document.getElementById('btn-toggle-chatbot');
        this.closeBtn = document.getElementById('btn-close-chatbot');
        this.messagesEl = document.getElementById('chatbot-messages');
        this.input = document.getElementById('chatbot-input');
        this.sendBtn = document.getElementById('btn-send-chat');

        if (!this.container) return;

        // Fetch Settings for Dynamic Name
        const settings = await API.get('/api/settings');
        this.appTitle = settings.app_title || 'RT-Digital';
        this.rtName = settings.rt_name || 'Unit Lingkungan';

        // Update Header and Welcome Message
        const headerTitle = this.window.querySelector('h3');
        if (headerTitle) headerTitle.innerText = `Asisten ${this.appTitle}`;

        const welcomeMsg = this.messagesEl.querySelector('p');
        if (welcomeMsg) welcomeMsg.innerText = `Halo pak! Saya Asisten AI ${this.appTitle}. Ada yang bisa saya bantu seputar data warga, iuran, atau informasi di ${this.rtName}?`;

        this.toggleBtn.onclick = () => this.toggle();
        this.closeBtn.onclick = () => this.hide();
        this.sendBtn.onclick = () => this.sendMessage();
        this.input.onkeypress = (e) => {
            if (e.key === 'Enter') this.sendMessage();
        };

        // Chips/Quick Reply Handlers
        document.querySelectorAll('.chat-chip').forEach(chip => {
            chip.onclick = () => {
                this.input.value = chip.innerText;
                this.sendMessage();
            };
        });
    },

    updateVisibility(user) {
        if (!this.container) return;

        // Hide for Satpam
        if (user && user.role === 'Satpam') {
            this.container.classList.add('hidden');
        } else {
            // Show for others (Admin, Bendahara, Warga)
            this.container.classList.remove('hidden');
            if (window.lucide) lucide.createIcons();
        }
    },

    toggle() {
        const isHidden = this.window.classList.contains('hidden');
        if (isHidden) {
            this.show();
        } else {
            this.hide();
        }
    },

    show() {
        this.window.classList.remove('hidden');
        this.toggleBtn.classList.remove('animate-bounce-slow');
        this.input.focus();
        if (window.lucide) lucide.createIcons();
    },

    hide() {
        this.window.classList.add('hidden');
        this.toggleBtn.classList.add('animate-bounce-slow');
    },

    async sendMessage() {
        const text = this.input.value.trim();
        if (!text) return;

        this.input.value = '';
        this.appendMessage('user', text);

        // Typing indicator
        const typingId = 'typing-' + Date.now();
        this.appendTypingIndicator(typingId);

        try {
            const res = await API.post('/api/chatbot/query', { message: text });
            this.removeTypingIndicator(typingId);

            if (res.answer) {
                this.appendMessage('bot', res.answer);
            } else {
                this.appendMessage('bot', "Maaf pak, saya sedang bingung. Bisa diulang pertanyaannya?");
            }
        } catch (e) {
            this.removeTypingIndicator(typingId);
            this.appendMessage('bot', "Koneksi ke otak AI saya terputus pak. Harap coba lagi nanti.");
        }
    },

    appendMessage(role, text) {
        const div = document.createElement('div');
        div.className = `flex ${role === 'user' ? 'justify-end' : 'items-start gap-3'} animate-in slide-in-from-bottom-2 duration-300`;

        if (role === 'user') {
            div.innerHTML = `
                <div class="bg-brand-600 text-white p-4 rounded-2xl rounded-tr-none shadow-md max-w-[85%]">
                    <p class="text-xs font-bold leading-relaxed">${text}</p>
                </div>
            `;
        } else {
            div.innerHTML = `
                <div class="w-8 h-8 rounded-lg bg-brand-100 text-brand-600 flex items-center justify-center flex-shrink-0">
                    <i data-lucide="bot" class="w-4 h-4"></i>
                </div>
                <div class="bg-white p-4 rounded-2xl rounded-tl-none border border-brand-50 shadow-sm max-w-[85%]">
                    <p class="text-xs font-bold text-slate-800 leading-relaxed">${this.formatText(text)}</p>
                </div>
            `;
        }

        this.messagesEl.appendChild(div);
        this.scrollToBottom();
        if (window.lucide) lucide.createIcons();
    },

    formatText(text) {
        // Handle bolding with *asterisks*
        return text.replace(/\*(.*?)\*/g, '<span class="text-brand-600 font-black">$1</span>');
    },

    appendTypingIndicator(id) {
        const div = document.createElement('div');
        div.id = id;
        div.className = 'flex items-start gap-3 animate-pulse';
        div.innerHTML = `
            <div class="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center flex-shrink-0">
                <i data-lucide="bot" class="w-4 h-4"></i>
            </div>
            <div class="bg-white px-4 py-3 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm">
                <div class="flex gap-1">
                    <span class="w-1 h-1 bg-slate-300 rounded-full animate-bounce"></span>
                    <span class="w-1 h-1 bg-slate-300 rounded-full animate-bounce" style="animation-delay: 0.1s"></span>
                    <span class="w-1 h-1 bg-slate-300 rounded-full animate-bounce" style="animation-delay: 0.2s"></span>
                </div>
            </div>
        `;
        this.messagesEl.appendChild(div);
        this.scrollToBottom();
        if (window.lucide) lucide.createIcons();
    },

    removeTypingIndicator(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    },

    scrollToBottom() {
        this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
    }
};

window.Chatbot = Chatbot;
