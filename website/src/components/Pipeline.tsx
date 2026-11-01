import Link from '@docusaurus/Link';
import { useEffect, useState } from 'react';

import styles from './Pipeline.module.css';

type Artifact = 'source' | 'bundle' | 'installers' | 'release';

const STEPS: {
  command: string;
  title: string;
  body: string;
  to: string;
  artifact: Artifact;
  label: string;
}[] = [
  {
    command: 'start',
    title: 'Develop',
    body: 'Run your app with live reload for the main and renderer processes.',
    to: '/cli/#start',
    artifact: 'source',
    label: 'my-app/src',
  },
  {
    command: 'package',
    title: 'Package',
    body: 'Bundle an executable for each platform, with native modules rebuilt and macOS signing handled.',
    to: '/core-concepts/build-lifecycle/#step-1-package',
    artifact: 'bundle',
    label: 'My App.app',
  },
  {
    command: 'make',
    title: 'Make',
    body: 'Turn that bundle into installers and archives your users can download.',
    to: '/core-concepts/build-lifecycle/#step-2-make',
    artifact: 'installers',
    label: '.dmg  .exe  .deb',
  },
  {
    command: 'release',
    title: 'Publish',
    body: 'Upload the results to wherever you distribute updates.',
    to: '/core-concepts/build-lifecycle/#step-3-publish',
    artifact: 'release',
    label: 'v1.0.0 released',
  },
];

const cx = (...names: (string | false | undefined)[]) =>
  names.filter(Boolean).join(' ');

/** How long the app rests at each step, and how long it takes to fade back to the start. */
const DWELL_MS = 2400;
const RESET_MS = 320;

function ArtifactIcon({ artifact }: { artifact: Artifact }) {
  const common = {
    width: 16,
    height: 16,
    viewBox: '0 0 16 16',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.4,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };
  switch (artifact) {
    case 'source':
      return (
        <svg {...common}>
          <path d="M5.5 4.5 2 8l3.5 3.5M10.5 4.5 14 8l-3.5 3.5" />
        </svg>
      );
    case 'bundle':
      return (
        <svg {...common}>
          <rect x="2.5" y="2.5" width="11" height="11" rx="3" />
          <path d="M5.5 6h5M5.5 8.5h3" />
        </svg>
      );
    case 'installers':
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="5.5" />
          <circle cx="8" cy="8" r="1.5" />
        </svg>
      );
    case 'release':
      return (
        <svg {...common}>
          <path d="M4.5 12h7a3 3 0 0 0 .4-6 4 4 0 0 0-7.8 1A2.5 2.5 0 0 0 4.5 12Z" />
          <path d="M8 10.5v-4M6.5 8 8 6.5 9.5 8" />
        </svg>
      );
  }
}

/**
 * The build pipeline: an app travels from Develop to Publish, changing form at
 * each step (source, app bundle, installers, a release). Hovering or focusing a
 * step moves the app there. With reduced motion, the app only moves on hover or
 * focus, without the slide.
 */
export default function Pipeline(): React.ReactElement {
  const [active, setActive] = useState(0);
  const [hidden, setHidden] = useState(false);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (paused || reducedMotion) return undefined;
    let reset: ReturnType<typeof setTimeout> | undefined;
    const tick = setTimeout(() => {
      if (active < STEPS.length - 1) {
        setActive(active + 1);
        return;
      }
      // Back to the start: fade out, jump, fade in, rather than sliding backwards.
      setHidden(true);
      reset = setTimeout(() => {
        setActive(0);
        setHidden(false);
      }, RESET_MS);
    }, DWELL_MS);
    return () => {
      clearTimeout(tick);
      if (reset) clearTimeout(reset);
    };
  }, [active, paused, reducedMotion]);

  const step = STEPS[active];
  // Column centres: 12.5%, 37.5%, 62.5%, 87.5%.
  const position = `${(active + 0.5) * (100 / STEPS.length)}%`;
  const progress = `${(active / (STEPS.length - 1)) * 75}%`;

  return (
    <div
      className={styles.pipeline}
      onMouseLeave={() => setPaused(false)}
      onBlur={() => setPaused(false)}
    >
      <div className={styles.track} aria-hidden="true">
        <div className={styles.rail} />
        <div className={styles.fill} style={{ width: progress }} />
        {STEPS.map((s, i) => (
          <span
            key={s.command}
            className={cx(styles.node, i <= active && styles.nodeDone)}
            style={{ left: `${(i + 0.5) * (100 / STEPS.length)}%` }}
          />
        ))}
        <div
          className={cx(styles.token, hidden && styles.tokenHidden)}
          style={{ left: position }}
        >
          <span key={step.artifact} className={styles.tokenInner}>
            <ArtifactIcon artifact={step.artifact} />
            <span>{step.label}</span>
          </span>
        </div>
      </div>

      <ol className={styles.steps}>
        {STEPS.map((s, i) => (
          <li key={s.command}>
            <Link
              className={cx(styles.step, i === active && styles.stepActive)}
              to={s.to}
              onMouseEnter={() => {
                setPaused(true);
                setHidden(false);
                setActive(i);
              }}
              onFocus={() => {
                setPaused(true);
                setHidden(false);
                setActive(i);
              }}
            >
              <span className={styles.stepIndex}>{i + 1}</span>
              <span className={styles.stepTitle}>{s.title}</span>
              <code className={styles.stepCommand}>
                electron-forge {s.command}
              </code>
              <span className={styles.stepBody}>{s.body}</span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
