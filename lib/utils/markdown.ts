export function transformLinkText(markdown: string, nyangInjection = false): string {
  const icon = nyangInjection ? '🐾' : '📎';
  return markdown.replace(/\[[^\]]*\]\(([^)]+)\)/g, `[${icon}]($1)`);
}
