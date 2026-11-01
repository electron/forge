import Link from '@docusaurus/Link';

import styles from './Pipeline.module.css';

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

/**
 * What an app looks like on each stretch of the line. Each station sits between
 * two stretches: what goes in on its left comes out on its right.
 */
const FORMS = [
  { label: 'template', icon: 'template' },
  { label: 'src/', icon: 'source' },
  { label: 'My App.app', icon: 'bundle' },
  { label: '.dmg .exe .deb', icon: 'installers' },
  { label: 'v1.0.0', icon: 'release' },
] as const;

type Icon = (typeof FORMS)[number]['icon'];

/** Apps on the line at once, evenly spaced. */
const ITEMS = 3;

function FormIcon({ icon }: { icon: Icon }) {
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
  switch (icon) {
    case 'template':
      return (
        <svg {...common}>
          <path d="M4 2.5h5l3 3v8H4z" />
          <path d="M8 7.5v4M6 9.5h4" />
        </svg>
      );
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
 * The build pipeline as a factory line: apps ride a conveyor at a steady pace,
 * pass through a station for each step, and come out the other side in their
 * next form (template, source, app bundle, installers, release). Pure CSS, so
 * it runs without JavaScript and pauses under reduced motion.
 */
export default function Pipeline(): React.ReactElement {
  return (
    <div className={styles.pipeline}>
      <div className={styles.line} aria-hidden="true">
        <div className={styles.belt} />
        {Array.from({ length: ITEMS }, (_, i) => (
          <div
            key={i}
            className={styles.item}
            style={{ '--i': i } as React.CSSProperties}
          >
            {FORMS.map((form, f) => (
              <span key={form.icon} className={styles.form} data-form={f}>
                <span className={styles.tile}>
                  <FormIcon icon={form.icon} />
                </span>
                <span className={styles.label}>{form.label}</span>
              </span>
            ))}
          </div>
        ))}
        {STEPS.map((step, i) => (
          <div
            key={step.command}
            className={styles.station}
            style={{ '--s': i } as React.CSSProperties}
          >
            <span className={styles.stationLight} />
            <span className={styles.stationName}>{step.title}</span>
          </div>
        ))}
      </div>

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
    </div>
  );
}
