export function renderLocalCronTemplate(params: { name: string; cron: string }): string {
  return `# Local cron support is informational only and not automatically installed by ClickCron.
# Add the line below to your crontab manually (run: crontab -e) and ensure it executes from your repo root.
${params.cron} cd /path/to/your/repo && npx clickcron run ${params.name} --headless
`;
}
