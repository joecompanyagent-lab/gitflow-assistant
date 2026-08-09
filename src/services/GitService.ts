/**
 * GitService — Layanan deteksi dan monitoring Git.
 * (Penjaga dan pengawas seluruh aktivitas Git di proyek)
 *
 * 📌 Akan diimplementasikan di Phase 4 (feat/git-detector)
 *
 * Tanggung jawab:
 * - Mendeteksi branch aktif saat ini
 * - Memonitor pergerakan branch (push, merge, checkout)
 * - Mendeteksi pelanggaran alur GitFlow
 * - Mendeteksi branch mangkrak (stale branches)
 * - Memicu notifikasi proaktif ke ChatViewProvider
 */

import * as vscode from 'vscode';

export class GitService {
    private _currentBranch: string = 'unknown';

    constructor() {
        // Git API akan diinisialisasi di Phase 4
    }

    /**
     * Placeholder — Mendapatkan nama branch aktif saat ini
     * (Mengecek di ruangan mana kita sedang bekerja)
     */
    public getCurrentBranch(): string {
        return this._currentBranch;
    }

    /**
     * Placeholder — Mendapatkan daftar semua branch lokal
     * (Melihat daftar semua ruangan kerja yang tersedia)
     */
    public async getAllBranches(): Promise<string[]> {
        // Akan diimplementasikan di Phase 4
        return [];
    }

    /**
     * Placeholder — Memeriksa status file (modified, staged, untracked)
     * (Mengecek apa saja yang berubah di meja kerja)
     */
    public async getStatus(): Promise<string> {
        // Akan diimplementasikan di Phase 4
        return '🚧 Git detector belum aktif. Tunggu Phase 4 (feat/git-detector).';
    }

    /**
     * Placeholder — Mulai mendengarkan perubahan Git
     * (Menyalakan CCTV untuk mengawasi aktivitas Git)
     */
    public startWatching(): vscode.Disposable {
        // Akan diimplementasikan di Phase 4
        return new vscode.Disposable(() => {});
    }
}
