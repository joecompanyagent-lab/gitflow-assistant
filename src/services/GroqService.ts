/**
 * GroqService — Layanan integrasi dengan Groq API untuk kemampuan AI.
 * (Jembatan komunikasi ke otak AI — mengirim pertanyaan dan menerima jawaban)
 *
 * Tanggung jawab:
 * - Mengelola koneksi ke Groq API
 * - Mengirim pesan chat ke model AI dengan system prompt GitFlow
 * - Mengelola riwayat percakapan (conversation history)
 * - Menangani error, timeout, dan rate limiting
 */

import * as vscode from 'vscode';
import Groq from 'groq-sdk';
import { getSystemPromptWithContext } from './systemPrompt';

/** Struktur satu pesan dalam riwayat percakapan */
interface ConversationMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export class GroqService {
    private _client: Groq | undefined;
    private _conversationHistory: ConversationMessage[] = [];
    private _maxHistoryLength = 20; // Batasi riwayat agar tidak membengkak token

    constructor() {
        this._initClient();
    }

    /**
     * Inisialisasi klien Groq API.
     * (Menyiapkan koneksi ke otak AI dengan kunci akses)
     */
    private _initClient(): void {
        const apiKey = this._getApiKey();
        if (apiKey) {
            this._client = new Groq({ apiKey });
        } else {
            this._client = undefined;
        }
    }

    /**
     * Mengambil API key dari konfigurasi VS Code.
     * (Mencari kunci akses yang disimpan di pengaturan VS Code)
     */
    private _getApiKey(): string | undefined {
        const config = vscode.workspace.getConfiguration('gitflowAssistant');
        const key = config.get<string>('groqApiKey');
        return key && key.trim().length > 0 ? key.trim() : undefined;
    }

    /**
     * Mengambil nama model yang dipilih dari konfigurasi.
     * (Memilih versi otak AI yang akan digunakan)
     */
    private _getModel(): string {
        const config = vscode.workspace.getConfiguration('gitflowAssistant');
        return config.get<string>('groqModel') || 'llama-3.1-8b-instant';
    }

    /**
     * Memeriksa apakah API key sudah dikonfigurasi.
     * (Mengecek apakah kunci akses ke otak AI sudah dipasang)
     */
    public isConfigured(): boolean {
        return this._getApiKey() !== undefined;
    }

    /**
     * Memuat ulang klien jika API key berubah.
     * (Mengganti kunci akses tanpa perlu restart)
     */
    public reload(): void {
        this._initClient();
    }

    /**
     * Menghapus riwayat percakapan.
     * (Membersihkan memori percakapan — mulai dari awal)
     */
    public clearHistory(): void {
        this._conversationHistory = [];
    }

    /**
     * Mengirim pesan ke Groq API dan mendapatkan balasan.
     * (Mengirim pertanyaan ke otak AI dan menunggu jawabannya)
     *
     * @param userMessage — Pesan dari pengguna
     * @param currentBranch — Branch aktif saat ini (untuk konteks)
     * @returns Balasan dari AI, atau pesan error
     */
    public async sendMessage(
        userMessage: string,
        currentBranch?: string
    ): Promise<string> {
        // Cek apakah API key sudah dikonfigurasi
        if (!this.isConfigured()) {
            return this._getApiKeyMissingMessage();
        }

        // Pastikan klien sudah terinisialisasi
        if (!this._client) {
            this._initClient();
            if (!this._client) {
                return this._getApiKeyMissingMessage();
            }
        }

        try {
            // Siapkan system prompt dengan konteks branch
            const systemPrompt = getSystemPromptWithContext(currentBranch);

            // Tambahkan pesan user ke riwayat
            this._conversationHistory.push({
                role: 'user',
                content: userMessage,
            });

            // Potong riwayat jika terlalu panjang
            this._trimHistory();

            // Susun pesan lengkap untuk dikirim ke API
            const messages: ConversationMessage[] = [
                { role: 'system', content: systemPrompt },
                ...this._conversationHistory,
            ];

            // Kirim ke Groq API
            const completion = await this._client.chat.completions.create({
                model: this._getModel(),
                messages: messages,
                temperature: 0.7,
                max_tokens: 2048,
                top_p: 0.9,
                stream: false,
            });

            // Ambil balasan
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
            return this._handleError(error);
        }
    }

