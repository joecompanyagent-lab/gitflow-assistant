/**
 * GroqService — Layanan integrasi dengan Groq API untuk kemampuan AI.
 * (Jembatan komunikasi ke otak AI — mengirim pertanyaan dan menerima jawaban)
 *
 * 📌 Akan diimplementasikan di Phase 3 (feat/groq-integration)
 *
 * Tanggung jawab:
 * - Mengelola koneksi ke Groq API
 * - Mengirim pesan chat ke model AI
 * - Mengelola system prompt GitFlow Assistant
 * - Menangani error dan rate limiting
 */

export class GroqService {
    private apiKey: string | undefined;

    constructor() {
        // API key akan dimuat dari konfigurasi VS Code
        this.apiKey = undefined;
    }

    /**
     * Placeholder — Mengirim pesan ke Groq API
     * (Mengirim surat ke otak AI dan menunggu balasannya)
     */
    public async sendMessage(_message: string): Promise<string> {
        // Akan diimplementasikan di Phase 3
        return '🚧 Groq API belum terhubung. Tunggu Phase 3 (feat/groq-integration).';
    }

    /**
     * Placeholder — Memeriksa apakah API key sudah dikonfigurasi
     * (Mengecek apakah kunci akses ke otak AI sudah dipasang)
     */
    public isConfigured(): boolean {
        return this.apiKey !== undefined && this.apiKey.length > 0;
    }
}
