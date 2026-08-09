/**
 * ChatViewProvider — Webview Provider untuk panel chat GitFlow Assistant.
 * (Manajer tampilan ruang chat — mengatur bagaimana bubble chat ditampilkan)
 *
 * 📌 Akan diimplementasikan di Phase 2 (feat/webview-ui)
 *
 * Tanggung jawab:
 * - Menampilkan panel chat di sidebar
 * - Mengelola komunikasi antara Webview (frontend) dan Extension (backend)
 * - Menampilkan bubble chat kiri (AI) dan kanan (User)
 */

import * as vscode from 'vscode';

export class ChatViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'gitflowAssistant.chatView';

    constructor(private readonly _extensionUri: vscode.Uri) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ): void {
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
        };

        webviewView.webview.html = this._getPlaceholderHtml();
    }

    private _getPlaceholderHtml(): string {
        return `
            <!DOCTYPE html>
            <html lang="id">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>GitFlow Assistant</title>
                <style>
                    body {
                        font-family: var(--vscode-font-family);
                        color: var(--vscode-foreground);
                        background: var(--vscode-sideBar-background);
                        padding: 16px;
                        text-align: center;
                    }
                    .placeholder {
                        margin-top: 40px;
                        opacity: 0.7;
                    }
                    .emoji { font-size: 48px; margin-bottom: 12px; }
                    .info { font-size: 13px; line-height: 1.5; }
                </style>
            </head>
            <body>
                <div class="placeholder">
                    <div class="emoji">🚧</div>
                    <div class="info">
                        <strong>GitFlow Assistant</strong><br>
                        Chat UI akan dibangun di<br>
                        <em>Phase 2 (feat/webview-ui)</em>
                    </div>
                </div>
            </body>
            </html>
        `;
    }
}
