/**
 * NotificationService.ts — Outbound & Proactive Chat Engine (Pilar 3)
 * (Mesin Notifikasi Proaktif — Pengirim Pesan Otomatis Tanpa Menunggu User Bertanya)
 *
 * Mengelola 5 Skenario Outbound:
 * Skenario 1: 🔔 Initial Greeting (Saat Aplikasi/IDE Dibuka)
 * Skenario 2: 🚀 Branch Event (Push / PR / Merge / Checkout Otomatis)
 * Skenario 3: ⚠️ Proactive Warning (Pelanggaran Alur GitFlow)
 * Skenario 4: 🕐 Stale Branch Alert (Branch Mangkrak > 7 hari)
 * Skenario 5: 📁 File/Folder Structure Warning (Penempatan File/Branch Salah)
 */

import * as vscode from 'vscode';
import { ChatViewProvider } from '../providers/ChatViewProvider';
import { GitService, GitViolation } from './GitService';
import { BranchInfo, OutboundTag } from '../models/types';
import { formatBranchName } from '../utils/formatter';
import { formatTermWithLayman } from '../utils/gitParaphrase';

export class NotificationService {
    private _chatProvider: ChatViewProvider;
    private _gitService: GitService;
    private _greetingSent: boolean = false;

    constructor(chatProvider: ChatViewProvider, gitService: GitService) {
        this._chatProvider = chatProvider;
        this._gitService = gitService;
    }

    /**
     * Skenario 1: 🔔 Initial Greeting (Saat IDE/Ekstensi Dibuka)
     * Menyapa pengguna secara proaktif, menampilkan status 5 branch & fase terkini.
     */
    public async sendInitialGreeting(): Promise<void> {
        if (this._greetingSent) { return; }
        this._greetingSent = true;

        const currentBranch = this._gitService.getCurrentBranch();
        const coreStatus = await this._gitService.getCorebranchStatus();

        const greetingLines = [
            `🔔 **Halo! Selamat datang di GitFlow Assistant** 👋\n`,
            `Saya asisten DevOps & monitor proaktif yang akan menjaga alur kerja Git Anda tetap rapi dan aman.\n`,
            `---\n`,
            `${coreStatus}\n`,
            `---\n`,
            `📍 **Posisi Pembangunan:** **Phase 5 (feat/outbound-chat)** *(Notifikasi Proaktif)*\n`,
            `💡 **Apa yang ingin Anda lakukan selanjutnya?**`,
        ];

        this._chatProvider.sendAssistantMessage(greetingLines.join('\n'), 'OUTBOUND');
    }

    /**
     * Skenario 2: 🚀 Branch Event (Push / PR / Merge / Checkout)
     * Format standar sesuai Pilar 3:
     * 🚀 **Pergerakan**: `[Branch Asal]` ➔ `[Branch Tujuan]`
     * 🔄 **Proses Git**: [Nama Proses] *(Parafrase Awam)*
     * 👤 **Aktor**: [Nama Developer]
     * 📝 **Ringkasan**: Keterangan singkat.
     * 💡 **Langkah Selanjutnya**: Rekomendasi tindakan.
     */
    public sendBranchEventNotification(
        sourceBranch: string,
        targetBranch: string,
        processName: string,
        actor: string = 'Developer',
        summary: string = 'Perubahan kode telah dipindahkan',
        nextAction: string = 'Lanjutkan ke fase berikutnya'
    ): void {
        const paraphrase = formatTermWithLayman(processName);
        const sourceFormatted = formatBranchName(sourceBranch);
        const targetFormatted = formatBranchName(targetBranch);

        const lines = [
            `🚀 **Pergerakan**: \`${sourceBranch}\` ➔ \`${targetBranch}\``,
            `🔄 **Proses Git**: ${processName} *(${paraphrase})*`,
            `👤 **Aktor**: ${actor}`,
            `📝 **Ringkasan**: ${summary}`,
            `💡 **Langkah Selanjutnya**: ${nextAction}`,
            ``,
            `📍 Status: \`${sourceFormatted}\` ➔ \`${targetFormatted}\``,
        ];

        this._chatProvider.sendAssistantMessage(lines.join('\n'), 'BRANCH_MOVEMENT');
    }

