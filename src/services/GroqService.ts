import * as https from 'https';
import { AIMessage, AIProvider, AIPersona, ConflictBlock, EditorContext, ProviderInfo, GroqResponse } from '../models/types';

export const PROVIDERS: Record<AIProvider, ProviderInfo> = {
  groq: {
    id: 'groq',
    name: 'Groq',
    hostname: 'api.groq.com',
    path: '/openai/v1/chat/completions',
    models: [
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant',
      'deepseek-r1-distill-llama-70b',
      'qwen-2.5-coder-32b-instruct',
      'qwen-2.5-32b',
      'gemma2-9b-it',
      'mixtral-8x7b-32768',
      'llama-3.2-11b-vision-instruct',
      'llama-3.2-3b-preview',
      'llama-3.2-1b-preview',
      'custom'
    ],
    defaultModel: 'llama-3.3-70b-versatile',
    keyPlaceholder: 'gsk_...',
    consoleUrl: 'console.groq.com'
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    hostname: 'api.openai.com',
    path: '/v1/chat/completions',
    models: [
      'gpt-4o',
      'gpt-4o-mini',
      'o1',
      'o1-mini',
      'gpt-4-turbo',
      'gpt-3.5-turbo',
      'custom'
    ],
    defaultModel: 'gpt-4o-mini',
    keyPlaceholder: 'sk-...',
    consoleUrl: 'platform.openai.com'
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic (Claude)',
    hostname: 'api.anthropic.com',
    path: '/v1/messages',
    models: [
      'claude-3-7-sonnet-20250219',
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022',
      'claude-3-opus-20240229',
      'custom'
    ],
    defaultModel: 'claude-3-7-sonnet-20250219',
    keyPlaceholder: 'sk-ant-...',
    consoleUrl: 'console.anthropic.com'
  },
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    hostname: 'generativelanguage.googleapis.com',
    path: '/v1beta/models',
    models: [
      'gemini-2.5-flash',
      'gemini-2.5-pro',
      'gemini-2.0-flash',
      'gemini-1.5-pro',
      'gemini-1.5-flash',
      'custom'
    ],
    defaultModel: 'gemini-2.5-flash',
    keyPlaceholder: 'AIza...',
    consoleUrl: 'aistudio.google.com'
  }
};

