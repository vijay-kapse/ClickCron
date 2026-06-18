# Launch thread (X / Twitter)

**1/**
Your scheduled browser check hits a button that moved in last night's redesign. The selector breaks. Normally: red build, you fix it by hand.

With ClickCron: Claude finds the element again from the page's accessibility tree, repairs the selector, and the check stays green. 🟢

**2/**
The problem: "Playwright script + cron" is great until a site changes one class name. Then the check dies and just sits there red until a human notices and patches it. Synthetic-monitoring SaaS solves it but it's heavy and lives outside your repo.

**3/**
How the healing works: when a selector fails to resolve, ClickCron snapshots the live page's accessibility tree, asks Claude to relocate the element, then verifies the new selector matches EXACTLY one element before using it. No confident match → the run still fails honestly.

**4/**
And it sticks: the repaired selector gets persisted back to your recipe, plus a before/after heal event in an audit log. So you can see exactly what changed and why. Next run uses the healed selector — no re-recording.

**5/**
The flow is three commands:
record → capture a click path (Playwright codegen)
run → replay it, save logs + screenshot + JSON
schedule → generate a GitHub Actions workflow from a cron alias or raw cron

Record once. Run forever.

**6/**
Healing is opt-in (bring an ANTHROPIC_API_KEY) and defaults to the cheap Haiku model, so a heal costs a fraction of a cent. Everything else runs with zero AI.

**7/**
It's tiny, git-native, and MIT-licensed. Recipes live in your repo, not a dashboard.

Try it: npx clickcron init
Repo: https://github.com/vijay-kapse/ClickCron
Site: https://clickcron.vercel.app
