/**
 * GitService — Layanan deteksi dan monitoring Git secara real-time.
 * (Penjaga dan pengawas seluruh aktivitas Git di proyek —
 *  seperti CCTV yang mengawasi semua pergerakan di toko)
 *
 * Tanggung jawab:
 * - Mendeteksi branch aktif saat ini
 * - Memonitor pergerakan branch (push, merge, checkout)
 * - Mendeteksi pelanggaran alur GitFlow
 * - Mendeteksi branch mangkrak (stale branches)
 * - Memicu notifikasi proaktif ke ChatViewProvider
 */

import * as vscode from 'vscode';
import { BranchInfo, BranchType, BranchStatus } from '../models/types';

/** Tipe Git API dari ekstensi bawaan VS Code */
interface GitAPI {
    repositories: GitRepository[];
    onDidOpenRepository: vscode.Event<GitRepository>;
}

interface GitRepository {
    state: RepositoryState;
    rootUri: vscode.Uri;
    onDidChangeState: vscode.Event<void>;
    getBranches: (query: { remote?: boolean }) => Promise<GitBranch[]>;
    log: (options?: { maxEntries?: number; path?: string }) => Promise<GitCommit[]>;
    status: () => Promise<void>;
}

interface RepositoryState {
    HEAD: GitBranchRef | undefined;
    refs: GitBranchRef[];
    onDidChange: vscode.Event<void>;
}

interface GitBranchRef {
    name?: string;
    commit?: string;
    type?: number; // 0 = local, 1 = remote, 2 = tag
}

interface GitBranch {
    name?: string;
    commit?: string;
    type?: number;
    remote?: string;
}

interface GitCommit {
    hash: string;
    message: string;
    authorDate?: Date;
    authorName?: string;
}

/** Callback untuk notifikasi events */
export interface GitEventCallbacks {
    onBranchChanged?: (oldBranch: string, newBranch: string) => void;
    onViolationDetected?: (violation: GitViolation) => void;
    onStaleBranchFound?: (branches: BranchInfo[]) => void;
}

/** Jenis pelanggaran GitFlow */
export interface GitViolation {
    type: 'direct-push-main' | 'feat-to-main' | 'feature-in-hotfix' | 'new-feature-in-staging' | 'force-push';
    description: string;
    descriptionAwam: string;
    severity: 'warning' | 'error';
    suggestion: string;
}

export class GitService implements vscode.Disposable {
    private _gitApi: GitAPI | undefined;
    private _repo: GitRepository | undefined;
    private _currentBranch: string = 'unknown';
    private _previousBranch: string = 'unknown';
    private _disposables: vscode.Disposable[] = [];
    private _callbacks: GitEventCallbacks = {};
    private _staleBranchCheckInterval: NodeJS.Timeout | undefined;
    private _isInitialized: boolean = false;

    constructor() {
        // Inisialisasi akan dilakukan setelah callback didaftarkan
    }

    /**
     * Mendaftarkan callback untuk event Git.
     * (Memasang alarm yang akan berbunyi saat ada kejadian penting)
     */
    public setCallbacks(callbacks: GitEventCallbacks): void {
        this._callbacks = callbacks;
    }

    /**
     * Inisialisasi service — menghubungkan ke Git API VS Code.
     * (Menyalakan CCTV dan menghubungkannya ke sistem keamanan toko)
     */
    public async initialize(): Promise<boolean> {
        try {
            const gitExtension = vscode.extensions.getExtension<{ getAPI(version: number): GitAPI }>('vscode.git');

            if (!gitExtension) {
                console.warn('[GitFlow] Ekstensi Git VS Code tidak ditemukan.');
                return false;
            }

            if (!gitExtension.exports || typeof gitExtension.exports.getAPI !== 'function') {
                console.warn('[GitFlow] Git extension API tidak tersedia.');
                return false;
            }

            this._gitApi = gitExtension.exports.getAPI(1);

            if (this._gitApi.repositories.length > 0) {
                this._connectToRepository(this._gitApi.repositories[0]);
            }

            // Dengarkan jika repository baru dibuka
            this._disposables.push(
                this._gitApi.onDidOpenRepository((repo: GitRepository) => {
                    if (!this._repo) {
                        this._connectToRepository(repo);
                    }
                })
            );

            this._isInitialized = true;

            // Mulai pengecekan branch mangkrak setiap 30 menit
            this._startStaleBranchChecker();

            return true;
        } catch (error) {
            console.error('[GitFlow] Gagal inisialisasi GitService:', error);
            return false;
        }
    }

