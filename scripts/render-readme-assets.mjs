import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const assetDir = path.join(rootDir, 'docs', 'assets');
const width = 1280;
const height = 720;

const shellLines = [
  '$ npx clickcron init',
  '[ok] Project ready: .clickcron/',
  '$ npx clickcron record price-watch',
  '[ok] Saved Playwright script + metadata',
  '$ npx clickcron schedule price-watch daily',
  '[ok] Workflow ready for GitHub Actions'
];

const examples = [
  {
    name: 'Price checker',
    command: 'clickcron schedule price-checker daily',
    copy: 'Watch product price, inventory, and CTA state.'
  },
  {
    name: 'Screenshot monitor',
    command: 'clickcron schedule screenshot-monitor hourly',
    copy: 'Capture a stable page state with logs and artifacts.'
  },
  {
    name: 'Form checker',
    command: 'clickcron schedule form-checker daily',
    copy: 'Smoke test owned forms with safe test submissions.'
  },
  {
    name: 'Job board monitor',
    command: 'clickcron schedule job-board-monitor hourly',
    copy: 'Track listings, filters, and result page availability.'
  }
];

function lineMarkup(lines) {
  return lines
    .map((line) => {
      const className = line.startsWith('$') ? 'prompt' : 'success';
      return `<div class="terminal-line ${className}">${line}</div>`;
    })
    .join('');
}

function sharedStyles() {
  return `
    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      width: ${width}px;
      height: ${height}px;
      overflow: hidden;
      background:
        radial-gradient(circle at 14% 14%, rgba(255, 79, 129, 0.26), transparent 30%),
        radial-gradient(circle at 86% 18%, rgba(15, 165, 255, 0.24), transparent 28%),
        linear-gradient(135deg, #fffdf8 0%, #f5fbff 45%, #fff9fb 100%);
      color: #111318;
      font-family:
        Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    h1,
    h2,
    p {
      margin: 0;
    }

    .eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 9px 13px;
      border: 1px solid rgba(17, 19, 24, 0.12);
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.72);
      color: #314050;
      font-size: 17px;
      font-weight: 760;
    }

    .dot {
      width: 10px;
      height: 10px;
      border-radius: 999px;
      background: #0bbf87;
      box-shadow: 0 0 0 6px rgba(11, 191, 135, 0.14);
    }

    .pill {
      display: inline-flex;
      align-items: center;
      min-height: 44px;
      padding: 12px 14px;
      border-radius: 16px;
      background: #111318;
      color: #ffffff;
      font-size: 16px;
      font-weight: 760;
      box-shadow: 0 14px 34px rgba(17, 19, 24, 0.16);
    }

    .pill.alt {
      background: #ffffff;
      color: #111318;
      border: 1px solid rgba(17, 19, 24, 0.12);
    }

    .terminal {
      position: relative;
      overflow: hidden;
      border-radius: 24px;
      background: #111318;
      border: 1px solid rgba(255, 255, 255, 0.12);
      box-shadow: 0 32px 74px rgba(17, 19, 24, 0.28);
    }

    .terminal::after {
      content: "";
      position: absolute;
      inset: 0;
      pointer-events: none;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.13), transparent 34%);
    }

    .chrome {
      height: 58px;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 0 22px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      color: #acb6c4;
      font-size: 15px;
      font-weight: 720;
    }

    .light {
      width: 13px;
      height: 13px;
      border-radius: 999px;
    }

    .red {
      background: #ff5f57;
    }

    .yellow {
      background: #febc2e;
    }

    .green {
      background: #28c840;
      margin-right: 12px;
    }

    .terminal-body {
      display: grid;
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
      line-height: 1.35;
    }

    .terminal-line {
      white-space: nowrap;
    }

    .prompt {
      color: #d8dee9;
    }

    .success {
      color: #56e39f;
    }
  `;
}

function pageHtml(content) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>${sharedStyles()}${content.styles}</style>
  </head>
  <body>${content.body}</body>
