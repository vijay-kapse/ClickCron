# Changelog

## 0.3.0

### Minor Changes

- [`6c5aadc`](https://github.com/vijay-kapse/ClickCron/commit/6c5aadc656a7d88b6a41ae18750ddccfb1e4047f) Thanks [@tworockranch-cmd](https://github.com/tworockranch-cmd)! - Add AI self-healing selectors: when a recorded selector stops matching, Claude relocates the element from the live page, the repaired selector is verified before use, persisted back to the recipe, and logged as a heal event. Ships the new `clickcron/runtime` entrypoint, a `heal` command to re-validate and repair a recipe on demand, real `export` plus `--dry-run` for `run`, and a `doctor` that reports healing readiness.

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-06-18

### Added

- **AI self-healing selectors.** When a recorded selector no longer matches, ClickCron asks
  Claude to relocate the element from the live page, verifies the repaired selector resolves to
  exactly one element, applies it, persists it back to the recipe, and records an auditable
  before/after heal event. Opt-in via `ANTHROPIC_API_KEY`; defaults to the cheap Claude Haiku
  model.
- **`clickcron/runtime`** package export with the `cc(page, candidate)` self-healing locator
  used by recorded specs.
- **`clickcron heal <name>`** command to proactively re-validate and repair a recipe's selectors
  against the live page without running its assertions.
- `clickcron run` now supports a real `--dry-run` (prints the resolved plan, healing status, and
  captured selectors) and a `--no-heal` flag.

### Changed

- `clickcron export` is fully implemented — emits a portable recipe (metadata, selectors, and
  spec source) as JSON or YAML.
- `clickcron record` rewrites recorded locators into self-healing `cc()` calls and captures
  selector candidates into metadata.
- `clickcron doctor` reports AI self-healing readiness (API key + model).

### Fixed

- The recorder no longer leaves a dead placeholder spec behind when codegen lacks `--output`; it
  captures the generated script instead.

### Security

- Cleared a critical advisory by upgrading the test toolchain (`npm audit` is clean).
- Added a CI matrix (Ubuntu/macOS/Windows × Node 20/22), audit and coverage jobs.

## [0.1.0] - Initial release

- Record browser flows with Playwright codegen, run them locally or in CI, schedule them with
  cron aliases or raw cron expressions (generates a GitHub Actions workflow), and keep logs,
  screenshots, and `result.json` for every run.
