# Reddit launch posts

---

## r/programming

**Title:** ClickCron: an open-source CLI for scheduled browser checks that repair their own broken selectors with an LLM

**Body:**

I've been working on ClickCron, a small TypeScript CLI for recording a browser flow once and running it on a schedule (locally or in GitHub Actions) as a check — price/stock monitoring, form smoke tests, screenshot sanity checks, that kind of thing. It wraps Playwright codegen for recording and saves logs, screenshots, and a JSON result for each run.

The reason I'm posting rather than just linking: the interesting part is the self-healing. The usual failure mode for "Playwright script + cron" is that a site ships a UI change, a selector stops resolving, and the check goes red until someone fixes it by hand. ClickCron's `run` command, when a selector breaks, captures the live page's accessibility tree and asks Claude to relocate the element. It then verifies the proposed selector resolves to exactly one element, applies it, persists the new selector back to the recipe file, and writes a before/after heal event to an audit log. If it can't find a confident unique match, the run still fails — it doesn't paper over real breakage.

Healing is opt-in (needs ANTHROPIC_API_KEY) and defaults to the cheap Haiku model. It's MIT-licensed and git-native — recipes live in your repo, not a hosted dashboard. It's early, so I'd genuinely like to hear where the approach falls down.

Repo: https://github.com/vijay-kapse/ClickCron

---

## r/webdev

**Title:** I made a thing that keeps my scheduled browser checks from breaking every time a site redesigns

**Body:**

If you've ever set up a little script to watch a page — is this product back in stock, does the signup form still submit, does the dashboard still render — you know the annoying part isn't writing it. It's that the script breaks the instant the site changes a class name or moves a button, and you only find out when it's been red for three days.

ClickCron is my attempt to fix that. You record a click flow once (`npx clickcron record`, it uses Playwright codegen), run it with `clickcron run`, and `clickcron schedule` generates a GitHub Actions workflow so it runs on a cron without you babysitting it. Every run keeps logs, a screenshot, and a JSON result.

The headline feature: when a recorded selector breaks, ClickCron asks Claude to find the element again from the page's accessibility tree, checks the new selector matches exactly one element, applies it, and saves it back to the recipe — with a before/after entry in an audit log so you can see what changed. So the check heals and keeps running instead of just failing.

It's opt-in (you bring an Anthropic API key), defaults to the cheap Haiku model so heals cost basically nothing, and it's open source (MIT). Landing page: https://clickcron.vercel.app — repo: https://github.com/vijay-kapse/ClickCron. Would love feedback from anyone who runs scheduled checks.