    /**
     * Menghubungkan service ke repository Git.
     * (Memasang CCTV ke toko yang baru dibuka)
     */
    private _connectToRepository(repo: GitRepository): void {
        this._repo = repo;

        // Dapatkan branch awal
        this._currentBranch = repo.state.HEAD?.name || 'unknown';
        this._previousBranch = this._currentBranch;

        // Dengarkan perubahan state repository
        this._disposables.push(
            repo.state.onDidChange(() => {
                this._onRepositoryStateChanged();
            })
        );

        console.log(`[GitFlow] Terhubung ke repo. Branch aktif: ${this._currentBranch}`);
    }

    /**
     * Dipanggil saat state repository berubah.
     * (Alarm CCTV berbunyi — ada pergerakan terdeteksi!)
     */
    private _onRepositoryStateChanged(): void {
        if (!this._repo) { return; }

        const newBranch = this._repo.state.HEAD?.name || 'unknown';

        // Cek apakah branch berubah
        if (newBranch !== this._currentBranch) {
            this._previousBranch = this._currentBranch;
            this._currentBranch = newBranch;

            console.log(`[GitFlow] Branch berubah: ${this._previousBranch} → ${this._currentBranch}`);

            // Panggil callback
            if (this._callbacks.onBranchChanged) {
                this._callbacks.onBranchChanged(this._previousBranch, this._currentBranch);
            }

            // Cek pelanggaran pada branch baru
            this._checkBranchViolations(this._currentBranch);
        }
    }

    // ══════════════════════════════════════════════════════════
    // PUBLIC API — Fungsi yang Bisa Diakses dari Luar
    // ══════════════════════════════════════════════════════════

    /**
     * Mendapatkan nama branch aktif saat ini.
     * (Mengecek di ruangan mana kita sedang bekerja)
     */
    public getCurrentBranch(): string {
        if (this._repo?.state.HEAD?.name) {
            this._currentBranch = this._repo.state.HEAD.name;
        }
        return this._currentBranch;
    }

    /**
     * Mendapatkan branch sebelumnya (terakhir sebelum pindah).
     * (Mengecek ruangan mana yang baru saja ditinggalkan)
     */
    public getPreviousBranch(): string {
        return this._previousBranch;
    }

    /**
     * Apakah service sudah terinisialisasi dan terhubung ke repo.
     */
    public isReady(): boolean {
        return this._isInitialized && this._repo !== undefined;
    }

    /**
     * Mendapatkan daftar semua branch lokal beserta informasinya.
     * (Melihat daftar semua ruangan kerja dan statusnya)
     */
    public async getAllBranches(): Promise<BranchInfo[]> {
        if (!this._repo) { return []; }

        try {
            const branches = await this._repo.getBranches({ remote: false });
            const currentBranchName = this.getCurrentBranch();

            const branchInfos: BranchInfo[] = branches.map((branch) => {
                const name = branch.name || 'unknown';
                return {
                    name,
                    type: this._classifyBranch(name),
                    status: this._getBranchStatus(name),
                    isCurrent: name === currentBranchName,
                };
            });

            return branchInfos;
        } catch (error) {
            console.error('[GitFlow] Gagal mengambil daftar branch:', error);
            return [];
        }
    }

