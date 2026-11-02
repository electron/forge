import Link from '@docusaurus/Link';
import { usePrismTheme } from '@docusaurus/theme-common';
import Container from '@theme/CodeBlock/Container';
import type { CSSProperties, ReactNode } from 'react';

import styles from './styles.module.css';

// [text, kind, href?] from website/typedoc/declaration-preview.mjs
type Token = [text: string, kind?: string, href?: string];

/**
 * The TypeScript declaration summary at the top of an API reference page.
 * Rendered from tokens rather than a fenced code block so that referenced
 * types can link to their own pages.
 */
export default function ApiDeclaration({
  tokens,
}: {
  tokens: Token[];
}): ReactNode {
  const prism = usePrismTheme();
  const styleFor = (kind?: string): CSSProperties | undefined =>
    prism.styles.find((entry) => kind && entry.types.includes(kind))?.style;

  return (
    <Container as="div" className={styles.declaration}>
      <pre className={styles.pre}>
        <code>
          {tokens.map(([text, kind, href], i) => {
            const style = styleFor(kind);
            if (!href) {
              return (
                <span key={i} style={style}>
                  {text}
                </span>
              );
            }
            return (
              <Link key={i} to={href} style={style} className={styles.link}>
                {text}
              </Link>
            );
          })}
        </code>
      </pre>
    </Container>
  );
}
