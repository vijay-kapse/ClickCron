# ClickCron — Record once. Run forever.

A developer-friendly CLI for browser automations you can schedule and trust.

## Demo

> Demo GIF / video placeholder: `docs/demo.md`.

## Why

ClickCron helps you turn fragile manual checks into repeatable browser automations with a simple CLI workflow:

- Record and store automation metadata.
- Run checks locally or in CI.
- Generate schedule-ready GitHub Actions workflows.
- Keep artifacts and logs for debugging.

## Quickstart

```bash
npm install
npm run build
npx clickcron init
```

## Commands

- `clickcron init [--cwd <path>] [--force]`
- `clickcron record <name> <url> [options]`
- `clickcron run <name> [--dry-run] [--env <name>]`
- `clickcron list [--json]`
- `clickcron schedule <name> <alias-or-cron> [--timezone <tz>] [--force]`
- `clickcron doctor [--verbose]`
- `clickcron remove <name> [--runs]`
- `clickcron export <name> [--format json|yaml]`

## Examples

- `examples/price-checker/README.md`
- `examples/screenshot-monitor/README.md`
- `examples/form-checker/README.md`
- `examples/job-board-monitor/README.md`

## Scheduling

Use schedule aliases (`hourly`, `daily`, `weekly`, `monthly`) or provide a raw 5-field cron expression.

```bash
npx clickcron schedule price-checker daily
```

This writes a workflow file under `.github/workflows/` and prints a local-cron template.

## Secrets

Security guidance:

- Use environment variables for local secrets (e.g. via `.env` + process env injection).
- Use GitHub Actions Secrets for CI/CD credentials and tokens.
- Never hardcode credentials in scripts, metadata files, workflows, or committed fixtures.
- Safe-use boundary: only automate pages and accounts you own or are explicitly authorized to test.

See `docs/secrets.md` for policy details.

## Troubleshooting

- Run `npx clickcron doctor --verbose` to verify environment readiness.
- If Playwright browsers are missing, run `npx playwright install --with-deps`.
- Validate your schedule expression and recipe names before committing workflow files.

More: `docs/troubleshooting.md`.

## Roadmap

- Better schedule previews and next-run simulation.
- First-class secret profile management.
- Richer run history queries and artifact filtering.
- Optional hosted dashboard integrations.

## Contributing

Contributions are welcome. Please open issues for bugs/ideas and submit PRs with tests and docs updates.
