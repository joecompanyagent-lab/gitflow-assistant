# Changelog

Semua perubahan penting pada proyek ini akan didokumentasikan di file ini.

Format mengikuti [Keep a Changelog](https://keepachangelog.com/id-ID/1.0.0/),
dan proyek ini menggunakan [Semantic Versioning](https://semver.org/lang/id/).

## [1.3.0] - 2026-08-09

### ✨ Added (Fitur Baru: Smart Fallback, Offline Mode & CI/CD Pipeline)
- 🤖 **Smart Model Fallback**: Jika model utama yang dipilih (misal `llama-3.3-70b-versatile`) sibuk atau bermasalah, sistem secara otomatis beralih sementara ke model ultra-cepat `llama-3.1-8b-instant`.
- 🌐 **Offline Knowledge Base**: `OfflineKnowledgeService` menyajikan pustaka pengetahuan lokal interaktif tentang alur GitFlow, Conventional Commits, dan prosedur darurat Hotfix saat koneksi internet terputus.
- ⚙️ **CI/CD GitHub Actions Pipeline**: Workflow `.github/workflows/build-and-test.yml` otomatis menguji kompilasi TypeScript, menjalankan test suite pada Node 18 & 20, serta mengemas berkas `.vsix` installer secara otomatis saat ada push/PR/Tag.

---

## [1.2.0] - 2026-08-09

### 🔘 Added (Fitur Baru: One-Click Git Buttons)
- **Tombol Aksi Cepat Interaktif di Chat UI**: Menambahkan tombol aksi interaktif di dalam gelembung chat AI (`feat/*` creation, branch switch, branch delete, conventional commit guide).

---

## [1.1.0] - 2026-08-09

### ✨ Added (Fitur Baru)
- 🔑 **Multi-API Key Settings & Auto-Fallback**: Menambahkan pengaturan array `gitflowAssistant.groqApiKeys` di VS Code Settings untuk rotasi dan fallback otomatis.

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
