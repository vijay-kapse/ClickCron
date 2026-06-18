import type { SelectorCandidate, SelectorStrategy } from '../types/heal.js';

export interface TransformResult {
  /** The rewritten spec source (unchanged lines preserved verbatim). */
  code: string;
  /** Candidates captured from rewritten locators, keyed by candidate key. */
  selectors: Record<string, SelectorCandidate>;
  /** Number of locators rewritten to self-healing `cc()` calls. */
  rewrites: number;
}

const RUNTIME_IMPORT = "import { cc } from 'clickcron/runtime';";

const GETTERS = [
  'getByRole',
  'getByText',
  'getByLabel',
  'getByPlaceholder',
  'getByTestId',
  'getByAltText',
  'getByTitle',
  'locator'
] as const;

const ACTIONS = [
  'click',
  'dblclick',
  'fill',
  'check',
  'hover',
  'press',
  'selectOption',
  'type'
] as const;

// await page.<getter>(<args>).<action>(<actionArgs>);
const LINE = new RegExp(
  `^(\\s*)await\\s+page\\.(${GETTERS.join('|')})\\((.*)\\)\\.(${ACTIONS.join('|')})\\((.*)\\);\\s*$`
);

function firstStringLiteral(args: string): string | null {
  const match = args.match(/^\s*(['"`])([\s\S]*?)\1/);
  return match ? (match[2] ?? null) : null;
}

function option(args: string, key: string): string | null {
  const match = args.match(new RegExp(`${key}:\\s*(['"\`])([\\s\\S]*?)\\1`));
  return match ? (match[2] ?? null) : null;
}

function hasExact(args: string): boolean {
  return /exact:\s*true/.test(args);
}

function strategyFor(getter: string, args: string): SelectorStrategy | null {
  const value = firstStringLiteral(args);
  if (value === null) return null;
  const exact = hasExact(args);

  switch (getter) {
    case 'getByRole': {
      const name = option(args, 'name');
      const strategy: SelectorStrategy = { kind: 'role', value };
      if (name !== null) strategy.name = name;
      if (exact) strategy.exact = true;
      return strategy;
    }
    case 'getByText':
      return exact ? { kind: 'text', value, exact: true } : { kind: 'text', value };
    case 'getByLabel':
      return exact ? { kind: 'label', value, exact: true } : { kind: 'label', value };
    case 'getByPlaceholder':
      return exact ? { kind: 'placeholder', value, exact: true } : { kind: 'placeholder', value };
    case 'getByAltText':
      return exact ? { kind: 'altText', value, exact: true } : { kind: 'altText', value };
    case 'getByTitle':
      return exact ? { kind: 'title', value, exact: true } : { kind: 'title', value };
    case 'getByTestId':
      return { kind: 'testId', value };
    case 'locator':
      return value.startsWith('xpath=')
        ? { kind: 'xpath', value: value.slice('xpath='.length) }
        : { kind: 'css', value };
    default:
      return null;
  }
}

function describe(strategy: SelectorStrategy): string {
  switch (strategy.kind) {
    case 'role':
      return strategy.name ? `${strategy.name} ${strategy.value}` : `${strategy.value} element`;
    case 'testId':
      return `element with test id "${strategy.value}"`;
    case 'css':
    case 'xpath':
      return `element matching ${strategy.value}`;
    default:
      return `${strategy.kind} "${strategy.value}"`;
  }
}

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'el'
  );
}

function uniqueKey(base: string, used: Set<string>): string {
  let key = base;
  let n = 2;
  while (used.has(key)) {
    key = `${base}-${n}`;
    n += 1;
  }
  used.add(key);
  return key;
}

/**
 * Rewrite recorded Playwright locator calls into self-healing `cc()` calls.
 *
 * Conservative by design: only `await page.<getter>(...).<action>(...);` lines
 * with a single recognized getter and action are rewritten. Every other line —
 * comments, assertions, chained/filtered locators, navigation — is preserved
 * byte-for-byte, so the output is always a runnable spec even when nothing was
 * rewritten.
 */
export function transformSpec(source: string): TransformResult {
  const lines = source.split('\n');
  const selectors: Record<string, SelectorCandidate> = {};
  const usedKeys = new Set<string>();
  let rewrites = 0;

  const out = lines.map((line) => {
    const match = line.match(LINE);
    if (!match) return line;

    const [, indent = '', getter = '', args = '', action = '', actionArgs = ''] = match;
    // Skip chained/filtered locators (e.g. `.filter(...).first()`): a `).`
    // inside the captured args means the greedy match swallowed a chain we
    // can't faithfully represent, so leave the line untouched.
    if (/\)\s*\./.test(args)) return line;
    const strategy = strategyFor(getter, args);
    if (!strategy) return line;

    const description = describe(strategy);
    const key = uniqueKey(slugify(strategy.name ?? strategy.value), usedKeys);
    selectors[key] = { key, description, strategies: [strategy] };
    rewrites += 1;

    const candidateLiteral = `{ key: ${JSON.stringify(key)}, description: ${JSON.stringify(
      description
    )}, strategies: ${JSON.stringify([strategy])} }`;
    return `${indent}await cc(page, ${candidateLiteral}).${action}(${actionArgs});`;
  });

  let code = out.join('\n');
  if (rewrites > 0 && !code.includes(RUNTIME_IMPORT)) {
    code = addRuntimeImport(code);
  }

  return { code, selectors, rewrites };
}

/** Insert the runtime import after the last existing import, else at the top. */
function addRuntimeImport(code: string): string {
  const lines = code.split('\n');
  let lastImport = -1;
  for (let i = 0; i < lines.length; i += 1) {
    if (/^\s*import\b/.test(lines[i] ?? '')) lastImport = i;
  }
  if (lastImport === -1) {
    return `${RUNTIME_IMPORT}\n${code}`;
  }
  lines.splice(lastImport + 1, 0, RUNTIME_IMPORT);
  return lines.join('\n');
}
