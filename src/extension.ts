import * as vscode from 'vscode';
import { ChatViewProvider } from './providers/ChatViewProvider';
import { GroqService } from './services/GroqService';
import { GitService } from './services/GitService';
import { formatBranchName } from './utils/formatter';

/**
 * Fungsi aktivasi ekstensi — dipanggil saat VS Code mengaktifkan ekstensi ini.
 * (Membuka toko & menyalakan semua sistem saat toko pertama kali buka)
 */
export function activate(context: vscode.ExtensionContext): void {
    console.log('🔔 [GitFlow Assistant] Ekstensi berhasil diaktifkan!');

    // ── Inisialisasi Services ──
    const groqService = new GroqService();
    const gitService = new GitService();

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

    // ── Hubungkan GitService ke ChatProvider ──
    // (Memasang alarm CCTV yang terhubung ke ruang chat)
    gitService.setCallbacks({
        // Saat branch berubah → notifikasi otomatis
        onBranchChanged: (oldBranch: string, newBranch: string) => {
            const oldFormatted = formatBranchName(oldBranch);
            const newFormatted = formatBranchName(newBranch);

            chatProvider.sendAssistantMessage(
                `🔀 **Branch berubah!**\n\n` +
                `**Dari:** ${oldFormatted}\n` +
                `**Ke:** ${newFormatted}\n\n` +
                `_Anda baru saja pindah ruangan kerja (checkout/switch)._`,
                'BRANCH_MOVEMENT'
            );

            // Update badge di header
            chatProvider.updateBranchBadge(newBranch);
        },

        // Saat pelanggaran terdeteksi → peringatan otomatis
        onViolationDetected: (violation) => {
            chatProvider.sendAssistantMessage(
                `${violation.descriptionAwam}\n\n` +
                `💡 **Saran:** ${violation.suggestion}`,
                'WARNING'
            );
        },

        // Saat branch mangkrak ditemukan → pengingat
        onStaleBranchFound: (branches) => {
            const branchList = branches
                .map(b => `- \`${b.name}\``)
                .join('\n');

            chatProvider.sendAssistantMessage(
                `🕐 **Branch Mangkrak Terdeteksi!**\n` +
                `*(meja eksperimen yang sudah lama ditinggalkan)*\n\n` +
                `Branch berikut sudah tidak ada aktivitas selama 7+ hari:\n${branchList}\n\n` +
                `💡 **Saran:** Apakah fitur ini masih dikerjakan? Jika tidak, sebaiknya hapus dengan \`git branch -d nama-branch\` *(membereskan meja yang tidak terpakai)*.`,
                'WARNING'
            );
        },
    });

    // Inisialisasi GitService (async)
    gitService.initialize().then((success) => {
        if (success) {
            const currentBranch = gitService.getCurrentBranch();
            chatProvider.updateBranchBadge(currentBranch);
            console.log(`[GitFlow] Git detector aktif. Branch: ${currentBranch}`);
        } else {
            console.warn('[GitFlow] Git detector gagal inisialisasi — repo mungkin belum ada.');
        }
    });

    // ── Handle Pesan dari User ──
    chatProvider.onUserMessage(async (message: string) => {
        await handleUserMessage(message, chatProvider, groqService, gitService);
    });

    // ── Monitor perubahan konfigurasi ──
    const configWatcher = vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration('gitflowAssistant.groqApiKey') ||
            e.affectsConfiguration('gitflowAssistant.groqModel')) {
            groqService.reload();

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
            if (gitService.isReady()) {
                const status = await gitService.getCorebranchStatus();
                chatProvider.sendAssistantMessage(status, 'OUTBOUND');
            } else {
                chatProvider.sendAssistantMessage(
                    '⚠️ Git detector belum terhubung.\n' +
                    'Pastikan folder ini adalah repositori Git *(punya folder `.git`)*.',
                    'WARNING'
                );
            }
        }
    );

    // ── Registrasi Command: Lihat Progress ──
    const showProgressCmd = vscode.commands.registerCommand(
        'gitflowAssistant.showProgress',
        async () => {
            if (groqService.isConfigured()) {
                chatProvider.showTyping();
                const response = await groqService.sendMessage(
                    'Tampilkan progress pembangunan VSIX GitFlow Assistant. ' +
                    'Phase 0-3 sudah selesai. Phase 4 (Git Detector) sedang dikerjakan. ' +
                    'Phase 5-7 belum dimulai. Gunakan format tracker visual.',
                    gitService.getCurrentBranch()
                );
                chatProvider.sendAssistantMessage(response, 'PROGRESS');
            } else {
                chatProvider.sendAssistantMessage(
                    '📊 **Progress Pembangunan VSIX — GitFlow Assistant:**\n\n' +
                    '✅ Phase 0: Setup GitFlow\n' +
                    '✅ Phase 1: Scaffold\n' +
                    '✅ Phase 2: Webview UI\n' +
                    '✅ Phase 3: Groq API\n' +
                    '🔄 Phase 4: Git Detector ← _sedang dikerjakan_\n' +
                    '⬜ Phase 5: Outbound Chat\n' +
                    '⬜ Phase 6: Staging Test\n' +
                    '⬜ Phase 7: Release v1.0.0',
                    'PROGRESS'
                );
            }
        }
    );

    // Daftarkan semua disposable
    context.subscriptions.push(
        chatViewRegistration,
        configWatcher,
        openChatCmd,
        showBranchStatusCmd,
        showProgressCmd,
        gitService
    );
}

/**
 * Menangani pesan user dari chat — menggunakan Groq AI + konteks Git.
 * (Menerima pertanyaan, memperkaya dengan konteks branch, kirim ke otak AI)
 */
async function handleUserMessage(
    message: string,
    chatProvider: ChatViewProvider,
    groqService: GroqService,
    gitService: GitService
): Promise<void> {
    // Jika AI belum terhubung, berikan panduan setup
    if (!groqService.isConfigured()) {
        const setupGuide = await groqService.sendMessage(message);
        chatProvider.sendAssistantMessage(setupGuide, 'SUGGESTION');
        return;
    }

    // Tampilkan typing indicator
    chatProvider.showTyping();

    // Dapatkan konteks branch saat ini
    const currentBranch = gitService.isReady()
        ? gitService.getCurrentBranch()
        : undefined;

    try {
        // Kirim ke Groq API dengan streaming
        const fullReply = await groqService.sendMessageStreaming(
            message,
            currentBranch,
            (partialResponse: string) => {
                chatProvider.hideTyping();
                chatProvider.streamAssistantMessage(partialResponse, false);
            }
        );
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
 * Fungsi deaktivasi — dipanggil saat ekstensi dimatikan.
 * (Menutup toko & mematikan semua sistem)
 */
export function deactivate(): void {
    console.log('👋 [GitFlow Assistant] Ekstensi dinonaktifkan.');
}