    /**
     * Skenario 3: ⚠️ Proactive Warning (Pelanggaran Alur GitFlow)
     * Memberi peringatan jika user melanggar aturan alur branch.
     */
    public sendProactiveWarning(violation: GitViolation): void {
        const lines = [
            `⚠️ **PERINGATAN PELANGGARAN ALUR GITFLOW!**\n`,
            `🚨 **Masalah**: ${violation.descriptionAwam}\n`,
            `🔍 **Detail Teknis**: \`${violation.description}\`\n`,
            `💡 **Solusi & Langkah Benar**: ${violation.suggestion}`,
        ];

        this._chatProvider.sendAssistantMessage(lines.join('\n'), 'WARNING');
    }

    /**
     * Skenario 4: 🕐 Stale Branch Alert (Branch Mangkrak)
     * Mengingatkan jika ada branch feat/* yang tidak ada aktivitas > 7 hari.
     */
    public sendStaleBranchAlert(staleBranches: BranchInfo[]): void {
        const branchItems = staleBranches
            .map(b => `- 🌿 \`${b.name}\` *(meja eksperimen tanpa aktivitas)*`)
            .join('\n');

        const lines = [
            `🕐 **STALE BRANCH ALERT** *(Branch Mangkrak)*\n`,
            `Branch \`feat/*\` berikut sudah tidak ada aktivitas selama **7+ hari**:\n`,
            `${branchItems}\n`,
            `❓ **Tindakan yang Disarankan**:`,
            `- Jika fitur masih dikerjakan: lakukan ${formatTermWithLayman('git commit')} atau update dari \`dev\`.`,
            `- Jika fitur sudah selesai/batal: bersihkan dengan ${formatTermWithLayman('git branch -d')} *(membereskan meja kerja)*.`,
        ];

        this._chatProvider.sendAssistantMessage(lines.join('\n'), 'WARNING');
    }

    /**
     * Skenario 5: 📁 File/Folder Structure Warning (Penempatan File Salah)
     * Peringatkan jika file dibuat/diubah di branch yang tidak sesuai peruntukannya.
     */
    public sendFileStructureWarning(
        filePath: string,
        currentBranch: string,
        reason: string,
        correctBranch: string
    ): void {
        const lines = [
            `📁 **PERINGATAN LOKASI FILE / BRANCH!**\n`,
            `📄 **File**: \`${filePath}\``,
            `📍 **Branch Aktif**: \`${currentBranch}\` *(${formatBranchName(currentBranch)})*\n`,
            `⚠️ **Masalah**: ${reason}`,
            `💡 **Solusi**: Pindahkan atau buat file ini di branch \`${correctBranch}\` *(${formatBranchName(correctBranch)})*.`,
        ];

        this._chatProvider.sendAssistantMessage(lines.join('\n'), 'STRUCTURE');
    }

    /**
     * Memeriksa perubahan file terkini terhadap aturan penempatan branch.
     * (Menyaring apakah ada file baru di branch yang salah)
     */
    public inspectFileChangeForBranch(filePath: string, currentBranch: string): void {
        // Aturan: Tidak boleh buat fitur baru di hotfix
        if (currentBranch.startsWith('hotfix/')) {
            if (filePath.includes('/providers/') || filePath.includes('/features/')) {
                this.sendFileStructureWarning(
                    filePath,
                    currentBranch,
                    'Branch `hotfix/*` hanya untuk perbaikan bug darurat di produksi, bukan untuk membuat fitur UI/fitur baru.',
                    'feat/nama-fitur'
                );
            }
        }

        // Aturan: Tidak boleh edit/buat file baru langsung di main
        if (currentBranch === 'main') {
            if (!filePath.endsWith('CHANGELOG.md') && !filePath.endsWith('README.md')) {
                this.sendFileStructureWarning(
                    filePath,
                    currentBranch,
                    'Branch `main` adalah etalase produksi. Tidak boleh mengubah kode sumber secara langsung di branch ini!',
                    'dev (via feat/*)'
                );
            }
        }
    }
}
