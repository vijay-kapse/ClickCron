import { mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { ClickCronConfig } from '../types/config.js';
import type { AutomationMetadata, CreateAutomationInput } from '../types/automation.js';
import type { HealEvent } from '../types/heal.js';
import { CliError } from './errors.js';

function slugify(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, '-');
}

export function getAutomationPaths(
  config: ClickCronConfig,
  name: string
): { scriptPath: string; metadataPath: string } {
  const slug = slugify(name);
  return {
    scriptPath: path.join(config.paths.automations, `${slug}.spec.ts`),
    metadataPath: path.join(config.paths.automations, `${slug}.clickcron.json`)
  };
}

export async function writeAutomationMetadata(
  config: ClickCronConfig,
  input: CreateAutomationInput
): Promise<AutomationMetadata> {
  const { scriptPath, metadataPath } = getAutomationPaths(config, input.name);
  const now = new Date().toISOString();
  const metadata: AutomationMetadata = {
    name: slugify(input.name),
    displayName: input.name,
    scriptPath,
    metadataPath,
    createdAt: now,
    updatedAt: now,
    browser: input.browser,
    timeoutMs: input.timeoutMs
  };
  if (input.sourceUrl !== undefined) metadata.sourceUrl = input.sourceUrl;
  if (input.selectors !== undefined) metadata.selectors = input.selectors;

  await mkdir(config.paths.automations, { recursive: true });
  await writeFile(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`, 'utf8');
  return metadata;
}

/**
 * Persist healed selectors back into an automation's metadata so the next run
 * starts from the repaired strategy. The healed strategy is promoted to the
 * front of the candidate's strategy list, with prior strategies kept as
 * fallbacks.
 */
export async function applyHealsToMetadata(
  config: ClickCronConfig,
  name: string,
  heals: HealEvent[]
): Promise<AutomationMetadata> {
  const { metadataPath } = getAutomationPaths(config, name);
  const metadata = await readAutomationMetadata(metadataPath);
  const selectors = { ...(metadata.selectors ?? {}) };

  for (const heal of heals) {
    const existing = selectors[heal.key];
    const fallbacks = existing ? existing.strategies : heal.before;
    const deduped = fallbacks.filter((s) => JSON.stringify(s) !== JSON.stringify(heal.after));
    selectors[heal.key] = {
      key: heal.key,
      ...(heal.description !== undefined ? { description: heal.description } : {}),
      strategies: [heal.after, ...deduped]
    };
  }

  const updated: AutomationMetadata = {
    ...metadata,
    selectors,
    updatedAt: new Date().toISOString()
  };
  await writeFile(metadataPath, `${JSON.stringify(updated, null, 2)}\n`, 'utf8');
  return updated;
}

export async function readAutomationMetadata(metadataPath: string): Promise<AutomationMetadata> {
  const raw = await readFile(metadataPath, 'utf8');
  return JSON.parse(raw) as AutomationMetadata;
}

export async function discoverAutomations(config: ClickCronConfig): Promise<AutomationMetadata[]> {
  await mkdir(config.paths.automations, { recursive: true });
  const entries = await readdir(config.paths.automations);
  const metadataFiles = entries.filter((entry) => entry.endsWith('.clickcron.json'));
  const automations = await Promise.all(
    metadataFiles.map((file) => readAutomationMetadata(path.join(config.paths.automations, file)))
  );
  return automations.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getAutomationByName(
  config: ClickCronConfig,
  name: string
): Promise<AutomationMetadata> {
  const { metadataPath } = getAutomationPaths(config, name);
  try {
    return await readAutomationMetadata(metadataPath);
  } catch {
    throw new CliError(`Automation "${name}" was not found.`, 'AUTOMATION_NOT_FOUND');
  }
}

export async function removeAutomation(
  config: ClickCronConfig,
  name: string,
  removeRunHistory: boolean
): Promise<void> {
  const { metadataPath, scriptPath } = getAutomationPaths(config, name);
  await rm(metadataPath, { force: true });
  await rm(scriptPath, { force: true });

  if (removeRunHistory) {
    const runDir = path.join(config.paths.runs, slugify(name));
    await rm(runDir, { recursive: true, force: true });
  }
}

export async function automationExists(config: ClickCronConfig, name: string): Promise<boolean> {
  const { metadataPath } = getAutomationPaths(config, name);
  try {
    await stat(metadataPath);
    return true;
  } catch {
    return false;
  }
}
