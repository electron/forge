import { useEffect, useLayoutEffect, useState } from 'react';

import styles from './Terminal.module.css';

/** The command the copy button copies, and the first one the terminal types. */
export const CREATE_COMMAND = 'npx create-electron-app@latest my-app';

type Line =
  | { kind: 'command'; text: string }
  | { kind: 'task'; depth: 0 | 1; parts: (string | [string, Tone])[] }
  | { kind: 'note'; parts: (string | [string, Tone])[] };

type Tone = 'yellow' | 'magenta' | 'cyan' | 'green';

/**
 * What a first run prints, using Forge's own task titles (packages/api/core
 * and create-electron-app), trimmed to fit.
 */
const SCRIPT: Line[] = [
  { kind: 'command', text: CREATE_COMMAND },
  { kind: 'task', depth: 0, parts: ['Initializing directory'] },
  { kind: 'task', depth: 0, parts: ['Preparing template'] },
  { kind: 'task', depth: 0, parts: ['Installing template dependencies'] },
  { kind: 'command', text: 'cd my-app && npm run make' },
  { kind: 'task', depth: 0, parts: ['Loading configuration'] },
  {
    kind: 'task',
    depth: 0,
    parts: ['Running ', ['package', 'yellow'], ' command'],
  },
  { kind: 'task', depth: 1, parts: ['Packaging application'] },
  { kind: 'task', depth: 0, parts: ['Making distributables'] },
  {
    kind: 'task',
    depth: 1,
    parts: [
      'Making a ',
      ['dmg', 'magenta'],
      ' distributable for ',
      ['darwin/arm64', 'cyan'],
    ],
  },
  {
    kind: 'task',
    depth: 1,
    parts: [
      'Making a ',
      ['zip', 'magenta'],
      ' distributable for ',
      ['darwin/arm64', 'cyan'],
    ],
  },
  { kind: 'note', parts: ['Artifacts available at: ', ['out/make', 'green']] },
];

const TYPE_MS = 38;
const LINE_MS = 260;
const COMMAND_PAUSE_MS = 500;
const LOOP_PAUSE_MS = 7000;

function Parts({ parts }: { parts: (string | [string, Tone])[] }) {
  return (
    <>
      {parts.map((part, i) =>
        typeof part === 'string' ? (
          part
        ) : (
          <span key={i} className={styles[part[1]]}>
            {part[0]}
          </span>
        ),
      )}
    </>
  );
}

// useLayoutEffect warns during server rendering; the effect only runs in the browser.
const useIsomorphicLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect;

/**
 * A terminal window that types out a first Forge run: create an app, then make
 * it. Server-rendered and reduced-motion views show the finished run.
 */
export default function Terminal(): React.ReactElement {
  // How many lines are shown, and how many characters of the last command.
  const [shown, setShown] = useState(SCRIPT.length);
  const [typed, setTyped] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  useIsomorphicLayoutEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let timer: ReturnType<typeof setTimeout>;
    let line = 0;
    let char = 0;
    const step = () => {
      if (line >= SCRIPT.length) {
        timer = setTimeout(() => {
          line = 0;
          char = 0;
          setShown(0);
          setTyped(null);
          timer = setTimeout(step, 400);
        }, LOOP_PAUSE_MS);
        return;
      }
      const current = SCRIPT[line];
      if (current.kind === 'command' && char < current.text.length) {
        char += 1;
        setShown(line + 1);
        setTyped(char);
        timer = setTimeout(
          step,
          char === current.text.length ? COMMAND_PAUSE_MS : TYPE_MS,
        );
        return;
      }
      line += 1;
      char = 0;
      setShown(line + (SCRIPT[line]?.kind === 'command' ? 0 : 1));
      setTyped(null);
      timer = setTimeout(step, LINE_MS);
    };
    setShown(0);
    setTyped(null);
    timer = setTimeout(step, 600);
    return () => clearTimeout(timer);
  }, []);

  const lines = SCRIPT.slice(0, shown);
  const cursorOnCommand = typed !== null;

  return (
    <div className={styles.window}>
      <div className={styles.bar}>
        <span className={styles.lights} aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className={styles.title}>my-app — zsh</span>
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
          {copied ? 'Copied' : 'Copy command'}
        </button>
      </div>
      <pre className={styles.screen} aria-label={`Terminal: ${CREATE_COMMAND}`}>
        {lines.map((line, i) => {
          const last = i === lines.length - 1;
          if (line.kind === 'command') {
            const text =
              last && cursorOnCommand
                ? line.text.slice(0, typed ?? 0)
                : line.text;
            return (
              <div key={i}>
                <span className={styles.prompt}>$ </span>
                {text}
                {last && cursorOnCommand && <span className={styles.cursor} />}
              </div>
            );
          }
          if (line.kind === 'note') {
            return (
              <div key={i} className={styles.note}>
                <span className={styles.mark}>› </span>
                <Parts parts={line.parts} />
              </div>
            );
          }
          return (
            <div key={i} className={line.depth ? styles.sub : undefined}>
              <span className={styles.ok}>✔ </span>
              <Parts parts={line.parts} />
            </div>
          );
        })}
        {!cursorOnCommand && shown >= SCRIPT.length && (
          <div>
            <span className={styles.prompt}>$ </span>
            <span className={styles.cursor} />
          </div>
        )}
      </pre>
    </div>
  );
}