    /**
     * Mendapatkan ringkasan status 5 core branch.
     * (Melihat kondisi semua ruangan utama sekaligus)
     */
    public async getCorebranchStatus(): Promise<string> {
        const branches = await this.getAllBranches();
        const current = this.getCurrentBranch();

        const findBranch = (name: string) => branches.find(b => b.name === name);
        const countByType = (type: BranchType) => branches.filter(b => b.type === type).length;

        const mainBranch = findBranch('main');
        const devBranch = findBranch('dev');
        const stagingBranch = findBranch('staging');
        const featCount = countByType('feat');
        const hotfixCount = countByType('hotfix');

        const lines = [
            `📊 **Status 5 Core Branches:**\n`,
            `| Branch | Status | Keterangan |`,
            `|---|---|---|`,
            `| 🟢 \`main\` | ${mainBranch ? '✅ Ada' : '❌ Belum ada'} | Etalase toko (produksi) |`,
            `| 🔵 \`dev\` | ${devBranch ? '✅ Ada' : '❌ Belum ada'} | Dapur utama (integrasi) |`,
            `| 🧪 \`staging\` | ${stagingBranch ? '✅ Ada' : '❌ Belum ada'} | Meja pencicipan (QA) |`,
            `| 🌿 \`feat/*\` | ${featCount > 0 ? `🔄 ${featCount} aktif` : '⚪ Tidak ada'} | Meja eksperimen |`,
            `| 🛠️ \`hotfix/*\` | ${hotfixCount > 0 ? `⚠️ ${hotfixCount} aktif` : '⚪ Tidak ada'} | Pemadam kebakaran |`,
            ``,
            `📍 **Branch aktif saat ini:** \`${current}\` *(Anda sedang di ruangan ini)*`,
        ];

        return lines.join('\n');
    }

    /**
     * Mendapatkan daftar branch feat/* yang mangkrak (tanpa aktivitas).
     * (Mencari meja eksperimen yang sudah lama ditinggalkan)
     */
    public async getStaleBranches(daysThreshold: number = 7): Promise<BranchInfo[]> {
        const branches = await this.getAllBranches();
        const staleBranches: BranchInfo[] = [];

        for (const branch of branches) {
            if (branch.type !== 'feat') { continue; }

            try {
                if (this._repo && branch.lastCommitDate) {
                    const daysSinceLastCommit = this._getDaysSince(branch.lastCommitDate);
                    if (daysSinceLastCommit >= daysThreshold) {
                        branch.status = 'stale';
                        staleBranches.push(branch);
                    }
                }
            } catch {
                // Abaikan error pada branch individual
            }
        }

        return staleBranches;
    }

    // ══════════════════════════════════════════════════════════
    // VIOLATION DETECTION — Deteksi Pelanggaran GitFlow
    // ══════════════════════════════════════════════════════════

    /**
     * Memeriksa pelanggaran alur pada branch yang sedang aktif.
     * (Mengecek apakah ada aturan toko yang dilanggar)
     */
    private _checkBranchViolations(branchName: string): void {
        // Cek: apakah user langsung bekerja di main?
        if (branchName === 'main') {
            this._reportViolation({
                type: 'direct-push-main',
                description: 'Direct work on main branch detected',
                descriptionAwam: 'Anda berada di branch `main` (etalase produksi). ' +
                    'Mengubah kode langsung di sini sangat berisiko!',
                severity: 'warning',
                suggestion: 'Sebaiknya buat branch `feat/*` (meja eksperimen) atau `hotfix/*` (pemadam kebakaran) terlebih dahulu.',
            });
        }
    }

