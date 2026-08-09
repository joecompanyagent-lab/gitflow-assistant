import * as vscode from 'vscode';
import { ChatViewProvider } from './providers/ChatViewProvider';
import { GroqService } from './services/GroqService';
// import { GitService } from './services/GitService';  // Phase 4

/**
 * Fungsi aktivasi ekstensi — dipanggil saat VS Code mengaktifkan ekstensi ini.
 * (Membuka toko & menyalakan semua sistem saat toko pertama kali buka)
 */
export function activate(context: vscode.ExtensionContext): void {
    console.log('🔔 [GitFlow Assistant] Ekstensi berhasil diaktifkan!');

    // ── Inisialisasi Services ──
    const groqService = new GroqService();

    // ── Inisialisasi Chat View Provider ──
    const chatProvider = new ChatViewProvider(context.extensionUri);

    // Daftarkan webview view provider ke sidebar
    const chatViewRegistration = vscode.window.registerWebviewViewProvider(
        ChatViewProvider.viewType,
        chatProvider,
        {
            webviewOptions: {
                retainContextWhenHidden: true,
            },
        }
    );

    // ── Handle Pesan dari User ──
    chatProvider.onUserMessage(async (message: string) => {
        await handleUserMessage(message, chatProvider, groqService);
    });

    // ── Monitor perubahan konfigurasi ──
    // (Jika user mengubah API key di Settings, reload koneksi AI)
    const configWatcher = vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration('gitflowAssistant.groqApiKey') ||
            e.affectsConfiguration('gitflowAssistant.groqModel')) {
            groqService.reload();
            console.log('🔄 [GitFlow Assistant] Konfigurasi API diperbarui.');

            if (groqService.isConfigured()) {
                chatProvider.sendAssistantMessage(
                    '✅ **API Key berhasil diperbarui!** *(kunci akses ke otak AI sudah dipasang)*\n\n' +
                    'Otak AI sekarang terhubung. Silakan tanya apa saja! 🤖',
                    'OUTBOUND'
                );
            }
        }
    });

    // ── Registrasi Command: Buka Chat ──
    const openChatCmd = vscode.commands.registerCommand(
        'gitflowAssistant.openChat',
        () => {
            vscode.commands.executeCommand('gitflowAssistant.chatView.focus');
        }
    );

    // ── Registrasi Command: Lihat Status Branch ──
    const showBranchStatusCmd = vscode.commands.registerCommand(
        'gitflowAssistant.showBranchStatus',
        async () => {
            chatProvider.showTyping();
            const response = await groqService.sendMessage(
                'Tampilkan status branch saat ini menggunakan format tabel. Jelaskan setiap branch dengan analogi awam.',
                getCurrentBranch()
            );
            chatProvider.sendAssistantMessage(response, 'OUTBOUND');
        }
    );

    // ── Registrasi Command: Lihat Progress ──
    const showProgressCmd = vscode.commands.registerCommand(
        'gitflowAssistant.showProgress',
        async () => {
            chatProvider.showTyping();
            const response = await groqService.sendMessage(
                'Tampilkan progress pembangunan VSIX GitFlow Assistant saat ini. ' +
                'Phase 0 (Setup GitFlow) dan Phase 1 (Scaffold) sudah selesai. ' +
                'Phase 2 (Webview UI) sudah selesai. ' +
                'Phase 3 (Groq API) sedang dikerjakan. ' +
                'Phase 4-7 belum dimulai. Gunakan format tracker visual.',
                getCurrentBranch()
            );
            chatProvider.sendAssistantMessage(response, 'PROGRESS');
        }
    );

    // Daftarkan semua disposable
    context.subscriptions.push(
        chatViewRegistration,
        configWatcher,
        openChatCmd,
        showBranchStatusCmd,
        showProgressCmd
    );
}

/**
 * Menangani pesan user dari chat — sekarang menggunakan Groq AI!
 * (Menerima pertanyaan user, mengirim ke otak AI, dan menampilkan jawaban)
 */
async function handleUserMessage(
    message: string,
    chatProvider: ChatViewProvider,
    groqService: GroqService
): Promise<void> {
    // Jika AI belum terhubung, berikan panduan setup
    if (!groqService.isConfigured()) {
        const setupGuide = await groqService.sendMessage(message);
        chatProvider.sendAssistantMessage(setupGuide, 'SUGGESTION');
        return;
    }

    // Tampilkan typing indicator
    chatProvider.showTyping();

    try {
        // Kirim ke Groq API dengan streaming
        const fullReply = await groqService.sendMessageStreaming(
            message,
            getCurrentBranch(),
            (partialResponse: string) => {
                // Update bubble chat secara real-time (streaming)
                chatProvider.hideTyping();
                chatProvider.streamAssistantMessage(partialResponse, false);
            }
        );
        // Kirim sinyal streaming selesai
        chatProvider.streamAssistantMessage(fullReply, true);
    } catch (error) {
        chatProvider.hideTyping();
        chatProvider.sendAssistantMessage(
            '⚠️ Terjadi kesalahan saat menghubungi otak AI. Silakan coba lagi.',
            'WARNING'
        );
        console.error('[GitFlow Assistant] Error:', error);
    }
}

/**
 * Mendapatkan nama branch aktif saat ini dari Git.
 * (Mengecek di ruangan mana kita sedang bekerja)
 * 
 * Catatan: Implementasi penuh akan datang di Phase 4 (feat/git-detector).
 * Saat ini menggunakan VS Code Git Extension API yang tersedia.
 */
function getCurrentBranch(): string | undefined {
    try {
        const gitExtension = vscode.extensions.getExtension('vscode.git');
        if (gitExtension?.isActive) {
            const git = gitExtension.exports.getAPI(1);
            const repo = git.repositories[0];
            if (repo?.state?.HEAD?.name) {
                return repo.state.HEAD.name;
            }
        }
    } catch {
        // Git extension tidak tersedia — abaikan
    }
    return undefined;
}

/**
 * Fungsi deaktivasi — dipanggil saat ekstensi dimatikan.
 * (Menutup toko & mematikan semua sistem)
 */
export function deactivate(): void {
    console.log('👋 [GitFlow Assistant] Ekstensi dinonaktifkan.');
}
