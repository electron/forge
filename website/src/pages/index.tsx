import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import { useState } from 'react';

import styles from './index.module.css';

const CREATE_COMMAND = 'npx create-electron-app@latest my-app';

const STEPS = [
  {
    command: 'start',
    title: 'Develop',
    body: 'Run your app with live reload for the main and renderer processes.',
    to: '/cli/#start',
  },
  {
    command: 'package',
    title: 'Package',
    body: 'Bundle an executable for each platform, with native modules rebuilt and macOS signing handled.',
    to: '/core-concepts/build-lifecycle/#step-1-package',
  },
  {
    command: 'make',
    title: 'Make',
    body: 'Turn that bundle into installers and archives your users can download.',
    to: '/core-concepts/build-lifecycle/#step-2-make',
  },
  {
    command: 'release',
    title: 'Publish',
    body: 'Upload the results to wherever you distribute updates.',
    to: '/core-concepts/build-lifecycle/#step-3-publish',
  },
];

const FEATURES = [
  {
    title: 'Templates',
    body: 'Start from Vite or webpack, in JavaScript or TypeScript.',
    items: ['Vite', 'Vite + TypeScript', 'webpack', 'webpack + TypeScript'],
    to: '/templates/vite/',
  },
  {
    title: 'Makers',
    body: 'Native installers and archives for every desktop platform.',
    items: [
      'DMG',
      'pkg',
      'MSIX',
      'Squirrel',
      'WiX MSI',
      'deb',
      'RPM',
      'Flatpak',
      'Snap',
      'ZIP',
    ],
    to: '/config/makers/',
  },
  {
    title: 'Publishers',
    body: 'Ship builds and update feeds to the storage you already use.',
    items: ['GitHub', 'S3', 'Google Cloud Storage', 'Bitbucket', 'Snapcraft'],
    to: '/config/publishers/',
  },
  {
    title: 'Code signing',
    body: 'Sign and notarize on macOS, and sign installers on Windows.',
    items: ['macOS notarization', 'Windows signing'],
    to: '/guides/code-signing/',
  },
  {
    title: 'Plugins',
    body: 'Hook into every step of the build, or use the first-party plugins.',
    items: ['Vite', 'webpack', 'Fuses', 'Auto unpack natives'],
    to: '/config/plugins/',
  },
  {
    title: 'Auto updates',
    body: 'Pair your publisher with an update server so users stay current.',
    items: ['update.electronjs.org', 'Static storage'],
    to: '/advanced/auto-update/',
  },
];

function CopyCommand() {
  const [copied, setCopied] = useState(false);
  return (
    <div className={styles.command}>
      <span className={styles.prompt} aria-hidden="true">
        $
      </span>
      <code>{CREATE_COMMAND}</code>
      <button
        type="button"
        className={styles.copy}
        onClick={() => {
          void navigator.clipboard.writeText(CREATE_COMMAND).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
          });
        }}
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}

export default function Home(): React.ReactElement {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout description={siteConfig.tagline} wrapperClassName={styles.home}>
      <header className={styles.hero}>
        <Link
          className={styles.badge}
          href="https://github.com/electron/forge/releases"
        >
          Electron Forge 8 is out
        </Link>
        <h1 className={styles.title}>Build, package and ship Electron apps.</h1>
        <p className={styles.lead}>
          Forge is the all-in-one toolchain for Electron. Scaffold a project,
          then package, sign, make installers for every platform and publish,
          with one command each.
        </p>
        <div className={styles.actions}>
          <Link className="button button--primary" to="/getting-started/">
            Get started
          </Link>
          <Link
            className="button button--secondary"
            href="https://github.com/electron/forge"
          >
            View on GitHub
          </Link>
        </div>
        <CopyCommand />
      </header>

      <main>
        <section className={styles.sheet} aria-labelledby="pipeline">
          <h2 id="pipeline" className={styles.sectionTitle}>
            One pipeline, from first run to release
          </h2>
          <ol className={styles.steps}>
            {STEPS.map((step, i) => (
              <li key={step.command}>
                <Link className={styles.step} to={step.to}>
                  <span className={styles.stepIndex}>{i + 1}</span>
                  <span className={styles.stepTitle}>{step.title}</span>
                  <code className={styles.stepCommand}>
                    electron-forge {step.command}
                  </code>
                  <span className={styles.stepBody}>{step.body}</span>
                </Link>
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.features} aria-labelledby="features">
          <h2 id="features" className={styles.sectionTitle}>
            Everything a desktop release needs
          </h2>
          <div className={styles.grid}>
            {FEATURES.map((feature) => (
              <Link key={feature.title} className={styles.card} to={feature.to}>
                <span className={styles.cardTitle}>{feature.title}</span>
                <span className={styles.cardBody}>{feature.body}</span>
                <span className={styles.chips}>
                  {feature.items.map((item) => (
                    <span key={item} className={styles.chip}>
                      {item}
                    </span>
                  ))}
                </span>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </Layout>
  );
}