    /**
     * Memeriksa apakah merge yang akan dilakukan melanggar alur GitFlow.
     * (Mengecek apakah penggabungan ini diizinkan oleh aturan toko)
     *
     * @returns Violation jika melanggar, undefined jika aman
     */
    public checkMergeViolation(sourceBranch: string, targetBranch: string): GitViolation | undefined {
        const sourceType = this._classifyBranch(sourceBranch);

        // feat/* langsung ke main tanpa lewat dev → PELANGGARAN
        if (sourceType === 'feat' && targetBranch === 'main') {
            return {
                type: 'feat-to-main',
                description: `Merge feat branch directly to main: ${sourceBranch} → main`,
                descriptionAwam: `⚠️ Branch \`${sourceBranch}\` (meja eksperimen) tidak boleh langsung digabungkan ke \`main\` (etalase)!\n\n` +
                    `Alur yang benar: \`${sourceBranch}\` → \`dev\` → \`staging\` → \`main\``,
                severity: 'error',
                suggestion: `Merge ke \`dev\` (dapur utama) dulu, bukan langsung ke \`main\`.`,
            };
        }

        // feat/* langsung ke staging → PELANGGARAN (harus lewat dev)
        if (sourceType === 'feat' && targetBranch === 'staging') {
            return {
                type: 'feat-to-main',
                description: `Merge feat branch directly to staging: ${sourceBranch} → staging`,
                descriptionAwam: `⚠️ Branch \`${sourceBranch}\` harus melewati \`dev\` (dapur utama) sebelum ke \`staging\` (meja pencicipan).`,
                severity: 'warning',
                suggestion: `Merge ke \`dev\` dulu, baru dari \`dev\` ke \`staging\`.`,
            };
        }

        // Menambah fitur baru di hotfix → PELANGGARAN
        if (targetBranch.startsWith('hotfix/') && sourceType === 'feat') {
            return {
                type: 'feature-in-hotfix',
                description: `Merging feature into hotfix branch: ${sourceBranch} → ${targetBranch}`,
                descriptionAwam: `⚠️ Branch \`hotfix/*\` (pemadam kebakaran) hanya untuk perbaikan darurat. Jangan menambah fitur baru di sini!`,
                severity: 'error',
                suggestion: `Fitur baru harus dibuat di branch \`feat/*\` sendiri, bukan di \`hotfix\`.`,
            };
        }

        return undefined;
    }

    /**
     * Memeriksa apakah commit message mengikuti konvensi.
     * (Mengecek apakah label snapshot sudah ditulis dengan benar)
     */
    public checkCommitMessage(message: string): { isValid: boolean; suggestion?: string } {
        const trimmed = message.trim();

        // Cek pesan terlalu pendek / generik
        const badMessages = ['update', 'fix', 'wip', 'test', 'asdf', 'asd', 'temp', 'commit', 'changes', 'stuff'];
        if (badMessages.includes(trimmed.toLowerCase())) {
            return {
                isValid: false,
                suggestion: `⚠️ Commit message "${trimmed}" terlalu generik!\n\n` +
                    `**Gunakan format Conventional Commits:**\n` +
                    `\`<prefix>: <deskripsi singkat>\`\n\n` +
                    `Contoh: \`feat: tambah validasi form login\` atau \`fix: perbaiki crash saat buka halaman profil\``,
            };
        }

        // Cek apakah mengikuti format conventional commits
        const conventionalPattern = /^(feat|fix|docs|style|refactor|test|chore|perf|ci|build|revert)(\(.+\))?: .{3,}/;
        if (!conventionalPattern.test(trimmed)) {
            return {
                isValid: false,
                suggestion: `💡 Commit message sebaiknya mengikuti format: \`<prefix>: <deskripsi>\`\n\n` +
                    `Prefix yang tersedia: \`feat:\`, \`fix:\`, \`docs:\`, \`style:\`, \`refactor:\`, \`test:\`, \`chore:\`\n\n` +
                    `Contoh: \`feat: ${trimmed}\``,
            };
        }

        return { isValid: true };
    }

