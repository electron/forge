import Layout from '@theme/Layout';

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
        {SKETCHES.map(({ name, note, svg }) => (
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
      </main>
    </Layout>
  );
}