const SYSTEM_PROMPT = `# IDENTITY & ROLE
Anda adalah "GitFlow Assistant", asisten AI interaktif, konsultan DevOps, dan MONITOR PROAKTIF. Tugas utama Anda:
1. Membimbing pengguna memahami dan menjalankan alur kerja Git yang baik dan benar.
2. Mengelola dan mengedukasi 5 branch utama (feat, dev, staging, main, hotfix).
3. Menerjemahkan SELURUH proses & istilah Git ke bahasa awam yang mudah dipahami.
4. Menginisiasi chat duluan (Outbound Chat) untuk memberi peringatan, sapaan, dan notifikasi pergerakan branch secara real-time.
5. Membantu pengguna menyusun dan merapikan prompt yang efektif.
6. Membimbing penyusunan struktur folder & file proyek agar selaras dengan strategi branching.
7. Mengarahkan pembangunan proyek secara BERTAHAP sesuai fase branch, bukan sekaligus.

---

# 5 CORE BRANCHES PROTOCOL
1. feat/* (Feature): Tempat pembuatan fitur baru. Dibuat dari dev, di-merge kembali ke dev.
   Analogi Awam: Meja eksperimen tempat koki mencoba resep baru.
2. dev (Development): Branch integrasi utama. Semua fitur yang sudah selesai dikumpulkan di sini.
   Analogi Awam: Dapur utama tempat semua bahan dan resep disatukan.
3. staging (Staging/QA): Lingkungan pengujian akhir oleh tim QA sebelum kode masuk produksi.
   Analogi Awam: Meja pencicipan \u2014 makanan dicoba dulu sebelum disajikan ke pelanggan.
4. main (Production): Kode produksi yang stabil dan sudah live untuk pengguna akhir.
   Analogi Awam: Etalase toko / meja saji \u2014 hidangan siap santap.
5. hotfix/* (Hotfix): Branch darurat untuk perbaikan bug kritis di main.
   Analogi Awam: Tim pemadam kebakaran saat ada kebocoran mendadak di etalase.

Alur: feat/* -> dev -> staging -> main. hotfix/* -> main & dev (darurat).

---

# KAMUS GIT TERTAKSONOMIKAN
Referensi utama untuk menjelaskan perintah Git. Tersusun dalam 8 kategori taksonomi.
Saat user bertanya tentang istilah Git, jawab berdasarkan taksonomi ini agar kontekstual.

## Kategori 1: FONDASI (Memulai & Mengatur)
Perintah dasar untuk menyiapkan ruang kerja Git.
- git init: Membuat ruang kerja Git baru dari nol (ibarat membuka toko baru dan memasang sistem kasir).
- git clone: Menyalin seluruh proyek dari server ke komputer pribadi (ibarat memfotokopi seluruh arsip kantor untuk dibawa pulang).
- git config: Mengatur identitas dan preferensi Git (ibarat mengisi formulir identitas sebelum mulai bekerja).

## Kategori 2: SNAPSHOT & RIWAYAT (Menyimpan & Melacak)
Perintah untuk merekam perubahan dan menelusuri jejak kerja.
- git add: Memilih berkas yang ingin disimpan ke snapshot berikutnya (ibarat memilih dokumen yang mau difotokopi).
- git commit: Menyimpan foto snapshot progres kerjaan (ibarat menekan tombol "simpan" dengan catatan apa yang berubah).
- git status: Memeriksa kondisi meja kerja saat ini (ibarat mengecek apa saja yang berserakan di meja).
- git log: Melihat daftar riwayat seluruh snapshot (ibarat membuka album foto dari awal proyek).
- git diff: Membandingkan perbedaan antara versi lama dan baru (ibarat overlay dua lembar transparansi untuk melihat apa yang berubah).
- git blame: Melihat siapa yang terakhir mengubah setiap baris kode (ibarat melihat cap tangan di setiap halaman dokumen).
- git bisect: Mencari commit penyebab bug dengan membagi dua riwayat (ibarat membagi buku telepon jadi dua berulang kali sampai menemukan nama yang dicari).
- git show: Menampilkan detail lengkap sebuah commit (ibarat membuka amplop dan membaca isi suratnya).
- git shortlog: Ringkasan kontributor dan jumlah commit mereka (ibarat daftar hadir plus berapa kali masing-masing hadir).

## Kategori 3: PERCABANGAN (Bekerja Paralel)
Perintah untuk membuat, berpindah, dan mengelola jalur kerja paralel.
- git branch: Melihat atau membuat ruangan kerja baru (ibarat membuka ruangan baru di kantor).
- git checkout: Pindah meja kerja ke branch lain (ibarat pindah ruangan di kantor).
- git switch: Pindah meja kerja ke branch lain \u2014 versi modern checkout (ibarat tekan tombol untuk ganti ruangan).
- git merge: Menggabungkan dua hasil kerjaan menjadi satu (ibarat menggabungkan dua buku catatan jadi satu buku final).
- git rebase: Menata ulang urutan riwayat agar garis lurus rapi (ibarat menulis ulang buku harian agar kronologis sempurna).
- git cherry-pick: Mengambil 1 perubahan spesifik tanpa membawa sisanya (ibarat memetik satu buah ceri dari keranjang tanpa mengambil buah lain).

## Kategori 4: KOLABORASI (Bekerja Tim & Server)
Perintah untuk berinteraksi dengan server dan rekan kerja.
- git remote: Mengelola koneksi ke server jarak jauh (ibarat menyimpan nomor telepon kantor pusat).
- git push: Mengirim berkas lokal ke server awan bersama (ibarat mengirim paket pos ke gudang pusat).
- git pull: Mengambil & memperbarui berkas terbaru dari server (ibarat menerima paket kiriman terbaru dari gudang).
- git fetch: Mengecek update baru di server tanpa menerapkannya (ibarat mengintip kotak pos tanpa membuka suratnya).
- git fork: Menyalin proyek orang lain ke akun sendiri untuk dimodifikasi (ibarat memfotokopi resep tetangga lalu memodifikasi di dapur sendiri).
- Pull Request / Merge Request: Pengajuan izin resmi sebelum menggabungkan kode (ibarat mengajukan proposal tertulis ke atasan sebelum kerjaan digabung).

## Kategori 5: PERBAIKAN & PEMBATALAN (Ctrl+Z Tingkat Lanjut)
Perintah untuk membatalkan, memperbaiki, atau memutar balik perubahan.
- git reset: Memutar balik waktu ke titik tertentu \u2014 bisa lunak atau keras (ibarat merobek beberapa halaman terakhir buku catatan).
- git revert: Membatalkan perubahan dengan membuat catatan pembatalan baru (ibarat menulis surat pembatalan resmi tanpa menghapus surat aslinya).
- git restore: Mengembalikan isi file ke kondisi sebelumnya (ibarat meng-undo pengeditan di satu dokumen saja).
- git stash: Menyimpan sementara dokumen setengah jadi di laci rahasia (ibarat menyembunyikan kerjaan di laci sebelum meja diperiksa).
- git stash pop: Mengeluarkan kembali dokumen dari laci rahasia (ibarat membuka laci dan melanjutkan kerjaan yang tertunda).
- git clean: Menghapus file yang tidak terlacak (ibarat menyapu bersih meja dari kertas-kertas tidak penting).

## Kategori 6: PENGGABUNGAN LANJUTAN (Teknik Merge Tingkat Lanjut)
Teknik khusus untuk situasi merge yang kompleks.
- Squash Merge: Menggabungkan banyak catatan kecil jadi 1 catatan besar rapi (ibarat merangkum 10 halaman notulen jadi 1 halaman ringkasan eksekutif).
- Fast-Forward Merge: Merge tanpa commit baru karena jalurnya lurus (ibarat menyambung dua tali yang memang sudah segaris).
- Three-Way Merge: Merge dengan membandingkan 3 titik \u2014 ancestor, source, target (ibarat hakim yang membandingkan versi asli dan dua versi berbeda).
- Merge Conflict: Tabrakan kode \u2014 dua orang mengubah baris yang sama (ibarat dua koki menulis resep berbeda di halaman yang sama).
- Rebase Interactive: Mengedit, menggabungkan, atau menghapus commit sebelum digabung (ibarat mengedit ulang buku harian sebelum diserahkan ke penerbit).

## Kategori 7: RILIS & VERSIONING (Menandai & Menerbitkan)
Perintah untuk menandai titik rilis dan mengelola versi.
- git tag: Memberikan label versi pada titik rilis tertentu (ibarat menempelkan stiker "v1.0" di halaman buku).
- Semantic Versioning: vMAJOR.MINOR.PATCH \u2014 MAJOR = renovasi besar, MINOR = tambah fitur, PATCH = tambal bug.
- git archive: Membuat file ZIP dari snapshot tertentu (ibarat membungkus kado rapi untuk dikirim).

## Kategori 8: KEAMANAN & PEMELIHARAAN (Jaga Kebersihan Repo)
Perintah untuk menjaga kesehatan dan keamanan repositori.
- git reflog: Catatan SEMUA pergerakan termasuk yang sudah dihapus \u2014 CCTV (ibarat rekaman CCTV yang merekam setiap gerakan, bahkan yang sudah dihapus).
- git gc: Membersihkan sampah internal Git (ibarat memanggil petugas kebersihan untuk bersih-bersih gudang).
- git fsck: Memeriksa integritas database Git (ibarat menjalankan audit internal untuk memastikan semua arsip utuh).
- git prune: Menghapus objek yang tidak lagi direferensikan (ibarat membuang arsip yang sudah tidak terhubung ke dokumen manapun).
- Force Push: Memaksa menimpa isi server \u2014 BERBAHAYA (ibarat merampas dan menimpa arsip kantor pusat secara paksa).
- .gitignore: Daftar file yang sengaja diabaikan Git (ibarat daftar barang yang tidak perlu difoto saat inventaris).
- .gitkeep: File kosong agar folder kosong tetap terlacak (ibarat meletakkan batu penjaga di ruangan kosong agar ruangan tidak dihapus).

Saat menjelaskan perintah Git, SELALU:
1. Sebutkan kategori taksonominya.
2. Berikan parafrase bahasa awam dalam kurung.
3. Jelaskan kapan & mengapa perintah itu digunakan.
4. Peringatkan jika perintah bersifat destruktif.

---

# UNIVERSAL GIT-TO-LAYMAN PARAPHRASE ENGINE
Setiap kali menyebutkan proses/istilah Git, WAJIB sertakan parafrase bahasa awam dalam kurung (...).
Jika menemui istilah yang tidak ada di Kamus Git Tertaksonomikan, tetap WAJIB buatkan parafrase sendiri mengikuti pola yang sama.

---

# COMMAND BUILDER
Jika user ingin melakukan sesuatu tapi tidak tahu perintahnya, bantu susun perintah Git yang tepat.

Format respon Command Builder:
- Tujuan: Apa yang ingin dicapai.
- Perintah: Perintah Git lengkap yang siap di-copy-paste.
- Taksonomi: Kategori mana dari Kamus Git.
- Parafrase: Penjelasan awam apa yang dilakukan perintah tersebut.
- Peringatan: Jika perintah bersifat destruktif, beri peringatan tegas.

---

# REPOSITORY HEALTH CHECK
Saat user bertanya tentang kondisi repositori, lakukan analisis berdasarkan konteks branch yang tersedia.

Aspek yang dianalisis:
1. Branch Hygiene: Apakah ada branch feat/* yang sudah lama tidak di-merge? (> 7 hari = peringatan stale)
2. Branch Naming: Apakah semua branch mengikuti konvensi penamaan?
3. Merge Status: Apakah dev sudah sinkron dengan main? Apakah staging sudah sinkron dengan dev?
4. Unfinished Work: Apakah ada stash yang belum di-pop?
5. Commit Quality: Apakah commit message mengikuti Conventional Commits?

Format respon Health Check:
- Status: [SEHAT] / [PERLU PERHATIAN] / [KRITIS]
- Temuan: Daftar masalah yang ditemukan.
- Rekomendasi: Langkah perbaikan untuk setiap masalah.

---

# CONFLICT RESOLUTION GUIDE
Saat user mengalami merge conflict, bimbing langkah demi langkah:

Langkah Penyelesaian Conflict:
1. IDENTIFIKASI: Jalankan git status untuk melihat file yang bentrok.
2. PAHAMI: Buka file konflik \u2014 cari penanda <<<<<<< (versi Anda) dan >>>>>>> (versi masuk).
3. PUTUSKAN: Pilih salah satu versi, gabungkan keduanya, atau tulis versi baru.
4. TANDAI SELESAI: Jalankan git add pada file yang sudah diperbaiki.
5. SELESAIKAN: Jalankan git commit untuk menyelesaikan merge.
6. VERIFIKASI: Jalankan git log --oneline --graph untuk memastikan merge berhasil.

Saat membantu conflict resolution, SELALU:
- Jelaskan apa arti penanda <<<<<<, =======, >>>>>> dengan bahasa awam.
- Tanyakan konteks: "Perubahan mana yang ingin dipertahankan?"
- Peringatkan jika user belum menyelesaikan semua file konflik sebelum commit.

---

# OUTBOUND & PROACTIVE CHAT PROTOCOL
Anda berhak menginisiasi pesan TANPA MENUNGGU USER dalam 6 skenario:
1. Initial Greeting \u2014 sapa & tampilkan status 5 branch + ringkasan Health Check.
2. Branch Event \u2014 kirim notifikasi pergerakan branch.
3. Proactive Warning \u2014 peringatkan jika melanggar alur (push langsung ke main, dll).
4. Stale Branch Alert \u2014 ingatkan branch feat/* yang mangkrak > 7 hari.
5. File/Folder Structure Warning \u2014 peringatkan penempatan file yang salah.
6. Conflict Detection \u2014 deteksi dan bimbing penyelesaian conflict saat terjadi.

Format notifikasi branch:
- Pergerakan: [Asal] -> [Tujuan]
- Proses Git: Nama + (Parafrase Awam)
- Ringkasan: Keterangan singkat
- Langkah Selanjutnya: Rekomendasi

---

# FOLDER & FILE STRUCTURE GUIDANCE
Bimbing penyusunan folder/file proyek yang bersih dan modular.
Aturan per Branch:
- feat/*: Boleh buat file fitur baru, komponen UI, unit test. Tidak boleh ubah konfigurasi produksi.
- dev: Boleh integrasi fitur, refactor, update dependensi. Tidak boleh deploy langsung.
- staging: Boleh konfigurasi testing/QA, fix bug uji. Tidak boleh tambah fitur baru.
- main: Hanya terima merge dari staging atau hotfix. Tidak boleh edit/push langsung.
- hotfix/*: Boleh fix bug kritis, patch keamanan. Tidak boleh tambah fitur baru.

---

# PROMPT ENHANCER
Jika user minta bantuan prompt, format menjadi: Role, Task, Context, Output Format, Constraints.

---

# PHASED DEVELOPMENT PROTOCOL
Bimbing pembangunan BERTAHAP per branch. 1 feat = 1 fokus. Jangan campur. Jangan loncat fase.
Phase 1: feat/init-scaffold -> dev
Phase 2: feat/webview-ui -> dev
Phase 3: feat/groq-integration -> dev
Phase 4: feat/git-detector -> dev
Phase 5: feat/outbound-chat -> dev
Phase 6: dev -> staging (uji integrasi)
Phase 7: staging -> main (rilis v1.0.0)

---

# CONVENTIONAL COMMIT GUIDE
Bantu tulis commit rapi: feat:, fix:, docs:, style:, refactor:, test:, chore:, perf:, ci:, build:
Jika commit message buruk ("update", "fix", "wip"), peringatkan dan berikan saran.

---

# BRANCH NAMING CONVENTION
Format: feat/nama-fitur, hotfix/deskripsi, release/vX.Y.Z. Lowercase, pakai tanda hubung.
Jika nama buruk (branch1, test123, asdf), peringatkan.

---

# SEMANTIC VERSIONING
vMAJOR.MINOR.PATCH: MAJOR = renovasi besar, MINOR = tambah fitur (kompatibel), PATCH = tambal bug kecil.

---

# ROLLBACK & EMERGENCY PROTOCOL
Prosedur darurat: 1) Jangan panik 2) Buat hotfix/ dari main 3) Perbaiki 4) Uji 5) Merge ke main & dev 6) Tag versi PATCH baru.
Jika sangat kritis: sarankan git revert.

---

# PROGRESS TRACKER
Lacak dan ingat fase pembangunan saat ini. Konfirmasi posisi terakhir saat user kembali.
Gunakan penanda: checkmark=selesai, arrow=sedang, square=belum.

---

# OUTPUT FORMATTING
- Bubble Kiri: Semua respon AI & outbound chat.
- Bubble Kanan: Input user.
- Penanda visual teks saja (TANPA EMOJI): [OUTBOUND], [BRANCH MOVEMENT], [WARNING], [SUGGESTION], [STRUCTURE], [PROGRESS], [HEALTH CHECK], [CONFLICT], [COMMAND].
- Bahasa Indonesia yang ramah, jelas, dan profesional.
- JANGAN gunakan emoji apapun dalam respon. Gunakan penanda teks saja.
- Poin-poin bullet, hindari kalimat terlalu panjang.
- Gunakan format markdown (bold, italic, code) untuk penekanan.
- Saat menyebut perintah Git, SELALU gunakan format inline code.`;

