import Layout from '@theme/Layout';

import { ILLUSTRATOR_SVGS } from './_logo-illustrator';

/** Temporary: fire-based Forge logo sketches. Not linked from anywhere. */

const ORBITS = (
  <g fill="none" stroke="currentColor" strokeWidth={3}>
    <ellipse cx="32" cy="32" rx="27" ry="10" />
    <ellipse cx="32" cy="32" rx="27" ry="10" transform="rotate(60 32 32)" />
    <ellipse cx="32" cy="32" rx="27" ry="10" transform="rotate(120 32 32)" />
  </g>
);

const SMALL_FLAME =
  'M32 22c4 5 7 8 7 12.5a7 7 0 0 1-14 0c0-3 1.5-5 3.2-6.4.2 2.6 1.4 4 2.8 4.4-.8-3.8-.4-7.4 1-10.5Z';

const HEARTH_FLAME =
  'M32 7c7 8 13 14 13 23a13 13 0 0 1-26 0c0-6 3-10 6.5-12.5.4 4.5 2.4 7 5 7.8-1.6-6-.8-12.5 1.5-18.3Z';

/** The orbit: tilted like Electron's, centred under the flame. */
const ORBIT = { cx: 32, cy: 33, rx: 28, ry: 9.5, tilt: -18 };
const rad = (ORBIT.tilt * Math.PI) / 180;
/** A point on the orbit, `t` degrees round from its right end. */
function onOrbit(t: number) {
  const a = (t * Math.PI) / 180;
  return [
    ORBIT.cx +
      ORBIT.rx * Math.cos(a) * Math.cos(rad) -
      ORBIT.ry * Math.sin(a) * Math.sin(rad),
    ORBIT.cy +
      ORBIT.rx * Math.cos(a) * Math.sin(rad) +
      ORBIT.ry * Math.sin(a) * Math.cos(rad),
  ];
}
const DOT = onOrbit(130);
const END_L = [
  ORBIT.cx - ORBIT.rx * Math.cos(rad),
  ORBIT.cy - ORBIT.rx * Math.sin(rad),
];
const END_R = [
  ORBIT.cx + ORBIT.rx * Math.cos(rad),
  ORBIT.cy + ORBIT.rx * Math.sin(rad),
];
/** The half of the orbit in front of the flame (its lower edge). */
const FRONT = `M${END_L[0]} ${END_L[1]}A${ORBIT.rx} ${ORBIT.ry} ${ORBIT.tilt} 0 0 ${END_R[0]} ${END_R[1]}`;
/** The half behind it. */
const BACK = `M${END_R[0]} ${END_R[1]}A${ORBIT.rx} ${ORBIT.ry} ${ORBIT.tilt} 0 0 ${END_L[0]} ${END_L[1]}`;

function Interlocked({
  id,
  dot,
  shape = <path d={HEARTH_FLAME} />,
}: {
  id: string;
  dot?: boolean;
  shape?: React.ReactNode;
}) {
  return (
    <>
      <defs>
        <mask id={id}>
          <rect width="64" height="64" fill="#fff" />
          <path d={FRONT} stroke="#000" strokeWidth={9} fill="none" />
        </mask>
      </defs>
      <path d={BACK} fill="none" stroke="currentColor" strokeWidth={3} />
      <g fill="currentColor" mask={`url(#${id})`}>
        {shape}
      </g>
      <path
        d={FRONT}
        fill="none"
        stroke="currentColor"
        strokeWidth={3.5}
        strokeLinecap="round"
      />
      {dot && <circle cx={DOT[0]} cy={DOT[1]} r={3.6} fill="currentColor" />}
    </>
  );
}

const ANVIL =
  'M7 15c5 0 9 1 13 1h33v7h-8c-2 4-5 6-9 7v5h6v6H21v-6h6v-5c-4-1-7-3-8-6-5-1-9-4-12-9Z';

