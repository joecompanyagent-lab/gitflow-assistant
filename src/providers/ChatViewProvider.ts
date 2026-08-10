import * as vscode from 'vscode';
import { GroqService, PROVIDERS } from '../services/GroqService';
import { GitService } from '../services/GitService';
import { ChatMessage, WebviewMessage, BranchStatus, AIProvider } from '../models/types';
import { generateMessageId } from '../utils/formatter';

export class ChatViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'gitflow-chat-view';

  private view?: vscode.WebviewView;
  private groqService: GroqService;
  private gitService: GitService;
  private isReady = false;

  constructor(
    private readonly extensionUri: vscode.Uri,
    groqService: GroqService,
    gitService: GitService
  ) {
    this.groqService = groqService;
    this.gitService = gitService;

    this.gitService.onBranchChange(async (status: BranchStatus) => {
      await this.handleBranchChange(status);
    });
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    this.view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, 'media')]
    };

    webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (message: WebviewMessage) => {
      switch (message.type) {
        case 'ready':
          this.isReady = true;
          await this.onWebviewReady();
          break;
        case 'sendMessage':
          if (message.content) {
            await this.handleUserMessage(message.content);
          }
          break;
        case 'setPersona':
          if (message.persona) {
            this.groqService.setPersona(message.persona);
            this.postMessage({ type: 'personaUpdate', persona: message.persona });
            const personaNames: Record<string, string> = {
              guide: 'GitFlow Guide (Edukasi Alur Branch & Bahasa Awam)',
              reviewer: 'Senior Code Reviewer (Audit Diff & Kualitas Kode)',
              devops: 'DevOps & Release Manager (SemVer, CI/CD, Tag Rilis)'
            };
            const notifMsg: ChatMessage = {
              id: generateMessageId(),
              role: 'outbound',
              content: `[OUTBOUND] Peran AI diganti ke: **${personaNames[message.persona] || message.persona}**.`,
              timestamp: Date.now(),
              tag: 'OUTBOUND'
            };
            this.postMessage({ type: 'receiveMessage', message: notifMsg });
          }
          break;
        case 'setLanguage':
          if (message.lang === 'id' || message.lang === 'en') {
            this.groqService.setLanguage(message.lang);
            this.postMessage({ type: 'languageUpdate', lang: message.lang });
          }
          break;
        case 'saveConfig':
          if (message.provider && message.apiKey) {
            const provider = message.provider as AIProvider;
            const model = message.model || '';
            const config = vscode.workspace.getConfiguration('gitflowAssistant');

            const keyMap: Record<string, string> = {
              groq: 'groqApiKey',
              openai: 'openaiApiKey',
              anthropic: 'anthropicApiKey',
              gemini: 'geminiApiKey',
              ollama: 'ollamaApiKey'
            };
            if (keyMap[provider]) {
              await config.update(keyMap[provider], message.apiKey, vscode.ConfigurationTarget.Global);
            }
            await config.update('provider', provider, vscode.ConfigurationTarget.Global);
            if (model) {
              await config.update('model', model, vscode.ConfigurationTarget.Global);
            }

            this.groqService.setProvider(provider);
            this.groqService.setApiKey(message.apiKey);
            if (model) {
              this.groqService.setModel(model);
            }

            this.postMessage({ type: 'configStatus', hasApiKey: true, provider, model: this.groqService.getModel() });

            try {
              const branchStatus = await this.gitService.getBranchStatus();
              const branchContext = branchStatus ? this.gitService.formatBranchContext(branchStatus) : 'Tidak ada workspace Git terdeteksi.';
              const greeting = await this.groqService.generateGreeting(branchContext);
              const greetingMsg: ChatMessage = {
                id: generateMessageId(),
                role: 'outbound',
                content: greeting,
                timestamp: Date.now(),
                tag: 'OUTBOUND'
              };
              this.postMessage({ type: 'receiveMessage', message: greetingMsg });
            } catch (error) {
              const errorMsg = error instanceof Error ? error.message : 'Unknown error';
              this.postMessage({ type: 'error', error: errorMsg });
            }
          }
          break;
      }
    });
  }

  private async onWebviewReady(): Promise<void> {
    const config = vscode.workspace.getConfiguration('gitflowAssistant');
    const provider = config.get<AIProvider>('provider', 'groq');
    const keyMap: Record<string, string> = {
      groq: 'groqApiKey',
      openai: 'openaiApiKey',
      anthropic: 'anthropicApiKey',
      gemini: 'geminiApiKey'
    };
    const apiKey = config.get<string>(keyMap[provider], '');
    this.postMessage({ type: 'configStatus', hasApiKey: !!apiKey, provider, model: this.groqService.getModel() });
    this.postMessage({ type: 'personaUpdate', persona: this.groqService.getPersona() });

    const branchStatus = await this.gitService.getBranchStatus();
    if (branchStatus) {
      this.postMessage({ type: 'branchUpdate', branchStatus });
    }

    if (apiKey) {
      this.groqService.setApiKey(apiKey);
      this.groqService.setProvider(provider);
      const model = config.get<string>('model', '');
      if (model) {
        this.groqService.setModel(model);
      }

      try {
        const branchContext = branchStatus ? this.gitService.formatBranchContext(branchStatus) : 'Tidak ada workspace Git terdeteksi.';
        const greeting = await this.groqService.generateGreeting(branchContext);
        const greetingMsg: ChatMessage = {
          id: generateMessageId(),
          role: 'outbound',
          content: greeting,
          timestamp: Date.now(),
          tag: 'OUTBOUND'
        };
        this.postMessage({ type: 'receiveMessage', message: greetingMsg });
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        this.postMessage({ type: 'error', error: errorMsg });
      }
    }
  }

  private async handleUserMessage(content: string): Promise<void> {
    const trimmed = content.trim();

    // Check for slash commands
    if (trimmed.startsWith('/commit')) {
      await this.handleGenerateCommitMessage();
      return;
    }
    if (trimmed.startsWith('/pr')) {
      await this.handleGeneratePRSummary();
      return;
    }
    if (trimmed.startsWith('/report') || trimmed.startsWith('/ringkasan')) {
      await this.handleGenerateWeeklyReport();
      return;
    }
    if (trimmed.startsWith('/tasks')) {
      await this.handleTasksCommand();
      return;
    }
    if (trimmed.startsWith('/info')) {
      await this.handleSmartInfoCommand();
      return;
    }
    if (trimmed.startsWith('/compare')) {
      await this.handleCompareCommand();
      return;
    }
    if (trimmed.startsWith('/changelog')) {
      await this.handleChangelogCommand();
      return;
    }
    if (trimmed.startsWith('/resolve')) {
      await this.handleResolveConflictCommand();
      return;
    }
    if (trimmed.startsWith('/help') || trimmed.startsWith('/guide')) {
      await this.handleOnboardingHelpCommand();
      return;
    }
    if (trimmed.startsWith('/history')) {
      const q = trimmed.substring(8).trim();
      await this.handleHistoryCommand(q);
      return;
    }
    if (trimmed.startsWith('/cmd')) {
      const q = trimmed.substring(4).trim();
      await this.handleCommandBuilderCommand(q);
      return;
    }
    if (trimmed.startsWith('/score')) {
      await this.handleScorecardCommand();
      return;
    }
    if (trimmed.startsWith('/notebook') || trimmed.startsWith('/clean-notebook')) {
      await this.handleCleanNotebookCommand();
      return;
    }
    if (trimmed.startsWith('/dataset') || trimmed.startsWith('/large-files')) {
      await this.handleCheckLargeFilesCommand();
      return;
    }
    if (trimmed.startsWith('/mlog') || trimmed.startsWith('/experiment')) {
      const q = trimmed.replace(/^\/(mlog|experiment)/, '').trim();
      await this.handleMLExperimentCommand(q);
      return;
    }
    if (trimmed.startsWith('/worktree') || trimmed.startsWith('/playground')) {
      const q = trimmed.replace(/^\/(worktree|playground)/, '').trim();
      await this.handleWorktreeCommand(q);
      return;
    }
    if (trimmed.startsWith('/scan') || trimmed.startsWith('/codebase')) {
      const q = trimmed.replace(/^\/(scan|codebase)/, '').trim();
      await this.handleScanCodebaseCommand(q);
      return;
    }

    // Interactive Branch Safety Guard check
    const status = await this.gitService.getBranchStatus();
    if (status && (status.current === 'main' || status.current === 'staging') && this.gitService.isWorkingTreeDirty()) {
      const warningMsg: ChatMessage = {
        id: generateMessageId(),
        role: 'outbound',
        content: `[WARNING] **PERINGATAN KESELAMATAN BRANCH**: Anda sedang berada di branch \`${status.current}\` (${status.current === 'main' ? 'Etalase Rilis Toko' : 'Ruang Pengujian QA'}) dan ada berkas yang diubah.\n\nSangat disarankan untuk membuat branch \`feat/*\` baru agar perubahan Anda aman:\n\`git checkout -b feat/perubahan-baru\``,
        timestamp: Date.now(),
        tag: 'WARNING'
      };
      this.postMessage({ type: 'receiveMessage', message: warningMsg });
    }

    const userMsg: ChatMessage = {
      id: generateMessageId(),
      role: 'user',
      content,
      timestamp: Date.now()
    };
    this.postMessage({ type: 'receiveMessage', message: userMsg });
    this.postMessage({ type: 'loading', isLoading: true });

    try {
      const branchStatus = await this.gitService.getBranchStatus();
      const branchContext = branchStatus ? this.gitService.formatBranchContext(branchStatus) : undefined;
      const editorContext = this.gitService.getActiveEditorContext();

      const response = await this.groqService.chat(content, branchContext, editorContext);
      const aiMsg: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: response,
        timestamp: Date.now()
      };
      this.postMessage({ type: 'receiveMessage', message: aiMsg });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Terjadi kesalahan.';
      this.postMessage({ type: 'error', error: errorMsg });
    } finally {
      this.postMessage({ type: 'loading', isLoading: false });
    }
  }

  public async handleGenerateCommitMessage(): Promise<void> {
    this.postMessage({ type: 'loading', isLoading: true });

    try {
      const { diff, isStaged } = await this.gitService.getStagedDiff();
      if (!diff) {
        throw new Error('Tidak ada perubahan berkas yang terdeteksi di workspace. Silakan edit atau stage berkas terlebih dahulu.');
      }

      const result = await this.groqService.generateCommitMessageFromDiff(diff, isStaged);

      // Auto-fill VS Code Git SCM commit input box!
      this.gitService.setScmInputBoxValue(result.commitHeader);

      const msgContent = `[COMMAND] **Commit Message Berhasil Dihasilkan!**\n\n` +
        `**Header Commit (Sudah diisi ke input box Git):**\n\`${result.commitHeader}\`\n\n` +
        `**Penjelasan Bahasa Awam:**\n${result.explanation}\n\n` +
        `*Status: Berkas ${isStaged ? 'staged' : 'working tree'}. Silakan klik tombol Commit di panel Git untuk menyimpan.*`;

      const aiMsg: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: msgContent,
        timestamp: Date.now(),
        tag: 'PROGRESS'
      };
      this.postMessage({ type: 'receiveMessage', message: aiMsg });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Terjadi kesalahan saat membuat commit message.';
      this.postMessage({ type: 'error', error: errorMsg });
    } finally {
      this.postMessage({ type: 'loading', isLoading: false });
    }
  }

  public async handleGeneratePRSummary(): Promise<void> {
    this.postMessage({ type: 'loading', isLoading: true });

    try {
      const status = await this.gitService.getBranchStatus();
      const current = status?.current || 'feat/feature-x';
      
      // Determine logical target branch according to GitFlow
      let targetBranch = 'dev';
      if (current === 'dev') targetBranch = 'staging';
      else if (current === 'staging') targetBranch = 'main';
      else if (current.startsWith('hotfix/')) targetBranch = 'main';

      const gitLog = this.gitService.getBranchLog(targetBranch);
      const prSummary = await this.groqService.generatePRSummary(current, targetBranch, gitLog);

      const aiMsg: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: prSummary,
        timestamp: Date.now(),
        tag: 'STRUCTURE'
      };
      this.postMessage({ type: 'receiveMessage', message: aiMsg });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Terjadi kesalahan saat membuat ringkasan PR.';
      this.postMessage({ type: 'error', error: errorMsg });
    } finally {
      this.postMessage({ type: 'loading', isLoading: false });
    }
  }

  public async handleGenerateWeeklyReport(): Promise<void> {
    this.postMessage({ type: 'loading', isLoading: true });

    try {
      const status = await this.gitService.getBranchStatus();
      const branchContext = status ? this.gitService.formatBranchContext(status) : 'Tidak ada workspace Git.';
      const gitLog = this.gitService.getGitLog(7);

      const report = await this.groqService.generateWeeklyReport(gitLog, branchContext);

      const aiMsg: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: report,
        timestamp: Date.now(),
        tag: 'PROGRESS'
      };
      this.postMessage({ type: 'receiveMessage', message: aiMsg });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Terjadi kesalahan saat membuat laporan mingguan.';
      this.postMessage({ type: 'error', error: errorMsg });
    } finally {
      this.postMessage({ type: 'loading', isLoading: false });
    }
  }

  public async handleTasksCommand(): Promise<void> {
    const tasksContent = `[PROGRESS] **Checklist Pembangunan Bertahap (Phased Development)**\n\n` +
      `- [x] **Phase 1 (feat/scaffold)**: Inisialisasi struktur proyek & manifes extension\n` +
      `- [x] **Phase 2 (feat/webview-ui)**: Antarmuka Chat UI Dark Mode & VS Code Design System\n` +
      `- [x] **Phase 3 (feat/groq-integration)**: Dukungan Multi-Provider AI (Groq, OpenAI, Anthropic, Gemini)\n` +
      `- [x] **Phase 4 (feat/git-detector)**: SCM Title Bar Actions, Conventional Commit, PR & Weekly Report\n` +
      `- [>] **Phase 5 (feat/context-sync)**: Active Editor Context Sync, Persistent State, Persona Switcher\n` +
      `- [ ] **Phase 6 (dev -> staging)**: Pengujian Integrasi Akhir oleh QA\n` +
      `- [ ] **Phase 7 (staging -> main)**: Rilis Produksi Versi 5.0.0\n\n` +
      `*Gunakan alur disiplin: feat/* -> dev -> staging -> main.*`;

    const aiMsg: ChatMessage = {
      id: generateMessageId(),
      role: 'assistant',
      content: tasksContent,
      timestamp: Date.now(),
      tag: 'PROGRESS'
    };
    this.postMessage({ type: 'receiveMessage', message: aiMsg });
  }

  public async handleSmartInfoCommand(): Promise<void> {
    this.postMessage({ type: 'loading', isLoading: true });

    try {
      const info = this.gitService.getSmartBlameForActiveLine();
      if (!info) {
        throw new Error('Silakan buka file di editor dan tempatkan kursor pada baris kode yang ingin diperiksa terlebih dahulu.');
      }

      const status = await this.gitService.getBranchStatus();
      const branchContext = status ? this.gitService.formatBranchContext(status) : 'Tidak ada workspace Git.';

      const explanation = await this.groqService.generateSmartInfoExplanation(info, branchContext);

      const aiMsg: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: explanation,
        timestamp: Date.now(),
        tag: 'HEALTH_CHECK'
      };
      this.postMessage({ type: 'receiveMessage', message: aiMsg });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Terjadi kesalahan saat memeriksa informasi baris kode.';
      this.postMessage({ type: 'error', error: errorMsg });
    } finally {
      this.postMessage({ type: 'loading', isLoading: false });
    }
  }

  public async handleCompareCommand(): Promise<void> {
    this.postMessage({ type: 'loading', isLoading: true });

    try {
      const status = await this.gitService.getBranchStatus();
      const current = status?.current || 'feat/feature-x';

      let targetBranch = 'dev';
      if (current === 'dev') targetBranch = 'staging';
      else if (current === 'staging') targetBranch = 'main';

      const diffText = this.gitService.getBranchDiffWithTarget(targetBranch);
      const gitLog = this.gitService.getBranchLog(targetBranch);

      const audit = await this.groqService.generateBranchCompareAudit(current, targetBranch, diffText, gitLog);

      const aiMsg: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: audit,
        timestamp: Date.now(),
        tag: 'HEALTH_CHECK'
      };
      this.postMessage({ type: 'receiveMessage', message: aiMsg });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Terjadi kesalahan saat membandingkan branch.';
      this.postMessage({ type: 'error', error: errorMsg });
    } finally {
      this.postMessage({ type: 'loading', isLoading: false });
    }
  }

  public async handleChangelogCommand(): Promise<void> {
    this.postMessage({ type: 'loading', isLoading: true });

    try {
      const status = await this.gitService.getBranchStatus();
      const current = status?.current || 'main';
      const gitLog = this.gitService.getCommitsSinceLastTag();

      const changelog = await this.groqService.generateChangelog(gitLog, current);

      const aiMsg: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: changelog,
        timestamp: Date.now(),
        tag: 'STRUCTURE'
      };
      this.postMessage({ type: 'receiveMessage', message: aiMsg });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Terjadi kesalahan saat menyusun changelog.';
      this.postMessage({ type: 'error', error: errorMsg });
    } finally {
      this.postMessage({ type: 'loading', isLoading: false });
    }
  }

  public async handleResolveConflictCommand(): Promise<void> {
    this.postMessage({ type: 'loading', isLoading: true });

    try {
      const conflicts = this.gitService.getActiveEditorConflictBlocks();
      if (conflicts.length === 0) {
        throw new Error('Tidak ada potongan kode bentrok (<<<<<<<) yang terdeteksi di editor aktif saat ini.');
      }

      const resolution = await this.groqService.generateConflictResolution(conflicts);

      const aiMsg: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: resolution,
        timestamp: Date.now(),
        tag: 'WARNING'
      };
      this.postMessage({ type: 'receiveMessage', message: aiMsg });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Terjadi kesalahan saat menganalisis konflik.';
      this.postMessage({ type: 'error', error: errorMsg });
    } finally {
      this.postMessage({ type: 'loading', isLoading: false });
    }
  }

  public async handleOnboardingHelpCommand(): Promise<void> {
    const helpContent = `[SUGGESTION] **Selamat Datang di Panduan Pemula GitFlow Assistant!**\n\n` +
      `GitFlow Assistant dirancang agar Anda bisa mengelola kode tanpa perlu menghafal perintah terminal Git yang rumit.\n\n` +
      `**1. Analogi 5 Branch Meja Kerja (GitFlow):**\n` +
      `- **feat/\*** *(Meja Sketsa Fitur)*: Tempat membuat fitur baru atau mengedit berkas secara bebas.\n` +
      `- **dev** *(Dapur Integrasi)*: Tempat mengumpulkan semua sketsa fitur dari tim dev.\n` +
      `- **staging** *(Ruang Pengujian QA)*: Tempat menguji aplikasi secara utuh sebelum dirilis.\n` +
      `- **main** *(Etalase Rilis Toko)*: Tempat aplikasi versi siap pakai publik.\n` +
      `- **hotfix/\*** *(Pertolongan Darurat)*: Tempat menambal bug kritis yang terjadi di produksi.\n\n` +
      `**2. Tombol Pintas Instan (Quick Chips):**\n` +
      `Gunakan tombol-tombol di atas kolom input chat untuk akses 1-klik:\n` +
      `- \`Tulis Commit\`: AI membuatkan pesan commit & otomatis mengisi input box Git.\n` +
      `- \`Ringkas PR\`: Rangkuman Pull Request siap copy-paste.\n` +
      `- \`Cek Kesehatan\`: Audit perbandingan branch.\n` +
      `- \`Info Kode\`: Cek siapa & mengapa baris kode ditulis.\n` +
      `- \`Atasi Konflik\`: Bantuan AI saat ada kode bentrok.\n\n` +
      `*Ada pertanyaan tentang istilah Git? Klik tombol Kamus di kanan atas!*`;

    const aiMsg: ChatMessage = {
      id: generateMessageId(),
      role: 'assistant',
      content: helpContent,
      timestamp: Date.now(),
      tag: 'SUGGESTION'
    };
    this.postMessage({ type: 'receiveMessage', message: aiMsg });
  }

  public async handleHistoryCommand(query: string = ''): Promise<void> {
    this.postMessage({ type: 'loading', isLoading: true });

    try {
      const gitLog = this.gitService.searchGitHistory(query);
      const timeline = await this.groqService.generateHistoryTimeline(gitLog, query);

      const aiMsg: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: timeline,
        timestamp: Date.now(),
        tag: 'PROGRESS'
      };
      this.postMessage({ type: 'receiveMessage', message: aiMsg });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Terjadi kesalahan saat mencari riwayat histori.';
      this.postMessage({ type: 'error', error: errorMsg });
    } finally {
      this.postMessage({ type: 'loading', isLoading: false });
    }
  }

  public async handleCommandBuilderCommand(query: string = ''): Promise<void> {
    if (!query) {
      const promptMsg: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: `[SUGGESTION] **AI Natural Language Git Command Builder**\n\nSilakan tuliskan apa yang ingin Anda lakukan setelah \`/cmd\`. Contoh:\n- \`/cmd batalkan commit terakhir tanpa hapus kode\`\n- \`/cmd gabungkan branch feat/login ke dev\`\n- \`/cmd hapus branch lokal yang sudah tua\``,
        timestamp: Date.now(),
        tag: 'SUGGESTION'
      };
      this.postMessage({ type: 'receiveMessage', message: promptMsg });
      return;
    }

    this.postMessage({ type: 'loading', isLoading: true });

    try {
      const status = await this.gitService.getBranchStatus();
      const branchContext = status ? this.gitService.formatBranchContext(status) : undefined;

      const result = await this.groqService.generateCommandFromNaturalLanguage(query, branchContext);

      const aiMsg: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: result,
        timestamp: Date.now(),
        tag: 'STRUCTURE'
      };
      this.postMessage({ type: 'receiveMessage', message: aiMsg });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Terjadi kesalahan saat merangkai perintah Git.';
      this.postMessage({ type: 'error', error: errorMsg });
    } finally {
      this.postMessage({ type: 'loading', isLoading: false });
    }
  }

  public async handleScorecardCommand(): Promise<void> {
    this.postMessage({ type: 'loading', isLoading: true });

    try {
      const status = await this.gitService.getBranchStatus();
      const current = status?.current || 'feat/feature-x';
      const gitLog = this.gitService.getGitLog(10);

      const scorecard = await this.groqService.generateQualityScorecard(gitLog, current);

      const aiMsg: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: scorecard,
        timestamp: Date.now(),
        tag: 'HEALTH_CHECK'
      };
      this.postMessage({ type: 'receiveMessage', message: aiMsg });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Terjadi kesalahan saat mengevaluasi skor kualitas.';
      this.postMessage({ type: 'error', error: errorMsg });
    } finally {
      this.postMessage({ type: 'loading', isLoading: false });
    }
  }

  public async handleCleanNotebookCommand(): Promise<void> {
    const result = this.gitService.stripJupyterNotebookMetadata();
    const tag = result.success ? 'PROGRESS' : 'WARNING';
    const msg: ChatMessage = {
      id: generateMessageId(),
      role: 'assistant',
      content: `[${tag}] **Jupytext Clean Notebook Generator**\n\n${result.message}${result.filePath ? `\n\nBerkas: \`${result.filePath}\`` : ''}`,
      timestamp: Date.now(),
      tag: result.success ? 'PROGRESS' : 'WARNING'
    };
    this.postMessage({ type: 'receiveMessage', message: msg });
  }

  public async handleCheckLargeFilesCommand(): Promise<void> {
    this.postMessage({ type: 'loading', isLoading: true });

    try {
      const largeFiles = this.gitService.checkLargeFiles(50);

      if (largeFiles.length === 0) {
        const cleanMsg: ChatMessage = {
          id: generateMessageId(),
          role: 'assistant',
          content: `[HEALTH_CHECK] **Pelindung Berkas Besar & Dataset ML**\n\nTidak terdeteksi berkas berukuran besar (>= 50 MB) di meja kerja Git Anda. Repositori Anda aman dan siap di-commit!`,
          timestamp: Date.now(),
          tag: 'HEALTH_CHECK'
        };
        this.postMessage({ type: 'receiveMessage', message: cleanMsg });
        return;
      }

      const advice = await this.groqService.generateLargeFileSafetyAdvice(largeFiles);

      const aiMsg: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: advice,
        timestamp: Date.now(),
        tag: 'WARNING'
      };
      this.postMessage({ type: 'receiveMessage', message: aiMsg });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Terjadi kesalahan saat memeriksa berkas besar.';
      this.postMessage({ type: 'error', error: errorMsg });
    } finally {
      this.postMessage({ type: 'loading', isLoading: false });
    }
  }

  public async handleMLExperimentCommand(query: string): Promise<void> {
    const details = query || 'Pembaruan Model / Hyperparameter Experiment';
    const result = this.gitService.recordMLExperiment(details);

    const msg: ChatMessage = {
      id: generateMessageId(),
      role: 'assistant',
      content: `[PROGRESS] **MLOps Experiment Tracker**\n\n${result.message}\n\nCatatan eksperimen tersimpan secara otomatis terikat dengan Commit Hash \`${result.commitHash}\` di berkas \`ML_EXPERIMENTS.md\`.`,
      timestamp: Date.now(),
      tag: 'PROGRESS'
    };
    this.postMessage({ type: 'receiveMessage', message: msg });
  }

  public async handleWorktreeCommand(query: string): Promise<void> {
    if (!query) {
      const list = this.gitService.listGitWorktrees();
      const msg: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: `[STRUCTURE] **Isolated Worktree Playground (Meja Uji Coba)**\n\nDaftar Worktree aktif saat ini:\n\`\`\`text\n${list}\n\`\`\`\n\n**Cara Penggunaan**:\n- Ketik \`/worktree <nama-uji-coba>\` untuk membuat meja uji coba terisolasi baru!\n- Contoh: \`/worktree uji-model-resnet\``,
        timestamp: Date.now(),
        tag: 'STRUCTURE'
      };
      this.postMessage({ type: 'receiveMessage', message: msg });
      return;
    }

    const result = this.gitService.createGitWorktree(query);
    const tag = result.success ? 'PROGRESS' : 'WARNING';

    const msg: ChatMessage = {
      id: generateMessageId(),
      role: 'assistant',
      content: `[${tag}] **Isolated Worktree Playground**\n\n${result.message}`,
      timestamp: Date.now(),
      tag: result.success ? 'PROGRESS' : 'WARNING'
    };
    this.postMessage({ type: 'receiveMessage', message: msg });
  }

  public async handleScanCodebaseCommand(query: string): Promise<void> {
    this.postMessage({ type: 'loading', isLoading: true });

    try {
      const codebaseMap = this.gitService.getCodebaseStructure(100);
      const analysis = await this.groqService.generateCodebaseAnalysis(codebaseMap, query);

      const aiMsg: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: analysis,
        timestamp: Date.now(),
        tag: 'STRUCTURE'
      };
      this.postMessage({ type: 'receiveMessage', message: aiMsg });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Terjadi kesalahan saat memindai kode proyek.';
      this.postMessage({ type: 'error', error: errorMsg });
    } finally {
      this.postMessage({ type: 'loading', isLoading: false });
    }
  }

  private async handleBranchChange(status: BranchStatus): Promise<void> {
    this.postMessage({ type: 'branchUpdate', branchStatus: status });
    const config = vscode.workspace.getConfiguration('gitflowAssistant');
    const provider = config.get<AIProvider>('provider', 'groq');
    const keyMap: Record<string, string> = { groq: 'groqApiKey', openai: 'openaiApiKey', anthropic: 'anthropicApiKey', gemini: 'geminiApiKey' };
    const apiKey = config.get<string>(keyMap[provider], '');

    if (apiKey) {
      try {
        let event = `Pengguna berpindah ke branch: ${status.current} (tipe: ${status.currentType})`;
        if (this.gitService.isWorkingTreeDirty()) {
          event += ` [PERINGATAN: Ada berkas belum di-commit! Jika git checkout gagal, gunakan git stash untuk menyimpan sementara]`;
        }
        const notification = await this.groqService.generateBranchEventNotification(event);
        const notifMsg: ChatMessage = {
          id: generateMessageId(),
          role: 'outbound',
          content: notification,
          timestamp: Date.now(),
          tag: 'BRANCH_MOVEMENT'
        };
        this.postMessage({ type: 'receiveMessage', message: notifMsg });
      } catch {
        // Silently ignore
      }
    }
  }

  private postMessage(message: any): void {
    if (this.view && this.isReady) {
      this.view.webview.postMessage(message);
    }
  }

  private getHtmlForWebview(webview: vscode.Webview): string {
    const cssUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'main.css'));
    const jsUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'main.js'));
    const nonce = getNonce();

    // Build provider options HTML
    const providerOptions = Object.values(PROVIDERS).map(p =>
      `<option value="${p.id}">${p.name}</option>`
    ).join('\n            ');

    // Build default model options (groq default)
    const defaultProvider = PROVIDERS.groq;
    const modelOptions = defaultProvider.models.map(m =>
      `<option value="${m}"${m === defaultProvider.defaultModel ? ' selected' : ''}>${m}</option>`
    ).join('\n            ');

    return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; font-src ${webview.cspSource};">
  <link href="${cssUri}" rel="stylesheet">
  <title>GitFlow Assistant</title>
