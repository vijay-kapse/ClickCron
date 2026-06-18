Show HN: ClickCron – browser checks that self-heal with AI when the page changes

I kept setting up little Playwright scripts to watch things — a price, a stock badge, a login form — and scheduling them with cron or GitHub Actions. They always worked great until the site shipped a redesign, a selector broke, and the whole check went red until I noticed and hand-patched it. That manual babysitting is the part I hated, so I built ClickCron.

It's a small TypeScript CLI. You record a flow once (it wraps Playwright codegen), and ClickCron runs it on a schedule locally or in CI, keeping logs, screenshots, and a JSON result for every run. The `schedule` command turns a cron expression (or an alias like `hourly`) into a GitHub Actions workflow you commit to your repo.

How the healing works: when a recorded selector fails to resolve, ClickCron (if you set ANTHROPIC_API_KEY) snapshots the live page's accessibility tree and asks Claude to relocate the element. It then verifies the proposed selector resolves to exactly one element before using it, applies it, persists the new selector back to the recipe file, and writes a before/after heal event to an audit log. If healing can't find a confident, unique match, the run still fails — it never swallows a real break.

It defaults to the cheap Haiku model, so heals cost fractions of a cent, and the whole thing is opt-in. It's early — works for me, edges are rough. MIT, code here: https://github.com/vijay-kapse/ClickCron
