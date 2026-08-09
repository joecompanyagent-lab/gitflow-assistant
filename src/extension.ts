import * as vscode from 'vscode';
import { ChatViewProvider } from './providers/ChatViewProvider';
// import { GitService } from './services/GitService';  // Phase 4

/**
 * Fungsi aktivasi ekstensi — dipanggil saat VS Code mengaktifkan ekstensi ini.
 * (Membuka toko & menyalakan semua sistem saat toko pertama kali buka)
 */
export function activate(context: vscode.ExtensionContext): void {
    console.log('🔔 [GitFlow Assistant] Ekstensi berhasil diaktifkan!');

    // ── Inisialisasi Chat View Provider ──
    // (Menyiapkan manajer tampilan chat di sidebar)
    const chatProvider = new ChatViewProvider(context.extensionUri);

    // Daftarkan webview view provider ke sidebar
    const chatViewRegistration = vscode.window.registerWebviewViewProvider(
        ChatViewProvider.viewType,
        chatProvider,
        {
            webviewOptions: {
                retainContextWhenHidden: true, // Jangan hancurkan chat saat panel tersembunyi
            },
        }
    );

    // ── Handle Pesan dari User ──
    // (Saat user mengetik di chat, proses pesannya di sini)
    chatProvider.onUserMessage((message: string) => {
        handleUserMessage(message, chatProvider);
    });

    // ── Registrasi Command: Buka Chat ──
    const openChatCmd = vscode.commands.registerCommand(
        'gitflowAssistant.openChat',
        () => {
            // Fokuskan ke panel sidebar chat
            vscode.commands.executeCommand('gitflowAssistant.chatView.focus');
        }
    );

    // ── Registrasi Command: Lihat Status Branch ──
    const showBranchStatusCmd = vscode.commands.registerCommand(
        'gitflowAssistant.showBranchStatus',
        () => {
            chatProvider.sendAssistantMessage(
                '🌿 **Status Branch** akan tersedia sepenuhnya di Phase 4 (`feat/git-detector`).\n\n' +
                'Fitur ini akan mendeteksi semua branch secara otomatis dan menampilkan statusnya.',
                'SUGGESTION'
            );
        }
    );

    // ── Registrasi Command: Lihat Progress ──
    const showProgressCmd = vscode.commands.registerCommand(
        'gitflowAssistant.showProgress',
        () => {
            const progressMessage = [
                '**Progress Pembangunan VSIX — GitFlow Assistant:**\n',
                '✅ Phase 0: Setup GitFlow *(rename master → main, buat dev & staging)*',
                '✅ Phase 1: Scaffold *(kerangka dasar proyek)*',
                '🔄 Phase 2: Webview UI *(tampilan chat — sedang dikerjakan)*',
                '⬜ Phase 3: Groq API *(integrasi otak AI)*',
                '⬜ Phase 4: Git Detector *(pengawas branch)*',
                '⬜ Phase 5: Outbound Chat *(notifikasi proaktif)*',
                '⬜ Phase 6: Staging Test *(pengujian akhir)*',
                '⬜ Phase 7: Release v1.0.0 *(rilis perdana)*',
            ].join('\n');
            chatProvider.sendAssistantMessage(progressMessage, 'PROGRESS');
        }
    );

    // Daftarkan semua disposable ke context
    context.subscriptions.push(
        chatViewRegistration,
        openChatCmd,
        showBranchStatusCmd,
        showProgressCmd
    );
}

/**
 * Menangani pesan user dari chat.
 * (Menerima pertanyaan user dan mengirim balasan sementara — 
 *  AI integration akan datang di Phase 3)
 */