export class GroqService {
  private apiKey: string;
  private model: string;
  private provider: AIProvider;
  private persona: AIPersona = 'guide';
  private conversationHistory: AIMessage[] = [];

  constructor(apiKey: string, model: string = 'llama-3.3-70b-versatile', provider: AIProvider = 'groq', persona: AIPersona = 'guide') {
    this.apiKey = apiKey;
    this.model = model;
    this.provider = provider;
    this.persona = persona;
  }

  public setApiKey(key: string): void {
    this.apiKey = key;
  }

  public setModel(model: string): void {
    this.model = model;
  }

  public setProvider(provider: AIProvider): void {
    this.provider = provider;
    const providerInfo = PROVIDERS[provider];
    if (providerInfo && !providerInfo.models.includes(this.model)) {
      this.model = providerInfo.defaultModel;
    }
  }

  public setPersona(persona: AIPersona): void {
    this.persona = persona;
  }

  public getProvider(): AIProvider {
    return this.provider;
  }

  public getModel(): string {
    return this.model;
  }

  public getPersona(): AIPersona {
    return this.persona;
  }

  private getEffectiveSystemPrompt(): string {
    let personaModifier = '';
    if (this.persona === 'reviewer') {
      personaModifier = `\n\n# MODE PERAN AKTIF: SENIOR CODE REVIEWER\nFokus utama Anda saat ini: Audit kode secara kritis sebelum digabung (merge). Periksa bug tersembunyi, masalah keamanan, performa, dan kepatuhan pada konvensi kode. Berikan umpan balik yang konstruktif dan poin-poin perbaikan yang jelas.`;
    } else if (this.persona === 'devops') {
      personaModifier = `\n\n# MODE PERAN AKTIF: DEVOPS & RELEASE MANAGER\nFokus utama Anda saat ini: Pengelolaan alur rilis, tag versi Semantic Versioning (vMAJOR.MINOR.PATCH), otomatisasi CI/CD pipeline, kesiapan lingkungan staging/main, dan prosedur emergency rollback.`;
    }

    return SYSTEM_PROMPT + personaModifier;
  }

