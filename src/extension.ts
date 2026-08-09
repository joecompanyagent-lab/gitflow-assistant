import * as vscode from 'vscode';
// import { ChatViewProvider } from './providers/ChatViewProvider';  // Phase 2
// import { GitService } from './services/GitService';                // Phase 4

/**
 * Fungsi aktivasi ekstensi — dipanggil saat VS Code mengaktifkan ekstensi ini.
 * (Membuka toko & menyalakan semua sistem saat toko pertama kali buka)
 */
export function activate(context: vscode.ExtensionContext): void {
    console.log('🔔 [GitFlow Assistant] Ekstensi berhasil diaktifkan!');

    // ── Registrasi Command: Buka Chat ──
    const openChatCmd = vscode.commands.registerCommand(
        'gitflowAssistant.openChat',
        () => {
            vscode.window.showInformationMessage(
                '🔔 GitFlow Assistant: Chat akan tersedia di Phase 2 (feat/webview-ui)!'
            );
        }
    );

    // ── Registrasi Command: Lihat Status Branch ──
    const showBranchStatusCmd = vscode.commands.registerCommand(
        'gitflowAssistant.showBranchStatus',
        () => {
            vscode.window.showInformationMessage(
                '🌿 GitFlow Assistant: Status Branch akan tersedia di Phase 4 (feat/git-detector)!'
            );
        }
    );

    // ── Registrasi Command: Lihat Progress ──
    const showProgressCmd = vscode.commands.registerCommand(
        'gitflowAssistant.showProgress',
        () => {
            vscode.window.showInformationMessage(
                '📊 GitFlow Assistant: Progress Tracker akan tersedia di Phase 5 (feat/outbound-chat)!'
            );
        }
    );

    // Daftarkan semua command ke context agar otomatis dibersihkan saat ekstensi nonaktif
    context.subscriptions.push(openChatCmd, showBranchStatusCmd, showProgressCmd);
}

/**
 * Fungsi deaktivasi — dipanggil saat ekstensi dimatikan.
 * (Menutup toko & mematikan semua sistem)
 */
export function deactivate(): void {
    console.log('👋 [GitFlow Assistant] Ekstensi dinonaktifkan.');
}
