import Head from '@docusaurus/Head';
import Layout from '@theme/Layout';
import { useId } from 'react';

import { ElectronOrbits } from '../components/ElectronMark';

import styles from './logo-ideas.module.css';

/**
 * Scratch page: Forge logo concepts, side by side in light and dark and at
 * small sizes. Not linked from the site, and not meant to ship.
 */

/** Molten metal: a radial gradient from white-hot to ember, plus a soft glow. */
function Ember({ id }: { id: string }) {
  return (
    <defs>
      <radialGradient id={`${id}-hot`} cx="40%" cy="35%" r="70%">
        <stop offset="0" stopColor="#fff1c9" />
        <stop offset="0.35" stopColor="#ffb547" />
        <stop offset="0.75" stopColor="#ff6a1a" />
        <stop offset="1" stopColor="#c2410c" />
      </radialGradient>
      <radialGradient id={`${id}-glow`}>
        <stop offset="0" stopColor="#ff8a3d" stopOpacity="0.55" />
        <stop offset="1" stopColor="#ff8a3d" stopOpacity="0" />
      </radialGradient>
    </defs>
  );
}

/** Centre of the Electron mark's nucleus, in its 128×128 coordinates. */
const NX = 63.9;
const NY = 64;

/** 1. Hot nucleus: the Electron mark as is, with the nucleus white-hot. */
function HotNucleus() {
  const id = useId();
  return (
    <svg viewBox="19.5 15 92 92">
      <Ember id={id} />
      <circle cx={NX} cy={NY} r="17" fill={`url(#${id}-glow)`} />
      <ElectronOrbits />
      <circle cx={NX} cy={NY} r="6.5" fill={`url(#${id}-hot)`} />
    </svg>
  );
}

/** 2. Anvil atom: a small Electron mark being worked on an anvil. */
function Anvil() {
  const id = useId();
  return (
    <svg viewBox="0 0 128 128">
      <Ember id={id} />
      {/* The atom above the face, its nucleus glowing. */}
      <g transform="translate(64 34) scale(0.66) translate(-65.5 -61)">
        <circle cx={NX} cy={NY} r="20" fill={`url(#${id}-glow)`} />
        <ElectronOrbits />
        <circle cx={NX} cy={NY} r="7" fill={`url(#${id}-hot)`} />
      </g>
      {/* Heat on the anvil's face, under the atom. */}
      <ellipse cx="64" cy="74" rx="26" ry="5" fill={`url(#${id}-glow)`} />
      <path
        transform="translate(0 4)"
        fill="currentColor"
        d="M10 70.5c9 -1 18 -2.5 26 -4.5h70v4c0 6 -4 9.5 -12 10.5h-10c-6 1.5 -9 5 -9 10.5v5l11 6.5v6H41v-6l11 -6.5v-5c0 -5.5 -3 -9 -9 -10.5h-6c-11 -1 -19.5 -4.5 -27 -10Z"
      />
    </svg>
  );
}

