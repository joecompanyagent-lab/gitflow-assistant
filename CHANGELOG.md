# Changelog

Semua perubahan penting pada proyek ini akan didokumentasikan di file ini.

Format mengikuti [Keep a Changelog](https://keepachangelog.com/id-ID/1.0.0/),
dan proyek ini menggunakan [Semantic Versioning](https://semver.org/lang/id/).

## [1.3.2] - 2026-08-09

### ⚡ Fixed & Improved (Aktivasi Webview Instan)
- **Instant Sidebar Activation**: Menambahkan `onView:gitflowAssistant.chatView` dan `*` ke manifest `activationEvents` sehingga Antigravity IDE / VS Code mengaktifkan ekstensi seketika begitu ikon sidebar diklik tanpa menunggu event startup.
- **Git Service Safe Init**: Menambahkan null-guard pada `gitExtension.exports` untuk menjamin ekstensi aktif 100% lancar meski dibuka di folder non-Git.

---

## [1.3.1] - 2026-08-09

### 🐛 Fixed (Perbaikan Bug Loading)
- **Webview Loading Fix**: Memperbaiki masalah Webview yang menampilkan bar loading biru secara terus-menerus (`acquireVsCodeApi` yang dipanggil dua kali).

---

## [1.3.0] - 2026-08-09

### ✨ Added (Fitur Baru: Smart Fallback, Offline Mode & CI/CD Pipeline)
- 🤖 **Smart Model Fallback**: Beralih otomatis ke model ultra-cepat `llama-3.1-8b-instant` jika model utama bermasalah.
- 🌐 **Offline Knowledge Base**: `OfflineKnowledgeService` menyajikan pustaka pengetahuan lokal interaktif saat offline.
- ⚙️ **CI/CD GitHub Actions Pipeline**: Workflow `.github/workflows/build-and-test.yml` otomatis menguji kompilasi dan mengemas `.vsix`.