</html>`;
}

function heroHtml() {
  return pageHtml({
    styles: `
      .scene {
        width: ${width}px;
        height: ${height}px;
        padding: 58px 66px;
        display: grid;
        grid-template-columns: 0.92fr 1.08fr;
        gap: 44px;
        align-items: center;
      }

      h1 {
        margin: 26px 0 18px;
        font-size: 83px;
        line-height: 0.92;
        letter-spacing: 0;
      }

      .tagline {
        margin-bottom: 30px;
        max-width: 485px;
        color: #364255;
        font-size: 28px;
        line-height: 1.25;
        font-weight: 640;
      }

      .pill-row {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
      }

      .hero-terminal {
        min-height: 478px;
      }

      .hero-terminal .terminal-body {
        padding: 28px;
        gap: 12px;
        font-size: 17px;
      }

      .workflow {
        position: absolute;
        right: 30px;
        bottom: 24px;
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
        width: calc(100% - 60px);
      }

      .step {
        padding: 16px 15px;
        border-radius: 18px;
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.12);
        color: #ffffff;
      }

      .step strong {
        display: block;
        margin-bottom: 5px;
        color: #ffffff;
        font-size: 17px;
      }

      .step span {
        color: #acb6c4;
        font-size: 13px;
        line-height: 1.3;
      }
    `,
    body: `
      <main class="scene">
        <section>
          <div class="eyebrow"><span class="dot"></span> Playwright flows, scheduled like cron</div>
          <h1>ClickCron</h1>
          <p class="tagline">Record a browser check once, then run it locally, in CI, or on a schedule with artifacts you can trust.</p>
          <div class="pill-row">
            <span class="pill">CLI-first</span>
            <span class="pill alt">GitHub Actions ready</span>
            <span class="pill alt">Screenshots + logs</span>
          </div>
        </section>
        <section class="terminal hero-terminal" aria-label="ClickCron terminal screenshot">
          <div class="chrome">
            <span class="light red"></span>
            <span class="light yellow"></span>
            <span class="light green"></span>
            clickcron demo
          </div>
          <div class="terminal-body">${lineMarkup(shellLines)}</div>
          <div class="workflow">
            <div class="step"><strong>1. Record</strong><span>Capture a browser journey with Playwright codegen.</span></div>
            <div class="step"><strong>2. Run</strong><span>Save logs, JSON results, and screenshots for debugging.</span></div>
            <div class="step"><strong>3. Schedule</strong><span>Generate GitHub Actions or local cron templates.</span></div>
          </div>
        </section>
      </main>
    `
  });
}

function examplesHtml() {
  return pageHtml({
    styles: `
      .scene {
        width: ${width}px;
        height: ${height}px;
        padding: 50px 64px;
        display: grid;
        grid-template-rows: auto 1fr;
        gap: 28px;
      }

      .header {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 28px;
        align-items: end;
      }

      h1 {
        margin-top: 18px;
        max-width: 780px;
        font-size: 58px;
        line-height: 0.96;
        letter-spacing: 0;
      }

      .subcopy {
        max-width: 415px;
        color: #364255;
        font-size: 24px;
        line-height: 1.25;
        font-weight: 640;
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 18px;
        align-items: stretch;
      }

      .card {
        display: grid;
        grid-template-rows: auto auto 1fr auto;
        gap: 14px;
        min-height: 330px;
        padding: 22px;
        border-radius: 24px;
        background: rgba(255, 255, 255, 0.82);
        border: 1px solid rgba(17, 19, 24, 0.12);
        box-shadow: 0 24px 62px rgba(17, 19, 24, 0.14);
      }

      .badge {
        width: 48px;
        height: 48px;
        display: grid;
        place-items: center;
        border-radius: 16px;
        background: #111318;
        color: #ffffff;
        font-size: 23px;
        font-weight: 820;
      }

      h2 {
        color: #111318;
        font-size: 26px;
        line-height: 1.03;
        letter-spacing: 0;
      }

      .copy {
        color: #364255;
        font-size: 18px;
        line-height: 1.35;
        font-weight: 620;
      }

      .command {
        align-self: end;
        min-height: 88px;
        padding: 16px;
        border-radius: 18px;
        background: #111318;
        color: #d8dee9;
        font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
        font-size: 12px;
        line-height: 1.45;
      }

      .command strong {
        display: block;
        margin-bottom: 8px;
        color: #56e39f;
        font-family:
          Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        font-size: 13px;
      }
    `,
    body: `
      <main class="scene">
        <section class="header">
          <div>
            <div class="eyebrow"><span class="dot"></span> Four starter workflows</div>
            <h1>Ready-made examples for the browser checks teams actually forget.</h1>
          </div>
          <p class="subcopy">Each recipe includes a recording path, a hardened Playwright snippet, scheduling command, and safety notes.</p>
        </section>
        <section class="grid">
          ${examples
            .map(
              (example, index) => `
                <article class="card">
                  <div class="badge">${index + 1}</div>
                  <h2>${example.name}</h2>
                  <p class="copy">${example.copy}</p>
                  <div class="command">
                    <strong>Schedule</strong>
                    $ ${example.command}
                  </div>
                </article>
              `
            )
            .join('')}
        </section>
      </main>
    `
  });
}

async function screenshot(page, html, filename) {
  await page.setContent(html, { waitUntil: 'load' });
  await page.screenshot({ path: path.join(assetDir, filename) });
}

async function render() {
  await mkdir(assetDir, { recursive: true });
  await rm(path.join(assetDir, 'clickcron-hero.png'), { force: true });
  await rm(path.join(assetDir, 'clickcron-examples.png'), { force: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });

  await screenshot(page, heroHtml(), 'clickcron-hero.png');
  await screenshot(page, examplesHtml(), 'clickcron-examples.png');

  await browser.close();

  console.log(`Rendered README screenshots in ${assetDir}`);
}

render().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