/** 3. Hammer strike: one orbit, a hammer coming down on the nucleus, sparks. */
function Hammer() {
  const id = useId();
  return (
    <svg viewBox="0 0 128 128">
      <Ember id={id} />
      <circle cx="56" cy="76" r="20" fill={`url(#${id}-glow)`} />
      <ellipse
        cx="56"
        cy="76"
        rx="44"
        ry="15"
        transform="rotate(-24 56 76)"
        fill="none"
        stroke="currentColor"
        strokeWidth="5.5"
      />
      <circle cx="56" cy="76" r="7" fill={`url(#${id}-hot)`} />
      {/* Sparks flying off the strike. */}
      <g stroke="#ff7a1a" strokeWidth="3.6" strokeLinecap="round" fill="none">
        <path d="M44 62 38 54" />
        <path d="M40 72 30 70" />
        <path d="M50 58 49 48" />
      </g>
      {/* The hammer, mid-swing: head just above the nucleus, handle up-right. */}
      <g transform="translate(84 40) rotate(40)">
        <rect
          x="-3.2"
          y="-52"
          width="6.4"
          height="46"
          rx="3.2"
          fill="currentColor"
        />
        <rect
          x="-19"
          y="-9"
          width="38"
          height="17"
          rx="3.5"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

/** 4. Crucible: a tipped ladle pouring one drop, and the drop is the nucleus. */
function Crucible() {
  const id = useId();
  return (
    <svg viewBox="0 0 128 128">
      <Ember id={id} />
      <g transform="rotate(-24 62 44)">
        {/* Handle. */}
        <path
          d="M84 34h30"
          stroke="currentColor"
          strokeWidth="7"
          strokeLinecap="round"
        />
        {/* Molten metal, then the bowl over it. */}
        <path
          d="M37 34h48c-1 14 -10 24 -24 24s-23 -10 -24 -24Z"
          fill={`url(#${id}-hot)`}
        />
        <path
          d="M33 30h56v4c0 18 -12 30 -28 30s-28 -12 -28 -30Z M41 37c1.5 11 9 19 20 19s18.5 -8 20 -19Z"
          fillRule="evenodd"
          fill="currentColor"
        />
      </g>
      {/* The pour and the falling drop, inside one orbit. */}
      <path
        d="M37 52c-2 6 -3 12 -2 18"
        stroke="#ff7a1a"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="35" cy="94" r="16" fill={`url(#${id}-glow)`} />
      <ellipse
        cx="35"
        cy="94"
        rx="24"
        ry="8.5"
        transform="rotate(-20 35 94)"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.6"
      />
      <path
        d="M35 80c4 6 7.5 10 7.5 14a7.5 7.5 0 0 1 -15 0c0 -4 3.5 -8 7.5 -14Z"
        fill={`url(#${id}-hot)`}
      />
    </svg>
  );
}

const IDEAS = [
  {
    name: 'Hot nucleus',
    body: 'The Electron mark unchanged, with a white-hot nucleus. The smallest step from Electron.',
    Mark: HotNucleus,
  },
  {
    name: 'Anvil atom',
    body: 'A small Electron mark being worked on an anvil, its nucleus glowing.',
    Mark: Anvil,
  },
  {
    name: 'Hammer strike',
    body: 'One orbit, with a hammer coming down on the nucleus and sparks flying off.',
    Mark: Hammer,
  },
  {
    name: 'Crucible',
    body: 'A tipped ladle pours a single drop, and the drop is the nucleus inside an orbit.',
    Mark: Crucible,
  },
];

export default function LogoIdeas(): React.ReactElement {
  return (
    <Layout title="Logo ideas" wrapperClassName={styles.page}>
      <Head>
        <meta name="robots" content="noindex" />
      </Head>
      <main className={styles.main}>
        <h1 className={styles.title}>Forge logo ideas</h1>
        <p className={styles.lead}>
          Rough concepts, not final art. Each is shown on light and dark, then
          at 64, 32 and 16px.
        </p>
        <div className={styles.grid}>
          {IDEAS.map(({ name, body, Mark }) => (
            <section key={name} className={styles.card}>
              <div className={styles.pair}>
                <div className={`${styles.tile} ${styles.light}`}>
                  <Mark />
                </div>
                <div className={`${styles.tile} ${styles.dark}`}>
                  <Mark />
                </div>
              </div>
              <div className={styles.sizes}>
                {[styles.light, styles.dark].map((tone) => (
                  <div key={tone} className={`${styles.sizeRow} ${tone}`}>
                    {[64, 32, 16].map((size) => (
                      <span
                        key={size}
                        className={styles.size}
                        style={{ width: size, height: size }}
                      >
                        <Mark />
                      </span>
                    ))}
                  </div>
                ))}
              </div>
              <h2 className={styles.name}>{name}</h2>
              <p className={styles.body}>{body}</p>
            </section>
          ))}
        </div>
      </main>
    </Layout>
  );
}