    /**
     * Memeriksa apakah nama branch mengikuti konvensi.
     * (Mengecek apakah nama ruangan kerja sudah sesuai aturan)
     */
    public checkBranchName(name: string): { isValid: boolean; suggestion?: string } {
        // Nama generik
        const badPatterns = /^(branch\d*|test\d*|coba|temp|tmp|asdf|asd|new|my-branch)/i;
        if (badPatterns.test(name)) {
            return {
                isValid: false,
                suggestion: `⚠️ Nama branch "${name}" terlalu generik!\n\n` +
                    `**Gunakan format:**\n` +
                    `- Feature: \`feat/nama-fitur\` (contoh: \`feat/webview-ui\`)\n` +
                    `- Hotfix: \`hotfix/deskripsi\` (contoh: \`hotfix/fix-api-leak\`)\n` +
                    `- Release: \`release/vX.Y.Z\` (contoh: \`release/v1.0.0\`)`,
            };
        }

        // Cek apakah menggunakan format yang benar
        const validPatterns = /^(feat|hotfix|release|dev|staging|main)\//;
        const isCoreBranch = ['main', 'dev', 'staging'].includes(name);

        if (!validPatterns.test(name) && !isCoreBranch) {
            return {
                isValid: false,
                suggestion: `💡 Branch "${name}" sebaiknya menggunakan prefix:\n` +
                    `- \`feat/${name}\` untuk fitur baru\n` +
                    `- \`hotfix/${name}\` untuk perbaikan darurat`,
            };
        }

        // Cek karakter yang tidak diizinkan
        if (/[A-Z]/.test(name) && !isCoreBranch) {
            return {
                isValid: false,
                suggestion: `⚠️ Nama branch harus huruf kecil semua (lowercase).\n` +
                    `Saran: \`${name.toLowerCase()}\``,
            };
        }

        if (/_/.test(name)) {
            return {
                isValid: false,
                suggestion: `⚠️ Gunakan tanda hubung \`-\` sebagai pemisah, bukan underscore \`_\`.\n` +
                    `Saran: \`${name.replace(/_/g, '-')}\``,
            };
        }

        return { isValid: true };
    }

    // ══════════════════════════════════════════════════════════
    // HELPER FUNCTIONS — Fungsi Bantu Internal
    // ══════════════════════════════════════════════════════════

    /**
     * Mengklasifikasikan branch berdasarkan namanya.
     * (Menentukan jenis ruangan berdasarkan papan namanya)
     */
    private _classifyBranch(name: string): BranchType {
        if (name === 'main' || name === 'master') { return 'main'; }
        if (name === 'dev' || name === 'develop' || name === 'development') { return 'dev'; }
        if (name === 'staging' || name === 'stage' || name === 'qa') { return 'staging'; }
        if (name.startsWith('feat/') || name.startsWith('feature/')) { return 'feat'; }
        if (name.startsWith('hotfix/') || name.startsWith('fix/')) { return 'hotfix'; }
        if (name.startsWith('release/')) { return 'release'; }
        return 'unknown';
    }

    /**
     * Menentukan status branch.
     */
    private _getBranchStatus(name: string): BranchStatus {
        if (name === this._currentBranch) { return 'active'; }
        return 'unknown';
    }

    /**
     * Menghitung jumlah hari sejak tanggal tertentu.
     */
    private _getDaysSince(date: Date): number {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        return Math.floor(diffMs / (1000 * 60 * 60 * 24));
    }

    /**
     * Melaporkan pelanggaran ke callback yang terdaftar.
     * (Membunyikan alarm pelanggaran)
     */
    private _reportViolation(violation: GitViolation): void {
        if (this._callbacks.onViolationDetected) {
            this._callbacks.onViolationDetected(violation);
        }
    }

    /**
     * Memulai pengecekan branch mangkrak secara berkala.
     * (Menyalakan timer untuk mengecek meja eksperimen yang ditinggalkan)
     */
    private _startStaleBranchChecker(): void {
        // Cek setiap 30 menit
        this._staleBranchCheckInterval = setInterval(async () => {
            const staleBranches = await this.getStaleBranches(7);
            if (staleBranches.length > 0 && this._callbacks.onStaleBranchFound) {
                this._callbacks.onStaleBranchFound(staleBranches);
            }
        }, 30 * 60 * 1000);

        // Cek pertama kali setelah 5 detik
        setTimeout(async () => {
            const staleBranches = await this.getStaleBranches(7);
            if (staleBranches.length > 0 && this._callbacks.onStaleBranchFound) {
                this._callbacks.onStaleBranchFound(staleBranches);
            }
        }, 5000);
    }

    /**
     * Membersihkan semua resources saat service dimatikan.
     * (Mematikan semua CCTV dan alarm saat toko tutup)
     */
    public dispose(): void {
        if (this._staleBranchCheckInterval) {
            clearInterval(this._staleBranchCheckInterval);
        }
        this._disposables.forEach(d => d.dispose());
        this._disposables = [];
    }
}
