# GitFlow Assistant 🌿🤖

> Ekstensi VS Code interaktif yang membimbing alur kerja Git (GitFlow) dengan parafrase bahasa awam, notifikasi proaktif, dan panduan pembangunan bertahap.

## ✨ Fitur Utama

| Fitur | Deskripsi | Status |
|---|---|---|
| 🌿 **5 Core Branches** | Pengelolaan alur `feat → dev → staging → main` + `hotfix` | 🔄 |
| 🗣️ **Parafrase Awam** | Setiap istilah Git diterjemahkan ke bahasa sehari-hari | 🔄 |
| 💬 **Chat Interaktif** | Panel chat di sidebar dengan bubble kiri (AI) & kanan (User) | ⬜ |
| 🤖 **AI (Groq API)** | Jawaban cerdas dengan system prompt GitFlow | ⬜ |
| 🔔 **Notifikasi Proaktif** | Peringatan otomatis saat ada pelanggaran alur atau branch mangkrak | ⬜ |
| 📊 **Progress Tracker** | Pelacakan fase pembangunan proyek | ⬜ |

## 🗺️ Alur Pergerakan Branch

```
feat/* ──► dev ──► staging ──► main
                                 ▲
                         hotfix/*─┘ (darurat)
```

## 🚀 Fase Pembangunan

1. ✅ **Phase 0**: Setup GitFlow Branches
2. 🔄 **Phase 1**: Scaffold (kerangka proyek)
3. ⬜ **Phase 2**: Webview Chat UI
4. ⬜ **Phase 3**: Groq API Integration
5. ⬜ **Phase 4**: Git Branch Detector
6. ⬜ **Phase 5**: Outbound Chat & Notifikasi
7. ⬜ **Phase 6**: Staging Test
8. ⬜ **Phase 7**: Release v1.0.0

## 🛠️ Development

### Prasyarat
- Node.js >= 18
- VS Code >= 1.85.0

### Setup
```bash
npm install        # Memasang semua dependensi (belanja bahan)
npm run compile    # Mengkompilasi TypeScript (memasak bahan mentah)
```

### Debug
Tekan `F5` di VS Code untuk menjalankan ekstensi di jendela Extension Host baru.

## 📄 Lisensi

MIT
