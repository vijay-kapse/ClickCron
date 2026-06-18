/**
 * ClickCron runtime — imported by recorded specs as `clickcron/runtime`.
 *
 * `cc(page, candidate)` returns a self-healing locator. It tries each recorded
 * strategy in order; if every strategy fails to match an element, and a heal
 * budget + API key are available, it asks Claude to relocate the element from
 * the live page, verifies the repaired selector, records a heal event, and
 * continues. Healing never silently swallows a real failure — if it can't
 * repair the selector it throws a clear, actionable error.
 */
import { appendFileSync } from 'node:fs';
import type { Locator, Page } from '@playwright/test';
import type { HealEvent, SelectorCandidate, SelectorStrategy } from '../types/heal.js';
import { healSelector, type PageElement } from '../core/ai.js';

export type { SelectorCandidate, SelectorStrategy, HealEvent } from '../types/heal.js';

const DEFAULT_MODEL = 'claude-haiku-4-5';

let healCount = 0;

function healingEnabled(): boolean {
  return process.env.CLICKCRON_NO_HEAL !== '1';
}

function healModel(): string {
  return process.env.CLICKCRON_HEAL_MODEL ?? DEFAULT_MODEL;
}

function maxHeals(): number {
  const raw = Number(process.env.CLICKCRON_HEAL_MAX);
  return Number.isFinite(raw) && raw >= 0 ? raw : 5;
}

function recordHeal(event: HealEvent): void {
  const logPath = process.env.CLICKCRON_HEAL_LOG;
  if (!logPath) return;
  try {
    appendFileSync(logPath, `${JSON.stringify(event)}\n`, 'utf8');
  } catch {
    // Heal logging is best-effort telemetry; never fail a run because of it.
  }
}

function exactOption(strategy: SelectorStrategy): { exact?: boolean } {
  return strategy.exact !== undefined ? { exact: strategy.exact } : {};
}

/** Build a Playwright locator for a single strategy. */
export function toLocator(page: Page, strategy: SelectorStrategy): Locator {
  switch (strategy.kind) {
    case 'testId':
      return page.getByTestId(strategy.value);
    case 'role': {
      const role = strategy.value as Parameters<Page['getByRole']>[0];
      if (strategy.name === undefined) return page.getByRole(role);
      return page.getByRole(role, { name: strategy.name, ...exactOption(strategy) });
    }
    case 'label':
      return page.getByLabel(strategy.value, exactOption(strategy));
    case 'placeholder':
      return page.getByPlaceholder(strategy.value, exactOption(strategy));
    case 'altText':
      return page.getByAltText(strategy.value, exactOption(strategy));
    case 'title':
      return page.getByTitle(strategy.value, exactOption(strategy));
    case 'text':
      return page.getByText(strategy.value, exactOption(strategy));
    case 'css':
      return page.locator(strategy.value);
    case 'xpath':
      return page.locator(`xpath=${strategy.value}`);
    default:
      return page.locator(strategy.value);
  }
}

/** Collect a trimmed snapshot of interactive/visible elements for the model. */
async function collectElements(page: Page): Promise<PageElement[]> {
  try {
    return (await page.$$eval(
      'a, button, input, select, textarea, [role], [data-testid], [aria-label], label, h1, h2, h3, summary',
      (nodes) =>
        nodes.slice(0, 80).map((node) => {
          const el = node as HTMLElement;
          const out: Record<string, string> = { tag: el.tagName.toLowerCase() };
          const role = el.getAttribute('role');
          const testId = el.getAttribute('data-testid');
          const ariaLabel = el.getAttribute('aria-label');
          const placeholder = el.getAttribute('placeholder');
          const text = (el.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 80);
          if (role) out.role = role;
          if (testId) out.testId = testId;
          if (ariaLabel) out.ariaLabel = ariaLabel;
          if (placeholder) out.placeholder = placeholder;
          if (el.id) out.id = el.id;
          if (el.className && typeof el.className === 'string') {
            out.classes = el.className.slice(0, 80);
          }
          if (text) out.text = text;
          return out;
        })
    )) as unknown as PageElement[];
  } catch {
    return [];
  }
}

async function firstMatching(page: Page, strategies: SelectorStrategy[]): Promise<Locator | null> {
  for (const strategy of strategies) {
    try {
      const locator = toLocator(page, strategy);
      if ((await locator.count()) > 0) return locator.first();
    } catch {
      // A malformed strategy shouldn't abort the whole resolution chain.
    }
  }
  return null;
}

