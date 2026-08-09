# Changelog

Semua perubahan penting pada proyek ini akan didokumentasikan di file ini.

Format mengikuti [Keep a Changelog](https://keepachangelog.com/id-ID/1.0.0/),
dan proyek ini menggunakan [Semantic Versioning](https://semver.org/lang/id/).

## [1.3.1] - 2026-08-09

### 🐛 Fixed (Perbaikan Bug Loading)
- **Webview Loading Fix**: Memperbaiki masalah Webview yang menampilkan bar loading biru secara terus-menerus (`acquireVsCodeApi` yang dipanggil dua kali). Penanganan tombol bersihkan chat disatukan di `main.js` sehingga panel Webview dimuat seketika dan 100% lancar.

---

## [1.3.0] - 2026-08-09

### ✨ Added (Fitur Baru: Smart Fallback, Offline Mode & CI/CD Pipeline)
- 🤖 **Smart Model Fallback**: Beralih otomatis ke model ultra-cepat `llama-3.1-8b-instant` jika model utama bermasalah.
- 🌐 **Offline Knowledge Base**: `OfflineKnowledgeService` menyajikan pustaka pengetahuan lokal interaktif saat offline.
- ⚙️ **CI/CD GitHub Actions Pipeline**: Workflow `.github/workflows/build-and-test.yml` otomatis menguji kompilasi dan mengemas `.vsix`.

---

## [1.2.0] - 2026-08-09

### 🔘 Added (Fitur Baru: One-Click Git Buttons)
- **Tombol Aksi Cepat Interaktif di Chat UI**: Tombol aksi interaktif di dalam gelembung chat AI.

---

## [1.1.0] - 2026-08-09

### ✨ Added (Fitur Baru)
- 🔑 **Multi-API Key Settings & Auto-Fallback**: Menambahkan pengaturan array `gitflowAssistant.groqApiKeys` di VS Code Settings.

---

## [1.0.2] - 2026-08-09

### 📦 Added & Fixed (Pengemasan Paket VSIX)
- **VSIX Packaging Support**: Menambahkan file `LICENSE` (MIT) dan field `repository` pada manifes `package.json`.

---

## [1.0.1] - 2026-08-09

### 🔑 Added (Ditambahkan)
- **Default Groq API Key**: Memasang API key bawaan (`gsk_aog...`) sebagai default fallback.

---

## [1.0.0] - 2026-08-09

### 🚀 Release Perdana (Initial Release)

Ekstensi VS Code **GitFlow Assistant** rilis versi 1.0.0!
