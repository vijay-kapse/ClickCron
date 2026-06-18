import { readFile } from 'node:fs/promises';
import type { ClickCronConfig } from '../types/config.js';
import type { SelectorCandidate } from '../types/heal.js';
import { getAutomationByName } from './automation.js';

export interface RecipeExport {
  name: string;
  displayName: string;
  browser: string;
  timeoutMs: number;
  sourceUrl?: string;
  selectors: Record<string, SelectorCandidate>;
  script: string;
  exportedBy: string;
}

/** Build a portable, self-contained recipe (metadata + selectors + spec source). */
export async function buildRecipe(config: ClickCronConfig, name: string): Promise<RecipeExport> {
  const automation = await getAutomationByName(config, name);
  const script = await readFile(automation.scriptPath, 'utf8');
  const recipe: RecipeExport = {
    name: automation.name,
    displayName: automation.displayName,
    browser: automation.browser,
    timeoutMs: automation.timeoutMs,
    selectors: automation.selectors ?? {},
    script,
    exportedBy: 'clickcron'
  };
  if (automation.sourceUrl !== undefined) recipe.sourceUrl = automation.sourceUrl;
  return recipe;
}

function yamlScalar(value: string | number | boolean): string {
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value === '') return "''";
  const needsQuote =
    /^[\s\-?:,[\]{}#&*!|>'"%@`]/.test(value) || // leading indicator char or space
    /:\s/.test(value) || // colon followed by space
    /\s#/.test(value) || // space followed by comment marker
    /[\n\t]/.test(value) || // control whitespace
    /\s$/.test(value) || // trailing space
    /^(true|false|null|yes|no|on|off|~)$/i.test(value) || // reserved words
    /^[+-]?[0-9.][0-9.eE+-]*$/.test(value); // looks like a number
  return needsQuote ? `'${value.replace(/'/g, "''")}'` : value;
}

function toYaml(value: unknown, indent = 0): string {
  const pad = '  '.repeat(indent);
  if (Array.isArray(value)) {
    if (value.length === 0) return `${pad}[]`;
    return value
      .map((item) => {
        if (item !== null && typeof item === 'object') {
          const block = toYaml(item, indent + 1).replace(/^\s+/, '');
          return `${pad}- ${block}`;
        }
        return `${pad}- ${yamlScalar(item as string | number | boolean)}`;
      })
      .join('\n');
  }
  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return `${pad}{}`;
    return entries
      .map(([key, val]) => {
        if (Array.isArray(val) || (val !== null && typeof val === 'object')) {
          return `${pad}${key}:\n${toYaml(val, indent + 1)}`;
        }
        if (typeof val === 'string' && val.includes('\n')) {
          const body = val
            .split('\n')
            .map((line) => `${'  '.repeat(indent + 1)}${line}`)
            .join('\n');
          return `${pad}${key}: |\n${body}`;
        }
        return `${pad}${key}: ${yamlScalar(val as string | number | boolean)}`;
      })
      .join('\n');
  }
  return `${pad}${yamlScalar(value as string | number | boolean)}`;
}

export function serializeRecipe(recipe: RecipeExport, format: 'json' | 'yaml'): string {
  if (format === 'yaml') return `${toYaml(recipe)}\n`;
  return `${JSON.stringify(recipe, null, 2)}\n`;
}
