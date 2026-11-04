import Link from '@docusaurus/Link';
import Translate from '@docusaurus/Translate';
import useBaseUrl from '@docusaurus/useBaseUrl';
import type { Props } from '@theme/NotFound/Content';
import ThemedImage from '@theme/ThemedImage';
import clsx from 'clsx';
import React from 'react';

import styles from './styles.module.css';

// The 404 page: a small centred hero on the sheet, with the Forge mark and
// the places people usually meant to go.
const links = [
  { to: '/getting-started/', label: 'Getting started' },
  { to: '/cli/', label: 'CLI' },
  { to: '/config/configuration/', label: 'Configuration' },
];

export default function NotFoundContent({
  className,
}: Props): React.JSX.Element {
  return (
    <main className={clsx('container', styles.notFound, className)}>
      <ThemedImage
        className={styles.mark}
        sources={{
          light: useBaseUrl('/img/mark.svg'),
          dark: useBaseUrl('/img/mark-dark.svg'),
        }}
        alt=""
        width={64}
        height={64}
      />
      <p className={styles.code}>404</p>
      <h1 className={styles.title}>
        <Translate
          id="theme.NotFound.title"
          description="The title of the 404 page"
        >
          Page Not Found
        </Translate>
      </h1>
      <p className={styles.text}>
        <Translate
          id="theme.NotFound.p1"
          description="The first paragraph of the 404 page"
        >
          We could not find what you were looking for.
        </Translate>{' '}
        <Translate
          id="theme.NotFound.p2"
          description="The 2nd paragraph of the 404 page"
        >
          Please contact the owner of the site that linked you to the original
          URL and let them know their link is broken.
        </Translate>
      </p>
      <nav className={styles.links} aria-label="Suggested pages">
        {links.map(({ to, label }, i) => (
          <Link
            key={to}
            to={to}
            className={clsx(
              'button',
              i === 0 ? 'button--primary' : 'button--secondary',
            )}
          >
            {label}
          </Link>
        ))}
      </nav>
    </main>
  );
}
