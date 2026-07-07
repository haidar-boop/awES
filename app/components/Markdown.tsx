import { marked } from 'marked';

/**
 * Render trusted (site-authored/admin-authored) markdown. Never used for
 * raw user-generated content — comments render as plain text.
 */
export function Markdown({ children, className = '' }: { children: string; className?: string }) {
  const html = marked.parse(children, { async: false }) as string;
  return <div className={`prose-penny ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
}
