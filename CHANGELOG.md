# Changelog

Semua perubahan penting pada proyek ini akan didokumentasikan di file ini.

Format mengikuti [Keep a Changelog](https://keepachangelog.com/id-ID/1.0.0/),
dan proyek ini menggunakan [Semantic Versioning](https://semver.org/lang/id/).

## [1.0.1] - 2026-08-09

### 🔑 Added (Ditambahkan)
- **Default Groq API Key**: Memasang API key bawaan (`gsk_aog...`) sebagai default fallback sehingga ekstensi langsung aktif dan bisa digunakan out-of-the-box tanpa perlu konfigurasi manual dari user.

---

## [1.0.0] - 2026-08-09

### 🚀 Release Perdana (Initial Release)

Ekstensi VS Code **GitFlow Assistant** rilis versi 1.0.0!

#### ✨ Fitur yang Ditambahkan (Added)
- 🌿 **5 Core Branches Protocol**: Pengelolaan alur branch standard (`feat/*` → `dev` → `staging` → `main` + `hotfix/*`).
- 🗣️ **Universal Git-to-Layman Paraphrase Engine**: Kamus 30+ istilah Git beserta parafrase bahasa awam dan analogi sehari-hari.
- 💬 **Webview Chat UI**: Panel chat di sidebar VS Code dengan bubble kiri (AI) dan kanan (User), tema dark mode otomatis, typing indicator, dan 6 varian tag badge outbound.
- 🤖 **Groq API Integration**: Otak AI terhubung dengan Groq API (Llama 3.1 8B, Llama 3.3 70B, Gemma 2 9B, Mixtral) lengkap dengan streaming response bertahap dan 11 Pilar System Prompt.
- 🔍 **Real-Time Git Detector**: Deteksi otomatis branch aktif, pengawas pergerakan branch, validator commit message conventional, validator nama branch, dan stale branch detector (>7 hari).
- 🔔 **Outbound & Proactive Chat Engine**: 5 skenario notifikasi proaktif otomatis (Initial Greeting, Branch Movement, Proactive Violation Warning, Stale Branch Alert, File Structure Guard).
- ⚙️ **VS Code Settings UI**: Pengaturan API key dan pemilihan model AI langsung dari VS Code Settings.