const FORGE_VARIANTS: { name: string; note: string; svg: React.ReactNode }[] = [
  {
    name: 'A. Orbit + anvil',
    note: 'The 5b orbit around an anvil.',
    svg: (
      <Interlocked
        id="fa"
        dot
        shape={<path d={ANVIL} transform="translate(0 -3)" />}
      />
    ),
  },
  {
    name: 'B. Orbit + hammer',
    note: 'A tilted smithing hammer inside the orbit.',
    svg: (
      <Interlocked
        id="fb"
        dot
        shape={
          <g transform="rotate(-35 32 26)">
            <rect x="17" y="6" width="30" height="11" rx="2.5" />
            <rect x="29" y="17" width="6" height="28" rx="2" />
          </g>
        }
      />
    ),
  },
  {
    name: 'C. Orbit + anvil and spark',
    note: 'The anvil with a spark struck off it.',
    svg: (
      <Interlocked
        id="fc"
        dot
        shape={
          <>
            <path d={ANVIL} transform="translate(0 1)" />
            <path d="M40 0c.8 4.6 2.6 6.4 7 7.2-4.4.8-6.2 2.6-7 7.2-.8-4.6-2.6-6.4-7-7.2 4.4-.8 6.2-2.6 7-7.2Z" />
          </>
        }
      />
    ),
  },
  {
    name: 'D. Orbit + crucible',
    note: 'A crucible of molten metal, with a flame over it.',
    svg: (
      <Interlocked
        id="fd"
        dot
        shape={
          <>
            <path d="M16 20h32l-4 18a6 6 0 0 1-6 4.5H26a6 6 0 0 1-6-4.5Z" />
            <path d="M32 3c3.5 4 6 7 6 10.5a6 6 0 0 1-12 0c0-2.5 1.3-4.3 2.8-5.5.2 2 1.1 3.2 2.3 3.6-.6-3-.2-6 .9-8.6Z" />
          </>
        }
      />
    ),
  },
  {
    name: 'E. Orbit + hammer over anvil',
    note: 'Both, smaller: the hammer raised above the anvil.',
    svg: (
      <Interlocked
        id="fe"
        dot
        shape={
          <>
            <path d={ANVIL} transform="translate(8 10) scale(0.75)" />
            <g transform="translate(16 -4) scale(0.55)">
              <g transform="rotate(-35 32 26)">
                <rect x="17" y="6" width="30" height="11" rx="2.5" />
                <rect x="29" y="17" width="6" height="28" rx="2" />
              </g>
            </g>
          </>
        }
      />
    ),
  },
];

const HEARTH_VARIANTS: { name: string; note: string; svg: React.ReactNode }[] =
  [
    {
      name: '5a. Hearth orbit, interlocked',
      note: 'A full tilted orbit: the back half behind the flame, the front half passing in front of it.',
      svg: <Interlocked id="h5a" />,
    },
    {
      name: '5b. Hearth orbit with an electron',
      note: 'The same orbit, with an electron riding it, like the dots on Electron’s mark.',
      svg: <Interlocked id="h5b" dot />,
    },
    {
      name: '5c. Open orbit, Electron ends',
      note: 'Only the front half, tilted, ending in the open ring Electron’s orbits end in.',
      svg: (
        <>
          <path d={HEARTH_FLAME} fill="currentColor" />
          <path
            d={FRONT}
            fill="none"
            stroke="currentColor"
            strokeWidth={3.5}
            strokeLinecap="round"
          />
          <circle
            cx={END_R[0]}
            cy={END_R[1]}
            r={3.4}
            fill="none"
            stroke="currentColor"
            strokeWidth={3}
          />
        </>
      ),
    },
    {
      name: '5. Hearth arc (original)',
      note: 'For comparison.',
      svg: (
        <>
          <path
            d="M5 38a27 11 0 0 0 54 0"
            fill="none"
            stroke="currentColor"
            strokeWidth={3.5}
            strokeLinecap="round"
          />
          <path
            d="M32 6c7 8 13 14 13 23a13 13 0 0 1-26 0c0-6 3-10 6.5-12.5.4 4.5 2.4 7 5 7.8-1.6-6-.8-12.5 1.5-18.3Z"
            fill="currentColor"
          />
        </>
      ),
    },
  ];

