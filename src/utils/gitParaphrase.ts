/**
 * gitParaphrase.ts — Universal Git-to-Layman Paraphrase Engine (Pilar 2)
 * (Kamus & Mesin Penerjemah Bahasa Git → Bahasa Awam Sehari-hari)
 */

import { GitParaphrase } from '../models/types';

/** Kamus Parafrase Bawaan GitFlow Assistant */
export const GIT_PARAPHRASE_DICTIONARY: Record<string, GitParaphrase> = {
    // ── Operasi Dasar ──
    'git init': {
        command: 'git init',
        technicalDesc: 'Inisialisasi repositori Git baru',
        laymanDesc: 'Membuat ruang kerja Git baru dari nol',
        analogy: 'Membuka toko baru',
    },
    'git clone': {
        command: 'git clone',
        technicalDesc: 'Menduplikasi repositori dari remote ke lokal',
        laymanDesc: 'Menyalin seluruh proyek dari server ke komputer pribadi',
        analogy: 'Memfotokopi seluruh arsip kantor',
    },
    'git add': {
        command: 'git add',
        technicalDesc: 'Menambahkan perubahan ke staging area',
        laymanDesc: 'Memilih berkas mana saja yang ingin disimpan ke snapshot berikutnya',
        analogy: 'Menaruh barang ke keranjang belanja sebelum checkout',
    },
    'git commit': {
        command: 'git commit',
        technicalDesc: 'Menyimpan snapshot perubahan ke riwayat',
        laymanDesc: 'Menyimpan foto snapshot progres kerjaan saat ini',
        analogy: 'Mengabadikan momen pekerjaan dengan keterangan',
    },
    'git push': {
        command: 'git push',
        technicalDesc: 'Mengirim commit lokal ke remote repository',
        laymanDesc: 'Mengirim berkas dari komputer pribadi ke server awan bersama',
        analogy: 'Mengunggah dokumen ke Google Drive kantor',
    },
    'git pull': {
        command: 'git pull',
        technicalDesc: 'Mengambil dan menggabungkan perubahan dari remote',
        laymanDesc: 'Mengambil & memperbarui berkas terbaru dari server ke komputer lokal',
        analogy: 'Mengunduh update terbaru dari Drive kantor',
    },
    'git fetch': {
        command: 'git fetch',
        technicalDesc: 'Mengunduh objek dan referensi dari remote tanpa merge',
        laymanDesc: 'Mengecek apakah ada update baru di server, tapi belum diterapkan ke lokal',
        analogy: 'Mengintip kotak surat tanpa membuka isinya',
    },

    // ── Navigasi Branch ──
    'git branch': {
        command: 'git branch',
        technicalDesc: 'Daftar, buat, atau hapus branch',
        laymanDesc: 'Melihat daftar semua ruangan kerja (branch) yang ada',
        analogy: 'Melihat denah ruangan di toko',
    },
    'git checkout': {
        command: 'git checkout',
        technicalDesc: 'Pindah branch atau restore file',
        laymanDesc: 'Pindah ruangan/meja kerja dari satu branch ke branch lain',
        analogy: 'Pindah dari dapur ke meja eksperimen',
    },
    'git switch': {
        command: 'git switch',
        technicalDesc: 'Pindah branch',
        laymanDesc: 'Pindah ruangan kerja ke branch lain',
        analogy: 'Melangkah ke ruangan sebelah',
    },
    'git branch -d': {
        command: 'git branch -d',
        technicalDesc: 'Menghapus branch lokal',
        laymanDesc: 'Menghapus ruangan kerja yang sudah tidak terpakai',
        analogy: 'Membereskan meja setelah selesai eksperimen',
    },

    // ── Penggabungan & Riwayat ──
    'git merge': {
        command: 'git merge',
        technicalDesc: 'Menggabungkan dua atau lebih riwayat pengembangan',
        laymanDesc: 'Menggabungkan dua hasil kerjaan dari dua ruangan berbeda menjadi satu',
        analogy: 'Mencampur resep eksperimen ke menu dapur utama',
    },
    'git rebase': {
        command: 'git rebase',
        technicalDesc: 'Terapkan ulang commit di atas tip branch lain',
        laymanDesc: 'Menata ulang urutan riwayat kerjaan agar rapi berjalan dalam satu garis lurus',
        analogy: 'Menyusun ulang catatan harian agar kronologis',
    },
    'git cherry-pick': {
        command: 'git cherry-pick',
        technicalDesc: 'Menerapkan perubahan dari commit yang ada',
        laymanDesc: 'Mengambil 1 perubahan spesifik saja dari tempat lain tanpa membawa sisa kerjaan',
        analogy: 'Memetik 1 buah apel dari pohon tanpa menebang pohonnya',
    },
    'git squash': {
        command: 'git squash',
        technicalDesc: 'Menggabungkan banyak commit menjadi satu',
        laymanDesc: 'Menumpuk & menggabungkan banyak catatan kecil menjadi 1 catatan besar yang rapi',
        analogy: 'Merangkum 10 sticky note jadi 1 halaman ringkasan',
    },

    // ── Penyimpanan Sementara ──
    'git stash': {
        command: 'git stash',
        technicalDesc: 'Simpan sementara perubahan yang belum di-commit',
        laymanDesc: 'Menyimpan sementara dokumen setengah jadi di laci rahasia agar meja kerja bersih',
        analogy: 'Menaruh barang ke laci rahasia',
    },
    'git stash pop': {
        command: 'git stash pop',
        technicalDesc: 'Terapkan dan hapus stash terbaru',
        laymanDesc: 'Membuka kembali laci rahasia dan mengembalikan dokumen setengah jadi ke meja',
        analogy: 'Mengambil kembali barang dari laci rahasia',
    },

    // ── Pembatalan & Pemulihan ──
    'git reset': {
        command: 'git reset',
        technicalDesc: 'Reset HEAD saat ini ke kondisi tertentu',
        laymanDesc: 'Memutar balik waktu ke titik tertentu (Undo/Ctrl+Z — HATI-HATI)',
        analogy: 'Mesin waktu untuk membatalkan perubahan',
        dangerLevel: 'caution',
    },
    'git revert': {
        command: 'git revert',
        technicalDesc: 'Revert beberapa commit yang sudah ada',
        laymanDesc: 'Membatalkan perubahan tertentu dengan membuat catatan pembatalan baru',
        analogy: 'Membuat surat ralat resmi tanpa menghapus surat asli',
    },
    'git restore': {
        command: 'git restore',
        technicalDesc: 'Kembalikan berkas ke kondisi sebelumnya',
        laymanDesc: 'Mengembalikan isi file ke kondisi sebelumnya',
        analogy: 'Mengambil versi lama dari arsip',
    },

    // ── Kolaborasi & Review ──
    'pull request': {
        command: 'Pull Request (PR)',
        technicalDesc: 'Permintaan penggabungan kode ke repositori utama',
        laymanDesc: 'Pengajuan izin resmi sebelum menggabungkan kode',
        analogy: 'Mengajukan proposal tertulis ke manajer sebelum menggabungkan pekerjaan',
    },
    'code review': {
        command: 'Code Review',
        technicalDesc: 'Pemeriksaan kode oleh pengembang lain',
        laymanDesc: 'Proses rekan kerja memeriksa kode Anda sebelum disetujui',
        analogy: 'Teman sejawat mengecek laporan Anda sebelum diserahkan ke atasan',
    },
    'merge conflict': {
        command: 'Merge Conflict',
        technicalDesc: 'Konflik saat dua cabang mengubah kode yang sama',
        laymanDesc: 'Tabrakan kode — dua orang mengubah baris yang sama di waktu bersamaan',
        analogy: 'Dua orang menulis paragraf berbeda di halaman yang sama',
        dangerLevel: 'caution',
    },
    'fork': {
        command: 'Fork',
        technicalDesc: 'Salinan independen dari repositori orang lain',
        laymanDesc: 'Menyalin seluruh proyek milik orang lain ke akun sendiri untuk dimodifikasi',
        analogy: 'Memfotokopi buku resep orang untuk dimodifikasi di dapur sendiri',
    },

    // ── Status & Informasi ──
    'git status': {
        command: 'git status',
        technicalDesc: 'Tampilkan status working tree',
        laymanDesc: 'Memeriksa kondisi meja kerja saat ini (apa yang diubah, apa yang belum disimpan)',
        analogy: 'Mengecek daftar tugas di papan tulis',
    },
    'git log': {
        command: 'git log',
        technicalDesc: 'Tampilkan commit log',
        laymanDesc: 'Melihat daftar riwayat seluruh snapshot/commit yang pernah dibuat',
        analogy: 'Membuka buku catatan harian proyek',
    },
    'git diff': {
        command: 'git diff',
        technicalDesc: 'Tampilkan perubahan antar commit atau working tree',
        laymanDesc: 'Membandingkan perbedaan antara versi lama dan baru',
        analogy: 'Menyorot perubahan di dokumen seperti Track Changes di Word',
    },
    'detached head': {
        command: 'Detached HEAD',
        technicalDesc: 'HEAD menunjuk langsung ke commit, bukan branch',
        laymanDesc: 'Kondisi mengambang tanpa tempat simpan',
        analogy: 'Berdiri di luar ruangan tanpa pegangan branch',
        dangerLevel: 'caution',
    },

    // ── Operasi Lanjutan & Berbahaya ──
    'git push --force': {
        command: 'git push --force (-f)',
        technicalDesc: 'Memaksa push dan menimpa riwayat remote',
        laymanDesc: 'Memaksa menimpa isi server tanpa peduli kerjaan orang lain ⚠️ TINDAKAN BERBAHAYA',
        analogy: 'Membuang arsip bersama dan menggantinya dengan dokumen milik sendiri',
        dangerLevel: 'dangerous',
    },
    'git tag': {
        command: 'git tag',
        technicalDesc: 'Membuat label versi pada commit tertentu',
        laymanDesc: 'Memberikan label/stiker versi pada titik rilis tertentu',
        analogy: 'Menempel stiker "Versi 1.0" pada halaman buku',
    },
    'git bisect': {
        command: 'git bisect',
        technicalDesc: 'Pencarian biner untuk menemukan commit penyedia bug',
        laymanDesc: 'Mencari commit mana yang menyebabkan bug dengan membagi dua riwayat',
        analogy: 'Mencari halaman rusak di buku dengan membuka tengah-tengahnya berulang kali',
    },
    'git reflog': {
        command: 'git reflog',
        technicalDesc: 'Catatan seluruh referensi HEAD',
        laymanDesc: 'Melihat catatan SEMUA pergerakan HEAD, termasuk yang sudah dihapus',
        analogy: 'CCTV ruang arsip — merekam semua aktivitas termasuk yang sudah dibersihkan',
    },
    'git submodule': {
        command: 'git submodule',
        technicalDesc: 'Menyematkan repo lain di dalam repo utama',
        laymanDesc: 'Menyematkan proyek lain di dalam proyek utama',
        analogy: 'Memasang mesin dari pabrik lain ke dalam produk sendiri',
    },
    'git blame': {
        command: 'git blame',
        technicalDesc: 'Menampilkan penulis terakhir setiap baris file',
        laymanDesc: 'Melihat siapa yang terakhir mengubah setiap baris kode',
        analogy: 'Mengecek siapa yang menulis setiap paragraf di dokumen',
    },

    // ── DevOps & Automasi ──
    'ci/cd': {
        command: 'CI/CD',
        technicalDesc: 'Continuous Integration / Continuous Deployment',
        laymanDesc: 'Sistem robot otomatis yang menguji dan mengirim kode ke server setiap ada perubahan',
        analogy: 'Ban berjalan pabrik yang otomatis mengecek kualitas dan mengemas barang',
    },
    'pipeline': {
        command: 'Pipeline',
        technicalDesc: 'Rangkaian tahap pengujian & deployment otomatis',
        laymanDesc: 'Rangkaian proses otomatis dari mulai kode di-push hingga ter-deploy',
        analogy: 'Jalur ban berjalan pabrik dari awal sampai akhir',
    },
    'webhook': {
        command: 'Webhook',
        technicalDesc: 'HTTP callback yang dipicu oleh kejadian server',
        laymanDesc: 'Sinyal otomatis yang dikirim server saat ada kejadian tertentu',
        analogy: 'Alarm otomatis yang berbunyi saat ada aktivitas',
    },
};

/**
 * Mendapatkan parafrase bahasa awam untuk sebuah istilah/perintah Git.
 * Jika tidak ada di kamus, buatkan parafrase awam dinamis.
 */
export function getLaymanParaphrase(term: string): GitParaphrase {
    const key = term.toLowerCase().trim();
    if (GIT_PARAPHRASE_DICTIONARY[key]) {
        return GIT_PARAPHRASE_DICTIONARY[key];
    }

    // Dynamic Paraphrase Engine jika tidak ada di kamus bawaan
    return {
        command: term,
        technicalDesc: `Operasi Git: ${term}`,
        laymanDesc: `Proses Git \`${term}\` (aktivitas pengelolaan kode)`,
        analogy: `Langkah kerja di ruang arsip dokumen`,
    };
}

/**
 * Memformat istilah teknis Git dengan parafrase awam di sampingnya.
 * Contoh: `git merge` *(menggabungkan dua hasil kerjaan dari dua ruangan)*
 */
export function formatTermWithLayman(term: string): string {
    const entry = getLaymanParaphrase(term);
    return `\`${term}\` *(${entry.laymanDesc})*`;
}
