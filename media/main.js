// ══════════════════════════════════════════════════════════
// GitFlow Assistant — Webview Chat Frontend
// Logika UI: rendering bubble, input handling, postMessage
// ══════════════════════════════════════════════════════════

(function () {
    // @ts-ignore — vscode API tersedia di konteks Webview
    const vscode = acquireVsCodeApi();

    // ── State Management ──
    const state = vscode.getState() || { messages: [], isWelcomeVisible: true };

    // ── DOM Elements ──
    const chatMessages = document.getElementById('chat-messages');
    const welcomeScreen = document.getElementById('welcome-screen');
    const inputField = document.getElementById('input-field');
    const sendBtn = document.getElementById('send-btn');
    const typingIndicator = document.getElementById('typing-indicator');
    const branchBadge = document.getElementById('branch-badge');

    // ══════════════════════════════════════════════════════════
    // INITIALIZATION — Inisialisasi
    // ══════════════════════════════════════════════════════════

    function init() {
        // Pulihkan pesan sebelumnya jika ada
        if (state.messages.length > 0) {
            hideWelcome();
            state.messages.forEach(function(msg) {
                renderMessage(msg, false);
            });
            scrollToBottom();
        }

        setupEventListeners();

        // Beritahu extension bahwa webview sudah siap
        vscode.postMessage({ type: 'webviewReady' });
    }

    // ══════════════════════════════════════════════════════════
    // EVENT LISTENERS — Pendengar Kejadian
    // ══════════════════════════════════════════════════════════

    function setupEventListeners() {
        // Kirim pesan saat klik tombol
        sendBtn.addEventListener('click', handleSend);

        // Kirim pesan saat tekan Enter (tanpa Shift)
        inputField.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
            }
        });

        // Auto-resize textarea
        inputField.addEventListener('input', function () {
            autoResizeInput();
            updateSendButton();
        });

        // Shortcut buttons di welcome screen
        document.querySelectorAll('.shortcut-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var text = btn.getAttribute('data-message');
                if (text) {
                    inputField.value = text;
                    handleSend();
                }
            });
        });

        // Terima pesan dari extension backend
        window.addEventListener('message', handleExtensionMessage);
    }

    // ══════════════════════════════════════════════════════════
    // MESSAGE HANDLING — Pengelolaan Pesan
    // ══════════════════════════════════════════════════════════

    function handleSend() {
        var text = inputField.value.trim();
        if (!text) return;

        // Buat pesan user
        var userMsg = {
            id: generateId(),
            role: 'user',
            content: text,
            timestamp: new Date().toISOString()
        };

        // Tampilkan dan simpan
        hideWelcome();
        renderMessage(userMsg, true);
        saveMessage(userMsg);

        // Reset input
        inputField.value = '';
        autoResizeInput();
        updateSendButton();

        // Tampilkan typing indicator
        showTyping();

        // Kirim ke extension backend
        vscode.postMessage({
            type: 'userMessage',
            content: text
        });
    }

    function handleExtensionMessage(event) {
        var data = event.data;

        switch (data.type) {
            case 'assistantMessage':
                hideTyping();
                var assistantMsg = {
                    id: generateId(),
                    role: 'assistant',
                    content: data.content,
                    timestamp: new Date().toISOString(),
                    outboundTag: data.outboundTag || null
                };
                hideWelcome();
                renderMessage(assistantMsg, true);
                saveMessage(assistantMsg);
                break;

            case 'outboundNotification':
                hideTyping();
                var outboundMsg = {
                    id: generateId(),
                    role: 'assistant',
                    content: data.content,
                    timestamp: new Date().toISOString(),
                    outboundTag: data.tag
                };
                hideWelcome();
                renderMessage(outboundMsg, true);
                saveMessage(outboundMsg);
                break;

            case 'branchUpdate':
                if (branchBadge) {
                    branchBadge.textContent = '🌿 ' + data.branch;
                }
                break;

            case 'clearChat':
                clearChat();
                break;

            case 'showTyping':
                showTyping();
                break;

            case 'hideTyping':
                hideTyping();
                break;
        }
    }

    // ══════════════════════════════════════════════════════════
    // RENDERING — Menampilkan Pesan di Layar
    // ══════════════════════════════════════════════════════════

    function renderMessage(msg, animate) {
        var messageEl = document.createElement('div');
        messageEl.className = 'message ' + msg.role;
        messageEl.setAttribute('data-id', msg.id);

        if (!animate) {
            messageEl.style.opacity = '1';
            messageEl.style.animation = 'none';
        }

        var html = '';

        // Tag outbound (untuk pesan AI)
        if (msg.outboundTag) {
            html += renderOutboundTag(msg.outboundTag);
        }

        // Bubble pesan
        html += '<div class="bubble">' + formatContent(msg.content) + '</div>';

        // Timestamp
        html += '<div class="message-meta">';
        html += '<span>' + formatTime(msg.timestamp) + '</span>';
        html += '</div>';

        messageEl.innerHTML = html;
        chatMessages.appendChild(messageEl);

        if (animate) {
            scrollToBottom();
        }
    }

    function renderOutboundTag(tag) {
        var tagConfig = {
            'OUTBOUND':         { emoji: '🔔', label: 'OUTBOUND',         css: 'tag-outbound' },
            'BRANCH_MOVEMENT':  { emoji: '🚀', label: 'BRANCH MOVEMENT', css: 'tag-branch-movement' },
            'WARNING':          { emoji: '⚠️', label: 'WARNING',          css: 'tag-warning' },
            'SUGGESTION':       { emoji: '💡', label: 'SUGGESTION',       css: 'tag-suggestion' },
            'STRUCTURE':        { emoji: '📁', label: 'STRUCTURE',        css: 'tag-structure' },
            'PROGRESS':         { emoji: '📊', label: 'PROGRESS',         css: 'tag-progress' }
        };

        var config = tagConfig[tag] || tagConfig['OUTBOUND'];
        return '<div class="outbound-tag ' + config.css + '">' +
               config.emoji + ' ' + config.label +
               '</div>';
    }

    // ══════════════════════════════════════════════════════════
    // CONTENT FORMATTING — Format Konten Pesan
    // ══════════════════════════════════════════════════════════

    function formatContent(text) {
        if (!text) return '';

        var html = escapeHtml(text);

        // Code blocks (``` ... ```)
        html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, function (_, lang, code) {
            return '<pre><code class="lang-' + lang + '">' + code.trim() + '</code></pre>';
        });

        // Inline code (` ... `)
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

        // Bold (**text**)
        html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

        // Italic (*text*)
        html = html.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');

        // Blockquote (> text)
        html = html.replace(/^&gt;\s?(.+)$/gm, '<blockquote>$1</blockquote>');

        // Unordered list (- item)
        html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
        html = html.replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>');
        // Clean up nested ul tags
        html = html.replace(/<\/ul>\s*<ul>/g, '');

        // Line breaks
        html = html.replace(/\n/g, '<br>');

        // Clean up double br after block elements
        html = html.replace(/<\/(pre|blockquote|ul|ol)><br>/g, '</$1>');
        html = html.replace(/<br><(pre|blockquote|ul|ol)/g, '<$1');

        return html;
    }

    function escapeHtml(text) {
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ══════════════════════════════════════════════════════════
    // UI HELPERS — Fungsi Bantu Tampilan
    // ══════════════════════════════════════════════════════════

    function showTyping() {
        if (typingIndicator) {
            typingIndicator.classList.add('visible');
            scrollToBottom();
        }
    }

    function hideTyping() {
        if (typingIndicator) {
            typingIndicator.classList.remove('visible');
        }
    }

    function hideWelcome() {
        if (welcomeScreen) {
            welcomeScreen.style.display = 'none';
            state.isWelcomeVisible = false;
        }
    }

    function showWelcome() {
        if (welcomeScreen) {
            welcomeScreen.style.display = 'flex';
            state.isWelcomeVisible = true;
        }
    }

    function clearChat() {
        if (chatMessages) {
            chatMessages.innerHTML = '';
        }
        state.messages = [];
        vscode.setState(state);
        showWelcome();
        chatMessages.appendChild(welcomeScreen);
        chatMessages.appendChild(typingIndicator);
    }

    function scrollToBottom() {
        if (chatMessages) {
            requestAnimationFrame(function () {
                chatMessages.scrollTop = chatMessages.scrollHeight;
            });
        }
    }

    function autoResizeInput() {
        if (inputField) {
            inputField.style.height = 'auto';
            inputField.style.height = Math.min(inputField.scrollHeight, 120) + 'px';
        }
    }

    function updateSendButton() {
        if (sendBtn && inputField) {
            sendBtn.disabled = inputField.value.trim().length === 0;
        }
    }

    // ══════════════════════════════════════════════════════════
    // STATE PERSISTENCE — Penyimpanan Status
    // ══════════════════════════════════════════════════════════

    function saveMessage(msg) {
        state.messages.push(msg);
        // Batasi riwayat pesan agar tidak membengkak
        if (state.messages.length > 200) {
            state.messages = state.messages.slice(-150);
        }
        vscode.setState(state);
    }

    // ══════════════════════════════════════════════════════════
    // UTILITIES — Fungsi Bantu Umum
    // ══════════════════════════════════════════════════════════

    function generateId() {
        return 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    }

    function formatTime(isoString) {
        try {
            var date = new Date(isoString);
            return date.toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return '';
        }
    }

    // ── Mulai! ──
    init();
})();
