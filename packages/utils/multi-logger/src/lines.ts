/**
 * Splits a chunk of (possibly multi-line, ANSI-styled) text into lines. A
 * single trailing newline does not produce an extra empty line.
 */
export function splitLines(text: string): string[] {
  if (text.length === 0) return [];
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  if (lines.length > 1 && lines.at(-1) === '') lines.pop();
  return lines;
}
