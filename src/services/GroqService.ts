/**
 * GroqService — Layanan integrasi dengan Groq API untuk kemampuan AI.
 * (Jembatan komunikasi ke otak AI — mendukung multiple API key rotation & auto-fallback)
 *
 * Tanggung jawab:
 * - Mengelola koneksi ke Groq API dengan dukungan multiple API keys
 * - Merotasi API key secara otomatis (auto-fallback jika 1 key mengalami rate-limit/error)
 * - Mengirim pesan chat ke model AI dengan system prompt GitFlow
 * - Mengelola riwayat percakapan (conversation history)
 * - Menangani error, timeout, dan rate limiting
 */

import * as vscode from 'vscode';
import Groq from 'groq-sdk';
import { getSystemPromptWithContext } from './systemPrompt';
import { OfflineKnowledgeService } from './OfflineKnowledgeService';

/** Struktur satu pesan dalam riwayat percakapan */
interface ConversationMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export class GroqService {
    private _conversationHistory: ConversationMessage[] = [];
    private _maxHistoryLength = 20; // Batasi riwayat agar tidak membengkak token
    private _activeKeyIndex = 0;

    /** API Key bawaan proyek (default fallback API key) */
    private static readonly DEFAULT_API_KEY = '';

    constructor() {
        // Inisialisasi awal
    }

    /**
     * Mengambil daftar seluruh API key yang terkonfigurasi (multi-API key support).
     * (Mengumpulkan semua kunci akses dari pengaturan VS Code)
     */
    public getAllApiKeys(): string[] {
        const config = vscode.workspace.getConfiguration('gitflowAssistant');
        const keysSet = new Set<string>();

        // 1. Ambil daftar array dari setting groqApiKeys
        const arrayKeys = config.get<string[]>('groqApiKeys') || [];
        arrayKeys.forEach(k => {
            if (k && k.trim().length > 0) {
                keysSet.add(k.trim());
            }
        });

        // 2. Ambil single key dari setting groqApiKey jika ada
        const singleKey = config.get<string>('groqApiKey');
        if (singleKey && singleKey.trim().length > 0) {
            keysSet.add(singleKey.trim());
        }

        // 3. Jika tidak ada key sama sekali, gunakan DEFAULT_API_KEY bawaan
        if (keysSet.size === 0) {
            keysSet.add(GroqService.DEFAULT_API_KEY);
        }

        return Array.from(keysSet);
    }

    /**
     * Mengambil API key aktif saat ini.
     */
    private _getActiveApiKey(): string {
        const keys = this.getAllApiKeys();
        if (this._activeKeyIndex >= keys.length) {
            this._activeKeyIndex = 0;
        }
        return keys[this._activeKeyIndex] || GroqService.DEFAULT_API_KEY;
    }

    /**
     * Berpindah ke API key berikutnya (auto-fallback / rotation).
     * (Memutar ke kunci akses cadangan berikutnya jika kunci saat ini bermasalah)
     */
    private _rotateToNextKey(): string {
        const keys = this.getAllApiKeys();
        if (keys.length <= 1) {
            return this._getActiveApiKey();
        }
        this._activeKeyIndex = (this._activeKeyIndex + 1) % keys.length;
        const nextKey = keys[this._activeKeyIndex];
        console.log(`🔄 [GitFlow] Rotasi API Key otomatis: mengalihkan ke Key #${this._activeKeyIndex + 1} dari ${keys.length}`);
        return nextKey;
    }

    /**
     * Membuat klien Groq baru untuk API key yang ditentukan.
     */
    private _createClient(apiKey: string): Groq {
        return new Groq({ apiKey });
    }

    /**
     * Mengambil nama model yang dipilih dari konfigurasi.
     */
    private _getModel(): string {
        const config = vscode.workspace.getConfiguration('gitflowAssistant');
        return config.get<string>('groqModel') || 'llama-3.1-8b-instant';
    }

    /**
     * Memeriksa apakah API key sudah dikonfigurasi.
     */
    public isConfigured(): boolean {
        return this.getAllApiKeys().length > 0;
    }

    /**
     * Memuat ulang service jika konfigurasi berubah.
     */
    public reload(): void {
        this._activeKeyIndex = 0;
    }