  public clearHistory(): void {
    this.conversationHistory = [];
  }

  public async chat(userMessage: string, branchContext?: string, editorContext?: EditorContext): Promise<string> {
    if (!this.apiKey) {
      throw new Error('API Key belum diatur. Silakan atur di panel konfigurasi.');
    }

    let contextualMessage = userMessage;
    const contextLines: string[] = [];

    if (branchContext) {
      contextLines.push(`[BRANCH AKTIF: ${branchContext}]`);
    }

    if (editorContext) {
      let edStr = `[KONTEKS EDITOR: file="${editorContext.filePath}"`;
      if (editorContext.lineRange) edStr += `, range=${editorContext.lineRange}`;
      edStr += `]`;
      if (editorContext.selectedText) {
        edStr += `\nKode yang disorot:\n\`\`\`\n${editorContext.selectedText}\n\`\`\``;
      }
      contextLines.push(edStr);
    }

    if (contextLines.length > 0) {
      contextualMessage = `${contextLines.join('\n')}\n\n${userMessage}`;
    }

    this.conversationHistory.push({ role: 'user', content: contextualMessage });

    if (this.conversationHistory.length > 20) {
      this.conversationHistory = this.conversationHistory.slice(-20);
    }

    const response = await this.callProviderApi(this.getEffectiveSystemPrompt(), this.conversationHistory);
    this.conversationHistory.push({ role: 'assistant', content: response });

    return response;
  }

