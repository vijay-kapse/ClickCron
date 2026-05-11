export interface GithubActionTemplateParams {
  name: string;
  cron: string;
}

export function renderGithubActionTemplate(params: GithubActionTemplateParams): string {
  return `name: clickcron-${params.name}

on:
  workflow_dispatch:
  schedule:
    - cron: '${params.cron}'

jobs:
  run:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run ClickCron automation
        run: npx clickcron run ${params.name}

      - name: Upload run artifacts
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: clickcron-${params.name}-artifacts
          path: |
            .clickcron/runs
            .clickcron/screenshots
`;
}
