export interface AutomationMetadata {
  name: string;
  displayName: string;
  scriptPath: string;
  metadataPath: string;
  createdAt: string;
  updatedAt: string;
  sourceUrl?: string;
  browser: 'chromium' | 'firefox' | 'webkit';
  timeoutMs: number;
}

export interface CreateAutomationInput {
  name: string;
  browser: 'chromium' | 'firefox' | 'webkit';
  timeoutMs: number;
  sourceUrl?: string;
}