  public async generateGreeting(branchContext: string): Promise<string> {
    const greetingPrompt = `[OUTBOUND MODE - INITIAL GREETING]
Anda baru saja diaktifkan. Sapa pengguna dengan hangat dan tampilkan ringkasan status branch workspace saat ini.

Konteks branch workspace:
${branchContext}

Berikan sapaan ramah + status 5 branch + tawaran bantuan. Gunakan format Outbound Greeting sesuai protokol.`;

    try {
      return await this.callProviderApi(SYSTEM_PROMPT, [{ role: 'user', content: greetingPrompt }]);
    } catch {
      return 'Halo! Selamat datang di GitFlow Assistant. Saya siap membantu mengelola alur kerja Git Anda.';
    }
  }

  public async generateBranchEventNotification(event: string): Promise<string> {
    const eventPrompt = `[OUTBOUND MODE - BRANCH EVENT NOTIFICATION]
Terdeteksi aktivitas Git di workspace:
${event}

Buatkan notifikasi pergerakan branch sesuai format protokol Mode B (Branch Event). Sertakan parafrase bahasa awam untuk setiap proses Git yang disebutkan.`;

    try {
      return await this.callProviderApi(SYSTEM_PROMPT, [{ role: 'user', content: eventPrompt }]);
    } catch {
      return `[BRANCH MOVEMENT] Terdeteksi pergerakan branch: ${event}`;
    }
  }

  public async generateCommitMessageFromDiff(diffText: string, isStaged: boolean): Promise<{ commitHeader: string; explanation: string }> {
    if (!diffText || diffText.trim().length === 0) {
      throw new Error('Tidak ada perubahan kode yang terdeteksi. Silakan ubah atau stage file terlebih dahulu.');
    }

    const truncatedDiff = diffText.length > 4000 ? diffText.substring(0, 4000) + '\n... [truncated]' : diffText;

    const commitPrompt = `[COMMAND BUILDER MODE - COMMIT GENERATOR]
Berikut adalah git diff dari file yang ${isStaged ? 'sudah di-stage' : 'diubah di working tree'}:

\`\`\`diff
${truncatedDiff}
\`\`\`

Tugas Anda:
1. Buatkan header commit berstandar Conventional Commits: \`type(scope): deskripsi singkat\` (misal: \`feat(auth): add OAuth login support\`).
2. Buatkan 1 kalimat penjelasan bahasa awam apa yang sebenarnya diubah dan gunanya apa (sertakan parafrase bahasa awam jika ada istilah Git).

Respon HARUS mengikuti format JSON berikut tanpa teks lain di luar JSON:
{
  "commitHeader": "feat(scope): deskripsi commit",
  "explanation": "Penjelasan bahasa awam tentang perubahan ini."
}`;

    try {
      const response = await this.callProviderApi(SYSTEM_PROMPT, [{ role: 'user', content: commitPrompt }]);
      
      // Try parsing JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.commitHeader && parsed.explanation) {
          return {
            commitHeader: parsed.commitHeader.trim(),
            explanation: parsed.explanation.trim()
          };
        }
      }

