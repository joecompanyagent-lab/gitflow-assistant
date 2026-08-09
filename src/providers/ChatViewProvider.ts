/**
 * ChatViewProvider — Webview Provider untuk panel chat GitFlow Assistant.
 * (Manajer tampilan ruang chat — mengatur bagaimana bubble chat ditampilkan
 *  dan mengelola komunikasi antara tampilan dan otak ekstensi)
 *
 * Tanggung jawab:
 * - Menampilkan panel chat di sidebar VS Code
 * - Mengelola komunikasi Webview ↔ Extension via postMessage
 * - Menyediakan HTML, CSS, JS untuk tampilan chat
 * - Menerima pesan user dan meneruskannya ke service layer
 */

import * as vscode from 'vscode';

export class ChatViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'gitflowAssistant.chatView';

    private _view?: vscode.WebviewView;

    // Callback untuk menangani pesan dari user
    private _onUserMessage?: (message: string) => void;

    constructor(private readonly _extensionUri: vscode.Uri) {}

    /**
     * Mendaftarkan callback saat user mengirim pesan dari chat.
     * (Memasang pendengar yang akan dipanggil setiap kali user mengetik sesuatu)
     */
    public onUserMessage(callback: (message: string) => void): void {
        this._onUserMessage = callback;
    }

    /**
     * Mengirim pesan balasan AI ke webview chat.
     * (Menampilkan bubble kiri — balasan dari asisten)
     */
    public sendAssistantMessage(content: string, outboundTag?: string): void {
        if (this._view) {
            this._view.webview.postMessage({
                type: outboundTag ? 'outboundNotification' : 'assistantMessage',
                content: content,
                tag: outboundTag,
            });
        }
    }

    /**
     * Mengirim update streaming ke webview (memperbarui bubble terakhir).
     * (Menampilkan jawaban AI secara bertahap — kata per kata)
     */
    public streamAssistantMessage(content: string, isComplete: boolean): void {
        if (this._view) {
            this._view.webview.postMessage({
                type: 'streamUpdate',
                content: content,
                isComplete: isComplete,
            });
        }
    }

    /**
     * Memperbarui badge branch di header chat.
     * (Mengganti label ruangan aktif yang tertera di bagian atas chat)
     */
    public updateBranchBadge(branchName: string): void {
        if (this._view) {
            this._view.webview.postMessage({
                type: 'branchUpdate',
                branch: branchName,
            });
        }
    }

    /**
     * Menampilkan indikator "sedang mengetik" di chat.
     * (Menunjukkan bahwa AI sedang memproses jawaban — titik-titik bergerak)
     */
    public showTyping(): void {
        if (this._view) {
            this._view.webview.postMessage({ type: 'showTyping' });
        }
    }

    /**
     * Menyembunyikan indikator "sedang mengetik".
     */
    public hideTyping(): void {
        if (this._view) {
            this._view.webview.postMessage({ type: 'hideTyping' });
        }
    }

    /**
     * Dipanggil oleh VS Code saat webview view perlu ditampilkan.
     * (Saat VS Code membuka panel sidebar, fungsi ini menyiapkan seluruh konten)
     */
    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ): void {
        this._view = webviewView;

        // Konfigurasi webview
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
        };

        // Render HTML
        webviewView.webview.html = this._getHtmlContent(webviewView.webview);

        // Dengarkan pesan dari webview
        webviewView.webview.onDidReceiveMessage(
            (message) => {
                switch (message.type) {
                    case 'webviewReady':
                        // Webview siap — kirim sapaan awal
                        this._sendInitialGreeting();
                        break;

                    case 'userMessage':
                        // User mengirim pesan — teruskan ke handler
                        if (this._onUserMessage) {
                            this._onUserMessage(message.content);
                        }
                        break;
                }
            },
            undefined,
            []
        );
    }

    /**
     * Mengirim sapaan awal saat webview pertama kali dibuka.
     * (Pesan selamat datang otomatis — Outbound Chat Skenario 1)
     */
    private _sendInitialGreeting(): void {
        const greeting = [
            '**Halo! Selamat datang di GitFlow Assistant** 👋\n',
            'Saya asisten interaktif yang akan membimbing alur kerja Git Anda dengan bahasa yang mudah dipahami.\n',
            '**Apa yang bisa saya bantu?**\n',
            '- 🌿 Tanya tentang **branch** (ruangan kerja Git)',
            '- 🔀 Panduan **merge** (menggabungkan kerjaan)',
            '- 📊 Lihat **progress** fase pembangunan',
            '- 💡 Saran **commit message** yang baik',
            '- ⚠️ Peringatan jika ada pelanggaran alur\n',
            '_Ketik pesan Anda di bawah, atau klik salah satu shortcut!_ 👇',
        ].join('\n');

        setTimeout(() => {
            this.sendAssistantMessage(greeting, 'OUTBOUND');
        }, 500);
    }

    /**
     * Menghasilkan konten HTML lengkap untuk webview.
     * (Membangun seluruh halaman chat dari nol — struktur, gaya, logika)
     */
    private _getHtmlContent(webview: vscode.Webview): string {
        // URI untuk aset lokal
        const cssUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'media', 'main.css')
        );
        const jsUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js')
        );

        // Nonce untuk Content Security Policy
        const nonce = this._getNonce();

        return `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" 
          content="default-src 'none'; 
                   style-src ${webview.cspSource} 'unsafe-inline'; 
                   script-src 'nonce-${nonce}';
                   font-src ${webview.cspSource};">
    <link href="${cssUri}" rel="stylesheet">
    <title>GitFlow Assistant</title>
</head>
<body>
    <div class="app-container">

        <!-- ═══ Header Bar ═══ -->
        <div class="header-bar">
            <div class="header-title">
                <span class="icon">🌿</span>
                <span>GitFlow</span>
            </div>
            <div class="header-branch-badge" id="branch-badge">🌿 detecting...</div>
            <div class="header-actions">
                <button class="header-btn" id="btn-clear" title="Bersihkan Chat">🗑️</button>
            </div>
        </div>

        <!-- ═══ Chat Messages Area ═══ -->
        <div class="chat-messages" id="chat-messages">

            <!-- Welcome Screen -->
            <div class="welcome-screen" id="welcome-screen">
                <div class="welcome-icon">🌿🤖</div>
                <div class="welcome-title">GitFlow Assistant</div>
                <div class="welcome-subtitle">
                    Asisten alur kerja Git dengan bahasa yang mudah dipahami
                </div>
                <div class="welcome-shortcuts">
                    <button class="shortcut-btn" data-message="Jelaskan alur GitFlow">
                        <span class="shortcut-icon">🔀</span>
                        <span class="shortcut-label">Jelaskan alur GitFlow</span>
                    </button>
                    <button class="shortcut-btn" data-message="Lihat status branch saat ini">
                        <span class="shortcut-icon">🌿</span>
                        <span class="shortcut-label">Status branch saat ini</span>
                    </button>
                    <button class="shortcut-btn" data-message="Tampilkan progress pembangunan">
                        <span class="shortcut-icon">📊</span>
                        <span class="shortcut-label">Progress pembangunan</span>
                    </button>
                    <button class="shortcut-btn" data-message="Bantu saya menulis commit message">
                        <span class="shortcut-icon">💡</span>
                        <span class="shortcut-label">Bantu tulis commit message</span>
                    </button>
                </div>
            </div>

            <!-- Typing Indicator -->
            <div class="typing-indicator" id="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>

        </div>

        <!-- ═══ Input Area ═══ -->
        <div class="input-area">
            <div class="input-wrapper">
                <textarea 
                    id="input-field" 
                    class="input-field" 
                    placeholder="Ketik pesan..." 
                    rows="1"
                    spellcheck="false"
                ></textarea>
            </div>
            <button id="send-btn" class="send-btn" disabled title="Kirim Pesan (Enter)">
                ➤
            </button>
        </div>

    </div>

    <script nonce="${nonce}" src="${jsUri}"></script>
    <script nonce="${nonce}">
        // Clear chat handler
        document.getElementById('btn-clear').addEventListener('click', function() {
            const vscodeApi = acquireVsCodeApi();
            vscodeApi.postMessage({ type: 'clearChat' });
            // Reset local state
            vscodeApi.setState({ messages: [], isWelcomeVisible: true });
            location.reload();
        });
    </script>
</body>
</html>`;
    }

    /**
     * Menghasilkan nonce acak untuk Content Security Policy.
     * (Membuat kode rahasia unik agar hanya script kita yang boleh berjalan)
     */
    private _getNonce(): string {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
}
