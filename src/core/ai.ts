import { readFileSync } from 'node:fs';
import type { SelectorCandidate, SelectorStrategy } from '../types/heal.js';

/**
 * A compact, model-friendly description of a candidate element on the page.
 * The runtime collects these from the live DOM when a selector breaks.
 */
export interface PageElement {
  tag: string;
  role?: string;
  name?: string;
  text?: string;
  testId?: string;
  id?: string;
  classes?: string;
  placeholder?: string;
  ariaLabel?: string;
}

export interface HealInput {
  candidate: SelectorCandidate;
  /** Trimmed list of interactive/visible elements currently on the page. */
  elements: PageElement[];
  /** Anthropic model id to use for the repair. */
  model: string;
}

export interface HealOutput {
  strategy: SelectorStrategy;
  reason?: string;
  confidence?: number;
}

const VALID_KINDS: ReadonlyArray<SelectorStrategy['kind']> = [
  'testId',
  'role',
  'label',
  'placeholder',
  'altText',
  'title',
  'text',
  'css',
  'xpath'
];

function isValidStrategy(value: unknown): value is SelectorStrategy {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.kind === 'string' &&
    VALID_KINDS.includes(candidate.kind as SelectorStrategy['kind']) &&
    typeof candidate.value === 'string' &&
    candidate.value.length > 0
  );
}

function coerceOutput(parsed: unknown): HealOutput | null {
  if (typeof parsed !== 'object' || parsed === null) return null;
  const record = parsed as Record<string, unknown>;
  const strategy = record.strategy ?? record;
  if (!isValidStrategy(strategy)) return null;
  const output: HealOutput = { strategy };
  if (typeof record.reason === 'string') output.reason = record.reason;
  if (typeof record.confidence === 'number') output.confidence = record.confidence;
  return output;
}

/** Pull the first JSON object out of a model response, tolerating prose/fences. */
export function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = (fenced ? fenced[1] : text) ?? text;
  const start = body.indexOf('{');
  const end = body.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) return null;
  try {
    return JSON.parse(body.slice(start, end + 1));
  } catch {
    return null;
  }
}

const SYSTEM_PROMPT =
  'You are a browser-automation repair engine. A recorded Playwright selector no longer ' +
  'matches any element. Given the original selector intent and the elements currently on the ' +
  'page, choose the single best element and return ONE selector strategy that uniquely locates ' +
  'it. Prefer stable, semantic strategies in this order: testId, role (with accessible name), ' +
  'label, placeholder, text, then css as a last resort. Respond with strict JSON only: ' +
  '{"strategy":{"kind":"role|testId|label|placeholder|altText|title|text|css|xpath","value":"...","name":"optional accessible name","exact":false},"reason":"short","confidence":0-1}.';

function buildUserPrompt(input: HealInput): string {
  const { candidate, elements } = input;
  const tried = candidate.strategies
    .map((s) => `- ${s.kind}: ${JSON.stringify({ value: s.value, name: s.name, exact: s.exact })}`)
    .join('\n');
  const dom = elements
    .slice(0, 60)
    .map((el, i) => `[${i}] ${JSON.stringify(el)}`)
    .join('\n');
  return [
    `Element key: ${candidate.key}`,
    candidate.description ? `Intent: ${candidate.description}` : 'Intent: (none provided)',
    '',
    'Strategies that no longer match:',
    tried || '(none)',
    '',
    'Elements currently on the page:',
    dom || '(no elements captured)',
    '',
    'Return the single best replacement strategy as JSON.'
  ].join('\n');
}

/**
 * Repair a broken selector.
 *
 * Resolution order:
 * 1. `CLICKCRON_HEAL_FAKE` — path to a JSON map of `{ key: SelectorStrategy }`.
 *    Used by tests and offline/dry runs; no network call.
 * 2. The Anthropic API, when `ANTHROPIC_API_KEY` is set.
 *
 * Returns `null` when healing is unavailable (no key, no match) — callers treat
 * that as "could not heal" and surface a clear, actionable error.
 */
export async function healSelector(input: HealInput): Promise<HealOutput | null> {
  const fakePath = process.env.CLICKCRON_HEAL_FAKE;
  if (fakePath) {
    try {
      const map = JSON.parse(readFileSync(fakePath, 'utf8')) as Record<string, unknown>;
      return coerceOutput(map[input.candidate.key]);
    } catch {
      return null;
    }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  // Imported lazily so the SDK only loads when a real heal is attempted.
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const client = new Anthropic({ apiKey });

  const message = await client.messages.create({
    model: input.model,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildUserPrompt(input) }]
  });

  const text = message.content.map((block) => (block.type === 'text' ? block.text : '')).join('\n');

  return coerceOutput(extractJson(text));
}
