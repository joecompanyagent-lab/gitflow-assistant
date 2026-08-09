/**
 * extension.test.ts — Unit test untuk entry point ekstensi.
 * (Alat penguji otomatis untuk memastikan toko buka dengan benar)
 *
 * 📌 Test dasar — akan diperkaya seiring fase pembangunan
 */

import * as assert from 'assert';
import * as vscode from 'vscode';

suite('GitFlow Assistant Extension Test Suite', () => {
    vscode.window.showInformationMessage('🧪 Memulai pengujian GitFlow Assistant...');

    test('Ekstensi berhasil dimuat', () => {
        // Memastikan ekstensi terdaftar di VS Code
        const extension = vscode.extensions.getExtension('fearless-hypatia.gitflow-assistant');
        assert.ok(extension, 'Ekstensi harus terdaftar di VS Code');
    });

    test('Command terdaftar dengan benar', async () => {
        // Memastikan semua command terdaftar
        const commands = await vscode.commands.getCommands(true);
        assert.ok(
            commands.includes('gitflowAssistant.openChat'),
            'Command openChat harus terdaftar'
        );
        assert.ok(
            commands.includes('gitflowAssistant.showBranchStatus'),
            'Command showBranchStatus harus terdaftar'
        );
        assert.ok(
            commands.includes('gitflowAssistant.showProgress'),
            'Command showProgress harus terdaftar'
        );
    });
});
