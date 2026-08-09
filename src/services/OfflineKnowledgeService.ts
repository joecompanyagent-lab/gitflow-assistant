/**
 * OfflineKnowledgeService.ts — Pustaka Pengetahuan GitFlow Offline (Buku Resep Offline)
 * (Layanan Jawaban Otomatis saat Internet Terputus atau Offline)
 *
 * Menjawab pertanyaan umum GitFlow ketika internet mati:
 * - Penjelasan 5 core branches & alurnya
 * - Panduan Conventional Commits
 * - Prosedur darurat Hotfix & Rollback
 * - Kamus istilah & parafrase Git
 */

import { formatTermWithLayman } from '../utils/gitParaphrase';

export interface OfflineAnswer {
    title: string;
    content: string;
    buttons?: any[];
}

export class OfflineKnowledgeService {
    /**
     * Mencari jawaban offline berdasarkan query pengguna.
     */
    public getAnswer(query: string, currentBranch?: string): OfflineAnswer {
        const q = query.toLowerCase().trim();

        // 1. Pertanyaan tentang Alur / GitFlow
        if (q.includes('alur') || q.includes('gitflow') || q.includes('flow') || q.includes('cara kerja')) {
            return {
                title: '🌐 [OFFLINE MODE] Alur Kerja GitFlow',
                content: [
                    `📶 **[MODE OFFLINE] Pustaka Pengetahuan Lokal**\n`,
                    `**Alur Standar GitFlow (5 Core Branches):**\n`,
                    `\`\`\`\nfeat/* ──► dev ──► staging ──► main\n                                 ▲\n                         hotfix/*─┘\n\`\`\`\n`,
                    `**Analogi Bahasa Awam:**`,
                    `- \`feat/*\` 🌿 = Meja eksperimen (tempat coba resep/fitur baru)`,
                    `- \`dev\` 🔵 = Dapur utama (tempat semua resep disatukan)`,
                    `- \`staging\` 🧪 = Meja pencicipan (pengujian akhir oleh tim QA)`,
                    `- \`main\` 🟢 = Etalase toko (produksi live untuk pengguna akhir)`,
                    `- \`hotfix/*\` 🛠️ = Pemadam kebakaran (perbaikan darurat dari main)\n`,
                    `📍 **Branch Anda saat ini:** \`${currentBranch || 'dev'}\``,
                ].join('\n'),
                buttons: [
                    { id: 'btn_create_feat', label: '🌿 Buat Feature Branch', action: 'createFeatureBranch', icon: '✨' },
                    { id: 'btn_switch', label: '🔀 Pindah Branch', action: 'switchBranch', icon: '📍' },
                ],
            };
        }

        // 2. Pertanyaan tentang Commit Message
        if (q.includes('commit') || q.includes('pesan') || q.includes('message')) {
            return {
                title: '🌐 [OFFLINE MODE] Panduan Commit Message',
                content: [
                    `📶 **[MODE OFFLINE] Panduan Conventional Commits**\n`,
                    `Format: \`<prefix>: <deskripsi singkat>\`\n`,
                    `| Prefix | Arti Teknis | Bahasa Awam |`,
                    `|---|---|---|`,
                    `| \`feat:\` | Fitur baru | Menambah kemampuan baru |`,
                    `| \`fix:\` | Perbaikan bug | Memperbaiki kerusakan |`,
                    `| \`docs:\` | Dokumentasi | Memperbarui catatan |`,
                    `| \`style:\` | Format kode | Merapikan tampilan |`,
                    `| \`refactor:\` | Restrukturisasi | Menata ulang tanpa ubah fungsi |`,
                    `| \`chore:\` | Pemeliharaan | Beres-beres rumah tangga proyek |\n`,
                    `Contoh: \`feat: tambah komponen tombol aksi cepat\``,
                ].join('\n'),
                buttons: [
                    { id: 'btn_commit', label: '💡 Buat Commit Rapi', action: 'suggestCommit', icon: '📝' },
                ],
            };
        }

        // 3. Pertanyaan tentang Hotfix / Emergency
        if (q.includes('hotfix') || q.includes('darurat') || q.includes('bug') || q.includes('rusak')) {
            return {
                title: '🌐 [OFFLINE MODE] Prosedur Darurat Hotfix',
                content: [
                    `🚨 **[MODE OFFLINE] Prosedur Darurat Hotfix (Pemadam Kebakaran)**\n`,
                    `1. **Jangan Panik** — Identifikasi masalah di \`main\` terlebih dahulu.`,
                    `2. **Buat Branch Hotfix** dari \`main\`: \`git checkout main && git checkout -b hotfix/nama-masalah\`.`,
                    `3. **Perbaiki Bug** di branch hotfix tersebut.`,
                    `4. **Merge Balik**: Merge ke \`main\` DAN ke \`dev\` (agar perbaikan tidak hilang).`,
                    `5. **Buat Tag Versi PATCH** baru (misal: \`v1.0.1\`).`,
                ].join('\n'),
                buttons: [
                    { id: 'btn_switch_main', label: '🟢 Pindah ke main', action: 'switchBranch', icon: '📍' },
                ],
            };
        }

        // Default Offline Response
        return {
            title: '🌐 [OFFLINE MODE] GitFlow Assistant',
            content: [
                `📶 **[MODE OFFLINE] Koneksi Internet Terputus**\n`,
                `Sistem tetap beroperasi menggunakan **Pustaka Pengetahuan Lokal**.\n`,
                `**Topik yang tersedia secara offline:**`,
                `- 🌿 Alur kerja 5 branch GitFlow`,
                `- 💡 Panduan Conventional Commits`,
                `- 🚨 Prosedur darurat Hotfix`,
                `- 📊 Status branch & visual progress\n`,
                `_Sambungkan kembali internet Anda untuk menggunakan seluruh kemampuan AI Groq!_ 🤖`,
            ].join('\n'),
            buttons: [
                { id: 'btn_create_feat', label: '🌿 Buat Feature Branch', action: 'createFeatureBranch', icon: '✨' },
                { id: 'btn_status', label: '📊 Status Branch', action: 'showBranchStatus', icon: '📊' },
            ],
        };
    }
}
