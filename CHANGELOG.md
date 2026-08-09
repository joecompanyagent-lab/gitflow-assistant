# Changelog

Semua perubahan penting pada proyek ini akan didokumentasikan di file ini.

Format mengikuti [Keep a Changelog](https://keepachangelog.com/id-ID/1.0.0/),
dan proyek ini menggunakan [Semantic Versioning](https://semver.org/lang/id/).

## [Unreleased]

### Added (Ditambahkan)
- Kerangka dasar proyek (scaffold) — `feat/init-scaffold`
  - `package.json` — Manifes ekstensi VS Code
  - `tsconfig.json` — Konfigurasi TypeScript
  - Struktur folder: `src/`, `media/`, `test/`
  - Entry point: `src/extension.ts`
  - Scaffold providers: `ChatViewProvider.ts`
  - Scaffold services: `GroqService.ts`, `GitService.ts`
  - Tipe data: `src/models/types.ts`
  - Utilitas: `src/utils/formatter.ts`
  - Aset media: `main.css`, `main.js`, `gitflow-icon.svg`
  - Konfigurasi debug: `.vscode/launch.json`
  - Dokumentasi: `README.md`, `CHANGELOG.md`
