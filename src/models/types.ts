/**
 * types.ts — Definisi tipe data & interface untuk seluruh proyek.
 * (Cetakan/template standar agar semua data punya format yang sama)
 */

// ══════════════════════════════════════════════════════════
// CHAT MESSAGE TYPES (Tipe Pesan Chat)
// ══════════════════════════════════════════════════════════

/** Jenis pesan dalam chat */
export type MessageRole = 'user' | 'assistant' | 'system';

/** Jenis penanda visual pesan outbound */
export type OutboundTag =
    | 'OUTBOUND'          // 🔔 Sapaan & informasi proaktif
    | 'BRANCH_MOVEMENT'   // 🚀 Notifikasi pergerakan branch
    | 'WARNING'           // ⚠️ Peringatan pelanggaran alur
    | 'SUGGESTION'        // 💡 Saran & rekomendasi
    | 'STRUCTURE'         // 📁 Panduan struktur folder/file
    | 'PROGRESS';         // 📊 Update fase pembangunan

/** Struktur satu pesan chat */
export interface ChatMessage {
    id: string;
    role: MessageRole;
    content: string;
    timestamp: Date;
    outboundTag?: OutboundTag;
}

// ══════════════════════════════════════════════════════════
// BRANCH TYPES (Tipe Data Branch)
// ══════════════════════════════════════════════════════════

/** Jenis branch dalam alur GitFlow */
export type BranchType = 'main' | 'dev' | 'staging' | 'feat' | 'hotfix' | 'release' | 'unknown';

/** Status sebuah branch */
export type BranchStatus = 'active' | 'stale' | 'merged' | 'unknown';

/** Informasi tentang sebuah branch */
export interface BranchInfo {
    name: string;
    type: BranchType;
    status: BranchStatus;
    lastCommitDate?: Date;
    lastCommitMessage?: string;
    isCurrent: boolean;
}

// ══════════════════════════════════════════════════════════
// PHASE / PROGRESS TYPES (Tipe Data Fase Pembangunan)
// ══════════════════════════════════════════════════════════

/** Status fase pembangunan */
export type PhaseStatus =
    | 'completed'      // ✅ Selesai & sudah di-merge
    | 'in_progress'    // 🔄 Sedang dikerjakan
    | 'pending'        // ⬜ Belum dimulai
    | 'warning';       // ⚠️ Ada masalah / butuh perhatian

/** Informasi satu fase pembangunan */
export interface PhaseInfo {
    phase: number;
    name: string;
    branchName: string;
    status: PhaseStatus;
    description: string;
}

// ══════════════════════════════════════════════════════════
// NOTIFICATION TYPES (Tipe Data Notifikasi)
// ══════════════════════════════════════════════════════════

/** Tingkat urgensi notifikasi */
export type NotificationSeverity = 'info' | 'warning' | 'error';

/** Struktur notifikasi proaktif */
export interface ProactiveNotification {
    tag: OutboundTag;
    severity: NotificationSeverity;
    title: string;
    message: string;
    suggestion?: string;
    timestamp: Date;
}

// ══════════════════════════════════════════════════════════
// GIT PARAPHRASE TYPES (Tipe Data Parafrase Git)
// ══════════════════════════════════════════════════════════

/** Entri kamus parafrase Git → Bahasa Awam */
export interface GitParaphrase {
    command: string;
    technicalDesc: string;
    laymanDesc: string;
    analogy: string;
    dangerLevel?: 'safe' | 'caution' | 'dangerous';
}