    /**
     * Menghapus riwayat percakapan.
     */
    public clearHistory(): void {
        this._conversationHistory = [];
    }

    /**
     * Mengirim pesan ke Groq API dengan penanganan auto-fallback antar API keys.
     * (Jika 1 key mengalami error/rate-limit, otomatis mencoba key cadangan berikutnya)
     */
    public async sendMessage(
        userMessage: string,
        currentBranch?: string
    ): Promise<string> {
        const keys = this.getAllApiKeys();
        if (keys.length === 0) {
            return this._getApiKeyMissingMessage();
        }

        let lastError: unknown;
        const maxAttempts = keys.length;

        // Coba setiap API key yang tersedia secara berurutan
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const apiKey = this._getActiveApiKey();
            const client = this._createClient(apiKey);

            try {
                const systemPrompt = getSystemPromptWithContext(currentBranch);

                // Tambahkan pesan user ke riwayat hanya pada percakapan baru
                if (attempt === 0) {
                    this._conversationHistory.push({
                        role: 'user',
                        content: userMessage,
                    });
                    this._trimHistory();
                }

                const messages: ConversationMessage[] = [
                    { role: 'system', content: systemPrompt },
                    ...this._conversationHistory,
                ];

                const completion = await client.chat.completions.create({
                    model: this._getModel(),
                    messages: messages,
                    temperature: 0.7,
                    max_tokens: 2048,
                    top_p: 0.9,
                    stream: false,
                });

                const reply = completion.choices[0]?.message?.content;

                if (!reply) {
                    return '⚠️ Otak AI mengembalikan respons kosong. Silakan coba lagi.';
                }

                // Simpan balasan ke riwayat
                this._conversationHistory.push({
                    role: 'assistant',
                    content: reply,
                });

                return reply;
            } catch (error: unknown) {
                lastError = error;
                console.warn(`[GitFlow] Percobaan API Key #${this._activeKeyIndex + 1} gagal. Memutar ke key cadangan berikutnya...`, error);
                this._rotateToNextKey();
            }
        }

