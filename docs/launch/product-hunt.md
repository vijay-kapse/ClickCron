# ClickCron — Product Hunt launch

**Tagline (≤60 chars):** Browser checks that self-heal with AI when sites change

**Description:**
ClickCron is a tiny, open-source TypeScript CLI that records a browser flow once and runs it forever as a scheduled check — locally or in GitHub Actions. The catch with normal Playwright-plus-cron setups is that they break the moment a selector changes and need a human to fix them. ClickCron uses Claude to relocate broken elements from the live page's accessibility tree, verifies the repaired selector matches exactly one element, applies it, and saves it back to your recipe — so your checks heal instead of going red. Record once. Run forever.

**First comment from the maker (~120 words):**
Hey Product Hunt! I built ClickCron because I was tired of my scheduled browser checks dying every time a site shipped a redesign. The flow is simple: `npx clickcron record` to capture a click path, `run` to replay it, and `schedule` to drop a GitHub Actions workflow into your repo. The part I'm proud of is the self-healing — when a selector breaks, ClickCron asks Claude to find the element again from the accessibility tree, confirms it resolves to a single element, then persists the fix and logs an auditable before/after. It defaults to the cheap Haiku model and is fully opt-in. It's early and MIT-licensed — feedback and issues very welcome!

**Feature highlights:**

- **AI self-healing selectors** — broken element? Claude relocates it from the accessibility tree, verifies a unique match, and persists the fix with an audit log.
- **Record once with Playwright codegen** — capture real clicks, no hand-written selectors.
- **Schedule anywhere** — cron aliases or raw cron generate a ready-to-commit GitHub Actions workflow.
- **Every run is evidence** — logs, screenshots, and JSON results saved for each check.
- **Git-native and tiny** — recipes live in your repo, MIT-licensed, `npx clickcron init` to start.