const SKETCHES: { name: string; note: string; svg: React.ReactNode }[] = [
  {
    name: '1. Flame nucleus',
    note: 'Electron orbits, a flame for the nucleus.',
    svg: (
      <>
        {ORBITS}
        <path d={SMALL_FLAME} fill="currentColor" />
      </>
    ),
  },
  {
    name: '2. Orbit as flame',
    note: 'One ring redrawn as a flame outline.',
    svg: (
      <>
        <g fill="none" stroke="currentColor" strokeWidth={3}>
          <ellipse
            cx="32"
            cy="36"
            rx="26"
            ry="9"
            transform="rotate(60 32 36)"
          />
          <ellipse
            cx="32"
            cy="36"
            rx="26"
            ry="9"
            transform="rotate(120 32 36)"
          />
          <path
            d="M32 4c9 10 18 19 18 32a18 18 0 0 1-36 0c0-9 5-14 9.5-18 .5 6 3 9.5 6.5 10.5-2.5-8-1-17 2-24.5Z"
            strokeLinejoin="round"
          />
        </g>
        <circle cx="32" cy="36" r="3.5" fill="currentColor" />
      </>
    ),
  },
  {
    name: '3. Ember trail',
    note: 'The Electron mark with embers rising off it.',
    svg: (
      <>
        <g
          transform="translate(-4 4) scale(0.9)"
          style={{ transformOrigin: '32px 32px' }}
        >
          {ORBITS}
          <circle cx="32" cy="32" r="4" fill="currentColor" />
        </g>
        <circle cx="50" cy="13" r="3" fill="currentColor" />
        <circle cx="56" cy="6.5" r="2.2" fill="currentColor" opacity={0.75} />
        <circle cx="61" cy="2.5" r="1.4" fill="currentColor" opacity={0.5} />
      </>
    ),
  },
  {
    name: '4. Flame-cut F',
    note: 'A bold F with a flame in its negative space.',
    svg: (
      <>
        <defs>
          <mask id="fcut">
            <rect width="64" height="64" fill="#fff" />
            <path
              d="M22 58c-5-4-7-8-7-13 0-5 3-8 5-10 0 4 2 6 4 7-1-5 0-10 3-14 3 5 6 9 6 14 0 7-4 12-11 16Z"
              fill="#000"
              transform="translate(-1 -2)"
            />
          </mask>
        </defs>
        <path
          d="M12 6h40v12H26v10h22v12H26v18H12Z"
          fill="currentColor"
          mask="url(#fcut)"
        />
      </>
    ),
  },
  {
    name: '5. Hearth arc',
    note: 'A flame resting in a half-orbit, like a hearth.',
    svg: (
      <>
        <path
          d="M5 38a27 11 0 0 0 54 0"
          fill="none"
          stroke="currentColor"
          strokeWidth={3.5}
          strokeLinecap="round"
        />
        <path
          d="M32 6c7 8 13 14 13 23a13 13 0 0 1-26 0c0-6 3-10 6.5-12.5.4 4.5 2.4 7 5 7.8-1.6-6-.8-12.5 1.5-18.3Z"
          fill="currentColor"
        />
      </>
    ),
  },
  {
    name: '6. Orbits that make a flame',
    note: 'Tilted ellipses whose outer edges form a flame.',
    svg: (
      <g fill="none" stroke="currentColor" strokeWidth={3}>
        <ellipse
          cx="27"
          cy="34"
          rx="11"
          ry="25"
          transform="rotate(-18 32 56)"
        />
        <ellipse cx="37" cy="34" rx="11" ry="25" transform="rotate(18 32 56)" />
        <ellipse cx="32" cy="40" rx="8" ry="17" />
        <circle cx="32" cy="52" r="3.5" fill="currentColor" stroke="none" />
      </g>
    ),
  },
  {
    name: '7. Single spark',
    note: 'A four-point glint off a strike.',
    svg: (
      <path
        d="M32 4c2 17 9 25 28 28-19 3-26 11-28 28-2-17-9-25-28-28 19-3 26-11 28-28Z"
        fill="currentColor"
      />
    ),
  },
  {
    name: '8. Chevron flare',
    note: 'A build chevron whose tip catches fire.',
    svg: (
      <>
        <path
          d="M10 12 30 32 10 52"
          fill="none"
          stroke="currentColor"
          strokeWidth={7}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M34 32c4-1 7-5 7-11 7 5 13 12 13 20a11 11 0 0 1-20 6c3 0 5-1 6-3-3 0-5-1-6-3 3 0 5-2 6-4-2 0-4-1-6-5Z"
          fill="currentColor"
        />
      </>
    ),
  },
];

function Mark({ svg, size }: { svg: React.ReactNode; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      {svg}
    </svg>
  );
}

const TIP_VARIANTS: { name: string; note: string; svg: React.ReactNode }[] = [
  {
    name: 'Tip 5: lean',
    note: 'The tip leans right with the orbit’s rise, with a taller left lick.',
    svg: (
      <Interlocked
        id="tip5"
        dot
        shape={
          <path d="M41 3C40 11 47 18 47 29C47 37.5 40.5 44 32 44C23.5 44 17 37.5 17 29.5C17 23.5 19.5 19 23 15.5C23 20 24.5 23 27 24.5C26 15.5 32 8 41 3Z" />
        }
      />
    ),
  },
  {
    name: 'Tip 1: flick',
    note: 'The tip curls back to the right, like a flame caught in a draught.',
    svg: (
      <Interlocked
        id="tip0"
        dot
        shape={
          <path
            d="M40 3c-3 2-4.2 5.6-3 10C40.5 18 45 22.5 45 30a13 13 0 0 1-26 0c0-6 3-10 6.5-12.5.4 4.5 2.4 7 5 7.8C29 17.5 31.5 7.5 40 3Z"
            fillRule="evenodd"
          />
        }
      />
    ),
  },
  {
    name: 'Tip 2: forked',
    note: 'A second, shorter tongue to the right of the main tip.',
    svg: (
      <Interlocked
        id="tip1"
        dot
        shape={
          <path
            d="M31 3.5C32.5 9 35 12 37.6 15.2 38.6 13 39.6 11.3 41.2 9.4 44 15 45 21.5 45 30a13 13 0 0 1-26 0c0-6 3-10 6.5-12.5.4 4.5 2.4 7 5 7.8C29 18.5 28.5 10.5 31 3.5Z"
            fillRule="evenodd"
          />
        }
      />
    ),
  },
  {
    name: 'Tip 3: S-curve',
    note: 'The tip leans left and sweeps back, with a sharper apex.',
    svg: (
      <Interlocked
        id="tip2"
        dot
        shape={
          <path
            d="M27.5 3.5C29 9 32.5 12 36.5 15.4 41.6 19.6 45 24 45 30a13 13 0 0 1-26 0c0-6 3-10 6.5-12.5.4 4.5 2.4 7 5 7.8C31 18 25.5 11 27.5 3.5Z"
            fillRule="evenodd"
          />
        }
      />
    ),
  },
  {
    name: 'Tip 4: spark',
    note: 'The original tip, with a spark breaking off it.',
    svg: (
      <Interlocked
        id="tip3"
        dot
        shape={
          <path
            d="M32 7c7 8 13 14 13 23a13 13 0 0 1-26 0c0-6 3-10 6.5-12.5.4 4.5 2.4 7 5 7.8-1.6-6-.8-12.5 1.5-18.3Z M42 4.5a2 2 0 1 0 .01 0Z"
            fillRule="evenodd"
          />
        }
      />
    ),
  },
];