/**
 * Resolve a candidate to a concrete Locator, healing if every recorded
 * strategy misses. Exposed for tests; most specs use {@link cc}.
 */
export async function resolveCandidate(page: Page, candidate: SelectorCandidate): Promise<Locator> {
  const direct = await firstMatching(page, candidate.strategies);
  if (direct) return direct;

  const intent = candidate.description ? ` (${candidate.description})` : '';
  if (!healingEnabled()) {
    throw new Error(
      `ClickCron: no element matched selector "${candidate.key}"${intent} and healing is disabled.`
    );
  }
  if (healCount >= maxHeals()) {
    throw new Error(
      `ClickCron: no element matched selector "${candidate.key}"${intent}; heal budget exhausted.`
    );
  }

  const elements = await collectElements(page);
  const model = healModel();
  const healed = await healSelector({ candidate, elements, model });
  if (!healed) {
    throw new Error(
      `ClickCron: could not heal selector "${candidate.key}"${intent}. ` +
        'Set ANTHROPIC_API_KEY to enable AI self-healing, or update the recorded selector.'
    );
  }

  const locator = toLocator(page, healed.strategy);
  if ((await locator.count()) === 0) {
    throw new Error(
      `ClickCron: healed selector for "${candidate.key}" still matched no element ` +
        `(${JSON.stringify(healed.strategy)}).`
    );
  }

  healCount += 1;
  recordHeal({
    key: candidate.key,
    ...(candidate.description !== undefined ? { description: candidate.description } : {}),
    before: candidate.strategies,
    after: healed.strategy,
    model,
    ...(healed.reason !== undefined ? { reason: healed.reason } : {}),
    ...(healed.confidence !== undefined ? { confidence: healed.confidence } : {}),
    at: new Date().toISOString()
  });

  return locator.first();
}

/**
 * A locator-like handle whose actions resolve (and heal) the underlying
 * element lazily, right before the action runs.
 */
export class SmartLocator {
  public constructor(
    private readonly page: Page,
    private readonly candidate: SelectorCandidate
  ) {}

  /** Resolve to a concrete Playwright Locator (healing if needed). */
  public resolve(): Promise<Locator> {
    return resolveCandidate(this.page, this.candidate);
  }

  public async click(options?: Parameters<Locator['click']>[0]): Promise<void> {
    await (await this.resolve()).click(options);
  }

  public async dblclick(options?: Parameters<Locator['dblclick']>[0]): Promise<void> {
    await (await this.resolve()).dblclick(options);
  }

  public async fill(value: string, options?: Parameters<Locator['fill']>[1]): Promise<void> {
    await (await this.resolve()).fill(value, options);
  }

  public async type(
    value: string,
    options?: Parameters<Locator['pressSequentially']>[1]
  ): Promise<void> {
    await (await this.resolve()).pressSequentially(value, options);
  }

  public async press(key: string, options?: Parameters<Locator['press']>[1]): Promise<void> {
    await (await this.resolve()).press(key, options);
  }

  public async check(options?: Parameters<Locator['check']>[0]): Promise<void> {
    await (await this.resolve()).check(options);
  }

  public async hover(options?: Parameters<Locator['hover']>[0]): Promise<void> {
    await (await this.resolve()).hover(options);
  }

  public async selectOption(values: Parameters<Locator['selectOption']>[0]): Promise<string[]> {
    return (await this.resolve()).selectOption(values);
  }

  public async textContent(): Promise<string | null> {
    return (await this.resolve()).textContent();
  }

  public async innerText(): Promise<string> {
    return (await this.resolve()).innerText();
  }

  public async getAttribute(name: string): Promise<string | null> {
    return (await this.resolve()).getAttribute(name);
  }

  public async isVisible(): Promise<boolean> {
    return (await this.resolve()).isVisible();
  }

  public async count(): Promise<number> {
    return (await this.resolve()).count();
  }

  public async waitFor(options?: Parameters<Locator['waitFor']>[0]): Promise<void> {
    await (await this.resolve()).waitFor(options);
  }
}

/**
 * Create a self-healing locator for an element described by `candidate`.
 *
 * ```ts
 * await cc(page, {
 *   key: 'buy-button',
 *   description: 'The primary "Buy now" button',
 *   strategies: [{ kind: 'role', value: 'button', name: 'Buy now' }],
 * }).click();
 * ```
 */
export function cc(page: Page, candidate: SelectorCandidate): SmartLocator {
  return new SmartLocator(page, candidate);
}

/** Reset the per-process heal counter. Primarily for tests. */
export function __resetHealCount(): void {
  healCount = 0;
}
