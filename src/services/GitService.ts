import * as vscode from 'vscode';
import { execSync } from 'child_process';
import { BranchInfo, BranchStatus, ConflictBlock, EditorContext } from '../models/types';
import { classifyBranchType } from '../utils/formatter';

export class GitService {
  private _onBranchChange = new vscode.EventEmitter<BranchStatus>();
  public readonly onBranchChange = this._onBranchChange.event;

  private lastBranch: string = '';
  private pollInterval: NodeJS.Timeout | undefined;
  private statusBarItem: vscode.StatusBarItem;

  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    this.statusBarItem.command = 'gitflowAssistant.showPhasedTasks';
    this.statusBarItem.tooltip = 'Klik untuk melihat status & alur branch GitFlow Assistant';
    this.statusBarItem.text = '$(git-branch) GitFlow';
    this.statusBarItem.show();

    this.startPolling();
  }

  private startPolling(): void {
    // Poll every 5 seconds for branch changes
    this.pollInterval = setInterval(async () => {
      try {
        const status = await this.getBranchStatus();
        if (status) {
          this.updateStatusBar(status.current, status.currentType);
          if (status.current !== this.lastBranch) {
            const previousBranch = this.lastBranch;
            this.lastBranch = status.current;
            if (previousBranch !== '') {
              this._onBranchChange.fire(status);
            }
          }
        }
      } catch {
        // Silently ignore polling errors
      }
    }, 5000);
  }

  public updateStatusBar(branchName: string, type: string): void {
    this.statusBarItem.text = `$(git-branch) ${branchName} (${type})`;
  }

  public async getBranchStatus(): Promise<BranchStatus | undefined> {
    const gitExtension = vscode.extensions.getExtension<GitExtensionAPI>('vscode.git');
    if (!gitExtension) {
      return this.getFallbackBranchStatus();
    }

    if (!gitExtension.isActive) {
      await gitExtension.activate();
    }

    const git = gitExtension.exports.getAPI(1);
    const repo = git.repositories[0];

    if (!repo) {
      return this.getFallbackBranchStatus();
    }

    const currentBranch = repo.state.HEAD?.name || 'unknown';
    const refs = repo.state.refs || [];

    const branches: BranchInfo[] = refs
      .filter((ref: GitRef) => ref.type === 0) // 0 = Head (local branch)
      .map((ref: GitRef) => ({
        name: ref.name || 'unknown',
        type: classifyBranchType(ref.name || ''),
        isCurrent: ref.name === currentBranch
      }));

    // Ensure current branch is included
    if (!branches.find(b => b.name === currentBranch)) {
      branches.unshift({
        name: currentBranch,
        type: classifyBranchType(currentBranch),
        isCurrent: true
      });
    }

    this.lastBranch = currentBranch;

    return {
      current: currentBranch,
      currentType: classifyBranchType(currentBranch),
      branches
    };
  }

  private getFallbackBranchStatus(): BranchStatus {
    return {
      current: 'unknown',
      currentType: 'other',
      branches: [{
        name: 'unknown',
        type: 'other',
        isCurrent: true
      }]
    };
  }

  public formatBranchContext(status: BranchStatus): string {
    const lines: string[] = [
      `Branch aktif saat ini: ${status.current} (tipe: ${status.currentType})`,
      `Daftar branch yang terdeteksi:`
    ];

    const grouped: Record<string, string[]> = { feat: [], dev: [], staging: [], main: [], hotfix: [], other: [] };
    for (const b of status.branches) {
      grouped[b.type].push(b.name + (b.isCurrent ? ' (AKTIF)' : ''));
    }

    for (const [type, names] of Object.entries(grouped)) {
      if (names.length > 0) {
        lines.push(`  - ${type}: ${names.join(', ')}`);
      }
    }

    return lines.join('\n');
  }

  public async getStagedDiff(): Promise<{ diff: string; isStaged: boolean }> {
    const cwd = this.getWorkspaceFolder();
    if (!cwd) return { diff: '', isStaged: false };

    try {
      // Try staged changes first
      const staged = execSync('git diff --cached', { cwd, encoding: 'utf8', maxBuffer: 1024 * 1024 });
      if (staged && staged.trim().length > 0) {
        return { diff: staged.trim(), isStaged: true };
      }
      // Fallback to unstaged working tree changes
      const unstaged = execSync('git diff', { cwd, encoding: 'utf8', maxBuffer: 1024 * 1024 });
      return { diff: unstaged ? unstaged.trim() : '', isStaged: false };
    } catch {
      return { diff: '', isStaged: false };
    }
  }

  public setScmInputBoxValue(text: string): void {
    try {
      const gitExtension = vscode.extensions.getExtension<GitExtensionAPI>('vscode.git');
      if (gitExtension && gitExtension.isActive) {
        const repo = gitExtension.exports.getAPI(1).repositories[0];
        if (repo && repo.inputBox) {
          repo.inputBox.value = text;
        }
      }
    } catch {
      // Ignore if SCM input box set fails
    }
  }

  public getGitLog(days: number = 7): string {
    const cwd = this.getWorkspaceFolder();
    if (!cwd) return '';

    try {
      const output = execSync(`git log --since="${days} days ago" --oneline --no-merges -n 30`, { cwd, encoding: 'utf8' });
      return output ? output.trim() : '';
    } catch {
      return '';
    }
  }

  public getBranchLog(targetBranch: string): string {
    const cwd = this.getWorkspaceFolder();
    if (!cwd) return '';

    try {
      const output = execSync(`git log ${targetBranch}..HEAD --oneline --no-merges -n 20`, { cwd, encoding: 'utf8' });
      return output ? output.trim() : '';
    } catch {
      return '';
    }
  }

  public getActiveEditorContext(): EditorContext | undefined {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return undefined;

    const document = editor.document;
    const selection = editor.selection;

    // Get relative path to workspace
    let filePath = document.fileName;
    const ws = this.getWorkspaceFolder();
    if (ws && filePath.startsWith(ws)) {
      filePath = filePath.substring(ws.length).replace(/^[/\\]/, '');
    }

    let lineRange: string | undefined;
    let selectedText: string | undefined;

    if (!selection.isEmpty) {
      const startLine = selection.start.line + 1;
      const endLine = selection.end.line + 1;
      lineRange = startLine === endLine ? `L${startLine}` : `L${startLine}-L${endLine}`;
      selectedText = document.getText(selection).trim();
      if (selectedText.length > 2000) {
        selectedText = selectedText.substring(0, 2000) + '\n... [truncated]';
      }
    } else {
      const line = selection.active.line + 1;
      lineRange = `L${line}`;
    }

    return {
      filePath,
      lineRange,
      selectedText
    };
  }

  public getSmartBlameForActiveLine(): {
    author: string;
    date: string;
    commitHash: string;
    summary: string;
    lineContent: string;
    filePath: string;
    lineNum: number;
  } | undefined {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return undefined;

    const cwd = this.getWorkspaceFolder();
    if (!cwd) return undefined;

    const lineNum = editor.selection.active.line + 1;
    let filePath = editor.document.fileName;
    if (cwd && filePath.startsWith(cwd)) {
      filePath = filePath.substring(cwd.length).replace(/^[/\\]/, '');
    }

    try {
      const output = execSync(`git blame -L ${lineNum},${lineNum} --porcelain "${filePath}"`, { cwd, encoding: 'utf8' });
      if (!output) return undefined;

      const lines = output.split('\n');
      const commitHash = lines[0] ? lines[0].split(' ')[0] : 'unknown';
      let author = 'Unknown';
      let date = '';
      let summary = '';

      for (const l of lines) {
        if (l.startsWith('author ')) author = l.substring(7);
        if (l.startsWith('author-time ')) {
          const ts = parseInt(l.substring(12), 10) * 1000;
          if (!isNaN(ts)) date = new Date(ts).toLocaleDateString('id-ID');
        }
        if (l.startsWith('summary ')) summary = l.substring(8);
      }

      const lineContent = editor.document.lineAt(lineNum - 1).text.trim();

      return {
        author,
        date: date || 'baru saja',
        commitHash: commitHash.substring(0, 8),
        summary,
        lineContent,
        filePath,
        lineNum
      };
    } catch {
      return undefined;
    }
  }

  public getBranchDiffWithTarget(targetBranch: string): string {
    const cwd = this.getWorkspaceFolder();
    if (!cwd) return '';

    try {
      const output = execSync(`git diff ${targetBranch}...HEAD`, { cwd, encoding: 'utf8', maxBuffer: 2 * 1024 * 1024 });
      return output ? output.trim() : '';
    } catch {
      return '';
    }
  }

  public getCommitsSinceLastTag(): string {
    const cwd = this.getWorkspaceFolder();
    if (!cwd) return '';

    try {
      let tag = '';
      try {
        tag = execSync('git describe --tags --abbrev=0', { cwd, encoding: 'utf8' }).trim();
      } catch {
        tag = '';
      }

      const cmd = tag ? `git log ${tag}..HEAD --oneline --no-merges` : `git log -n 30 --oneline --no-merges`;
      const output = execSync(cmd, { cwd, encoding: 'utf8' });
      return output ? output.trim() : '';
    } catch {
      return '';
    }
  }

  public getActiveEditorConflictBlocks(): ConflictBlock[] {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return [];

    const text = editor.document.getText();
    if (!text.includes('<<<<<<<')) return [];

    const lines = text.split('\n');
    const conflicts: ConflictBlock[] = [];

    let inConflict = false;
    let inTheirs = false;
    let oursLines: string[] = [];
    let theirsLines: string[] = [];
    let startLine = 0;

    let cwd = this.getWorkspaceFolder();
    let filePath = editor.document.fileName;
    if (cwd && filePath.startsWith(cwd)) {
      filePath = filePath.substring(cwd.length).replace(/^[/\\]/, '');
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('<<<<<<<')) {
        inConflict = true;
        inTheirs = false;
        oursLines = [];
        theirsLines = [];
        startLine = i + 1;
      } else if (inConflict && line.startsWith('=======')) {
        inTheirs = true;
      } else if (inConflict && line.startsWith('>>>>>>>')) {
        conflicts.push({
          filePath,
          startLine,
          endLine: i + 1,
          ours: oursLines.join('\n'),
          theirs: theirsLines.join('\n')
        });
        inConflict = false;
        inTheirs = false;
      } else if (inConflict) {
        if (inTheirs) {
          theirsLines.push(line);
        } else {
          oursLines.push(line);
        }
      }
    }

    return conflicts;
  }

  public searchGitHistory(query: string = ''): string {
    const cwd = this.getWorkspaceFolder();
    if (!cwd) return '';

    try {
      let cmd = 'git log -n 25 --oneline --no-merges';
      if (query.trim().length > 0) {
        cmd = `git log -n 25 --oneline --no-merges --grep="${query.trim()}" -i`;
      }
      const output = execSync(cmd, { cwd, encoding: 'utf8' });
      return output ? output.trim() : '';
    } catch {
      return '';
    }
  }

  public isWorkingTreeDirty(): boolean {
    const cwd = this.getWorkspaceFolder();
    if (!cwd) return false;

    try {
      const output = execSync('git status --porcelain', { cwd, encoding: 'utf8' });
      return output ? output.trim().length > 0 : false;
    } catch {
      return false;
    }
  }

  private getWorkspaceFolder(): string | undefined {
    return vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0
      ? vscode.workspace.workspaceFolders[0].uri.fsPath
      : undefined;
  }

  public dispose(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
    this.statusBarItem.dispose();
    this._onBranchChange.dispose();
  }
}

// Minimal type definitions for VS Code Git Extension API
interface GitExtensionAPI {
  getAPI(version: number): GitAPI;
}

interface GitAPI {
  repositories: GitRepository[];
}

interface GitRepository {
  inputBox?: {
    value: string;
  };
  state: {
    HEAD?: { name?: string };
    refs: GitRef[];
  };
}

interface GitRef {
  type: number;
  name?: string;
}