function handleUserMessage(message: string, chatProvider: ChatViewProvider): void {
    const lowerMsg = message.toLowerCase().trim();

    // ── Respon berbasis keyword (placeholder sebelum Groq API) ──

    if (lowerMsg.includes('alur') || lowerMsg.includes('gitflow') || lowerMsg.includes('flow')) {
        chatProvider.sendAssistantMessage(
            '**Alur GitFlow** *(pergerakan kode dari awal hingga rilis)*:\n\n' +
            '```\nfeat/* ──► dev ──► staging ──► main\n' +
            '                                 ▲\n' +
            '                         hotfix/*─┘\n```\n\n' +
            '**Penjelasan Awam:**\n' +
            '- `feat/*` 🌿 = Meja eksperimen (tempat coba resep baru)\n' +
            '- `dev` 🔵 = Dapur utama (kumpulkan semua resep)\n' +
            '- `staging` 🧪 = Meja pencicipan (uji coba sebelum saji)\n' +
            '- `main` 🟢 = Etalase toko (hidangan yang dilihat pelanggan)\n' +
            '- `hotfix/*` 🛠️ = Pemadam kebakaran (perbaikan darurat)',
            'OUTBOUND'
        );
    } else if (lowerMsg.includes('status') || lowerMsg.includes('branch')) {
        chatProvider.sendAssistantMessage(
            '🌿 **Deteksi branch otomatis** akan aktif di Phase 4 (`feat/git-detector`).\n\n' +
            'Sementara itu, Anda bisa mengecek branch secara manual:\n' +
            '- `git branch` *(melihat daftar ruangan kerja)*\n' +
            '- `git status` *(memeriksa kondisi meja kerja saat ini)*',
            'SUGGESTION'
        );
    } else if (lowerMsg.includes('progress') || lowerMsg.includes('fase') || lowerMsg.includes('phase')) {
        vscode.commands.executeCommand('gitflowAssistant.showProgress');
    } else if (lowerMsg.includes('commit')) {
        chatProvider.sendAssistantMessage(
            '💡 **Panduan Commit Message** *(pesan snapshot)*:\n\n' +
            'Format: `<prefix>: <deskripsi singkat>`\n\n' +
            '| Prefix | Arti | Bahasa Awam |\n' +
            '|---|---|---|\n' +
            '| `feat:` | Fitur baru | Menambah kemampuan baru |\n' +
            '| `fix:` | Perbaikan bug | Memperbaiki kerusakan |\n' +
            '| `docs:` | Dokumentasi | Memperbarui catatan |\n' +
            '| `style:` | Format kode | Merapikan tampilan |\n' +
            '| `refactor:` | Restrukturisasi | Menata ulang isi |\n' +
            '| `chore:` | Pemeliharaan | Beres-beres proyek |\n\n' +
            '**Contoh baik:** `feat: tambah bubble chat kiri untuk respon AI`\n' +
            '**Contoh buruk:** ❌ `update`, `fix`, `wip`, `asdf`',
            'SUGGESTION'
        );
    } else if (lowerMsg.includes('halo') || lowerMsg.includes('hai') || lowerMsg.includes('hello') || lowerMsg.includes('hi')) {
        chatProvider.sendAssistantMessage(
            'Halo juga! 👋\n\n' +
            'Saya **GitFlow Assistant**, siap membantu Anda dengan:\n' +
            '- 🌿 Alur kerja Git (branching, merging)\n' +
            '- 📊 Progress pembangunan proyek\n' +
            '- 💡 Saran commit message & nama branch\n' +
            '- ⚠️ Peringatan jika ada pelanggaran alur\n\n' +
            'Silakan tanya apa saja! 😊',
            'OUTBOUND'
        );
    } else {
        // Default response — placeholder sebelum Groq API (Phase 3)
        chatProvider.sendAssistantMessage(
            '🤖 Terima kasih atas pesannya!\n\n' +
            'Saat ini saya masih dalam mode **placeholder** *(belum terhubung ke AI)*. ' +
            'Integrasi **Groq API** *(otak AI)* akan datang di **Phase 3** (`feat/groq-integration`).\n\n' +
            'Untuk saat ini, coba tanyakan:\n' +
            '- "Jelaskan alur GitFlow"\n' +
            '- "Bantu tulis commit message"\n' +
            '- "Tampilkan progress"\n' +
            '- "Status branch"',
            'SUGGESTION'
        );
    }
}

/**
 * Fungsi deaktivasi — dipanggil saat ekstensi dimatikan.
 * (Menutup toko & mematikan semua sistem)
 */
export function deactivate(): void {
    console.log('👋 [GitFlow Assistant] Ekstensi dinonaktifkan.');
}