        return this._handleError(lastError);
    }

    /**
     * Mengirim pesan ke Groq API dengan streaming dan auto-fallback antar API keys.
     * (Balasan bertahap dengan rotasi otomatis jika key utama sibuk/rate-limit)
     */
    public async sendMessageStreaming(
        userMessage: string,
        currentBranch: string | undefined,
        onChunk: (chunk: string) => void
    ): Promise<string> {
        const keys = this.getAllApiKeys();
        if (keys.length === 0) {
            const msg = this._getApiKeyMissingMessage();
            onChunk(msg);
            return msg;
        }

        let lastError: unknown;
        const maxAttempts = keys.length;

        // Siapkan pesan user dalam riwayat
        this._conversationHistory.push({
            role: 'user',
            content: userMessage,
        });
        this._trimHistory();

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const apiKey = this._getActiveApiKey();
            const client = this._createClient(apiKey);

            try {
                const systemPrompt = getSystemPromptWithContext(currentBranch);

                const messages: ConversationMessage[] = [
                    { role: 'system', content: systemPrompt },
                    ...this._conversationHistory,
                ];

                let modelToUse = this._getModel();

                // Coba panggil streaming
                let stream;
                try {
                    stream = await client.chat.completions.create({
                        model: modelToUse,
                        messages: messages,
                        temperature: 0.7,
                        max_tokens: 2048,
                        top_p: 0.9,
                        stream: true,
                    });
                } catch (modelErr: any) {
                    // Smart Model Fallback: Jika model utama error/busy, fallback ke llama-3.1-8b-instant
                    const fallbackModel = 'llama-3.1-8b-instant';
                    if (modelToUse !== fallbackModel) {
                        console.warn(`[GitFlow] Smart Model Fallback: Model ${modelToUse} bermasalah, beralih ke ${fallbackModel}`);
                        modelToUse = fallbackModel;
                        stream = await client.chat.completions.create({
                            model: modelToUse,
                            messages: messages,
                            temperature: 0.7,
                            max_tokens: 2048,
                            top_p: 0.9,
                            stream: true,
                        });
                    } else {
                        throw modelErr;
                    }
                }

                let fullReply = '';

                for await (const chunk of stream) {
                    const content = chunk.choices[0]?.delta?.content;
                    if (content) {
                        fullReply += content;
                        onChunk(fullReply);
                    }
                }

                if (fullReply) {
                    this._conversationHistory.push({
                        role: 'assistant',
                        content: fullReply,
                    });
                    return fullReply;
                }
            } catch (error: unknown) {
                lastError = error;
                console.warn(`[GitFlow] Percobaan Streaming API Key #${this._activeKeyIndex + 1} gagal. Memutar ke key berikutnya...`, error);
                this._rotateToNextKey();
            }
        }

        // Jika semua network / API key gagal, gunakan Offline Knowledge Base
        const offlineService = new OfflineKnowledgeService();
        const offlineAns = offlineService.getAnswer(userMessage, currentBranch);
        onChunk(offlineAns.content);
        return offlineAns.content;
    }

    /**
     * Memotong riwayat percakapan agar tidak melebihi batas.
     */
    private _trimHistory(): void {
        if (this._conversationHistory.length > this._maxHistoryLength) {
            this._conversationHistory = this._conversationHistory.slice(
                -this._maxHistoryLength
            );
        }
    }

    /**
     * Menangani berbagai jenis error dari Groq API.
     */
    private _handleError(error: unknown): string {
        const totalKeys = this.getAllApiKeys().length;
        const keysNote = totalKeys > 1 ? ` *(Telah dicoba ${totalKeys} API keys terdaftar)*` : '';

        if (error instanceof Error) {
            const msg = error.message.toLowerCase();

            if (msg.includes('401') || msg.includes('unauthorized') || msg.includes('invalid api key')) {
                return (
                    `🔑 **API Key Tidak Valid** *(kunci akses ditolak)*${keysNote}\n\n` +
                    'API key Groq yang Anda masukkan salah atau sudah kedaluwarsa.\n\n' +
                    '**Cara memperbaiki:**\n' +
                    '1. Buka [console.groq.com](https://console.groq.com/keys)\n' +
                    '2. Salin API key baru\n' +
                    '3. Buka VS Code Settings → cari `GitFlow Assistant`\n' +
                    '4. Tambahkan ke daftar `Groq Api Keys` (bisa memasukkan beberapa key cadangan sekaligus!)'
                );
            }

            if (msg.includes('429') || msg.includes('rate limit')) {
                return (
                    `⏳ **Batas Permintaan Tercapai** *(terlalu banyak permintaan dalam waktu singkat)*${keysNote}\n\n` +
                    'Groq API membatasi jumlah permintaan. Tambahkan beberapa API key tambahan di Settings `Groq Api Keys` agar sistem bisa melakukan rotasi otomatis saat key lain sibuk.'
                );
            }

            if (msg.includes('timeout') || msg.includes('timed out')) {
                return (
                    `⏱️ **Waktu Habis** *(koneksi ke otak AI terlalu lama)*${keysNote}\n\n` +
                    'Server Groq tidak merespons tepat waktu. Coba lagi dalam beberapa saat.'
                );
            }

            if (msg.includes('network') || msg.includes('fetch') || msg.includes('enotfound')) {
                return (
                    '🌐 **Masalah Koneksi Internet** *(tidak bisa menghubungi server AI)*\n\n' +
                    'Pastikan komputer Anda terhubung ke internet, lalu coba lagi.'
                );
            }

            return `⚠️ **Error:** ${error.message}${keysNote}`;
        }

        return `⚠️ Terjadi kesalahan tidak diketahui. Silakan coba lagi.${keysNote}`;
    }

    /**
     * Pesan panduan saat API key belum dikonfigurasi.
     */
    private _getApiKeyMissingMessage(): string {
        return (
            '🔑 **API Key Belum Dikonfigurasi**\n\n' +
            '**Cara setup (bisa beberapa API Key sekaligus):**\n\n' +
            '1. **Dapatkan API key** di [console.groq.com](https://console.groq.com/keys)\n' +
            '2. **Buka Settings VS Code:** `Cmd+,` / `Ctrl+,` ➔ cari `GitFlow Assistant`\n' +
            '3. **Masukkan ke daftar `Groq Api Keys`** (Anda bisa menambahkan 2-5 API Key untuk rotasi otomatis!)'
        );
    }
}