</head>
<body>
  <div id="app">
    <!-- Header with branch badges and persona switcher -->
    <div id="header">
      <div class="header-top">
        <div class="header-title">
          <span class="header-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="18" cy="18" r="3"/>
              <circle cx="6" cy="6" r="3"/>
              <path d="M6 21V9a9 9 0 0 0 9 9"/>
            </svg>
          </span>
          <h1>GitFlow Assistant <span class="version-badge">v8.3.1</span></h1>
        </div>
        <div class="header-actions">
          <select id="lang-select" class="lang-select" title="Bahasa / Language">
            <option value="id">ID</option>
            <option value="en">EN</option>
          </select>
          <button id="dict-toggle-btn" class="dict-toggle-btn" title="Buka Kamus Git Awam">Kamus</button>
          <select id="persona-select" class="persona-select" title="Ganti Peran AI">
            <option value="guide">Peran: GitFlow Guide</option>
            <option value="reviewer">Peran: Code Reviewer</option>
            <option value="devops">Peran: DevOps Manager</option>
          </select>
        </div>
      </div>
      <div id="branch-badges" class="branch-badges">
        <span class="badge badge-main" data-type="main"><span class="dot"></span> main</span>
        <span class="badge badge-staging" data-type="staging"><span class="dot"></span> staging</span>
        <span class="badge badge-dev" data-type="dev"><span class="dot"></span> dev</span>
        <span class="badge badge-feat" data-type="feat"><span class="dot"></span> feat</span>
        <span class="badge badge-hotfix" data-type="hotfix"><span class="dot"></span> hotfix</span>
      </div>
      <!-- Visual Branch Pipeline Map -->
      <div id="visual-pipeline" class="visual-pipeline">
        <span class="pipeline-step" data-step="feat">feat</span>
        <span class="pipeline-arrow">&rarr;</span>
        <span class="pipeline-step" data-step="dev">dev</span>
        <span class="pipeline-arrow">&rarr;</span>
        <span class="pipeline-step" data-step="staging">staging</span>
        <span class="pipeline-arrow">&rarr;</span>
        <span class="pipeline-step" data-step="main">main</span>
      </div>
    </div>

    <!-- Kamus Awam Modal Drawer -->
    <div id="dict-modal" class="dict-modal hidden">
      <div class="dict-header">
        <h3>Kamus Git Bahasa Awam</h3>
        <button id="dict-close-btn" class="dict-close-btn" title="Tutup">&times;</button>
      </div>
      <input type="text" id="dict-search" placeholder="Cari istilah (misal: commit, push, branch)..." />
      <div id="dict-list" class="dict-list"></div>
    </div>

    <!-- API Config Setup (shown when no key) -->
    <div id="api-config-setup" class="api-config-setup hidden">
      <div class="setup-card">
        <div class="setup-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
          </svg>
        </div>
        <p class="setup-title">Konfigurasi AI Provider</p>

        <div class="setup-field">
          <label for="provider-select">Provider</label>
          <select id="provider-select">
            ${providerOptions}
          </select>
        </div>

        <div class="setup-field">
          <label for="api-key-input">API Key</label>
          <input type="password" id="api-key-input" placeholder="${defaultProvider.keyPlaceholder}" />
        </div>

        <div class="setup-field">
          <label for="model-select">Model</label>
          <select id="model-select">
            ${modelOptions}
            <option value="custom">Custom (Input Manual...)</option>
          </select>
        </div>

        <div id="custom-model-field" class="setup-field hidden">
          <label for="custom-model-input">Nama Model Custom</label>
          <input type="text" id="custom-model-input" placeholder="contoh: llama-3.1-8b-instant" />
        </div>

        <button id="config-submit" class="setup-submit">Simpan</button>
        <p class="setup-hint" id="console-hint">Dapatkan di <a id="console-link" href="https://${defaultProvider.consoleUrl}">${defaultProvider.consoleUrl}</a></p>
      </div>
    </div>

    <!-- Chat container -->
    <div id="chat-container" class="chat-container">
      <div id="chat-messages" class="chat-messages"></div>
      <div id="loading-indicator" class="loading-indicator hidden">
        <div class="typing-dots"><span></span><span></span><span></span></div>
        <span class="loading-text">GitFlow Assistant sedang mengetik...</span>
      </div>
    </div>

    <!-- Quick Action Chips Bar -->
    <div id="quick-chips" class="quick-chips">
      <button class="chip-btn" data-cmd="/commit" title="Buat commit dari git diff">Tulis Commit</button>
      <button class="chip-btn" data-cmd="/cmd" title="Rangkai perintah Git otomatis">Rangkai Cmd</button>
      <button class="chip-btn" data-cmd="/score" title="Nilai kualitas commit">Skor Kualitas</button>
      <button class="chip-btn" data-cmd="/scan" title="Pindai & pahami struktur seluruh berkas proyek">Pindai Proyek</button>
      <button class="chip-btn" data-cmd="/notebook" title="Bersihkan metadata output Jupyter Notebook (.ipynb)">Bersihkan Notebook</button>
      <button class="chip-btn" data-cmd="/dataset" title="Periksa berkas ukuran besar (>=50MB)">Cek File Besar</button>
      <button class="chip-btn" data-cmd="/mlog" title="Catat eksperimen ML & hyperparameter">Catat Eksperimen</button>
      <button class="chip-btn" data-cmd="/worktree" title="Buat meja uji coba terisolasi">Meja Uji Coba</button>
      <button class="chip-btn" data-cmd="/pr" title="Buat ringkasan PR">Ringkas PR</button>
      <button class="chip-btn" data-cmd="/compare" title="Bandingkan & audit branch">Cek Kesehatan</button>
      <button class="chip-btn" data-cmd="/history" title="Cari riwayat commit">Cari Riwayat</button>
      <button class="chip-btn" data-cmd="/info" title="Info baris kode aktif">Info Kode</button>
      <button class="chip-btn" data-cmd="/tasks" title="Lihat checklist tugas">Daftar Tugas</button>
      <button class="chip-btn" data-cmd="/report" title="Laporan aktivitas mingguan">Laporan Mingguan</button>
      <button class="chip-btn" data-cmd="/resolve" title="Bantuan resolusi konflik">Atasi Konflik</button>
      <button class="chip-btn" data-cmd="/help" title="Panduan pemula">Panduan Pemula</button>
    </div>

    <!-- Input area -->
    <div id="input-area" class="input-area">
      <div class="input-wrapper">
        <textarea id="message-input" placeholder="Tanya tentang alur Git, branch, atau minta bantuan prompt..." rows="1"></textarea>
        <button id="send-button" title="Kirim">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>
    </div>
  </div>

  <script nonce="${nonce}" src="${jsUri}"></script>
</body>
</html>`;
  }
}

function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