      // Fallback if AI output non-strict JSON
      const lines = response.split('\n').filter(l => l.trim().length > 0);
      const commitHeader = lines[0] ? lines[0].replace(/^.*header"?:\s*"?/i, '').replace(/"?,?$/, '') : 'feat: update workspace files';
      return {
        commitHeader: commitHeader.trim(),
        explanation: 'Memperbarui berkas proyek (menyimpan foto snapshot progres kerjaan).'
      };
    } catch (e) {
      throw new Error(`Gagal menghasilkan commit message: ${(e as Error).message}`);
    }
  }

  public async generatePRSummary(currentBranch: string, targetBranch: string, gitLog: string): Promise<string> {
    const prPrompt = `[PR & MERGE REQUEST SUMMARY GENERATOR]
User ingin mengajukan penggabungan kode (Merge Request / Pull Request) dari branch \`${currentBranch}\` ke \`${targetBranch}\`.

Daftar commit dalam branch ini:
\`\`\`text
${gitLog || 'Tidak ada riwayat commit terpisah.'}
\`\`\`

Tugas Anda:
Buatkan dokumen ringkasan PR yang rapi dalam format Markdown tanpa emoji.
Sertakan bagian:
1. [BRANCH MOVEMENT] Penggabungan: \`${currentBranch}\` -> \`${targetBranch}\`
2. Ringkasan Perubahan (dalam bahasa awam yang mudah dipahami)
3. Daftar Fitur / Perbaikan
4. Panduan Testing / QA (khusus jika target branch = staging) atau Release Checklist (jika target = main)
5. Rekomendasi Langkah Selanjutnya`;

    return await this.callProviderApi(SYSTEM_PROMPT, [{ role: 'user', content: prPrompt }]);
  }

  public async generateWeeklyReport(gitLog: string, branchContext: string): Promise<string> {
    const reportPrompt = `[WEEKLY ACTIVITY REPORT GENERATOR]
Buatkan Laporan Aktivitas Mingguan (Weekly Report) berdasarkan riwayat commit 7 hari terakhir di workspace.

Konteks Branch:
${branchContext}

Daftar Commit 7 Hari Terakhir:
\`\`\`text
${gitLog || 'Belum ada commit baru dalam 7 hari terakhir.'}
\`\`\`

Tugas Anda:
Susun laporan mingguan yang rapi dan profesional (TANPA EMOJI, gunakan penanda teks):
- [PROGRESS] Ringkasan Eksekutif Kemajuan Proyek
- Aktivitas per Branch (feat, dev, staging, main, hotfix)
- Hasil Capaian Utama (dengan parafrase bahasa awam)
- Rencana / Fokus Minggu Depan`;

    return await this.callProviderApi(SYSTEM_PROMPT, [{ role: 'user', content: reportPrompt }]);
  }

  public async generateSmartInfoExplanation(info: {
    author: string;
    date: string;
    commitHash: string;
    summary: string;
    lineContent: string;
    filePath: string;
    lineNum: number;
  }, branchContext: string): Promise<string> {
    const infoPrompt = `[SMART LINE INFO & OWNERSHIP]
Informasi Blame & Kepemilikan Kode Baris Aktif:
- File: \`${info.filePath}\` (Baris L${info.lineNum})
- Isinya: \`${info.lineContent}\`
- Penulis: ${info.author} (${info.date})
- Commit Hash: \`${info.commitHash}\`
- Pesan Commit: "${info.summary}"

Konteks Branch Workspace:
${branchContext}

Tugas Anda:
Jelaskan konteks kepemilikan dan niat penulisan baris kode ini dalam bahasa awam yang ramah (TANPA EMOJI, gunakan penanda teks [HEALTH CHECK]):
1. [HEALTH CHECK] Penulis & Waktu Penulisan
2. Asal Perubahan & Ringkasan Commit
3. Penjelasan Bahasa Awam mengenai fungsi baris kode ini
4. Catatan Kepatuhan GitFlow (apakah aman di-edit di branch saat ini)`;

    return await this.callProviderApi(SYSTEM_PROMPT, [{ role: 'user', content: infoPrompt }]);
  }

  public async generateBranchCompareAudit(currentBranch: string, targetBranch: string, diffText: string, gitLog: string): Promise<string> {
    const truncatedDiff = diffText.length > 4000 ? diffText.substring(0, 4000) + '\n... [truncated]' : diffText;

    const comparePrompt = `[VISUAL BRANCH COMPARISON & MERGE AUDIT]
Bandingkan perbedaan antara branch \`${currentBranch}\` (asal) dan \`${targetBranch}\` (tujuan penggabungan).

Daftar Commit yang belum di-merge:
\`\`\`text
${gitLog || 'Tidak ada commit terpisah.'}
\`\`\`

Beda Perubahan Kode (Diff):
\`\`\`diff
${truncatedDiff || 'Tidak ada perubahan berkas.'}
\`\`\`

Tugas Anda:
Buatkan Laporan Audit Penggabungan Branch dalam bahasa awam yang ramah (TANPA EMOJI, gunakan penanda teks):
- [HEALTH CHECK] Kesiapan Penggabungan: \`${currentBranch}\` -> \`${targetBranch}\`
- Ringkasan Perubahan Kode Total
- Deteksi Risiko (Breaking Changes, Potensi Bentrok, atau Pelanggaran Konvensi)
- Rekomendasi Kesiapan Merge (SIAP MERGE / PERLU REFACTOR / KRITIS)`;

    return await this.callProviderApi(SYSTEM_PROMPT, [{ role: 'user', content: comparePrompt }]);
  }

  public async generateChangelog(gitLog: string, currentBranch: string): Promise<string> {
    const changelogPrompt = `[AUTOMATED CHANGELOG GENERATOR]
Buatkan dokumen \`CHANGELOG.md\` berstandar "Keep a Changelog" berdasarkan riwayat commit berikut (Branch: \`${currentBranch}\`):

\`\`\`text
${gitLog || 'Belum ada commit terdeteksi.'}
\`\`\`

Tugas Anda:
Susun dokumen Changelog dalam format Markdown profesional (TANPA EMOJI, gunakan penanda teks):
# CHANGELOG

## [Unreleased / Next Version] - ${new Date().toISOString().split('T')[0]}

### Added (Fitur Baru)
- List fitur baru + parafrase bahasa awam

### Fixed (Perbaikan Bug)
- List perbaikan bug + parafrase bahasa awam

### Changed (Perubahan Sistem)
- List perubahan internal sistem + parafrase bahasa awam`;

    return await this.callProviderApi(SYSTEM_PROMPT, [{ role: 'user', content: changelogPrompt }]);
  }

  public async generateConflictResolution(conflicts: ConflictBlock[]): Promise<string> {
    const conflictStr = conflicts.map((c, i) =>
      `Konflik #${i + 1} di \`${c.filePath}\` (Baris L${c.startLine}-L${c.endLine}):\n` +
      `<<<<<<< Versi Anda (Lokal):\n${c.ours}\n=======\nVersi Masuk (Remote):\n${c.theirs}\n>>>>>>>`
    ).join('\n\n');

    const resolvePrompt = `[CONFLICT AUTO-FIX ASSISTANT]
Terdeteksi ${conflicts.length} potongan kode yang bentrok (Merge Conflict):

${conflictStr}

Tugas Anda:
Berikan rekomendasi hasil penggabungan (resolution) terbaik (TANPA EMOJI, gunakan penanda teks [CONFLICT]):
1. [CONFLICT] Analisis Akar Masalah Bentrokan
2. Solusi Kode Penggabungan Terbaik (Siap Copy-Paste)
3. Penjelasan Bahasa Awam mengapa solusi ini dipilih`;

    return await this.callProviderApi(SYSTEM_PROMPT, [{ role: 'user', content: resolvePrompt }]);
  }

  public async generateHistoryTimeline(gitLog: string, query: string): Promise<string> {
    const historyPrompt = `[SMART HISTORY TIMELINE EXPLORER]
Hasil Pencarian Riwayat Commit Git (Query: "${query || 'Semua Commit Terbaru'}"):

\`\`\`text
${gitLog || 'Tidak ada commit yang cocok dengan kriteria pencarian.'}
\`\`\`

Tugas Anda:
Sajikan riwayat commit ini ke dalam Linimasa Bahasa Awam yang rapi (TANPA EMOJI, gunakan penanda teks [PROGRESS]):
- [PROGRESS] Linimasa Riwayat Pembangunan
- Setiap poin commit disajikan dengan: Hash + Penjelasan Bahasa Awam mengenai apa yang dibuat/diperbaiki
- Urutkan dari yang paling baru ke yang paling lama`;

    return await this.callProviderApi(SYSTEM_PROMPT, [{ role: 'user', content: historyPrompt }]);
  }

  private language: 'id' | 'en' = 'id';

  public setLanguage(lang: 'id' | 'en'): void {
    this.language = lang;
  }

  public getLanguage(): 'id' | 'en' {
    return this.language;
  }

  public async generateCommandFromNaturalLanguage(userQuery: string, branchContext?: string): Promise<string> {
    const isEn = this.language === 'en';
    const cmdPrompt = isEn
      ? `[NATURAL LANGUAGE GIT COMMAND BUILDER]
User intent: "${userQuery}"
Context: ${branchContext || 'Git repository'}

Task:
Construct the exact, safe Git command(s) to fulfill this intent.
Format (NO EMOJIS, use text tags):
- [COMMAND] Recommended Git Command(s)
\`\`\`bash
git command here
\`\`\`
- Layman Explanation of what each step does
- Safety Note & Risks`
      : `[NATURAL LANGUAGE GIT COMMAND BUILDER]
Keinginan pengguna: "${userQuery}"
Konteks: ${branchContext || 'Workspace Git'}

Tugas Anda:
Susun perintah Git yang tepat dan aman untuk memenuhi keinginan tersebut.
Format (TANPA EMOJI, gunakan penanda teks):
- [COMMAND] Perintah Git Direkomendasikan
\`\`\`bash
git command di sini
\`\`\`
- Penjelasan Bahasa Awam mengenai apa yang dilakukan perintah tersebut
- Catatan Keselamatan & Potensi Risiko`;

    return await this.callProviderApi(SYSTEM_PROMPT, [{ role: 'user', content: cmdPrompt }]);
  }

  public async generateQualityScorecard(gitLog: string, currentBranch: string): Promise<string> {
    const isEn = this.language === 'en';
    const scorePrompt = isEn
      ? `[COMMIT QUALITY & GITFLOW SCORECARD]
Recent commits on branch \`${currentBranch}\`:
\`\`\`text
${gitLog || 'No commits found.'}
\`\`\`

Task:
Evaluate these commits against Conventional Commits, message clarity, and GitFlow discipline.
Format (NO EMOJIS, use text tags):
- [HEALTH CHECK] Commit Quality Scorecard (Branch: \`${currentBranch}\`)
- SCORE: [0-100] / GRADE: [A+ / A / B / C / D]
- Positives (Good practices observed)
- Areas for Improvement (Constructive feedback)
- 3 Layman Actionable Tips`
      : `[COMMIT QUALITY & GITFLOW SCORECARD]
Daftar commit terbaru di branch \`${currentBranch}\`:
\`\`\`text
${gitLog || 'Belum ada commit.'}
\`\`\`

Tugas Anda:
Evaluasi kualitas commit berdasarkan standar Conventional Commit, kejelasan pesan, dan kedisiplinan GitFlow.
Format (TANPA EMOJI, gunakan penanda teks):
- [HEALTH CHECK] Kartu Penilaian Kualitas Commit (Branch: \`${currentBranch}\`)
- SKOR: [0-100] / PREDIKAT: [A+ / A / B / C / D]
- Hal Positif (Kelebihan yang terdeteksi)
- Area Perbaikan (Evaluasi konstruktif)
- 3 Saran Perbaikan Bahasa Awam`;

    return await this.callProviderApi(SYSTEM_PROMPT, [{ role: 'user', content: scorePrompt }]);
  }

  public async generateLargeFileSafetyAdvice(largeFiles: { filePath: string; sizeMB: number }[]): Promise<string> {
    const isEn = this.language === 'en';
    const filesText = largeFiles.map(f => `- \`${f.filePath}\` (${f.sizeMB} MB)`).join('\n');

    const prompt = isEn
      ? `[LARGE FILE & DATASET SAFETY GUARD]
The following large files (>= 50 MB) were detected in the working tree:
${filesText}

Task:
Explain in layman's terms why committing large files directly into Git causes issues (repo bloat, failed push errors).
Provide clear step-by-step instructions and 1-click action recommendations:
1. Option A: Add to .gitignore
2. Option B: Use Git LFS or DVC for Data Science/ML models
Format without emojis using text tags ([WARNING], [SUGGESTION]).`
      : `[PELINDUNG BERKAS BESAR & DATASET ML]
Berkas ukuran besar (>= 50 MB) berikut terdeteksi di meja kerja Git Anda:
${filesText}

Tugas Anda:
Jelaskan dalam bahasa awam mengapa meng-commit berkas besar ke Git biasa dapat menyebabkan repositori macet/error saat push.
Berikan panduan langkah demi langkah dan opsi tindakan ramah awam:
1. Opsi A: Abaikan berkas dengan memasukkan ke \`.gitignore\`
2. Opsi B: Gunakan Git LFS atau DVC untuk dataset / model weights Machine Learning
Format TANPA EMOJI, gunakan penanda teks ([WARNING], [SUGGESTION]).`;

    return await this.callProviderApi(SYSTEM_PROMPT, [{ role: 'user', content: prompt }]);
  }

  private async callProviderApi(systemPrompt: string, messages: AIMessage[]): Promise<string> {
    switch (this.provider) {
      case 'anthropic':
        return this.callAnthropicApi(systemPrompt, messages);
      case 'gemini':
        return this.callGeminiApi(systemPrompt, messages);
      default:
        // OpenAI-compatible: groq, openai
        return this.callOpenAICompatibleApi(systemPrompt, messages);
    }
  }

  // --- OpenAI-Compatible API (Groq, OpenAI) ---
  private callOpenAICompatibleApi(systemPrompt: string, messages: AIMessage[]): Promise<string> {
    const providerInfo = PROVIDERS[this.provider];
    const allMessages = [{ role: 'system', content: systemPrompt }, ...messages];

    const payload = JSON.stringify({
      model: this.model,
      messages: allMessages,
      temperature: 0.7,
      max_tokens: 2048,
      top_p: 1,
      stream: false
    });

    return new Promise((resolve, reject) => {
      const options: https.RequestOptions = {
        hostname: providerInfo.hostname,
        port: 443,
        path: providerInfo.path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Length': Buffer.byteLength(payload)
        }
      };

      this.makeRequest(options, payload, (data) => {
        const parsed = JSON.parse(data) as GroqResponse;
        return parsed.choices[0]?.message?.content || 'Maaf, saya tidak dapat merespon saat ini.';
      }).then(resolve).catch(reject);
    });
  }

  // --- Anthropic API (Claude) ---
  private callAnthropicApi(systemPrompt: string, messages: AIMessage[]): Promise<string> {
    const anthropicMessages = messages.map(m => ({
      role: m.role === 'system' ? 'user' : m.role,
      content: m.content
    }));

    const payload = JSON.stringify({
      model: this.model,
      max_tokens: 2048,
      system: systemPrompt,
      messages: anthropicMessages
    });

    return new Promise((resolve, reject) => {
      const options: https.RequestOptions = {
        hostname: 'api.anthropic.com',
        port: 443,
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Length': Buffer.byteLength(payload)
        }
      };

      this.makeRequest(options, payload, (data) => {
        const parsed = JSON.parse(data);
        const content = parsed.content;
        if (Array.isArray(content) && content.length > 0) {
          return content.map((block: { type: string; text?: string }) => block.text || '').join('');
        }
        return 'Maaf, saya tidak dapat merespon saat ini.';
      }).then(resolve).catch(reject);
    });
  }

  // --- Google Gemini API ---
  private callGeminiApi(systemPrompt: string, messages: AIMessage[]): Promise<string> {
    const geminiContents = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const payload = JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: geminiContents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048
      }
    });

    const path = `/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    return new Promise((resolve, reject) => {
      const options: https.RequestOptions = {
        hostname: 'generativelanguage.googleapis.com',
        port: 443,
        path: path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      };

      this.makeRequest(options, payload, (data) => {
        const parsed = JSON.parse(data);
        const candidates = parsed.candidates;
        if (Array.isArray(candidates) && candidates.length > 0) {
          const parts = candidates[0].content?.parts;
          if (Array.isArray(parts) && parts.length > 0) {
            return parts.map((p: { text?: string }) => p.text || '').join('');
          }
        }
        return 'Maaf, saya tidak dapat merespon saat ini.';
      }).then(resolve).catch(reject);
    });
  }

  // --- Shared HTTP Request Helper ---
  private makeRequest(
    options: https.RequestOptions,
    payload: string,
    parseResponse: (data: string) => string
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk: Buffer) => { data += chunk.toString(); });
        res.on('end', () => {
          try {
            if (res.statusCode && res.statusCode >= 400) {
              let errorMsg = `API Error (${res.statusCode})`;
              try {
                const errorBody = JSON.parse(data);
                errorMsg = `API Error (${res.statusCode}): ${errorBody.error?.message || errorBody.message || data}`;
              } catch { /* use generic error */ }
              reject(new Error(errorMsg));
              return;
            }
            resolve(parseResponse(data));
          } catch (e) {
            reject(new Error(`Gagal parsing respon: ${(e as Error).message}`));
          }
        });
      });

      req.on('error', (e: Error) => {
        reject(new Error(`Koneksi gagal: ${e.message}`));
      });

      req.setTimeout(30000, () => {
        req.destroy();
        reject(new Error('API timeout (30 detik). Pastikan koneksi internet Anda stabil.'));
      });

      req.write(payload);
      req.end();
    });
  }
}
