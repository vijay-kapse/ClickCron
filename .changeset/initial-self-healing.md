---
'clickcron': minor
---

Add AI self-healing selectors: when a recorded selector stops matching, Claude relocates the element from the live page, the repaired selector is verified before use, persisted back to the recipe, and logged as a heal event. Ships the new `clickcron/runtime` entrypoint, a `heal` command to re-validate and repair a recipe on demand, real `export` plus `--dry-run` for `run`, and a `doctor` that reports healing readiness.
