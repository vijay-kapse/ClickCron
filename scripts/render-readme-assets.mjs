import { mkdir, readdir, rename, rm } from 'node:fs/promises';
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

function lineMarkup(lines) {
  return lines
    .map((line, index) => {
      const className = line.startsWith('$') ? 'prompt' : 'success';
      return `<div class="terminal-line ${className}" style="--delay:${index * 0.55}s">${line}</div>`;
    })
    .join('');
}

function baseHtml({ animated = false } = {}) {
  const animationClass = animated ? 'animated' : 'still';

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
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

      .scene {
        width: ${width}px;
        height: ${height}px;
        padding: 58px 66px;
        display: grid;
        grid-template-columns: 0.92fr 1.08fr;
        gap: 44px;
        align-items: center;
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

      h1 {
        margin: 26px 0 18px;
        font-size: 83px;
        line-height: 0.92;
        letter-spacing: 0;
      }

      .tagline {
        margin: 0 0 30px;
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

      .pill {
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
        min-height: 478px;
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
        padding: 28px;
        display: grid;
        gap: 12px;
        font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
        font-size: 17px;
        line-height: 1.35;
      }

      .terminal-line {
        opacity: 1;
        transform: translateY(0);
        white-space: nowrap;
      }

      .prompt {
        color: #d8dee9;
      }

      .success {
        color: #56e39f;
      }

      .animated .terminal-line {
        opacity: 0;
        transform: translateY(12px);
        animation: reveal 0.42s ease-out forwards;
        animation-delay: var(--delay);
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

      .animated .step {
        animation: pulse 1.8s ease-in-out infinite;
      }

      .animated .step:nth-child(2) {
        animation-delay: 0.6s;
      }

      .animated .step:nth-child(3) {
        animation-delay: 1.2s;
      }

      @keyframes reveal {
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes pulse {
        0%,
        100% {
          border-color: rgba(255, 255, 255, 0.12);
          transform: translateY(0);
        }

        50% {
          border-color: rgba(86, 227, 159, 0.75);
          transform: translateY(-5px);
        }
      }
    </style>
  </head>
  <body>
    <main class="scene ${animationClass}">
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
      <section class="terminal" aria-label="ClickCron terminal demo">
        <div class="chrome">
          <span class="light red"></span>
          <span class="light yellow"></span>
          <span class="light green"></span>
          clickcron demo
        </div>
        <div class="terminal-body">
          ${lineMarkup(shellLines)}
        </div>
        <div class="workflow">
          <div class="step"><strong>1. Record</strong><span>Capture a browser journey with Playwright codegen.</span></div>
          <div class="step"><strong>2. Run</strong><span>Save logs, JSON results, and screenshots for debugging.</span></div>
          <div class="step"><strong>3. Schedule</strong><span>Generate GitHub Actions or local cron templates.</span></div>
        </div>
      </section>
    </main>
  </body>
</html>`;
}

async function render() {
  await mkdir(assetDir, { recursive: true });
  await rm(path.join(assetDir, 'clickcron-hero.png'), { force: true });
  await rm(path.join(assetDir, 'clickcron-demo.webm'), { force: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await page.setContent(baseHtml(), { waitUntil: 'load' });
  await page.screenshot({ path: path.join(assetDir, 'clickcron-hero.png') });
  await page.close();

  const context = await browser.newContext({
    viewport: { width, height },
    recordVideo: {
      dir: assetDir,
      size: { width, height }
    }
  });
  const videoPage = await context.newPage();
  await videoPage.setContent(baseHtml({ animated: true }), { waitUntil: 'load' });
  await videoPage.waitForTimeout(6800);
  const video = videoPage.video();
  await context.close();
  await browser.close();

  if (!video) {
    throw new Error('Playwright did not produce a video handle.');
  }

  const generatedVideoPath = await video.path();
  await rename(generatedVideoPath, path.join(assetDir, 'clickcron-demo.webm'));

  const leftoverVideos = (await readdir(assetDir)).filter(
    (file) => file.endsWith('.webm') && file !== 'clickcron-demo.webm'
  );
  await Promise.all(leftoverVideos.map((file) => rm(path.join(assetDir, file), { force: true })));

  console.log(`Rendered README assets in ${assetDir}`);
}

render().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