const ILLUSTRATOR = [
  [
    'A',
    'Illustrator A: lean, inner tongue',
    'Two outer tongues; a negative inner tongue opens into the orbit’s gap.',
  ],
  [
    'B',
    'Illustrator B: hooked tip (recommended)',
    'One tongue whose tip flicks right with the orbit, and an inner tongue.',
  ],
  [
    'C',
    'Illustrator C: hooked tip, left tongue',
    'B’s hooked tip with a small left tongue and no hole. Strongest small.',
  ],
] as const;

function Svg({ id, size }: { id: string; size: number }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        lineHeight: 0,
      }}
      dangerouslySetInnerHTML={{
        __html: ILLUSTRATOR_SVGS[id].replaceAll('SIZE', String(size)),
      }}
    />
  );
}

function IllustratorCard({
  id,
  name,
  note,
}: {
  id: string;
  name: string;
  note: string;
}) {
  return (
    <section
      style={{
        display: 'grid',
        gap: 12,
        padding: 20,
        borderRadius: 16,
        background: 'var(--lu-surface-raised)',
        boxShadow: 'var(--lu-shadow-lift)',
      }}
    >
      <div
        style={{
          color: 'var(--lu-accent)',
          display: 'flex',
          alignItems: 'end',
          gap: 12,
        }}
      >
        <Svg id={id} size={96} />
        <Svg id={id} size={32} />
        <Svg id={`${id}-16`} size={16} />
        <span
          style={{
            display: 'grid',
            placeItems: 'center',
            width: 40,
            height: 40,
            borderRadius: 10,
            background: 'var(--lu-action)',
            color: 'var(--lu-on-action)',
          }}
        >
          <Svg id={id} size={26} />
        </span>
      </div>
      <strong>{name}</strong>
      <span style={{ color: 'var(--lu-ink-muted)', fontSize: 14 }}>{note}</span>
    </section>
  );
}

export default function LogoSketches(): React.ReactElement {
  return (
    <Layout title="Logo sketches" noFooter>
      <main
        style={{
          width: 'min(1120px, 100% - 48px)',
          margin: '48px auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 16,
        }}
      >
        {[
          HEARTH_VARIANTS[1],
          ...TIP_VARIANTS,
          ...FORGE_VARIANTS,
          ...SKETCHES,
        ].map(({ name, note, svg }) => (
          <section
            key={name}
            style={{
              display: 'grid',
              gap: 12,
              padding: 20,
              borderRadius: 16,
              background: 'var(--lu-surface-raised)',
              boxShadow: 'var(--lu-shadow-lift)',
            }}
          >
            <div
              style={{
                color: 'var(--lu-accent)',
                display: 'flex',
                alignItems: 'end',
                gap: 12,
              }}
            >
              <Mark svg={svg} size={96} />
              <Mark svg={svg} size={32} />
              <Mark svg={svg} size={16} />
              <span
                style={{
                  display: 'grid',
                  placeItems: 'center',
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: 'var(--lu-action)',
                  color: 'var(--lu-on-action)',
                }}
              >
                <Mark svg={svg} size={26} />
              </span>
            </div>
            <strong>{name}</strong>
            <span style={{ color: 'var(--lu-ink-muted)', fontSize: 14 }}>
              {note}
            </span>
          </section>
        ))}
        {ILLUSTRATOR.map(([id, name, note]) => (
          <IllustratorCard key={id} id={id} name={name} note={note} />
        ))}
      </main>
    </Layout>
  );
}
