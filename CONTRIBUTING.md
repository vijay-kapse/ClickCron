# Contributing to ClickCron

Thanks for helping make ClickCron better. Record once, run forever — and contribute kindly.

## Dev setup

ClickCron targets Node `>=20`, uses ESM, and is managed with npm.

```bash
git clone https://github.com/vijay-kapse/ClickCron.git
cd ClickCron
npm ci
npm run dev -- --help
```

`npm run dev` runs the CLI from `src/` via `tsx`, so you can iterate without rebuilding:

```bash
npm run dev -- init
npm run dev -- doctor --verbose
npm run dev -- list
```

## The verify gate

Before opening a PR, run the full gate locally and make sure it passes:

```bash
npm run verify
```

This runs `typecheck`, `lint`, `prettier --check`, the test suite, and `build`. The
end-to-end heal test needs Chromium, so install it once with
`npx playwright install chromium` if you haven't already.

## Adding a changeset

Every user-facing change needs a changeset so the release notes and version bump are
generated automatically:

```bash
npx changeset
```

Pick `patch`, `minor`, or `major`, write a short human-readable summary, and commit the
generated file under `.changeset/`. CI uses these to open a version PR and publish to npm.

## Project structure

```
src/
  cli.ts        # commander entrypoint, wires up commands
  commands/     # one file per CLI command (init, record, run, heal, export, ...)
  core/         # config, recorder, runner, scheduler, AI healing, logging
  runtime/      # clickcron/runtime — the self-healing locator used by recorded specs
  templates/    # GitHub Action + local-cron scaffolding
  tests/        # vitest unit, integration, and e2e tests
  types/        # shared TypeScript types (automation, config, heal, run-result)
```

## How self-healing works

Recorded specs import `cc(page, candidate)` from `clickcron/runtime`. Each candidate
carries an ordered list of selector strategies (testId, role, label, text, css, ...).
At action time the runtime tries each strategy in order. If every strategy misses and a
heal budget plus `ANTHROPIC_API_KEY` are available, it snapshots the interactive elements
on the live page and asks Claude to relocate the element. The repaired selector is
re-checked against the page before any action runs; only a verified fix is used, recorded
as a `HealEvent`, and persisted. If nothing can repair the selector, the run fails with a
clear, actionable error instead of silently passing. The `heal` command runs this same
flow on demand to re-validate and repair a recipe's selectors.

Heal behavior is tunable via env vars: `CLICKCRON_NO_HEAL=1` disables it,
`CLICKCRON_HEAL_MAX` caps repairs per run, `CLICKCRON_HEAL_MODEL` overrides the model, and
`CLICKCRON_HEAL_LOG` points at a JSONL telemetry file.

## Code style

Prettier and ESLint are enforced: single quotes, 2-space indent, semicolons, 100-column
print width. Run `npm run format:write` to auto-format before committing.
