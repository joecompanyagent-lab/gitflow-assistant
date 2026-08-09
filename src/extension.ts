import * as vscode from 'vscode';
import { ChatViewProvider } from './providers/ChatViewProvider';
import { GroqService } from './services/GroqService';
import { GitService } from './services/GitService';
import { NotificationService } from './services/NotificationService';
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

    // ── Inisialisasi Notification Service (Engine Proaktif) ──
    const notificationService = new NotificationService(chatProvider, gitService);

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

    // ── Hubungkan GitService ke NotificationService & ChatProvider ──
    gitService.setCallbacks({
        // Skenario 2: Branch Event Notification (Movement)
        onBranchChanged: (oldBranch: string, newBranch: string) => {
            notificationService.sendBranchEventNotification(
                oldBranch,
                newBranch,
                'git checkout / git switch',
                'User / Developer',
                `Pindah dari ${oldBranch} ke ${newBranch}`,
                `Pastikan Anda berada di branch yang tepat sebelum membuat/mengubah kode`
            );

            // Update badge di header chat
            chatProvider.updateBranchBadge(newBranch);
        },

        // Skenario 3: Proactive Violation Warning
        onViolationDetected: (violation) => {
            notificationService.sendProactiveWarning(violation);
        },

        // Skenario 4: Stale Branch Alert (>7 hari)
        onStaleBranchFound: (staleBranches) => {
            notificationService.sendStaleBranchAlert(staleBranches);
        },
    });

    // Inisialisasi GitService (async & safe)
    gitService.initialize().then((success) => {
        if (success) {
            const currentBranch = gitService.getCurrentBranch();
            chatProvider.updateBranchBadge(currentBranch);
            console.log(`[GitFlow] Git detector aktif. Branch: ${currentBranch}`);
        } else {
            console.warn('[GitFlow] Git detector berjalan terbatas (bukan folder Git).');
        }
        // Selalu tampilkan sapaan awal & UI chat
        setTimeout(() => {
            notificationService.sendInitialGreeting();
        }, 300);
    }).catch((err) => {
        console.warn('[GitFlow] Error GitService:', err);
        setTimeout(() => {
            notificationService.sendInitialGreeting();
        }, 300);
    });

    // ── Skenario 5: File & Structure Guard Watcher ──
    // Dengarkan perubahan dokumen di editor
    const textDocumentWatcher = vscode.workspace.onDidSaveTextDocument((document) => {
        if (gitService.isReady()) {
            const currentBranch = gitService.getCurrentBranch();
            const relativePath = vscode.workspace.asRelativePath(document.uri);
            notificationService.inspectFileChangeForBranch(relativePath, currentBranch);
        }
    });

    // ── Handle Pesan dari User ──
    chatProvider.onUserMessage(async (message: string) => {
        await handleUserMessage(message, chatProvider, groqService, gitService);
    });

    // ── Handle Action Button Clicks (One-Click Git Actions) ──
    chatProvider.onActionClicked(async (action: string, params?: Record<string, string>) => {
        switch (action) {
            case 'createFeatureBranch': {
                const featureName = await vscode.window.showInputBox({
                    prompt: 'Masukkan nama fitur baru (misal: login-ui, groq-api)',
                    placeHolder: 'misal: webview-chat, dark-mode',
                });
                if (featureName && featureName.trim().length > 0) {
                    const cleanName = `feat/${featureName.trim().toLowerCase().replace(/\s+/g, '-')}`;
                    const terminal = vscode.window.createTerminal('GitFlow');
                    terminal.show();
                    terminal.sendText(`git checkout dev && git checkout -b ${cleanName}`);
                    chatProvider.sendAssistantMessage(
                        `🌿 **Membuat Branch Fitur Baru!**\n\n` +
                        `Menjalankan perintah: \`git checkout dev && git checkout -b ${cleanName}\` *(pindah ke dapur utama lalu membuka meja eksperimen baru)*`,
                        'BRANCH_MOVEMENT'
                    );
                }
                break;
            }

            case 'switchBranch': {
                const branches = await gitService.getAllBranches();
                const branchNames = branches.map(b => b.name);
                const selected = await vscode.window.showQuickPick(branchNames, {
                    placeHolder: 'Pilih branch yang ingin dituju (pindah ruangan kerja)',
                });
                if (selected) {
                    const terminal = vscode.window.createTerminal('GitFlow');
                    terminal.show();
                    terminal.sendText(`git checkout ${selected}`);
                }
                break;
            }

            case 'deleteBranch': {
                const branchToDelete = params?.branchName || await vscode.window.showInputBox({
                    prompt: 'Nama branch yang ingin dihapus (membereskan meja kerja yang tidak terpakai)',
                });
                if (branchToDelete) {
                    const terminal = vscode.window.createTerminal('GitFlow');
                    terminal.show();
                    terminal.sendText(`git branch -d ${branchToDelete}`);
                }
                break;
            }

            case 'suggestCommit': {
                const commitMsg = await vscode.window.showInputBox({
                    prompt: 'Masukkan pesan commit (gunakan prefix: feat:, fix:, docs:, chore:)',
                    placeHolder: 'feat: tambah komponen tombol aksi cepat',
                });
                if (commitMsg) {
                    const validation = gitService.checkCommitMessage(commitMsg);
                    if (!validation.isValid) {
                        chatProvider.sendAssistantMessage(validation.suggestion || 'Commit message belum rapi', 'WARNING');
                    } else {
                        const terminal = vscode.window.createTerminal('GitFlow');
                        terminal.show();
                        terminal.sendText(`git add -A && git commit -m "${commitMsg}"`);
                    }
                }
                break;
            }

            case 'showBranchStatus': {
                const status = await gitService.getCorebranchStatus();
                chatProvider.sendAssistantMessage(status, 'OUTBOUND');
                break;
            }
        }
    });

    // ── Monitor perubahan konfigurasi ──
    const configWatcher = vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration('gitflowAssistant.groqApiKey') ||
            e.affectsConfiguration('gitflowAssistant.groqApiKeys') ||
            e.affectsConfiguration('gitflowAssistant.groqModel')) {
            groqService.reload();

            if (groqService.isConfigured()) {
                const count = groqService.getAllApiKeys().length;
                chatProvider.sendAssistantMessage(
                    `✅ **Pengaturan API Key diperbarui!** *(${count} API Key terdaftar untuk rotasi & auto-fallback)*\n\n` +
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
                    'Phase 0-4 sudah selesai. Phase 5 (Outbound Chat & Notification Engine) sedang dikerjakan. ' +
                    'Phase 6-7 belum dimulai. Gunakan format tracker visual.',
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
                    '✅ Phase 4: Git Detector\n' +
                    '🔄 Phase 5: Outbound Chat Engine ← _sedang dikerjakan_\n' +
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
        textDocumentWatcher,
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
