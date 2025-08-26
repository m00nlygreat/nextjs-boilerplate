export function replaceMarkdownLinkText(text: string, emoji: string): string {
  return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, `[${emoji}]($2)`);
}
