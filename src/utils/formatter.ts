/**
 * formatter.ts — Fungsi bantu untuk memformat pesan dan parafrase Git.
 * (Tukang tata rias pesan — membuat setiap teks rapi dan informatif)
 *
 * 📌 Akan diperkaya di Phase 2-5 sesuai kebutuhan
 */

import { OutboundTag } from '../models/types';

/**
 * Mendapatkan emoji penanda berdasarkan jenis pesan outbound.
 * (Memilih stiker yang tepat untuk setiap jenis pengumuman)
 */
export function getOutboundEmoji(tag: OutboundTag): string {
    const emojiMap: Record<OutboundTag, string> = {
        OUTBOUND: '🔔',
        BRANCH_MOVEMENT: '🚀',
        WARNING: '⚠️',
        SUGGESTION: '💡',
        STRUCTURE: '📁',
        PROGRESS: '📊',
    };
    return emojiMap[tag] || '💬';
}

/**
 * Memformat label penanda outbound untuk ditampilkan di chat.
 * (Membuat label judul pesan agar mudah dikenali jenisnya)
 */
export function formatOutboundLabel(tag: OutboundTag): string {
    return `${getOutboundEmoji(tag)} **[${tag.replace('_', ' ')}]**`;
}

/**
 * Memformat timestamp ke format waktu lokal Indonesia.
 * (Menerjemahkan stempel waktu ke format jam:menit yang mudah dibaca)
 */
export function formatTimestamp(date: Date): string {
    return date.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
    });
}

/**
 * Memformat nama branch menjadi lebih mudah dibaca.
 * (Menerjemahkan kode branch menjadi label yang ramah pengguna)
 */
export function formatBranchName(branchName: string): string {
    if (branchName === 'main') { return '🟢 main (Etalase Produksi)'; }
    if (branchName === 'dev') { return '🔵 dev (Dapur Utama)'; }
    if (branchName === 'staging') { return '🧪 staging (Meja Pencicipan)'; }
    if (branchName.startsWith('feat/')) { return `🌿 ${branchName} (Meja Eksperimen)`; }
    if (branchName.startsWith('hotfix/')) { return `🛠️ ${branchName} (Pemadam Kebakaran)`; }
    if (branchName.startsWith('release/')) { return `🏷️ ${branchName} (Siap Rilis)`; }
    return `❓ ${branchName}`;
}

/**
 * Membuat ID unik sederhana untuk pesan chat.
 * (Membuat nomor urut unik untuk setiap pesan)
 */
export function generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}
