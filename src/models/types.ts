export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'outbound';
  content: string;
  timestamp: number;
  tag?: MessageTag;
}

export type MessageTag =
  | 'OUTBOUND'
  | 'BRANCH_MOVEMENT'
  | 'WARNING'
  | 'SUGGESTION'
  | 'STRUCTURE'
  | 'PROGRESS'
  | 'HEALTH_CHECK';

export interface BranchInfo {
  name: string;
  type: BranchType;
  isCurrent: boolean;
}

export type BranchType = 'feat' | 'dev' | 'staging' | 'main' | 'hotfix' | 'other';

export interface BranchStatus {
  current: string;
  currentType: BranchType;
  branches: BranchInfo[];
}

export type AIProvider = 'groq' | 'openai' | 'anthropic' | 'gemini' | 'ollama';

export interface ProviderInfo {
  id: AIProvider;
  name: string;
  hostname: string;
  path: string;
  models: string[];
  defaultModel: string;
  keyPlaceholder: string;
  consoleUrl: string;
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// Keep backward compat alias
export type GroqMessage = AIMessage;

export interface GroqResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

export type AIPersona = 'guide' | 'reviewer' | 'devops';

export interface EditorContext {
  filePath: string;
  lineRange?: string;
  selectedText?: string;
}

export interface TaskItem {
  id: string;
  phase: string;
  title: string;
  completed: boolean;
  branch: string;
}

export interface ConflictBlock {
  filePath: string;
  ours: string;
  theirs: string;
  startLine: number;
  endLine: number;
}

export interface WebviewMessage {
  type: 'sendMessage' | 'saveConfig' | 'ready' | 'setPersona' | 'toggleTask' | 'clearHistory' | 'setLanguage';
  content?: string;
  apiKey?: string;
  provider?: AIProvider;
  model?: string;
  persona?: AIPersona;
  lang?: 'id' | 'en';
  taskId?: string;
}

export interface ExtensionMessage {
  type: 'receiveMessage' | 'branchUpdate' | 'loading' | 'error' | 'configStatus' | 'personaUpdate' | 'tasksUpdate' | 'editorContextUpdate' | 'loadHistory' | 'languageUpdate';
  message?: ChatMessage;
  history?: ChatMessage[];
  branchStatus?: BranchStatus;
  isLoading?: boolean;
  error?: string;
  hasApiKey?: boolean;
  provider?: AIProvider;
  model?: string;
  persona?: AIPersona;
  lang?: 'id' | 'en';
  tasks?: TaskItem[];
  editorContext?: EditorContext;
}
