import * as vscode from 'vscode';
import { ChatViewProvider } from './providers/ChatViewProvider';
import { GroqService } from './services/GroqService';
import { GitService } from './services/GitService';
import { AIProvider } from './models/types';

export function activate(context: vscode.ExtensionContext): void {
  const config = vscode.workspace.getConfiguration('gitflowAssistant');
  const provider = config.get<AIProvider>('provider', 'groq');
  const apiKey = getApiKeyForProvider(config, provider);
  const model = config.get<string>('model', '');

  const groqService = new GroqService(apiKey, model || undefined, provider);
  const gitService = new GitService();

  const chatProvider = new ChatViewProvider(
    context.extensionUri,
    groqService,
    gitService
  );

  const viewRegistration = vscode.window.registerWebviewViewProvider(
    ChatViewProvider.viewType,
    chatProvider
  );

  // Listen for configuration changes
  const configListener = vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration('gitflowAssistant')) {
      const cfg = vscode.workspace.getConfiguration('gitflowAssistant');
      const newProvider = cfg.get<AIProvider>('provider', 'groq');
      const newKey = getApiKeyForProvider(cfg, newProvider);
      const newModel = cfg.get<string>('model', '');

      groqService.setProvider(newProvider);
      groqService.setApiKey(newKey);
      if (newModel) {
        groqService.setModel(newModel);
      }
    }
  });

  // Register SCM and Palette commands
  const commitCmd = vscode.commands.registerCommand('gitflowAssistant.generateCommitMessage', () => {
    chatProvider.handleGenerateCommitMessage();
  });

  const prCmd = vscode.commands.registerCommand('gitflowAssistant.generatePRSummary', () => {
    chatProvider.handleGeneratePRSummary();
  });

  const reportCmd = vscode.commands.registerCommand('gitflowAssistant.generateWeeklyReport', () => {
    chatProvider.handleGenerateWeeklyReport();
  });

  const tasksCmd = vscode.commands.registerCommand('gitflowAssistant.showPhasedTasks', () => {
    chatProvider.handleTasksCommand();
  });

  const smartInfoCmd = vscode.commands.registerCommand('gitflowAssistant.smartInfo', () => {
    chatProvider.handleSmartInfoCommand();
  });

  const compareCmd = vscode.commands.registerCommand('gitflowAssistant.compareBranch', () => {
    chatProvider.handleCompareCommand();
  });

  const changelogCmd = vscode.commands.registerCommand('gitflowAssistant.generateChangelog', () => {
    chatProvider.handleChangelogCommand();
  });

  const resolveCmd = vscode.commands.registerCommand('gitflowAssistant.resolveConflict', () => {
    chatProvider.handleResolveConflictCommand();
  });

  const helpCmd = vscode.commands.registerCommand('gitflowAssistant.onboardingHelp', () => {
    chatProvider.handleOnboardingHelpCommand();
  });

  const historyCmd = vscode.commands.registerCommand('gitflowAssistant.showHistory', () => {
    chatProvider.handleHistoryCommand('');
  });

  const commandBuilderCmd = vscode.commands.registerCommand('gitflowAssistant.commandBuilder', () => {
    chatProvider.handleCommandBuilderCommand('');
  });

  const scorecardCmd = vscode.commands.registerCommand('gitflowAssistant.qualityScorecard', () => {
    chatProvider.handleScorecardCommand();
  });

  const cleanNotebookCmd = vscode.commands.registerCommand('gitflowAssistant.cleanNotebook', () => {
    chatProvider.handleCleanNotebookCommand();
  });

  const checkLargeFilesCmd = vscode.commands.registerCommand('gitflowAssistant.checkLargeFiles', () => {
    chatProvider.handleCheckLargeFilesCommand();
  });

  const mlLogCmd = vscode.commands.registerCommand('gitflowAssistant.mlLog', () => {
    chatProvider.handleMLExperimentCommand('');
  });

  const worktreePlaygroundCmd = vscode.commands.registerCommand('gitflowAssistant.worktreePlayground', () => {
    chatProvider.handleWorktreeCommand('');
  });

  context.subscriptions.push(
    viewRegistration,
    configListener,
    commitCmd,
    prCmd,
    reportCmd,
    tasksCmd,
    smartInfoCmd,
    compareCmd,
    changelogCmd,
    resolveCmd,
    helpCmd,
    historyCmd,
    commandBuilderCmd,
    scorecardCmd,
    cleanNotebookCmd,
    checkLargeFilesCmd,
    mlLogCmd,
    worktreePlaygroundCmd,
    { dispose: () => gitService.dispose() }
  );
}

function getApiKeyForProvider(config: vscode.WorkspaceConfiguration, provider: AIProvider): string {
  // Try provider-specific key first, then fall back to legacy groqApiKey
  const keyMap: Record<AIProvider, string> = {
    groq: 'groqApiKey',
    openai: 'openaiApiKey',
    anthropic: 'anthropicApiKey',
    gemini: 'geminiApiKey'
  };
  return config.get<string>(keyMap[provider], '');
}

export function deactivate(): void {
  // Cleanup handled by disposables
}
