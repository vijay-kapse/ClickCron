/**
 * Selector strategies and self-healing types shared between the ClickCron CLI
 * and the runtime helper that recorded specs import.
 */

export type SelectorKind =
  | 'testId'
  | 'role'
  | 'label'
  | 'placeholder'
  | 'altText'
  | 'title'
  | 'text'
  | 'css'
  | 'xpath';

export interface SelectorStrategy {
  kind: SelectorKind;
  /** Selector body: a CSS string, role name, visible text, test id, etc. */
  value: string;
  /** Accessible name, used with `role`. */
  name?: string;
  /** Exact-match flag for text/role/name based strategies. */
  exact?: boolean;
}

export interface SelectorCandidate {
  /** Stable key used to address this element across runs and heals. */
  key: string;
  /** Natural-language hint that helps the model relocate the element. */
  description?: string;
  /** Ordered strategies tried before healing kicks in. */
  strategies: SelectorStrategy[];
}

export interface HealEvent {
  key: string;
  description?: string;
  /** Strategies that were tried and all failed. */
  before: SelectorStrategy[];
  /** The strategy the model proposed and that ClickCron verified. */
  after: SelectorStrategy;
  model: string;
  reason?: string;
  confidence?: number;
  at: string;
}
