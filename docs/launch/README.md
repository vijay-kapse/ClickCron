# ClickCron launch assets

This folder holds the copy for ClickCron's launch. Edit these before posting — they're starting drafts, not final word-for-word scripts.

## Files

- **show-hn.md** — Show HN post (title + body) for Hacker News.
- **product-hunt.md** — Product Hunt tagline, description, maker's first comment, and feature bullets.
- **reddit.md** — two posts: r/programming (technical) and r/webdev (practical).
- **twitter-thread.md** — 6-8 tweet launch thread for X/Twitter.

## Key facts to keep consistent everywhere

- Tagline: **Record once. Run forever.**
- Headline feature: **AI self-healing selectors** — relocate broken element from the accessibility tree, verify it resolves to exactly one element, persist the fix to the recipe, log a before/after heal event.
- Healing is opt-in (needs `ANTHROPIC_API_KEY`), defaults to the cheap Haiku model, and never silently swallows a real failure.
- Open source, MIT. Repo: https://github.com/vijay-kapse/ClickCron — Site: https://clickcron.vercel.app
- Install: `npx clickcron init`

## Suggested launch-day checklist

1. **Day before:** publish the package to npm and confirm `npx clickcron init` works from a clean machine. Make sure the landing page and README are live.
2. **Sanity check links:** repo, landing page, and npm all resolve; license is correct.
3. **Morning (PT):** post **Show HN** early (around 7-9am PT tends to land well). Use the exact title from show-hn.md.
4. **Be present:** stay in the HN thread for the first few hours and answer questions plainly — no marketing voice.
5. **Cross-post:** publish the Twitter/X thread, then the r/programming and r/webdev posts (space them out, don't blast all at once). Link back where it fits naturally.
6. **Product Hunt:** launch (00:01 PT for a full day of votes if you want the leaderboard) and drop the maker's first comment immediately.
7. **After:** triage GitHub issues quickly, thank early contributors, and note recurring feedback for the next iteration.

> Tone reminder: humble and concrete. ClickCron is early — say so. Don't overclaim the AI; it heals confident, unique matches and fails honestly otherwise.
