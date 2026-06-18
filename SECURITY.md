# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| 0.2.x   | ✅        |
| < 0.2   | ❌        |

## Reporting a Vulnerability

Please report security issues privately to **vijayskofficial@gmail.com**. Do not open a public
issue for anything that could put users at risk. We aim to acknowledge reports within 72 hours
and will keep you updated as we work on a fix.

When reporting, include:

- A description of the issue and its impact.
- Steps to reproduce, or a proof of concept.
- The ClickCron version (`clickcron --version`) and your OS/Node version.

## Handling Secrets

ClickCron is designed to live inside your repository, so a few rules keep you safe:

- **Never commit credentials, tokens, or session cookies.** Recorded specs and generated
  storage state can capture sensitive data — review them before committing.
- **Keep `ANTHROPIC_API_KEY` in your environment or CI secrets**, never in code or config
  files. AI self-healing reads it from the environment at run time only.
- ClickCron writes run artifacts (logs, screenshots, `result.json`) under `.clickcron/`, which
  is git-ignored by default. Keep it that way unless you are sure the contents are safe to share.

See [docs/secrets.md](./docs/secrets.md) for more detail.