    /**
     * Mengirim pesan ke Groq API dengan streaming (balasan bertahap).
     * (Mengirim pertanyaan dan menerima jawaban kata per kata — 
     *  seperti melihat AI mengetik langsung)
     *
     * @param userMessage — Pesan dari pengguna
     * @param currentBranch — Branch aktif saat ini
     * @param onChunk — Callback yang dipanggil setiap potongan jawaban diterima
     * @returns Balasan lengkap setelah selesai
     */
    public async sendMessageStreaming(
        userMessage: string,
        currentBranch: string | undefined,
        onChunk: (chunk: string) => void
    ): Promise<string> {
        if (!this.isConfigured() || !this._client) {
            const msg = this._getApiKeyMissingMessage();
            onChunk(msg);
            return msg;
        }

        try {
            const systemPrompt = getSystemPromptWithContext(currentBranch);

            this._conversationHistory.push({
                role: 'user',
                content: userMessage,
            });
            this._trimHistory();

            const messages: ConversationMessage[] = [
                { role: 'system', content: systemPrompt },
                ...this._conversationHistory,
            ];

            const stream = await this._client.chat.completions.create({
                model: this._getModel(),
                messages: messages,
                temperature: 0.7,
                max_tokens: 2048,
                top_p: 0.9,
                stream: true,
            });

            let fullReply = '';

            for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content;
                if (content) {
                    fullReply += content;
                    onChunk(fullReply);
                }
            }

            // Simpan balasan lengkap ke riwayat
            if (fullReply) {
                this._conversationHistory.push({
                    role: 'assistant',
                    content: fullReply,
                });
            }

            return fullReply || '⚠️ Otak AI mengembalikan respons kosong.';
        } catch (error: unknown) {
            const errMsg = this._handleError(error);
            onChunk(errMsg);
            return errMsg;
        }
    }

    /**
     * Memotong riwayat percakapan agar tidak melebihi batas.
     * (Membuang catatan percakapan lama agar memori tidak penuh)
     */
    private _trimHistory(): void {
        if (this._conversationHistory.length > this._maxHistoryLength) {
            // Simpan pesan-pesan terbaru saja
            this._conversationHistory = this._conversationHistory.slice(
                -this._maxHistoryLength
            );
        }
    }

    /**
     * Menangani berbagai jenis error dari Groq API.
     * (Menerjemahkan pesan error teknis ke bahasa yang mudah dipahami)
     */
    private _handleError(error: unknown): string {
        if (error instanceof Error) {
            const msg = error.message.toLowerCase();

            if (msg.includes('401') || msg.includes('unauthorized') || msg.includes('invalid api key')) {
                return (
                    '🔑 **API Key Tidak Valid** *(kunci akses ditolak)*\n\n' +
                    'API key Groq yang Anda masukkan salah atau sudah kedaluwarsa.\n\n' +
                    '**Cara memperbaiki:**\n' +
                    '1. Buka [console.groq.com](https://console.groq.com/keys)\n' +
                    '2. Salin API key yang benar\n' +
                    '3. Buka VS Code Settings → cari "GitFlow Assistant"\n' +
                    '4. Tempel API key baru'
                );
            }

            if (msg.includes('429') || msg.includes('rate limit')) {
                return (
                    '⏳ **Batas Permintaan Tercapai** *(terlalu banyak pertanyaan dalam waktu singkat)*\n\n' +
                    'Groq API membatasi jumlah permintaan. Tunggu beberapa detik lalu coba lagi.'
                );
            }

            if (msg.includes('timeout') || msg.includes('timed out')) {
                return (
                    '⏱️ **Waktu Habis** *(koneksi ke otak AI terlalu lama)*\n\n' +
                    'Server Groq tidak merespons tepat waktu. Coba lagi dalam beberapa saat.'
                );
            }

            if (msg.includes('network') || msg.includes('fetch') || msg.includes('enotfound')) {
                return (
                    '🌐 **Masalah Koneksi Internet** *(tidak bisa menghubungi server AI)*\n\n' +
                    'Pastikan komputer Anda terhubung ke internet, lalu coba lagi.'
                );
            }

            return `⚠️ **Error:** ${error.message}`;
        }

        return '⚠️ Terjadi kesalahan tidak diketahui. Silakan coba lagi.';
    }

    /**
     * Pesan panduan saat API key belum dikonfigurasi.
     */
    private _getApiKeyMissingMessage(): string {
        return (
            '🔑 **API Key Belum Dikonfigurasi** *(kunci akses ke otak AI belum dipasang)*\n\n' +
            '**Cara setup (3 langkah mudah):**\n\n' +
            '1. **Daftar & dapatkan API key** di [console.groq.com](https://console.groq.com/keys) *(gratis)*\n' +
            '2. **Buka Settings VS Code:**\n' +
            '   - Tekan `Ctrl+,` (atau `Cmd+,` di Mac)\n' +
            '   - Cari: `GitFlow Assistant`\n' +
            '3. **Tempel API key** di kolom `Groq Api Key`\n\n' +
            '_Setelah API key dipasang, saya akan langsung terhubung ke otak AI! 🤖_'
        );
    }
}
