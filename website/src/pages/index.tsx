import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import { useState } from 'react';

import Pipeline, { ElectronMark } from '../components/Pipeline';

import styles from './index.module.css';

const CREATE_COMMAND = 'npx create-electron-app@latest my-app';

const FEATURES = [
  {
    title: 'Templates',
    icon: 'templates',
    body: 'Start from Vite or webpack, in JavaScript or TypeScript.',
    items: ['Vite', 'Vite + TypeScript', 'webpack', 'webpack + TypeScript'],
    to: '/templates/vite/',
  },
  {
    title: 'Makers',
    icon: 'makers',
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
    icon: 'publishers',
    body: 'Ship builds and update feeds to the storage you already use.',
    items: ['GitHub', 'S3', 'Google Cloud Storage', 'Bitbucket', 'Snapcraft'],
    to: '/config/publishers/',
  },
  {
    title: 'Code signing',
    icon: 'signing',
    body: 'Sign and notarize on macOS, and sign installers on Windows.',
    items: ['macOS notarization', 'Windows signing'],
    to: '/guides/code-signing/',
  },
  {
    title: 'Plugins',
    icon: 'plugins',
    body: 'Hook into every step of the build, or use the first-party plugins.',
    items: ['Vite', 'webpack', 'Fuses', 'Auto unpack natives'],
    to: '/config/plugins/',
  },
  {
    title: 'Auto updates',
    icon: 'updates',
    body: 'Pair your publisher with an update server so users stay current.',
    items: ['update.electronjs.org', 'Static storage'],
    to: '/advanced/auto-update/',
  },
] as const;

type FeatureIcon = (typeof FEATURES)[number]['icon'];

/** Line icons on a 16px grid, in the same style as the pipeline's. */
const ICON_PATHS: Record<FeatureIcon, React.ReactNode> = {
  // A project laid out from a starting point.
  templates: (
    <>
      <rect x="2.5" y="2.5" width="11" height="11" rx="2" />
      <path d="M2.5 6h11M6 6v7.5" />
    </>
  ),
  // A package, ready to hand out.
  makers: (
    <>
      <path d="M8 1.75 13.75 4.75v6.5L8 14.25 2.25 11.25v-6.5Z" />
      <path d="M2.25 4.75 8 7.75l5.75-3M8 7.75v6.5" />
    </>
  ),
  // Up to the cloud.
  publishers: (
    <>
      <path d="M4.5 12.5h7a3 3 0 0 0 .4-6 4 4 0 0 0-7.8 1A2.5 2.5 0 0 0 4.5 12.5Z" />
      <path d="M8 11V7M6.5 8.5 8 7l1.5 1.5" />
    </>
  ),
  // A shield with a check.
  signing: (
    <>
      <path d="M8 1.75 13 3.75V7.5c0 3-2.1 5.4-5 6.75-2.9-1.35-5-3.75-5-6.75V3.75Z" />
      <path d="m5.75 8 1.6 1.6 2.9-3.1" />
    </>
  ),
  // A plug.
  plugins: (
    <>
      <path d="M6 1.75V5M10 1.75V5" />
      <path d="M4 5h8v2.5a4 4 0 0 1-8 0Z" />
      <path d="M8 11.5v2.75" />
    </>
  ),
  // Round arrows.
  updates: (
    <>
      <path d="M13 8a5 5 0 0 1-8.9 3.1M3 8a5 5 0 0 1 8.9-3.1" />
      <path d="M12.25 2.25v2.9h-2.9M3.75 13.75v-2.9h2.9" />
    </>
  ),
};

function Icon({ icon }: { icon: FeatureIcon }) {
  return (
    <span className={styles.cardIcon} aria-hidden="true">
      <svg
        width="18"
        height="18"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {ICON_PATHS[icon]}
      </svg>
    </span>
  );
}

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

/** A few embers rising off the hearth from the cards' base: left %, size px,
    seconds, delay, drift px. */
const EMBERS = [
  [6, 2, 10, 7, -16],
  [20, 3, 11, 0, 18],
  [36, 2, 9, 4.5, -14],
  [62, 3, 12, 2, 10],
  [78, 2, 13, 1, 16],
  [94, 3, 12, 5.5, -12],
];

function Embers() {
  return (
    <div className={styles.embers} aria-hidden="true">
      {EMBERS.map(([left, size, duration, delay, drift], i) => (
        <span
          key={i}
          style={
            {
              left: `${left}%`,
              width: size,
              height: size,
              animationDuration: `${duration}s`,
              animationDelay: `${-delay}s`,
              '--drift': `${drift}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

/** What `npm run make` leaves in out/make, one per platform. */
const CASTINGS = [
  {
    file: 'My App.msix',
    format: 'MSIX',
    platform: 'Windows',
  },
  { file: 'my-app.deb', format: 'DEB', platform: 'Linux' },
  { file: 'My App.dmg', format: 'DMG', platform: 'macOS' },
];

/** The hero's right side: fresh installers, fanned out on the hearth. */
function Castings() {
  return (
    <div className={styles.castings} aria-hidden="true">
      <Embers />
      {CASTINGS.map(({ file, format, platform }, i) => (
        <div key={format} className={styles.casting} data-slot={i}>
          <span className={styles.format}>{format}</span>
          <span className={styles.mark}>
            <ElectronMark size={44} />
          </span>
          <span className={styles.file}>{file}</span>
          <span className={styles.platform}>{platform}</span>
        </div>
      ))}
    </div>
  );
}

export default function Home(): React.ReactElement {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout description={siteConfig.tagline} wrapperClassName={styles.home}>
      <header className={styles.hero}>
        <div className={styles.intro}>
          <Link
            className={styles.badge}
            href="https://github.com/electron/forge/releases"
          >
            Electron Forge 8 is out
          </Link>
          <h1 className={styles.title}>
            Build, package and ship Electron apps.
          </h1>
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
        </div>
        {/* The right side: run this, get these. On small screens the cards
            hide and the command sits under the buttons. */}
        <div className={styles.forge}>
          <Castings />
          <CopyCommand />
        </div>
      </header>

      <main>
        <section className={styles.pipeline} aria-labelledby="pipeline">
          <h2 id="pipeline" className={styles.sectionTitle}>
            One pipeline, from first run to release
          </h2>
          <div className={styles.sheet}>
            <Pipeline />
          </div>
        </section>

        <section className={styles.features} aria-labelledby="features">
          <h2 id="features" className={styles.sectionTitle}>
            Everything a desktop release needs
          </h2>
          <div className={styles.grid}>
            {FEATURES.map((feature) => (
              <Link key={feature.title} className={styles.card} to={feature.to}>
                <Icon icon={feature.icon} />
                <span className={styles.cardTitle}>
                  {feature.title}
                  <span className={styles.cardArrow} aria-hidden="true">
                    →
                  </span>
                </span>
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
