const GIT_GLOSSARY: Record<string, string> = {
  'commit': 'menyimpan foto snapshot progres kerjaan',
  'push': 'mengirim berkas lokal ke server awan bersama',
  'pull': 'mengambil & memperbarui berkas terbaru dari server',
  'fetch': 'mengecek update baru di server tanpa menerapkannya',
  'clone': 'menyalin seluruh proyek dari server ke komputer pribadi',
  'init': 'membuat ruang kerja Git baru dari nol',
  'add': 'memilih berkas yang ingin disimpan ke snapshot berikutnya',
  'checkout': 'pindah meja kerja dari satu branch ke branch lain',
  'switch': 'pindah meja kerja dari satu branch ke branch lain',
  'branch': 'melihat/membuat ruangan kerja (cabang)',
  'merge': 'menggabungkan dua hasil kerjaan menjadi satu',
  'rebase': 'menata ulang urutan riwayat agar garis lurus rapi',
  'cherry-pick': 'mengambil 1 perubahan spesifik tanpa membawa sisanya',
  'stash': 'menyimpan sementara dokumen setengah jadi di laci rahasia',
  'squash': 'menggabungkan banyak catatan kecil jadi 1 catatan besar',
  'reset': 'memutar balik waktu ke titik tertentu (Ctrl+Z tingkat lanjut)',
  'revert': 'membatalkan perubahan dengan membuat catatan pembatalan baru',
  'restore': 'mengembalikan isi file ke kondisi sebelumnya',
  'pull request': 'pengajuan izin resmi sebelum menggabungkan kode',
  'pr': 'pengajuan izin resmi sebelum menggabungkan kode',
  'merge request': 'pengajuan izin resmi sebelum menggabungkan kode',
  'mr': 'pengajuan izin resmi sebelum menggabungkan kode',
  'conflict': 'tabrakan kode — dua orang mengubah baris yang sama',
  'merge conflict': 'tabrakan kode — dua orang mengubah baris yang sama',
  'fork': 'menyalin proyek orang lain ke akun sendiri untuk dimodifikasi',
  'tag': 'memberikan label versi pada titik rilis tertentu',
  'diff': 'membandingkan perbedaan antara versi lama dan baru',
  'log': 'melihat daftar riwayat seluruh snapshot yang pernah dibuat',
  'status': 'memeriksa kondisi meja kerja saat ini',
  'blame': 'melihat siapa yang terakhir mengubah setiap baris kode',
  'bisect': 'mencari commit penyebab bug dengan membagi dua riwayat',
  'reflog': 'catatan SEMUA pergerakan termasuk yang sudah dihapus (CCTV)',
  'submodule': 'menyematkan proyek lain di dalam proyek utama',
  'force push': 'memaksa menimpa isi server ⚠️ BERBAHAYA',
  'push -f': 'memaksa menimpa isi server ⚠️ BERBAHAYA',
  'push --force': 'memaksa menimpa isi server ⚠️ BERBAHAYA',
  'detached head': 'kondisi mengambang tanpa branch (tanpa pegangan)',
  'ci/cd': 'robot otomatis yang menguji & mengirim kode ke server',
  'pipeline': 'rangkaian proses otomatis dari push hingga deploy',
  'webhook': 'sinyal otomatis saat ada kejadian tertentu',
  'stash pop': 'membuka kembali laci rahasia & mengembalikan dokumen'
};

export function getGitParaphrase(term: string): string | undefined {
  return GIT_GLOSSARY[term.toLowerCase()];
}

export function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function classifyBranchType(branchName: string): 'feat' | 'dev' | 'staging' | 'main' | 'hotfix' | 'other' {
  const name = branchName.toLowerCase().replace(/^refs\/heads\//, '').replace(/^origin\//, '');
  if (name.startsWith('feat/') || name.startsWith('feature/')) { return 'feat'; }
  if (name === 'dev' || name === 'develop' || name === 'development') { return 'dev'; }
  if (name === 'staging' || name === 'stage' || name === 'qa') { return 'staging'; }
  if (name === 'main' || name === 'master' || name === 'production') { return 'main'; }
  if (name.startsWith('hotfix/') || name.startsWith('fix/')) { return 'hotfix'; }
  return 'other';
}

export function getBranchEmoji(type: string): string {
  const emojis: Record<string, string> = {
    feat: '🌿', dev: '🔵', staging: '🧪', main: '🟢', hotfix: '🛠️', other: '⚪'
  };
  return emojis[type] || '⚪';
}

export function getBranchStatusLabel(type: string): string {
  const labels: Record<string, string> = {
    feat: 'Feature', dev: 'Development', staging: 'Staging/QA', main: 'Production', hotfix: 'Hotfix', other: 'Other'
  };
  return labels[type] || 'Other';
}

export function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
